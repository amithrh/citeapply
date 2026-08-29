import { z } from "zod";

import {
  ConflictReasonSchema,
  EvidenceBindingSchema,
  Sha256Schema,
  SyntheticTestEmailSchema,
  type ConflictReason,
  type EvidenceField,
  type FieldId,
  type OrdinaryClearField,
  type ParsedClaim,
  type ParsedPacketV1,
} from "../contracts/common.ts";
import {
  canonicalizeAssistedChanges,
  type CanonicalAssistedChanges,
} from "../contracts/webmcp.ts";
import {
  evaluateEvidencePolicy,
  type EvidencePolicyDecision,
  type PolicyBinding,
} from "./evidence-policy.ts";
import { FIELD_ORDER, activeFieldIds, isFieldActive } from "./fields.ts";

const DraftOriginSchema = z.enum(["manual", "assisted"]);
export type DraftOrigin = z.infer<typeof DraftOriginSchema>;

function missingFieldSchema<const F extends FieldId>(field: F) {
  return z
    .object({ field: z.literal(field), status: z.literal("missing") })
    .strict();
}

function readyStringEvidenceFieldSchema<
  const F extends "legal_name" | "student_id" | "institution" | "guardian_name",
>(field: F) {
  return z
    .object({
      field: z.literal(field),
      status: z.literal("ready"),
      value: z
        .string()
        .min(1)
        .max(160)
        .refine((candidate) => candidate === candidate.normalize("NFC")),
      origin: DraftOriginSchema,
      bindings: z.tuple([EvidenceBindingSchema]),
    })
    .strict();
}

const LegalNameDraftFieldSchema = z.union([
  missingFieldSchema("legal_name"),
  readyStringEvidenceFieldSchema("legal_name"),
]);
const StudentIdDraftFieldSchema = z.union([
  missingFieldSchema("student_id"),
  readyStringEvidenceFieldSchema("student_id"),
]);
const InstitutionDraftFieldSchema = z.union([
  missingFieldSchema("institution"),
  readyStringEvidenceFieldSchema("institution"),
]);

const EmailDeclarationSchema = z
  .object({
    email: SyntheticTestEmailSchema,
    declaredByApplicant: z.literal(true),
  })
  .strict();

const PreferredContactEmailDraftFieldSchema = z.union([
  missingFieldSchema("preferred_contact_email"),
  z
    .object({
      field: z.literal("preferred_contact_email"),
      status: z.literal("needs_declaration"),
      value: SyntheticTestEmailSchema,
      origin: DraftOriginSchema,
    })
    .strict(),
  z
    .object({
      field: z.literal("preferred_contact_email"),
      status: z.literal("ready"),
      value: SyntheticTestEmailSchema,
      origin: DraftOriginSchema,
      declaration: EmailDeclarationSchema,
    })
    .strict()
    .refine(({ value, declaration }) => value === declaration.email, {
      message: "The declaration must bind the exact saved email.",
      path: ["declaration", "email"],
    }),
]);

const DependencyDraftFieldSchema = z.union([
  missingFieldSchema("dependency"),
  z
    .object({
      field: z.literal("dependency"),
      status: z.literal("ready"),
      value: z.literal(true),
      origin: DraftOriginSchema,
      bindings: z.tuple([EvidenceBindingSchema]),
    })
    .strict(),
]);

const GuardianNameDraftFieldSchema = z.union([
  missingFieldSchema("guardian_name"),
  readyStringEvidenceFieldSchema("guardian_name"),
]);

const HouseholdSizeDraftFieldSchema = z.union([
  missingFieldSchema("household_size"),
  z
    .object({
      field: z.literal("household_size"),
      status: z.literal("ready"),
      value: z.number().int().safe().min(1),
      origin: DraftOriginSchema,
      bindings: z.tuple([EvidenceBindingSchema]),
    })
    .strict(),
]);

const SupportedIncomeDraftFieldSchema = z
  .object({
    field: z.literal("annual_household_income"),
    status: z.literal("ready"),
    value: z.number().int().safe().nonnegative(),
    origin: DraftOriginSchema,
    resolution: z.literal("source_supported"),
    bindings: z.tuple([EvidenceBindingSchema, EvidenceBindingSchema]),
  })
  .strict()
  .refine(
    ({ bindings }) => bindings[0].fingerprint !== bindings[1].fingerprint,
    {
      message: "Supported income bindings must identify two distinct claims.",
      path: ["bindings"],
    },
  );

