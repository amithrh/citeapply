import type { PoolClient, QueryResultRow } from "pg";

import { DatabaseInvariantError, requireSingleRow } from "./transactions.ts";

export type StoredSubmission = Readonly<{
  id: string;
  applicationId: string;
  reviewId: string;
  receiptId: string;
  acceptedApplicationRevision: number;
  receiptRecord: unknown;
  submittedAt: Date;
}>;

type SubmissionRow = QueryResultRow & {
  id: string;
  application_id: string;
  review_id: string;
  receipt_id: string;
  accepted_application_revision: string | number;
  receipt_record: unknown;
  submitted_at: Date | string;
};

const COLUMNS = `
  id,
  application_id,
  review_id,
  receipt_id,
  accepted_application_revision,
  receipt_record,
  submitted_at
`;

function mapSubmission(row: SubmissionRow): StoredSubmission {
  const revision =
    typeof row.accepted_application_revision === "number"
      ? row.accepted_application_revision
      : Number(row.accepted_application_revision);
  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new DatabaseInvariantError("The accepted revision is invalid.");
  }
  const submittedAt =
    row.submitted_at instanceof Date
      ? new Date(row.submitted_at.getTime())
      : new Date(row.submitted_at);
  if (!Number.isFinite(submittedAt.getTime())) {
    throw new DatabaseInvariantError("The submission timestamp is invalid.");
  }
  return {
    id: row.id,
    applicationId: row.application_id,
    reviewId: row.review_id,
    receiptId: row.receipt_id,
    acceptedApplicationRevision: revision,
    receiptRecord: row.receipt_record,
    submittedAt,
  };
}

export type NewSubmission = Readonly<{
  id: string;
  applicationId: string;
  reviewId: string;
  receiptId: string;
  acceptedApplicationRevision: number;
  receiptRecord: unknown;
}>;

/**
 * Accepts one submission. `application_id` is unique, so a second acceptance
 * for the same application is impossible at the storage layer.
 */
export async function insertSubmission(
  client: PoolClient,
  input: NewSubmission,
): Promise<StoredSubmission> {
  const result = await client.query<SubmissionRow>(
    `INSERT INTO submissions (
       id, application_id, review_id, receipt_id,
       accepted_application_revision, receipt_record, submitted_at
     )
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, clock_timestamp())
     RETURNING ${COLUMNS}`,
    [
      input.id,
      input.applicationId,
      input.reviewId,
      input.receiptId,
      input.acceptedApplicationRevision,
      JSON.stringify(input.receiptRecord),
    ],
  );
  return mapSubmission(
    requireSingleRow(result.rows, "The submission insert returned no row."),
  );
}

export async function findSubmission(
  client: PoolClient,
  applicationId: string,
): Promise<StoredSubmission | null> {
  const result = await client.query<SubmissionRow>(
    `SELECT ${COLUMNS} FROM submissions WHERE application_id = $1`,
    [applicationId],
  );
  return result.rows[0] === undefined ? null : mapSubmission(result.rows[0]);
}
