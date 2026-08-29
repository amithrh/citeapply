import type { Pool, PoolClient, QueryResultRow } from "pg";

import {
  DatabaseInvariantError,
  requireSingleRow,
  withReadCommittedTransaction,
} from "./transactions.ts";

const MAX_RATE_ROWS = 256;
const MAX_PRUNE_PER_PREFLIGHT = 3;

export const RATE_BUCKETS = [
  "demo_get",
  "demo_start",
  "application",
  "actions",
  "webmcp",
  "submission",
  "receipt",
] as const;

export type RateBucket = (typeof RATE_BUCKETS)[number];

type CounterPolicy = Readonly<{
  limit: number;
  windowSeconds: number;
}>;

const POLICIES: Readonly<Record<RateBucket | "all_api", CounterPolicy>> = {
  demo_get: { limit: 60, windowSeconds: 60 },
  demo_start: { limit: 6, windowSeconds: 600 },
  application: { limit: 120, windowSeconds: 60 },
  actions: { limit: 120, windowSeconds: 60 },
  webmcp: { limit: 60, windowSeconds: 60 },
  submission: { limit: 30, windowSeconds: 60 },
  receipt: { limit: 60, windowSeconds: 60 },
  all_api: { limit: 600, windowSeconds: 60 },
};

type CounterKey = keyof typeof POLICIES;

type RateCounterRow = QueryResultRow & {
  bucket_key: CounterKey;
  window_start: Date | string;
  request_count: number;
  expires_at: Date | string;
};

export type RatePreflightResult =
  | Readonly<{ admitted: true }>
  | Readonly<{ admitted: false; retryAfterSeconds: number; reason: "limit" | "capacity" | "busy" }>;

function databaseDate(value: Date | string, label: string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new DatabaseInvariantError(`${label} is not a valid timestamp.`);
  }
  return date;
}

function windowFor(now: Date, key: CounterKey): Readonly<{ start: Date; end: Date }> {
  const windowMilliseconds = POLICIES[key].windowSeconds * 1_000;
  const startMilliseconds =
    Math.floor(now.getTime() / windowMilliseconds) * windowMilliseconds;
  return {
    start: new Date(startMilliseconds),
    end: new Date(startMilliseconds + windowMilliseconds),
  };
}

function retrySeconds(now: Date, until: Date): number {
  return Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 1_000));
}

function requiredKeys(route: RateBucket): readonly CounterKey[] {
  return route === "demo_get" || route === "demo_start"
    ? [route]
    : ["all_api", route];
}

async function lockCapacityMutex(client: PoolClient): Promise<void> {
  const result = await client.query<{ bucket_key: string }>(
    `SELECT bucket_key
       FROM rate_buckets
      WHERE family = 'sentinel'
        AND bucket_key = 'rate_capacity_mutex'
        AND window_start = 'epoch'::timestamptz
      FOR UPDATE`,
  );
  const row = requireSingleRow(
    result.rows,
    "The rate-capacity sentinel is missing or duplicated.",
  );
  if (row.bucket_key !== "rate_capacity_mutex") {
    throw new DatabaseInvariantError("The rate-capacity sentinel is invalid.");
  }
}

async function readSingleClock(client: PoolClient): Promise<Date> {
  const result = await client.query<{ server_now: Date | string }>(
    "SELECT clock_timestamp() AS server_now",
  );
  const row = requireSingleRow(result.rows, "The rate preflight clock is unavailable.");
  return databaseDate(row.server_now, "server_now");
}

async function pruneExpired(client: PoolClient, now: Date): Promise<void> {
  const result = await client.query(
    `WITH expired AS (
       SELECT family, bucket_key, window_start
         FROM rate_buckets
        WHERE family = 'counter'
          AND expires_at <= $1
        ORDER BY expires_at, bucket_key, window_start
        FOR UPDATE SKIP LOCKED
        LIMIT 3
     )
     DELETE FROM rate_buckets AS bucket
      USING expired
      WHERE bucket.family = expired.family
        AND bucket.bucket_key = expired.bucket_key
        AND bucket.window_start = expired.window_start`,
    [now],
  );

  if (result.rowCount !== null && result.rowCount > MAX_PRUNE_PER_PREFLIGHT) {
    throw new DatabaseInvariantError("Rate pruning exceeded its fixed bound.");
  }
}

async function readCounter(
  client: PoolClient,
  key: CounterKey,
  start: Date,
  lock: boolean,
): Promise<RateCounterRow | null> {
  const result = await client.query<RateCounterRow>(
    `SELECT bucket_key, window_start, request_count, expires_at
       FROM rate_buckets
      WHERE family = 'counter'
        AND bucket_key = $1
        AND window_start = $2
      ${lock ? "FOR UPDATE" : ""}`,
    [key, start],
  );

  if (result.rows.length > 1) {
    throw new DatabaseInvariantError("A fixed-window counter is duplicated.");
  }

  return result.rows[0] ?? null;
}