const ResolvedIncomeDraftFieldSchema = z
  .object({
    field: z.literal("annual_household_income"),
    status: z.literal("ready"),
    value: z.number().int().safe().nonnegative(),
    origin: z.literal("manual"),
    resolution: z
      .object({
        chosenFingerprint: Sha256Schema,
        reason: ConflictReasonSchema,
      })
      .strict(),
    bindings: z.tuple([EvidenceBindingSchema, EvidenceBindingSchema]),
  })
  .strict()
  .refine(
    ({ bindings, resolution }) =>
      bindings[0].fingerprint !== bindings[1].fingerprint &&
      bindings.some(
        ({ fingerprint }) => fingerprint === resolution.chosenFingerprint,
      ),
    {
      message: "Resolved income must choose one of two distinct bound claims.",
      path: ["resolution", "chosenFingerprint"],
    },
  );

const AnnualHouseholdIncomeDraftFieldSchema = z.union([
  missingFieldSchema("annual_household_income"),
  z
    .object({
      field: z.literal("annual_household_income"),
      status: z.literal("conflict"),
    })
    .strict(),
  SupportedIncomeDraftFieldSchema,
  ResolvedIncomeDraftFieldSchema,
]);

const DraftFieldV1Schema = z.union([
  LegalNameDraftFieldSchema,
  StudentIdDraftFieldSchema,
  InstitutionDraftFieldSchema,
  PreferredContactEmailDraftFieldSchema,
  DependencyDraftFieldSchema,
  GuardianNameDraftFieldSchema,
  HouseholdSizeDraftFieldSchema,
  AnnualHouseholdIncomeDraftFieldSchema,
]);

const DraftFieldsV1Schema = z.tuple([
  LegalNameDraftFieldSchema,
  StudentIdDraftFieldSchema,
  InstitutionDraftFieldSchema,
  PreferredContactEmailDraftFieldSchema,
  DependencyDraftFieldSchema,
  GuardianNameDraftFieldSchema,
  HouseholdSizeDraftFieldSchema,
  AnnualHouseholdIncomeDraftFieldSchema,
]);

export const DraftAggregateV1Schema = z
  .object({
    schema: z.literal("citeapply-draft-v1"),
    fields: DraftFieldsV1Schema,
  })
  .strict()
  .superRefine(({ fields }, context) => {
    const dependency = fields[4];
    const guardianName = fields[5];
    const householdSize = fields[6];
    if (
      dependency.status === "missing" &&
      (guardianName.status !== "missing" || householdSize.status !== "missing")
    ) {
      context.addIssue({
        code: "custom",
        message: "Inactive conditional fields cannot retain saved values.",
        path: ["fields"],
      });
    }
  });

type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

export type DraftAggregateV1 = DeepReadonly<
  z.infer<typeof DraftAggregateV1Schema>
>;
type DraftFieldV1 = DraftAggregateV1["fields"][number];

export type DraftTransitionResult =
  | Readonly<{
      outcome: "applied";
      draft: DraftAggregateV1;
      updatedFields: readonly FieldId[];
      applicationRevisionDelta: 1;
      requirementsVersionDelta: 0 | 1;
    }>
  | Readonly<{
      outcome: "no_change";
      draft: DraftAggregateV1;
      updatedFields: readonly [];
      applicationRevisionDelta: 0;
      requirementsVersionDelta: 0;
    }>
  | Readonly<{
      outcome: "evidence_unavailable";
      field: EvidenceField;
      draft: DraftAggregateV1;
      updatedFields: readonly [];
      applicationRevisionDelta: 0;
      requirementsVersionDelta: 0;
    }>
  | Readonly<{
      outcome: "conflict_requires_human";
      field: "annual_household_income";
      draft: DraftAggregateV1;
      updatedFields: readonly [];
      applicationRevisionDelta: 0;
      requirementsVersionDelta: 0;
    }>;

type BindDraftEvidenceInput = Readonly<{
  draft: DraftAggregateV1;
  packet: Readonly<ParsedPacketV1>;
  field: EvidenceField;
  claimHandle: string;
  origin: DraftOrigin;
}>;

