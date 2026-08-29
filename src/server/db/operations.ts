import { timingSafeEqual } from "node:crypto";

import type { PoolClient, QueryResultRow } from "pg";

import { DatabaseInvariantError, requireSingleRow } from "./transactions.ts";

const SHA256_BYTES = 32;
const MAX_OPERATION_ROWS = 128;
const MAX_OUTCOME_BYTES = 8 * 1_024;
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const FIELD_IDS = [
  "legal_name",
  "student_id",
  "institution",
  "preferred_contact_email",
  "dependency",
  "guardian_name",
  "household_size",
  "annual_household_income",
] as const;

const EVIDENCE_FIELD_IDS = FIELD_IDS.filter(
  (field) => field !== "preferred_contact_email",
);
const ORDINARY_CLEAR_FIELD_IDS = EVIDENCE_FIELD_IDS.filter(
  (field) => field !== "dependency",
);
const EMAIL_FIELD_TUPLE = ["preferred_contact_email"] as const;
const INCOME_FIELD_TUPLE = ["annual_household_income"] as const;
const DEPENDENCY_CLEAR_FIELD_TUPLE = [
  "dependency",
  "guardian_name",
  "household_size",
] as const;

const BLOCKER_CODES = [
  "missing_evidence",
  "conflict_requires_human",
  "invalid_email",
  "declaration_required",
] as const;

export const OPERATION_ACTIONS = [
  "bind_evidence",
  "clear_evidence",
  "clear_dependency",
  "save_email",
  "declare_email",
  "resolve_income",
  "clear_income_resolution",
  "allow_assisted_access",
  "revoke_assisted_access",
  "prepare_review",
  "return_to_draft",
  "apply_evidence_answers",
  "prepare_submission_review",
  "submit",
] as const;

export type OperationAction = (typeof OPERATION_ACTIONS)[number];

export const STORED_OUTCOME_CODES = [
  "action_applied",
  "no_change",
  "assistance_allowed",
  "assistance_revoked",
  "review_prepared",
  "returned_to_draft",
  "evidence_unavailable",
  "conflict_requires_human",
  "not_ready_for_review",
  "answers_applied",
  "income_refused",
  "assisted_review_prepared",
  "submitted",
] as const;

export type StoredOutcomeCode = (typeof STORED_OUTCOME_CODES)[number];
export type StoredOperationOutcome = Readonly<Record<string, unknown>> &
  Readonly<{ outcome: StoredOutcomeCode }>;

export type StoredOperation = Readonly<{
  applicationId: string;
  requestId: string;
  action: OperationAction;
  keyedIntentDigest: Buffer;
  outcome: StoredOperationOutcome;
  createdAt: Date;
}>;

type OperationQueryRow = QueryResultRow & {
  application_id: string;
  request_id: string;
  action: OperationAction;
  keyed_intent_digest: Buffer;
  outcome: StoredOperationOutcome;
  created_at: Date | string;
};

type JsonObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function own(value: JsonObject, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(value, key)
    ? value[key]
    : undefined;
}

function requireExactKeys(
  value: JsonObject,
  expectedKeys: readonly string[],
): void {
  const actualKeys = Object.keys(value);
  const expected = new Set(expectedKeys);
  if (
    actualKeys.length !== expected.size ||
    actualKeys.some((key) => !expected.has(key))
  ) {
    throw new DatabaseInvariantError(
      "The stored operation outcome does not match its closed coordinate shape.",
    );
  }
  for (const key of actualKeys) {
    if (value[key] === undefined) {
      throw new DatabaseInvariantError(
        "The stored operation outcome contains an undefined coordinate.",
      );
    }
  }
}

function requireSafeInteger(
  value: unknown,
  minimum: number,
  label: string,
): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    throw new DatabaseInvariantError(`${label} is invalid.`);
  }
  return value as number;
}

