import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import ts from "typescript";
import type { z } from "zod";

import {
  AuthorityMetaV1Schema,
  CONFLICT_REASONS,
  EVIDENCE_FIELD_IDS,
  FIELD_IDS,
  ORDINARY_CLEAR_FIELD_IDS,
  type EvidenceField,
  type FieldId,
  type OrdinaryClearField,
  type Versions,
} from "../../src/contracts/common.ts";
import {
  ActionSuccessSchema,
  type ApplicationRequestSchema,
  HistoricalActionReplayV1Schema,
  HumanActionRequestSchema,
  HumanDraftV1Schema,
  HumanReviewV1Schema,
  HumanSnapshotV1Schema,
  type ReceiptRequestSchema,
  SubmissionRequestSchema,
  applicationResultSchemaForRequest,
  humanActionResultSchema,
  receiptResultSchemaForRequest,
  type HumanAction,
  type HumanActionName,
  type HumanDraftV1,
  type HumanReviewV1,
} from "../../src/contracts/http.ts";
import {
  DemoTokenUnavailableSchema,
  StartUnavailableFailureSchema,
} from "../../src/contracts/outcomes.ts";
import {
  ApplyEvidenceBackedAnswersInputSchema,
  AssistedChangeSchema,
  PrepareSubmissionReviewInputSchema,
  TOOL_INPUT_SCHEMAS,
  TOOL_NAMES,
} from "../../src/contracts/webmcp.ts";

const EXPECTED_NODE = "v24.20.0";
const EXPECTED_TYPESCRIPT = "6.0.3";
const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const NOW = "2026-08-28T00:00:00Z";
const EXPIRES = "2026-08-28T01:00:00Z";
const CAPABILITY = "A".repeat(43);
const EMAIL = "synthetic.applicant@example.test";
const REVIEW_ID = uuid(900);
const OTHER_REVIEW_ID = uuid(901);
const EXISTING_CONSENT_ID = uuid(902);
const DIFFERENT_CONSENT_ID = uuid(903);

const CONTENT_ACTIONS = [
  "bind_evidence",
  "clear_evidence",
  "clear_dependency",
  "save_email",
  "declare_email",
  "resolve_income",
  "clear_income_resolution",
] as const;

const HUMAN_ACTIONS = [
  ...CONTENT_ACTIONS,
  "allow_assisted_access",
  "revoke_assisted_access",
  "prepare_review",
  "return_to_draft",
] as const satisfies readonly HumanActionName[];

const LOCKED_FAMILIES = [
  "requested action and field pairing",
  "effect no-op and refusal version deltas",
  "current and historical causal coordinates",
  "requirements and application version inequality",
  "historical Review source-version binding",
  "canonical-income-only conflict direct failure pairing",
  "Allow replay after later content revision under current authority",
  "schema-factory output types and upper-bound overflow rejection",
] as const;

type FamilyId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type ParseSchema = Readonly<{
  safeParse(value: unknown):
    | Readonly<{ success: true; data: unknown }>
    | Readonly<{ success: false; error: Readonly<{ issues: readonly unknown[] }> }>;
}>;
type DraftOptions = Readonly<{
  packet?: "supported" | "conflict";
  assistance?: "off" | "allowed";
  overrides?: Readonly<Partial<Record<FieldId, unknown>>>;
}>;
type ActionContext = Parameters<typeof humanActionResultSchema>[1];
type CurrentCase = Readonly<{
  label: string;
  action: HumanActionName;
  request: HumanAction;
  context: ActionContext;
  result: unknown;
  variant: "effect" | "no_change";
}>;
type HistoricalCase = Readonly<{
  label: string;
  action: HumanActionName;
  request: HumanAction;
  context: ActionContext;
  result: unknown;
  effect: boolean;
}>;

const coverage = new Map<FamilyId, { positive: number; negative: number }>(
  LOCKED_FAMILIES.map((_, index) => [
    (index + 1) as FamilyId,
    { positive: 0, negative: 0 },
  ]),
);
const labels = new Set<string>();
let compileNegativeCount = 0;

