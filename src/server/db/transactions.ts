import type { Pool, PoolClient, QueryResultRow } from "pg";

const DEFAULT_LOCK_TIMEOUT_MS = 1_000;
const DEFAULT_STATEMENT_TIMEOUT_MS = 3_000;
const DEFAULT_IDLE_TRANSACTION_TIMEOUT_MS = 3_000;

export type TransactionOptions = Readonly<{
  lockTimeoutMs?: number;
  statementTimeoutMs?: number;
  idleTransactionTimeoutMs?: number;
}>;

export class DatabaseInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseInvariantError";
  }
}

function boundedTimeout(value: number | undefined, fallback: number): number {
  const selected = value ?? fallback;

  if (!Number.isSafeInteger(selected) || selected < 1 || selected > 30_000) {
    throw new DatabaseInvariantError("Database timeout configuration is invalid.");
  }

  return selected;
}

async function configureTransaction(
  client: PoolClient,
  options: TransactionOptions,
): Promise<void> {
  const lockTimeout = boundedTimeout(options.lockTimeoutMs, DEFAULT_LOCK_TIMEOUT_MS);
  const statementTimeout = boundedTimeout(
    options.statementTimeoutMs,
    DEFAULT_STATEMENT_TIMEOUT_MS,
  );
  const idleTimeout = boundedTimeout(
    options.idleTransactionTimeoutMs,
    DEFAULT_IDLE_TRANSACTION_TIMEOUT_MS,
  );

  await client.query(
    `SELECT
       set_config('lock_timeout', $1, true),
       set_config('statement_timeout', $2, true),
       set_config('idle_in_transaction_session_timeout', $3, true)`,
    [`${lockTimeout}ms`, `${statementTimeout}ms`, `${idleTimeout}ms`],
  );
}

export async function withReadCommittedTransaction<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN ISOLATION LEVEL READ COMMITTED");
    transactionStarted = true;
    await configureTransaction(client, options);

    const result = await work(client);
    await client.query("COMMIT");
    transactionStarted = false;
    return result;
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          "The database transaction and its rollback both failed.",
        );
      }
    }

    throw error;
  } finally {
    client.release();
  }
}

export function requireSingleRow<T extends QueryResultRow>(
  rows: readonly T[],
  invariant: string,
): T {
  if (rows.length !== 1) {
    throw new DatabaseInvariantError(invariant);
  }

  return rows[0]!;
}

function normalizeDatabaseDate(value: unknown): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(String(value));

  if (!Number.isFinite(date.getTime())) {
    throw new DatabaseInvariantError("PostgreSQL returned an invalid clock value.");
  }

  return date;
}

export async function readDatabaseClock(client: PoolClient): Promise<Date> {
  const result = await client.query<{ server_now: Date | string }>(
    "SELECT clock_timestamp() AS server_now",
  );
  const row = requireSingleRow(result.rows, "PostgreSQL did not return one clock row.");
  return normalizeDatabaseDate(row.server_now);
}