function requireVersions(value: unknown): void {
  if (!isPlainObject(value)) {
    throw new DatabaseInvariantError(
      "The stored operation versions are invalid.",
    );
  }
  const keys = Object.keys(value);
  if (
    keys.length !== 2 ||
    !keys.includes("applicationRevision") ||
    !keys.includes("requirementsVersion")
  ) {
    throw new DatabaseInvariantError(
      "The stored operation versions are not closed.",
    );
  }
  requireSafeInteger(
    own(value, "applicationRevision"),
    0,
    "applicationRevision",
  );
  requireSafeInteger(
    own(value, "requirementsVersion"),
    1,
    "requirementsVersion",
  );
}

function requireField(
  value: unknown,
  evidenceOnly: boolean,
  label: string,
): string {
  const allowed = evidenceOnly ? EVIDENCE_FIELD_IDS : FIELD_IDS;
  if (
    typeof value !== "string" ||
    !(allowed as readonly string[]).includes(value)
  ) {
    throw new DatabaseInvariantError(`${label} is invalid.`);
  }
  return value;
}

function requireFields(value: unknown, minimum: number): void {
  if (
    !Array.isArray(value) ||
    value.length < minimum ||
    value.length > FIELD_IDS.length
  ) {
    throw new DatabaseInvariantError(
      "The stored operation fields are invalid.",
    );
  }
  let previousIndex = -1;
  for (const field of value) {
    const checked = requireField(field, false, "A stored operation field");
    const index = (FIELD_IDS as readonly string[]).indexOf(checked);
    if (index <= previousIndex) {
      throw new DatabaseInvariantError(
        "Stored operation fields must be unique and domain ordered.",
      );
    }
    previousIndex = index;
  }
}

function requireEmptyFields(value: unknown): void {
  if (!Array.isArray(value) || value.length !== 0) {
    throw new DatabaseInvariantError(
      "The stored no-change fields must be empty.",
    );
  }
}

function requireBlockers(value: unknown): void {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > FIELD_IDS.length
  ) {
    throw new DatabaseInvariantError(
      "The stored operation blockers are invalid.",
    );
  }

  const seenFields = new Set<string>();
  let previousOrder = -1;
  for (const blocker of value) {
    if (!isPlainObject(blocker)) {
      throw new DatabaseInvariantError(
        "A stored operation blocker is invalid.",
      );
    }
    const keys = Object.keys(blocker);
    if (
      keys.length !== 2 ||
      !keys.includes("code") ||
      !keys.includes("field")
    ) {
      throw new DatabaseInvariantError(
        "A stored operation blocker is not closed.",
      );
    }
    const code = own(blocker, "code");
    if (
      typeof code !== "string" ||
      !(BLOCKER_CODES as readonly string[]).includes(code)
    ) {
      throw new DatabaseInvariantError(
        "A stored operation blocker code is invalid.",
      );
    }
    const field = requireField(own(blocker, "field"), false, "A blocker field");
    if (
      (code === "conflict_requires_human" &&
        field !== "annual_household_income") ||
      ((code === "invalid_email" || code === "declaration_required") &&
        field !== "preferred_contact_email") ||
      (code === "missing_evidence" && field === "preferred_contact_email")
    ) {
      throw new DatabaseInvariantError(
        "A stored operation blocker pair is invalid.",
      );
    }
    const order =
      code === "missing_evidence"
        ? (EVIDENCE_FIELD_IDS as readonly string[]).indexOf(field)
        : code === "conflict_requires_human"
          ? 20
          : code === "invalid_email"
            ? 21
            : 22;
    if (order < 0 || order <= previousOrder || seenFields.has(field)) {
      throw new DatabaseInvariantError(
        "Stored operation blockers must be unique and domain ordered.",
      );
    }
    seenFields.add(field);
    previousOrder = order;
  }
}

function requireUuidCoordinate(value: JsonObject, key: string): void {
  const candidate = own(value, key);
  if (typeof candidate !== "string" || !UUID_V4.test(candidate)) {
    throw new DatabaseInvariantError(`${key} must be a UUID v4.`);
  }
}

