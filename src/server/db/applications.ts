import type { PoolClient, QueryResultRow } from "pg";

import { DatabaseInvariantError, requireSingleRow } from "./transactions.ts";

const SHA256_BYTES = 32;
const MAX_APPLICATIONS = 512;
const PARSED_PACKET_MAX_BYTES = 32 * 1_024;
const DRAFT_MAX_BYTES = 24 * 1_024;
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PacketCode = "supported" | "conflict";
export type ApplicationStage = "draft" | "review" | "submitted";

export type StoredApplication = Readonly<{
  id: string;
  startNonceHash: Buffer;
  startRequestId: string;
  startRequestDigest: Buffer;
  sessionDigest: Buffer;
  createdAt: Date;
  expiresAt: Date;
  packetCode: PacketCode;
  parsedPacket: unknown;
  draft: unknown;
  stage: ApplicationStage;
  revision: number;
  requirementsVersion: number;
  pageEpoch: number;
  pageBootstrapRequestId: string | null;
  pageBootstrapRequestDigest: Buffer | null;
  consentRequestId: string | null;
  currentReviewId: string | null;
  updatedAt: Date;
}>;

type ApplicationQueryRow = QueryResultRow & {
  id: string;
  start_nonce_hash: Buffer;
  start_request_id: string;
  start_request_digest: Buffer;
  session_digest: Buffer;
  created_at: Date | string;
  expires_at: Date | string;
  packet_code: PacketCode;
  parsed_packet: unknown;
  draft: unknown;
  stage: ApplicationStage;
  revision: string | number;
  requirements_version: string | number;
  page_epoch: string | number;
  page_bootstrap_request_id: string | null;
  page_bootstrap_request_digest: Buffer | null;
  consent_request_id: string | null;
  current_review_id: string | null;
  updated_at: Date | string;
};

const APPLICATION_COLUMNS = `
  id,
  start_nonce_hash,
  start_request_id,
  start_request_digest,
  session_digest,
  created_at,
  expires_at,
  packet_code,
  parsed_packet,
  draft,
  stage,
  revision,
  requirements_version,
  page_epoch,
  page_bootstrap_request_id,
  page_bootstrap_request_digest,
  consent_request_id,
  current_review_id,
  updated_at
`;

function requireUuidV4(value: string, label: string): void {
  if (!UUID_V4.test(value)) {
    throw new DatabaseInvariantError(`${label} must be a UUID v4.`);
  }
}

function requireDigest(value: Uint8Array, label: string): Buffer {
  if (value.byteLength !== SHA256_BYTES) {
    throw new DatabaseInvariantError(`${label} must be a 32-byte digest.`);
  }

  return Buffer.from(value);
}

function requireJsonObject(
  value: unknown,
  maximumBytes: number,
  label: string,
): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DatabaseInvariantError(`${label} must be a JSON object.`);
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new DatabaseInvariantError(`${label} is not serializable JSON.`);
  }

  if (
    typeof serialized !== "string" ||
    Buffer.byteLength(serialized, "utf8") > maximumBytes
  ) {
    throw new DatabaseInvariantError(`${label} exceeds its byte limit.`);
  }
}

function databaseDate(value: Date | string, label: string): Date {
  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (!Number.isFinite(date.getTime())) {
    throw new DatabaseInvariantError(
      `${label} is not a valid database timestamp.`,
    );
  }

  return date;
}

function safeInteger(
  value: string | number,
  minimum: number,
  label: string,
): number {
  const converted = typeof value === "number" ? value : Number(value);

  if (!Number.isSafeInteger(converted) || converted < minimum) {
    throw new DatabaseInvariantError(
      `${label} is outside the supported integer range.`,
    );
  }

  return converted;
}

