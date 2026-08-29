import { z } from "zod";

import {
  AgentDocumentsV1Schema,
  ApplicationContentV1Schema,
  AuthorityMetaV1Schema,
  ClaimHandleSchema,
  ConflictReasonSchema,
  DomainReadinessBlockersSchema,
  EvidenceFieldSchema,
  EvidenceClaimsV1Schema,
  FIELD_IDS,
  FieldIdSchema,
  OrdinaryClearFieldSchema,
  PacketCodeSchema,
  PageEpochSchema,
  PositiveRequirementsVersionSchema,
  ParsedPacketV1Schema,
  Rfc3339InstantSchema,
  SafeRevisionSchema,
  Sha256Schema,
  SyntheticTestEmailSchema,
  UuidV4Schema,
  VersionsSchema,
  hasCanonicalReadinessBlockerOrder,
  successSchema,
  type ApplicationContentV1,
  type AuthorityMetaV1,
  type EvidenceField,
  type FieldId,
  type ParsedPacketV1,
  type Versions,
} from "./common.ts";
import {
  AtCapacityFailureSchema,
  BridgeInactiveFailureSchema,
  ConflictRequiresHumanFailureSchema,
  ConnectionUnavailableSchema,
  DemoChangeLimitFailureSchema,
  DemoTokenUnavailableSchema,
  DocumentUnavailableFailureSchema,
  EvidenceUnavailableFailureSchema,
  ExportUnavailableSchema,
  HumanNotReadyFailureSchema,
  InvalidRequestFailureSchema,
  MutationUnavailableSchema,
  RateLimitedFailureSchema,
  ReadUnavailableSchema,
  ReceiptUnavailableSchema,
  RequestReuseMismatchFailureSchema,
  ReviewInvalidatedFailureSchema,
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  StaleStateFailureSchema,
  StartInvalidRequestFailureSchema,
  StartRequestReuseMismatchFailureSchema,
  StartUnavailableFailureSchema,
} from "./outcomes.ts";

export const CapabilitySchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const ChallengeSchema = z.string().min(1).max(512);

export const HumanBindingV1Schema = z
  .object({
    claimHandle: ClaimHandleSchema,
    document: z.enum(["enrollment", "household", "income"]),
    page: z.literal(1),
  })
  .strict();

function inactiveConditionalFieldSchema<
  const F extends "guardian_name" | "household_size",
>(field: F) {
  return z
    .object({
      field: z.literal(field),
      active: z.literal(false),
      status: z.literal("not_required"),
    })
    .strict();
}

function missingEvidenceFieldSchema<const F extends EvidenceField>(field: F) {
  return z
    .object({
      field: z.literal(field),
      active: z.literal(true),
      status: z.literal("missing"),
    })
    .strict();
}

const InactiveGuardianFieldSchema =
  inactiveConditionalFieldSchema("guardian_name");
const InactiveHouseholdSizeFieldSchema =
  inactiveConditionalFieldSchema("household_size");
const InactiveConditionalFieldSchema = z.union([
  InactiveGuardianFieldSchema,
  InactiveHouseholdSizeFieldSchema,
]);

const MissingLegalNameFieldSchema = missingEvidenceFieldSchema("legal_name");
const MissingStudentIdFieldSchema = missingEvidenceFieldSchema("student_id");
const MissingInstitutionFieldSchema = missingEvidenceFieldSchema("institution");
const MissingDependencyFieldSchema = missingEvidenceFieldSchema("dependency");
const MissingGuardianFieldSchema = missingEvidenceFieldSchema("guardian_name");
const MissingHouseholdSizeFieldSchema =
  missingEvidenceFieldSchema("household_size");
const MissingIncomeFieldSchema = missingEvidenceFieldSchema(
  "annual_household_income",
);
const MissingEvidenceFieldSchema = z.union([
  MissingLegalNameFieldSchema,
  MissingStudentIdFieldSchema,
  MissingInstitutionFieldSchema,
  MissingDependencyFieldSchema,
  MissingGuardianFieldSchema,
  MissingHouseholdSizeFieldSchema,
  MissingIncomeFieldSchema,
]);

const readyOriginShape = {
  active: z.literal(true),
  status: z.literal("ready"),
  origin: z.enum(["manual", "assisted"]),
} as const;

function readyStringFieldSchema<
  const F extends "legal_name" | "student_id" | "institution" | "guardian_name",
>(field: F) {
  return z
    .object({
      ...readyOriginShape,
      field: z.literal(field),
      value: z
        .string()
        .min(1)
        .max(160)
        .refine((candidate) => candidate === candidate.normalize("NFC")),
      bindings: z.tuple([HumanBindingV1Schema]),
    })
    .strict();
}

const ReadyLegalNameFieldSchema = readyStringFieldSchema("legal_name");
const ReadyStudentIdFieldSchema = readyStringFieldSchema("student_id");
const ReadyInstitutionFieldSchema = readyStringFieldSchema("institution");
const ReadyGuardianFieldSchema = readyStringFieldSchema("guardian_name");
const ReadyStringFieldSchema = z.union([
  ReadyLegalNameFieldSchema,
  ReadyStudentIdFieldSchema,
  ReadyInstitutionFieldSchema,
  ReadyGuardianFieldSchema,
]);

const ReadyDependencyFieldSchema = z
  .object({
    ...readyOriginShape,
    field: z.literal("dependency"),
    value: z.literal(true),
    bindings: z.tuple([HumanBindingV1Schema]),
  })
  .strict();

const ReadyHouseholdSizeFieldSchema = z
  .object({
    ...readyOriginShape,
    field: z.literal("household_size"),
    value: z.number().int().safe().min(1),
    bindings: z.tuple([HumanBindingV1Schema]),
  })
  .strict();

const ConflictIncomeFieldSchema = z
  .object({
    field: z.literal("annual_household_income"),
    active: z.literal(true),
    status: z.literal("conflict"),
    claims: z.tuple([ClaimHandleSchema, ClaimHandleSchema]),
  })
  .strict();

const ReadySupportedIncomeFieldSchema = z
  .object({
    field: z.literal("annual_household_income"),
    active: z.literal(true),
    status: z.literal("ready"),
    value: z.number().int().safe().nonnegative(),
    origin: z.enum(["manual", "assisted"]),
    resolution: z.literal("source_supported"),
    bindings: z.tuple([HumanBindingV1Schema, HumanBindingV1Schema]),
  })
  .strict();

const ReadyResolvedIncomeFieldSchema = z
  .object({
    field: z.literal("annual_household_income"),
    active: z.literal(true),
    status: z.literal("ready"),
    value: z.number().int().safe().nonnegative(),
    origin: z.literal("manual"),
    resolution: z
      .object({
        chosen: HumanBindingV1Schema,
        reason: ConflictReasonSchema,
      })
      .strict(),
  })
  .strict();

const MissingEmailFieldSchema = z
  .object({
    field: z.literal("preferred_contact_email"),
    active: z.literal(true),
    status: z.literal("missing"),
  })
  .strict();

const UndeclaredEmailFieldSchema = z
  .object({
    field: z.literal("preferred_contact_email"),
    active: z.literal(true),
    status: z.literal("needs_declaration"),
    value: SyntheticTestEmailSchema,
    origin: z.enum(["manual", "assisted"]),
  })
  .strict();

const ReadyEmailFieldSchema = z
  .object({
    field: z.literal("preferred_contact_email"),
    active: z.literal(true),
    status: z.literal("ready"),
    value: SyntheticTestEmailSchema,
    origin: z.enum(["manual", "assisted"]),
    declaredByApplicant: z.literal(true),
  })
  .strict();

export const HumanFieldV1Schema = z.union([
  InactiveConditionalFieldSchema,
  MissingEvidenceFieldSchema,
  ReadyStringFieldSchema,
  ReadyDependencyFieldSchema,
  ReadyHouseholdSizeFieldSchema,
  ConflictIncomeFieldSchema,
  ReadySupportedIncomeFieldSchema,
  ReadyResolvedIncomeFieldSchema,
  MissingEmailFieldSchema,
  UndeclaredEmailFieldSchema,
  ReadyEmailFieldSchema,
]);

export const HumanActivityV1Schema = z.union([
  z
    .object({
      kind: z.enum([
        "assistance_allowed",
        "assistance_revoked",
        "assisted_review_prepared",
      ]),
      at: Rfc3339InstantSchema,
      revision: SafeRevisionSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("answers_applied"),
      at: Rfc3339InstantSchema,
      revision: SafeRevisionSchema,
      fields: z
        .array(FieldIdSchema)
        .min(1)
        .max(8)
        .refine(
          (fields) => {
            const indexes = fields.map((field) => FIELD_IDS.indexOf(field));
            return indexes.every(
              (index, position) =>
                position === 0 || index > indexes[position - 1]!,
            );
          },
          { message: "Activity fields must be unique and in canonical order." },
        ),
    })
    .strict(),
  z
    .object({
      kind: z.literal("income_refused"),
      at: Rfc3339InstantSchema,
      revision: SafeRevisionSchema,
      field: z.literal("annual_household_income"),
    })
    .strict(),
]);

const HumanEvidenceExcerptBaseShape = {
  claimHandle: ClaimHandleSchema,
  page: z.literal(1),
  excerpt: z.string().min(1).max(320),
} as const;

function stringExcerptSchema<
  const K extends "legal_name" | "student_id" | "institution" | "guardian_name",
  const T extends
    "Synthetic Enrollment Record" | "Synthetic Household Statement",
>(kind: K, title: T) {
  return z
    .object({
      ...HumanEvidenceExcerptBaseShape,
      title: z.literal(title),
      kind: z.literal(kind),
      normalizedValue: z
        .string()
        .min(1)
        .max(160)
        .refine((candidate) => candidate === candidate.normalize("NFC")),
    })
    .strict();
}

function numericExcerptSchema<
  const K extends "household_size" | "annual_household_income",
  const T extends
    "Synthetic Household Statement" | "Synthetic Income Statement",
>(kind: K, title: T) {
  return z
    .object({
      ...HumanEvidenceExcerptBaseShape,
      title: z.literal(title),
      kind: z.literal(kind),
      normalizedValue: z
        .number()
        .int()
        .safe()
        .min(kind === "household_size" ? 1 : 0),
    })
    .strict();
}

export const HumanEvidenceExcerptV1Schema = z.union([
  stringExcerptSchema("legal_name", "Synthetic Enrollment Record"),
  stringExcerptSchema("student_id", "Synthetic Enrollment Record"),
  stringExcerptSchema("institution", "Synthetic Enrollment Record"),
  z
    .object({
      ...HumanEvidenceExcerptBaseShape,
      title: z.literal("Synthetic Household Statement"),
      kind: z.literal("dependency"),
      normalizedValue: z.literal(true),
    })
    .strict(),
  stringExcerptSchema("guardian_name", "Synthetic Household Statement"),
  numericExcerptSchema("household_size", "Synthetic Household Statement"),
  numericExcerptSchema(
    "annual_household_income",
    "Synthetic Household Statement",
  ),
  numericExcerptSchema("annual_household_income", "Synthetic Income Statement"),
]);