function requireOutcomeShape(
  value: JsonObject,
  action: OperationAction,
  outcome: StoredOutcomeCode,
  coordinateKeys: readonly string[] = [],
): void {
  requireExactKeys(value, ["outcome", "action", ...coordinateKeys, "versions"]);
  if (own(value, "outcome") !== outcome || own(value, "action") !== action) {
    throw new DatabaseInvariantError(
      "The stored outcome discriminator does not match its operation.",
    );
  }
  requireVersions(own(value, "versions"));
}

function requireAppliedFieldsOutcome(
  value: JsonObject,
  action: OperationAction,
  outcome: "action_applied" | "answers_applied",
): void {
  requireOutcomeShape(value, action, outcome, ["fields"]);
  requireFields(own(value, "fields"), 1);
}

function requireSingletonAppliedFieldOutcome(
  value: JsonObject,
  action: OperationAction,
  allowedFields: readonly string[],
): void {
  requireOutcomeShape(value, action, "action_applied", ["fields"]);
  const fields = own(value, "fields");
  if (
    !Array.isArray(fields) ||
    fields.length !== 1 ||
    typeof fields[0] !== "string" ||
    !allowedFields.includes(fields[0])
  ) {
    throw new DatabaseInvariantError(
      `The stored ${action} fields do not match its reachable field coordinate.`,
    );
  }
}

function requireExactAppliedFieldsOutcome(
  value: JsonObject,
  action: OperationAction,
  expectedFields: readonly string[],
): void {
  requireOutcomeShape(value, action, "action_applied", ["fields"]);
  const fields = own(value, "fields");
  if (
    !Array.isArray(fields) ||
    fields.length !== expectedFields.length ||
    fields.some((field, index) => field !== expectedFields[index])
  ) {
    throw new DatabaseInvariantError(
      `The stored ${action} fields do not match its reachable field coordinate.`,
    );
  }
}

function requireNoChangeFieldsOutcome(
  value: JsonObject,
  action: OperationAction,
): void {
  requireOutcomeShape(value, action, "no_change", ["fields"]);
  requireEmptyFields(own(value, "fields"));
}

function invalidOutcomeForAction(): never {
  throw new DatabaseInvariantError(
    "The stored outcome is invalid for its operation action.",
  );
}