function mapApplication(row: ApplicationQueryRow): StoredApplication {
  return {
    id: row.id,
    startNonceHash: Buffer.from(row.start_nonce_hash),
    startRequestId: row.start_request_id,
    startRequestDigest: Buffer.from(row.start_request_digest),
    sessionDigest: Buffer.from(row.session_digest),
    createdAt: databaseDate(row.created_at, "created_at"),
    expiresAt: databaseDate(row.expires_at, "expires_at"),
    packetCode: row.packet_code,
    parsedPacket: row.parsed_packet,
    draft: row.draft,
    stage: row.stage,
    revision: safeInteger(row.revision, 0, "revision"),
    requirementsVersion: safeInteger(
      row.requirements_version,
      1,
      "requirements_version",
    ),
    pageEpoch: safeInteger(row.page_epoch, 0, "page_epoch"),
    pageBootstrapRequestId: row.page_bootstrap_request_id,
    pageBootstrapRequestDigest:
      row.page_bootstrap_request_digest === null
        ? null
        : Buffer.from(row.page_bootstrap_request_digest),
    consentRequestId: row.consent_request_id,
    currentReviewId: row.current_review_id,
    updatedAt: databaseDate(row.updated_at, "updated_at"),
  };
}

const startParserLeaseBrand: unique symbol = Symbol(
  "citeapply-start-parser-lease",
);

export type StartParserLease = Readonly<{
  client: PoolClient;
  [startParserLeaseBrand]: true;
}>;

function assertLease(client: PoolClient, lease: StartParserLease): void {
  if (lease.client !== client || lease[startParserLeaseBrand] !== true) {
    throw new DatabaseInvariantError(
      "The Start parser mutex is not held by this client.",
    );
  }
}

export async function acquireStartParserLease(
  client: PoolClient,
): Promise<StartParserLease> {
  const result = await client.query<{ bucket_key: string }>(
    `SELECT bucket_key
       FROM rate_buckets
      WHERE family = 'sentinel'
        AND bucket_key = 'start_parser_mutex'
        AND window_start = 'epoch'::timestamptz
      FOR UPDATE`,
  );
  const row = requireSingleRow(
    result.rows,
    "The Start parser sentinel is missing or duplicated.",
  );

  if (row.bucket_key !== "start_parser_mutex") {
    throw new DatabaseInvariantError("The Start parser sentinel is invalid.");
  }

  return { client, [startParserLeaseBrand]: true };
}

export async function findStartCoordinateMatches(
  client: PoolClient,
  lease: StartParserLease,
  startNonceHash: Uint8Array,
  startRequestId: string,
): Promise<readonly StoredApplication[]> {
  assertLease(client, lease);
  const nonceDigest = requireDigest(startNonceHash, "startNonceHash");
  requireUuidV4(startRequestId, "startRequestId");

  const result = await client.query<ApplicationQueryRow>(
    `SELECT ${APPLICATION_COLUMNS}
       FROM applications
      WHERE start_nonce_hash = $1
         OR start_request_id = $2
      ORDER BY id
      FOR UPDATE`,
    [nonceDigest, startRequestId],
  );

  if (result.rows.length > 2) {
    throw new DatabaseInvariantError(
      "Start coordinates matched too many applications.",
    );
  }

  return result.rows.map(mapApplication);
}

export async function cleanupOneExpiredApplication(
  client: PoolClient,
  lease: StartParserLease,
): Promise<boolean> {
  assertLease(client, lease);
  const result = await client.query<{ id: string }>(
    `WITH expired_candidate AS (
       SELECT id
         FROM applications
        WHERE expires_at <= clock_timestamp()
        ORDER BY expires_at, created_at, id
        FOR UPDATE SKIP LOCKED
        LIMIT 1
     )
     DELETE FROM applications AS application
      USING expired_candidate
      WHERE application.id = expired_candidate.id
      RETURNING application.id`,
  );

  if (result.rows.length > 1) {
    throw new DatabaseInvariantError(
      "Expired cleanup deleted more than one application.",
    );
  }

  return result.rows.length === 1;
}