type ApplyAssistedDraftChangesInput = Readonly<{
  draft: DraftAggregateV1;
  packet: Readonly<ParsedPacketV1>;
  changes: CanonicalAssistedChanges;
}>;

const NO_UPDATED_FIELDS = Object.freeze([]) as readonly [];

function deepFreezeJson<const T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  for (const child of Object.values(value)) deepFreezeJson(child);
  return Object.isFrozen(value) ? value : Object.freeze(value);
}

function isDeeplyFrozen(value: unknown): boolean {
  if (value === null || typeof value !== "object") return true;
  if (!Object.isFrozen(value)) return false;
  return Object.values(value).every(isDeeplyFrozen);
}

function bindingsEqual(
  left: readonly PolicyBinding[],
  right: readonly PolicyBinding[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (binding, index) =>
        binding.fingerprint === right[index]?.fingerprint &&
        binding.document === right[index]?.document &&
        binding.page === right[index]?.page,
    )
  );
}

function claimForBinding(
  packet: Readonly<ParsedPacketV1>,
  binding: PolicyBinding,
): ParsedClaim | undefined {
  const matches = packet.claims.filter(
    (claim) =>
      claim.fingerprint === binding.fingerprint &&
      claim.document === binding.document &&
      claim.page === binding.page,
  );
  return matches.length === 1 ? matches[0] : undefined;
}

function incomeClaims(packet: Readonly<ParsedPacketV1>): Readonly<{
  statement: Extract<ParsedClaim, { kind: "annual_household_income" }>;
  household: Extract<ParsedClaim, { kind: "annual_household_income" }>;
}> | null {
  const claims = packet.claims.filter(
    (
      claim,
    ): claim is Extract<ParsedClaim, { kind: "annual_household_income" }> =>
      claim.kind === "annual_household_income",
  );
  const statement = claims.find(({ document }) => document === "income");
  const household = claims.find(({ document }) => document === "household");
  if (
    claims.length !== 2 ||
    statement === undefined ||
    household === undefined ||
    statement.fingerprint === household.fingerprint ||
    statement.claimHandle === household.claimHandle
  ) {
    return null;
  }
  return { statement, household };
}

function readyOrdinaryFieldMatchesPacket(
  packet: Readonly<ParsedPacketV1>,
  field: Exclude<
    DraftFieldV1,
    { field: "preferred_contact_email" } | { field: "annual_household_income" }
  >,
): boolean {
  if (field.status === "missing") return true;
  const binding = field.bindings[0];
  const claim = claimForBinding(packet, binding);
  if (claim === undefined || claim.kind !== field.field) return false;
  const decision = evaluateEvidencePolicy(
    packet,
    field.field,
    claim.claimHandle,
  );
  return (
    decision.outcome === "accepted" &&
    decision.policy === "ordinary" &&
    Object.is(decision.value, field.value) &&
    bindingsEqual(decision.bindings, field.bindings)
  );
}

function incomeFieldMatchesPacket(
  packet: Readonly<ParsedPacketV1>,
  field: DraftAggregateV1["fields"][7],
): boolean {
  const currentClaims = incomeClaims(packet);
  if (currentClaims === null) return false;
  const valuesMatch =
    currentClaims.statement.normalizedValue ===
    currentClaims.household.normalizedValue;

  if (field.status === "missing") return valuesMatch;
  if (field.status === "conflict") return !valuesMatch;

  const canonicalBindings = [
    {
      fingerprint: currentClaims.statement.fingerprint,
      document: currentClaims.statement.document,
      page: currentClaims.statement.page,
    },
    {
      fingerprint: currentClaims.household.fingerprint,
      document: currentClaims.household.document,
      page: currentClaims.household.page,
    },
  ] as const;
  if (!bindingsEqual(field.bindings, canonicalBindings)) return false;

  if (field.resolution === "source_supported") {
    if (!valuesMatch) return false;
    const decision = evaluateEvidencePolicy(
      packet,
      "annual_household_income",
      currentClaims.statement.claimHandle,
    );
    return (
      decision.outcome === "accepted" &&
      decision.policy === "source_supported" &&
      decision.value === field.value &&
      bindingsEqual(decision.bindings, field.bindings)
    );
  }

  if (valuesMatch) return false;
  const chosen =
    field.resolution.chosenFingerprint === currentClaims.statement.fingerprint
      ? currentClaims.statement
      : field.resolution.chosenFingerprint ===
          currentClaims.household.fingerprint
        ? currentClaims.household
        : undefined;
  return chosen !== undefined && chosen.normalizedValue === field.value;
}