function uuid(index: number): string {
  return `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;
}

function handle(index: number): string {
  return index.toString(36).padStart(22, "A");
}

function fingerprint(index: number): string {
  return index.toString(16).padStart(64, "0");
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  return value as Record<string, unknown>;
}

function snapshotRecord(result: unknown): Record<string, unknown> {
  const data = asRecord(asRecord(result)["data"]);
  return asRecord(data["snapshot"]);
}

function originalRecord(result: unknown): Record<string, unknown> {
  const data = asRecord(asRecord(result)["data"]);
  return asRecord(data["original"]);
}

function recordLabel(label: string): void {
  assert.equal(labels.has(label), false, `duplicate probe label: ${label}`);
  labels.add(label);
}

function accept(
  family: FamilyId,
  label: string,
  schema: ParseSchema,
  value: unknown,
): void {
  recordLabel(`P${family}:${label}`);
  const parsed = schema.safeParse(value);
  assert.equal(
    parsed.success,
    true,
    parsed.success ? undefined : `${label}: ${JSON.stringify(parsed.error.issues)}`,
  );
  coverage.get(family)!.positive += 1;
}

function reject(
  family: FamilyId,
  label: string,
  schema: ParseSchema,
  value: unknown,
): void {
  recordLabel(`N${family}:${label}`);
  const parsed = schema.safeParse(value);
  assert.equal(parsed.success, false, `${label}: unexpectedly accepted`);
  coverage.get(family)!.negative += 1;
}

function mustParse<T>(schema: { parse(value: unknown): T }, value: unknown): T {
  return schema.parse(value);
}

const DOCUMENTS = Object.freeze([
  Object.freeze({
    code: "enrollment",
    title: "Synthetic Enrollment Record",
    documentClass: "synthetic_enrollment_record",
  }),
  Object.freeze({
    code: "household",
    title: "Synthetic Household Statement",
    documentClass: "synthetic_household_statement",
  }),
  Object.freeze({
    code: "income",
    title: "Synthetic Income Statement",
    documentClass: "synthetic_income_statement",
  }),
]);

function claims(packet: "supported" | "conflict"): readonly unknown[] {
  return [
    { claimHandle: handle(0), document: "enrollment", page: 1, kind: "legal_name", normalizedValue: "Synthetic Applicant" },
    { claimHandle: handle(1), document: "enrollment", page: 1, kind: "student_id", normalizedValue: "SYN-0001" },
    { claimHandle: handle(2), document: "enrollment", page: 1, kind: "institution", normalizedValue: "Synthetic College" },
    { claimHandle: handle(3), document: "household", page: 1, kind: "dependency", normalizedValue: true },
    { claimHandle: handle(4), document: "household", page: 1, kind: "guardian_name", normalizedValue: "Synthetic Guardian" },
    { claimHandle: handle(5), document: "household", page: 1, kind: "household_size", normalizedValue: 3 },
    { claimHandle: handle(6), document: "household", page: 1, kind: "annual_household_income", normalizedValue: 480_000 },
    { claimHandle: handle(7), document: "income", page: 1, kind: "annual_household_income", normalizedValue: packet === "supported" ? 480_000 : 540_000 },
  ];
}

const FIELD_HANDLE_INDEX: Readonly<Record<EvidenceField, number>> = Object.freeze({
  legal_name: 0,
  student_id: 1,
  institution: 2,
  dependency: 3,
  guardian_name: 4,
  household_size: 5,
  annual_household_income: 7,
});

const FIELD_DOCUMENT: Readonly<Record<EvidenceField, "enrollment" | "household" | "income">> =
  Object.freeze({
    legal_name: "enrollment",
    student_id: "enrollment",
    institution: "enrollment",
    dependency: "household",
    guardian_name: "household",
    household_size: "household",
    annual_household_income: "income",
  });

function binding(field: EvidenceField): Readonly<{
  claimHandle: string;
  document: "enrollment" | "household" | "income";
  page: 1;
}> {
  return {
    claimHandle: handle(FIELD_HANDLE_INDEX[field]),
    document: FIELD_DOCUMENT[field],
    page: 1,
  };
}

function missing(field: EvidenceField): unknown {
  return { field, active: true, status: "missing" };
}

function inactive(field: "guardian_name" | "household_size"): unknown {
  return { field, active: false, status: "not_required" };
}

function defaultFields(packet: "supported" | "conflict"): Record<FieldId, unknown> {
  const incomeClaim = claims(packet)[7] as Readonly<{ normalizedValue: number }>;
  return {
    legal_name: { field: "legal_name", active: true, status: "ready", origin: "manual", value: "Synthetic Applicant", bindings: [binding("legal_name")] },
    student_id: { field: "student_id", active: true, status: "ready", origin: "manual", value: "SYN-0001", bindings: [binding("student_id")] },
    institution: { field: "institution", active: true, status: "ready", origin: "manual", value: "Synthetic College", bindings: [binding("institution")] },
    preferred_contact_email: { field: "preferred_contact_email", active: true, status: "ready", origin: "manual", value: EMAIL, declaredByApplicant: true },
    dependency: { field: "dependency", active: true, status: "ready", origin: "manual", value: true, bindings: [binding("dependency")] },
    guardian_name: { field: "guardian_name", active: true, status: "ready", origin: "manual", value: "Synthetic Guardian", bindings: [binding("guardian_name")] },
    household_size: { field: "household_size", active: true, status: "ready", origin: "manual", value: 3, bindings: [binding("household_size")] },
    annual_household_income:
      packet === "supported"
        ? {
            field: "annual_household_income",
            active: true,
            status: "ready",
            origin: "manual",
            value: 480_000,
            resolution: "source_supported",
            bindings: [binding("annual_household_income"), { claimHandle: handle(6), document: "household", page: 1 }],
          }
        : {
            field: "annual_household_income",
            active: true,
            status: "ready",
            origin: "manual",
            value: incomeClaim.normalizedValue,
            resolution: { chosen: binding("annual_household_income"), reason: "more_recent" },
          },
  };
}

function blockersFor(fields: readonly unknown[]): readonly unknown[] {
  const byField = new Map(
    fields.map((field) => [asRecord(field)["field"] as FieldId, asRecord(field)] as const),
  );
  const blockers: unknown[] = [];
  for (const field of EVIDENCE_FIELD_IDS) {
    const state = byField.get(field)!;
    if (state["active"] === true && state["status"] === "missing") {
      blockers.push({
        code: "missing_evidence",
        field,
        message: "Required evidence is not linked.",
        action: "reread_state_and_requirements",
      });
    }
  }
  if (byField.get("annual_household_income")!["status"] === "conflict") {
    blockers.push({
      code: "conflict_requires_human",
      field: "annual_household_income",
      message: "Income sources disagree. Resolve this in CiteApply.",
      action: "resolve_in_visible_application",
    });
  }
  const email = byField.get("preferred_contact_email")!;
  if (email["status"] === "missing") {
    blockers.push({
      code: "invalid_email",
      field: "preferred_contact_email",
      message: "Save a valid synthetic .test email in CiteApply.",
      action: "use_visible_application",
    });
  } else if (email["status"] === "needs_declaration") {
    blockers.push({
      code: "declaration_required",
      field: "preferred_contact_email",
      message: "Declare the saved synthetic email in CiteApply.",
      action: "use_visible_application",
    });
  }
  return blockers;
}

function makeDraft(options: DraftOptions = {}): HumanDraftV1 {
  const packet = options.packet ?? "supported";
  const defaults = defaultFields(packet);
  const fields = FIELD_IDS.map((field) =>
    options.overrides !== undefined && Object.hasOwn(options.overrides, field)
      ? options.overrides[field]
      : defaults[field],
  );
  const active = fields.filter((field) => asRecord(field)["active"] === true);
  return mustParse(HumanDraftV1Schema, {
    packet,
    assistance: options.assistance ?? "off",
    progress: {
      ready: active.filter((field) => asRecord(field)["status"] === "ready").length,
      total: active.length,
    },
    blockers: blockersFor(fields),
    fields,
    documents: DOCUMENTS,
    claims: claims(packet),
    activity: {
      totals: { allowed: 0, revoked: 0, acceptedBatches: 0, refusals: 0, assistedReviewsPrepared: 0 },
      latest: [],
    },
  });
}

function draftForBind(field: EvidenceField, noChange = false): HumanDraftV1 {
  if (field !== "dependency" || noChange) return makeDraft();
  return makeDraft({
    overrides: {
      guardian_name: missing("guardian_name"),
      household_size: missing("household_size"),
    },
  });
}

function draftForClear(field: OrdinaryClearField): HumanDraftV1 {
  return makeDraft({ overrides: { [field]: missing(field) } });
}

function draftForClearDependency(): HumanDraftV1 {
  return makeDraft({
    overrides: {
      dependency: missing("dependency"),
      guardian_name: inactive("guardian_name"),
      household_size: inactive("household_size"),
    },
  });
}

function draftForSavedEmail(value = EMAIL): HumanDraftV1 {
  return makeDraft({
    overrides: {
      preferred_contact_email: {
        field: "preferred_contact_email",
        active: true,
        status: "needs_declaration",
        origin: "manual",
        value,
      },
    },
  });
}

function draftForResolvedIncome(
  chosenHandle = handle(7),
  reason: "more_recent" | "corrected_record" | "confirmed_for_application" =
    "more_recent",
): HumanDraftV1 {
  const chosenHousehold = chosenHandle === handle(6);
  return makeDraft({
    packet: "conflict",
    overrides: {
      annual_household_income: {
        field: "annual_household_income",
        active: true,
        status: "ready",
        origin: "manual",
        value: chosenHousehold ? 480_000 : 540_000,
        resolution: {
          chosen: chosenHousehold
            ? { claimHandle: handle(6), document: "household", page: 1 }
            : binding("annual_household_income"),
          reason,
        },
      },
    },
  });
}

function draftWithIncomeConflict(): HumanDraftV1 {
  return makeDraft({
    packet: "conflict",
    overrides: {
      annual_household_income: {
        field: "annual_household_income",
        active: true,
        status: "conflict",
        claims: [handle(6), handle(7)],
      },
    },
  });
}

function authority(
  pageEpoch: number,
  applicationRevision: number,
  requirementsVersion: number,
  projectionSequence: number,
  times: Readonly<{ serverNow?: string; expiresAt?: string }> = {},
): Readonly<Record<string, unknown>> {
  return {
    pageEpoch,
    applicationRevision,
    requirementsVersion,
    projectionSequence,
    expiresAt: times.expiresAt ?? EXPIRES,
    serverNow: times.serverNow ?? NOW,
  };
}

function draftSnapshot(
  draft: HumanDraftV1,
  versions: Versions & Readonly<{ pageEpoch: number; projectionSequence: number }>,
  times?: Readonly<{ serverNow?: string; expiresAt?: string }>,
): unknown {
  return {
    ...authority(
      versions.pageEpoch,
      versions.applicationRevision,
      versions.requirementsVersion,
      versions.projectionSequence,
      times,
    ),
    stage: "draft",
    view: draft,
  };
}

function makeReview(
  sourceVersions: Versions,
  reviewId = REVIEW_ID,
): HumanReviewV1 {
  const supportedClaims = claims("supported") as readonly Readonly<{
    claimHandle: string;
    document: "enrollment" | "household" | "income";
    kind: EvidenceField;
    normalizedValue: string | number | boolean;
  }>[];
  const ready = makeDraft();
  const fields = ready.fields;
  const excerpts = supportedClaims.map((claim) => ({
    claimHandle: claim.claimHandle,
    page: 1,
    excerpt: `Synthetic ${claim.kind} value`,
    title:
      claim.document === "enrollment"
        ? "Synthetic Enrollment Record"
        : claim.document === "household"
          ? "Synthetic Household Statement"
          : "Synthetic Income Statement",
    kind: claim.kind,
    normalizedValue: claim.normalizedValue,
  }));
  const content = {
    schema: "citeapply-application-content-v1",
    activeFields: [...FIELD_IDS],
    fields: [
      { field: "legal_name", value: "Synthetic Applicant", evidence: [fingerprint(0)] },
      { field: "student_id", value: "SYN-0001", evidence: [fingerprint(1)] },
      { field: "institution", value: "Synthetic College", evidence: [fingerprint(2)] },
      { field: "preferred_contact_email", value: EMAIL, declaration: { email: EMAIL, declaredByApplicant: true } },
      { field: "dependency", value: true, evidence: [fingerprint(3)] },
      { field: "guardian_name", value: "Synthetic Guardian", evidence: [fingerprint(4)] },
      { field: "household_size", value: 3, evidence: [fingerprint(5)] },
      { field: "annual_household_income", value: 480_000, evidence: [fingerprint(7), fingerprint(6)], resolution: "source_supported" },
    ],
  };
  return mustParse(HumanReviewV1Schema, {
    reviewId,
    shortId: "0123456789",
    sourceVersions,
    contentHash: fingerprint(99),
    content,
    diffs: [
      { field: "legal_name", initial: null, final: fields[0], excerpts: [excerpts[0]] },
      { field: "student_id", initial: null, final: fields[1], excerpts: [excerpts[1]] },
      { field: "institution", initial: null, final: fields[2], excerpts: [excerpts[2]] },
      { field: "preferred_contact_email", initial: null, final: fields[3], excerpts: [] },
      { field: "dependency", initial: null, final: fields[4], excerpts: [excerpts[3]] },
      { field: "guardian_name", initial: null, final: fields[5], excerpts: [excerpts[4]] },
      { field: "household_size", initial: null, final: fields[6], excerpts: [excerpts[5]] },
      { field: "annual_household_income", initial: null, final: fields[7], excerpts: [excerpts[7], excerpts[6]] },
    ],
    warnings: [],
    activity: ready.activity,
  });
}

function reviewSnapshot(
  applicationRevision: number,
  requirementsVersion: number,
  pageEpoch: number,
  projectionSequence: number,
  sourceVersions: Versions,
  reviewId = REVIEW_ID,
): unknown {
  return {
    ...authority(pageEpoch, applicationRevision, requirementsVersion, projectionSequence),
    stage: "review",
    review: makeReview(sourceVersions, reviewId),
  };
}

function submittedSnapshot(
  applicationRevision: number,
  requirementsVersion: number,
  pageEpoch: number,
  projectionSequence: number,
): unknown {
  return {
    ...authority(pageEpoch, applicationRevision, requirementsVersion, projectionSequence),
    stage: "submitted",
    submittedAt: NOW,
    receiptState: "load_required",
  };
}

function makeRequest(
  action: HumanActionName,
  options: Readonly<{
    requestId?: string;
    pageEpoch?: number;
    applicationRevision?: number;
    requirementsVersion?: number;
    field?: EvidenceField | OrdinaryClearField;
    claimHandle?: string;
    value?: string;
    reason?: "more_recent" | "corrected_record" | "confirmed_for_application";
  }> = {},
): HumanAction {
  const base = {
    requestId: options.requestId ?? uuid(100 + HUMAN_ACTIONS.indexOf(action)),
    expectedPageEpoch: options.pageEpoch ?? 1,
    expectedApplicationRevision: options.applicationRevision ?? 1,
    expectedRequirementsVersion: options.requirementsVersion ?? 1,
  };
  switch (action) {
    case "bind_evidence": {
      const field = (options.field ?? "legal_name") as EvidenceField;
      return mustParse(HumanActionRequestSchema, {
        ...base,
        action,
        field,
        claimHandle: options.claimHandle ?? handle(FIELD_HANDLE_INDEX[field]),
      });
    }
    case "clear_evidence":
      return mustParse(HumanActionRequestSchema, {
        ...base,
        action,
        field: (options.field ?? "legal_name") as OrdinaryClearField,
      });
    case "clear_dependency":
    case "clear_income_resolution":
      return mustParse(HumanActionRequestSchema, { ...base, action, confirmed: true });
    case "save_email":
      return mustParse(HumanActionRequestSchema, {
        ...base,
        action,
        value: options.value ?? EMAIL,
      });
    case "declare_email":
    case "allow_assisted_access":
    case "revoke_assisted_access":
    case "prepare_review":
    case "return_to_draft":
      return mustParse(HumanActionRequestSchema, { ...base, action });
    case "resolve_income":
      return mustParse(HumanActionRequestSchema, {
        ...base,
        action,
        claimHandle: options.claimHandle ?? handle(7),
        reason: options.reason ?? "more_recent",
      });
  }
}

function contentDraftForRequest(request: HumanAction, noChange: boolean): HumanDraftV1 {
  switch (request.action) {
    case "bind_evidence":
      return draftForBind(request.field, noChange);
    case "clear_evidence":
      return draftForClear(request.field);
    case "clear_dependency":
      return draftForClearDependency();
    case "save_email":
      return draftForSavedEmail(request.value);
    case "declare_email":
      return makeDraft();
    case "resolve_income":
      return draftForResolvedIncome(request.claimHandle, request.reason);
    case "clear_income_resolution":
      return draftWithIncomeConflict();
    case "allow_assisted_access":
    case "revoke_assisted_access":
    case "prepare_review":
    case "return_to_draft":
      throw new TypeError("Expected a content action.");
  }
}

function canonicalCurrentCase(
  action: HumanActionName,
  variant: "effect" | "no_change" = "effect",
  requestOptions: Parameters<typeof makeRequest>[1] = {},
): CurrentCase {
  const needsPriorNonRequirementsEffect =
    (action === "allow_assisted_access" && variant === "no_change") ||
    (action === "revoke_assisted_access" && variant === "effect") ||
    action === "return_to_draft";
  const request = makeRequest(action, {
    ...requestOptions,
    applicationRevision:
      requestOptions.applicationRevision ??
      (needsPriorNonRequirementsEffect ? 2 : 1),
  });
  const appDelta = variant === "effect" ? 1 : 0;
  const requirementsDelta =
    variant === "effect" &&
    (action === "clear_dependency" ||
      (action === "bind_evidence" && request.action === "bind_evidence" && request.field === "dependency"))
      ? 1
      : 0;
  const applicationRevision = request.expectedApplicationRevision + appDelta;
  const requirementsVersion = request.expectedRequirementsVersion + requirementsDelta;
  const revisionEffects = applicationRevision - request.expectedPageEpoch;
  const projectionSequence = Math.max(
    0,
    revisionEffects + (variant === "no_change" ? 1 : 0),
  );

  if ((CONTENT_ACTIONS as readonly string[]).includes(action)) {
    const draft = contentDraftForRequest(request, variant === "no_change");
    return {
      label: `${action}-${variant}`,
      action,
      request,
      context: { storedOutcome: null, currentConsentRequestId: null },
      result: {
        ok: true,
        data: {
          kind: variant === "effect" ? "action_applied" : "no_change",
          action,
          snapshot: draftSnapshot(draft, {
            pageEpoch: request.expectedPageEpoch,
            applicationRevision,
            requirementsVersion,
            projectionSequence,
          }),
        },
      },
      variant,
    };
  }

  switch (action) {
    case "allow_assisted_access": {
      const currentConsentRequestId =
        variant === "effect" ? request.requestId : EXISTING_CONSENT_ID;
      return {
        label: `${action}-${variant}`,
        action,
        request,
        context: { storedOutcome: null, currentConsentRequestId },
        result: {
          ok: true,
          data: {
            kind: variant === "effect" ? "assistance_allowed" : "no_change",
            ...(variant === "no_change" ? { action } : {}),
            consentCapability: CAPABILITY,
            snapshot: draftSnapshot(makeDraft({ assistance: "allowed" }), {
              pageEpoch: request.expectedPageEpoch,
              applicationRevision,
              requirementsVersion,
              projectionSequence,
            }),
          },
        },
        variant,
      };
    }
    case "revoke_assisted_access":
      return {
        label: `${action}-${variant}`,
        action,
        request,
        context: { storedOutcome: null, currentConsentRequestId: null },
        result: {
          ok: true,
          data: {
            kind: variant === "effect" ? "assistance_revoked" : "no_change",
            action,
            snapshot: draftSnapshot(makeDraft(), {
              pageEpoch: request.expectedPageEpoch,
              applicationRevision,
              requirementsVersion,
              projectionSequence,
            }),
          },
        },
        variant,
      };
    case "prepare_review":
      assert.equal(variant, "effect");
      return {
        label: action,
        action,
        request,
        context: { storedOutcome: null, currentConsentRequestId: null },
        result: {
          ok: true,
          data: {
            kind: "review_prepared",
            action,
            snapshot: reviewSnapshot(
              applicationRevision,
              requirementsVersion,
              request.expectedPageEpoch,
              projectionSequence,
              {
                applicationRevision: request.expectedApplicationRevision,
                requirementsVersion: request.expectedRequirementsVersion,
              },
            ),
          },
        },
        variant,
      };
    case "return_to_draft":
      assert.equal(variant, "effect");
      return {
        label: action,
        action,
        request,
        context: { storedOutcome: null, currentConsentRequestId: null },
        result: {
          ok: true,
          data: {
            kind: "returned_to_draft",
            action,
            snapshot: draftSnapshot(makeDraft(), {
              pageEpoch: request.expectedPageEpoch,
              applicationRevision,
              requirementsVersion,
              projectionSequence,
            }),
          },
        },
        variant,
      };
    case "bind_evidence":
    case "clear_evidence":
    case "clear_dependency":
    case "save_email":
    case "declare_email":
    case "resolve_income":
    case "clear_income_resolution":
      throw new TypeError("Unreachable content action branch.");
  }
}

function storedFields(request: HumanAction): readonly string[] {
  switch (request.action) {
    case "bind_evidence":
    case "clear_evidence":
      return [request.field];
    case "clear_dependency":
      return ["dependency", "guardian_name", "household_size"];
    case "save_email":
    case "declare_email":
      return ["preferred_contact_email"];
    case "resolve_income":
    case "clear_income_resolution":
      return ["annual_household_income"];
    case "allow_assisted_access":
    case "revoke_assisted_access":
    case "prepare_review":
    case "return_to_draft":
      return [];
  }
}

function canonicalHistoricalCases(): readonly HistoricalCase[] {
  const cases: HistoricalCase[] = [];
  for (const action of CONTENT_ACTIONS) {
    const request = makeRequest(action);
    const requirementsDelta =
      action === "clear_dependency" ||
      (request.action === "bind_evidence" && request.field === "dependency")
        ? 1
        : 0;
    const versions = {
      applicationRevision: request.expectedApplicationRevision + 1,
      requirementsVersion: request.expectedRequirementsVersion + requirementsDelta,
    };
    const original = {
      outcome: "action_applied",
      action,
      fields: storedFields(request),
      versions,
    };
    cases.push({
      label: `${action}-stored-effect`,
      action,
      request,
      context: { storedOutcome: null, currentConsentRequestId: null },
      result: {
        ok: true,
        data: {
          kind: "action_replayed",
          original,
          snapshot: draftSnapshot(makeDraft(), {
            pageEpoch: request.expectedPageEpoch,
            ...versions,
            projectionSequence: versions.applicationRevision - request.expectedPageEpoch,
          }),
        },
      },
      effect: true,
    });

    const noChangeOriginal = {
      outcome: "no_change",
      action,
      fields: [],
      versions: {
        applicationRevision: request.expectedApplicationRevision,
        requirementsVersion: request.expectedRequirementsVersion,
      },
    };
    cases.push({
      label: `${action}-stored-no-change`,
      action,
      request,
      context: { storedOutcome: null, currentConsentRequestId: null },
      result: {
        ok: true,
        data: {
          kind: "action_replayed",
          original: noChangeOriginal,
          snapshot: draftSnapshot(makeDraft(), {
            pageEpoch: request.expectedPageEpoch,
            ...noChangeOriginal.versions,
            projectionSequence:
              noChangeOriginal.versions.applicationRevision -
              request.expectedPageEpoch +
              1,
          }),
        },
      },
      effect: false,
    });
  }

  const allowEffectRequest = makeRequest("allow_assisted_access");
  const allowEffectOriginal: NonNullable<ActionContext["storedOutcome"]> = {
    outcome: "assistance_allowed",
    action: "allow_assisted_access",
    versions: { applicationRevision: 2, requirementsVersion: 1 },
  };
  cases.push({
    label: "allow-stored-effect-authority-lost",
    action: "allow_assisted_access",
    request: allowEffectRequest,
    context: { storedOutcome: allowEffectOriginal, currentConsentRequestId: null },
    result: {
      ok: true,
      data: {
        kind: "action_replayed",
        original: allowEffectOriginal,
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 3,
          requirementsVersion: 1,
          projectionSequence: 2,
        }),
      },
    },
    effect: true,
  });

  const allowNoChangeRequest = makeRequest("allow_assisted_access", {
    applicationRevision: 2,
  });
  const allowNoChangeOriginal: NonNullable<ActionContext["storedOutcome"]> = {
    outcome: "no_change",
    action: "allow_assisted_access",
    consentCoordinate: EXISTING_CONSENT_ID,
    fields: [],
    versions: { applicationRevision: 2, requirementsVersion: 1 },
  };
  cases.push({
    label: "allow-stored-no-change-authority-lost",
    action: "allow_assisted_access",
    request: allowNoChangeRequest,
    context: { storedOutcome: allowNoChangeOriginal, currentConsentRequestId: null },
    result: {
      ok: true,
      data: {
        kind: "action_replayed",
        original: allowNoChangeOriginal,
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 3,
          requirementsVersion: 1,
          projectionSequence: 3,
        }),
      },
    },
    effect: false,
  });

  for (const variant of ["effect", "no_change"] as const) {
    const request = makeRequest("revoke_assisted_access", {
      applicationRevision: 2,
    });
    const versions = {
      applicationRevision: request.expectedApplicationRevision + (variant === "effect" ? 1 : 0),
      requirementsVersion: 1,
    };
    const original = {
      outcome: variant === "effect" ? "assistance_revoked" : "no_change",
      action: "revoke_assisted_access",
      ...(variant === "no_change" ? { fields: [] } : {}),
      versions,
    };
    cases.push({
      label: `revoke-stored-${variant}`,
      action: "revoke_assisted_access",
      request,
      context: { storedOutcome: null, currentConsentRequestId: null },
      result: {
        ok: true,
        data: {
          kind: "action_replayed",
          original,
          snapshot: draftSnapshot(makeDraft(), {
            pageEpoch: 1,
            ...versions,
            projectionSequence:
              versions.applicationRevision - 1 + (variant === "no_change" ? 1 : 0),
          }),
        },
      },
      effect: variant === "effect",
    });
  }

  const prepareRequest = makeRequest("prepare_review");
  const prepareOriginal = {
    outcome: "review_prepared",
    action: "prepare_review",
    reviewId: REVIEW_ID,
    versions: { applicationRevision: 2, requirementsVersion: 1 },
  };
  cases.push({
    label: "prepare-stored-effect",
    action: "prepare_review",
    request: prepareRequest,
    context: { storedOutcome: null, currentConsentRequestId: null },
    result: {
      ok: true,
      data: {
        kind: "action_replayed",
        original: prepareOriginal,
        snapshot: reviewSnapshot(2, 1, 1, 1, { applicationRevision: 1, requirementsVersion: 1 }),
      },
    },
    effect: true,
  });

  const returnRequest = makeRequest("return_to_draft", { applicationRevision: 2 });
  const returnOriginal = {
    outcome: "returned_to_draft",
    action: "return_to_draft",
    invalidatedReviewId: REVIEW_ID,
    versions: { applicationRevision: 3, requirementsVersion: 1 },
  };
  cases.push({
    label: "return-stored-effect",
    action: "return_to_draft",
    request: returnRequest,
    context: { storedOutcome: null, currentConsentRequestId: null },
    result: {
      ok: true,
      data: {
        kind: "action_replayed",
        original: returnOriginal,
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 3,
          requirementsVersion: 1,
          projectionSequence: 2,
        }),
      },
    },
    effect: true,
  });

  const refusals: readonly Readonly<{
    label: string;
    request: HumanAction;
    original: Readonly<Record<string, unknown>>;
  }>[] = [
    {
      label: "bind-evidence-unavailable",
      request: makeRequest("bind_evidence"),
      original: { outcome: "evidence_unavailable", action: "bind_evidence", field: "legal_name", versions: { applicationRevision: 1, requirementsVersion: 1 } },
    },
    {
      label: "resolve-evidence-unavailable",
      request: makeRequest("resolve_income"),
      original: { outcome: "evidence_unavailable", action: "resolve_income", field: "annual_household_income", versions: { applicationRevision: 1, requirementsVersion: 1 } },
    },
    {
      label: "income-conflict-refusal",
      request: makeRequest("bind_evidence", { field: "annual_household_income" }),
      original: { outcome: "conflict_requires_human", action: "bind_evidence", field: "annual_household_income", versions: { applicationRevision: 1, requirementsVersion: 1 } },
    },
    {
      label: "prepare-not-ready",
      request: makeRequest("prepare_review"),
      original: { outcome: "not_ready_for_review", action: "prepare_review", blockers: [{ code: "missing_evidence", field: "legal_name" }], versions: { applicationRevision: 1, requirementsVersion: 1 } },
    },
  ];
  for (const refusal of refusals) {
    cases.push({
      label: refusal.label,
      action: refusal.request.action,
      request: refusal.request,
      context: { storedOutcome: null, currentConsentRequestId: null },
      result: {
        ok: true,
        data: {
          kind: "action_replayed",
          original: refusal.original,
          snapshot: draftSnapshot(makeDraft(), {
            pageEpoch: 1,
            applicationRevision: 1,
            requirementsVersion: 1,
            projectionSequence: 1,
          }),
        },
      },
      effect: false,
    });
  }
  return cases;
}

function conflictFailure(): unknown {
  return {
    ok: false,
    error: {
      code: "conflict_requires_human",
      message: "Income sources disagree. Resolve this in CiteApply.",
      safeActions: ["resolve_in_visible_application"],
    },
  };
}

function failureFixtures(): Readonly<Record<string, unknown>> {
  const supportReference = "CA-01234567";
  return Object.freeze({
    session: {
      ok: false,
      error: {
        code: "session_expired",
        message: "This synthetic session has expired.",
        safeActions: ["start_new_synthetic_demo"],
      },
    },
    stalePage: {
      ok: false,
      error: {
        code: "stale_page",
        message: "This page is no longer current.",
        safeActions: ["reload_current_application"],
      },
    },
    staleState: {
      ok: false,
      error: {
        code: "stale_state",
        message: "The saved application changed.",
        safeActions: ["reread_state_and_requirements"],
        currentVersions: { applicationRevision: 1, requirementsVersion: 1 },
      },
    },
    reuse: {
      ok: false,
      error: {
        code: "request_reuse_mismatch",
        message: "That request identity was already used differently.",
        safeActions: ["reread_state_and_requirements"],
      },
    },
    invalid: {
      ok: false,
      error: {
        code: "invalid_request",
        message: "The request is not valid.",
        safeActions: ["use_visible_application"],
      },
    },
    rate: {
      ok: false,
      error: {
        code: "rate_limited",
        message: "Please wait before trying again.",
        safeActions: ["try_again_after_delay"],
        retryAfterSeconds: 1,
      },
    },
    connection: {
      ok: false,
      error: {
        code: "temporarily_unavailable",
        message: "CiteApply could not establish the latest state.",
        supportReference,
        safeActions: ["reload_current_application"],
      },
    },
    read: {
      ok: false,
      error: {
        code: "temporarily_unavailable",
        message: "CiteApply is temporarily unavailable.",
        supportReference,
        safeActions: ["use_visible_application"],
      },
    },
    mutation: {
      ok: false,
      error: {
        code: "temporarily_unavailable",
        message:
          "CiteApply could not confirm this action. Checking the latest application.",
        supportReference,
        safeActions: ["reconcile_current_state"],
      },
    },
    receipt: {
      ok: false,
      error: {
        code: "temporarily_unavailable",
        message:
          "Your submission remains accepted, but the receipt could not be loaded.",
        supportReference,
        safeActions: ["load_receipt_again"],
      },
    },
    export: {
      ok: false,
      error: {
        code: "temporarily_unavailable",
        message:
          "Your submission remains accepted, but the receipt export could not be prepared.",
        supportReference,
        safeActions: ["retry_export"],
      },
    },
    start: {
      ok: false,
      error: {
        code: "temporarily_unavailable",
        message: "CiteApply could not start this synthetic application.",
        supportReference,
        safeActions: ["return_to_packet_selection"],
      },
    },
    demoToken: {
      ok: false,
      error: {
        code: "temporarily_unavailable",
        message: "CiteApply could not prepare a synthetic start.",
        supportReference,
        safeActions: ["return_to_packet_selection"],
      },
    },
    evidence: {
      ok: false,
      error: {
        code: "evidence_unavailable",
        message: "That evidence is not currently available for this field.",
        safeActions: ["reread_state_and_requirements"],
      },
    },
    conflict: conflictFailure(),
    cap: {
      ok: false,
      error: {
        code: "demo_change_limit",
        message:
          "That change was not saved. Continue the remaining application steps or start a new synthetic demo.",
        safeActions: [
          "use_visible_application",
          "start_new_synthetic_demo",
        ],
      },
    },
    notReady: {
      ok: false,
      error: {
        code: "not_ready_for_review",
        message: "The application is not ready for Review.",
        safeActions: ["use_visible_application"],
        blockers: [
          {
            code: "missing_evidence",
            field: "legal_name",
            message: "Required evidence is not linked.",
            action: "reread_state_and_requirements",
          },
        ],
      },
    },
    invalidated: {
      ok: false,
      error: {
        code: "review_invalidated",
        message: "That Review is no longer current.",
        safeActions: ["reread_state_and_requirements"],
      },
    },
  });
}

function mutateSnapshot(
  value: unknown,
  coordinate: "pageEpoch" | "applicationRevision" | "requirementsVersion" | "projectionSequence",
  next: number,
): unknown {
  const mutated = clone(value);
  snapshotRecord(mutated)[coordinate] = next;
  return mutated;
}

function resultWithDraft(result: unknown, draft: HumanDraftV1): unknown {
  const mutated = clone(result);
  snapshotRecord(mutated)["view"] = draft;
  return mutated;
}

function actionSchema(testCase: Readonly<{ request: HumanAction; context: ActionContext }>): ParseSchema {
  return humanActionResultSchema(testCase.request, testCase.context);
}

const TYPE_PROBE_IMPORTS = `
import type { z } from "zod";
import {
  applicationResultSchemaForRequest,
  humanActionResultSchema,
  receiptResultSchemaForRequest,
  type ApplicationRequest,
  type HumanAction,
  type ReceiptRequest,
} from "../../src/contracts/http.ts";
import {
  ConflictRequiresHumanFailureSchema,
  ConnectionUnavailableSchema,
  DemoChangeLimitFailureSchema,
  DemoTokenUnavailableSchema,
  EvidenceUnavailableFailureSchema,
  ExportUnavailableSchema,
  HumanNotReadyFailureSchema,
  InvalidRequestFailureSchema,
  MutationUnavailableSchema,
  ReadUnavailableSchema,
  RateLimitedFailureSchema,
  ReceiptUnavailableSchema,
  RequestReuseMismatchFailureSchema,
  ReviewInvalidatedFailureSchema,
  SessionExpiredFailureSchema,
  StartUnavailableFailureSchema,
  StalePageFailureSchema,
  StaleStateFailureSchema,
} from "../../src/contracts/outcomes.ts";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;
type IsNever<T> = [T] extends [never] ? true : false;
type IsUnknown<T> = IsAny<T> extends true
  ? false
  : unknown extends T
    ? [keyof T] extends [never]
      ? true
      : false
    : false;
type SuccessData<T> = T extends { ok: true; data: infer D } ? D : never;
type SuccessKind<T> = SuccessData<T> extends { kind: infer K } ? K : never;
type SuccessMode<T> = SuccessData<T> extends { mode: infer M } ? M : never;
type CurrentData<T> = Exclude<SuccessData<T>, { kind: "action_replayed" }>;
type CurrentKind<T> = CurrentData<T> extends { kind: infer K } ? K : never;
type CurrentAction<T> = CurrentData<T> extends infer D
  ? D extends { action: infer A }
    ? A
    : never
  : never;
type HistoricalData<T> = Extract<SuccessData<T>, { kind: "action_replayed" }>;
type HistoricalAction<T> = HistoricalData<T> extends { original: { action: infer A } } ? A : never;
type Failure<T> = Extract<T, { ok: false }>;
type ErrorCode<T> = T extends { ok: false; error: { code: infer C } } ? C : never;
const context = { storedOutcome: null, currentConsentRequestId: null } as const;
`;

const TYPE_APPLICATION_CASES = [
  ["challenge", `{ mode: "bootstrap_challenge" } as const`, "challenge", "snapshot"],
  ["takeover", `{ mode: "takeover", requestId: "00000000-0000-4000-8000-000000000001", expectedPageEpoch: 1, expectedApplicationRevision: 1, challenge: "challenge" } as const`, "takeover", "challenge"],
  ["snapshot", `{ mode: "snapshot" } as const`, "snapshot", "evidence_excerpt"],
  ["excerpt", `{ mode: "evidence_excerpt", claimHandle: "AAAAAAAAAAAAAAAAAAAAA0" } as const`, "evidence_excerpt", "takeover"],
] as const;

const TYPE_RECEIPT_CASES = [
  ["load", `{ mode: "load" } as const`, "load", "export_json"],
  ["json", `{ mode: "export_json" } as const`, "export_json", "prepare_print"],
  ["print", `{ mode: "prepare_print" } as const`, "prepare_print", "load"],
] as const;

const TYPE_HUMAN_CASES = [
  ["bind", `{ requestId: "00000000-0000-4000-8000-000000000011", expectedPageEpoch: 1, expectedApplicationRevision: 1, expectedRequirementsVersion: 1, action: "bind_evidence", field: "legal_name", claimHandle: "AAAAAAAAAAAAAAAAAAAAA0" } as const`, "bind_evidence", `"action_applied" | "no_change"`, "clear_evidence"],
  ["clear", `{ requestId: "00000000-0000-4000-8000-000000000012", expectedPageEpoch: 1, expectedApplicationRevision: 1, expectedRequirementsVersion: 1, action: "clear_evidence", field: "legal_name" } as const`, "clear_evidence", `"action_applied" | "no_change"`, "bind_evidence"],
  ["dependency", `{ requestId: "00000000-0000-4000-8000-000000000013", expectedPageEpoch: 1, expectedApplicationRevision: 1, expectedRequirementsVersion: 1, action: "clear_dependency", confirmed: true } as const`, "clear_dependency", `"action_applied" | "no_change"`, "save_email"],
  ["save", `{ requestId: "00000000-0000-4000-8000-000000000014", expectedPageEpoch: 1, expectedApplicationRevision: 1, expectedRequirementsVersion: 1, action: "save_email", value: "synthetic.applicant@example.test" } as const`, "save_email", `"action_applied" | "no_change"`, "declare_email"],
  ["declare", `{ requestId: "00000000-0000-4000-8000-000000000015", expectedPageEpoch: 1, expectedApplicationRevision: 1, expectedRequirementsVersion: 1, action: "declare_email" } as const`, "declare_email", `"action_applied" | "no_change"`, "resolve_income"],
  ["resolve", `{ requestId: "00000000-0000-4000-8000-000000000016", expectedPageEpoch: 1, expectedApplicationRevision: 1, expectedRequirementsVersion: 1, action: "resolve_income", claimHandle: "AAAAAAAAAAAAAAAAAAAAA7", reason: "more_recent" } as const`, "resolve_income", `"action_applied" | "no_change"`, "clear_income_resolution"],
  ["clear_income", `{ requestId: "00000000-0000-4000-8000-000000000017", expectedPageEpoch: 1, expectedApplicationRevision: 1, expectedRequirementsVersion: 1, action: "clear_income_resolution", confirmed: true } as const`, "clear_income_resolution", `"action_applied" | "no_change"`, "allow_assisted_access"],
  ["allow", `{ requestId: "00000000-0000-4000-8000-000000000018", expectedPageEpoch: 1, expectedApplicationRevision: 1, expectedRequirementsVersion: 1, action: "allow_assisted_access" } as const`, "allow_assisted_access", `"assistance_allowed" | "no_change"`, "revoke_assisted_access"],
  ["revoke", `{ requestId: "00000000-0000-4000-8000-000000000019", expectedPageEpoch: 1, expectedApplicationRevision: 2, expectedRequirementsVersion: 1, action: "revoke_assisted_access" } as const`, "revoke_assisted_access", `"assistance_revoked" | "no_change"`, "prepare_review"],
  ["prepare", `{ requestId: "00000000-0000-4000-8000-000000000020", expectedPageEpoch: 1, expectedApplicationRevision: 1, expectedRequirementsVersion: 1, action: "prepare_review" } as const`, "prepare_review", `"review_prepared"`, "return_to_draft"],
  ["return", `{ requestId: "00000000-0000-4000-8000-000000000021", expectedPageEpoch: 1, expectedApplicationRevision: 2, expectedRequirementsVersion: 1, action: "return_to_draft" } as const`, "return_to_draft", `"returned_to_draft"`, "prepare_review"],
] as const;

function typeProbeSource(): Readonly<{
  positive: string;
  negative: string;
  positiveMarkers: number;
  negativeMarkers: number;
}> {
  const declarations: string[] = [TYPE_PROBE_IMPORTS];
  declarations.push(
    `type ErrAChallenge = "session_expired" | "invalid_request" | "rate_limited" | "temporarily_unavailable";`,
    `type ErrABase = "session_expired" | "stale_page" | "stale_state" | "request_reuse_mismatch" | "invalid_request" | "rate_limited" | "temporarily_unavailable";`,
    `type ErrASnapshot = "session_expired" | "stale_page" | "invalid_request" | "rate_limited" | "temporarily_unavailable";`,
    `type ErrAExcerpt = ErrASnapshot | "evidence_unavailable";`,
    `type ErrApplicationAll = ErrABase | "evidence_unavailable";`,
    `type ErrReceipt = ErrASnapshot;`,
    `type ErrHContent = ErrABase | "demo_change_limit";`,
    `type ErrHResolve = ErrHContent | "evidence_unavailable";`,
    `type ErrHBindIncome = ErrHResolve | "conflict_requires_human";`,
    `type ErrHPrepare = ErrHContent | "not_ready_for_review";`,
    `type ErrHReturn = ErrHContent | "review_invalidated";`,
    `type ErrHumanAll = ErrHBindIncome | ErrHPrepare | ErrHReturn;`,
    `type FSession = z.output<typeof SessionExpiredFailureSchema>;`,
    `type FStalePage = z.output<typeof StalePageFailureSchema>;`,
    `type FStaleState = z.output<typeof StaleStateFailureSchema>;`,
    `type FReuse = z.output<typeof RequestReuseMismatchFailureSchema>;`,
    `type FInvalid = z.output<typeof InvalidRequestFailureSchema>;`,
    `type FRate = z.output<typeof RateLimitedFailureSchema>;`,
    `type FConnection = z.output<typeof ConnectionUnavailableSchema>;`,
    `type FRead = z.output<typeof ReadUnavailableSchema>;`,
    `type FEvidence = z.output<typeof EvidenceUnavailableFailureSchema>;`,
    `type FMutation = z.output<typeof MutationUnavailableSchema>;`,
    `type FConflict = z.output<typeof ConflictRequiresHumanFailureSchema>;`,
    `type FDemoLimit = z.output<typeof DemoChangeLimitFailureSchema>;`,
    `type FNotReady = z.output<typeof HumanNotReadyFailureSchema>;`,
    `type FInvalidated = z.output<typeof ReviewInvalidatedFailureSchema>;`,
    `type FReceipt = z.output<typeof ReceiptUnavailableSchema>;`,
    `type FExport = z.output<typeof ExportUnavailableSchema>;`,
    `type FStart = z.output<typeof StartUnavailableFailureSchema>;`,
    `type FDemoToken = z.output<typeof DemoTokenUnavailableSchema>;`,
    `type ExpectedAChallenge = FSession | FInvalid | FRate | FConnection;`,
    `type ExpectedATakeover = ExpectedAChallenge | FStalePage | FStaleState | FReuse;`,
    `type ExpectedASnapshot = FSession | FStalePage | FInvalid | FRate | FRead;`,
    `type ExpectedAExcerpt = ExpectedASnapshot | FEvidence;`,
    `type ExpectedReceiptLoad = FSession | FStalePage | FInvalid | FRate | FConnection | FReceipt;`,
    `type ExpectedReceiptExport = FSession | FStalePage | FInvalid | FRate | FConnection | FExport;`,
    `type ExpectedHBase = FSession | FStalePage | FStaleState | FReuse | FInvalid | FRate | FMutation;`,
    `type ExpectedHContent = ExpectedHBase | FDemoLimit;`,
    `type ExpectedHResolve = ExpectedHContent | FEvidence;`,
    `type ExpectedHBindIncome = ExpectedHResolve | FConflict;`,
    `type ExpectedHPrepare = ExpectedHContent | FNotReady;`,
    `type ExpectedHReturn = ExpectedHContent | FInvalidated;`,
    `type ExpectedBroadApplication = ExpectedAChallenge | ExpectedATakeover | ExpectedASnapshot | ExpectedAExcerpt;`,
    `type ExpectedBroadReceipt = ExpectedReceiptLoad | ExpectedReceiptExport;`,
    `type ExpectedBroadHuman = ExpectedHBindIncome | ExpectedHPrepare | ExpectedHReturn;`,
  );
  const positives: string[] = [];
  const negatives: string[] = [];
  let positiveMarkers = 0;
  let negativeMarkers = 0;
  const positive = (source: string): void => {
    positiveMarkers += 1;
    positives.push(`// POS:${positiveMarkers}\n${source}`);
  };
  const negative = (source: string): void => {
    negativeMarkers += 1;
    negatives.push(`// NEG:${negativeMarkers}\n${source}`);
  };
  const health = (alias: string): void => {
    positive(`type POS_${positiveMarkers + 1} = Assert<Equal<IsAny<${alias}>, false>>;`);
    positive(`type POS_${positiveMarkers + 1} = Assert<Equal<IsUnknown<${alias}>, false>>;`);
    positive(`type POS_${positiveMarkers + 1} = Assert<Equal<IsNever<${alias}>, false>>;`);
  };

  for (const [name, request, expected, wrong] of TYPE_APPLICATION_CASES) {
    declarations.push(
      `const app_${name} = applicationResultSchemaForRequest(${request});`,
      `type App_${name} = z.output<typeof app_${name}>;`,
    );
    health(`App_${name}`);
    positive(`type POS_${positiveMarkers + 1} = Assert<Equal<SuccessKind<App_${name}>, "${expected}">>;`);
    negative(`const NEG_${negativeMarkers + 1}: SuccessKind<App_${name}> = "${wrong}";`);
  }
  for (const [name, request, expected, wrong] of TYPE_RECEIPT_CASES) {
    declarations.push(
      `const receipt_${name} = receiptResultSchemaForRequest(${request});`,
      `type Receipt_${name} = z.output<typeof receipt_${name}>;`,
    );
    health(`Receipt_${name}`);
    positive(`type POS_${positiveMarkers + 1} = Assert<Equal<SuccessMode<Receipt_${name}>, "${expected}">>;`);
    negative(`const NEG_${negativeMarkers + 1}: SuccessMode<Receipt_${name}> = "${wrong}";`);
  }
  for (const [name, request, action, kinds, wrongAction] of TYPE_HUMAN_CASES) {
    declarations.push(
      `const human_${name} = humanActionResultSchema(${request}, context);`,
      `type Human_${name} = z.output<typeof human_${name}>;`,
    );
    health(`Human_${name}`);
    positive(`type POS_${positiveMarkers + 1} = Assert<Equal<CurrentKind<Human_${name}>, ${kinds}>>;`);
    positive(`type POS_${positiveMarkers + 1} = Assert<Equal<HistoricalAction<Human_${name}>, "${action}">>;`);
    positive(`type POS_${positiveMarkers + 1} = Assert<Equal<CurrentAction<Human_${name}>, "${action}">>;`);
    negative(`const NEG_${negativeMarkers + 1}: HistoricalAction<Human_${name}> = "${wrongAction}";`);
  }

  declarations.push(
    `const broadApplicationRequest = null as unknown as ApplicationRequest;`,
    `const broadReceiptRequest = null as unknown as ReceiptRequest;`,
    `const broadHumanRequest = null as unknown as HumanAction;`,
    `const broadApplication = applicationResultSchemaForRequest(broadApplicationRequest);`,
    `const broadReceipt = receiptResultSchemaForRequest(broadReceiptRequest);`,
    `const broadHuman = humanActionResultSchema(broadHumanRequest, context);`,
    `type BroadApplication = z.output<typeof broadApplication>;`,
    `type BroadReceipt = z.output<typeof broadReceipt>;`,
    `type BroadHuman = z.output<typeof broadHuman>;`,
    `declare const connectionUnavailable: z.output<typeof ConnectionUnavailableSchema>;`,
    `declare const exportUnavailable: z.output<typeof ExportUnavailableSchema>;`,
    `declare const mutationUnavailable: z.output<typeof MutationUnavailableSchema>;`,
    `declare const readUnavailable: z.output<typeof ReadUnavailableSchema>;`,
    `declare const receiptUnavailable: z.output<typeof ReceiptUnavailableSchema>;`,
    `declare const startUnavailable: z.output<typeof StartUnavailableFailureSchema>;`,
    `declare const demoTokenUnavailable: z.output<typeof DemoTokenUnavailableSchema>;`,
  );
  health("BroadApplication");
  health("BroadReceipt");
  health("BroadHuman");

  positive(`type POS_${positiveMarkers + 1} = Assert<Equal<"conflict_requires_human" extends ErrorCode<Human_bind> ? true : false, false>>;`);
  declarations.push(
    `const human_income = humanActionResultSchema({ requestId: "00000000-0000-4000-8000-000000000022", expectedPageEpoch: 1, expectedApplicationRevision: 1, expectedRequirementsVersion: 1, action: "bind_evidence", field: "annual_household_income", claimHandle: "AAAAAAAAAAAAAAAAAAAAA7" } as const, context);`,
    `type Human_income = z.output<typeof human_income>;`,
  );
  health("Human_income");
  positive(`type POS_${positiveMarkers + 1} = Assert<Equal<"conflict_requires_human" extends ErrorCode<Human_income> ? true : false, true>>;`);
  negative(`const NEG_${negativeMarkers + 1}: ErrorCode<Human_bind> = "conflict_requires_human";`);

  for (const [alias, expected] of [
    ["App_challenge", "ErrAChallenge"],
    ["App_takeover", "ErrABase"],
    ["App_snapshot", "ErrASnapshot"],
    ["App_excerpt", "ErrAExcerpt"],
    ["Receipt_load", "ErrReceipt"],
    ["Receipt_json", "ErrReceipt"],
    ["Receipt_print", "ErrReceipt"],
    ["Human_bind", "ErrHResolve"],
    ["Human_clear", "ErrHContent"],
    ["Human_dependency", "ErrHContent"],
    ["Human_save", "ErrHContent"],
    ["Human_declare", "ErrHContent"],
    ["Human_resolve", "ErrHResolve"],
    ["Human_clear_income", "ErrHContent"],
    ["Human_allow", "ErrHContent"],
    ["Human_revoke", "ErrHContent"],
    ["Human_prepare", "ErrHPrepare"],
    ["Human_return", "ErrHReturn"],
    ["Human_income", "ErrHBindIncome"],
    ["BroadApplication", "ErrApplicationAll"],
    ["BroadReceipt", "ErrReceipt"],
    ["BroadHuman", "ErrHumanAll"],
  ] as const) {
    positive(
      `type POS_${positiveMarkers + 1} = Assert<Equal<ErrorCode<${alias}>, ${expected}>>;`,
    );
  }

  for (const [alias, expected] of [
    ["App_challenge", "ExpectedAChallenge"],
    ["App_takeover", "ExpectedATakeover"],
    ["App_snapshot", "ExpectedASnapshot"],
    ["App_excerpt", "ExpectedAExcerpt"],
    ["Receipt_load", "ExpectedReceiptLoad"],
    ["Receipt_json", "ExpectedReceiptExport"],
    ["Receipt_print", "ExpectedReceiptExport"],
    ["Human_bind", "ExpectedHResolve"],
    ["Human_clear", "ExpectedHContent"],
    ["Human_dependency", "ExpectedHContent"],
    ["Human_save", "ExpectedHContent"],
    ["Human_declare", "ExpectedHContent"],
    ["Human_resolve", "ExpectedHResolve"],
    ["Human_clear_income", "ExpectedHContent"],
    ["Human_allow", "ExpectedHContent"],
    ["Human_revoke", "ExpectedHContent"],
    ["Human_prepare", "ExpectedHPrepare"],
    ["Human_return", "ExpectedHReturn"],
    ["Human_income", "ExpectedHBindIncome"],
    ["BroadApplication", "ExpectedBroadApplication"],
    ["BroadReceipt", "ExpectedBroadReceipt"],
    ["BroadHuman", "ExpectedBroadHuman"],
  ] as const) {
    positive(
      `type POS_${positiveMarkers + 1} = Assert<Equal<Failure<${alias}>, ${expected}>>;`,
    );
  }

  const failureLeaves = [
    ["session", `z.output<typeof SessionExpiredFailureSchema>`],
    ["stalePage", `z.output<typeof StalePageFailureSchema>`],
    ["staleState", `z.output<typeof StaleStateFailureSchema>`],
    ["reuse", `z.output<typeof RequestReuseMismatchFailureSchema>`],
    ["invalid", `z.output<typeof InvalidRequestFailureSchema>`],
    ["rate", `z.output<typeof RateLimitedFailureSchema>`],
    ["connection", `z.output<typeof ConnectionUnavailableSchema>`],
    ["read", `z.output<typeof ReadUnavailableSchema>`],
    ["evidence", `z.output<typeof EvidenceUnavailableFailureSchema>`],
    ["mutation", `z.output<typeof MutationUnavailableSchema>`],
    ["conflict", `z.output<typeof ConflictRequiresHumanFailureSchema>`],
    ["demoLimit", `z.output<typeof DemoChangeLimitFailureSchema>`],
    ["notReady", `z.output<typeof HumanNotReadyFailureSchema>`],
    ["invalidated", `z.output<typeof ReviewInvalidatedFailureSchema>`],
    ["receipt", `z.output<typeof ReceiptUnavailableSchema>`],
    ["export", `z.output<typeof ExportUnavailableSchema>`],
    ["start", `z.output<typeof StartUnavailableFailureSchema>`],
    ["demoToken", `z.output<typeof DemoTokenUnavailableSchema>`],
  ] as const;
  const applicationBase = ["session", "invalid", "rate"] as const;
  const receiptBase = ["session", "stalePage", "invalid", "rate", "connection"] as const;
  const humanBase = [
    "session",
    "stalePage",
    "staleState",
    "reuse",
    "invalid",
    "rate",
    "mutation",
  ] as const;
  const humanContent = [...humanBase, "demoLimit"] as const;
  const expectedFailureLeaves = [
    ["App_challenge", [...applicationBase, "connection"]],
    ["App_takeover", [...applicationBase, "stalePage", "staleState", "reuse", "connection"]],
    ["App_snapshot", [...applicationBase, "stalePage", "read"]],
    ["App_excerpt", [...applicationBase, "stalePage", "read", "evidence"]],
    ["Receipt_load", [...receiptBase, "receipt"]],
    ["Receipt_json", [...receiptBase, "export"]],
    ["Receipt_print", [...receiptBase, "export"]],
    ["Human_bind", [...humanContent, "evidence"]],
    ["Human_clear", humanContent],
    ["Human_dependency", humanContent],
    ["Human_save", humanContent],
    ["Human_declare", humanContent],
    ["Human_resolve", [...humanContent, "evidence"]],
    ["Human_clear_income", humanContent],
    ["Human_allow", humanContent],
    ["Human_revoke", humanContent],
    ["Human_prepare", [...humanContent, "notReady"]],
    ["Human_return", [...humanContent, "invalidated"]],
    ["Human_income", [...humanContent, "evidence", "conflict"]],
    ["BroadApplication", [
      "session",
      "stalePage",
      "staleState",
      "reuse",
      "invalid",
      "rate",
      "connection",
      "read",
      "evidence",
    ]],
    ["BroadReceipt", [...receiptBase, "receipt", "export"]],
    ["BroadHuman", [
      ...humanContent,
      "evidence",
      "conflict",
      "notReady",
      "invalidated",
    ]],
  ] as const;
  assert.equal(expectedFailureLeaves.length, 22);
  assert.equal(failureLeaves.length, 18);
  assert.equal(
    new Set(expectedFailureLeaves.map(([alias]) => alias)).size,
    expectedFailureLeaves.length,
  );
  const failureLeafNames = new Set<string>(
    failureLeaves.map(([leaf]) => leaf),
  );
  assert.equal(
    expectedFailureLeaves.reduce(
      (total, [, expectedLeaves]) => total + new Set(expectedLeaves).size,
      0,
    ),
    170,
  );
  for (const [alias, expectedLeaves] of expectedFailureLeaves) {
    const expected = new Set<string>(expectedLeaves);
    assert.equal(expected.size, expectedLeaves.length);
    assert.equal(
      [...expected].every((leaf) => failureLeafNames.has(leaf)),
      true,
    );
    for (const [leaf, leafType] of failureLeaves) {
      positive(
        `type POS_${positiveMarkers + 1} = Assert<Equal<${leafType} extends Failure<${alias}> ? true : false, ${expected.has(leaf) ? "true" : "false"}>>;`,
      );
    }
  }

  negative(`const NEG_${negativeMarkers + 1}: ErrorCode<App_challenge> = "stale_page";`);
  negative(`const NEG_${negativeMarkers + 1}: ErrorCode<App_takeover> = "evidence_unavailable";`);
  negative(`const NEG_${negativeMarkers + 1}: ErrorCode<App_snapshot> = "stale_state";`);
  negative(`const NEG_${negativeMarkers + 1}: ErrorCode<App_excerpt> = "stale_state";`);
  negative(`const NEG_${negativeMarkers + 1}: ErrorCode<Human_clear> = "evidence_unavailable";`);
  negative(`const NEG_${negativeMarkers + 1}: ErrorCode<Human_resolve> = "conflict_requires_human";`);
  negative(`const NEG_${negativeMarkers + 1}: ErrorCode<Human_income> = "not_ready_for_review";`);
  negative(`const NEG_${negativeMarkers + 1}: ErrorCode<Human_prepare> = "review_invalidated";`);
  negative(`const NEG_${negativeMarkers + 1}: ErrorCode<Human_return> = "not_ready_for_review";`);

  for (const [alias, wrongVariant] of [
    ["App_challenge", "readUnavailable"],
    ["App_takeover", "readUnavailable"],
    ["App_snapshot", "connectionUnavailable"],
    ["App_excerpt", "connectionUnavailable"],
    ["Receipt_load", "exportUnavailable"],
    ["Receipt_json", "receiptUnavailable"],
    ["Receipt_print", "receiptUnavailable"],
    ["Human_bind", "connectionUnavailable"],
    ["Human_clear", "connectionUnavailable"],
    ["Human_dependency", "connectionUnavailable"],
    ["Human_save", "connectionUnavailable"],
    ["Human_declare", "connectionUnavailable"],
    ["Human_resolve", "connectionUnavailable"],
    ["Human_clear_income", "connectionUnavailable"],
    ["Human_allow", "connectionUnavailable"],
    ["Human_revoke", "connectionUnavailable"],
    ["Human_prepare", "connectionUnavailable"],
    ["Human_return", "connectionUnavailable"],
    ["Human_income", "connectionUnavailable"],
    ["BroadApplication", "mutationUnavailable"],
    ["BroadReceipt", "mutationUnavailable"],
    ["BroadHuman", "connectionUnavailable"],
  ] as const) {
    negative(
      `const NEG_${negativeMarkers + 1}: Failure<${alias}> = ${wrongVariant};`,
    );
  }
  for (const [alias] of expectedFailureLeaves) {
    for (const wrongVariant of [
      "startUnavailable",
      "demoTokenUnavailable",
    ] as const) {
      negative(
        `const NEG_${negativeMarkers + 1}: Failure<${alias}> = ${wrongVariant};`,
      );
    }
  }

  const common = [...declarations, ...positives].join("\n");
  return {
    positive: common,
    negative: [common, ...negatives].join("\n"),
    positiveMarkers,
    negativeMarkers,
  };
}