const HumanFieldsV1Schema = z.tuple([
  z.union([MissingLegalNameFieldSchema, ReadyLegalNameFieldSchema]),
  z.union([MissingStudentIdFieldSchema, ReadyStudentIdFieldSchema]),
  z.union([MissingInstitutionFieldSchema, ReadyInstitutionFieldSchema]),
  z.union([
    MissingEmailFieldSchema,
    UndeclaredEmailFieldSchema,
    ReadyEmailFieldSchema,
  ]),
  z.union([MissingDependencyFieldSchema, ReadyDependencyFieldSchema]),
  z.union([
    InactiveGuardianFieldSchema,
    MissingGuardianFieldSchema,
    ReadyGuardianFieldSchema,
  ]),
  z.union([
    InactiveHouseholdSizeFieldSchema,
    MissingHouseholdSizeFieldSchema,
    ReadyHouseholdSizeFieldSchema,
  ]),
  z.union([
    MissingIncomeFieldSchema,
    ConflictIncomeFieldSchema,
    ReadySupportedIncomeFieldSchema,
    ReadyResolvedIncomeFieldSchema,
  ]),
]);

export const HumanActivitySummaryV1Schema = z
  .object({
    totals: z
      .object({
        allowed: z.number().int().safe().nonnegative(),
        revoked: z.number().int().safe().nonnegative(),
        acceptedBatches: z.number().int().safe().nonnegative(),
        refusals: z.number().int().safe().nonnegative(),
        assistedReviewsPrepared: z.number().int().safe().nonnegative(),
      })
      .strict(),
    latest: z.array(HumanActivityV1Schema).max(8),
  })
  .strict()
  .superRefine(({ totals, latest }, context) => {
    const identities = new Set<string>();
    for (const [index, event] of latest.entries()) {
      const identity = JSON.stringify(event);
      if (identities.has(identity)) {
        context.addIssue({
          code: "custom",
          message: "Latest activity entries must be unique.",
          path: ["latest", index],
        });
      }
      identities.add(identity);
      if (index > 0) {
        const prior = latest[index - 1]!;
        if (
          prior.revision < event.revision ||
          (prior.revision === event.revision && prior.at < event.at)
        ) {
          context.addIssue({
            code: "custom",
            message: "Latest activity must be reverse chronological.",
            path: ["latest", index],
          });
        }
      }
    }
    const visibleCounts = {
      allowed: latest.filter(({ kind }) => kind === "assistance_allowed")
        .length,
      revoked: latest.filter(({ kind }) => kind === "assistance_revoked")
        .length,
      acceptedBatches: latest.filter(({ kind }) => kind === "answers_applied")
        .length,
      refusals: latest.filter(({ kind }) => kind === "income_refused").length,
      assistedReviewsPrepared: latest.filter(
        ({ kind }) => kind === "assisted_review_prepared",
      ).length,
    };
    for (const key of Object.keys(
      visibleCounts,
    ) as (keyof typeof visibleCounts)[]) {
      if (totals[key] < visibleCounts[key]) {
        context.addIssue({
          code: "custom",
          message:
            "Activity totals cannot be smaller than the visible latest events.",
          path: ["totals", key],
        });
      }
    }
  });

const HumanDraftBaseSchema = z
  .object({
    packet: PacketCodeSchema,
    assistance: z.enum(["off", "allowed"]),
    progress: z
      .object({
        ready: z.number().int().safe().min(0).max(8),
        total: z.union([z.literal(6), z.literal(8)]),
      })
      .strict(),
    blockers: DomainReadinessBlockersSchema,
    fields: HumanFieldsV1Schema,
    documents: AgentDocumentsV1Schema,
    claims: EvidenceClaimsV1Schema,
    activity: HumanActivitySummaryV1Schema,
  })
  .strict();

type HumanDraftCandidate = z.infer<typeof HumanDraftBaseSchema>;

function addDraftIssue(
  context: z.RefinementCtx,
  message: string,
  path: PropertyKey[] = [],
): void {
  context.addIssue({ code: "custom", message, path });
}

function refineHumanDraft(
  draft: HumanDraftCandidate,
  context: z.RefinementCtx,
): void {
  const [
    legalName,
    studentId,
    institution,
    email,
    dependency,
    guardian,
    household,
    income,
  ] = draft.fields;
  const sixFieldState = draft.progress.total === 6;
  if (
    sixFieldState &&
    !(
      dependency.status === "missing" &&
      guardian.active === false &&
      household.active === false
    )
  ) {
    addDraftIssue(
      context,
      "A six-field Draft requires missing dependency and inactive conditional fields.",
      ["fields"],
    );
  }
  if (
    !sixFieldState &&
    !(
      dependency.status === "ready" &&
      dependency.value === true &&
      guardian.active === true &&
      household.active === true
    )
  ) {
    addDraftIssue(
      context,
      "An eight-field Draft requires saved dependency and active conditional fields.",
      ["fields"],
    );
  }

  const activeFields = draft.fields.filter((field) => field.active === true);
  const ready = activeFields.filter(({ status }) => status === "ready").length;
  if (draft.progress.ready !== ready) {
    addDraftIssue(
      context,
      "Draft progress must equal the number of active ready fields.",
      ["progress", "ready"],
    );
  }

  const expectedBlockers: Array<Readonly<{ code: string; field: FieldId }>> =
    [];
  for (const field of [
    legalName,
    studentId,
    institution,
    dependency,
    guardian,
    household,
    income,
  ]) {
    if (field.active === true && field.status === "missing") {
      expectedBlockers.push({ code: "missing_evidence", field: field.field });
    }
  }
  if (income.status === "conflict") {
    expectedBlockers.push({
      code: "conflict_requires_human",
      field: "annual_household_income",
    });
  }
  if (email.status === "missing") {
    expectedBlockers.push({
      code: "invalid_email",
      field: "preferred_contact_email",
    });
  } else if (email.status === "needs_declaration") {
    expectedBlockers.push({
      code: "declaration_required",
      field: "preferred_contact_email",
    });
  }
  const actualBlockers = draft.blockers.map(({ code, field }) => ({
    code,
    field,
  }));
  if (JSON.stringify(actualBlockers) !== JSON.stringify(expectedBlockers)) {
    addDraftIssue(
      context,
      "Draft blockers must exactly match current field states in canonical order.",
      ["blockers"],
    );
  }

  const claimByHandle = new Map(
    draft.claims.map((claim) => [claim.claimHandle, claim] as const),
  );
  for (const field of [
    legalName,
    studentId,
    institution,
    dependency,
    guardian,
    household,
  ]) {
    if (field.active !== true || field.status !== "ready") continue;
    const binding = field.bindings[0];
    const claim = claimByHandle.get(binding.claimHandle);
    if (
      claim === undefined ||
      claim.kind !== field.field ||
      claim.document !== binding.document ||
      claim.page !== binding.page ||
      claim.normalizedValue !== field.value
    ) {
      addDraftIssue(
        context,
        "A ready field binding must match its projected evidence claim.",
        ["fields"],
      );
    }
  }

  const householdIncomeClaim = draft.claims[6];
  const statementIncomeClaim = draft.claims[7];
  const incomesMatch =
    householdIncomeClaim.normalizedValue ===
    statementIncomeClaim.normalizedValue;
  if (
    (draft.packet === "supported" && !incomesMatch) ||
    (draft.packet === "conflict" && incomesMatch)
  ) {
    addDraftIssue(
      context,
      "Income claims must match the selected packet relationship.",
      ["claims"],
    );
  }
  if (income.status === "conflict") {
    if (
      draft.packet !== "conflict" ||
      income.claims[0] !== householdIncomeClaim.claimHandle ||
      income.claims[1] !== statementIncomeClaim.claimHandle
    ) {
      addDraftIssue(
        context,
        "An unresolved income conflict must identify both Conflict packet claims.",
        ["fields", 7],
      );
    }
  } else if (income.status === "ready") {
    if (income.resolution === "source_supported") {
      const [primary, corroborating] = income.bindings;
      if (
        draft.packet !== "supported" ||
        primary.document !== "income" ||
        corroborating.document !== "household" ||
        primary.claimHandle !== statementIncomeClaim.claimHandle ||
        corroborating.claimHandle !== householdIncomeClaim.claimHandle ||
        income.value !== statementIncomeClaim.normalizedValue
      ) {
        addDraftIssue(
          context,
          "Supported income must bind Income Statement first and Household corroboration second.",
          ["fields", 7],
        );
      }
    } else {
      const chosen = claimByHandle.get(income.resolution.chosen.claimHandle);
      if (
        draft.packet !== "conflict" ||
        chosen === undefined ||
        chosen.kind !== "annual_household_income" ||
        chosen.document !== income.resolution.chosen.document ||
        chosen.page !== income.resolution.chosen.page ||
        chosen.normalizedValue !== income.value
      ) {
        addDraftIssue(
          context,
          "Resolved Conflict income must match the applicant's chosen current claim.",
          ["fields", 7],
        );
      }
    }
  }
}

export const HumanDraftV1Schema =
  HumanDraftBaseSchema.superRefine(refineHumanDraft);

export const HumanReviewWarningV1Schema = z
  .object({
    code: z.literal("conflicting_income_resolved"),
    message: z.literal(
      "Income evidence differed and was resolved by the applicant.",
    ),
  })
  .strict();

function reviewDiffSchema<const F extends FieldId, const T extends z.ZodType>(
  field: F,
  final: T,
  excerptCount: 0 | 1 | 2,
) {
  const excerpts =
    excerptCount === 0
      ? z.tuple([])
      : excerptCount === 1
        ? z.tuple([HumanEvidenceExcerptV1Schema])
        : z.tuple([HumanEvidenceExcerptV1Schema, HumanEvidenceExcerptV1Schema]);
  return z
    .object({
      field: z.literal(field),
      initial: z.null(),
      final,
      excerpts,
    })
    .strict();
}

export const HumanReviewDiffsV1Schema = z.tuple([
  reviewDiffSchema("legal_name", ReadyLegalNameFieldSchema, 1),
  reviewDiffSchema("student_id", ReadyStudentIdFieldSchema, 1),
  reviewDiffSchema("institution", ReadyInstitutionFieldSchema, 1),
  reviewDiffSchema("preferred_contact_email", ReadyEmailFieldSchema, 0),
  reviewDiffSchema("dependency", ReadyDependencyFieldSchema, 1),
  reviewDiffSchema("guardian_name", ReadyGuardianFieldSchema, 1),
  reviewDiffSchema("household_size", ReadyHouseholdSizeFieldSchema, 1),
  reviewDiffSchema(
    "annual_household_income",
    z.union([ReadySupportedIncomeFieldSchema, ReadyResolvedIncomeFieldSchema]),
    2,
  ),
]);

function expectedTitle(
  document: "enrollment" | "household" | "income",
): string {
  switch (document) {
    case "enrollment":
      return "Synthetic Enrollment Record";
    case "household":
      return "Synthetic Household Statement";
    case "income":
      return "Synthetic Income Statement";
  }
}