function requireExactOutcomeCoordinates(
  value: JsonObject,
  action: OperationAction,
  outcome: StoredOutcomeCode,
): void {
  switch (action) {
    case "bind_evidence":
      if (outcome === "action_applied") {
        requireSingletonAppliedFieldOutcome(value, action, EVIDENCE_FIELD_IDS);
        return;
      }
      if (outcome === "no_change") {
        requireNoChangeFieldsOutcome(value, action);
        return;
      }
      if (outcome === "evidence_unavailable") {
        requireOutcomeShape(value, action, outcome, ["field"]);
        requireField(
          own(value, "field"),
          true,
          "The unavailable evidence field",
        );
        return;
      }
      if (outcome === "conflict_requires_human") {
        requireOutcomeShape(value, action, outcome, ["field"]);
        if (own(value, "field") !== "annual_household_income") {
          throw new DatabaseInvariantError(
            "A stored income conflict must identify the income field.",
          );
        }
        return;
      }
      return invalidOutcomeForAction();

    case "clear_evidence":
      if (outcome === "action_applied") {
        requireSingletonAppliedFieldOutcome(
          value,
          action,
          ORDINARY_CLEAR_FIELD_IDS,
        );
        return;
      }
      if (outcome === "no_change") {
        requireNoChangeFieldsOutcome(value, action);
        return;
      }
      return invalidOutcomeForAction();

    case "clear_dependency":
      if (outcome === "action_applied") {
        requireExactAppliedFieldsOutcome(
          value,
          action,
          DEPENDENCY_CLEAR_FIELD_TUPLE,
        );
        return;
      }
      if (outcome === "no_change") {
        requireNoChangeFieldsOutcome(value, action);
        return;
      }
      return invalidOutcomeForAction();

    case "save_email":
    case "declare_email":
      if (outcome === "action_applied") {
        requireExactAppliedFieldsOutcome(value, action, EMAIL_FIELD_TUPLE);
        return;
      }
      if (outcome === "no_change") {
        requireNoChangeFieldsOutcome(value, action);
        return;
      }
      return invalidOutcomeForAction();

    case "clear_income_resolution":
      if (outcome === "action_applied") {
        requireExactAppliedFieldsOutcome(value, action, INCOME_FIELD_TUPLE);
        return;
      }
      if (outcome === "no_change") {
        requireNoChangeFieldsOutcome(value, action);
        return;
      }
      return invalidOutcomeForAction();

    case "resolve_income":
      if (outcome === "action_applied") {
        requireExactAppliedFieldsOutcome(value, action, INCOME_FIELD_TUPLE);
        return;
      }
      if (outcome === "no_change") {
        requireNoChangeFieldsOutcome(value, action);
        return;
      }
      if (outcome === "evidence_unavailable") {
        requireOutcomeShape(value, action, outcome, ["field"]);
        if (own(value, "field") !== "annual_household_income") {
          throw new DatabaseInvariantError(
            "Unavailable resolved evidence must identify the income field.",
          );
        }
        return;
      }
      return invalidOutcomeForAction();

    case "allow_assisted_access":
      if (outcome === "assistance_allowed") {
        requireOutcomeShape(value, action, outcome);
        return;
      }
      if (outcome === "no_change") {
        requireOutcomeShape(value, action, outcome, [
          "consentCoordinate",
          "fields",
        ]);
        requireUuidCoordinate(value, "consentCoordinate");
        requireEmptyFields(own(value, "fields"));
        return;
      }
      return invalidOutcomeForAction();

    case "revoke_assisted_access":
      if (outcome === "assistance_revoked") {
        requireOutcomeShape(value, action, outcome);
        return;
      }
      if (outcome === "no_change") {
        requireNoChangeFieldsOutcome(value, action);
        return;
      }
      return invalidOutcomeForAction();

    case "prepare_review":
      if (outcome === "review_prepared") {
        requireOutcomeShape(value, action, outcome, ["reviewId"]);
        requireUuidCoordinate(value, "reviewId");
        return;
      }
      if (outcome === "not_ready_for_review") {
        requireOutcomeShape(value, action, outcome, ["blockers"]);
        requireBlockers(own(value, "blockers"));
        return;
      }
      return invalidOutcomeForAction();

    case "return_to_draft":
      if (outcome !== "returned_to_draft") return invalidOutcomeForAction();
      requireOutcomeShape(value, action, outcome, ["invalidatedReviewId"]);
      requireUuidCoordinate(value, "invalidatedReviewId");
      return;

    case "apply_evidence_answers":
      if (outcome === "answers_applied") {
        requireAppliedFieldsOutcome(value, action, outcome);
        return;
      }
      if (outcome === "no_change") {
        requireNoChangeFieldsOutcome(value, action);
        return;
      }
      if (outcome === "evidence_unavailable") {
        requireOutcomeShape(value, action, outcome);
        return;
      }
      if (outcome === "income_refused") {
        requireOutcomeShape(value, action, outcome, ["field"]);
        if (own(value, "field") !== "annual_household_income") {
          throw new DatabaseInvariantError(
            "A stored income refusal must identify the income field.",
          );
        }
        return;
      }
      return invalidOutcomeForAction();

    case "prepare_submission_review":
      if (outcome === "assisted_review_prepared") {
        requireOutcomeShape(value, action, outcome, ["reviewId"]);
        requireUuidCoordinate(value, "reviewId");
        return;
      }
      if (outcome === "not_ready_for_review") {
        requireOutcomeShape(value, action, outcome, ["blockers"]);
        requireBlockers(own(value, "blockers"));
        return;
      }
      return invalidOutcomeForAction();

    case "submit":
      if (outcome !== "submitted") return invalidOutcomeForAction();
      requireOutcomeShape(value, action, outcome, ["reviewId"]);
      requireUuidCoordinate(value, "reviewId");
  }
}