function draftMatchesPacket(
  draft: DraftAggregateV1,
  packet: Readonly<ParsedPacketV1>,
): boolean {
  if (
    new Set(packet.claims.map(({ claimHandle }) => claimHandle)).size !==
      packet.claims.length ||
    new Set(packet.claims.map(({ fingerprint }) => fingerprint)).size !==
      packet.claims.length
  ) {
    return false;
  }
  for (const field of draft.fields) {
    switch (field.field) {
      case "preferred_contact_email":
        break;
      case "annual_household_income":
        if (!incomeFieldMatchesPacket(packet, field)) return false;
        break;
      default:
        if (!readyOrdinaryFieldMatchesPacket(packet, field)) return false;
    }
  }
  return true;
}

export function parseDraftAggregateForPacket(
  value: unknown,
  packet: Readonly<ParsedPacketV1>,
): DraftAggregateV1 {
  const parsed = DraftAggregateV1Schema.parse(value) as DraftAggregateV1;
  if (!draftMatchesPacket(parsed, packet)) {
    throw new TypeError(
      "Draft aggregate is not coherent with the current parsed packet.",
    );
  }
  return deepFreezeJson(parsed);
}

function currentDraftForTransition(
  draft: DraftAggregateV1,
  packet: Readonly<ParsedPacketV1>,
): DraftAggregateV1 {
  const parsed = parseDraftAggregateForPacket(draft, packet);
  return isDeeplyFrozen(draft) ? draft : parsed;
}

function dependencyIsSaved(draft: DraftAggregateV1): boolean {
  return draft.fields[4].status === "ready";
}

export function activeDraftFieldIds(
  draft: DraftAggregateV1,
): readonly FieldId[] {
  return Object.freeze([...activeFieldIds(dependencyIsSaved(draft))]);
}

function initialIncomeState(packet: Readonly<ParsedPacketV1>): {
  field: "annual_household_income";
  status: "missing" | "conflict";
} {
  const claims = incomeClaims(packet);
  if (claims === null) {
    throw new TypeError("The parsed packet has no coherent income sources.");
  }
  const decision = evaluateEvidencePolicy(
    packet,
    "annual_household_income",
    claims.statement.claimHandle,
  );
  if (
    decision.outcome === "accepted" &&
    decision.policy === "source_supported"
  ) {
    return { field: "annual_household_income", status: "missing" };
  }
  if (decision.outcome === "conflict_requires_human") {
    return { field: "annual_household_income", status: "conflict" };
  }
  throw new TypeError("The parsed packet has no coherent income policy.");
}

export function createInitialDraft(
  packet: Readonly<ParsedPacketV1>,
): DraftAggregateV1 {
  return parseDraftAggregateForPacket(
    {
      schema: "citeapply-draft-v1",
      fields: [
        { field: "legal_name", status: "missing" },
        { field: "student_id", status: "missing" },
        { field: "institution", status: "missing" },
        { field: "preferred_contact_email", status: "missing" },
        { field: "dependency", status: "missing" },
        { field: "guardian_name", status: "missing" },
        { field: "household_size", status: "missing" },
        initialIncomeState(packet),
      ],
    },
    packet,
  );
}

function bindingSemanticKey(binding: PolicyBinding): readonly unknown[] {
  return [binding.fingerprint, binding.document, binding.page];
}

function savedFieldSemanticKey(field: DraftFieldV1): readonly unknown[] {
  if (field.status === "missing" || field.status === "conflict") {
    return [field.field, field.status];
  }
  if (field.field === "preferred_contact_email") {
    return field.status === "needs_declaration"
      ? [field.field, field.status, field.value]
      : [
          field.field,
          field.status,
          field.value,
          field.declaration.email,
          field.declaration.declaredByApplicant,
        ];
  }
  if (field.field === "annual_household_income") {
    return field.resolution === "source_supported"
      ? [
          field.field,
          field.status,
          field.value,
          field.resolution,
          ...field.bindings.map(bindingSemanticKey),
        ]
      : [
          field.field,
          field.status,
          field.value,
          field.resolution.chosenFingerprint,
          field.resolution.reason,
          ...field.bindings.map(bindingSemanticKey),
        ];
  }
  return [
    field.field,
    field.status,
    field.value,
    ...field.bindings.map(bindingSemanticKey),
  ];
}