function refineHumanReview(
  review: z.infer<typeof HumanReviewBaseSchema>,
  context: z.RefinementCtx,
): void {
  const contentFields = review.content.fields;
  for (const [index, diff] of review.diffs.entries()) {
    const content = contentFields[index]!;
    if (diff.field !== diff.final.field || diff.field !== content.field) {
      context.addIssue({
        code: "custom",
        message: "Review diff, final field, and content field must match.",
        path: ["diffs", index],
      });
      continue;
    }
    if ("value" in diff.final && diff.final.value !== content.value) {
      context.addIssue({
        code: "custom",
        message: "Review final value must equal canonical content.",
        path: ["diffs", index, "final", "value"],
      });
    }
    if (diff.field === "preferred_contact_email") {
      const emailContent = contentFields[3];
      if (
        diff.excerpts.length !== 0 ||
        emailContent.declaration.email !== diff.final.value ||
        emailContent.declaration.declaredByApplicant !== true
      ) {
        context.addIssue({
          code: "custom",
          message:
            "Review email must match its declaration and have no excerpt.",
          path: ["diffs", index],
        });
      }
      continue;
    }
    if (diff.field === "annual_household_income") continue;
    const binding = diff.final.bindings[0];
    const excerpt = diff.excerpts[0];
    if (
      excerpt === undefined ||
      excerpt.kind !== diff.field ||
      excerpt.normalizedValue !== diff.final.value ||
      excerpt.claimHandle !== binding.claimHandle ||
      excerpt.page !== binding.page ||
      excerpt.title !== expectedTitle(binding.document)
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Review field binding and excerpt must identify the same evidence.",
        path: ["diffs", index],
      });
    }
  }

  const incomeContent = contentFields[7];
  const incomeDiff = review.diffs[7];
  const incomeFinal = incomeDiff.final;
  if (incomeContent.field !== "annual_household_income") return;
  if (incomeFinal.resolution === "source_supported") {
    const [primary, corroborating] = incomeFinal.bindings;
    const [primaryExcerpt, corroboratingExcerpt] = incomeDiff.excerpts;
    if (
      primaryExcerpt === undefined ||
      corroboratingExcerpt === undefined ||
      incomeContent.resolution !== "source_supported" ||
      review.warnings.length !== 0 ||
      primary.document !== "income" ||
      corroborating.document !== "household" ||
      primaryExcerpt.kind !== "annual_household_income" ||
      corroboratingExcerpt.kind !== "annual_household_income" ||
      primaryExcerpt.claimHandle !== primary.claimHandle ||
      corroboratingExcerpt.claimHandle !== corroborating.claimHandle ||
      primaryExcerpt.page !== primary.page ||
      corroboratingExcerpt.page !== corroborating.page ||
      primaryExcerpt.title !== expectedTitle(primary.document) ||
      corroboratingExcerpt.title !== expectedTitle(corroborating.document) ||
      primaryExcerpt.normalizedValue !== incomeFinal.value ||
      corroboratingExcerpt.normalizedValue !== incomeFinal.value
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Supported income Review data must be exact corroborating evidence.",
        path: ["diffs", 7],
      });
    }
  } else {
    const [firstExcerpt, secondExcerpt] = incomeDiff.excerpts;
    const chosen = incomeFinal.resolution.chosen;
    const chosenExcerpt =
      firstExcerpt === undefined || secondExcerpt === undefined
        ? undefined
        : [firstExcerpt, secondExcerpt].find(
            ({ claimHandle }) => claimHandle === chosen.claimHandle,
          );
    if (
      firstExcerpt === undefined ||
      secondExcerpt === undefined ||
      typeof incomeContent.resolution === "string" ||
      incomeContent.resolution.reason !== incomeFinal.resolution.reason ||
      review.warnings.length !== 1 ||
      firstExcerpt.kind !== "annual_household_income" ||
      secondExcerpt.kind !== "annual_household_income" ||
      firstExcerpt.title !== expectedTitle("income") ||
      secondExcerpt.title !== expectedTitle("household") ||
      firstExcerpt.claimHandle === secondExcerpt.claimHandle ||
      firstExcerpt.normalizedValue === secondExcerpt.normalizedValue ||
      chosenExcerpt === undefined ||
      chosenExcerpt.page !== chosen.page ||
      chosenExcerpt.title !== expectedTitle(chosen.document) ||
      chosenExcerpt.normalizedValue !== incomeFinal.value
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Resolved income Review data must preserve the applicant's exact choice.",
        path: ["diffs", 7],
      });
    }
  }
}

const HumanReviewBaseSchema = z
  .object({
    reviewId: UuidV4Schema,
    shortId: z.string().regex(/^[0-9A-HJKMNP-TV-Z]{10}$/),
    sourceVersions: VersionsSchema,
    contentHash: Sha256Schema,
    content: ApplicationContentV1Schema,
    diffs: HumanReviewDiffsV1Schema,
    warnings: z.union([z.tuple([]), z.tuple([HumanReviewWarningV1Schema])]),
    activity: HumanActivitySummaryV1Schema,
  })
  .strict();

export const HumanReviewV1Schema =
  HumanReviewBaseSchema.superRefine(refineHumanReview);

export type HumanReviewValidationContext = Readonly<{
  expectedContentHash: string;
  expectedContent: ApplicationContentV1;
  expectedSourceVersions: Versions;
  expectedActivity: z.infer<typeof HumanActivitySummaryV1Schema>;
  parsedPacket: ParsedPacketV1;
  expectedOriginForField: (field: FieldId) => "manual" | "assisted" | undefined;
}>;

declare const coherentHumanReviewBrand: unique symbol;
export type CoherentHumanReviewV1 = z.infer<typeof HumanReviewV1Schema> & {
  readonly [coherentHumanReviewBrand]: true;
};

export function parseCoherentHumanReview(
  value: unknown,
  validation: HumanReviewValidationContext,
): CoherentHumanReviewV1 {
  const review = HumanReviewV1Schema.parse(value);
  const expectedContent = ApplicationContentV1Schema.parse(
    validation.expectedContent,
  );
  const expectedActivity = HumanActivitySummaryV1Schema.parse(
    validation.expectedActivity,
  );
  const expectedSourceVersions = VersionsSchema.parse(
    validation.expectedSourceVersions,
  );
  const parsedPacket = ParsedPacketV1Schema.parse(validation.parsedPacket);
  if (
    review.contentHash !== Sha256Schema.parse(validation.expectedContentHash) ||
    review.sourceVersions.applicationRevision !==
      expectedSourceVersions.applicationRevision ||
    review.sourceVersions.requirementsVersion !==
      expectedSourceVersions.requirementsVersion ||
    JSON.stringify(review.content) !== JSON.stringify(expectedContent) ||
    JSON.stringify(review.activity) !== JSON.stringify(expectedActivity)
  ) {
    throw new TypeError(
      "Review content, hash, activity, or source versions do not match the frozen Draft.",
    );
  }
  for (const diff of review.diffs) {
    if (diff.final.origin !== validation.expectedOriginForField(diff.field)) {
      throw new TypeError(
        "Review final origin does not match the frozen ready Draft.",
      );
    }
  }
  const claimsByHandle = new Map(
    parsedPacket.claims.map((claim) => [claim.claimHandle, claim] as const),
  );
  const documentsByCode = new Map(
    parsedPacket.documents.map(
      (document) => [document.code, document] as const,
    ),
  );
  for (const diff of review.diffs) {
    for (const excerpt of diff.excerpts) {
      const claim = claimsByHandle.get(excerpt.claimHandle);
      const document =
        claim === undefined ? undefined : documentsByCode.get(claim.document);
      if (
        claim === undefined ||
        document === undefined ||
        excerpt.title !== claim.title ||
        excerpt.page !== claim.page ||
        excerpt.kind !== claim.kind ||
        excerpt.normalizedValue !== claim.normalizedValue ||
        excerpt.excerpt !==
          document.pageText.slice(claim.anchor.start, claim.anchor.end)
      ) {
        throw new TypeError(
          "Review evidence excerpt does not match the runtime-parsed source bytes.",
        );
      }
    }
    const bindings =
      "bindings" in diff.final
        ? diff.final.bindings
        : "resolution" in diff.final &&
            typeof diff.final.resolution !== "string"
          ? [diff.final.resolution.chosen]
          : [];
    for (const binding of bindings) {
      const claim = claimsByHandle.get(binding.claimHandle);
      if (
        claim === undefined ||
        binding.document !== claim.document ||
        binding.page !== claim.page
      ) {
        throw new TypeError(
          "Review evidence binding does not match the runtime-parsed claim.",
        );
      }
    }
  }
  const contentFingerprints = review.content.fields.flatMap((field) =>
    "evidence" in field ? [...field.evidence] : [],
  );
  const boundFingerprints = review.diffs.flatMap((diff) =>
    diff.excerpts.map(
      ({ claimHandle }) => claimsByHandle.get(claimHandle)?.fingerprint,
    ),
  );
  const incomeContent = review.content.fields[7];
  const incomeFinal = review.diffs[7].final;
  const chosenFingerprint =
    incomeFinal.resolution === "source_supported"
      ? undefined
      : claimsByHandle.get(incomeFinal.resolution.chosen.claimHandle)
          ?.fingerprint;
  if (
    boundFingerprints.some((fingerprint) => fingerprint === undefined) ||
    new Set(boundFingerprints).size !== boundFingerprints.length ||
    contentFingerprints.length !== boundFingerprints.length ||
    contentFingerprints.some(
      (fingerprint, index) => fingerprint !== boundFingerprints[index],
    ) ||
    (typeof incomeContent.resolution !== "string" &&
      incomeContent.resolution.chosenFingerprint !== chosenFingerprint)
  ) {
    throw new TypeError(
      "Review evidence bindings do not match canonical fingerprints.",
    );
  }
  return review as CoherentHumanReviewV1;
}

export const ReceiptRecordV1Schema = z
  .object({
    schema: z.literal("citeapply-receipt-v1"),
    receiptId: UuidV4Schema,
    submittedAt: Rfc3339InstantSchema,
    acceptedApplicationRevision: SafeRevisionSchema,
    acceptedReview: HumanReviewV1Schema,
  })
  .strict()
  .refine(
    ({ acceptedApplicationRevision, acceptedReview }) =>
      acceptedApplicationRevision ===
      acceptedReview.sourceVersions.applicationRevision,
    {
      message:
        "Receipt revision must equal the accepted Review source revision.",
      path: ["acceptedApplicationRevision"],
    },
  );

export const DraftSnapshotV1Schema = AuthorityMetaV1Schema.extend({
  stage: z.literal("draft"),
  view: HumanDraftV1Schema,
})
  .strict()
  .refine(humanHttpSnapshotCoordinatesAreCausal, {
    message: "Draft authority coordinates are not causally reachable.",
  });

const HumanDraftOffV1Schema = HumanDraftBaseSchema.extend({
  assistance: z.literal("off"),
})
  .strict()
  .superRefine(refineHumanDraft);

const HumanDraftAllowedV1Schema = HumanDraftBaseSchema.extend({
  assistance: z.literal("allowed"),
})
  .strict()
  .superRefine(refineHumanDraft);

export const DraftOffSnapshotV1Schema = AuthorityMetaV1Schema.extend({
  stage: z.literal("draft"),
  view: HumanDraftOffV1Schema,
})
  .strict()
  .refine(humanHttpSnapshotCoordinatesAreCausal, {
    message: "Draft authority coordinates are not causally reachable.",
  });

export const DraftAllowedSnapshotV1Schema = AuthorityMetaV1Schema.extend({
  stage: z.literal("draft"),
  view: HumanDraftAllowedV1Schema,
})
  .strict()
  .refine(humanHttpSnapshotCoordinatesAreCausal, {
    message: "Allowed Draft authority coordinates are not causally reachable.",
  });

export const ReviewSnapshotV1Schema = AuthorityMetaV1Schema.extend({
  stage: z.literal("review"),
  review: HumanReviewV1Schema,
})
  .strict()
  .refine(humanHttpSnapshotCoordinatesAreCausal, {
    message: "Review authority coordinates are not causally reachable.",
  });