export type StartCapacity = Readonly<{
  admitted: boolean;
  deletedExpiredApplication: boolean;
}>;

export async function prepareNewApplicationStart(
  client: PoolClient,
  lease: StartParserLease,
): Promise<StartCapacity> {
  assertLease(client, lease);
  const deletedExpiredApplication = await cleanupOneExpiredApplication(
    client,
    lease,
  );
  const countResult = await client.query<{ application_count: number }>(
    "SELECT count(*)::integer AS application_count FROM applications",
  );
  const row = requireSingleRow(
    countResult.rows,
    "PostgreSQL did not return the application count.",
  );

  if (
    !Number.isSafeInteger(row.application_count) ||
    row.application_count < 0
  ) {
    throw new DatabaseInvariantError("The application count is invalid.");
  }

  return {
    admitted: row.application_count < MAX_APPLICATIONS,
    deletedExpiredApplication,
  };
}

export type NewApplication = Readonly<{
  id: string;
  startNonceHash: Uint8Array;
  startRequestId: string;
  startRequestDigest: Uint8Array;
  sessionDigest: Uint8Array;
  packetCode: PacketCode;
  parsedPacket: unknown;
  draft: unknown;
}>;

export async function insertApplication(
  client: PoolClient,
  lease: StartParserLease,
  input: NewApplication,
): Promise<StoredApplication> {
  assertLease(client, lease);
  requireUuidV4(input.id, "id");
  requireUuidV4(input.startRequestId, "startRequestId");
  const startNonceHash = requireDigest(input.startNonceHash, "startNonceHash");
  const startRequestDigest = requireDigest(
    input.startRequestDigest,
    "startRequestDigest",
  );
  const sessionDigest = requireDigest(input.sessionDigest, "sessionDigest");
  requireJsonObject(
    input.parsedPacket,
    PARSED_PACKET_MAX_BYTES,
    "parsedPacket",
  );
  requireJsonObject(input.draft, DRAFT_MAX_BYTES, "draft");

  if (input.packetCode !== "supported" && input.packetCode !== "conflict") {
    throw new DatabaseInvariantError("packetCode is invalid.");
  }

  const result = await client.query<ApplicationQueryRow>(
    `WITH stamp AS (SELECT clock_timestamp() AS created_at)
     INSERT INTO applications (
       id,
       start_nonce_hash,
       start_request_id,
       start_request_digest,
       session_digest,
       created_at,
       expires_at,
       packet_code,
       parsed_packet,
       draft,
       stage,
       revision,
       requirements_version,
       page_epoch,
       updated_at
     )
     SELECT
       $1,
       $2,
       $3,
       $4,
       $5,
       stamp.created_at,
       stamp.created_at + interval '60 minutes',
       $6,
       $7::jsonb,
       $8::jsonb,
       'draft',
       0,
       1,
       0,
       stamp.created_at
     FROM stamp
     RETURNING ${APPLICATION_COLUMNS}`,
    [
      input.id,
      startNonceHash,
      input.startRequestId,
      startRequestDigest,
      sessionDigest,
      input.packetCode,
      input.parsedPacket,
      input.draft,
    ],
  );
  return mapApplication(
    requireSingleRow(
      result.rows,
      "Application insertion did not return one row.",
    ),
  );
}

export async function lockApplicationBySessionDigest(
  client: PoolClient,
  sessionDigest: Uint8Array,
): Promise<StoredApplication | null> {
  const digest = requireDigest(sessionDigest, "sessionDigest");
  const result = await client.query<ApplicationQueryRow>(
    `SELECT ${APPLICATION_COLUMNS}
       FROM applications
      WHERE session_digest = $1
      FOR UPDATE`,
    [digest],
  );

  if (result.rows.length > 1) {
    throw new DatabaseInvariantError(
      "A session digest matched multiple applications.",
    );
  }

  return result.rows[0] === undefined ? null : mapApplication(result.rows[0]);
}