function sameSavedFieldState(
  current: DraftFieldV1,
  candidate: DraftFieldV1,
): boolean {
  return (
    JSON.stringify(savedFieldSemanticKey(current)) ===
    JSON.stringify(savedFieldSemanticKey(candidate))
  );
}

function replaceDraftField(
  draft: DraftAggregateV1,
  packet: Readonly<ParsedPacketV1>,
  candidate: DraftFieldV1,
): DraftAggregateV1 {
  const index = FIELD_ORDER.indexOf(candidate.field);
  if (index < 0) throw new TypeError("Unknown Draft field.");
  const fields: unknown[] = [...draft.fields];
  fields[index] = candidate;
  return parseDraftAggregateForPacket(
    { schema: "citeapply-draft-v1", fields },
    packet,
  );
}

function noChange(draft: DraftAggregateV1): DraftTransitionResult {
  return Object.freeze({
    outcome: "no_change",
    draft,
    updatedFields: NO_UPDATED_FIELDS,
    applicationRevisionDelta: 0,
    requirementsVersionDelta: 0,
  });
}

function evidenceUnavailable(
  draft: DraftAggregateV1,
  field: EvidenceField,
): DraftTransitionResult {
  return Object.freeze({
    outcome: "evidence_unavailable",
    field,
    draft,
    updatedFields: NO_UPDATED_FIELDS,
    applicationRevisionDelta: 0,
    requirementsVersionDelta: 0,
  });
}

function conflictRequiresHuman(draft: DraftAggregateV1): DraftTransitionResult {
  return Object.freeze({
    outcome: "conflict_requires_human",
    field: "annual_household_income",
    draft,
    updatedFields: NO_UPDATED_FIELDS,
    applicationRevisionDelta: 0,
    requirementsVersionDelta: 0,
  });
}

function applied(
  draft: DraftAggregateV1,
  updatedFields: readonly FieldId[],
  requirementsVersionDelta: 0 | 1,
): DraftTransitionResult {
  return Object.freeze({
    outcome: "applied",
    draft,
    updatedFields: Object.freeze([...updatedFields]),
    applicationRevisionDelta: 1,
    requirementsVersionDelta,
  });
}

function acceptedPolicyField(
  field: EvidenceField,
  origin: DraftOrigin,
  decision: Extract<EvidencePolicyDecision, { outcome: "accepted" }>,
): DraftFieldV1 {
  return DraftFieldV1Schema.parse({
    field,
    status: "ready",
    value: decision.value,
    origin,
    ...(decision.policy === "source_supported"
      ? { resolution: "source_supported" }
      : {}),
    bindings: decision.bindings,
  }) as DraftFieldV1;
}

export function bindDraftEvidence(
  input: BindDraftEvidenceInput,
): DraftTransitionResult {
  const current = currentDraftForTransition(input.draft, input.packet);
  if (!isFieldActive(input.field, dependencyIsSaved(current))) {
    return evidenceUnavailable(current, input.field);
  }

  const decision = evaluateEvidencePolicy(
    input.packet,
    input.field,
    input.claimHandle,
  );
  if (decision.outcome === "evidence_unavailable") {
    return evidenceUnavailable(current, input.field);
  }
  if (decision.outcome === "conflict_requires_human") {
    return conflictRequiresHuman(current);
  }

  const candidate = acceptedPolicyField(input.field, input.origin, decision);
  const existing = current.fields[FIELD_ORDER.indexOf(input.field)];
  if (existing === undefined) {
    return evidenceUnavailable(current, input.field);
  }
  if (sameSavedFieldState(existing, candidate)) return noChange(current);

  const wasDependencySaved = dependencyIsSaved(current);
  const next = replaceDraftField(current, input.packet, candidate);
  const requirementsDelta =
    wasDependencySaved === dependencyIsSaved(next) ? 0 : 1;
  return applied(next, [input.field], requirementsDelta);
}