export const SubmittedSnapshotV1Schema = AuthorityMetaV1Schema.extend({
  stage: z.literal("submitted"),
  submittedAt: Rfc3339InstantSchema,
  receiptState: z.literal("load_required"),
})
  .strict()
  .refine(humanHttpSnapshotCoordinatesAreCausal, {
    message: "Submitted authority coordinates are not causally reachable.",
  });

export const HumanSnapshotV1Schema = z.discriminatedUnion("stage", [
  DraftSnapshotV1Schema,
  ReviewSnapshotV1Schema,
  SubmittedSnapshotV1Schema,
]);

export const TakeoverSnapshotV1Schema = z.discriminatedUnion("stage", [
  DraftOffSnapshotV1Schema,
  ReviewSnapshotV1Schema,
  SubmittedSnapshotV1Schema,
]);

export const ReceiptDeliveryV1Schema = z
  .object({
    receipt: ReceiptRecordV1Schema,
    expiresAt: Rfc3339InstantSchema,
    serverNow: Rfc3339InstantSchema,
  })
  .strict()
  .refine(
    ({ expiresAt, serverNow }) =>
      Date.parse(serverNow) <= Date.parse(expiresAt),
    {
      message: "Receipt delivery cannot be issued after session expiry.",
    },
  );

export const StartTokenSchema = z
  .object({
    nonce: z.string().regex(/^[A-Za-z0-9_-]{22}$/),
    issuedAt: Rfc3339InstantSchema,
    expiresAt: Rfc3339InstantSchema,
    signature: CapabilitySchema,
  })
  .strict()
  .refine(
    ({ issuedAt, expiresAt }) => Date.parse(issuedAt) < Date.parse(expiresAt),
    {
      message: "Start token expiry must be after issuance.",
    },
  );

export const DemoGetRequestSchema = z
  .object({ mode: z.literal("issue_start_token") })
  .strict();
export const DemoStartRequestSchema = z
  .object({
    mode: z.literal("start"),
    packet: PacketCodeSchema,
    startToken: StartTokenSchema,
    requestId: UuidV4Schema,
  })
  .strict();

export const DemoGetSuccessSchema = successSchema(
  z
    .object({ kind: z.literal("start_token"), startToken: StartTokenSchema })
    .strict(),
);
export const DemoStartSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("started"),
      destination: z.literal("/application"),
      expiresAt: Rfc3339InstantSchema,
    })
    .strict(),
);

export const DemoGetFailureSchema = z.union([
  failureWithMessage(
    "invalid_request",
    "CiteApply could not prepare a synthetic start.",
    "return_to_packet_selection",
  ),
  RateLimitedFailureSchema,
  DemoTokenUnavailableSchema,
]);

function failureWithMessage<
  const C extends string,
  const M extends string,
  const A extends string,
>(code: C, message: M, safeAction: A) {
  return z
    .object({
      ok: z.literal(false),
      error: z
        .object({
          code: z.literal(code),
          message: z.literal(message),
          safeActions: z.tuple([z.literal(safeAction)]),
        })
        .strict(),
    })
    .strict();
}

export const DemoStartFailureSchema = z.union([
  AtCapacityFailureSchema,
  DocumentUnavailableFailureSchema,
  StartInvalidRequestFailureSchema,
  StartRequestReuseMismatchFailureSchema,
  StartUnavailableFailureSchema,
]);

export const ApplicationRequestSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("bootstrap_challenge") }).strict(),
  z
    .object({
      mode: z.literal("takeover"),
      requestId: UuidV4Schema,
      expectedPageEpoch: PageEpochSchema,
      expectedApplicationRevision: SafeRevisionSchema,
      challenge: ChallengeSchema,
    })
    .strict(),
  z.object({ mode: z.literal("snapshot") }).strict(),
  z
    .object({
      mode: z.literal("evidence_excerpt"),
      claimHandle: ClaimHandleSchema,
    })
    .strict(),
]);

const ChallengeSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("challenge"),
      pageEpoch: PageEpochSchema,
      applicationRevision: SafeRevisionSchema,
      challenge: ChallengeSchema,
      challengeExpiresAt: Rfc3339InstantSchema,
    })
    .strict(),
);
const TakeoverSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("takeover"),
      pageCapability: CapabilitySchema,
      snapshot: TakeoverSnapshotV1Schema,
    })
    .strict(),
);
const SnapshotSuccessSchema = successSchema(
  z
    .object({ kind: z.literal("snapshot"), snapshot: HumanSnapshotV1Schema })
    .strict(),
);
const EvidenceExcerptSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("evidence_excerpt"),
      meta: AuthorityMetaV1Schema.refine(authorityCoordinatesAreCausal, {
        message: "Evidence authority coordinates are not causally reachable.",
      }),
      evidence: HumanEvidenceExcerptV1Schema,
    })
    .strict(),
);

export const ApplicationSuccessSchema = z.union([
  ChallengeSuccessSchema,
  TakeoverSuccessSchema,
  SnapshotSuccessSchema,
  EvidenceExcerptSuccessSchema,
]);

const actionCoordinates = {
  requestId: UuidV4Schema,
  expectedPageEpoch: PageEpochSchema,
  expectedApplicationRevision: SafeRevisionSchema,
  expectedRequirementsVersion: PositiveRequirementsVersionSchema,
} as const;

export const HumanActionRequestSchema = z.discriminatedUnion("action", [
  z
    .object({
      ...actionCoordinates,
      action: z.literal("bind_evidence"),
      field: EvidenceFieldSchema,
      claimHandle: ClaimHandleSchema,
    })
    .strict(),
  z
    .object({
      ...actionCoordinates,
      action: z.literal("clear_evidence"),
      field: OrdinaryClearFieldSchema,
    })
    .strict(),
  z
    .object({
      ...actionCoordinates,
      action: z.literal("clear_dependency"),
      confirmed: z.literal(true),
    })
    .strict(),
  z
    .object({
      ...actionCoordinates,
      action: z.literal("save_email"),
      value: SyntheticTestEmailSchema,
    })
    .strict(),
  z
    .object({ ...actionCoordinates, action: z.literal("declare_email") })
    .strict(),
  z
    .object({
      ...actionCoordinates,
      action: z.literal("resolve_income"),
      claimHandle: ClaimHandleSchema,
      reason: ConflictReasonSchema,
    })
    .strict(),
  z
    .object({
      ...actionCoordinates,
      action: z.literal("clear_income_resolution"),
      confirmed: z.literal(true),
    })
    .strict(),
  z
    .object({
      ...actionCoordinates,
      action: z.literal("allow_assisted_access"),
    })
    .strict(),
  z
    .object({
      ...actionCoordinates,
      action: z.literal("revoke_assisted_access"),
    })
    .strict(),
  z
    .object({ ...actionCoordinates, action: z.literal("prepare_review") })
    .strict(),
  z
    .object({ ...actionCoordinates, action: z.literal("return_to_draft") })
    .strict(),
]);

export const DRAFT_CONTENT_ACTIONS = [
  "bind_evidence",
  "clear_evidence",
  "clear_dependency",
  "save_email",
  "declare_email",
  "resolve_income",
  "clear_income_resolution",
] as const;
export const DraftContentActionSchema = z.enum(DRAFT_CONTENT_ACTIONS);

export const StoredBlockerCoordinateV1Schema = z.union([
  z
    .object({ code: z.literal("missing_evidence"), field: EvidenceFieldSchema })
    .strict(),
  z
    .object({
      code: z.literal("conflict_requires_human"),
      field: z.literal("annual_household_income"),
    })
    .strict(),
  z
    .object({
      code: z.enum(["invalid_email", "declaration_required"]),
      field: z.literal("preferred_contact_email"),
    })
    .strict(),
]);

const StoredBlockerCoordinatesV1Schema = z
  .array(StoredBlockerCoordinateV1Schema)
  .min(1)
  .max(8)
  .refine(hasCanonicalReadinessBlockerOrder, {
    message: "Stored blockers must be unique and in canonical order.",
  });

function storedAppliedOutcome<
  const A extends (typeof DRAFT_CONTENT_ACTIONS)[number],
  const S extends z.ZodType,
>(action: A, fields: S) {
  return z
    .object({
      outcome: z.literal("action_applied"),
      action: z.literal(action),
      fields,
      versions: VersionsSchema,
    })
    .strict();
}

const StoredBindEvidenceAppliedSchema = storedAppliedOutcome(
  "bind_evidence",
  z.tuple([EvidenceFieldSchema]),
);
const StoredClearEvidenceAppliedSchema = storedAppliedOutcome(
  "clear_evidence",
  z.tuple([OrdinaryClearFieldSchema]),
);
const StoredClearDependencyAppliedSchema = storedAppliedOutcome(
  "clear_dependency",
  z.tuple([
    z.literal("dependency"),
    z.literal("guardian_name"),
    z.literal("household_size"),
  ]),
);
const StoredSaveEmailAppliedSchema = storedAppliedOutcome(
  "save_email",
  z.tuple([z.literal("preferred_contact_email")]),
);
const StoredDeclareEmailAppliedSchema = storedAppliedOutcome(
  "declare_email",
  z.tuple([z.literal("preferred_contact_email")]),
);
const StoredResolveIncomeAppliedSchema = storedAppliedOutcome(
  "resolve_income",
  z.tuple([z.literal("annual_household_income")]),
);
const StoredClearIncomeResolutionAppliedSchema = storedAppliedOutcome(
  "clear_income_resolution",
  z.tuple([z.literal("annual_household_income")]),
);

const StoredContentNoChangeSchema = z
  .object({
    outcome: z.literal("no_change"),
    action: DraftContentActionSchema,
    fields: z.tuple([]),
    versions: VersionsSchema,
  })
  .strict();

const StoredAssistanceAllowedOutcomeSchema = z
  .object({
    outcome: z.literal("assistance_allowed"),
    action: z.literal("allow_assisted_access"),
    versions: VersionsSchema,
  })
  .strict();

const StoredAllowNoChangeOutcomeSchema = z
  .object({
    outcome: z.literal("no_change"),
    action: z.literal("allow_assisted_access"),
    consentCoordinate: UuidV4Schema,
    fields: z.tuple([]),
    versions: VersionsSchema,
  })
  .strict();