function requireUuidV4(value: string, label: string): void {
  if (!UUID_V4.test(value)) {
    throw new DatabaseInvariantError(`${label} must be a UUID v4.`);
  }
}

function requireDigest(value: Uint8Array): Buffer {
  if (value.byteLength !== SHA256_BYTES) {
    throw new DatabaseInvariantError(
      "keyedIntentDigest must be a 32-byte digest.",
    );
  }

  return Buffer.from(value);
}

function requireOutcome(
  value: StoredOperationOutcome,
  expectedAction: OperationAction,
): void {
  if (!isPlainObject(value)) {
    throw new DatabaseInvariantError(
      "The stored operation outcome must be an object.",
    );
  }

  const outcome = own(value, "outcome");
  if (
    typeof outcome !== "string" ||
    !(STORED_OUTCOME_CODES as readonly string[]).includes(outcome)
  ) {
    throw new DatabaseInvariantError(
      "The stored operation outcome code is invalid.",
    );
  }
  const action = own(value, "action");
  if (action !== expectedAction) {
    throw new DatabaseInvariantError(
      "The stored outcome action does not match its operation.",
    );
  }
  requireExactOutcomeCoordinates(
    value,
    expectedAction,
    outcome as StoredOutcomeCode,
  );

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new DatabaseInvariantError(
      "The stored operation outcome is not serializable.",
    );
  }

  if (
    typeof serialized !== "string" ||
    Buffer.byteLength(serialized, "utf8") > MAX_OUTCOME_BYTES
  ) {
    throw new DatabaseInvariantError(
      "The stored operation outcome exceeds its byte limit.",
    );
  }
}

function databaseDate(value: Date | string): Date {
  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new DatabaseInvariantError("An Operation timestamp is invalid.");
  }
  return date;
}

function mapOperation(row: OperationQueryRow): StoredOperation {
  if (!(OPERATION_ACTIONS as readonly string[]).includes(row.action)) {
    throw new DatabaseInvariantError("A stored operation action is invalid.");
  }
  requireOutcome(row.outcome, row.action);

  return {
    applicationId: row.application_id,
    requestId: row.request_id,
    action: row.action,
    keyedIntentDigest: requireDigest(row.keyed_intent_digest),
    outcome: row.outcome,
    createdAt: databaseDate(row.created_at),
  };
}

export async function findOperation(
  client: PoolClient,
  applicationId: string,
  requestId: string,
): Promise<StoredOperation | null> {
  requireUuidV4(applicationId, "applicationId");
  requireUuidV4(requestId, "requestId");
  const result = await client.query<OperationQueryRow>(
    `SELECT application_id, request_id, action, keyed_intent_digest, outcome, created_at
       FROM operations
      WHERE application_id = $1
        AND request_id = $2`,
    [applicationId, requestId],
  );

  if (result.rows.length > 1) {
    throw new DatabaseInvariantError(
      "An operation identity matched multiple rows.",
    );
  }

  return result.rows[0] === undefined ? null : mapOperation(result.rows[0]);
}

export type OperationReplayClassification =
  | Readonly<{ kind: "missing" }>
  | Readonly<{ kind: "exact"; operation: StoredOperation }>
  | Readonly<{ kind: "mismatch" }>;

export async function classifyOperationReplay(
  client: PoolClient,
  applicationId: string,
  requestId: string,
  keyedIntentDigest: Uint8Array,
): Promise<OperationReplayClassification> {
  const candidateDigest = requireDigest(keyedIntentDigest);
  const existing = await findOperation(client, applicationId, requestId);
  if (existing === null) {
    return { kind: "missing" };
  }

  if (
    existing.keyedIntentDigest.byteLength !== candidateDigest.byteLength ||
    !timingSafeEqual(existing.keyedIntentDigest, candidateDigest)
  ) {
    return { kind: "mismatch" };
  }

  return { kind: "exact", operation: existing };
}