function compileVirtual(source: string, suffix: string): readonly ts.Diagnostic[] {
  const configPath = resolve("tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    process.cwd(),
    { noEmit: true, incremental: false },
    configPath,
  );
  assert.deepEqual(parsed.errors, []);
  const virtualPath = resolve(
    `tests/contract/__g4e7_http_contract_${suffix}.ts`,
  );
  const originalHost = ts.createCompilerHost(parsed.options);
  const originalFileExists = originalHost.fileExists.bind(originalHost);
  const originalReadFile = originalHost.readFile.bind(originalHost);
  const originalGetSourceFile = originalHost.getSourceFile.bind(originalHost);
  originalHost.fileExists = (fileName) =>
    resolve(fileName) === virtualPath || originalFileExists(fileName);
  originalHost.readFile = (fileName) =>
    resolve(fileName) === virtualPath ? source : originalReadFile(fileName);
  originalHost.getSourceFile = (
    fileName,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) =>
    resolve(fileName) === virtualPath
      ? ts.createSourceFile(fileName, source, languageVersion, true)
      : originalGetSourceFile(
          fileName,
          languageVersion,
          onError,
          shouldCreateNewSourceFile,
        );
  const program = ts.createProgram({
    rootNames: [virtualPath],
    options: parsed.options,
    host: originalHost,
  });
  return ts.getPreEmitDiagnostics(program);
}

function diagnosticText(diagnostics: readonly ts.Diagnostic[]): string {
  return diagnostics
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      if (diagnostic.file === undefined || diagnostic.start === undefined) {
        return `TS${diagnostic.code}: ${message}`;
      }
      const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      return `${diagnostic.file.fileName}:${position.line + 1}:${position.character + 1} TS${diagnostic.code}: ${message}`;
    })
    .join("\n");
}

function applicationSuccessFixtures(): readonly Readonly<{
  mode: "bootstrap_challenge" | "takeover" | "snapshot" | "evidence_excerpt";
  request: z.input<typeof ApplicationRequestSchema>;
  result: unknown;
}>[] {
  const offSnapshot = draftSnapshot(makeDraft(), {
    pageEpoch: 1,
    applicationRevision: 1,
    requirementsVersion: 1,
    projectionSequence: 0,
  });
  return [
    {
      mode: "bootstrap_challenge",
      request: { mode: "bootstrap_challenge" },
      result: {
        ok: true,
        data: {
          kind: "challenge",
          pageEpoch: 1,
          applicationRevision: 1,
          challenge: "synthetic challenge",
          challengeExpiresAt: EXPIRES,
        },
      },
    },
    {
      mode: "takeover",
      request: {
        mode: "takeover",
        requestId: uuid(300),
        expectedPageEpoch: 0,
        expectedApplicationRevision: 0,
        challenge: "synthetic challenge",
      },
      result: {
        ok: true,
        data: { kind: "takeover", pageCapability: CAPABILITY, snapshot: offSnapshot },
      },
    },
    {
      mode: "snapshot",
      request: { mode: "snapshot" },
      result: { ok: true, data: { kind: "snapshot", snapshot: offSnapshot } },
    },
    {
      mode: "evidence_excerpt",
      request: { mode: "evidence_excerpt", claimHandle: handle(0) },
      result: {
        ok: true,
        data: {
          kind: "evidence_excerpt",
          meta: authority(1, 1, 1, 0),
          evidence: {
            claimHandle: handle(0),
            page: 1,
            excerpt: "Synthetic Applicant",
            title: "Synthetic Enrollment Record",
            kind: "legal_name",
            normalizedValue: "Synthetic Applicant",
          },
        },
      },
    },
  ];
}

function receiptSuccessFixtures(): readonly Readonly<{
  mode: "load" | "export_json" | "prepare_print";
  request: z.input<typeof ReceiptRequestSchema>;
  result: unknown;
}>[] {
  const acceptedReview = makeReview({ applicationRevision: 1, requirementsVersion: 1 });
  const delivery = {
    receipt: {
      schema: "citeapply-receipt-v1",
      receiptId: uuid(400),
      submittedAt: NOW,
      acceptedApplicationRevision: 1,
      acceptedReview,
    },
    expiresAt: EXPIRES,
    serverNow: NOW,
  };
  return (["load", "export_json", "prepare_print"] as const).map((mode) => ({
    mode,
    request: { mode },
    result: { ok: true, data: { mode, delivery } },
  }));
}