export const StoredHumanActionOutcomeV1Schema = z.union([
  StoredBindEvidenceAppliedSchema,
  StoredClearEvidenceAppliedSchema,
  StoredClearDependencyAppliedSchema,
  StoredSaveEmailAppliedSchema,
  StoredDeclareEmailAppliedSchema,
  StoredResolveIncomeAppliedSchema,
  StoredClearIncomeResolutionAppliedSchema,
  StoredContentNoChangeSchema,
  StoredAssistanceAllowedOutcomeSchema,
  z
    .object({
      outcome: z.literal("assistance_revoked"),
      action: z.literal("revoke_assisted_access"),
      versions: VersionsSchema,
    })
    .strict(),
  StoredAllowNoChangeOutcomeSchema,
  z
    .object({
      outcome: z.literal("no_change"),
      action: z.literal("revoke_assisted_access"),
      fields: z.tuple([]),
      versions: VersionsSchema,
    })
    .strict(),
  z
    .object({
      outcome: z.literal("review_prepared"),
      action: z.literal("prepare_review"),
      reviewId: UuidV4Schema,
      versions: VersionsSchema,
    })
    .strict(),
  z
    .object({
      outcome: z.literal("returned_to_draft"),
      action: z.literal("return_to_draft"),
      invalidatedReviewId: UuidV4Schema,
      versions: VersionsSchema,
    })
    .strict(),
  z
    .object({
      outcome: z.literal("evidence_unavailable"),
      action: z.literal("bind_evidence"),
      field: EvidenceFieldSchema,
      versions: VersionsSchema,
    })
    .strict(),
  z
    .object({
      outcome: z.literal("evidence_unavailable"),
      action: z.literal("resolve_income"),
      field: z.literal("annual_household_income"),
      versions: VersionsSchema,
    })
    .strict(),
  z
    .object({
      outcome: z.literal("conflict_requires_human"),
      action: z.literal("bind_evidence"),
      field: z.literal("annual_household_income"),
      versions: VersionsSchema,
    })
    .strict(),
  z
    .object({
      outcome: z.literal("not_ready_for_review"),
      action: z.literal("prepare_review"),
      blockers: StoredBlockerCoordinatesV1Schema,
      versions: VersionsSchema,
    })
    .strict(),
]);

export const HistoricalActionReplayV1Schema = successSchema(
  z
    .object({
      kind: z.literal("action_replayed"),
      original: StoredHumanActionOutcomeV1Schema,
      snapshot: HumanSnapshotV1Schema,
    })
    .strict()
    .refine(
      ({ original, snapshot }) =>
        historicalVersionCoordinatesAreCausal(original, snapshot),
      {
        message:
          "Historical outcome and current snapshot coordinates are not causally reachable.",
        path: ["snapshot"],
      },
    )
    .refine(
      ({ original, snapshot }) =>
        immediateHistoricalReviewMatchesOriginal(original, snapshot),
      {
        message:
          "An immediate historical Review must match its stored identity and source versions.",
        path: ["snapshot", "review"],
      },
    ),
);

const AssistanceAllowedSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("assistance_allowed"),
      consentCapability: CapabilitySchema,
      snapshot: DraftAllowedSnapshotV1Schema,
    })
    .strict(),
);
const ContentActionAppliedSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("action_applied"),
      action: DraftContentActionSchema,
      snapshot: DraftSnapshotV1Schema,
    })
    .strict(),
);
const ContentNoChangeSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("no_change"),
      action: DraftContentActionSchema,
      snapshot: DraftSnapshotV1Schema,
    })
    .strict()
    .refine(({ snapshot }) => snapshotIncludesCommittedStableRow(snapshot), {
      message:
        "A no-change result requires its committed stable operation row.",
      path: ["snapshot", "projectionSequence"],
    }),
);
const AllowNoChangeSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("no_change"),
      action: z.literal("allow_assisted_access"),
      consentCapability: CapabilitySchema,
      snapshot: DraftAllowedSnapshotV1Schema,
    })
    .strict()
    .refine(({ snapshot }) => snapshotIncludesCommittedStableRow(snapshot), {
      message:
        "A no-change result requires its committed stable operation row.",
      path: ["snapshot", "projectionSequence"],
    }),
);
const RevokeNoChangeSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("no_change"),
      action: z.literal("revoke_assisted_access"),
      snapshot: DraftOffSnapshotV1Schema,
    })
    .strict()
    .refine(({ snapshot }) => snapshotIncludesCommittedStableRow(snapshot), {
      message:
        "A no-change result requires its committed stable operation row.",
      path: ["snapshot", "projectionSequence"],
    }),
);
const AssistanceRevokedSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("assistance_revoked"),
      action: z.literal("revoke_assisted_access"),
      snapshot: DraftOffSnapshotV1Schema,
    })
    .strict(),
);
const ReviewPreparedSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("review_prepared"),
      action: z.literal("prepare_review"),
      snapshot: ReviewSnapshotV1Schema,
    })
    .strict(),
);
const ReturnedToDraftSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("returned_to_draft"),
      action: z.literal("return_to_draft"),
      snapshot: DraftOffSnapshotV1Schema,
    })
    .strict(),
);

export const ActionSuccessSchema = z.union([
  AssistanceAllowedSuccessSchema,
  ContentActionAppliedSuccessSchema,
  ContentNoChangeSuccessSchema,
  AllowNoChangeSuccessSchema,
  RevokeNoChangeSuccessSchema,
  AssistanceRevokedSuccessSchema,
  ReviewPreparedSuccessSchema,
  ReturnedToDraftSuccessSchema,
  HistoricalActionReplayV1Schema,
]);

export const SubmitIntentV1Schema = z
  .object({
    requestId: UuidV4Schema,
    expectedPageEpoch: PageEpochSchema,
    expectedApplicationRevision: SafeRevisionSchema,
    reviewId: UuidV4Schema,
    reviewSourceRevision: SafeRevisionSchema,
    contentHash: Sha256Schema,
  })
  .strict();

export const SubmissionRequestSchema = z
  .object({ mode: z.literal("submit"), intent: SubmitIntentV1Schema })
  .strict();

export const SubmissionSuccessSchema = successSchema(
  z
    .object({
      kind: z.literal("submitted"),
      snapshot: SubmittedSnapshotV1Schema,
      delivery: ReceiptDeliveryV1Schema,
    })
    .strict()
    .refine(
      ({ snapshot, delivery }) =>
        snapshot.submittedAt === delivery.receipt.submittedAt &&
        snapshot.serverNow === delivery.serverNow &&
        snapshot.expiresAt === delivery.expiresAt,
      {
        message:
          "Submission snapshot and Receipt delivery coordinates must match.",
      },
    ),
);

export const ReceiptRequestSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("load") }).strict(),
  z.object({ mode: z.literal("export_json") }).strict(),
  z.object({ mode: z.literal("prepare_print") }).strict(),
]);

function receiptSuccessSchema<
  const M extends "load" | "export_json" | "prepare_print",
>(mode: M) {
  return successSchema(
    z
      .object({ mode: z.literal(mode), delivery: ReceiptDeliveryV1Schema })
      .strict(),
  );
}

const ReceiptLoadSuccessSchema = receiptSuccessSchema("load");
const ReceiptJsonSuccessSchema = receiptSuccessSchema("export_json");
const ReceiptPrintSuccessSchema = receiptSuccessSchema("prepare_print");
export const ReceiptSuccessSchema = z.union([
  ReceiptLoadSuccessSchema,
  ReceiptJsonSuccessSchema,
  ReceiptPrintSuccessSchema,
]);

export const ChallengeFailureSchema = z.union([
  SessionExpiredFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  ConnectionUnavailableSchema,
]);
export const TakeoverFailureSchema = z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  StaleStateFailureSchema,
  RequestReuseMismatchFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  ConnectionUnavailableSchema,
]);
export const SnapshotFailureSchema = z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  ReadUnavailableSchema,
]);
export const ExcerptFailureSchema = z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  ReadUnavailableSchema,
  EvidenceUnavailableFailureSchema,
]);
export const ActionBaseFailureSchema = z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  StaleStateFailureSchema,
  RequestReuseMismatchFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  MutationUnavailableSchema,
]);
export const EvidenceActionFailureSchema = z.union([
  ActionBaseFailureSchema,
  EvidenceUnavailableFailureSchema,
  ConflictRequiresHumanFailureSchema,
  DemoChangeLimitFailureSchema,
]);
export const ContentActionFailureSchema = z.union([
  ActionBaseFailureSchema,
  DemoChangeLimitFailureSchema,
]);
export const ResolveIncomeFailureSchema = z.union([
  ActionBaseFailureSchema,
  EvidenceUnavailableFailureSchema,
  DemoChangeLimitFailureSchema,
]);
export const EmailActionFailureSchema = ContentActionFailureSchema;
export const AllowFailureSchema = ContentActionFailureSchema;
export const RevokeFailureSchema = ContentActionFailureSchema;
export const PrepareActionFailureSchema = z.union([
  ActionBaseFailureSchema,
  HumanNotReadyFailureSchema,
  DemoChangeLimitFailureSchema,
]);
export const ReturnActionFailureSchema = z.union([
  ActionBaseFailureSchema,
  ReviewInvalidatedFailureSchema,
  DemoChangeLimitFailureSchema,
]);
export const SubmissionFailureSchema = z.union([
  ActionBaseFailureSchema,
  ReviewInvalidatedFailureSchema,
]);
export const ReceiptLoadFailureSchema = z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  ConnectionUnavailableSchema,
  ReceiptUnavailableSchema,
]);
export const ReceiptExportFailureSchema = z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  ConnectionUnavailableSchema,
  ExportUnavailableSchema,
]);

type ApplicationRequestInput = z.infer<typeof ApplicationRequestSchema>;

type ApplicationResultForRequest<R extends ApplicationRequestInput> =
  R extends { mode: "bootstrap_challenge" }
    ? | z.infer<typeof ChallengeSuccessSchema>
      | z.infer<typeof ChallengeFailureSchema>
    : R extends { mode: "takeover" }
      ? | z.infer<typeof TakeoverSuccessSchema>
        | z.infer<typeof TakeoverFailureSchema>
      : R extends { mode: "snapshot" }
        ? | z.infer<typeof SnapshotSuccessSchema>
          | z.infer<typeof SnapshotFailureSchema>
        : R extends { mode: "evidence_excerpt" }
          ? | z.infer<typeof EvidenceExcerptSuccessSchema>
            | z.infer<typeof ExcerptFailureSchema>
          : never;

export function applicationResultSchemaForRequest<
  const R extends ApplicationRequestInput,
>(request: R): z.ZodType<ApplicationResultForRequest<R>>;
export function applicationResultSchemaForRequest(
  request: ApplicationRequestInput,
): z.ZodType<ApplicationResultForRequest<ApplicationRequestInput>> {
  switch (request.mode) {
    case "bootstrap_challenge":
      return z.union([ChallengeSuccessSchema, ChallengeFailureSchema]);
    case "takeover":
      return z.union([TakeoverSuccessSchema, TakeoverFailureSchema]);
    case "snapshot":
      return z.union([SnapshotSuccessSchema, SnapshotFailureSchema]);
    case "evidence_excerpt":
      return z.union([EvidenceExcerptSuccessSchema, ExcerptFailureSchema]);
  }
}

type ReceiptRequestInput = z.infer<typeof ReceiptRequestSchema>;

type ReceiptResultForRequest<R extends ReceiptRequestInput> = R extends {
  mode: "load";
}
  ? | z.infer<typeof ReceiptLoadSuccessSchema>
    | z.infer<typeof ReceiptLoadFailureSchema>
  : R extends { mode: "export_json" }
    ? | z.infer<typeof ReceiptJsonSuccessSchema>
      | z.infer<typeof ReceiptExportFailureSchema>
    : R extends { mode: "prepare_print" }
      ? | z.infer<typeof ReceiptPrintSuccessSchema>
        | z.infer<typeof ReceiptExportFailureSchema>
      : never;

export function receiptResultSchemaForRequest<
  const R extends ReceiptRequestInput,
>(request: R): z.ZodType<ReceiptResultForRequest<R>>;
export function receiptResultSchemaForRequest(
  request: ReceiptRequestInput,
): z.ZodType<ReceiptResultForRequest<ReceiptRequestInput>> {
  switch (request.mode) {
    case "load":
      return z.union([ReceiptLoadSuccessSchema, ReceiptLoadFailureSchema]);
    case "export_json":
      return z.union([ReceiptJsonSuccessSchema, ReceiptExportFailureSchema]);
    case "prepare_print":
      return z.union([ReceiptPrintSuccessSchema, ReceiptExportFailureSchema]);
  }
}