async function capacityRetryAfter(client: PoolClient, now: Date): Promise<number> {
  const result = await client.query<{
    has_expired_backlog: boolean;
    earliest_future_expiry: Date | string | null;
  }>(
    `SELECT
       coalesce(bool_or(expires_at <= $1) FILTER (WHERE family = 'counter'), false)
         AS has_expired_backlog,
       min(expires_at) FILTER (WHERE family = 'counter' AND expires_at > $1)
         AS earliest_future_expiry
       FROM rate_buckets`,
    [now],
  );
  const row = requireSingleRow(result.rows, "Rate capacity could not be projected.");

  if (row.has_expired_backlog || row.earliest_future_expiry === null) {
    return 1;
  }

  return retrySeconds(
    now,
    databaseDate(row.earliest_future_expiry, "earliest_future_expiry"),
  );
}

async function executePreflight(
  client: PoolClient,
  route: RateBucket,
): Promise<RatePreflightResult> {
  await lockCapacityMutex(client);
  const now = await readSingleClock(client);
  await pruneExpired(client, now);

  const keys = requiredKeys(route);
  const windows = new Map<CounterKey, Readonly<{ start: Date; end: Date }>>();
  const existing = new Map<CounterKey, RateCounterRow>();

  for (const key of keys) {
    const window = windowFor(now, key);
    windows.set(key, window);
    const counter = await readCounter(client, key, window.start, false);
    if (counter !== null) {
      existing.set(key, counter);
    }
  }

  const physicalCountResult = await client.query<{ physical_count: number }>(
    "SELECT count(*)::integer AS physical_count FROM rate_buckets",
  );
  const physicalCount = requireSingleRow(
    physicalCountResult.rows,
    "PostgreSQL did not return the rate-row count.",
  ).physical_count;

  if (!Number.isSafeInteger(physicalCount) || physicalCount < 2) {
    throw new DatabaseInvariantError("The rate-row count is invalid.");
  }

  const missingCount = keys.length - existing.size;
  if (physicalCount + missingCount > MAX_RATE_ROWS) {
    return {
      admitted: false,
      retryAfterSeconds: await capacityRetryAfter(client, now),
      reason: "capacity",
    };
  }

  const locked = new Map<CounterKey, RateCounterRow>();
  for (const key of keys) {
    const window = windows.get(key);
    if (window === undefined) {
      throw new DatabaseInvariantError("A required rate window is missing.");
    }
    const counter = await readCounter(client, key, window.start, true);
    if (counter !== null) {
      locked.set(key, counter);
    }
  }

  const limitingExpiries: Date[] = [];
  for (const [key, counter] of locked) {
    if (!Number.isSafeInteger(counter.request_count) || counter.request_count < 0) {
      throw new DatabaseInvariantError("A rate counter is invalid.");
    }
    if (counter.request_count >= POLICIES[key].limit) {
      limitingExpiries.push(databaseDate(counter.expires_at, "counter expiry"));
    }
  }

  if (limitingExpiries.length > 0) {
    const earliest = limitingExpiries.reduce((left, right) =>
      left.getTime() <= right.getTime() ? left : right,
    );
    return {
      admitted: false,
      retryAfterSeconds: retrySeconds(now, earliest),
      reason: "limit",
    };
  }

  for (const key of keys) {
    if (!locked.has(key)) {
      const window = windows.get(key);
      if (window === undefined) {
        throw new DatabaseInvariantError("A required rate window is missing.");
      }
      await client.query(
        `INSERT INTO rate_buckets (
           family, bucket_key, window_start, request_count, expires_at
         ) VALUES ('counter', $1, $2, 0, $3)`,
        [key, window.start, window.end],
      );
    }
  }

  for (const key of keys) {
    const window = windows.get(key);
    if (window === undefined) {
      throw new DatabaseInvariantError("A required rate window is missing.");
    }
    const update = await client.query(
      `UPDATE rate_buckets
          SET request_count = request_count + 1
        WHERE family = 'counter'
          AND bucket_key = $1
          AND window_start = $2`,
      [key, window.start],
    );
    if (update.rowCount !== 1) {
      throw new DatabaseInvariantError("A required rate counter was not incremented.");
    }
  }

  return { admitted: true };
}

type PostgreSqlError = Readonly<{ code?: unknown }>;

function isLockTimeout(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as PostgreSqlError).code === "55P03"
  );
}

export async function runRatePreflight(
  pool: Pool,
  route: RateBucket,
): Promise<RatePreflightResult> {
  if (!(RATE_BUCKETS as readonly string[]).includes(route)) {
    throw new DatabaseInvariantError("The rate route is invalid.");
  }

  try {
    return await withReadCommittedTransaction(pool, (client) =>
      executePreflight(client, route),
    );
  } catch (error) {
    if (isLockTimeout(error)) {
      return { admitted: false, retryAfterSeconds: 1, reason: "busy" };
    }
    throw error;
  }
}