test("G4E.7 durable HTTP contract oracle", { concurrency: 1 }, async (suite) => {
  const currentCases: readonly CurrentCase[] = [
    ...HUMAN_ACTIONS.map((action) => canonicalCurrentCase(action)),
    ...CONTENT_ACTIONS.map((action) => canonicalCurrentCase(action, "no_change")),
    canonicalCurrentCase("allow_assisted_access", "no_change"),
    canonicalCurrentCase("revoke_assisted_access", "no_change"),
  ];
  const historicalCases = canonicalHistoricalCases();

  await suite.test("fixture sanity and non-vacuous cardinalities", () => {
    assert.equal(process.version, EXPECTED_NODE);
    assert.equal(ts.version, EXPECTED_TYPESCRIPT);
    assert.equal(CONTENT_ACTIONS.length, 7);
    assert.equal(HUMAN_ACTIONS.length, 11);
    assert.equal(EVIDENCE_FIELD_IDS.length, 7);
    assert.equal(ORDINARY_CLEAR_FIELD_IDS.length, 6);
    assert.equal(applicationSuccessFixtures().length, 4);
    assert.equal(receiptSuccessFixtures().length, 3);
    assert.equal(LOCKED_FAMILIES.length, 8);
    assert.equal(currentCases.length, 20);
    assert.equal(historicalCases.length, 24);
    assert.equal(new Set(HUMAN_ACTIONS).size, 11);
    assert.equal(new Set(LOCKED_FAMILIES).size, 8);

    mustParse(HumanDraftV1Schema, makeDraft());
    mustParse(HumanDraftV1Schema, makeDraft({ packet: "conflict" }));
    mustParse(HumanReviewV1Schema, makeReview({ applicationRevision: 1, requirementsVersion: 1 }));
    mustParse(
      HumanSnapshotV1Schema,
      draftSnapshot(makeDraft(), {
        pageEpoch: 1,
        applicationRevision: 1,
        requirementsVersion: 1,
        projectionSequence: 0,
      }),
    );
    for (const testCase of [...currentCases, ...historicalCases]) {
      const parsed = actionSchema(testCase).safeParse(testCase.result);
      assert.equal(
        parsed.success,
        true,
        parsed.success
          ? undefined
          : `${testCase.label}: ${JSON.stringify(parsed.error.issues)}`,
      );
    }
  });

  await suite.test("1 requested action and field pairing", () => {
    const actionCases = HUMAN_ACTIONS.map((action) => canonicalCurrentCase(action));
    assert.equal(actionCases.length, 11);
    for (const requestCase of actionCases) {
      const schema = actionSchema(requestCase);
      for (const resultCase of actionCases) {
        const label = `action-${requestCase.action}-result-${resultCase.action}`;
        if (requestCase.action === resultCase.action) {
          accept(1, label, schema, resultCase.result);
        } else {
          reject(1, label, schema, resultCase.result);
        }
      }
    }

    for (const action of CONTENT_ACTIONS) {
      const noChange = canonicalCurrentCase(action, "no_change");
      accept(
        1,
        `no-change-${action}-exact-postcondition-control`,
        actionSchema(noChange),
        noChange.result,
      );
      let invalidDraft: HumanDraftV1;
      switch (action) {
        case "bind_evidence":
          invalidDraft = draftForClear("legal_name");
          break;
        case "clear_evidence":
        case "clear_dependency":
          invalidDraft = makeDraft();
          break;
        case "save_email":
          invalidDraft = draftForSavedEmail(
            "different.synthetic@example.test",
          );
          break;
        case "declare_email":
          invalidDraft = draftForSavedEmail();
          break;
        case "resolve_income":
          invalidDraft = draftForResolvedIncome(
            handle(7),
            "corrected_record",
          );
          break;
        case "clear_income_resolution":
          invalidDraft = makeDraft({ packet: "conflict" });
          break;
      }
      const invalidNoChange = resultWithDraft(
        noChange.result,
        invalidDraft,
      );
      mustParse(ActionSuccessSchema, invalidNoChange);
      reject(
        1,
        `no-change-${action}-invalid-postcondition`,
        actionSchema(noChange),
        invalidNoChange,
      );
    }

    for (const field of EVIDENCE_FIELD_IDS) {
      const correct = canonicalCurrentCase("bind_evidence", "effect", { field });
      accept(1, `bind-${field}-exact`, actionSchema(correct), correct.result);
      const wrongHandle = handle((FIELD_HANDLE_INDEX[field] + 1) % 8);
      const wrongRequest = makeRequest("bind_evidence", { field, claimHandle: wrongHandle });
      reject(
        1,
        `bind-${field}-wrong-handle`,
        humanActionResultSchema(wrongRequest, correct.context),
        correct.result,
      );
      const assistedOrigin = clone(correct.result);
      const draft = asRecord(snapshotRecord(assistedOrigin)["view"]);
      const fields = draft["fields"];
      assert.ok(Array.isArray(fields));
      asRecord(fields[FIELD_IDS.indexOf(field)])["origin"] = "assisted";
      mustParse(ActionSuccessSchema, assistedOrigin);
      reject(
        1,
        `bind-${field}-effect-assisted-origin`,
        actionSchema(correct),
        assistedOrigin,
      );
    }

    const supportedIncomeBind = canonicalCurrentCase(
      "bind_evidence",
      "effect",
      { field: "annual_household_income", claimHandle: handle(7) },
    );
    mustParse(ActionSuccessSchema, supportedIncomeBind.result);
    reject(
      1,
      "bind-supported-income-corroborating-handle-is-not-primary",
      humanActionResultSchema(
        makeRequest("bind_evidence", {
          field: "annual_household_income",
          claimHandle: handle(6),
        }),
        supportedIncomeBind.context,
      ),
      supportedIncomeBind.result,
    );

    const supportedIncomeBindNoChange = canonicalCurrentCase(
      "bind_evidence",
      "no_change",
      { field: "annual_household_income", claimHandle: handle(7) },
    );
    accept(
      1,
      "bind-supported-income-no-change-primary-handle",
      actionSchema(supportedIncomeBindNoChange),
      supportedIncomeBindNoChange.result,
    );
    mustParse(ActionSuccessSchema, supportedIncomeBindNoChange.result);
    reject(
      1,
      "bind-supported-income-no-change-rejects-corroborating-handle-request",
      humanActionResultSchema(
        makeRequest("bind_evidence", {
          field: "annual_household_income",
          claimHandle: handle(6),
        }),
        supportedIncomeBindNoChange.context,
      ),
      supportedIncomeBindNoChange.result,
    );

    const clearCases = ORDINARY_CLEAR_FIELD_IDS.map((field) =>
      canonicalCurrentCase("clear_evidence", "effect", { field }),
    );
    assert.equal(clearCases.length, 6);
    for (const requestCase of clearCases) {
      for (const resultCase of clearCases) {
        const requestField = (requestCase.request as Extract<HumanAction, { action: "clear_evidence" }>).field;
        const resultField = (resultCase.request as Extract<HumanAction, { action: "clear_evidence" }>).field;
        const label = `clear-${requestField}-result-${resultField}`;
        if (requestField === resultField) {
          accept(1, label, actionSchema(requestCase), resultCase.result);
        } else {
          reject(1, label, actionSchema(requestCase), resultCase.result);
        }
      }
    }

    const clearIncomeEvidence = canonicalCurrentCase(
      "clear_evidence",
      "effect",
      { field: "annual_household_income" },
    );
    const clearIncomeInConflictPacket = resultWithDraft(
      clearIncomeEvidence.result,
      makeDraft({
        packet: "conflict",
        overrides: {
          annual_household_income: missing("annual_household_income"),
        },
      }),
    );
    mustParse(ActionSuccessSchema, clearIncomeInConflictPacket);
    reject(
      1,
      "clear-income-evidence-requires-supported-packet",
      actionSchema(clearIncomeEvidence),
      clearIncomeInConflictPacket,
    );

    const save = canonicalCurrentCase("save_email");
    accept(1, "save-email-exact-value", actionSchema(save), save.result);
    const wrongEmail = makeRequest("save_email", {
      value: "different.synthetic@example.test",
    });
    reject(
      1,
      "save-email-wrong-value",
      humanActionResultSchema(wrongEmail, save.context),
      save.result,
    );

    const saveStillDeclared = resultWithDraft(save.result, makeDraft());
    mustParse(ActionSuccessSchema, saveStillDeclared);
    reject(
      1,
      "save-effect-cannot-remain-declared",
      actionSchema(save),
      saveStillDeclared,
    );
    const saveAssistedOrigin = resultWithDraft(
      save.result,
      makeDraft({
        overrides: {
          preferred_contact_email: {
            field: "preferred_contact_email",
            active: true,
            status: "needs_declaration",
            origin: "assisted",
            value: EMAIL,
          },
        },
      }),
    );
    mustParse(ActionSuccessSchema, saveAssistedOrigin);
    reject(
      1,
      "save-effect-requires-manual-origin",
      actionSchema(save),
      saveAssistedOrigin,
    );
    const saveNoChange = canonicalCurrentCase("save_email", "no_change");
    const saveNoChangeDeclaredAssisted = resultWithDraft(
      saveNoChange.result,
      makeDraft({
        overrides: {
          preferred_contact_email: {
            field: "preferred_contact_email",
            active: true,
            status: "ready",
            origin: "assisted",
            value: EMAIL,
            declaredByApplicant: true,
          },
        },
      }),
    );
    accept(
      1,
      "save-no-change-preserves-declared-assisted-email",
      actionSchema(saveNoChange),
      saveNoChangeDeclaredAssisted,
    );

    const declareEmail = canonicalCurrentCase("declare_email");
    const declareStillUndeclared = resultWithDraft(
      declareEmail.result,
      draftForSavedEmail(),
    );
    mustParse(ActionSuccessSchema, declareStillUndeclared);
    reject(
      1,
      "declare-email-remains-undeclared",
      actionSchema(declareEmail),
      declareStillUndeclared,
    );
    const declareAssistedEmail = resultWithDraft(
      declareEmail.result,
      makeDraft({
        overrides: {
          preferred_contact_email: {
            field: "preferred_contact_email",
            active: true,
            status: "ready",
            origin: "assisted",
            value: EMAIL,
            declaredByApplicant: true,
          },
        },
      }),
    );
    accept(
      1,
      "declare-email-preserves-assisted-origin",
      actionSchema(declareEmail),
      declareAssistedEmail,
    );

    for (const reason of [
      "more_recent",
      "corrected_record",
      "confirmed_for_application",
    ] as const) {
      for (const claimHandle of [handle(6), handle(7)] as const) {
        const resolved = canonicalCurrentCase("resolve_income", "effect", {
          reason,
          claimHandle,
        });
        accept(
          1,
          `resolve-${reason}-${claimHandle}`,
          actionSchema(resolved),
          resolved.result,
        );
        const wrongReason = reason === "more_recent" ? "corrected_record" : "more_recent";
        const wrongRequest = makeRequest("resolve_income", {
          claimHandle,
          reason: wrongReason,
        });
        reject(
          1,
          `resolve-${reason}-${claimHandle}-wrong-reason`,
          humanActionResultSchema(wrongRequest, resolved.context),
          resolved.result,
        );
        const oppositeHandle =
          claimHandle === handle(6) ? handle(7) : handle(6);
        const wrongHandleRequest = makeRequest("resolve_income", {
          claimHandle: oppositeHandle,
          reason,
        });
        reject(
          1,
          `resolve-${reason}-${claimHandle}-wrong-handle`,
          humanActionResultSchema(wrongHandleRequest, resolved.context),
          resolved.result,
        );
      }
    }

    const resolvedIncomeNoChange = canonicalCurrentCase(
      "resolve_income",
      "no_change",
      { claimHandle: handle(6), reason: "more_recent" },
    );
    accept(
      1,
      "resolve-no-change-exact-chosen-handle",
      actionSchema(resolvedIncomeNoChange),
      resolvedIncomeNoChange.result,
    );
    mustParse(ActionSuccessSchema, resolvedIncomeNoChange.result);
    reject(
      1,
      "resolve-no-change-rejects-opposite-request-handle",
      humanActionResultSchema(
        makeRequest("resolve_income", {
          claimHandle: handle(7),
          reason: "more_recent",
        }),
        resolvedIncomeNoChange.context,
      ),
      resolvedIncomeNoChange.result,
    );

    const dependency = canonicalCurrentCase("bind_evidence", "effect", {
      field: "dependency",
    });
    const partialActivation = clone(dependency.result);
    snapshotRecord(partialActivation)["view"] = makeDraft({
      overrides: { guardian_name: missing("guardian_name") },
    });
    reject(
      1,
      "dependency-effect-partial-activation",
      actionSchema(dependency),
      partialActivation,
    );
    const oppositePartialActivation = clone(dependency.result);
    snapshotRecord(oppositePartialActivation)["view"] = makeDraft({
      overrides: { household_size: missing("household_size") },
    });
    reject(
      1,
      "dependency-effect-opposite-partial-activation",
      actionSchema(dependency),
      oppositePartialActivation,
    );
    const dependencyNoChange = canonicalCurrentCase(
      "bind_evidence",
      "no_change",
      { field: "dependency" },
    );
    const dependencyNoChangeAssisted = resultWithDraft(
      dependencyNoChange.result,
      makeDraft({
        overrides: {
          dependency: {
            field: "dependency",
            active: true,
            status: "ready",
            origin: "assisted",
            value: true,
            bindings: [binding("dependency")],
          },
        },
      }),
    );
    accept(
      1,
      "dependency-no-change-preserves-assisted-completed-branch",
      actionSchema(dependencyNoChange),
      dependencyNoChangeAssisted,
    );

    const clearDependency = canonicalCurrentCase("clear_dependency");
    const incompleteClosure = clone(clearDependency.result);
    snapshotRecord(incompleteClosure)["view"] = makeDraft();
    reject(
      1,
      "clear-dependency-incomplete-closure",
      actionSchema(clearDependency),
      incompleteClosure,
    );

    const clearIncome = canonicalCurrentCase("clear_income_resolution");
    accept(1, "clear-income-conflict", actionSchema(clearIncome), clearIncome.result);
    const resolvedInstead = clone(clearIncome.result);
    snapshotRecord(resolvedInstead)["view"] = makeDraft({ packet: "conflict" });
    reject(
      1,
      "clear-income-still-resolved",
      actionSchema(clearIncome),
      resolvedInstead,
    );

    const historicalFieldPairs: readonly Readonly<{
      label: string;
      row: HistoricalCase;
      request: HumanAction;
    }>[] = [
      {
        label: "historical-bind-applied-wrong-request-field",
        row: historicalCases.find(
          ({ label }) => label === "bind_evidence-stored-effect",
        )!,
        request: makeRequest("bind_evidence", {
          field: "student_id",
          claimHandle: handle(1),
        }),
      },
      {
        label: "historical-clear-applied-wrong-request-field",
        row: historicalCases.find(
          ({ label }) => label === "clear_evidence-stored-effect",
        )!,
        request: makeRequest("clear_evidence", { field: "student_id" }),
      },
      {
        label: "historical-bind-unavailable-wrong-request-field",
        row: historicalCases.find(
          ({ label }) => label === "bind-evidence-unavailable",
        )!,
        request: makeRequest("bind_evidence", {
          field: "student_id",
          claimHandle: handle(1),
        }),
      },
    ];
    for (const row of historicalFieldPairs) {
      mustParse(HistoricalActionReplayV1Schema, row.row.result);
      reject(
        1,
        row.label,
        humanActionResultSchema(row.request, {
          storedOutcome: null,
          currentConsentRequestId: null,
        }),
        row.row.result,
      );
    }
  });

  await suite.test("2 effect no-op and refusal version deltas", () => {
    assert.equal(currentCases.length, 20);
    const highCoordinateCase = (
      testCase: CurrentCase,
      index: number,
    ): CurrentCase => {
      const base = {
        requestId: uuid(700 + index),
        applicationRevision: 10,
        requirementsVersion: 3,
      } as const;
      switch (testCase.request.action) {
        case "bind_evidence":
          return canonicalCurrentCase(
            "bind_evidence",
            testCase.variant,
            {
              ...base,
              field: testCase.request.field,
              claimHandle: testCase.request.claimHandle,
            },
          );
        case "clear_evidence":
          return canonicalCurrentCase(
            "clear_evidence",
            testCase.variant,
            { ...base, field: testCase.request.field },
          );
        case "save_email":
          return canonicalCurrentCase("save_email", testCase.variant, {
            ...base,
            value: testCase.request.value,
          });
        case "resolve_income":
          return canonicalCurrentCase("resolve_income", testCase.variant, {
            ...base,
            claimHandle: testCase.request.claimHandle,
            reason: testCase.request.reason,
          });
        case "clear_dependency":
        case "declare_email":
        case "clear_income_resolution":
        case "allow_assisted_access":
        case "revoke_assisted_access":
        case "prepare_review":
        case "return_to_draft":
          return canonicalCurrentCase(
            testCase.request.action,
            testCase.variant,
            base,
          );
      }
    };
    for (const [index, testCase] of currentCases.entries()) {
      const deltaCase = highCoordinateCase(testCase, index);
      const schema = actionSchema(deltaCase);
      accept(2, `${testCase.label}-exact-delta`, schema, deltaCase.result);
      const snapshot = snapshotRecord(deltaCase.result);
      const currentApplication = snapshot["applicationRevision"] as number;
      const currentRequirements = snapshot["requirementsVersion"] as number;
      const wrongApplication = clone(deltaCase.result);
      snapshotRecord(wrongApplication)["applicationRevision"] =
        currentApplication + (testCase.variant === "effect" ? -1 : 1);
      if (testCase.variant === "no_change") {
        snapshotRecord(wrongApplication)["projectionSequence"] =
          (snapshot["projectionSequence"] as number) + 1;
      }
      mustParse(ActionSuccessSchema, wrongApplication);
      reject(
        2,
        `${testCase.label}-wrong-application-delta`,
        schema,
        wrongApplication,
      );
      const wrongRequirements = mutateSnapshot(
        deltaCase.result,
        "requirementsVersion",
        currentRequirements + 1,
      );
      mustParse(ActionSuccessSchema, wrongRequirements);
      reject(
        2,
        `${testCase.label}-wrong-requirements-delta`,
        schema,
        wrongRequirements,
      );
      if (testCase.variant === "no_change") {
        const pageEpoch = snapshot["pageEpoch"] as number;
        reject(
          2,
          `${testCase.label}-missing-stable-row`,
          schema,
          mutateSnapshot(
            deltaCase.result,
            "projectionSequence",
            currentApplication - pageEpoch,
          ),
        );
      }
    }

    const currentDependencyBind = canonicalCurrentCase(
      "bind_evidence",
      "effect",
      {
        requestId: uuid(730),
        applicationRevision: 10,
        requirementsVersion: 3,
        field: "dependency",
        claimHandle: handle(3),
      },
    );
    const currentDependencySchema = actionSchema(currentDependencyBind);
    accept(
      2,
      "current-bind-dependency-exact-version-successor",
      currentDependencySchema,
      currentDependencyBind.result,
    );
    for (const [coordinate, next] of [
      ["applicationRevision", 10],
      ["requirementsVersion", 5],
    ] as const) {
      const wrong = mutateSnapshot(
        currentDependencyBind.result,
        coordinate,
        next,
      );
      mustParse(ActionSuccessSchema, wrong);
      reject(
        2,
        `current-bind-dependency-wrong-${coordinate}`,
        currentDependencySchema,
        wrong,
      );
    }

    assert.equal(historicalCases.length, 24);
    const withWrongStoredApplication = (
      testCase: HistoricalCase,
    ): unknown => {
      const mutated = clone(testCase.result);
      const original = originalRecord(mutated);
      const versions = asRecord(original["versions"]);
      const applicationRevision = versions["applicationRevision"] as number;
      assert.ok(applicationRevision > 0);
      versions["applicationRevision"] = applicationRevision - 1;
      if (original["outcome"] === "review_prepared") {
        asRecord(asRecord(mutated)["data"])["snapshot"] = draftSnapshot(
          makeDraft(),
          {
            pageEpoch: testCase.request.expectedPageEpoch,
            applicationRevision,
            requirementsVersion: versions["requirementsVersion"] as number,
            projectionSequence:
              applicationRevision - testCase.request.expectedPageEpoch,
          },
        );
      }
      return mutated;
    };
    const withWrongStoredRequirements = (
      testCase: HistoricalCase,
    ): unknown => {
      const mutated = clone(testCase.result);
      const original = originalRecord(mutated);
      const versions = asRecord(original["versions"]);
      const originalApplication = versions["applicationRevision"] as number;
      const originalRequirements = versions["requirementsVersion"] as number;
      const isDependencyEffect =
        original["outcome"] === "action_applied" &&
        original["action"] === "clear_dependency";
      const nextRequirements = isDependencyEffect
        ? originalRequirements - 1
        : originalRequirements + 1;
      assert.ok(nextRequirements >= 1);
      versions["requirementsVersion"] = nextRequirements;
      if (original["outcome"] === "review_prepared") {
        asRecord(asRecord(mutated)["data"])["snapshot"] = draftSnapshot(
          makeDraft(),
          {
            pageEpoch: testCase.request.expectedPageEpoch,
            applicationRevision: originalApplication + 1,
            requirementsVersion: nextRequirements,
            projectionSequence:
              originalApplication +
              1 -
              testCase.request.expectedPageEpoch,
          },
        );
      } else if (!testCase.effect) {
        const applicationRevision = Math.max(
          snapshotRecord(mutated)["applicationRevision"] as number,
          testCase.request.expectedPageEpoch + nextRequirements - 1,
        );
        asRecord(asRecord(mutated)["data"])["snapshot"] = draftSnapshot(
          makeDraft(),
          {
            pageEpoch: testCase.request.expectedPageEpoch,
            applicationRevision,
            requirementsVersion: nextRequirements,
            projectionSequence:
              applicationRevision -
              testCase.request.expectedPageEpoch +
              1,
          },
        );
      } else {
        snapshotRecord(mutated)["requirementsVersion"] = nextRequirements;
      }
      return mutated;
    };
    for (const testCase of historicalCases) {
      const schema = actionSchema(testCase);
      accept(2, `${testCase.label}-exact-stored-delta`, schema, testCase.result);
      const wrongApplication = withWrongStoredApplication(testCase);
      mustParse(HistoricalActionReplayV1Schema, wrongApplication);
      reject(
        2,
        `${testCase.label}-wrong-stored-application`,
        schema,
        wrongApplication,
      );
      const wrongRequirements = withWrongStoredRequirements(testCase);
      mustParse(HistoricalActionReplayV1Schema, wrongRequirements);
      reject(
        2,
        `${testCase.label}-wrong-stored-requirements`,
        schema,
        wrongRequirements,
      );
      if (!testCase.effect) {
        const snapshot = snapshotRecord(testCase.result);
        const pageEpoch = snapshot["pageEpoch"] as number;
        const applicationRevision = snapshot["applicationRevision"] as number;
        reject(
          2,
          `${testCase.label}-missing-committed-stable-row`,
          schema,
          mutateSnapshot(
            testCase.result,
            "projectionSequence",
            applicationRevision - pageEpoch,
          ),
        );
      }
    }

    const historicalDependencyRequest = makeRequest("bind_evidence", {
      field: "dependency",
      claimHandle: handle(3),
    });
    const historicalDependency = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: {
          outcome: "action_applied",
          action: "bind_evidence",
          fields: ["dependency"],
          versions: { applicationRevision: 2, requirementsVersion: 2 },
        },
        snapshot: draftSnapshot(draftForBind("dependency"), {
          pageEpoch: 1,
          applicationRevision: 2,
          requirementsVersion: 2,
          projectionSequence: 1,
        }),
      },
    };
    const historicalDependencySchema = humanActionResultSchema(
      historicalDependencyRequest,
      { storedOutcome: null, currentConsentRequestId: null },
    );
    accept(
      2,
      "historical-bind-dependency-requirements-successor",
      historicalDependencySchema,
      historicalDependency,
    );
    const historicalDependencyWrongRequirements = clone(
      historicalDependency,
    );
    asRecord(
      originalRecord(historicalDependencyWrongRequirements)["versions"],
    )["requirementsVersion"] = 1;
    snapshotRecord(historicalDependencyWrongRequirements)[
      "requirementsVersion"
    ] = 1;
    mustParse(
      HistoricalActionReplayV1Schema,
      historicalDependencyWrongRequirements,
    );
    reject(
      2,
      "historical-bind-dependency-missing-requirements-successor",
      historicalDependencySchema,
      historicalDependencyWrongRequirements,
    );

    const directFailure = {
      ok: false,
      error: {
        code: "invalid_request",
        message: "The request is not valid.",
        safeActions: ["use_visible_application"],
      },
    };
    for (const action of HUMAN_ACTIONS) {
      const request = makeRequest(action, {
        applicationRevision:
          action === "return_to_draft" || action === "revoke_assisted_access" ? 2 : 1,
      });
      assert.notEqual(request.requestId, DIFFERENT_CONSENT_ID);
      accept(
        2,
        `direct-value-free-failure-${action}`,
        humanActionResultSchema(request, {
          storedOutcome: null,
          currentConsentRequestId: null,
        }),
        directFailure,
      );
      accept(
        2,
        `direct-value-free-failure-active-consent-${action}`,
        humanActionResultSchema(request, {
          storedOutcome: null,
          currentConsentRequestId: DIFFERENT_CONSENT_ID,
        }),
        directFailure,
      );
    }
  });

  await suite.test("3 current and historical causal coordinates", () => {
    const snapshotSchema = applicationResultSchemaForRequest({ mode: "snapshot" });
    const wrap = (snapshot: unknown): unknown => ({
      ok: true,
      data: { kind: "snapshot", snapshot },
    });
    const currentCoordinates: readonly Readonly<{
      label: string;
      snapshot: unknown;
    }>[] = [
      {
        label: "draft-off-floor-zero",
        snapshot: draftSnapshot(makeDraft(), { pageEpoch: 1, applicationRevision: 1, requirementsVersion: 1, projectionSequence: 0 }),
      },
      {
        label: "draft-allowed-floor-one",
        snapshot: draftSnapshot(makeDraft({ assistance: "allowed" }), { pageEpoch: 1, applicationRevision: 2, requirementsVersion: 1, projectionSequence: 1 }),
      },
      {
        label: "review-floor-one",
        snapshot: reviewSnapshot(2, 1, 1, 1, { applicationRevision: 1, requirementsVersion: 1 }),
      },
      {
        label: "submitted-floor-two",
        snapshot: submittedSnapshot(3, 1, 1, 2),
      },
    ];
    for (const row of currentCoordinates) {
      accept(3, row.label, snapshotSchema, wrap(row.snapshot));
    }

    const baseline = wrap(currentCoordinates[0]!.snapshot);
    const pageEpochZeroAuthority = authority(0, 0, 1, 0);
    const pageEpochZero = wrap({
      ...pageEpochZeroAuthority,
      stage: "draft",
      view: makeDraft(),
    });
    mustParse(AuthorityMetaV1Schema, pageEpochZeroAuthority);
    reject(3, "page-epoch-zero", snapshotSchema, pageEpochZero);
    reject(3, "application-before-page", snapshotSchema, mutateSnapshot(baseline, "pageEpoch", 2));
    reject(3, "requirements-exceed-revisions", snapshotSchema, mutateSnapshot(baseline, "requirementsVersion", 2));
    const oneRevision = wrap(
      draftSnapshot(makeDraft(), { pageEpoch: 1, applicationRevision: 2, requirementsVersion: 1, projectionSequence: 1 }),
    );
    reject(3, "revision-exceeds-projection", snapshotSchema, mutateSnapshot(oneRevision, "projectionSequence", 0));
    reject(3, "projection-over-public-cap", snapshotSchema, mutateSnapshot(oneRevision, "projectionSequence", 129));
    reject(
      3,
      "allowed-without-nonrequirements-effect",
      snapshotSchema,
      wrap(draftSnapshot(makeDraft({ assistance: "allowed" }), { pageEpoch: 1, applicationRevision: 1, requirementsVersion: 1, projectionSequence: 0 })),
    );
    reject(
      3,
      "review-without-nonrequirements-effect",
      snapshotSchema,
      wrap(reviewSnapshot(1, 1, 1, 0, { applicationRevision: 0, requirementsVersion: 1 })),
    );
    reject(
      3,
      "submitted-with-only-one-nonrequirements-effect",
      snapshotSchema,
      wrap(submittedSnapshot(2, 1, 1, 1)),
    );

    const invalidCurrentPrestate = canonicalCurrentCase(
      "bind_evidence",
      "effect",
      { pageEpoch: 2, applicationRevision: 1, requirementsVersion: 1 },
    );
    mustParse(ActionSuccessSchema, invalidCurrentPrestate.result);
    reject(
      3,
      "current-request-application-before-page",
      actionSchema(invalidCurrentPrestate),
      invalidCurrentPrestate.result,
    );

    const invalidCurrentRequirementsPrestate = canonicalCurrentCase(
      "bind_evidence",
      "effect",
      { pageEpoch: 1, applicationRevision: 1, requirementsVersion: 2 },
    );
    mustParse(ActionSuccessSchema, invalidCurrentRequirementsPrestate.result);
    reject(
      3,
      "current-request-requirements-before-revision",
      actionSchema(invalidCurrentRequirementsPrestate),
      invalidCurrentRequirementsPrestate.result,
    );

    const currentPageMismatchCase = canonicalCurrentCase("bind_evidence");
    const currentPageMismatch = mutateSnapshot(
      currentPageMismatchCase.result,
      "pageEpoch",
      2,
    );
    mustParse(ActionSuccessSchema, currentPageMismatch);
    reject(
      3,
      "current-nonallow-result-page-mismatch",
      actionSchema(currentPageMismatchCase),
      currentPageMismatch,
    );

    const invalidHistoricalRequest = makeRequest("bind_evidence", {
      pageEpoch: 1,
      applicationRevision: 1,
      requirementsVersion: 2,
    });
    const invalidHistoricalPrestate = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: {
          outcome: "action_applied",
          action: "bind_evidence",
          fields: ["legal_name"],
          versions: { applicationRevision: 2, requirementsVersion: 2 },
        },
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 2,
          requirementsVersion: 2,
          projectionSequence: 1,
        }),
      },
    };
    mustParse(HistoricalActionReplayV1Schema, invalidHistoricalPrestate);
    reject(
      3,
      "historical-request-requirements-before-revision",
      humanActionResultSchema(invalidHistoricalRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      invalidHistoricalPrestate,
    );

    const invalidHistoricalApplicationRequest = makeRequest("bind_evidence", {
      pageEpoch: 2,
      applicationRevision: 1,
      requirementsVersion: 1,
    });
    const invalidHistoricalApplicationPrestate = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: {
          outcome: "action_applied",
          action: "bind_evidence",
          fields: ["legal_name"],
          versions: { applicationRevision: 2, requirementsVersion: 1 },
        },
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 2,
          applicationRevision: 2,
          requirementsVersion: 1,
          projectionSequence: 1,
        }),
      },
    };
    mustParse(
      HistoricalActionReplayV1Schema,
      invalidHistoricalApplicationPrestate,
    );
    reject(
      3,
      "historical-request-application-before-page",
      humanActionResultSchema(invalidHistoricalApplicationRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      invalidHistoricalApplicationPrestate,
    );

    const historicalPageRequest = makeRequest("bind_evidence");
    const historicalPageMismatch = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: {
          outcome: "action_applied",
          action: "bind_evidence",
          fields: ["legal_name"],
          versions: { applicationRevision: 2, requirementsVersion: 1 },
        },
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 2,
          applicationRevision: 2,
          requirementsVersion: 1,
          projectionSequence: 1,
        }),
      },
    };
    mustParse(HistoricalActionReplayV1Schema, historicalPageMismatch);
    reject(
      3,
      "historical-nonallow-result-page-mismatch",
      humanActionResultSchema(historicalPageRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      historicalPageMismatch,
    );

    const invalidCurrentReturn = canonicalCurrentCase(
      "return_to_draft",
      "effect",
      { pageEpoch: 1, applicationRevision: 1, requirementsVersion: 1 },
    );
    mustParse(ActionSuccessSchema, invalidCurrentReturn.result);
    reject(
      3,
      "current-return-without-review-margin",
      actionSchema(invalidCurrentReturn),
      invalidCurrentReturn.result,
    );

    const invalidHistoricalReturnRequest = makeRequest("return_to_draft", {
      pageEpoch: 1,
      applicationRevision: 1,
      requirementsVersion: 1,
    });
    const invalidHistoricalReturn = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: {
          outcome: "returned_to_draft",
          action: "return_to_draft",
          invalidatedReviewId: REVIEW_ID,
          versions: { applicationRevision: 2, requirementsVersion: 1 },
        },
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 2,
          requirementsVersion: 1,
          projectionSequence: 1,
        }),
      },
    };
    mustParse(HistoricalActionReplayV1Schema, invalidHistoricalReturn);
    reject(
      3,
      "historical-return-without-review-margin",
      humanActionResultSchema(invalidHistoricalReturnRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      invalidHistoricalReturn,
    );

    const excerptFixture = applicationSuccessFixtures().find(
      ({ mode }) => mode === "evidence_excerpt",
    )!;
    const excerptSchema = applicationResultSchemaForRequest({
      mode: "evidence_excerpt",
      claimHandle: handle(0),
    });
    const causalExcerpt = clone(excerptFixture.result);
    asRecord(asRecord(causalExcerpt)["data"])["meta"] = authority(1, 2, 1, 1);
    accept(3, "evidence-meta-causal-control", excerptSchema, causalExcerpt);
    const pageEpochZeroExcerpt = clone(causalExcerpt);
    const pageEpochZeroExcerptAuthority = authority(
      0,
      0,
      1,
      0,
    );
    asRecord(asRecord(pageEpochZeroExcerpt)["data"])["meta"] =
      pageEpochZeroExcerptAuthority;
    mustParse(
      AuthorityMetaV1Schema,
      pageEpochZeroExcerptAuthority,
    );
    reject(
      3,
      "evidence-meta-noncausal-pageEpoch",
      excerptSchema,
      pageEpochZeroExcerpt,
    );
    for (const [coordinate, value] of [
      ["applicationRevision", 0],
      ["requirementsVersion", 3],
      ["projectionSequence", 0],
    ] as const) {
      const invalidExcerpt = clone(causalExcerpt);
      const invalidMeta = asRecord(asRecord(invalidExcerpt)["data"])["meta"];
      asRecord(invalidMeta)[coordinate] = value;
      mustParse(AuthorityMetaV1Schema, invalidMeta);
      reject(
        3,
        `evidence-meta-noncausal-${coordinate}`,
        excerptSchema,
        invalidExcerpt,
      );
    }

    const bindRequest = makeRequest("bind_evidence");
    const bindOriginal = {
      outcome: "action_applied",
      action: "bind_evidence",
      fields: ["legal_name"],
      versions: { applicationRevision: 2, requirementsVersion: 1 },
    };
    const replay = (snapshot: unknown): unknown => ({
      ok: true,
      data: { kind: "action_replayed", original: bindOriginal, snapshot },
    });
    const bindSchema = humanActionResultSchema(bindRequest, {
      storedOutcome: null,
      currentConsentRequestId: null,
    });
    accept(3, "nonreview-origin-draft-q0", bindSchema, replay(draftSnapshot(makeDraft(), { pageEpoch: 1, applicationRevision: 2, requirementsVersion: 1, projectionSequence: 1 })));
    accept(3, "nonreview-origin-review-q1", bindSchema, replay(reviewSnapshot(3, 1, 1, 2, { applicationRevision: 2, requirementsVersion: 1 })));
    accept(3, "nonreview-origin-submitted-q2", bindSchema, replay(submittedSnapshot(4, 1, 1, 3)));
    reject(3, "nonreview-origin-review-q0", bindSchema, replay(reviewSnapshot(2, 1, 1, 1, { applicationRevision: 1, requirementsVersion: 1 })));
    reject(3, "nonreview-origin-submitted-q1", bindSchema, replay(submittedSnapshot(3, 1, 1, 2)));

    const prepareRequest = makeRequest("prepare_review");
    const prepareOriginal = {
      outcome: "review_prepared",
      action: "prepare_review",
      reviewId: REVIEW_ID,
      versions: { applicationRevision: 2, requirementsVersion: 1 },
    };
    const prepareReplay = (snapshot: unknown): unknown => ({
      ok: true,
      data: { kind: "action_replayed", original: prepareOriginal, snapshot },
    });
    const prepareSchema = humanActionResultSchema(prepareRequest, {
      storedOutcome: null,
      currentConsentRequestId: null,
    });
    accept(3, "review-origin-immediate-review", prepareSchema, prepareReplay(reviewSnapshot(2, 1, 1, 1, { applicationRevision: 1, requirementsVersion: 1 })));
    const prepareDraftQ0 = prepareReplay(
      draftSnapshot(makeDraft(), {
        pageEpoch: 1,
        applicationRevision: 2,
        requirementsVersion: 1,
        projectionSequence: 1,
      }),
    );
    mustParse(HistoricalActionReplayV1Schema, prepareDraftQ0);
    reject(
      3,
      "review-origin-draft-q0",
      prepareSchema,
      prepareDraftQ0,
    );
    accept(3, "review-origin-draft-q1", prepareSchema, prepareReplay(draftSnapshot(makeDraft(), { pageEpoch: 1, applicationRevision: 3, requirementsVersion: 1, projectionSequence: 2 })));
    accept(3, "review-origin-later-review-q2", prepareSchema, prepareReplay(reviewSnapshot(4, 1, 1, 3, { applicationRevision: 3, requirementsVersion: 1 }, OTHER_REVIEW_ID)));
    accept(3, "review-origin-direct-submitted-q1", prepareSchema, prepareReplay(submittedSnapshot(3, 1, 1, 2)));
    accept(3, "review-origin-later-submitted-q3", prepareSchema, prepareReplay(submittedSnapshot(5, 1, 1, 4)));
    reject(3, "review-origin-review-q1-hole", prepareSchema, prepareReplay(reviewSnapshot(3, 1, 1, 2, { applicationRevision: 2, requirementsVersion: 1 }, OTHER_REVIEW_ID)));
    reject(3, "review-origin-submitted-q2-hole", prepareSchema, prepareReplay(submittedSnapshot(4, 1, 1, 3)));

    const highBindRequest = makeRequest("bind_evidence", {
      applicationRevision: 3,
      requirementsVersion: 1,
    });
    const highBindOriginal = {
      outcome: "action_applied",
      action: "bind_evidence",
      fields: ["legal_name"],
      versions: { applicationRevision: 4, requirementsVersion: 1 },
    };
    const highBindSchema = humanActionResultSchema(highBindRequest, {
      storedOutcome: null,
      currentConsentRequestId: null,
    });
    const highBindReplay = (snapshot: unknown): unknown => ({
      ok: true,
      data: {
        kind: "action_replayed",
        original: highBindOriginal,
        snapshot,
      },
    });
    const nonReviewStagePairs = [
      {
        label: "requirements-drift-cannot-create-review-transition",
        accepted: false,
        snapshot: reviewSnapshot(
          5,
          2,
          1,
          4,
          { applicationRevision: 4, requirementsVersion: 2 },
          OTHER_REVIEW_ID,
        ),
      },
      {
        label: "review-transition-after-one-nonrequirements-effect",
        accepted: true,
        snapshot: reviewSnapshot(
          6,
          2,
          1,
          5,
          { applicationRevision: 5, requirementsVersion: 2 },
          OTHER_REVIEW_ID,
        ),
      },
      {
        label: "requirements-drift-cannot-supply-second-submission-transition",
        accepted: false,
        snapshot: submittedSnapshot(6, 2, 1, 5),
      },
      {
        label: "submission-after-two-nonrequirements-effects",
        accepted: true,
        snapshot: submittedSnapshot(7, 2, 1, 6),
      },
    ] as const;
    for (const row of nonReviewStagePairs) {
      const result = highBindReplay(row.snapshot);
      mustParse(HistoricalActionReplayV1Schema, result);
      if (row.accepted) {
        accept(3, row.label, highBindSchema, result);
      } else {
        reject(3, row.label, highBindSchema, result);
      }
    }

    const highPrepareRequest = makeRequest("prepare_review", {
      applicationRevision: 3,
      requirementsVersion: 1,
    });
    const highPrepareOriginal = {
      outcome: "review_prepared",
      action: "prepare_review",
      reviewId: REVIEW_ID,
      versions: { applicationRevision: 4, requirementsVersion: 1 },
    };
    const highPrepareSchema = humanActionResultSchema(highPrepareRequest, {
      storedOutcome: null,
      currentConsentRequestId: null,
    });
    const highPrepareReplay = (snapshot: unknown): unknown => ({
      ok: true,
      data: {
        kind: "action_replayed",
        original: highPrepareOriginal,
        snapshot,
      },
    });
    const reviewOriginStagePairs = [
      {
        label: "review-origin-requirements-drift-cannot-return-to-draft",
        accepted: false,
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 5,
          requirementsVersion: 2,
          projectionSequence: 4,
        }),
      },
      {
        label: "review-origin-draft-after-one-nonrequirements-effect",
        accepted: true,
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 6,
          requirementsVersion: 2,
          projectionSequence: 5,
        }),
      },
      {
        label: "review-origin-requirements-drift-cannot-supply-second-review-transition",
        accepted: false,
        snapshot: reviewSnapshot(
          6,
          2,
          1,
          5,
          { applicationRevision: 5, requirementsVersion: 2 },
          OTHER_REVIEW_ID,
        ),
      },
      {
        label: "review-origin-later-review-after-two-nonrequirements-effects",
        accepted: true,
        snapshot: reviewSnapshot(
          7,
          2,
          1,
          6,
          { applicationRevision: 6, requirementsVersion: 2 },
          OTHER_REVIEW_ID,
        ),
      },
      {
        label: "review-origin-requirements-drift-cannot-supply-third-submission-transition",
        accepted: false,
        snapshot: submittedSnapshot(7, 2, 1, 6),
      },
      {
        label: "review-origin-later-submission-after-three-nonrequirements-effects",
        accepted: true,
        snapshot: submittedSnapshot(8, 2, 1, 7),
      },
    ] as const;
    for (const row of reviewOriginStagePairs) {
      const result = highPrepareReplay(row.snapshot);
      mustParse(HistoricalActionReplayV1Schema, result);
      if (row.accepted) {
        accept(3, row.label, highPrepareSchema, result);
      } else {
        reject(3, row.label, highPrepareSchema, result);
      }
    }
  });

  await suite.test("4 requirements and application version inequality", () => {
    const snapshotSchema = applicationResultSchemaForRequest({ mode: "snapshot" });
    const unequalSnapshot = draftSnapshot(makeDraft(), {
      pageEpoch: 3,
      applicationRevision: 7,
      requirementsVersion: 3,
      projectionSequence: 4,
    });
    accept(
      4,
      "current-absolute-inequality",
      snapshotSchema,
      { ok: true, data: { kind: "snapshot", snapshot: unequalSnapshot } },
    );

    const request = makeRequest("clear_evidence", {
      field: "legal_name",
      pageEpoch: 1,
      applicationRevision: 4,
      requirementsVersion: 3,
    });
    const current = {
      ok: true,
      data: {
        kind: "action_applied",
        action: "clear_evidence",
        snapshot: draftSnapshot(draftForClear("legal_name"), {
          pageEpoch: 1,
          applicationRevision: 5,
          requirementsVersion: 3,
          projectionSequence: 4,
        }),
      },
    };
    const schema = humanActionResultSchema(request, {
      storedOutcome: null,
      currentConsentRequestId: null,
    });
    accept(4, "current-action-unequal-versions", schema, current);

    const historicalRequest = makeRequest("bind_evidence", {
      pageEpoch: 1,
      applicationRevision: 4,
      requirementsVersion: 3,
    });
    const original = {
      outcome: "action_applied",
      action: "bind_evidence",
      fields: ["legal_name"],
      versions: { applicationRevision: 5, requirementsVersion: 3 },
    };
    const historical = {
      ok: true,
      data: {
        kind: "action_replayed",
        original,
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 8,
          requirementsVersion: 4,
          projectionSequence: 7,
        }),
      },
    };
    const historicalSchema = humanActionResultSchema(historicalRequest, {
      storedOutcome: null,
      currentConsentRequestId: null,
    });
    mustParse(HistoricalActionReplayV1Schema, historical);
    accept(4, "historical-delta-three-one", historicalSchema, historical);
    // A negative application delta necessarily falls outside the causal cone
    // `0 <= requirementsDelta <= applicationDelta`; the explicit lower-bound
    // conjunct is algebraically redundant. This probes observable cone
    // behavior, not the presence of a particular private source expression.
    const historicalApplicationDecrease = mutateSnapshot(
      mutateSnapshot(historical, "applicationRevision", 4),
      "requirementsVersion",
      3,
    );
    mustParse(
      HumanSnapshotV1Schema,
      snapshotRecord(historicalApplicationDecrease),
    );
    reject(
      4,
      "historical-application-decreases",
      HistoricalActionReplayV1Schema,
      historicalApplicationDecrease,
    );
    const historicalRequirementsDecrease = mutateSnapshot(
      historical,
      "requirementsVersion",
      2,
    );
    mustParse(
      HumanSnapshotV1Schema,
      snapshotRecord(historicalRequirementsDecrease),
    );
    reject(
      4,
      "historical-requirements-decrease",
      HistoricalActionReplayV1Schema,
      historicalRequirementsDecrease,
    );
    const historicalRequirementsExceedApplication = mutateSnapshot(
      mutateSnapshot(historical, "applicationRevision", 6),
      "requirementsVersion",
      5,
    );
    mustParse(
      HumanSnapshotV1Schema,
      snapshotRecord(historicalRequirementsExceedApplication),
    );
    reject(
      4,
      "historical-requirements-delta-exceeds-application",
      HistoricalActionReplayV1Schema,
      historicalRequirementsExceedApplication,
    );
  });

  await suite.test("5 historical Review source-version binding", () => {
    const currentPrepare = canonicalCurrentCase("prepare_review");
    accept(
      5,
      "current-review-exact-request-source-versions",
      actionSchema(currentPrepare),
      currentPrepare.result,
    );
    const currentWrongSourceApplication = clone(currentPrepare.result);
    asRecord(
      asRecord(snapshotRecord(currentWrongSourceApplication)["review"])[
        "sourceVersions"
      ],
    )["applicationRevision"] = 0;
    mustParse(ActionSuccessSchema, currentWrongSourceApplication);
    reject(
      5,
      "current-review-wrong-source-application",
      actionSchema(currentPrepare),
      currentWrongSourceApplication,
    );
    const currentWrongSourceRequirements = clone(currentPrepare.result);
    asRecord(
      asRecord(snapshotRecord(currentWrongSourceRequirements)["review"])[
        "sourceVersions"
      ],
    )["requirementsVersion"] = 2;
    mustParse(ActionSuccessSchema, currentWrongSourceRequirements);
    reject(
      5,
      "current-review-wrong-source-requirements",
      actionSchema(currentPrepare),
      currentWrongSourceRequirements,
    );

    const request = makeRequest("prepare_review");
    const original = {
      outcome: "review_prepared",
      action: "prepare_review",
      reviewId: REVIEW_ID,
      versions: { applicationRevision: 2, requirementsVersion: 1 },
    };
    const immediate = {
      ok: true,
      data: {
        kind: "action_replayed",
        original,
        snapshot: reviewSnapshot(2, 1, 1, 1, {
          applicationRevision: 1,
          requirementsVersion: 1,
        }),
      },
    };
    const schema = humanActionResultSchema(request, {
      storedOutcome: null,
      currentConsentRequestId: null,
    });
    accept(5, "immediate-exact-request-bound", schema, immediate);
    accept(5, "immediate-exact-direct-schema", HistoricalActionReplayV1Schema, immediate);
    accept(
      5,
      "immediate-projection-drift",
      schema,
      mutateSnapshot(immediate, "projectionSequence", 8),
    );

    const wrongId = clone(immediate);
    asRecord(snapshotRecord(wrongId)["review"])["reviewId"] = OTHER_REVIEW_ID;
    reject(5, "immediate-wrong-review-id", schema, wrongId);
    const wrongSourceApplication = clone(immediate);
    asRecord(
      asRecord(snapshotRecord(wrongSourceApplication)["review"])["sourceVersions"],
    )["applicationRevision"] = 2;
    reject(5, "immediate-wrong-source-application", schema, wrongSourceApplication);
    const wrongSourceRequirements = clone(immediate);
    asRecord(
      asRecord(snapshotRecord(wrongSourceRequirements)["review"])["sourceVersions"],
    )["requirementsVersion"] = 2;
    reject(5, "immediate-wrong-source-requirements", schema, wrongSourceRequirements);

    const laterDraft = {
      ok: true,
      data: {
        kind: "action_replayed",
        original,
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 3,
          requirementsVersion: 1,
          projectionSequence: 2,
        }),
      },
    };
    const laterReview = {
      ok: true,
      data: {
        kind: "action_replayed",
        original,
        snapshot: reviewSnapshot(
          4,
          1,
          1,
          3,
          { applicationRevision: 3, requirementsVersion: 1 },
          OTHER_REVIEW_ID,
        ),
      },
    };
    const directSubmitted = {
      ok: true,
      data: {
        kind: "action_replayed",
        original,
        snapshot: submittedSnapshot(3, 1, 1, 2),
      },
    };
    const laterSubmitted = {
      ok: true,
      data: {
        kind: "action_replayed",
        original,
        snapshot: submittedSnapshot(5, 1, 1, 4),
      },
    };
    accept(5, "later-draft-current-authority", schema, laterDraft);
    accept(5, "later-review-new-identity-and-source", schema, laterReview);
    accept(5, "direct-submitted-current-authority", schema, directSubmitted);
    accept(5, "later-submitted-current-authority", schema, laterSubmitted);
  });

  await suite.test("6 canonical-income-only conflict direct failure pairing", () => {
    const failure = conflictFailure();
    for (const field of EVIDENCE_FIELD_IDS) {
      for (const claimHandle of
        field === "annual_household_income"
          ? [handle(6), handle(7), handle(99)]
          : [handle(FIELD_HANDLE_INDEX[field])]) {
        const request = makeRequest("bind_evidence", { field, claimHandle });
        const schema = humanActionResultSchema(request, {
          storedOutcome: null,
          currentConsentRequestId: null,
        });
        const label = `direct-conflict-${field}-${claimHandle}`;
        if (field === "annual_household_income") {
          accept(6, label, schema, failure);
        } else {
          reject(6, label, schema, failure);
        }
      }
    }

    for (const action of HUMAN_ACTIONS.filter(
      (candidate) => candidate !== "bind_evidence",
    )) {
      const request = makeRequest(action, {
        applicationRevision:
          action === "return_to_draft" || action === "revoke_assisted_access" ? 2 : 1,
      });
      reject(
        6,
        `direct-conflict-nonbind-${action}`,
        humanActionResultSchema(request, {
          storedOutcome: null,
          currentConsentRequestId: null,
        }),
        failure,
      );
    }

    for (const key of [
      "value",
      "claimHandle",
      "reason",
      "versions",
      "snapshot",
      "source",
      "currentConsentRequestId",
    ] as const) {
      const withExtra = clone(failure);
      asRecord(asRecord(withExtra)["error"])[key] = "private";
      const request = makeRequest("bind_evidence", {
        field: "annual_household_income",
      });
      reject(
        6,
        `conflict-value-free-extra-${key}`,
        humanActionResultSchema(request, {
          storedOutcome: null,
          currentConsentRequestId: null,
        }),
        withExtra,
      );
    }

    const historicalConflict = historicalCases.find(
      ({ label }) => label === "income-conflict-refusal",
    )!;
    accept(
      6,
      "historical-income-pair-exact",
      actionSchema(historicalConflict),
      historicalConflict.result,
    );
    const nonIncomeRequest = makeRequest("bind_evidence", { field: "legal_name" });
    reject(
      6,
      "historical-income-pair-wrong-request-field",
      humanActionResultSchema(nonIncomeRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      historicalConflict.result,
    );
  });

  await suite.test("7 Allow replay after later content revision under current authority", () => {
    const fresh = canonicalCurrentCase("allow_assisted_access");
    accept(7, "fresh-effective-allow", actionSchema(fresh), fresh.result);
    const allowNoChange = canonicalCurrentCase("allow_assisted_access", "no_change");
    accept(7, "fresh-existing-coordinate-no-change", actionSchema(allowNoChange), allowNoChange.result);

    const request = makeRequest("allow_assisted_access", { requestId: uuid(500) });
    const storedEffective: NonNullable<ActionContext["storedOutcome"]> = {
      outcome: "assistance_allowed",
      action: "allow_assisted_access",
      versions: { applicationRevision: 2, requirementsVersion: 1 },
    };
    const laterAllowed = {
      ok: true,
      data: {
        kind: "assistance_allowed",
        consentCapability: CAPABILITY,
        snapshot: draftSnapshot(makeDraft({ assistance: "allowed" }), {
          pageEpoch: 1,
          applicationRevision: 3,
          requirementsVersion: 1,
          projectionSequence: 2,
        }),
      },
    };
    const sameAuthority = {
      storedOutcome: storedEffective,
      currentConsentRequestId: request.requestId,
    } satisfies ActionContext;
    accept(
      7,
      "stored-effective-same-authority-later-content",
      humanActionResultSchema(request, sameAuthority),
      laterAllowed,
    );
    const laterRequirements = clone(laterAllowed);
    snapshotRecord(laterRequirements)["requirementsVersion"] = 2;
    accept(
      7,
      "stored-effective-same-authority-later-requirements",
      humanActionResultSchema(request, sameAuthority),
      laterRequirements,
    );
    for (const currentConsentRequestId of [null, DIFFERENT_CONSENT_ID]) {
      reject(
        7,
        `capability-bearing-wrong-authority-${String(currentConsentRequestId)}`,
        humanActionResultSchema(request, {
          storedOutcome: storedEffective,
          currentConsentRequestId,
        }),
        laterAllowed,
      );
    }

    const genericWhileCurrent = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: storedEffective,
        snapshot: snapshotRecord(laterAllowed),
      },
    };
    reject(
      7,
      "generic-history-forbidden-while-stored-coordinate-current",
      humanActionResultSchema(request, sameAuthority),
      genericWhileCurrent,
    );

    const authorityLostQ1 = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: storedEffective,
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 3,
          requirementsVersion: 1,
          projectionSequence: 2,
        }),
      },
    };
    accept(
      7,
      "authority-lost-history-q1",
      humanActionResultSchema(request, {
        storedOutcome: storedEffective,
        currentConsentRequestId: null,
      }),
      authorityLostQ1,
    );
    const authorityLostQ0 = mutateSnapshot(
      authorityLostQ1,
      "applicationRevision",
      2,
    );
    reject(
      7,
      "authority-lost-history-q0",
      humanActionResultSchema(request, {
        storedOutcome: storedEffective,
        currentConsentRequestId: null,
      }),
      authorityLostQ0,
    );

    const differentAuthorityQ2 = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: storedEffective,
        snapshot: draftSnapshot(makeDraft({ assistance: "allowed" }), {
          pageEpoch: 1,
          applicationRevision: 4,
          requirementsVersion: 1,
          projectionSequence: 3,
        }),
      },
    };
    accept(
      7,
      "different-active-authority-history-q2",
      humanActionResultSchema(request, {
        storedOutcome: storedEffective,
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
      }),
      differentAuthorityQ2,
    );
    reject(
      7,
      "different-active-authority-history-q1",
      humanActionResultSchema(request, {
        storedOutcome: storedEffective,
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
      }),
      mutateSnapshot(differentAuthorityQ2, "applicationRevision", 3),
    );

    const noChangeRequest = makeRequest("allow_assisted_access", {
      requestId: uuid(501),
      applicationRevision: 2,
    });
    const storedNoChange: NonNullable<ActionContext["storedOutcome"]> = {
      outcome: "no_change",
      action: "allow_assisted_access",
      consentCoordinate: EXISTING_CONSENT_ID,
      fields: [],
      versions: { applicationRevision: 2, requirementsVersion: 1 },
    };
    const noChangeLater = {
      ok: true,
      data: {
        kind: "no_change",
        action: "allow_assisted_access",
        consentCapability: CAPABILITY,
        snapshot: draftSnapshot(makeDraft({ assistance: "allowed" }), {
          pageEpoch: 1,
          applicationRevision: 3,
          requirementsVersion: 1,
          projectionSequence: 3,
        }),
      },
    };
    accept(
      7,
      "stored-no-change-same-existing-authority",
      humanActionResultSchema(noChangeRequest, {
        storedOutcome: storedNoChange,
        currentConsentRequestId: EXISTING_CONSENT_ID,
      }),
      noChangeLater,
    );
    assert.throws(
      () =>
        humanActionResultSchema(noChangeRequest, {
          storedOutcome: {
            ...storedNoChange,
            consentCoordinate: noChangeRequest.requestId,
          },
          currentConsentRequestId: noChangeRequest.requestId,
        }),
      TypeError,
    );
    coverage.get(7)!.negative += 1;
    recordLabel("N7:stored-no-change-self-coordinate-context");

    const allowedContent = canonicalCurrentCase("bind_evidence");
    const allowedContentResult = clone(allowedContent.result);
    snapshotRecord(allowedContentResult)["view"] = makeDraft({ assistance: "allowed" });
    const allowedContentRequest = allowedContent.request;
    accept(
      7,
      "nonallow-content-under-different-active-consent",
      humanActionResultSchema(allowedContentRequest, {
        storedOutcome: null,
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
      }),
      allowedContentResult,
    );
    reject(
      7,
      "allowed-snapshot-with-null-hidden-consent",
      humanActionResultSchema(allowedContentRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      allowedContentResult,
    );
    reject(
      7,
      "nonallow-consumes-current-consent-identity",
      humanActionResultSchema(allowedContentRequest, {
        storedOutcome: null,
        currentConsentRequestId: allowedContentRequest.requestId,
      }),
      allowedContentResult,
    );

    const nonAllowCurrent = currentCases.filter(
      ({ action }) => action !== "allow_assisted_access",
    );
    assert.equal(nonAllowCurrent.length, 18);
    for (const row of nonAllowCurrent) {
      reject(
        7,
        `universal-current-parity-${row.label}-off-with-hidden-consent`,
        humanActionResultSchema(row.request, {
          storedOutcome: null,
          currentConsentRequestId: DIFFERENT_CONSENT_ID,
        }),
        row.result,
      );
      const data = asRecord(asRecord(row.result)["data"]);
      const snapshot = snapshotRecord(row.result);
      if (
        snapshot["stage"] === "draft" &&
        (data["kind"] === "action_applied" || data["kind"] === "no_change") &&
        (CONTENT_ACTIONS as readonly string[]).includes(row.action)
      ) {
        const parityRow =
          row.variant === "no_change"
            ? canonicalCurrentCase(row.action, "no_change", {
                applicationRevision: 2,
              })
            : row.action === "clear_dependency"
            ? canonicalCurrentCase("clear_dependency", "effect", {
                applicationRevision: 2,
              })
            : row;
        const allowed = clone(parityRow.result);
        snapshotRecord(allowed)["view"] = makeDraft({
          assistance: "allowed",
          packet:
            row.action === "resolve_income" ||
            row.action === "clear_income_resolution"
              ? "conflict"
              : "supported",
          overrides:
            row.action === "bind_evidence" &&
            row.request.action === "bind_evidence" &&
            row.request.field === "dependency" &&
            row.variant === "effect"
              ? {
                  guardian_name: missing("guardian_name"),
                  household_size: missing("household_size"),
                }
              : row.action === "clear_evidence" &&
                  row.request.action === "clear_evidence"
                ? { [row.request.field]: missing(row.request.field) }
                : row.action === "clear_dependency"
                  ? {
                      dependency: missing("dependency"),
                      guardian_name: inactive("guardian_name"),
                      household_size: inactive("household_size"),
                    }
                  : row.action === "save_email" &&
                      row.request.action === "save_email"
                    ? {
                        preferred_contact_email: {
                          field: "preferred_contact_email",
                          active: true,
                          status: "needs_declaration",
                          origin: "manual",
                          value: row.request.value,
                        },
                      }
                    : row.action === "resolve_income" &&
                        row.request.action === "resolve_income"
                      ? {
                          annual_household_income:
                            draftForResolvedIncome(
                              row.request.claimHandle,
                              row.request.reason,
                            ).fields[7],
                        }
                      : row.action === "clear_income_resolution"
                        ? {
                            annual_household_income:
                              draftWithIncomeConflict().fields[7],
                          }
                        : {},
        });
        accept(
          7,
          `universal-current-parity-${row.label}-allowed-with-hidden-consent`,
          humanActionResultSchema(parityRow.request, {
            storedOutcome: null,
            currentConsentRequestId: DIFFERENT_CONSENT_ID,
          }),
          allowed,
        );
        reject(
          7,
          `universal-current-consumed-id-${row.label}`,
          humanActionResultSchema(parityRow.request, {
            storedOutcome: null,
            currentConsentRequestId: parityRow.request.requestId,
          }),
          allowed,
        );
      }
    }

    const historicalNonAllow = historicalCases.filter(
      ({ action }) => action !== "allow_assisted_access",
    );
    assert.equal(historicalNonAllow.length, 22);
    for (const row of historicalNonAllow) {
      assert.notEqual(DIFFERENT_CONSENT_ID, row.request.requestId);
      const original = originalRecord(row.result);
      const versions = asRecord(original["versions"]);
      const originalApplication = versions["applicationRevision"] as number;
      const originalRequirements = versions["requirementsVersion"] as number;
      const pageEpoch = row.request.expectedPageEpoch;
      const originalNonRequirements =
        originalApplication - pageEpoch - (originalRequirements - 1);
      const transitionFloor =
        original["outcome"] === "review_prepared"
          ? 2
          : original["outcome"] === "assistance_revoked" ||
              original["outcome"] === "returned_to_draft" ||
              (original["outcome"] === "no_change" &&
                original["action"] === "revoke_assisted_access")
            ? 1
            : 0;
      const absoluteAllowedFloor = Math.max(
        0,
        1 - originalNonRequirements,
      );
      const distance = Math.max(transitionFloor, absoluteAllowedFloor);
      const applicationRevision = originalApplication + distance;
      const projectionSequence =
        applicationRevision - pageEpoch + (row.effect ? 0 : 1);
      const replayWithAssistance = (
        assistance: "off" | "allowed",
      ): unknown => ({
        ok: true,
        data: {
          kind: "action_replayed",
          original: clone(original),
          snapshot: draftSnapshot(makeDraft({ assistance }), {
            pageEpoch,
            applicationRevision,
            requirementsVersion: originalRequirements,
            projectionSequence,
          }),
        },
      });
      const allowed = replayWithAssistance("allowed");
      const off = replayWithAssistance("off");
      accept(
        7,
        `historical-parity-${row.label}-allowed-with-hidden-consent`,
        humanActionResultSchema(row.request, {
          storedOutcome: null,
          currentConsentRequestId: DIFFERENT_CONSENT_ID,
        }),
        allowed,
      );
      reject(
        7,
        `historical-parity-${row.label}-allowed-with-null-consent`,
        humanActionResultSchema(row.request, {
          storedOutcome: null,
          currentConsentRequestId: null,
        }),
        allowed,
      );
      accept(
        7,
        `historical-parity-${row.label}-off-with-null-consent`,
        humanActionResultSchema(row.request, {
          storedOutcome: null,
          currentConsentRequestId: null,
        }),
        off,
      );
      reject(
        7,
        `historical-parity-${row.label}-off-with-hidden-consent`,
        humanActionResultSchema(row.request, {
          storedOutcome: null,
          currentConsentRequestId: DIFFERENT_CONSENT_ID,
        }),
        off,
      );
      reject(
        7,
        `historical-consumed-id-${row.label}`,
        humanActionResultSchema(row.request, {
          storedOutcome: null,
          currentConsentRequestId: row.request.requestId,
        }),
        allowed,
      );
    }

    const bindHistorical = historicalCases.find(
      ({ label }) => label === "bind_evidence-stored-effect",
    )!;
    const bindHistoricalOriginal = originalRecord(bindHistorical.result);
    const historicalReview = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: clone(bindHistoricalOriginal),
        snapshot: reviewSnapshot(
          3,
          1,
          1,
          2,
          { applicationRevision: 2, requirementsVersion: 1 },
          OTHER_REVIEW_ID,
        ),
      },
    };
    mustParse(HistoricalActionReplayV1Schema, historicalReview);
    accept(
      7,
      "historical-review-null-consent-parity-control",
      humanActionResultSchema(bindHistorical.request, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      historicalReview,
    );
    reject(
      7,
      "historical-review-rejects-hidden-consent",
      humanActionResultSchema(bindHistorical.request, {
        storedOutcome: null,
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
      }),
      historicalReview,
    );
    const historicalSubmitted = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: clone(bindHistoricalOriginal),
        snapshot: submittedSnapshot(4, 1, 1, 3),
      },
    };
    mustParse(HistoricalActionReplayV1Schema, historicalSubmitted);
    accept(
      7,
      "historical-submitted-null-consent-parity-control",
      humanActionResultSchema(bindHistorical.request, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      historicalSubmitted,
    );
    reject(
      7,
      "historical-submitted-rejects-hidden-consent",
      humanActionResultSchema(bindHistorical.request, {
        storedOutcome: null,
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
      }),
      historicalSubmitted,
    );

    const offToAllowedRows = [
      historicalCases.find(({ label }) => label === "revoke-stored-effect")!,
      historicalCases.find(({ label }) => label === "revoke-stored-no_change")!,
      historicalCases.find(({ label }) => label === "return-stored-effect")!,
    ];
    assert.equal(offToAllowedRows.length, 3);
    for (const row of offToAllowedRows) {
      const originalVersions = asRecord(originalRecord(row.result)["versions"]);
      const originalApplication = originalVersions["applicationRevision"] as number;
      const originalRequirements = originalVersions["requirementsVersion"] as number;
      const replayAt = (distance: number): unknown => ({
        ok: true,
        data: {
          kind: "action_replayed",
          original: originalRecord(row.result),
          snapshot: draftSnapshot(makeDraft({ assistance: "allowed" }), {
            pageEpoch: row.request.expectedPageEpoch,
            applicationRevision: originalApplication + distance,
            requirementsVersion: originalRequirements,
            projectionSequence:
              originalApplication + distance - row.request.expectedPageEpoch +
              (row.effect ? 0 : 1),
          }),
        },
      });
      const schema = humanActionResultSchema(row.request, {
        storedOutcome: null,
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
      });
      reject(7, `${row.label}-allowed-q0`, schema, replayAt(0));
      accept(7, `${row.label}-allowed-q1`, schema, replayAt(1));
    }

    const preparedRow = historicalCases.find(
      ({ label }) => label === "prepare-stored-effect",
    )!;
    const preparedOriginal = originalRecord(preparedRow.result);
    const preparedAllowedAt = (distance: number): unknown => ({
      ok: true,
      data: {
        kind: "action_replayed",
        original: preparedOriginal,
        snapshot: draftSnapshot(makeDraft({ assistance: "allowed" }), {
          pageEpoch: 1,
          applicationRevision: 2 + distance,
          requirementsVersion: 1,
          projectionSequence: 1 + distance,
        }),
      },
    });
    const preparedAllowedSchema = humanActionResultSchema(preparedRow.request, {
      storedOutcome: null,
      currentConsentRequestId: DIFFERENT_CONSENT_ID,
    });
    reject(7, "review-prepared-to-allowed-q0", preparedAllowedSchema, preparedAllowedAt(0));
    reject(7, "review-prepared-to-allowed-q1", preparedAllowedSchema, preparedAllowedAt(1));
    accept(7, "review-prepared-to-allowed-q2", preparedAllowedSchema, preparedAllowedAt(2));

    const requirementsDriftRows: readonly Readonly<{
      row: HistoricalCase;
      transitionFloor: 1 | 2;
    }>[] = [
      {
        row: historicalCases.find(
          ({ label }) => label === "revoke-stored-effect",
        )!,
        transitionFloor: 1,
      },
      {
        row: historicalCases.find(
          ({ label }) => label === "revoke-stored-no_change",
        )!,
        transitionFloor: 1,
      },
      {
        row: historicalCases.find(
          ({ label }) => label === "return-stored-effect",
        )!,
        transitionFloor: 1,
      },
      {
        row: preparedRow,
        transitionFloor: 2,
      },
    ];
    for (const { row, transitionFloor } of requirementsDriftRows) {
      const original = originalRecord(row.result);
      const versions = asRecord(original["versions"]);
      const originalApplication = versions["applicationRevision"] as number;
      const originalRequirements = versions["requirementsVersion"] as number;
      const replayAtDeltas = (
        applicationDelta: number,
        requirementsDelta: number,
      ): unknown => {
        const applicationRevision = originalApplication + applicationDelta;
        return {
          ok: true,
          data: {
            kind: "action_replayed",
            original: clone(original),
            snapshot: draftSnapshot(makeDraft({ assistance: "allowed" }), {
              pageEpoch: row.request.expectedPageEpoch,
              applicationRevision,
              requirementsVersion:
                originalRequirements + requirementsDelta,
              projectionSequence:
                applicationRevision -
                row.request.expectedPageEpoch +
                (row.effect ? 0 : 1),
            }),
          },
        };
      };
      const insufficient = replayAtDeltas(transitionFloor, 1);
      const exact = replayAtDeltas(transitionFloor + 1, 1);
      mustParse(HistoricalActionReplayV1Schema, insufficient);
      mustParse(HistoricalActionReplayV1Schema, exact);
      const schema = humanActionResultSchema(row.request, {
        storedOutcome: null,
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
      });
      reject(
        7,
        `${row.label}-requirements-drift-does-not-count-as-transition`,
        schema,
        insufficient,
      );
      accept(
        7,
        `${row.label}-mixed-drift-exact-transition-control`,
        schema,
        exact,
      );
    }

    const storedMismatch: NonNullable<ActionContext["storedOutcome"]> = {
      ...storedEffective,
      versions: { applicationRevision: 3, requirementsVersion: 1 },
    };
    assert.throws(
      () =>
        humanActionResultSchema(request, {
          storedOutcome: storedMismatch,
          currentConsentRequestId: request.requestId,
        }),
      /Stored Allow replay context/u,
    );
    coverage.get(7)!.negative += 1;
    recordLabel("N7:stored-context-version-mismatch");

    reject(
      7,
      "stored-replay-page-mismatch",
      humanActionResultSchema(request, sameAuthority),
      mutateSnapshot(laterAllowed, "pageEpoch", 2),
    );

    const noChangeAuthorityLost = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: storedNoChange,
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 3,
          requirementsVersion: 1,
          projectionSequence: 3,
        }),
      },
    };
    accept(
      7,
      "stored-no-change-authority-lost-history-q1",
      humanActionResultSchema(noChangeRequest, {
        storedOutcome: storedNoChange,
        currentConsentRequestId: null,
      }),
      noChangeAuthorityLost,
    );
    reject(
      7,
      "stored-no-change-authority-lost-history-q0",
      humanActionResultSchema(noChangeRequest, {
        storedOutcome: storedNoChange,
        currentConsentRequestId: null,
      }),
      mutateSnapshot(noChangeAuthorityLost, "applicationRevision", 2),
    );

    const rejectContextConstruction = (
      label: string,
      construct: () => unknown,
    ): void => {
      assert.throws(construct);
      coverage.get(7)!.negative += 1;
      recordLabel(`N7:${label}`);
    };

    const highEffectiveRequest = makeRequest("allow_assisted_access", {
      requestId: uuid(510),
      applicationRevision: 3,
      requirementsVersion: 2,
    });
    const highStoredEffective: NonNullable<ActionContext["storedOutcome"]> = {
      outcome: "assistance_allowed",
      action: "allow_assisted_access",
      versions: { applicationRevision: 4, requirementsVersion: 2 },
    };
    const highEffectiveContext = {
      storedOutcome: highStoredEffective,
      currentConsentRequestId: highEffectiveRequest.requestId,
    } satisfies ActionContext;
    const effectiveRelativeResult = (
      applicationDelta: number,
      requirementsDelta: number,
    ): unknown => {
      const applicationRevision =
        highStoredEffective.versions.applicationRevision + applicationDelta;
      return {
        ok: true,
        data: {
          kind: "assistance_allowed",
          consentCapability: CAPABILITY,
          snapshot: draftSnapshot(makeDraft({ assistance: "allowed" }), {
            pageEpoch: 1,
            applicationRevision,
            requirementsVersion:
              highStoredEffective.versions.requirementsVersion +
              requirementsDelta,
            projectionSequence: applicationRevision - 1,
          }),
        },
      };
    };
    for (const row of [
      { label: "zero-zero", applicationDelta: 0, requirementsDelta: 0, accepted: true },
      { label: "negative-application", applicationDelta: -1, requirementsDelta: 0, accepted: false },
      { label: "negative-requirements", applicationDelta: 0, requirementsDelta: -1, accepted: false },
      { label: "requirements-exceed-application", applicationDelta: 0, requirementsDelta: 1, accepted: false },
    ] as const) {
      const value = effectiveRelativeResult(
        row.applicationDelta,
        row.requirementsDelta,
      );
      if (row.accepted) {
        accept(
          7,
          `stored-effective-relative-${row.label}`,
          humanActionResultSchema(highEffectiveRequest, highEffectiveContext),
          value,
        );
      } else {
        mustParse(ActionSuccessSchema, value);
        reject(
          7,
          `stored-effective-relative-${row.label}`,
          humanActionResultSchema(highEffectiveRequest, highEffectiveContext),
          value,
        );
      }
    }

    const highNoChangeRequest = makeRequest("allow_assisted_access", {
      requestId: uuid(511),
      applicationRevision: 4,
      requirementsVersion: 2,
    });
    const highStoredNoChange: NonNullable<ActionContext["storedOutcome"]> = {
      outcome: "no_change",
      action: "allow_assisted_access",
      consentCoordinate: EXISTING_CONSENT_ID,
      fields: [],
      versions: { applicationRevision: 4, requirementsVersion: 2 },
    };
    const highNoChangeContext = {
      storedOutcome: highStoredNoChange,
      currentConsentRequestId: EXISTING_CONSENT_ID,
    } satisfies ActionContext;
    const noChangeRelativeResult = (
      applicationDelta: number,
      requirementsDelta: number,
    ): unknown => {
      const applicationRevision =
        highStoredNoChange.versions.applicationRevision + applicationDelta;
      return {
        ok: true,
        data: {
          kind: "no_change",
          action: "allow_assisted_access",
          consentCapability: CAPABILITY,
          snapshot: draftSnapshot(makeDraft({ assistance: "allowed" }), {
            pageEpoch: 1,
            applicationRevision,
            requirementsVersion:
              highStoredNoChange.versions.requirementsVersion +
              requirementsDelta,
            projectionSequence: applicationRevision,
          }),
        },
      };
    };
    for (const row of [
      { label: "zero-zero", applicationDelta: 0, requirementsDelta: 0, accepted: true },
      { label: "one-one", applicationDelta: 1, requirementsDelta: 1, accepted: true },
      { label: "negative-application", applicationDelta: -1, requirementsDelta: 0, accepted: false },
      { label: "negative-requirements", applicationDelta: 0, requirementsDelta: -1, accepted: false },
      { label: "requirements-exceed-application", applicationDelta: 0, requirementsDelta: 1, accepted: false },
    ] as const) {
      const value = noChangeRelativeResult(
        row.applicationDelta,
        row.requirementsDelta,
      );
      if (row.accepted) {
        accept(
          7,
          `stored-no-change-relative-${row.label}`,
          humanActionResultSchema(highNoChangeRequest, highNoChangeContext),
          value,
        );
      } else {
        mustParse(ActionSuccessSchema, value);
        reject(
          7,
          `stored-no-change-relative-${row.label}`,
          humanActionResultSchema(highNoChangeRequest, highNoChangeContext),
          value,
        );
      }
    }

    mustParse(ActionSuccessSchema, fresh.result);
    reject(
      7,
      "fresh-effective-rejects-existing-different-authority",
      humanActionResultSchema(fresh.request, {
        storedOutcome: null,
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
      }),
      fresh.result,
    );
    mustParse(ActionSuccessSchema, allowNoChange.result);
    reject(
      7,
      "fresh-no-change-rejects-self-authority",
      humanActionResultSchema(allowNoChange.request, {
        storedOutcome: null,
        currentConsentRequestId: allowNoChange.request.requestId,
      }),
      allowNoChange.result,
    );

    const highEffectiveAtStored = effectiveRelativeResult(0, 0);
    const highNoChangeAtStored = noChangeRelativeResult(0, 0);
    mustParse(ActionSuccessSchema, highNoChangeAtStored);
    reject(
      7,
      "stored-effective-context-rejects-no-change-result-kind",
      humanActionResultSchema(highEffectiveRequest, highEffectiveContext),
      highNoChangeAtStored,
    );
    mustParse(ActionSuccessSchema, highEffectiveAtStored);
    reject(
      7,
      "stored-no-change-context-rejects-effective-result-kind",
      humanActionResultSchema(highNoChangeRequest, highNoChangeContext),
      highEffectiveAtStored,
    );

    mustParse(ActionSuccessSchema, noChangeLater);
    reject(
      7,
      "stored-no-change-current-result-rejects-different-authority",
      humanActionResultSchema(noChangeRequest, {
        storedOutcome: storedNoChange,
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
      }),
      noChangeLater,
    );

    const highNoChangeHistory = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: clone(highStoredNoChange),
        snapshot: draftSnapshot(makeDraft({ assistance: "allowed" }), {
          pageEpoch: 1,
          applicationRevision: 6,
          requirementsVersion: 2,
          projectionSequence: 6,
        }),
      },
    };
    mustParse(HistoricalActionReplayV1Schema, highNoChangeHistory);
    reject(
      7,
      "stored-no-change-history-forbidden-while-coordinate-current",
      humanActionResultSchema(highNoChangeRequest, highNoChangeContext),
      highNoChangeHistory,
    );
    reject(
      7,
      "stored-no-change-history-rejects-consumed-request-identity",
      humanActionResultSchema(highNoChangeRequest, {
        storedOutcome: highStoredNoChange,
        currentConsentRequestId: highNoChangeRequest.requestId,
      }),
      highNoChangeHistory,
    );
    accept(
      7,
      "stored-no-change-history-under-later-distinct-authority",
      humanActionResultSchema(highNoChangeRequest, {
        storedOutcome: highStoredNoChange,
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
      }),
      highNoChangeHistory,
    );

    const wrongNoChangeOriginalCoordinate = clone(noChangeAuthorityLost);
    originalRecord(wrongNoChangeOriginalCoordinate)["consentCoordinate"] =
      uuid(512);
    mustParse(
      HistoricalActionReplayV1Schema,
      wrongNoChangeOriginalCoordinate,
    );
    reject(
      7,
      "stored-no-change-history-rejects-original-coordinate-mismatch",
      humanActionResultSchema(noChangeRequest, {
        storedOutcome: storedNoChange,
        currentConsentRequestId: null,
      }),
      wrongNoChangeOriginalCoordinate,
    );

    const zeroLifecycleRevokeRequest = makeRequest(
      "revoke_assisted_access",
      {
        requestId: uuid(513),
        applicationRevision: 1,
        requirementsVersion: 1,
      },
    );
    const zeroLifecycleCurrentRevoke = {
      ok: true,
      data: {
        kind: "assistance_revoked",
        action: "revoke_assisted_access",
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 2,
          requirementsVersion: 1,
          projectionSequence: 1,
        }),
      },
    };
    mustParse(ActionSuccessSchema, zeroLifecycleCurrentRevoke);
    reject(
      7,
      "current-revoke-rejects-zero-lifecycle-prestate",
      humanActionResultSchema(zeroLifecycleRevokeRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      zeroLifecycleCurrentRevoke,
    );
    const zeroLifecycleHistoricalRevoke = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: {
          outcome: "assistance_revoked",
          action: "revoke_assisted_access",
          versions: { applicationRevision: 2, requirementsVersion: 1 },
        },
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 3,
          requirementsVersion: 1,
          projectionSequence: 2,
        }),
      },
    };
    mustParse(HistoricalActionReplayV1Schema, zeroLifecycleHistoricalRevoke);
    reject(
      7,
      "historical-revoke-rejects-zero-lifecycle-prestate",
      humanActionResultSchema(zeroLifecycleRevokeRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      zeroLifecycleHistoricalRevoke,
    );

    const initialOffHistoricalRevokeNoChange = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: {
          outcome: "no_change",
          action: "revoke_assisted_access",
          fields: [],
          versions: { applicationRevision: 1, requirementsVersion: 1 },
        },
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: 1,
          applicationRevision: 1,
          requirementsVersion: 1,
          projectionSequence: 1,
        }),
      },
    };
    mustParse(
      HistoricalActionReplayV1Schema,
      initialOffHistoricalRevokeNoChange,
    );
    accept(
      7,
      "historical-revoke-no-change-allows-initial-off-prestate",
      humanActionResultSchema(zeroLifecycleRevokeRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      initialOffHistoricalRevokeNoChange,
    );

    const zeroLifecycleAllowRequest = makeRequest("allow_assisted_access", {
      requestId: uuid(514),
      applicationRevision: 1,
      requirementsVersion: 1,
    });
    const zeroLifecycleStoredNoChange: NonNullable<
      ActionContext["storedOutcome"]
    > = {
      outcome: "no_change",
      action: "allow_assisted_access",
      consentCoordinate: EXISTING_CONSENT_ID,
      fields: [],
      versions: { applicationRevision: 1, requirementsVersion: 1 },
    };
    rejectContextConstruction(
      "stored-allow-no-change-rejects-zero-lifecycle-prestate",
      () =>
        humanActionResultSchema(zeroLifecycleAllowRequest, {
          storedOutcome: zeroLifecycleStoredNoChange,
          currentConsentRequestId: EXISTING_CONSENT_ID,
        }),
    );

    for (const row of [
      {
        label: "application",
        versions: { applicationRevision: 5, requirementsVersion: 2 },
      },
      {
        label: "requirements",
        versions: { applicationRevision: 4, requirementsVersion: 3 },
      },
    ] as const) {
      rejectContextConstruction(
        `stored-no-change-${row.label}-version-mismatch`,
        () =>
          humanActionResultSchema(highNoChangeRequest, {
            storedOutcome: {
              ...highStoredNoChange,
              versions: row.versions,
            },
            currentConsentRequestId: EXISTING_CONSENT_ID,
          }),
      );
    }

    rejectContextConstruction("context-missing-stored-outcome", () =>
      humanActionResultSchema(highEffectiveRequest, {
        currentConsentRequestId: highEffectiveRequest.requestId,
      } as unknown as ActionContext),
    );
    rejectContextConstruction("context-missing-current-consent-id", () =>
      humanActionResultSchema(highEffectiveRequest, {
        storedOutcome: highStoredEffective,
      } as unknown as ActionContext),
    );
    rejectContextConstruction("context-malformed-current-consent-id", () =>
      humanActionResultSchema(highEffectiveRequest, {
        storedOutcome: highStoredEffective,
        currentConsentRequestId: "not-a-uuid",
      } as unknown as ActionContext),
    );
    rejectContextConstruction("stored-allow-context-on-non-allow-request", () =>
      humanActionResultSchema(makeRequest("bind_evidence"), {
        storedOutcome: highStoredEffective,
        currentConsentRequestId: null,
      }),
    );
    mustParse(HistoricalActionReplayV1Schema, authorityLostQ1);
    reject(
      7,
      "historical-allow-requires-stored-context",
      humanActionResultSchema(request, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      authorityLostQ1,
    );

    const storedAllowRequirementsRows: readonly Readonly<{
      label: string;
      request: HumanAction;
      stored: NonNullable<ActionContext["storedOutcome"]>;
      assistance: "off" | "allowed";
      currentConsentRequestId: string | null;
      insufficient: Readonly<{
        applicationRevision: number;
        requirementsVersion: number;
        projectionSequence: number;
      }>;
      exact: Readonly<{
        applicationRevision: number;
        requirementsVersion: number;
        projectionSequence: number;
      }>;
    }>[] = [
      {
        label: "stored-effective-authority-lost",
        request,
        stored: storedEffective,
        assistance: "off",
        currentConsentRequestId: null,
        insufficient: {
          applicationRevision: 3,
          requirementsVersion: 2,
          projectionSequence: 2,
        },
        exact: {
          applicationRevision: 4,
          requirementsVersion: 2,
          projectionSequence: 3,
        },
      },
      {
        label: "stored-effective-different-authority",
        request,
        stored: storedEffective,
        assistance: "allowed",
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
        insufficient: {
          applicationRevision: 4,
          requirementsVersion: 2,
          projectionSequence: 3,
        },
        exact: {
          applicationRevision: 5,
          requirementsVersion: 2,
          projectionSequence: 4,
        },
      },
      {
        label: "stored-no-change-authority-lost",
        request: noChangeRequest,
        stored: storedNoChange,
        assistance: "off",
        currentConsentRequestId: null,
        insufficient: {
          applicationRevision: 3,
          requirementsVersion: 2,
          projectionSequence: 3,
        },
        exact: {
          applicationRevision: 4,
          requirementsVersion: 2,
          projectionSequence: 4,
        },
      },
      {
        label: "stored-no-change-different-authority",
        request: noChangeRequest,
        stored: storedNoChange,
        assistance: "allowed",
        currentConsentRequestId: DIFFERENT_CONSENT_ID,
        insufficient: {
          applicationRevision: 4,
          requirementsVersion: 2,
          projectionSequence: 4,
        },
        exact: {
          applicationRevision: 5,
          requirementsVersion: 2,
          projectionSequence: 5,
        },
      },
    ];
    for (const row of storedAllowRequirementsRows) {
      const replayAt = (
        coordinates: (typeof row)["insufficient"],
      ): unknown => ({
        ok: true,
        data: {
          kind: "action_replayed",
          original: clone(row.stored),
          snapshot: draftSnapshot(
            makeDraft({ assistance: row.assistance }),
            {
              pageEpoch: row.request.expectedPageEpoch,
              ...coordinates,
            },
          ),
        },
      });
      const insufficient = replayAt(row.insufficient);
      const exact = replayAt(row.exact);
      mustParse(HistoricalActionReplayV1Schema, insufficient);
      mustParse(HistoricalActionReplayV1Schema, exact);
      const schema = humanActionResultSchema(row.request, {
        storedOutcome: row.stored,
        currentConsentRequestId: row.currentConsentRequestId,
      });
      reject(
        7,
        `${row.label}-requirements-drift-does-not-count-as-authority-transition`,
        schema,
        insufficient,
      );
      accept(
        7,
        `${row.label}-mixed-drift-exact-authority-control`,
        schema,
        exact,
      );
    }

    for (const row of [
      {
        label: "fresh-no-change",
        schema: actionSchema(allowNoChange),
        value: allowNoChange.result,
        historical: false,
      },
      {
        label: "stored-no-change-history",
        schema: humanActionResultSchema(noChangeRequest, {
          storedOutcome: storedNoChange,
          currentConsentRequestId: null,
        }),
        value: noChangeAuthorityLost,
        historical: true,
      },
    ] as const) {
      const before = clone(row.value);
      snapshotRecord(before)["serverNow"] =
        "2026-08-28T00:00:00.000000001Z";
      snapshotRecord(before)["expiresAt"] =
        "2026-08-28T00:00:00.000000002Z";
      if (row.historical) {
        mustParse(HistoricalActionReplayV1Schema, before);
      } else {
        mustParse(ActionSuccessSchema, before);
      }
      accept(7, `${row.label}-one-nanosecond-before`, row.schema, before);

      const equal = clone(before);
      snapshotRecord(equal)["serverNow"] =
        "2026-08-28T00:00:00.000000002Z";
      if (row.historical) {
        mustParse(HistoricalActionReplayV1Schema, equal);
      } else {
        mustParse(ActionSuccessSchema, equal);
      }
      reject(7, `${row.label}-equal-expiry`, row.schema, equal);
    }

    const timeCases: readonly Readonly<{
      label: string;
      serverNow: string;
      expiresAt: string;
      accepted: boolean;
    }>[] = [
      { label: "one-nanosecond-before", serverNow: "2026-08-28T00:00:00.000000001Z", expiresAt: "2026-08-28T00:00:00.000000002Z", accepted: true },
      { label: "equal-nanosecond", serverNow: "2026-08-28T00:00:00.000000002Z", expiresAt: "2026-08-28T00:00:00.000000002Z", accepted: false },
      { label: "one-nanosecond-after", serverNow: "2026-08-28T00:00:00.000000003Z", expiresAt: "2026-08-28T00:00:00.000000002Z", accepted: false },
      { label: "offset-equivalent-equal", serverNow: "2026-08-28T05:30:00+05:30", expiresAt: "2026-08-28T00:00:00Z", accepted: false },
      { label: "offset-crossing-before", serverNow: "2026-08-28T04:59:59.999999999+05:00", expiresAt: "2026-08-28T00:00:00Z", accepted: true },
      { label: "negative-offset-before", serverNow: "2026-08-27T18:29:59.999999999-05:30", expiresAt: "2026-08-28T00:00:00Z", accepted: true },
      { label: "negative-offset-equal", serverNow: "2026-08-27T18:30:00-05:30", expiresAt: "2026-08-28T00:00:00Z", accepted: false },
      { label: "year-boundary-before", serverNow: "2026-12-31T23:59:59.999999999Z", expiresAt: "2027-01-01T00:00:00Z", accepted: true },
    ];
    assert.equal(timeCases.length, 8);
    for (const row of timeCases) {
      const timed = clone(fresh.result);
      const snapshot = snapshotRecord(timed);
      snapshot["serverNow"] = row.serverNow;
      snapshot["expiresAt"] = row.expiresAt;
      if (row.accepted) {
        accept(7, `expiry-${row.label}`, actionSchema(fresh), timed);
      } else {
        reject(7, `expiry-${row.label}`, actionSchema(fresh), timed);
      }
    }

    for (let width = 1; width <= 8; width += 1) {
      const prefix = "0".repeat(width - 1);
      const timed = clone(fresh.result);
      snapshotRecord(timed)["serverNow"] =
        `2026-08-28T00:00:00.${prefix}1Z`;
      snapshotRecord(timed)["expiresAt"] =
        `2026-08-28T00:00:00.${prefix}2Z`;
      mustParse(ActionSuccessSchema, timed);
      accept(
        7,
        `expiry-fraction-width-${width}-strict-before`,
        actionSchema(fresh),
        timed,
      );
    }
    const crossPrecisionCases: readonly Readonly<{
      label: string;
      serverNow: string;
      expiresAt: string;
      accepted: boolean;
    }>[] = [
      {
        label: "cross-precision-before",
        serverNow: "2026-08-28T00:00:00.099999999Z",
        expiresAt: "2026-08-28T00:00:00.1Z",
        accepted: true,
      },
      {
        label: "cross-precision-equal",
        serverNow: "2026-08-28T00:00:00.1Z",
        expiresAt: "2026-08-28T00:00:00.100000000Z",
        accepted: false,
      },
      {
        label: "cross-precision-after",
        serverNow: "2026-08-28T00:00:00.100000001Z",
        expiresAt: "2026-08-28T00:00:00.1Z",
        accepted: false,
      },
    ];
    for (const row of crossPrecisionCases) {
      const timed = clone(fresh.result);
      snapshotRecord(timed)["serverNow"] = row.serverNow;
      snapshotRecord(timed)["expiresAt"] = row.expiresAt;
      mustParse(ActionSuccessSchema, timed);
      if (row.accepted) {
        accept(7, `expiry-${row.label}`, actionSchema(fresh), timed);
      } else {
        reject(7, `expiry-${row.label}`, actionSchema(fresh), timed);
      }
    }

    for (const row of [
      {
        label: "stored-effective-current",
        schema: humanActionResultSchema(request, sameAuthority),
        value: laterAllowed,
      },
      {
        label: "stored-no-change-current",
        schema: humanActionResultSchema(noChangeRequest, {
          storedOutcome: storedNoChange,
          currentConsentRequestId: EXISTING_CONSENT_ID,
        }),
        value: noChangeLater,
      },
      {
        label: "stored-effective-history",
        schema: humanActionResultSchema(request, {
          storedOutcome: storedEffective,
          currentConsentRequestId: null,
        }),
        value: authorityLostQ1,
      },
    ] as const) {
      const before = clone(row.value);
      snapshotRecord(before)["serverNow"] =
        "2026-08-28T00:00:00.000000001Z";
      snapshotRecord(before)["expiresAt"] =
        "2026-08-28T00:00:00.000000002Z";
      accept(7, `${row.label}-one-nanosecond-before`, row.schema, before);
      const equal = clone(before);
      snapshotRecord(equal)["serverNow"] =
        "2026-08-28T00:00:00.000000002Z";
      reject(7, `${row.label}-equal-expiry`, row.schema, equal);
    }

    const invalidContext = {
      storedOutcome: storedEffective,
      currentConsentRequestId: request.requestId,
      extra: "forbidden",
    };
    assert.throws(
      () => humanActionResultSchema(request, invalidContext as ActionContext),
      /Unrecognized key/u,
    );
    coverage.get(7)!.negative += 1;
    recordLabel("N7:strict-validation-context");
  });

  await suite.test("8 schema-factory output types and upper-bound overflow rejection", () => {
    const failures = failureFixtures();
    mustParse(StartUnavailableFailureSchema, failures["start"]);
    mustParse(DemoTokenUnavailableSchema, failures["demoToken"]);
    const applicationFixtures = applicationSuccessFixtures();
    for (const requestFixture of applicationFixtures) {
      const schema = applicationResultSchemaForRequest(requestFixture.request);
      for (const resultFixture of applicationFixtures) {
        const label = `application-${requestFixture.mode}-result-${resultFixture.mode}`;
        if (requestFixture.mode === resultFixture.mode) {
          accept(8, label, schema, resultFixture.result);
        } else {
          reject(8, label, schema, resultFixture.result);
        }
      }
    }

    const applicationFailureNames = [
      "session",
      "stalePage",
      "staleState",
      "reuse",
      "invalid",
      "rate",
      "connection",
      "read",
      "evidence",
      "mutation",
      "receipt",
      "export",
      "start",
      "demoToken",
    ] as const;
    const applicationFailuresByMode: Readonly<
      Record<
        (typeof applicationFixtures)[number]["mode"],
        ReadonlySet<(typeof applicationFailureNames)[number]>
      >
    > = {
      bootstrap_challenge: new Set([
        "session",
        "invalid",
        "rate",
        "connection",
      ]),
      takeover: new Set([
        "session",
        "stalePage",
        "staleState",
        "reuse",
        "invalid",
        "rate",
        "connection",
      ]),
      snapshot: new Set([
        "session",
        "stalePage",
        "invalid",
        "rate",
        "read",
      ]),
      evidence_excerpt: new Set([
        "session",
        "stalePage",
        "invalid",
        "rate",
        "read",
        "evidence",
      ]),
    };
    for (const row of applicationFixtures) {
      const schema = applicationResultSchemaForRequest(row.request);
      for (const failureName of applicationFailureNames) {
        const label = `application-${row.mode}-failure-${failureName}`;
        if (applicationFailuresByMode[row.mode].has(failureName)) {
          accept(8, label, schema, failures[failureName]);
        } else {
          reject(8, label, schema, failures[failureName]);
        }
      }
    }

    const receiptFixtures = receiptSuccessFixtures();
    for (const requestFixture of receiptFixtures) {
      const schema = receiptResultSchemaForRequest(requestFixture.request);
      for (const resultFixture of receiptFixtures) {
        const label = `receipt-${requestFixture.mode}-result-${resultFixture.mode}`;
        if (requestFixture.mode === resultFixture.mode) {
          accept(8, label, schema, resultFixture.result);
        } else {
          reject(8, label, schema, resultFixture.result);
        }
      }
    }

    const receiptFailureNames = [
      "session",
      "stalePage",
      "invalid",
      "rate",
      "connection",
      "receipt",
      "export",
      "read",
      "mutation",
      "start",
      "demoToken",
    ] as const;
    const receiptFailuresByMode: Readonly<
      Record<
        (typeof receiptFixtures)[number]["mode"],
        ReadonlySet<(typeof receiptFailureNames)[number]>
      >
    > = {
      load: new Set([
        "session",
        "stalePage",
        "invalid",
        "rate",
        "connection",
        "receipt",
      ]),
      export_json: new Set([
        "session",
        "stalePage",
        "invalid",
        "rate",
        "connection",
        "export",
      ]),
      prepare_print: new Set([
        "session",
        "stalePage",
        "invalid",
        "rate",
        "connection",
        "export",
      ]),
    };
    for (const row of receiptFixtures) {
      const schema = receiptResultSchemaForRequest(row.request);
      for (const failureName of receiptFailureNames) {
        const label = `receipt-${row.mode}-failure-${failureName}`;
        if (receiptFailuresByMode[row.mode].has(failureName)) {
          accept(8, label, schema, failures[failureName]);
        } else {
          reject(8, label, schema, failures[failureName]);
        }
      }
    }

    const actionCases = HUMAN_ACTIONS.map((action) => canonicalCurrentCase(action));
    for (const requestCase of actionCases) {
      for (const resultCase of actionCases) {
        const label = `human-factory-${requestCase.action}-result-${resultCase.action}`;
        if (requestCase.action === resultCase.action) {
          accept(8, label, actionSchema(requestCase), resultCase.result);
        } else {
          reject(8, label, actionSchema(requestCase), resultCase.result);
        }
      }
    }

    const byAction = new Map<HumanActionName, HistoricalCase>();
    for (const row of historicalCases) {
      if (!byAction.has(row.action)) byAction.set(row.action, row);
    }
    assert.equal(byAction.size, 11);
    for (const action of HUMAN_ACTIONS) {
      const row = byAction.get(action)!;
      accept(8, `historical-factory-${action}`, actionSchema(row), row.result);
      const wrongAction = HUMAN_ACTIONS[(HUMAN_ACTIONS.indexOf(action) + 1) % HUMAN_ACTIONS.length]!;
      const wrongRequest = makeRequest(wrongAction, {
        applicationRevision:
          wrongAction === "return_to_draft" || wrongAction === "revoke_assisted_access" ? 2 : 1,
      });
      reject(
        8,
        `historical-factory-${action}-wrong-${wrongAction}`,
        humanActionResultSchema(wrongRequest, {
          storedOutcome: null,
          currentConsentRequestId: null,
        }),
        row.result,
      );
    }

    const humanFailureRows: readonly Readonly<{
      label: string;
      request: HumanAction;
    }>[] = [
      {
        label: "bind-nonincome",
        request: makeRequest("bind_evidence", {
          field: "legal_name",
          claimHandle: handle(0),
        }),
      },
      {
        label: "bind-income",
        request: makeRequest("bind_evidence", {
          field: "annual_household_income",
          claimHandle: handle(7),
        }),
      },
      { label: "clear", request: makeRequest("clear_evidence") },
      { label: "dependency", request: makeRequest("clear_dependency") },
      { label: "save", request: makeRequest("save_email") },
      { label: "declare", request: makeRequest("declare_email") },
      { label: "resolve", request: makeRequest("resolve_income") },
      {
        label: "clear-income",
        request: makeRequest("clear_income_resolution"),
      },
      { label: "allow", request: makeRequest("allow_assisted_access") },
      {
        label: "revoke",
        request: makeRequest("revoke_assisted_access", {
          applicationRevision: 2,
        }),
      },
      { label: "prepare", request: makeRequest("prepare_review") },
      {
        label: "return",
        request: makeRequest("return_to_draft", {
          applicationRevision: 2,
        }),
      },
    ];
    assert.equal(humanFailureRows.length, 12);
    const fullBaseRows = new Set([
      "bind-nonincome",
      "bind-income",
      "clear",
      "resolve",
      "prepare",
      "return",
    ]);
    const baseFailureNames = [
      "session",
      "stalePage",
      "staleState",
      "reuse",
      "invalid",
      "rate",
      "mutation",
    ] as const;
    for (const row of humanFailureRows) {
      const schema = humanActionResultSchema(row.request, {
        storedOutcome: null,
        currentConsentRequestId: null,
      });
      if (fullBaseRows.has(row.label)) {
        for (const failureName of baseFailureNames) {
          accept(
            8,
            `human-${row.label}-base-failure-${failureName}`,
            schema,
            failures[failureName],
          );
        }
      } else {
        accept(
          8,
          `human-${row.label}-mutation-failure-alias`,
          schema,
          failures["mutation"],
        );
      }
    }

    const humanExtensionNames = [
      "evidence",
      "conflict",
      "cap",
      "notReady",
      "invalidated",
    ] as const;
    for (const row of humanFailureRows) {
      const schema = humanActionResultSchema(row.request, {
        storedOutcome: null,
        currentConsentRequestId: null,
      });
      for (const failureName of humanExtensionNames) {
        const acceptsFailure =
          failureName === "cap" ||
          (failureName === "evidence" &&
            (row.request.action === "bind_evidence" ||
              row.request.action === "resolve_income")) ||
          (failureName === "conflict" &&
            row.label === "bind-income") ||
          (failureName === "notReady" &&
            row.request.action === "prepare_review") ||
          (failureName === "invalidated" &&
            row.request.action === "return_to_draft");
        const label = `human-${row.label}-extension-${failureName}`;
        if (acceptsFailure) {
          accept(8, label, schema, failures[failureName]);
        } else {
          reject(8, label, schema, failures[failureName]);
        }
      }
    }

    for (const row of humanFailureRows) {
      const schema = humanActionResultSchema(row.request, {
        storedOutcome: null,
        currentConsentRequestId: null,
      });
      for (const failureName of ["start", "demoToken"] as const) {
        reject(
          8,
          `human-${row.label}-rejects-foreign-${failureName}`,
          schema,
          failures[failureName],
        );
      }
    }

    const ordinaryContent = humanFailureRows.find(
      ({ label }) => label === "clear",
    )!;
    const ordinaryContentSchema = humanActionResultSchema(
      ordinaryContent.request,
      { storedOutcome: null, currentConsentRequestId: null },
    );
    for (const failureName of [
      "connection",
      "read",
      "receipt",
      "export",
    ] as const) {
      reject(
        8,
        `human-ordinary-content-rejects-${failureName}-temporary-shape`,
        ordinaryContentSchema,
        failures[failureName],
      );
    }

    const maxMinusOne = canonicalCurrentCase("bind_evidence", "effect", {
      pageEpoch: MAX_SAFE - 1,
      applicationRevision: MAX_SAFE - 1,
      requirementsVersion: 1,
    });
    accept(8, "effect-max-minus-one-to-max", actionSchema(maxMinusOne), maxMinusOne.result);
    const atMaxRequest = makeRequest("bind_evidence", {
      pageEpoch: MAX_SAFE,
      applicationRevision: MAX_SAFE,
      requirementsVersion: 1,
    });
    const impossibleMaxEffect = clone(maxMinusOne.result);
    const impossibleSnapshot = snapshotRecord(impossibleMaxEffect);
    impossibleSnapshot["pageEpoch"] = MAX_SAFE;
    impossibleSnapshot["applicationRevision"] = MAX_SAFE;
    reject(
      8,
      "effect-successor-from-max-rejected",
      humanActionResultSchema(atMaxRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      impossibleMaxEffect,
    );

    const maxNoChange = canonicalCurrentCase("bind_evidence", "no_change", {
      pageEpoch: MAX_SAFE,
      applicationRevision: MAX_SAFE,
      requirementsVersion: 1,
    });
    accept(8, "no-change-at-max", actionSchema(maxNoChange), maxNoChange.result);

    const historicalMaxRequest = makeRequest("bind_evidence", {
      pageEpoch: MAX_SAFE - 1,
      applicationRevision: MAX_SAFE - 1,
      requirementsVersion: 1,
    });
    const historicalMax = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: {
          outcome: "action_applied",
          action: "bind_evidence",
          fields: ["legal_name"],
          versions: { applicationRevision: MAX_SAFE, requirementsVersion: 1 },
        },
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: MAX_SAFE - 1,
          applicationRevision: MAX_SAFE,
          requirementsVersion: 1,
          projectionSequence: 1,
        }),
      },
    };
    accept(
      8,
      "historical-effect-max-minus-one-to-max",
      humanActionResultSchema(historicalMaxRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      historicalMax,
    );

    const historicalClampedMaxEffect = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: {
          outcome: "action_applied",
          action: "bind_evidence",
          fields: ["legal_name"],
          versions: {
            applicationRevision: MAX_SAFE,
            requirementsVersion: 1,
          },
        },
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: MAX_SAFE,
          applicationRevision: MAX_SAFE,
          requirementsVersion: 1,
          projectionSequence: 0,
        }),
      },
    };
    mustParse(HistoricalActionReplayV1Schema, historicalClampedMaxEffect);
    reject(
      8,
      "historical-effect-successor-from-max-rejected",
      humanActionResultSchema(atMaxRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      historicalClampedMaxEffect,
    );

    const stableAtMax = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: {
          outcome: "evidence_unavailable",
          action: "bind_evidence",
          field: "legal_name",
          versions: { applicationRevision: MAX_SAFE, requirementsVersion: 1 },
        },
        snapshot: draftSnapshot(makeDraft(), {
          pageEpoch: MAX_SAFE,
          applicationRevision: MAX_SAFE,
          requirementsVersion: 1,
          projectionSequence: 1,
        }),
      },
    };
    accept(
      8,
      "historical-refusal-at-max",
      humanActionResultSchema(atMaxRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      stableAtMax,
    );

    const reachableDependency = canonicalCurrentCase("clear_dependency", "effect", {
      pageEpoch: 1,
      applicationRevision: 128,
      requirementsVersion: 128,
    });
    accept(
      8,
      "largest-reachable-dependency-successor-128-129",
      actionSchema(reachableDependency),
      reachableDependency.result,
    );
    const beyondProjection = canonicalCurrentCase("clear_dependency", "effect", {
      pageEpoch: 1,
      applicationRevision: 129,
      requirementsVersion: 129,
    });
    reject(
      8,
      "dependency-successor-beyond-projection-cap",
      actionSchema(beyondProjection),
      beyondProjection.result,
    );
    assert.equal(
      HumanActionRequestSchema.safeParse({
        requestId: uuid(777),
        expectedPageEpoch: 1,
        expectedApplicationRevision: MAX_SAFE + 1,
        expectedRequirementsVersion: 1,
        action: "bind_evidence",
        field: "legal_name",
        claimHandle: handle(0),
      }).success,
      false,
    );
    coverage.get(8)!.negative += 1;
    recordLabel("N8:unsafe-request-integer");

    const historicalDependencyRequest = makeRequest("clear_dependency", {
      pageEpoch: 1,
      applicationRevision: 128,
      requirementsVersion: 128,
    });
    const historicalDependencyAtLimit = {
      ok: true,
      data: {
        kind: "action_replayed",
        original: {
          outcome: "action_applied",
          action: "clear_dependency",
          fields: ["dependency", "guardian_name", "household_size"],
          versions: { applicationRevision: 129, requirementsVersion: 129 },
        },
        snapshot: draftSnapshot(draftForClearDependency(), {
          pageEpoch: 1,
          applicationRevision: 129,
          requirementsVersion: 129,
          projectionSequence: 128,
        }),
      },
    };
    mustParse(HistoricalActionReplayV1Schema, historicalDependencyAtLimit);
    accept(
      8,
      "historical-largest-reachable-dependency-successor-128-129",
      humanActionResultSchema(historicalDependencyRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      historicalDependencyAtLimit,
    );
    const historicalDependencyClampedRequest = makeRequest(
      "clear_dependency",
      {
        pageEpoch: 1,
        applicationRevision: 129,
        requirementsVersion: 129,
      },
    );
    reject(
      8,
      "historical-dependency-successor-clamped-at-public-limit",
      humanActionResultSchema(historicalDependencyClampedRequest, {
        storedOutcome: null,
        currentConsentRequestId: null,
      }),
      historicalDependencyAtLimit,
    );

    const probes = typeProbeSource();
    assert.equal(
      probes.positive.match(/\/\/ POS:/gu)?.length ?? 0,
      probes.positiveMarkers,
    );
    assert.equal(
      probes.negative.match(/\/\/ NEG:/gu)?.length ?? 0,
      probes.negativeMarkers,
    );
    assert.equal(probes.positiveMarkers, 548);
    assert.equal(probes.negativeMarkers, 94);

    const sentinel = compileVirtual(`const sentinel: string = 1;`, "sentinel");
    assert.equal(sentinel.length, 1, diagnosticText(sentinel));
    assert.equal(sentinel[0]!.code, 2322);
    const positiveDiagnostics = compileVirtual(probes.positive, "positive");
    assert.equal(
      positiveDiagnostics.length,
      0,
      diagnosticText(positiveDiagnostics),
    );
    const negativeDiagnostics = compileVirtual(probes.negative, "negative");
    assert.equal(
      negativeDiagnostics.length,
      probes.negativeMarkers,
      diagnosticText(negativeDiagnostics),
    );
    const negativeLines = probes.negative.split("\n");
    const observedMarkers = negativeDiagnostics
      .map((diagnostic) => {
        assert.equal(diagnostic.code, 2322);
        assert.notEqual(diagnostic.file, undefined);
        assert.notEqual(diagnostic.start, undefined);
        const position = diagnostic.file!.getLineAndCharacterOfPosition(
          diagnostic.start!,
        );
        assert.ok(position.line > 0);
        return {
          line: position.line,
          marker: negativeLines[position.line - 1]!.trim(),
        };
      })
      .sort((left, right) => left.line - right.line)
      .map(({ marker }) => marker);
    assert.deepEqual(
      observedMarkers,
      Array.from(
        { length: probes.negativeMarkers },
        (_, index) => `// NEG:${index + 1}`,
      ),
    );
    compileNegativeCount = negativeDiagnostics.length;
  });

  await suite.test("WebMCP and visible-human authority remain separate", () => {
    assert.equal(TOOL_NAMES.length, 6);
    assert.equal(new Set(TOOL_NAMES).size, 6);
    for (const forbidden of [
      "submit",
      "receipt",
      "export",
      "declare",
      "resolve",
      "return",
    ]) {
      assert.equal(
        TOOL_NAMES.some((name) => name.includes(forbidden)),
        false,
      );
    }

    const validInputs: Readonly<Record<(typeof TOOL_NAMES)[number], unknown>> = {
      get_application_state: { mode: "redacted" },
      get_form_requirements: { mode: "all" },
      get_evidence_index: {},
      apply_evidence_backed_answers: {
        requestId: uuid(600),
        expectedApplicationRevision: 1,
        expectedRequirementsVersion: 1,
        changes: [
          {
            kind: "propose_email",
            field: "preferred_contact_email",
            value: "anaya.rao@example.test",
          },
        ],
      },
      get_validation_issues: {},
      prepare_submission_review: {
        requestId: uuid(601),
        expectedApplicationRevision: 1,
        expectedRequirementsVersion: 1,
      },
    };
    assert.deepEqual(
      AssistedChangeSchema.options.map((option) => option.shape.kind.value),
      ["bind_claim", "propose_email"],
    );
    assert.deepEqual(
      Object.fromEntries(
        AssistedChangeSchema.options.map((option) => [
          option.shape.kind.value,
          Object.keys(option.shape).sort(),
        ]),
      ),
      {
        bind_claim: ["claimHandle", "field", "kind"],
        propose_email: ["field", "kind", "value"],
      },
    );
    const allowedChanges = [
      {
        kind: "bind_claim",
        field: "legal_name",
        claimHandle: handle(0),
      },
      {
        kind: "propose_email",
        field: "preferred_contact_email",
        value: "anaya.rao@example.test",
      },
    ] as const;
    for (const allowedChange of allowedChanges) {
      assert.equal(AssistedChangeSchema.safeParse(allowedChange).success, true);
      assert.equal(
        ApplyEvidenceBackedAnswersInputSchema.safeParse({
          ...asRecord(validInputs.apply_evidence_backed_answers),
          changes: [allowedChange],
        }).success,
        true,
      );
      const nestedSubmit = { ...allowedChange, submit: true };
      assert.equal(
        AssistedChangeSchema.safeParse(nestedSubmit).success,
        false,
      );
      assert.equal(
        ApplyEvidenceBackedAnswersInputSchema.safeParse({
          ...asRecord(validInputs.apply_evidence_backed_answers),
          changes: [nestedSubmit],
        }).success,
        false,
      );
    }
    for (const forbiddenChange of [
      { kind: "declare_email", field: "preferred_contact_email" },
      {
        kind: "resolve_income",
        field: "annual_household_income",
        claimHandle: handle(7),
        reason: "more_recent",
      },
      { kind: "return_to_draft" },
      { kind: "submit" },
    ] as const) {
      assert.equal(
        AssistedChangeSchema.safeParse(forbiddenChange).success,
        false,
      );
      assert.equal(
        ApplyEvidenceBackedAnswersInputSchema.safeParse({
          ...asRecord(validInputs.apply_evidence_backed_answers),
          changes: [forbiddenChange],
        }).success,
        false,
      );
    }
    for (const name of TOOL_NAMES) {
      assert.equal(TOOL_INPUT_SCHEMAS[name].safeParse(validInputs[name]).success, true);
      const smuggled = { ...asRecord(validInputs[name]), submit: true };
      assert.equal(TOOL_INPUT_SCHEMAS[name].safeParse(smuggled).success, false);
    }

    assert.equal(
      ApplyEvidenceBackedAnswersInputSchema.safeParse({
        ...asRecord(validInputs.apply_evidence_backed_answers),
        reviewId: REVIEW_ID,
      }).success,
      false,
    );
    assert.equal(
      PrepareSubmissionReviewInputSchema.safeParse({
        ...asRecord(validInputs.prepare_submission_review),
        contentHash: fingerprint(99),
      }).success,
      false,
    );
    assert.equal(
      HumanActionRequestSchema.safeParse({
        requestId: uuid(602),
        expectedPageEpoch: 1,
        expectedApplicationRevision: 1,
        expectedRequirementsVersion: 1,
        action: "submit",
      }).success,
      false,
    );
    assert.equal(
      SubmissionRequestSchema.safeParse({
        mode: "submit",
        intent: {
          requestId: uuid(603),
          expectedPageEpoch: 1,
          expectedApplicationRevision: 2,
          reviewId: REVIEW_ID,
          reviewSourceRevision: 1,
          contentHash: fingerprint(99),
        },
      }).success,
      true,
    );
  });

  await suite.test(
    "resolve_income refuses every reason the applicant did not state",
    () => {
      // D-P1-1. The frozen Review and the receipt quote this reason back as the
      // applicant's own — "You chose the Synthetic Income Statement because it
      // is the more recent source." — and it is baked into the content hash.
      // The request schema is the boundary that guarantees the value came from
      // a person: it is a closed enum of exactly the three offered reasons, so
      // an omitted field, the UI's empty placeholder, or any string the client
      // invents is refused before the action ever reaches the service. This
      // widens nothing; it pins the existing narrowness so a later change
      // cannot quietly relax it.
      const coordinates = {
        requestId: uuid(604),
        expectedPageEpoch: 1,
        expectedApplicationRevision: 1,
        expectedRequirementsVersion: 1,
        action: "resolve_income",
        claimHandle: handle(6),
      } as const;

      for (const reason of CONFLICT_REASONS) {
        assert.equal(
          HumanActionRequestSchema.safeParse({ ...coordinates, reason }).success,
          true,
          `${reason} is one of the three the applicant may choose`,
        );
      }

      // Omitted entirely.
      assert.equal(
        HumanActionRequestSchema.safeParse(coordinates).success,
        false,
      );
      // The empty placeholder the selector now starts on.
      for (const notAReason of [
        "",
        " ",
        "null",
        "unspecified",
        "more recent",
        "MORE_RECENT",
        "more_recent ",
      ]) {
        assert.equal(
          HumanActionRequestSchema.safeParse({
            ...coordinates,
            reason: notAReason,
          }).success,
          false,
          `${JSON.stringify(notAReason)} is not a stated reason`,
        );
      }
      // Non-string shapes cannot slip through either.
      for (const notAReason of [null, undefined, 0, true, {}, ["more_recent"]]) {
        assert.equal(
          HumanActionRequestSchema.safeParse({
            ...coordinates,
            reason: notAReason,
          }).success,
          false,
        );
      }
      // And the closed enum is exactly the three the UI offers, so the
      // selector and the server cannot drift apart.
      assert.deepEqual(
        [...CONFLICT_REASONS],
        ["more_recent", "corrected_record", "confirmed_for_application"],
      );
    },
  );

  await suite.test("coverage ledger closes all eight families", () => {
    const expectedCoverage: readonly Readonly<{
      family: FamilyId;
      positive: number;
      negative: number;
    }>[] = [
      { family: 1, positive: 44, negative: 188 },
      { family: 2, positive: 68, negative: 113 },
      { family: 3, positive: 18, negative: 30 },
      { family: 4, positive: 3, negative: 3 },
      { family: 5, positive: 8, negative: 5 },
      { family: 6, positive: 4, negative: 24 },
      { family: 7, positive: 104, negative: 160 },
      { family: 8, positive: 141, negative: 263 },
    ];
    assert.equal(expectedCoverage.length, 8);
    for (const [index, family] of LOCKED_FAMILIES.entries()) {
      const counts = coverage.get((index + 1) as FamilyId)!;
      assert.ok(counts.positive > 0, `${family} has no positive probe`);
      assert.ok(counts.negative > 0, `${family} has no negative probe`);
      assert.deepEqual(counts, {
        positive: expectedCoverage[index]!.positive,
        negative: expectedCoverage[index]!.negative,
      });
    }
    assert.equal(compileNegativeCount, 94);
    const runtimeProbeCount = [...coverage.values()].reduce(
      (total, counts) => total + counts.positive + counts.negative,
      0,
    );
    assert.equal(runtimeProbeCount, 1_176);
    assert.equal(labels.size, runtimeProbeCount);
    const source = readFileSync(import.meta.filename, "utf8");
    assert.equal(/\b(?:test|suite)\.(?:skip|todo|only)\b/u.test(source), false);
    const onlyCall = [".", "on", "ly", "("].join("");
    assert.equal(source.includes(onlyCall), false);
  });
});
