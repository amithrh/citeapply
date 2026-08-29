import type { PoolClient, QueryResultRow } from "pg";

import { DatabaseInvariantError, requireSingleRow } from "./transactions.ts";

export type StoredReview = Readonly<{
  id: string;
  shortId: string;
  applicationId: string;
  sourceApplicationRevision: number;
  sourceRequirementsVersion: number;
  contentHash: Buffer;
  reviewSnapshot: unknown;
  createdAt: Date;
  invalidatedAt: Date | null;
}>;

type ReviewRow = QueryResultRow & {
  id: string;
  short_id: string;
  application_id: string;
  source_application_revision: string | number;
  source_requirements_version: string | number;
  content_hash: Buffer;
  review_snapshot: unknown;
  created_at: Date | string;
  invalidated_at: Date | string | null;
};

const COLUMNS = `
  id,
  short_id,
  application_id,
  source_application_revision,
  source_requirements_version,
  content_hash,
  review_snapshot,
  created_at,
  invalidated_at
`;

function safeInteger(value: string | number, label: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new DatabaseInvariantError(`${label} is invalid.`);
  }
  return parsed;
}

function databaseDate(value: Date | string): Date {
  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new DatabaseInvariantError("A Review timestamp is invalid.");
  }
  return date;
}

function mapReview(row: ReviewRow): StoredReview {
  return {
    id: row.id,
    shortId: row.short_id,
    applicationId: row.application_id,
    sourceApplicationRevision: safeInteger(
      row.source_application_revision,
      "source_application_revision",
    ),
    sourceRequirementsVersion: safeInteger(
      row.source_requirements_version,
      "source_requirements_version",
    ),
    contentHash: row.content_hash,
    reviewSnapshot: row.review_snapshot,
    createdAt: databaseDate(row.created_at),
    invalidatedAt:
      row.invalidated_at === null ? null : databaseDate(row.invalidated_at),
  };
}

export type NewReview = Readonly<{
  id: string;
  shortId: string;
  applicationId: string;
  sourceApplicationRevision: number;
  sourceRequirementsVersion: number;
  contentHash: Uint8Array;
  reviewSnapshot: unknown;
}>;

/**
 * Inserts one immutable Review. A partial unique index enforces at most one
 * current Review per application, so a second concurrent preparation fails
 * rather than creating a rival snapshot.
 */
export async function insertReview(
  client: PoolClient,
  input: NewReview,
): Promise<StoredReview> {
  if (input.contentHash.byteLength !== 32) {
    throw new DatabaseInvariantError("The Review content hash is invalid.");
  }
  const result = await client.query<ReviewRow>(
    `INSERT INTO reviews (
       id, short_id, application_id, source_application_revision,
       source_requirements_version, content_hash, review_snapshot, created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, clock_timestamp())
     RETURNING ${COLUMNS}`,
    [
      input.id,
      input.shortId,
      input.applicationId,
      input.sourceApplicationRevision,
      input.sourceRequirementsVersion,
      Buffer.from(input.contentHash),
      JSON.stringify(input.reviewSnapshot),
    ],
  );
  return mapReview(
    requireSingleRow(result.rows, "The Review insert returned no row."),
  );
}

export async function lockReviewById(
  client: PoolClient,
  reviewId: string,
): Promise<StoredReview | null> {
  const result = await client.query<ReviewRow>(
    `SELECT ${COLUMNS} FROM reviews WHERE id = $1 FOR UPDATE`,
    [reviewId],
  );
  return result.rows[0] === undefined ? null : mapReview(result.rows[0]);
}

export async function findCurrentReview(
  client: PoolClient,
  applicationId: string,
): Promise<StoredReview | null> {
  const result = await client.query<ReviewRow>(
    `SELECT ${COLUMNS}
       FROM reviews
      WHERE application_id = $1 AND invalidated_at IS NULL`,
    [applicationId],
  );
  return result.rows[0] === undefined ? null : mapReview(result.rows[0]);
}

/** Return-to-draft invalidates the current Review; it is never deleted. */
export async function invalidateCurrentReview(
  client: PoolClient,
  applicationId: string,
): Promise<string | null> {
  const result = await client.query<{ id: string }>(
    `UPDATE reviews
        SET invalidated_at = clock_timestamp()
      WHERE application_id = $1 AND invalidated_at IS NULL
      RETURNING id`,
    [applicationId],
  );
  return result.rows[0]?.id ?? null;
}