export type HumanActionName = z.infer<
  typeof HumanActionRequestSchema
>["action"];

type HumanActionRequest = z.infer<typeof HumanActionRequestSchema>;
type StoredHumanActionOutcomeV1 = z.infer<
  typeof StoredHumanActionOutcomeV1Schema
>;
type StoredAllowOutcome =
  | z.infer<typeof StoredAssistanceAllowedOutcomeSchema>
  | z.infer<typeof StoredAllowNoChangeOutcomeSchema>;

// Server-only validation input from the same locked, finally authorized
// transaction that classified a request as fresh or an exact replay. It is
// never accepted from an HTTP body, browser, or agent result.
const HumanActionResultValidationContextSchema = z
  .object({
    storedOutcome: z
      .union([
        StoredAssistanceAllowedOutcomeSchema,
        StoredAllowNoChangeOutcomeSchema,
      ])
      .nullable(),
    currentConsentRequestId: UuidV4Schema.nullable(),
  })
  .strict();

type HumanActionResultValidationContext = Readonly<
  z.infer<typeof HumanActionResultValidationContextSchema>
>;

type HttpSnapshotCoordinates = AuthorityMetaV1 &
  Readonly<{
    stage: "draft" | "review" | "submitted";
    view?: Readonly<{ assistance: "off" | "allowed" }>;
  }>;

type CausalCoordinateCounts = Readonly<{
  revisionEffects: number;
  requirementsEffects: number;
  nonRequirementsEffects: number;
}>;

function causalCoordinateCounts(
  value: Readonly<
    Pick<
      AuthorityMetaV1,
      | "pageEpoch"
      | "applicationRevision"
      | "requirementsVersion"
      | "projectionSequence"
    >
  >,
): CausalCoordinateCounts | undefined {
  if (value.pageEpoch < 1) return undefined;
  const revisionEffects = value.applicationRevision - value.pageEpoch;
  const requirementsEffects = value.requirementsVersion - 1;
  if (
    revisionEffects < 0 ||
    requirementsEffects < 0 ||
    requirementsEffects > revisionEffects ||
    revisionEffects > value.projectionSequence
  ) {
    return undefined;
  }
  return {
    revisionEffects,
    requirementsEffects,
    nonRequirementsEffects: revisionEffects - requirementsEffects,
  };
}

function authorityCoordinatesAreCausal(value: AuthorityMetaV1): boolean {
  return causalCoordinateCounts(value) !== undefined;
}

function humanHttpSnapshotCoordinatesAreCausal(
  value: HttpSnapshotCoordinates,
): boolean {
  const counts = causalCoordinateCounts(value);
  if (counts === undefined) return false;
  switch (value.stage) {
    case "draft":
      return (
        value.view?.assistance !== "allowed" ||
        counts.nonRequirementsEffects >= 1
      );
    case "review":
      return counts.nonRequirementsEffects >= 1;
    case "submitted":
      return counts.nonRequirementsEffects >= 2;
  }
}

function requestPrestateCoordinatesAreCausal(
  request: HumanActionRequest,
): boolean {
  if (request.expectedPageEpoch < 1) return false;
  const revisionEffects =
    request.expectedApplicationRevision - request.expectedPageEpoch;
  const requirementsEffects = request.expectedRequirementsVersion - 1;
  if (
    revisionEffects < 0 ||
    requirementsEffects < 0 ||
    requirementsEffects > revisionEffects
  ) {
    return false;
  }
  return (
    request.action !== "return_to_draft" ||
    revisionEffects - requirementsEffects >= 1
  );
}

function requestPrestateHasPriorNonRequirementsEffect(
  request: HumanActionRequest,
): boolean {
  const revisionEffects =
    request.expectedApplicationRevision - request.expectedPageEpoch;
  const requirementsEffects = request.expectedRequirementsVersion - 1;
  return revisionEffects - requirementsEffects >= 1;
}

function storedLifecyclePrestateMatchesRequest(
  request: HumanActionRequest,
  outcome: StoredHumanActionOutcomeV1,
): boolean {
  return (
    !(
      outcome.outcome === "assistance_revoked" ||
      (outcome.outcome === "no_change" &&
        outcome.action === "allow_assisted_access")
    ) || requestPrestateHasPriorNonRequirementsEffect(request)
  );
}

function snapshotIncludesCommittedStableRow(
  snapshot: AuthorityMetaV1,
): boolean {
  const counts = causalCoordinateCounts(snapshot);
  return (
    counts !== undefined && counts.revisionEffects < snapshot.projectionSequence
  );
}

function storedOutcomeHasNoRevision(
  outcome: StoredHumanActionOutcomeV1,
): boolean {
  switch (outcome.outcome) {
    case "no_change":
    case "evidence_unavailable":
    case "conflict_requires_human":
    case "not_ready_for_review":
      return true;
    case "action_applied":
    case "assistance_allowed":
    case "assistance_revoked":
    case "review_prepared":
    case "returned_to_draft":
      return false;
  }
}

function historicalVersionCoordinatesAreCausal(
  original: StoredHumanActionOutcomeV1,
  snapshot: z.infer<typeof HumanSnapshotV1Schema>,
): boolean {
  const applicationDelta =
    snapshot.applicationRevision - original.versions.applicationRevision;
  const requirementsDelta =
    snapshot.requirementsVersion - original.versions.requirementsVersion;
  return (
    applicationDelta >= 0 &&
    requirementsDelta >= 0 &&
    requirementsDelta <= applicationDelta &&
    (!storedOutcomeHasNoRevision(original) ||
      snapshotIncludesCommittedStableRow(snapshot))
  );
}

function immediateHistoricalReviewMatchesOriginal(
  original: StoredHumanActionOutcomeV1,
  snapshot: z.infer<typeof HumanSnapshotV1Schema>,
): boolean {
  if (
    original.outcome !== "review_prepared" ||
    snapshot.stage !== "review" ||
    !sameVersions(snapshot, original.versions)
  ) {
    return true;
  }
  const sourceApplicationRevision = original.versions.applicationRevision - 1;
  return (
    sourceApplicationRevision >= 0 &&
    snapshot.review.reviewId === original.reviewId &&
    snapshot.review.sourceVersions.applicationRevision ===
      sourceApplicationRevision &&
    snapshot.review.sourceVersions.requirementsVersion ===
      original.versions.requirementsVersion
  );
}

function historicalStageCoordinatesAreReachable(
  original: StoredHumanActionOutcomeV1,
  snapshot: z.infer<typeof HumanSnapshotV1Schema>,
): boolean {
  const applicationDelta =
    snapshot.applicationRevision - original.versions.applicationRevision;
  const requirementsDelta =
    snapshot.requirementsVersion - original.versions.requirementsVersion;
  if (
    applicationDelta < 0 ||
    requirementsDelta < 0 ||
    requirementsDelta > applicationDelta
  ) {
    return false;
  }
  const nonRequirementsDelta = applicationDelta - requirementsDelta;
  if (original.outcome !== "review_prepared") {
    switch (snapshot.stage) {
      case "draft":
        return true;
      case "review":
        return nonRequirementsDelta >= 1;
      case "submitted":
        return nonRequirementsDelta >= 2;
    }
  }
  switch (snapshot.stage) {
    case "draft":
      return nonRequirementsDelta >= 1;
    case "review":
      return (
        (applicationDelta === 0 && requirementsDelta === 0) ||
        nonRequirementsDelta >= 2
      );
    case "submitted":
      return (
        (applicationDelta === 1 && requirementsDelta === 0) ||
        nonRequirementsDelta >= 3
      );
  }
}

function sameVersions(
  left: Readonly<{ applicationRevision: number; requirementsVersion: number }>,
  right: Readonly<{ applicationRevision: number; requirementsVersion: number }>,
): boolean {
  return (
    left.applicationRevision === right.applicationRevision &&
    left.requirementsVersion === right.requirementsVersion
  );
}

function expectedStoredOutcomeVersions(
  request: HumanActionRequest,
  outcome: StoredHumanActionOutcomeV1,
): Versions | undefined {
  let applicationDelta = 0;
  let requirementsDelta = 0;
  switch (outcome.outcome) {
    case "action_applied":
      applicationDelta = 1;
      requirementsDelta =
        outcome.action === "clear_dependency" ||
        (outcome.action === "bind_evidence" &&
          request.action === "bind_evidence" &&
          request.field === "dependency")
          ? 1
          : 0;
      break;
    case "assistance_allowed":
    case "assistance_revoked":
    case "review_prepared":
    case "returned_to_draft":
      applicationDelta = 1;
      break;
    case "no_change":
    case "evidence_unavailable":
    case "conflict_requires_human":
    case "not_ready_for_review":
      break;
  }
  const applicationRevision =
    request.expectedApplicationRevision + applicationDelta;
  const requirementsVersion =
    request.expectedRequirementsVersion + requirementsDelta;
  return Number.isSafeInteger(applicationRevision) &&
    Number.isSafeInteger(requirementsVersion)
    ? { applicationRevision, requirementsVersion }
    : undefined;
}

function storedAllowOutcomeMatchesRequest(
  request: HumanActionRequest,
  outcome: StoredAllowOutcome,
): boolean {
  const expectedVersions = expectedStoredOutcomeVersions(request, outcome);
  return (
    request.action === "allow_assisted_access" &&
    expectedVersions !== undefined &&
    sameVersions(outcome.versions, expectedVersions) &&
    (outcome.outcome !== "no_change" ||
      outcome.consentCoordinate !== request.requestId) &&
    storedLifecyclePrestateMatchesRequest(request, outcome)
  );
}

function sameStoredAllowOutcome(
  left: StoredHumanActionOutcomeV1,
  right: StoredAllowOutcome,
): boolean {
  if (
    left.action !== "allow_assisted_access" ||
    left.outcome !== right.outcome ||
    !sameVersions(left.versions, right.versions)
  ) {
    return false;
  }
  return (
    left.outcome === "assistance_allowed" ||
    (right.outcome === "no_change" &&
      left.consentCoordinate === right.consentCoordinate)
  );
}

function snapshotMatchesCurrentConsentCoordinate(
  snapshot: z.infer<typeof HumanSnapshotV1Schema>,
  currentConsentRequestId: string | null,
): boolean {
  if (snapshot.stage !== "draft") {
    return currentConsentRequestId === null;
  }
  return (
    (snapshot.view.assistance === "allowed") ===
    (currentConsentRequestId !== null)
  );
}

function currentConsentIdentityCanFollowRequest(
  request: HumanActionRequest,
  currentConsentRequestId: string | null,
): boolean {
  return (
    currentConsentRequestId === null ||
    request.action === "allow_assisted_access" ||
    currentConsentRequestId !== request.requestId
  );
}

function rfc3339EpochNanoseconds(value: string): bigint | undefined {
  const match =
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (match === null) return undefined;

  const wholeSecond = match[1];
  const fractionalSecond = match[2] ?? "";
  const offset = match[3];
  if (wholeSecond === undefined || offset === undefined) return undefined;

  const wholeSecondMilliseconds = Date.parse(`${wholeSecond}${offset}`);
  if (!Number.isSafeInteger(wholeSecondMilliseconds)) return undefined;

  const fractionalNanoseconds =
    fractionalSecond.length === 0
      ? 0n
      : BigInt(fractionalSecond.padEnd(9, "0"));
  return BigInt(wholeSecondMilliseconds) * 1_000_000n + fractionalNanoseconds;
}