export async function lockApplicationById(
  client: PoolClient,
  applicationId: string,
): Promise<StoredApplication | null> {
  requireUuidV4(applicationId, "applicationId");
  const result = await client.query<ApplicationQueryRow>(
    `SELECT ${APPLICATION_COLUMNS}
       FROM applications
      WHERE id = $1
      FOR UPDATE`,
    [applicationId],
  );

  if (result.rows.length > 1) {
    throw new DatabaseInvariantError(
      "An application ID matched multiple rows.",
    );
  }

  return result.rows[0] === undefined ? null : mapApplication(result.rows[0]);
}

export type ApplicationStateUpdate = Readonly<{
  id: string;
  draft: unknown;
  stage: ApplicationStage;
  revision: number;
  requirementsVersion: number;
  pageEpoch: number;
  pageBootstrapRequestId: string | null;
  pageBootstrapRequestDigest: Uint8Array | null;
  consentRequestId: string | null;
  currentReviewId: string | null;
}>;

export async function saveLockedApplicationState(
  client: PoolClient,
  input: ApplicationStateUpdate,
): Promise<StoredApplication> {
  requireUuidV4(input.id, "id");
  requireJsonObject(input.draft, DRAFT_MAX_BYTES, "draft");

  if (!Number.isSafeInteger(input.revision) || input.revision < 0) {
    throw new DatabaseInvariantError("revision is invalid.");
  }
  if (
    !Number.isSafeInteger(input.requirementsVersion) ||
    input.requirementsVersion < 1
  ) {
    throw new DatabaseInvariantError("requirementsVersion is invalid.");
  }
  if (!Number.isSafeInteger(input.pageEpoch) || input.pageEpoch < 0) {
    throw new DatabaseInvariantError("pageEpoch is invalid.");
  }
  if (!(["draft", "review", "submitted"] as const).includes(input.stage)) {
    throw new DatabaseInvariantError("stage is invalid.");
  }

  if (input.pageBootstrapRequestId !== null) {
    requireUuidV4(input.pageBootstrapRequestId, "pageBootstrapRequestId");
  }
  if (input.consentRequestId !== null) {
    requireUuidV4(input.consentRequestId, "consentRequestId");
  }
  if (input.currentReviewId !== null) {
    requireUuidV4(input.currentReviewId, "currentReviewId");
  }

  const pageDigest =
    input.pageBootstrapRequestDigest === null
      ? null
      : requireDigest(
          input.pageBootstrapRequestDigest,
          "pageBootstrapRequestDigest",
        );

  if ((input.pageBootstrapRequestId === null) !== (pageDigest === null)) {
    throw new DatabaseInvariantError(
      "The page replay coordinate is incomplete.",
    );
  }
  if (input.stage !== "draft" && input.consentRequestId !== null) {
    throw new DatabaseInvariantError(
      "Consent cannot remain active outside Draft.",
    );
  }
  if ((input.stage === "draft") !== (input.currentReviewId === null)) {
    throw new DatabaseInvariantError(
      "The Review link does not match the stage.",
    );
  }

  const result = await client.query<ApplicationQueryRow>(
    `UPDATE applications
        SET draft = $2::jsonb,
            stage = $3,
            revision = $4,
            requirements_version = $5,
            page_epoch = $6,
            page_bootstrap_request_id = $7,
            page_bootstrap_request_digest = $8,
            consent_request_id = $9,
            current_review_id = $10,
            updated_at = clock_timestamp()
      WHERE id = $1
      RETURNING ${APPLICATION_COLUMNS}`,
    [
      input.id,
      input.draft,
      input.stage,
      input.revision,
      input.requirementsVersion,
      input.pageEpoch,
      input.pageBootstrapRequestId,
      pageDigest,
      input.consentRequestId,
      input.currentReviewId,
    ],
  );

  return mapApplication(
    requireSingleRow(
      result.rows,
      "The locked Application update affected no row.",
    ),
  );
}