function proposeAssistedEmail(
  draft: DraftAggregateV1,
  packet: Readonly<ParsedPacketV1>,
  value: string,
): DraftAggregateV1 | null {
  const current = draft.fields[3];
  // A declared email is a completed human decision; assistance cannot replace
  // it or revert it to an undeclared assisted value.
  if (current.status === "ready") return null;
  if (current.status !== "missing" && current.value === value) return null;
  const candidate = PreferredContactEmailDraftFieldSchema.parse({
    field: "preferred_contact_email",
    status: "needs_declaration",
    value,
    origin: "assisted",
  }) as DraftFieldV1;
  return replaceDraftField(draft, packet, candidate);
}

export function applyAssistedDraftChanges(
  input: ApplyAssistedDraftChangesInput,
): DraftTransitionResult {
  const current = currentDraftForTransition(input.draft, input.packet);
  const changes = canonicalizeAssistedChanges(input.changes);
  const initialDependencyIsSaved = dependencyIsSaved(current);

  for (const change of changes) {
    if (!isFieldActive(change.field, initialDependencyIsSaved)) {
      return evidenceUnavailable(current, change.field as EvidenceField);
    }
  }

  let candidate = current;
  const updatedFields: FieldId[] = [];
  for (const change of changes) {
    if (change.kind === "propose_email") {
      const next = proposeAssistedEmail(candidate, input.packet, change.value);
      if (next !== null) {
        candidate = next;
        updatedFields.push(change.field);
      }
      continue;
    }

    const result = bindDraftEvidence({
      draft: candidate,
      packet: input.packet,
      field: change.field,
      claimHandle: change.claimHandle,
      origin: "assisted",
    });
    if (result.outcome === "evidence_unavailable") {
      return evidenceUnavailable(current, result.field);
    }
    if (result.outcome === "conflict_requires_human") {
      return conflictRequiresHuman(current);
    }
    if (result.outcome === "applied") {
      candidate = result.draft;
      updatedFields.push(change.field);
    }
  }

  if (updatedFields.length === 0) return noChange(current);
  const requirementsDelta =
    initialDependencyIsSaved === dependencyIsSaved(candidate) ? 0 : 1;
  return applied(candidate, updatedFields, requirementsDelta);
}

export type ClearDraftEvidenceInput = Readonly<{
  draft: DraftAggregateV1;
  packet: Readonly<ParsedPacketV1>;
  field: OrdinaryClearField;
}>;

/**
 * Clears one ordinary evidence field. Dependency and a resolved income
 * conflict are excluded: those carry a confirmed clear of their own because
 * clearing them discards a decision rather than a link.
 */
export function clearDraftEvidence(
  input: ClearDraftEvidenceInput,
): DraftTransitionResult {
  const current = currentDraftForTransition(input.draft, input.packet);
  if (!isFieldActive(input.field, dependencyIsSaved(current))) {
    return evidenceUnavailable(current, input.field);
  }
  const index = FIELD_ORDER.indexOf(input.field);
  const existing = current.fields[index];
  if (existing === undefined) return noChange(current);
  if (existing.status === "missing") return noChange(current);
  if (
    input.field === "annual_household_income" &&
    existing.status === "ready" &&
    existing.field === "annual_household_income" &&
    existing.resolution !== "source_supported"
  ) {
    // A human-resolved conflict needs the confirmed clear, not this one.
    return evidenceUnavailable(current, input.field);
  }

  const cleared = clearedFieldFor(input.field, input.packet);
  const next = replaceDraftField(current, input.packet, cleared);
  return applied(next, [input.field], 0);
}

function clearedFieldFor(
  field: FieldId,
  packet: Readonly<ParsedPacketV1>,
): DraftFieldV1 {
  if (field === "annual_household_income") {
    return DraftFieldV1Schema.parse(initialIncomeState(packet)) as DraftFieldV1;
  }
  return DraftFieldV1Schema.parse({ field, status: "missing" }) as DraftFieldV1;
}

/**
 * Closing the branch clears and excludes both conditional answers in the same
 * atomic effect, so no inactive value can survive.
 */
export function clearDraftDependency(
  draft: DraftAggregateV1,
  packet: Readonly<ParsedPacketV1>,
): DraftTransitionResult {
  const current = currentDraftForTransition(draft, packet);
  if (current.fields[4].status === "missing") return noChange(current);

  const fields: unknown[] = [...current.fields];
  fields[4] = { field: "dependency", status: "missing" };
  fields[5] = { field: "guardian_name", status: "missing" };
  fields[6] = { field: "household_size", status: "missing" };
  const next = parseDraftAggregateForPacket(
    { schema: "citeapply-draft-v1", fields },
    packet,
  );
  return applied(next, ["dependency", "guardian_name", "household_size"], 1);
}