function snapshotIsWithinSession(
  snapshot: z.infer<typeof HumanSnapshotV1Schema>,
): boolean {
  const serverNow = rfc3339EpochNanoseconds(snapshot.serverNow);
  const expiresAt = rfc3339EpochNanoseconds(snapshot.expiresAt);
  return (
    serverNow !== undefined && expiresAt !== undefined && serverNow < expiresAt
  );
}

function storedAllowCoordinateIsCurrent(
  request: HumanActionRequest,
  context: HumanActionResultValidationContext,
): boolean {
  const stored = context.storedOutcome;
  if (
    request.action !== "allow_assisted_access" ||
    stored === null ||
    context.currentConsentRequestId === null
  ) {
    return false;
  }
  const storedCoordinate =
    stored.outcome === "assistance_allowed"
      ? request.requestId
      : stored.consentCoordinate;
  return context.currentConsentRequestId === storedCoordinate;
}

type CurrentActionSuccessData = Exclude<
  z.infer<typeof ActionSuccessSchema>["data"],
  { kind: "action_replayed" }
>;

function capabilityBearingAllowReplayMatchesContext(
  request: HumanActionRequest,
  data: CurrentActionSuccessData,
  context: HumanActionResultValidationContext,
): boolean {
  const stored = context.storedOutcome;
  if (
    request.action !== "allow_assisted_access" ||
    stored === null ||
    !storedAllowCoordinateIsCurrent(request, context) ||
    !snapshotMatchesCurrentConsentCoordinate(
      data.snapshot,
      context.currentConsentRequestId,
    ) ||
    data.snapshot.pageEpoch !== request.expectedPageEpoch ||
    (stored.outcome === "assistance_allowed"
      ? data.kind !== "assistance_allowed"
      : data.kind !== "no_change" ||
        !("action" in data) ||
        data.action !== "allow_assisted_access")
  ) {
    return false;
  }
  const applicationDelta =
    data.snapshot.applicationRevision - stored.versions.applicationRevision;
  const requirementsDelta =
    data.snapshot.requirementsVersion - stored.versions.requirementsVersion;
  return (
    applicationDelta >= 0 &&
    requirementsDelta >= 0 &&
    requirementsDelta <= applicationDelta
  );
}

function storedOutcomeCoordinatesMatchRequest(
  request: HumanActionRequest,
  outcome: StoredHumanActionOutcomeV1,
): boolean {
  if (outcome.action !== request.action) return false;
  switch (outcome.action) {
    case "bind_evidence":
      if (request.action !== "bind_evidence") return false;
      if (outcome.outcome === "action_applied") {
        return outcome.fields[0] === request.field;
      }
      if (
        outcome.outcome === "evidence_unavailable" ||
        outcome.outcome === "conflict_requires_human"
      ) {
        return outcome.field === request.field;
      }
      return true;
    case "clear_evidence":
      return (
        request.action === "clear_evidence" &&
        (outcome.outcome !== "action_applied" ||
          outcome.fields[0] === request.field)
      );
    case "clear_dependency":
      return request.action === "clear_dependency";
    case "save_email":
      return request.action === "save_email";
    case "declare_email":
      return request.action === "declare_email";
    case "resolve_income":
      return request.action === "resolve_income";
    case "clear_income_resolution":
      return request.action === "clear_income_resolution";
    case "allow_assisted_access":
      return request.action === "allow_assisted_access";
    case "revoke_assisted_access":
      return request.action === "revoke_assisted_access";
    case "prepare_review":
      return request.action === "prepare_review";
    case "return_to_draft":
      return request.action === "return_to_draft";
  }
}

function historicalAllowReplayMatchesContext(
  request: HumanActionRequest,
  original: StoredHumanActionOutcomeV1,
  snapshot: z.infer<typeof HumanSnapshotV1Schema>,
  context: HumanActionResultValidationContext,
): boolean {
  if (request.action !== "allow_assisted_access") return true;
  const stored = context.storedOutcome;
  const applicationDelta =
    snapshot.applicationRevision - original.versions.applicationRevision;
  const requirementsDelta =
    snapshot.requirementsVersion - original.versions.requirementsVersion;
  const nonRequirementsDelta = applicationDelta - requirementsDelta;
  const authorityTransitionFloor =
    context.currentConsentRequestId === null ? 1 : 2;
  return (
    stored !== null &&
    sameStoredAllowOutcome(original, stored) &&
    !(
      stored.outcome === "no_change" &&
      context.currentConsentRequestId === request.requestId
    ) &&
    snapshotIsWithinSession(snapshot) &&
    nonRequirementsDelta >= authorityTransitionFloor &&
    !storedAllowCoordinateIsCurrent(request, context)
  );
}

function historicalConsentTransitionIsReachable(
  original: StoredHumanActionOutcomeV1,
  snapshot: z.infer<typeof HumanSnapshotV1Schema>,
  currentConsentRequestId: string | null,
): boolean {
  if (currentConsentRequestId === null) return true;

  const applicationDelta =
    snapshot.applicationRevision - original.versions.applicationRevision;
  const requirementsDelta =
    snapshot.requirementsVersion - original.versions.requirementsVersion;
  const nonRequirementsDelta = applicationDelta - requirementsDelta;
  if (
    original.outcome === "assistance_revoked" ||
    original.outcome === "returned_to_draft" ||
    (original.outcome === "no_change" &&
      original.action === "revoke_assisted_access")
  ) {
    return nonRequirementsDelta >= 1;
  }
  return original.outcome !== "review_prepared" || nonRequirementsDelta >= 2;
}

type StoredOutcomeWithExactAction<O, A extends HumanActionName> = O extends {
  action: infer Existing extends HumanActionName;
}
  ? A extends Existing
    ? Omit<O, "action"> & { action: A }
    : never
  : never;

type StoredHumanActionOutcomeForAction<A extends HumanActionName> =
  StoredOutcomeWithExactAction<StoredHumanActionOutcomeV1, A>;

type HistoricalActionReplayOutput = z.infer<
  typeof HistoricalActionReplayV1Schema
>;

type HistoricalActionReplayForAction<A extends HumanActionName> =
  A extends HumanActionName
    ? Omit<HistoricalActionReplayOutput, "data"> & {
        data: Omit<HistoricalActionReplayOutput["data"], "original"> & {
          original: StoredHumanActionOutcomeForAction<A>;
        };
      }
    : never;

function replayForRequest<const R extends HumanActionRequest>(
  request: R,
  context: HumanActionResultValidationContext,
): z.ZodType<HistoricalActionReplayForAction<R["action"]>>;
function replayForRequest(
  request: HumanActionRequest,
  context: HumanActionResultValidationContext,
): z.ZodType<HistoricalActionReplayOutput> {
  return HistoricalActionReplayV1Schema.refine(
    ({ data }) => {
      const expectedVersions = expectedStoredOutcomeVersions(
        request,
        data.original,
      );
      return (
        requestPrestateCoordinatesAreCausal(request) &&
        expectedVersions !== undefined &&
        data.snapshot.pageEpoch === request.expectedPageEpoch &&
        snapshotMatchesCurrentConsentCoordinate(
          data.snapshot,
          context.currentConsentRequestId,
        ) &&
        currentConsentIdentityCanFollowRequest(
          request,
          context.currentConsentRequestId,
        ) &&
        storedOutcomeCoordinatesMatchRequest(request, data.original) &&
        sameVersions(data.original.versions, expectedVersions) &&
        storedLifecyclePrestateMatchesRequest(request, data.original) &&
        historicalAllowReplayMatchesContext(
          request,
          data.original,
          data.snapshot,
          context,
        ) &&
        historicalConsentTransitionIsReachable(
          data.original,
          data.snapshot,
          context.currentConsentRequestId,
        ) &&
        historicalStageCoordinatesAreReachable(data.original, data.snapshot)
      );
    },
    {
      message:
        "Historical replay coordinates must match the complete current request.",
    },
  );
}

function contentSuccessForAction<
  const A extends (typeof DRAFT_CONTENT_ACTIONS)[number],
>(action: A) {
  return z.union([
    successSchema(
      z
        .object({
          kind: z.literal("action_applied"),
          action: z.literal(action),
          snapshot: DraftSnapshotV1Schema,
        })
        .strict(),
    ),
    successSchema(
      z
        .object({
          kind: z.literal("no_change"),
          action: z.literal(action),
          snapshot: DraftSnapshotV1Schema,
        })
        .strict(),
    ),
  ]);
}

type CurrentSuccessForAction<A extends HumanActionName> =
  A extends (typeof DRAFT_CONTENT_ACTIONS)[number]
    ? z.infer<ReturnType<typeof contentSuccessForAction<A>>>
    : A extends "allow_assisted_access"
      ? | z.infer<typeof AssistanceAllowedSuccessSchema>
        | z.infer<typeof AllowNoChangeSuccessSchema>
      : A extends "revoke_assisted_access"
        ? | z.infer<typeof AssistanceRevokedSuccessSchema>
          | z.infer<typeof RevokeNoChangeSuccessSchema>
        : A extends "prepare_review"
          ? z.infer<typeof ReviewPreparedSuccessSchema>
          : A extends "return_to_draft"
            ? z.infer<typeof ReturnedToDraftSuccessSchema>
            : never;

type CurrentActionSuccessOutput = Exclude<
  z.infer<typeof ActionSuccessSchema>,
  HistoricalActionReplayOutput
>;

function currentSuccessSchemaForHumanAction<const A extends HumanActionName>(
  action: A,
): z.ZodType<CurrentSuccessForAction<A>>;
function currentSuccessSchemaForHumanAction(
  action: HumanActionName,
): z.ZodType<CurrentActionSuccessOutput> {
  if ((DRAFT_CONTENT_ACTIONS as readonly string[]).includes(action)) {
    return contentSuccessForAction(
      action as (typeof DRAFT_CONTENT_ACTIONS)[number],
    );
  }
  switch (action) {
    case "allow_assisted_access":
      return z.union([
        AssistanceAllowedSuccessSchema,
        AllowNoChangeSuccessSchema,
      ]);
    case "revoke_assisted_access":
      return z.union([
        AssistanceRevokedSuccessSchema,
        RevokeNoChangeSuccessSchema,
      ]);
    case "prepare_review":
      return ReviewPreparedSuccessSchema;
    case "return_to_draft":
      return ReturnedToDraftSuccessSchema;
  }
  throw new TypeError("Unknown human action.");
}