export async function countOperations(
  client: PoolClient,
  applicationId: string,
): Promise<number> {
  requireUuidV4(applicationId, "applicationId");
  const result = await client.query<{ operation_count: number }>(
    `SELECT count(*)::integer AS operation_count
       FROM operations
      WHERE application_id = $1`,
    [applicationId],
  );
  const row = requireSingleRow(
    result.rows,
    "PostgreSQL did not return the operation count.",
  );

  if (
    !Number.isSafeInteger(row.operation_count) ||
    row.operation_count < 0 ||
    row.operation_count > MAX_OPERATION_ROWS
  ) {
    throw new DatabaseInvariantError(
      "The operation count violates the hard limit.",
    );
  }

  return row.operation_count;
}

export async function listOperations(
  client: PoolClient,
  applicationId: string,
): Promise<readonly StoredOperation[]> {
  requireUuidV4(applicationId, "applicationId");
  const result = await client.query<OperationQueryRow>(
    `SELECT application_id, request_id, action, keyed_intent_digest, outcome, created_at
       FROM operations
      WHERE application_id = $1
      ORDER BY created_at, request_id
      LIMIT 129`,
    [applicationId],
  );

  if (result.rows.length > MAX_OPERATION_ROWS) {
    throw new DatabaseInvariantError(
      "The operation history violates the hard limit.",
    );
  }

  return result.rows.map(mapOperation);
}

export type NewOperation = Readonly<{
  applicationId: string;
  requestId: string;
  action: OperationAction;
  keyedIntentDigest: Uint8Array;
  outcome: StoredOperationOutcome;
}>;

export type InsertOperationResult =
  | Readonly<{ kind: "inserted"; operation: StoredOperation }>
  | Readonly<{ kind: "existing_exact"; operation: StoredOperation }>
  | Readonly<{ kind: "request_reuse_mismatch" }>
  | Readonly<{ kind: "hard_limit" }>;

export async function insertOperation(
  client: PoolClient,
  input: NewOperation,
): Promise<InsertOperationResult> {
  requireUuidV4(input.applicationId, "applicationId");
  requireUuidV4(input.requestId, "requestId");
  if (!(OPERATION_ACTIONS as readonly string[]).includes(input.action)) {
    throw new DatabaseInvariantError("The operation action is invalid.");
  }
  const keyedIntentDigest = requireDigest(input.keyedIntentDigest);
  requireOutcome(input.outcome, input.action);

  const applicationLock = await client.query<{ id: string }>(
    "SELECT id FROM applications WHERE id = $1 FOR UPDATE",
    [input.applicationId],
  );
  requireSingleRow(
    applicationLock.rows,
    "The operation Application is missing or duplicated.",
  );

  const result = await client.query<OperationQueryRow>(
    `INSERT INTO operations (
       application_id,
       request_id,
       action,
       keyed_intent_digest,
       outcome,
       created_at
     )
     SELECT $1, $2, $3, $4, $5::jsonb, clock_timestamp()
      WHERE (
        SELECT count(*)
          FROM operations
         WHERE application_id = $1
      ) < 128
     ON CONFLICT (application_id, request_id) DO NOTHING
     RETURNING application_id, request_id, action, keyed_intent_digest, outcome, created_at`,
    [
      input.applicationId,
      input.requestId,
      input.action,
      keyedIntentDigest,
      input.outcome,
    ],
  );

  if (result.rows.length === 1) {
    return { kind: "inserted", operation: mapOperation(result.rows[0]!) };
  }
  if (result.rows.length > 1) {
    throw new DatabaseInvariantError(
      "One operation insertion returned multiple rows.",
    );
  }

  const replay = await classifyOperationReplay(
    client,
    input.applicationId,
    input.requestId,
    keyedIntentDigest,
  );
  if (replay.kind === "exact") {
    return { kind: "existing_exact", operation: replay.operation };
  }
  if (replay.kind === "mismatch") {
    return { kind: "request_reuse_mismatch" };
  }

  const currentCount = await countOperations(client, input.applicationId);
  if (currentCount !== MAX_OPERATION_ROWS) {
    throw new DatabaseInvariantError(
      "Operation insertion failed without a conflict or hard limit.",
    );
  }

  return { kind: "hard_limit" };
}