export function saveDraftEmail(
  draft: DraftAggregateV1,
  packet: Readonly<ParsedPacketV1>,
  value: string,
): DraftTransitionResult {
  const current = currentDraftForTransition(draft, packet);
  const existing = current.fields[3];
  const normalized = value.trim().normalize("NFC");
  if (existing.status !== "missing" && existing.value === normalized) {
    return noChange(current);
  }
  // Saving always reopens the declaration: the applicant declares what they
  // can currently see.
  const candidate = PreferredContactEmailDraftFieldSchema.parse({
    field: "preferred_contact_email",
    status: "needs_declaration",
    value: normalized,
    origin: "manual",
  }) as DraftFieldV1;
  return applied(
    replaceDraftField(current, packet, candidate),
    ["preferred_contact_email"],
    0,
  );
}

/**
 * The declaration is the applicant's own statement about the saved address. No
 * assisted path can produce it.
 */
export function declareDraftEmail(
  draft: DraftAggregateV1,
  packet: Readonly<ParsedPacketV1>,
): DraftTransitionResult {
  const current = currentDraftForTransition(draft, packet);
  const existing = current.fields[3];
  // Nothing is saved to declare yet; this is a no-op, not an evidence failure
  // attributed to some unrelated field.
  if (existing.status === "missing") return noChange(current);
  if (existing.status === "ready") return noChange(current);

  const candidate = PreferredContactEmailDraftFieldSchema.parse({
    field: "preferred_contact_email",
    status: "ready",
    value: existing.value,
    origin: existing.origin,
    declaration: { email: existing.value, declaredByApplicant: true },
  }) as DraftFieldV1;
  return applied(
    replaceDraftField(current, packet, candidate),
    ["preferred_contact_email"],
    0,
  );
}

export type ResolveIncomeInput = Readonly<{
  draft: DraftAggregateV1;
  packet: Readonly<ParsedPacketV1>;
  claimHandle: string;
  reason: ConflictReason;
}>;

/**
 * Resolves a disagreement between two accepted income sources. Only a visible
 * applicant action reaches this transition, and the chosen source must be one
 * of the two the portal actually parsed.
 */
export function resolveDraftIncome(
  input: ResolveIncomeInput,
): DraftTransitionResult {
  const current = currentDraftForTransition(input.draft, input.packet);
  const existing = current.fields[7];
  if (existing.status !== "conflict") {
    return evidenceUnavailable(current, "annual_household_income");
  }

  const claims = incomeClaims(input.packet);
  if (claims === null) {
    return evidenceUnavailable(current, "annual_household_income");
  }
  const chosen = [claims.statement, claims.household].find(
    (claim) => claim.claimHandle === input.claimHandle,
  );
  if (chosen === undefined) {
    return evidenceUnavailable(current, "annual_household_income");
  }

  const candidate = DraftFieldV1Schema.parse({
    field: "annual_household_income",
    status: "ready",
    value: chosen.normalizedValue,
    origin: "manual",
    resolution: {
      chosenFingerprint: chosen.fingerprint,
      reason: input.reason,
    },
    bindings: [
      {
        fingerprint: claims.statement.fingerprint,
        document: claims.statement.document,
        page: 1,
      },
      {
        fingerprint: claims.household.fingerprint,
        document: claims.household.document,
        page: 1,
      },
    ],
  }) as DraftFieldV1;

  return applied(
    replaceDraftField(current, input.packet, candidate),
    ["annual_household_income"],
    0,
  );
}

/**
 * Discards a resolution and returns the field to the unresolved conflict, so
 * the applicant can decide again.
 */
export function clearDraftIncomeResolution(
  draft: DraftAggregateV1,
  packet: Readonly<ParsedPacketV1>,
): DraftTransitionResult {
  const current = currentDraftForTransition(draft, packet);
  const existing = current.fields[7];
  if (
    existing.status !== "ready" ||
    existing.field !== "annual_household_income" ||
    existing.resolution === "source_supported"
  ) {
    return noChange(current);
  }
  const cleared = clearedFieldFor("annual_household_income", packet);
  return applied(
    replaceDraftField(current, packet, cleared),
    ["annual_household_income"],
    0,
  );
}
