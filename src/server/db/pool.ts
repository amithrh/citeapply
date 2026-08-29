import { Pool, type PoolConfig } from "pg";

const POOL_MAX_CONNECTIONS = 2;
const POOL_ACQUIRE_TIMEOUT_MS = 2_000;
const POOL_IDLE_TIMEOUT_MS = 10_000;
const POOL_MAX_LIFETIME_SECONDS = 300;

export type SafePoolError = Readonly<{
  code: string | null;
}>;

export type PoolFactoryOptions = Readonly<{
  connectionString?: string;
  onIdleError?: (error: SafePoolError) => void;
}>;

type ErrorWithCode = Readonly<{ code?: unknown }>;

function safeErrorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as ErrorWithCode).code;
    if (typeof code !== "string") {
      return null;
    }
    return /^[A-Z0-9_]{1,16}$/.test(code) ? code : null;
  }

  return null;
}

function requireDatabaseUrl(value: string | undefined): string {
  if (value === undefined || value.length === 0 || value.length > 2_048) {
    throw new Error("DATABASE_URL is required.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL is invalid.");
  }

  if (
    (url.protocol !== "postgres:" && url.protocol !== "postgresql:") ||
    url.hostname.length === 0 ||
    url.username.length === 0 ||
    url.pathname.length <= 1 ||
    url.hash.length !== 0
  ) {
    throw new Error("DATABASE_URL is invalid.");
  }

  return value;
}

export function createDatabasePool(options: PoolFactoryOptions = {}): Pool {
  const connectionString = requireDatabaseUrl(
    options.connectionString ?? process.env["DATABASE_URL"],
  );
  const config: PoolConfig = {
    connectionString,
    max: POOL_MAX_CONNECTIONS,
    connectionTimeoutMillis: POOL_ACQUIRE_TIMEOUT_MS,
    idleTimeoutMillis: POOL_IDLE_TIMEOUT_MS,
    maxLifetimeSeconds: POOL_MAX_LIFETIME_SECONDS,
    allowExitOnIdle: true,
    application_name: "citeapply",
  };
  const pool = new Pool(config);

  pool.on("error", (error) => {
    options.onIdleError?.({ code: safeErrorCode(error) });
  });

  return pool;
}

type GlobalPoolState = typeof globalThis & {
  __citeapplyDatabasePool?: Pool;
};

export function getDatabasePool(options: PoolFactoryOptions = {}): Pool {
  const state = globalThis as GlobalPoolState;

  if (state.__citeapplyDatabasePool === undefined) {
    state.__citeapplyDatabasePool = createDatabasePool(options);
  }

  return state.__citeapplyDatabasePool;
}

export async function closeDatabasePool(): Promise<void> {
  const state = globalThis as GlobalPoolState;
  const pool = state.__citeapplyDatabasePool;

  if (pool !== undefined) {
    delete state.__citeapplyDatabasePool;
    await pool.end();
  }
}