function currentContentPostconditionMatchesRequest(
  request: HumanActionRequest,
  data: Readonly<{
    kind: "action_applied" | "no_change";
    snapshot: z.infer<typeof DraftSnapshotV1Schema>;
  }>,
): boolean {
  const draft = data.snapshot.view;
  switch (request.action) {
    case "bind_evidence": {
      const field = draft.fields[FIELD_IDS.indexOf(request.field)];
      const dependencyActivationMatches =
        request.field !== "dependency" ||
        data.kind === "no_change" ||
        (draft.fields[5].active === true &&
          draft.fields[5].status === "missing" &&
          draft.fields[6].active === true &&
          draft.fields[6].status === "missing");
      return (
        field !== undefined &&
        field.field === request.field &&
        field.active === true &&
        field.status === "ready" &&
        (data.kind === "no_change" || field.origin === "manual") &&
        "bindings" in field &&
        field.bindings[0]?.claimHandle === request.claimHandle &&
        dependencyActivationMatches
      );
    }
    case "clear_evidence": {
      const field = draft.fields[FIELD_IDS.indexOf(request.field)];
      return (
        field !== undefined &&
        field.field === request.field &&
        field.active === true &&
        field.status === "missing" &&
        (request.field !== "annual_household_income" ||
          draft.packet === "supported")
      );
    }
    case "clear_dependency": {
      const dependency = draft.fields[4];
      const guardian = draft.fields[5];
      const household = draft.fields[6];
      return (
        dependency.status === "missing" &&
        guardian.active === false &&
        guardian.status === "not_required" &&
        household.active === false &&
        household.status === "not_required"
      );
    }
    case "save_email": {
      const email = draft.fields[3];
      return (
        email.status !== "missing" &&
        email.value === request.value &&
        (data.kind === "no_change" ||
          (email.status === "needs_declaration" && email.origin === "manual"))
      );
    }
    case "declare_email": {
      const email = draft.fields[3];
      return email.status === "ready" && email.declaredByApplicant === true;
    }
    case "resolve_income": {
      const income = draft.fields[7];
      return (
        income.status === "ready" &&
        income.origin === "manual" &&
        typeof income.resolution === "object" &&
        income.resolution.chosen.claimHandle === request.claimHandle &&
        income.resolution.reason === request.reason
      );
    }
    case "clear_income_resolution":
      return draft.fields[7].status === "conflict";
    case "allow_assisted_access":
    case "revoke_assisted_access":
    case "prepare_review":
    case "return_to_draft":
      return false;
  }
}

function currentSuccessMatchesRequest(
  request: HumanActionRequest,
  value: z.infer<typeof ActionSuccessSchema>,
  context: HumanActionResultValidationContext,
): boolean {
  const data = value.data;
  if (data.kind === "action_replayed") return false;
  if (!requestPrestateCoordinatesAreCausal(request)) return false;
  if ("action" in data && data.action !== request.action) return false;
  if (
    !snapshotMatchesCurrentConsentCoordinate(
      data.snapshot,
      context.currentConsentRequestId,
    ) ||
    !currentConsentIdentityCanFollowRequest(
      request,
      context.currentConsentRequestId,
    )
  ) {
    return false;
  }
  if (
    data.kind === "no_change" &&
    !snapshotIncludesCommittedStableRow(data.snapshot)
  ) {
    return false;
  }
  const isCurrentContentOutcome =
    data.kind === "action_applied" ||
    (data.kind === "no_change" &&
      (DRAFT_CONTENT_ACTIONS as readonly string[]).includes(request.action));
  if (
    isCurrentContentOutcome &&
    !currentContentPostconditionMatchesRequest(request, data)
  ) {
    return false;
  }
  if (
    (data.kind === "assistance_revoked" ||
      (data.kind === "no_change" &&
        request.action === "allow_assisted_access")) &&
    !requestPrestateHasPriorNonRequirementsEffect(request)
  ) {
    return false;
  }
  if (request.action === "allow_assisted_access") {
    if (!snapshotIsWithinSession(data.snapshot)) {
      return false;
    }
    if (context.storedOutcome !== null) {
      return capabilityBearingAllowReplayMatchesContext(request, data, context);
    }
    if (
      context.currentConsentRequestId === null ||
      (data.kind === "assistance_allowed" &&
        context.currentConsentRequestId !== request.requestId) ||
      (data.kind === "no_change" &&
        context.currentConsentRequestId === request.requestId)
    ) {
      return false;
    }
  }

  let applicationDelta = 0;
  let requirementsDelta = 0;
  switch (data.kind) {
    case "action_applied":
      applicationDelta = 1;
      requirementsDelta =
        request.action === "clear_dependency" ||
        (request.action === "bind_evidence" && request.field === "dependency")
          ? 1
          : 0;
      break;
    case "assistance_allowed":
    case "assistance_revoked":
    case "review_prepared":
    case "returned_to_draft":
      applicationDelta = 1;
      break;
    case "no_change":
      break;
  }
  const applicationRevision =
    request.expectedApplicationRevision + applicationDelta;
  const requirementsVersion =
    request.expectedRequirementsVersion + requirementsDelta;
  if (
    !Number.isSafeInteger(applicationRevision) ||
    !Number.isSafeInteger(requirementsVersion) ||
    data.snapshot.pageEpoch !== request.expectedPageEpoch ||
    data.snapshot.applicationRevision !== applicationRevision ||
    data.snapshot.requirementsVersion !== requirementsVersion
  ) {
    return false;
  }
  return (
    data.kind !== "review_prepared" ||
    sameVersions(data.snapshot.review.sourceVersions, {
      applicationRevision: request.expectedApplicationRevision,
      requirementsVersion: request.expectedRequirementsVersion,
    })
  );
}

type EvidenceActionFailure = z.infer<typeof EvidenceActionFailureSchema>;
type NonConflictEvidenceActionFailure = Exclude<
  EvidenceActionFailure,
  z.infer<typeof ConflictRequiresHumanFailureSchema>
>;

type HumanActionFailureForRequest<R extends HumanActionRequest> = R extends {
  action: "bind_evidence";
  field: infer F extends EvidenceField;
}
  ? "annual_household_income" extends F
    ? EvidenceActionFailure
    : NonConflictEvidenceActionFailure
  : R extends { action: "resolve_income" }
    ? z.infer<typeof ResolveIncomeFailureSchema>
    : R extends { action: "save_email" | "declare_email" }
      ? z.infer<typeof EmailActionFailureSchema>
      : R extends { action: "allow_assisted_access" }
        ? z.infer<typeof AllowFailureSchema>
        : R extends { action: "revoke_assisted_access" }
          ? z.infer<typeof RevokeFailureSchema>
          : R extends { action: "prepare_review" }
            ? z.infer<typeof PrepareActionFailureSchema>
            : R extends { action: "return_to_draft" }
              ? z.infer<typeof ReturnActionFailureSchema>
              : R extends {
                    action:
                      | "clear_evidence"
                      | "clear_dependency"
                      | "clear_income_resolution";
                  }
                ? z.infer<typeof ContentActionFailureSchema>
                : never;

function failureSchemaForHumanAction<const R extends HumanActionRequest>(
  request: R,
): z.ZodType<HumanActionFailureForRequest<R>>;
function failureSchemaForHumanAction(
  request: HumanActionRequest,
): z.ZodType<HumanActionFailureForRequest<HumanActionRequest>> {
  switch (request.action) {
    case "bind_evidence":
      return EvidenceActionFailureSchema.refine(
        ({ error }) =>
          error.code !== "conflict_requires_human" ||
          request.field === "annual_household_income",
        {
          message:
            "Conflict refusal is valid only for canonical household income binding.",
        },
      );
    case "resolve_income":
      return ResolveIncomeFailureSchema;
    case "save_email":
    case "declare_email":
      return EmailActionFailureSchema;
    case "allow_assisted_access":
      return AllowFailureSchema;
    case "revoke_assisted_access":
      return RevokeFailureSchema;
    case "prepare_review":
      return PrepareActionFailureSchema;
    case "return_to_draft":
      return ReturnActionFailureSchema;
    case "clear_evidence":
    case "clear_dependency":
    case "clear_income_resolution":
      return ContentActionFailureSchema;
  }
}

type HumanActionResultForRequest<R extends HumanActionRequest> =
  R extends HumanActionRequest
    ? | CurrentSuccessForAction<R["action"]>
      | HistoricalActionReplayForAction<R["action"]>
      | HumanActionFailureForRequest<R>
    : never;

export function humanActionResultSchema<const R extends HumanActionRequest>(
  requestInput: R,
  validationContextInput: HumanActionResultValidationContext,
): z.ZodType<HumanActionResultForRequest<R>>;
export function humanActionResultSchema(
  requestInput: HumanActionRequest,
  validationContextInput: HumanActionResultValidationContext,
): z.ZodType<HumanActionResultForRequest<HumanActionRequest>> {
  const request = HumanActionRequestSchema.parse(requestInput);
  const validationContext = HumanActionResultValidationContextSchema.parse(
    validationContextInput,
  );
  if (
    validationContext.storedOutcome !== null &&
    !storedAllowOutcomeMatchesRequest(request, validationContext.storedOutcome)
  ) {
    throw new TypeError(
      "Stored Allow replay context does not match the current request.",
    );
  }
  const currentSuccess = currentSuccessSchemaForHumanAction(
    request.action,
  ).refine(
    (value) => currentSuccessMatchesRequest(request, value, validationContext),
    {
      message: "Current action result does not match its request coordinates.",
    },
  );
  return z.union([
    currentSuccess,
    replayForRequest(request, validationContext),
    failureSchemaForHumanAction(request),
  ]);
}

export type HumanBindingV1 = z.infer<typeof HumanBindingV1Schema>;
export type HumanFieldV1 = z.infer<typeof HumanFieldV1Schema>;
export type HumanActivityV1 = z.infer<typeof HumanActivityV1Schema>;
export type HumanEvidenceExcerptV1 = z.infer<
  typeof HumanEvidenceExcerptV1Schema
>;
export type HumanDraftV1 = z.infer<typeof HumanDraftV1Schema>;
export type HumanReviewV1 = z.infer<typeof HumanReviewV1Schema>;
export type ReceiptRecordV1 = z.infer<typeof ReceiptRecordV1Schema>;
export type DraftSnapshotV1 = z.infer<typeof DraftSnapshotV1Schema>;
export type DraftOffSnapshotV1 = z.infer<typeof DraftOffSnapshotV1Schema>;
export type DraftAllowedSnapshotV1 = z.infer<
  typeof DraftAllowedSnapshotV1Schema
>;
export type ReviewSnapshotV1 = z.infer<typeof ReviewSnapshotV1Schema>;
export type SubmittedSnapshotV1 = z.infer<typeof SubmittedSnapshotV1Schema>;
export type HumanSnapshotV1 = z.infer<typeof HumanSnapshotV1Schema>;
export type TakeoverSnapshotV1 = z.infer<typeof TakeoverSnapshotV1Schema>;
export type ReceiptDeliveryV1 = z.infer<typeof ReceiptDeliveryV1Schema>;
export type StartToken = z.infer<typeof StartTokenSchema>;
export type DemoStartRequest = z.infer<typeof DemoStartRequestSchema>;
export type ApplicationRequest = z.infer<typeof ApplicationRequestSchema>;
export type HumanAction = z.infer<typeof HumanActionRequestSchema>;
export type SubmitIntentV1 = z.infer<typeof SubmitIntentV1Schema>;
export type SubmissionRequest = z.infer<typeof SubmissionRequestSchema>;
export type ReceiptRequest = z.infer<typeof ReceiptRequestSchema>;

export type DraftContentAction = Exclude<
  HumanAction["action"],
  | "allow_assisted_access"
  | "revoke_assisted_access"
  | "prepare_review"
  | "return_to_draft"
>;

export type {
  ApplicationContentV1,
  AuthorityMetaV1,
  EvidenceField,
  FieldId,
  Versions,
};

// Kept exported so bridge-focused contract tests can prove lifecycle failures
// remain browser-only and never enter an HTTP result union.
export { BridgeInactiveFailureSchema };
