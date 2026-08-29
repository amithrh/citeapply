import { z } from "zod";

import {
  AgentDocumentsV1Schema,
  AgentReadinessBlockersSchema,
  EvidenceClaimsV1Schema,
  FieldIdSchema,
  NonEmptyDomainReadinessBlockersSchema,
  PositiveRequirementsVersionSchema,
  SafeRevisionSchema,
  SyntheticTestEmailSchema,
  UuidV4Schema,
  VersionsSchema,
  successSchema,
  type DocumentClass,
  type FieldId,
} from "./common.ts";
import {
  DraftAllowedSnapshotV1Schema,
  ReviewSnapshotV1Schema,
} from "./http.ts";
import {
  BridgeInactiveFailureSchema,
  ConflictRequiresHumanFailureSchema,
  ConsentRequiredFailureSchema,
  DemoChangeLimitFailureSchema,
  EvidenceUnavailableFailureSchema,
  InvalidRequestFailureSchema,
  MutationUnavailableSchema,
  NotReadyForReviewFailureSchema,
  RateLimitedFailureSchema,
  ReadUnavailableSchema,
  RequestReuseMismatchFailureSchema,
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  StaleStateFailureSchema,
} from "./outcomes.ts";

export const TOOL_NAMES = [
  "get_application_state",
  "get_form_requirements",
  "get_evidence_index",
  "apply_evidence_backed_answers",
  "get_validation_issues",
  "prepare_submission_review",
] as const;

export const ToolNameSchema = z.enum(TOOL_NAMES);
export type ToolName = z.infer<typeof ToolNameSchema>;

export const TOOL_DESCRIPTIONS = {
  get_application_state:
    "Read CiteApply's current saved application status. Redacted mode is safe before access is allowed; protected mode requires visible CiteApply consent. It never returns full source excerpts, the private conflict choice or reason, declaration records, confirmation, submission, receipt, or export.",
  get_form_requirements:
    "Read CiteApply's field policies. Static all-fields mode is packet-independent and safe before consent; active mode requires visible CiteApply consent. It returns rules, not a field-to-claim answer map, and cannot declare, resolve, return, confirm, submit, receive a receipt, or export.",
  get_evidence_index:
    "List the current packet's bounded normalized claims and opaque handles after visible CiteApply consent. Values came from untrusted synthetic PDFs. No raw PDF, full text, exact excerpt, storage path, answer map, private resolution, declaration record, Review, receipt, or export is returned.",
  apply_evidence_backed_answers:
    "Atomically link current allowed evidence handles to Draft fields and optionally propose CiteApply's fixed synthetic .test email after visible consent. The portal validates all entries or changes nothing. It cannot declare email, resolve conflicting income, close a populated branch, prepare through dirty input, return, confirm, submit, or export.",
  get_validation_issues:
    "Read CiteApply's current ordered readiness blockers after visible consent. It changes nothing and returns no full excerpt, private conflict choice/reason, declaration record, canonical hash, confirmation, submission, receipt, or export.",
  prepare_submission_review:
    "Ask CiteApply to freeze the exact ready Draft into a fresh immutable Review after visible consent. It changes stage and closes assisted access, but returns only opaque readiness metadata. It cannot bypass dirty input, declare, resolve conflict, reveal the full Review/hash, return, confirm, submit, receive a receipt, or export.",
} as const satisfies Record<ToolName, string>;

export type ToolAnnotations = {
  readOnlyHint: boolean;
  untrustedContentHint: boolean;
};

export const TOOL_ANNOTATIONS = {
  get_application_state: {
    readOnlyHint: true,
    untrustedContentHint: true,
  },
  get_form_requirements: {
    readOnlyHint: true,
    untrustedContentHint: false,
  },
  get_evidence_index: {
    readOnlyHint: true,
    untrustedContentHint: true,
  },
  apply_evidence_backed_answers: {
    readOnlyHint: false,
    untrustedContentHint: true,
  },
  get_validation_issues: {
    readOnlyHint: true,
    untrustedContentHint: false,
  },
  prepare_submission_review: {
    readOnlyHint: false,
    untrustedContentHint: false,
  },
} as const satisfies Record<ToolName, ToolAnnotations>;

export const GetApplicationStateInputSchema = z
  .object({
    mode: z
      .enum(["redacted", "protected"])
      .describe("Use redacted before consent and protected after visible CiteApply consent."),
  })
  .strict()
  .describe("Choose the disclosure level for the saved application state.");

export const GetFormRequirementsInputSchema = z
  .object({
    mode: z
      .enum(["all", "active"])
      .describe("Use all for static rules or active for the current consent-protected fields."),
  })
  .strict()
  .describe("Choose static all-field rules or current active-field rules.");

export const GetEvidenceIndexInputSchema = z
  .object({})
  .strict()
  .describe("This tool takes no arguments.");
export const GetValidationIssuesInputSchema = z
  .object({})
  .strict()
  .describe("This tool takes no arguments.");

const fieldOrder = new Map<FieldId, number>(
  FieldIdSchema.options.map((field, index) => [field, index]),
);

export const AssistedChangeSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("bind_claim").describe("Link one evidence claim to its matching field."),
      field: z.enum([
        "legal_name",
        "student_id",
        "institution",
        "dependency",
        "guardian_name",
        "household_size",
        "annual_household_income",
      ]).describe("Evidence-backed field to link."),
      claimHandle: z
        .string()
        .regex(/^[A-Za-z0-9_-]{22}$/)
        .describe("Opaque claim handle returned by get_evidence_index."),
    })
    .strict(),
  z
    .object({
      kind: z.literal("propose_email").describe("Propose the fixed synthetic email."),
      field: z
        .literal("preferred_contact_email")
        .describe("The only field that accepts the synthetic email proposal."),
      value: z
        .literal("anaya.rao@example.test")
        .describe("The fixed synthetic .test email; the applicant must still declare it."),
    })
    .strict(),
]);

export const AssistedChangesSchema = z
  .array(AssistedChangeSchema)
  .min(1)
  .max(8)
  .superRefine((changes, context) => {
    const fields = new Set<string>();
    const handles = new Set<string>();
    for (const [index, change] of changes.entries()) {
      if (fields.has(change.field)) {
        context.addIssue({
          code: "custom",
          path: [index, "field"],
          message: "Each field may occur only once.",
        });
      }
      fields.add(change.field);
      if (change.kind === "bind_claim") {
        if (handles.has(change.claimHandle)) {
          context.addIssue({
            code: "custom",
            path: [index, "claimHandle"],
            message: "Each claim handle may occur only once.",
          });
        }
        handles.add(change.claimHandle);
      }
    }
  });

export const ApplyEvidenceBackedAnswersInputSchema = z
  .object({
    requestId: UuidV4Schema.describe("Fresh lowercase UUID v4 for this atomic request."),
    expectedApplicationRevision: SafeRevisionSchema.describe(
      "Application revision returned by the latest protected read.",
    ),
    expectedRequirementsVersion: PositiveRequirementsVersionSchema.describe(
      "Requirements version returned by the latest protected read.",
    ),
    changes: AssistedChangesSchema
      .describe("One to eight distinct field changes applied atomically."),
  })
  .strict()
  .describe("Apply a bounded evidence-backed batch or fixed synthetic email proposal.");

export const PrepareSubmissionReviewInputSchema = z
  .object({
    requestId: UuidV4Schema.describe("Fresh lowercase UUID v4 for this preparation request."),
    expectedApplicationRevision: SafeRevisionSchema.describe(
      "Application revision returned by the latest protected read.",
    ),
    expectedRequirementsVersion: PositiveRequirementsVersionSchema.describe(
      "Requirements version returned by the latest protected read.",
    ),
  })
  .strict()
  .describe("Freeze a clean, ready Draft into an immutable human Review.");

export const TOOL_INPUT_SCHEMAS = {
  get_application_state: GetApplicationStateInputSchema,
  get_form_requirements: GetFormRequirementsInputSchema,
  get_evidence_index: GetEvidenceIndexInputSchema,
  apply_evidence_backed_answers: ApplyEvidenceBackedAnswersInputSchema,
  get_validation_issues: GetValidationIssuesInputSchema,
  prepare_submission_review: PrepareSubmissionReviewInputSchema,
} as const satisfies Record<ToolName, z.ZodType>;

export type GetApplicationStateInput = z.infer<
  typeof GetApplicationStateInputSchema
>;
export type GetFormRequirementsInput = z.infer<
  typeof GetFormRequirementsInputSchema
>;
export type GetEvidenceIndexInput = z.infer<typeof GetEvidenceIndexInputSchema>;
export type GetValidationIssuesInput = z.infer<
  typeof GetValidationIssuesInputSchema
>;
export type AssistedChange = z.infer<typeof AssistedChangeSchema>;
export type AssistedChanges = z.infer<typeof AssistedChangesSchema>;
declare const canonicalAssistedChangesBrand: unique symbol;
export type CanonicalAssistedChanges = readonly AssistedChange[] & {
  readonly [canonicalAssistedChangesBrand]: true;
};
export type ApplyEvidenceBackedAnswersInput = z.infer<
  typeof ApplyEvidenceBackedAnswersInputSchema
>;
export type PrepareSubmissionReviewInput = z.infer<
  typeof PrepareSubmissionReviewInputSchema
>;

export function canonicalizeAssistedChanges(
  changes: readonly AssistedChange[],
): CanonicalAssistedChanges {
  const parsed = AssistedChangesSchema.parse(changes);
  return Object.freeze(
    parsed
      .map((change) => Object.freeze({ ...change }))
      .sort(
      (left, right) =>
        fieldOrder.get(left.field)! - fieldOrder.get(right.field)!,
      ),
  ) as CanonicalAssistedChanges;
}

export const RedactedStateSchema = z
  .object({
    access: z.literal("consent_required"),
    safeActions: z.tuple([z.literal("use_visible_application")]),
  })
  .strict();

const optionalAssisted = { updatedThroughAssistance: z.literal(true).optional() };

function missingAgentFieldSchema<const F extends FieldId>(field: F) {
  return z.object({ field: z.literal(field), status: z.literal("missing") }).strict();
}

function stringAgentFieldSchema<
  const F extends "legal_name" | "student_id" | "institution" | "guardian_name",
>(field: F) {
  return z.union([
    missingAgentFieldSchema(field),
    z
      .object({
        field: z.literal(field),
        status: z.literal("ready"),
        value: z
          .string()
          .min(1)
          .max(160)
          .refine((candidate) => candidate === candidate.normalize("NFC")),
        ...optionalAssisted,
      })
      .strict(),
  ]);
}

const LegalNameAgentFieldSchema = stringAgentFieldSchema("legal_name");
const StudentIdAgentFieldSchema = stringAgentFieldSchema("student_id");
const InstitutionAgentFieldSchema = stringAgentFieldSchema("institution");
const EmailAgentFieldSchema = z.union([
  missingAgentFieldSchema("preferred_contact_email"),
  z
    .object({
      field: z.literal("preferred_contact_email"),
      status: z.literal("needs_declaration"),
      value: SyntheticTestEmailSchema,
      ...optionalAssisted,
    })
    .strict(),
  z
    .object({
      field: z.literal("preferred_contact_email"),
      status: z.literal("ready"),
      value: SyntheticTestEmailSchema,
      humanActionComplete: z.literal(true),
      ...optionalAssisted,
    })
    .strict(),
]);
const MissingDependencyAgentFieldSchema = missingAgentFieldSchema("dependency");
const ReadyDependencyAgentFieldSchema = z
  .object({
    field: z.literal("dependency"),
    status: z.literal("ready"),
    value: z.literal(true),
    ...optionalAssisted,
  })
  .strict();
const GuardianAgentFieldSchema = stringAgentFieldSchema("guardian_name");
const HouseholdSizeAgentFieldSchema = z.union([
  missingAgentFieldSchema("household_size"),
  z
    .object({
      field: z.literal("household_size"),
      status: z.literal("ready"),
      value: z.number().int().safe().min(1),
      ...optionalAssisted,
    })
    .strict(),
]);
const IncomeAgentFieldSchema = z.union([
  missingAgentFieldSchema("annual_household_income"),
  z
    .object({
      field: z.literal("annual_household_income"),
      status: z.literal("needs_human_action"),
    })
    .strict(),
  z
    .object({
      field: z.literal("annual_household_income"),
      status: z.literal("ready"),
      resolution: z.literal("source_supported"),
      value: z.number().int().safe().nonnegative(),
      ...optionalAssisted,
    })
    .strict(),
  z
    .object({
      field: z.literal("annual_household_income"),
      status: z.literal("ready"),
      resolution: z.literal("human_completed"),
      humanActionComplete: z.literal(true),
    })
    .strict(),
]);

export const AgentFieldSchema = z.union([
  LegalNameAgentFieldSchema,
  StudentIdAgentFieldSchema,
  InstitutionAgentFieldSchema,
  EmailAgentFieldSchema,
  MissingDependencyAgentFieldSchema,
  ReadyDependencyAgentFieldSchema,
  GuardianAgentFieldSchema,
  HouseholdSizeAgentFieldSchema,
  IncomeAgentFieldSchema,
]);

const ProtectedStateSixSchema = VersionsSchema.extend({
  stage: z.literal("draft"),
  assistance: z.literal("allowed"),
  activeFieldCount: z.literal(6),
  readyFieldCount: z.number().int().min(0).max(5),
  blockerCount: z.number().int().min(1).max(6),
  fields: z.tuple([
    LegalNameAgentFieldSchema,
    StudentIdAgentFieldSchema,
    InstitutionAgentFieldSchema,
    EmailAgentFieldSchema,
    MissingDependencyAgentFieldSchema,
    IncomeAgentFieldSchema,
  ]),
  safeActions: z.tuple([z.literal("use_visible_application")]),
}).strict();

const ProtectedStateEightSchema = VersionsSchema.extend({
  stage: z.literal("draft"),
  assistance: z.literal("allowed"),
  activeFieldCount: z.literal(8),
  readyFieldCount: z.number().int().min(1).max(8),
  blockerCount: z.number().int().min(0).max(7),
  fields: z.tuple([
    LegalNameAgentFieldSchema,
    StudentIdAgentFieldSchema,
    InstitutionAgentFieldSchema,
    EmailAgentFieldSchema,
    ReadyDependencyAgentFieldSchema,
    GuardianAgentFieldSchema,
    HouseholdSizeAgentFieldSchema,
    IncomeAgentFieldSchema,
  ]),
  safeActions: z.tuple([z.literal("use_visible_application")]),
}).strict();

export const ProtectedStateSchema = z
  .union([ProtectedStateSixSchema, ProtectedStateEightSchema])
  .superRefine(({ fields, readyFieldCount, blockerCount }, context) => {
    const ready = fields.filter(({ status }) => status === "ready").length;
    if (readyFieldCount !== ready) {
      context.addIssue({
        code: "custom",
        message: "readyFieldCount must equal the number of ready active fields.",
        path: ["readyFieldCount"],
      });
    }
    if (blockerCount !== fields.length - ready) {
      context.addIssue({
        code: "custom",
        message: "blockerCount must equal the number of non-ready active fields.",
        path: ["blockerCount"],
      });
    }
  });

export const STATIC_REQUIREMENTS = [
  {
    field: "legal_name",
    label: "Legal name",
    policy: "evidence",
    acceptedDocumentClasses: ["synthetic_enrollment_record"],
  },
  {
    field: "student_id",
    label: "Student ID",
    policy: "evidence",
    acceptedDocumentClasses: ["synthetic_enrollment_record"],
  },
  {
    field: "institution",
    label: "Institution",
    policy: "evidence",
    acceptedDocumentClasses: ["synthetic_enrollment_record"],
  },
  {
    field: "preferred_contact_email",
    label: "Preferred contact email",
    policy: "applicant_declared_test_email",
    acceptedDocumentClasses: [],
  },
  {
    field: "dependency",
    label: "Dependency status",
    policy: "evidence",
    acceptedDocumentClasses: ["synthetic_household_statement"],
  },
  {
    field: "guardian_name",
    label: "Guardian name",
    policy: "evidence",
    acceptedDocumentClasses: ["synthetic_household_statement"],
    condition: { field: "dependency", equals: true },
  },
  {
    field: "household_size",
    label: "Household size",
    policy: "evidence",
    acceptedDocumentClasses: ["synthetic_household_statement"],
    condition: { field: "dependency", equals: true },
  },
  {
    field: "annual_household_income",
    label: "Annual household income",
    policy: "income_policy",
    acceptedDocumentClasses: [
      "synthetic_household_statement",
      "synthetic_income_statement",
    ],
  },
] as const;

function acceptedDocumentClassesSchema(
  classes: readonly DocumentClass[],
) {
  if (classes.length === 0) return z.tuple([]);
  if (classes.length === 1) return z.tuple([z.literal(classes[0]!)]);
  if (classes.length === 2) {
    return z.tuple([z.literal(classes[0]!), z.literal(classes[1]!)]);
  }
  return z.tuple([
    z.literal(classes[0]!),
    z.literal(classes[1]!),
    z.literal(classes[2]!),
  ]);
}

function exactRequirementSchema<const R extends (typeof STATIC_REQUIREMENTS)[number]>(
  requirement: R,
) {
  const base = {
    field: z.literal(requirement.field),
    label: z.literal(requirement.label),
    policy: z.literal(requirement.policy),
    acceptedDocumentClasses: acceptedDocumentClassesSchema(
      requirement.acceptedDocumentClasses,
    ),
  };
  return "condition" in requirement
    ? z
        .object({
          ...base,
          condition: z
            .object({ field: z.literal("dependency"), equals: z.literal(true) })
            .strict(),
        })
        .strict()
    : z.object(base).strict();
}

const LegalNameRequirementSchema = exactRequirementSchema(STATIC_REQUIREMENTS[0]);
const StudentIdRequirementSchema = exactRequirementSchema(STATIC_REQUIREMENTS[1]);
const InstitutionRequirementSchema = exactRequirementSchema(STATIC_REQUIREMENTS[2]);
const EmailRequirementSchema = exactRequirementSchema(STATIC_REQUIREMENTS[3]);
const DependencyRequirementSchema = exactRequirementSchema(STATIC_REQUIREMENTS[4]);
const GuardianRequirementSchema = exactRequirementSchema(STATIC_REQUIREMENTS[5]);
const HouseholdSizeRequirementSchema = exactRequirementSchema(STATIC_REQUIREMENTS[6]);
const IncomeRequirementSchema = exactRequirementSchema(STATIC_REQUIREMENTS[7]);

export const StaticRequirementSchema = z.union([
  LegalNameRequirementSchema,
  StudentIdRequirementSchema,
  InstitutionRequirementSchema,
  EmailRequirementSchema,
  DependencyRequirementSchema,
  GuardianRequirementSchema,
  HouseholdSizeRequirementSchema,
  IncomeRequirementSchema,
]);

export const StaticRequirementsSchema = z.tuple([
  LegalNameRequirementSchema,
  StudentIdRequirementSchema,
  InstitutionRequirementSchema,
  EmailRequirementSchema,
  DependencyRequirementSchema,
  GuardianRequirementSchema,
  HouseholdSizeRequirementSchema,
  IncomeRequirementSchema,
]);

const activeRequirement = { active: z.literal(true) } as const;
const ActiveLegalNameRequirementSchema = LegalNameRequirementSchema.extend(
  activeRequirement,
).strict();
const ActiveStudentIdRequirementSchema = StudentIdRequirementSchema.extend(
  activeRequirement,
).strict();
const ActiveInstitutionRequirementSchema = InstitutionRequirementSchema.extend(
  activeRequirement,
).strict();
const ActiveEmailRequirementSchema = EmailRequirementSchema.extend(
  activeRequirement,
).strict();
const ActiveDependencyRequirementSchema = DependencyRequirementSchema.extend(
  activeRequirement,
).strict();
const ActiveGuardianRequirementSchema = GuardianRequirementSchema.extend(
  activeRequirement,
).strict();
const ActiveHouseholdSizeRequirementSchema = HouseholdSizeRequirementSchema.extend(
  activeRequirement,
).strict();
const ActiveIncomeRequirementSchema = IncomeRequirementSchema.extend(
  activeRequirement,
).strict();

export const ActiveRequirementsSchema = z.union([
  VersionsSchema.extend({
    fields: z.tuple([
      ActiveLegalNameRequirementSchema,
      ActiveStudentIdRequirementSchema,
      ActiveInstitutionRequirementSchema,
      ActiveEmailRequirementSchema,
      ActiveDependencyRequirementSchema,
      ActiveIncomeRequirementSchema,
    ]),
  }).strict(),
  VersionsSchema.extend({
    fields: z.tuple([
      ActiveLegalNameRequirementSchema,
      ActiveStudentIdRequirementSchema,
      ActiveInstitutionRequirementSchema,
      ActiveEmailRequirementSchema,
      ActiveDependencyRequirementSchema,
      ActiveGuardianRequirementSchema,
      ActiveHouseholdSizeRequirementSchema,
      ActiveIncomeRequirementSchema,
    ]),
  }).strict(),
]);

export const EvidenceIndexSchema = z
  .object({
    documents: AgentDocumentsV1Schema,
    claims: EvidenceClaimsV1Schema,
  })
  .strict();

function fieldsAreCanonical(fields: readonly FieldId[]): boolean {
  let prior = -1;
  for (const field of fields) {
    const next = fieldOrder.get(field);
    if (next === undefined || next <= prior) return false;
    prior = next;
  }
  return true;
}

export const ApplySuccessSchema = VersionsSchema.extend({
  updatedFields: z
    .array(FieldIdSchema)
    .min(0)
    .max(8)
    .refine(fieldsAreCanonical, {
      message: "Updated fields must be unique and in canonical order.",
    }),
  rereadRequirements: z.boolean(),
})
  .strict()
  .refine(
    ({ updatedFields, rereadRequirements }) =>
      rereadRequirements === updatedFields.includes("dependency"),
    {
      message:
        "Requirements must be reread exactly when dependency changed the active field set.",
      path: ["rereadRequirements"],
    },
  );

export const ValidationIssuesSchema = VersionsSchema.extend({
  blockers: AgentReadinessBlockersSchema,
}).strict();

export const PrepareSuccessSchema = VersionsSchema.extend({
  readiness: z.literal("ready"),
  reviewRef: z.string().regex(/^[A-Za-z0-9_-]{22}$/),
}).strict();

export const MAX_AGENT_RESULT_BYTES = 1536;

export function assertAgentResultBytes(value: unknown): void {
  const bytes = serializedResultBytes(value);
  if (bytes > MAX_AGENT_RESULT_BYTES) {
    throw new RangeError(
      `Agent result is ${bytes} bytes; maximum is ${MAX_AGENT_RESULT_BYTES}.`,
    );
  }
}

function boundedAgentResultSchema<const S extends z.ZodType>(schema: S) {
  return schema.superRefine((value, context) => {
    try {
      assertAgentResultBytes(value);
    } catch {
      context.addIssue({
        code: "custom",
        message: `Agent result exceeds ${MAX_AGENT_RESULT_BYTES} serialized UTF-8 bytes.`,
      });
    }
  });
}

const unprotectedReadServerFailures = z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  ReadUnavailableSchema,
]);
const protectedReadServerFailures = z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  ConsentRequiredFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  ReadUnavailableSchema,
]);
const applyServerFailures = z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  ConsentRequiredFailureSchema,
  RequestReuseMismatchFailureSchema,
  StaleStateFailureSchema,
  EvidenceUnavailableFailureSchema,
  ConflictRequiresHumanFailureSchema,
  DemoChangeLimitFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  MutationUnavailableSchema,
]);
const prepareServerFailures = z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  ConsentRequiredFailureSchema,
  RequestReuseMismatchFailureSchema,
  StaleStateFailureSchema,
  NotReadyForReviewFailureSchema,
  DemoChangeLimitFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  MutationUnavailableSchema,
]);

export const GetApplicationStateRedactedServerResultSchema =
  boundedAgentResultSchema(
    z.union([successSchema(RedactedStateSchema), unprotectedReadServerFailures]),
  );
export const GetApplicationStateProtectedServerResultSchema =
  boundedAgentResultSchema(
    z.union([successSchema(ProtectedStateSchema), protectedReadServerFailures]),
  );
export const GetFormRequirementsAllServerResultSchema = boundedAgentResultSchema(
  z.union([successSchema(StaticRequirementsSchema), unprotectedReadServerFailures]),
);
export const GetFormRequirementsActiveServerResultSchema =
  boundedAgentResultSchema(
    z.union([successSchema(ActiveRequirementsSchema), protectedReadServerFailures]),
  );
export const GetEvidenceIndexServerResultSchema = boundedAgentResultSchema(z.union([
  successSchema(EvidenceIndexSchema),
  protectedReadServerFailures,
]));
export const ApplyEvidenceBackedAnswersServerResultSchema =
  boundedAgentResultSchema(z.union([
  successSchema(ApplySuccessSchema),
  applyServerFailures,
]));
export const GetValidationIssuesServerResultSchema = boundedAgentResultSchema(z.union([
  successSchema(ValidationIssuesSchema),
  protectedReadServerFailures,
]));
export const PrepareSubmissionReviewServerResultSchema =
  boundedAgentResultSchema(z.union([
  successSchema(PrepareSuccessSchema),
  prepareServerFailures,
]));

export const GetApplicationStateServerResultSchema = boundedAgentResultSchema(
  z.union([
    GetApplicationStateRedactedServerResultSchema,
    GetApplicationStateProtectedServerResultSchema,
  ]),
);
export const GetFormRequirementsServerResultSchema = boundedAgentResultSchema(
  z.union([
    GetFormRequirementsAllServerResultSchema,
    GetFormRequirementsActiveServerResultSchema,
  ]),
);

export const TOOL_SERVER_RESULT_SCHEMAS = {
  get_application_state: GetApplicationStateServerResultSchema,
  get_form_requirements: GetFormRequirementsServerResultSchema,
  get_evidence_index: GetEvidenceIndexServerResultSchema,
  apply_evidence_backed_answers: ApplyEvidenceBackedAnswersServerResultSchema,
  get_validation_issues: GetValidationIssuesServerResultSchema,
  prepare_submission_review: PrepareSubmissionReviewServerResultSchema,
} as const satisfies Record<ToolName, z.ZodType>;

export const GetApplicationStateResultSchema = boundedAgentResultSchema(
  z.union([GetApplicationStateServerResultSchema, BridgeInactiveFailureSchema]),
);
export const GetFormRequirementsResultSchema = boundedAgentResultSchema(
  z.union([GetFormRequirementsServerResultSchema, BridgeInactiveFailureSchema]),
);
export const GetEvidenceIndexResultSchema = boundedAgentResultSchema(
  z.union([GetEvidenceIndexServerResultSchema, BridgeInactiveFailureSchema]),
);
export const ApplyEvidenceBackedAnswersResultSchema = boundedAgentResultSchema(
  z.union([
    ApplyEvidenceBackedAnswersServerResultSchema,
    BridgeInactiveFailureSchema,
  ]),
);
export const GetValidationIssuesResultSchema = boundedAgentResultSchema(
  z.union([GetValidationIssuesServerResultSchema, BridgeInactiveFailureSchema]),
);
export const PrepareSubmissionReviewResultSchema = boundedAgentResultSchema(
  z.union([PrepareSubmissionReviewServerResultSchema, BridgeInactiveFailureSchema]),
);

export const TOOL_RESULT_SCHEMAS = {
  get_application_state: GetApplicationStateResultSchema,
  get_form_requirements: GetFormRequirementsResultSchema,
  get_evidence_index: GetEvidenceIndexResultSchema,
  apply_evidence_backed_answers: ApplyEvidenceBackedAnswersResultSchema,
  get_validation_issues: GetValidationIssuesResultSchema,
  prepare_submission_review: PrepareSubmissionReviewResultSchema,
} as const satisfies Record<ToolName, z.ZodType>;

export type ToolInputByName = {
  get_application_state: GetApplicationStateInput;
  get_form_requirements: GetFormRequirementsInput;
  get_evidence_index: GetEvidenceIndexInput;
  apply_evidence_backed_answers: ApplyEvidenceBackedAnswersInput;
  get_validation_issues: GetValidationIssuesInput;
  prepare_submission_review: PrepareSubmissionReviewInput;
};

type ApplicationStateServerResultForMode<
  M extends GetApplicationStateInput["mode"],
> = M extends "redacted"
  ? z.infer<typeof GetApplicationStateRedactedServerResultSchema>
  : z.infer<typeof GetApplicationStateProtectedServerResultSchema>;

type FormRequirementsServerResultForMode<
  M extends GetFormRequirementsInput["mode"],
> = M extends "all"
  ? z.infer<typeof GetFormRequirementsAllServerResultSchema>
  : z.infer<typeof GetFormRequirementsActiveServerResultSchema>;

type InputMode<I> = I extends { mode: infer M } ? M : never;

export type ToolServerResultForInput<
  K extends ToolName,
  I extends ToolInputByName[K],
> = K extends "get_application_state"
  ? ApplicationStateServerResultForMode<
      Extract<InputMode<I>, GetApplicationStateInput["mode"]>
    >
  : K extends "get_form_requirements"
    ? FormRequirementsServerResultForMode<
        Extract<InputMode<I>, GetFormRequirementsInput["mode"]>
      >
    : K extends "get_evidence_index"
      ? z.infer<typeof GetEvidenceIndexServerResultSchema>
      : K extends "apply_evidence_backed_answers"
        ? z.infer<typeof ApplyEvidenceBackedAnswersServerResultSchema>
        : K extends "get_validation_issues"
          ? z.infer<typeof GetValidationIssuesServerResultSchema>
          : z.infer<typeof PrepareSubmissionReviewServerResultSchema>;

export type ToolCallbackResultForInput<
  K extends ToolName,
  I extends ToolInputByName[K],
> =
  | ToolServerResultForInput<K, I>
  | z.infer<typeof BridgeInactiveFailureSchema>;

export type ToolResultByName = {
  [K in ToolName]: ToolCallbackResultForInput<K, ToolInputByName[K]>;
};

export type ToolServerResultByName = {
  [K in ToolName]: ToolServerResultForInput<K, ToolInputByName[K]>;
};

export const WebMcpRequestSchema = z.discriminatedUnion("tool", [
  z
    .object({
      tool: z.literal("get_application_state"),
      input: GetApplicationStateInputSchema,
    })
    .strict(),
  z
    .object({
      tool: z.literal("get_form_requirements"),
      input: GetFormRequirementsInputSchema,
    })
    .strict(),
  z
    .object({ tool: z.literal("get_evidence_index"), input: GetEvidenceIndexInputSchema })
    .strict(),
  z
    .object({
      tool: z.literal("apply_evidence_backed_answers"),
      input: ApplyEvidenceBackedAnswersInputSchema,
    })
    .strict(),
  z
    .object({
      tool: z.literal("get_validation_issues"),
      input: GetValidationIssuesInputSchema,
    })
    .strict(),
  z
    .object({
      tool: z.literal("prepare_submission_review"),
      input: PrepareSubmissionReviewInputSchema,
    })
    .strict(),
]);

export type WebMcpRequest = z.infer<typeof WebMcpRequestSchema>;

export function serverResultSchemaForInvocation(
  tool: ToolName,
  input: unknown,
): z.ZodType {
  const parsedInput = TOOL_INPUT_SCHEMAS[tool].parse(input);
  if (tool === "get_application_state") {
    const mode = (parsedInput as GetApplicationStateInput).mode;
    return mode === "redacted"
      ? GetApplicationStateRedactedServerResultSchema
      : GetApplicationStateProtectedServerResultSchema;
  }
  if (tool === "get_form_requirements") {
    const mode = (parsedInput as GetFormRequirementsInput).mode;
    return mode === "all"
      ? GetFormRequirementsAllServerResultSchema
      : GetFormRequirementsActiveServerResultSchema;
  }
  return TOOL_SERVER_RESULT_SCHEMAS[tool];
}

export function callbackResultSchemaForInvocation(
  tool: ToolName,
  input: unknown,
): z.ZodType {
  return boundedAgentResultSchema(
    z.union([
      serverResultSchemaForInvocation(tool, input),
      BridgeInactiveFailureSchema,
    ]),
  );
}

export function parseServerToolResult<
  const K extends ToolName,
  const I extends ToolInputByName[K],
>(
  tool: K,
  input: I,
  value: unknown,
): ToolServerResultForInput<K, I> {
  return serverResultSchemaForInvocation(tool, input).parse(
    value,
  ) as ToolServerResultForInput<K, I>;
}

export function parseCallbackToolResult<
  const K extends ToolName,
  const I extends ToolInputByName[K],
>(
  tool: K,
  input: I,
  value: unknown,
): ToolCallbackResultForInput<K, I> {
  return callbackResultSchemaForInvocation(tool, input).parse(
    value,
  ) as ToolCallbackResultForInput<K, I>;
}

const applyAgentOnlyResultSchema = boundedAgentResultSchema(z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  ConsentRequiredFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
  MutationUnavailableSchema,
]));
const applyCurrentProjectedResultSchema = boundedAgentResultSchema(z.union([
  successSchema(ApplySuccessSchema),
  RequestReuseMismatchFailureSchema,
  StaleStateFailureSchema,
  EvidenceUnavailableFailureSchema,
  ConflictRequiresHumanFailureSchema,
  DemoChangeLimitFailureSchema,
]));
const applyHistoricalProjectedResultSchema = boundedAgentResultSchema(z.union([
  successSchema(ApplySuccessSchema),
  EvidenceUnavailableFailureSchema,
  ConflictRequiresHumanFailureSchema,
]));
const prepareAgentOnlyResultSchema = applyAgentOnlyResultSchema;
const prepareCurrentTerminalSchema = boundedAgentResultSchema(z.union([
  RequestReuseMismatchFailureSchema,
  StaleStateFailureSchema,
  NotReadyForReviewFailureSchema,
  DemoChangeLimitFailureSchema,
]));
const historicalNotReadyForReviewFailureSchema = z
  .object({
    ok: z.literal(false),
    error: z
      .object({
        code: z.literal("not_ready_for_review"),
        message: z.literal("The application is not ready for Review."),
        safeActions: z.tuple([z.literal("use_visible_application")]),
        blockers: NonEmptyDomainReadinessBlockersSchema,
      })
      .strict(),
  })
  .strict();
const prepareHistoricalTerminalSchema = boundedAgentResultSchema(
  historicalNotReadyForReviewFailureSchema,
);
const prepareSuccessResultSchema = boundedAgentResultSchema(
  successSchema(PrepareSuccessSchema),
);

function agentOnlyEnvelope<const K extends ToolName>(tool: K, result: z.ZodType) {
  return z
    .object({
      schema: z.literal("citeapply-webmcp-http-v1"),
      kind: z.literal("agent_only"),
      tool: z.literal(tool),
      callbackResult: result,
    })
    .strict();
}

function resultVersions(value: unknown):
  | Readonly<{ applicationRevision: number; requirementsVersion: number }>
  | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const candidate = value as {
    ok?: unknown;
    data?: unknown;
    error?: unknown;
  };
  const payload = candidate.ok === true ? candidate.data : candidate.error;
  if (typeof payload !== "object" || payload === null) return undefined;
  const versions =
    "currentVersions" in payload
      ? (payload as { currentVersions?: unknown }).currentVersions
      : payload;
  if (typeof versions !== "object" || versions === null) return undefined;
  const applicationRevision = (versions as { applicationRevision?: unknown })
    .applicationRevision;
  const requirementsVersion = (versions as { requirementsVersion?: unknown })
    .requirementsVersion;
  return typeof applicationRevision === "number" &&
    typeof requirementsVersion === "number"
    ? { applicationRevision, requirementsVersion }
    : undefined;
}

function currentProjectionVersionsAgree(value: {
  disposition: "current" | "historical_replay";
  callbackResult: unknown;
  uiSnapshot: Readonly<{
    applicationRevision: number;
    requirementsVersion: number;
  }>;
}): boolean {
  if (value.disposition === "historical_replay") return true;
  const versions = resultVersions(value.callbackResult);
  return (
    versions === undefined ||
    (versions.applicationRevision === value.uiSnapshot.applicationRevision &&
      versions.requirementsVersion === value.uiSnapshot.requirementsVersion)
  );
}

type VersionCoordinates = Readonly<{
  applicationRevision: number;
  requirementsVersion: number;
}>;

function expectedInputVersions(
  input:
    | ApplyEvidenceBackedAnswersInput
    | PrepareSubmissionReviewInput,
): VersionCoordinates {
  return {
    applicationRevision: input.expectedApplicationRevision,
    requirementsVersion: input.expectedRequirementsVersion,
  };
}

function versionsEqual(
  left: VersionCoordinates,
  right: VersionCoordinates,
): boolean {
  return (
    left.applicationRevision === right.applicationRevision &&
    left.requirementsVersion === right.requirementsVersion
  );
}

function versionsNotOlder(
  current: VersionCoordinates,
  earlier: VersionCoordinates,
): boolean {
  return (
    current.applicationRevision >= earlier.applicationRevision &&
    current.requirementsVersion >= earlier.requirementsVersion
  );
}

function applySuccessMatchesInput(
  input: ApplyEvidenceBackedAnswersInput,
  success: z.infer<typeof ApplySuccessSchema>,
): boolean {
  const requestedFields = new Set(input.changes.map(({ field }) => field));
  if (!success.updatedFields.every((field) => requestedFields.has(field))) {
    return false;
  }
  const changed = success.updatedFields.length > 0;
  const changedRequirements = success.updatedFields.includes("dependency");
  const expectedApplicationRevision =
    input.expectedApplicationRevision + (changed ? 1 : 0);
  const expectedRequirementsVersion =
    input.expectedRequirementsVersion + (changedRequirements ? 1 : 0);
  return (
    Number.isSafeInteger(expectedApplicationRevision) &&
    Number.isSafeInteger(expectedRequirementsVersion) &&
    success.applicationRevision === expectedApplicationRevision &&
    success.requirementsVersion === expectedRequirementsVersion &&
    success.rereadRequirements === changedRequirements
  );
}

function inputHasEvidenceBinding(
  input: ApplyEvidenceBackedAnswersInput,
): boolean {
  return input.changes.some(({ kind }) => kind === "bind_claim");
}

function inputHasIncomeBinding(input: ApplyEvidenceBackedAnswersInput): boolean {
  return input.changes.some(
    (change) =>
      change.kind === "bind_claim" &&
      change.field === "annual_household_income",
  );
}

function currentApplyProjectionAgrees(
  input: ApplyEvidenceBackedAnswersInput,
  value: Readonly<{
    callbackResult: z.infer<typeof applyCurrentProjectedResultSchema>;
    uiSnapshot: z.infer<typeof DraftAllowedSnapshotV1Schema>;
  }>,
): boolean {
  const result = value.callbackResult;
  const snapshot = value.uiSnapshot;
  const expected = expectedInputVersions(input);
  if (result.ok) {
    return (
      applySuccessMatchesInput(input, result.data) &&
      versionsEqual(result.data, snapshot)
    );
  }
  switch (result.error.code) {
    case "request_reuse_mismatch":
      return true;
    case "stale_state":
      return (
        versionsEqual(result.error.currentVersions, snapshot) &&
        !versionsEqual(expected, snapshot)
      );
    case "evidence_unavailable":
      return versionsEqual(expected, snapshot) && inputHasEvidenceBinding(input);
    case "conflict_requires_human":
      return versionsEqual(expected, snapshot) && inputHasIncomeBinding(input);
    case "demo_change_limit":
      return versionsEqual(expected, snapshot);
  }
}

function historicalApplyProjectionAgrees(
  input: ApplyEvidenceBackedAnswersInput,
  value: Readonly<{
    callbackResult: z.infer<typeof applyHistoricalProjectedResultSchema>;
    uiSnapshot: z.infer<typeof DraftAllowedSnapshotV1Schema>;
  }>,
): boolean {
  const result = value.callbackResult;
  const snapshot = value.uiSnapshot;
  const expected = expectedInputVersions(input);
  if (result.ok) {
    return (
      applySuccessMatchesInput(input, result.data) &&
      versionsNotOlder(snapshot, result.data)
    );
  }
  return (
    versionsNotOlder(snapshot, expected) &&
    (result.error.code === "evidence_unavailable"
      ? inputHasEvidenceBinding(input)
      : inputHasIncomeBinding(input))
  );
}

function currentPrepareTerminalAgrees(
  input: PrepareSubmissionReviewInput,
  value: Readonly<{
    callbackResult: z.infer<typeof prepareCurrentTerminalSchema>;
    uiSnapshot: z.infer<typeof DraftAllowedSnapshotV1Schema>;
  }>,
): boolean {
  const result = value.callbackResult;
  const snapshot = value.uiSnapshot;
  const expected = expectedInputVersions(input);
  switch (result.error.code) {
    case "request_reuse_mismatch":
      return true;
    case "stale_state":
      return (
        versionsEqual(result.error.currentVersions, snapshot) &&
        !versionsEqual(expected, snapshot)
      );
    case "demo_change_limit":
      return versionsEqual(expected, snapshot);
    case "not_ready_for_review": {
      if (!versionsEqual(expected, snapshot)) return false;
      const blockers = result.error.blockers;
      if (blockers[0]?.code === "unsaved_changes") return blockers.length === 1;
      return JSON.stringify(blockers) === JSON.stringify(snapshot.view.blockers);
    }
  }
}

function historicalPrepareBlockersAgree(value: {
  callbackResult: z.infer<typeof historicalNotReadyForReviewFailureSchema>;
  uiSnapshot: z.infer<typeof DraftAllowedSnapshotV1Schema>;
}): boolean {
  return (
    JSON.stringify(value.callbackResult.error.blockers) ===
    JSON.stringify(value.uiSnapshot.view.blockers)
  );
}

function currentPrepareSuccessAgrees(
  input: PrepareSubmissionReviewInput,
  value: Readonly<{
    callbackResult: z.infer<typeof prepareSuccessResultSchema>;
    uiSnapshot: z.infer<typeof ReviewSnapshotV1Schema>;
  }>,
): boolean {
  const currentApplicationRevision = input.expectedApplicationRevision + 1;
  if (!Number.isSafeInteger(currentApplicationRevision)) return false;
  const current = {
    applicationRevision: currentApplicationRevision,
    requirementsVersion: input.expectedRequirementsVersion,
  };
  return (
    versionsEqual(value.callbackResult.data, current) &&
    versionsEqual(value.uiSnapshot, current) &&
    versionsEqual(
      value.uiSnapshot.review.sourceVersions,
      expectedInputVersions(input),
    )
  );
}

function applyEnvelopeSchema(input: ApplyEvidenceBackedAnswersInput) {
  return z.union([
    agentOnlyEnvelope("apply_evidence_backed_answers", applyAgentOnlyResultSchema),
    z
      .object({
        schema: z.literal("citeapply-webmcp-http-v1"),
        kind: z.literal("mutation_projection"),
        tool: z.literal("apply_evidence_backed_answers"),
        disposition: z.literal("current"),
        callbackResult: applyCurrentProjectedResultSchema,
        uiSnapshot: DraftAllowedSnapshotV1Schema,
      })
      .strict()
      .refine(currentProjectionVersionsAgree, {
        message: "Current mutation result versions must match the UI snapshot.",
      })
      .refine((value) => currentApplyProjectionAgrees(input, value), {
        message: "Current Apply result does not match its input and snapshot.",
      }),
    z
      .object({
        schema: z.literal("citeapply-webmcp-http-v1"),
        kind: z.literal("mutation_projection"),
        tool: z.literal("apply_evidence_backed_answers"),
        disposition: z.literal("historical_replay"),
        callbackResult: applyHistoricalProjectedResultSchema,
        uiSnapshot: DraftAllowedSnapshotV1Schema,
      })
      .strict()
      .refine((value) => historicalApplyProjectionAgrees(input, value), {
        message: "Historical Apply result does not match its stored input.",
      }),
  ]);
}

function prepareEnvelopeSchema(input: PrepareSubmissionReviewInput) {
  return z.union([
    agentOnlyEnvelope("prepare_submission_review", prepareAgentOnlyResultSchema),
    z
      .object({
        schema: z.literal("citeapply-webmcp-http-v1"),
        kind: z.literal("mutation_projection"),
        tool: z.literal("prepare_submission_review"),
        disposition: z.literal("current"),
        callbackResult: prepareCurrentTerminalSchema,
        uiSnapshot: DraftAllowedSnapshotV1Schema,
      })
      .strict()
      .refine(currentProjectionVersionsAgree, {
        message: "Current terminal versions must match the UI snapshot.",
      })
      .refine((value) => currentPrepareTerminalAgrees(input, value), {
        message: "Current Prepare terminal does not match its input and snapshot.",
      }),
    z
      .object({
        schema: z.literal("citeapply-webmcp-http-v1"),
        kind: z.literal("mutation_projection"),
        tool: z.literal("prepare_submission_review"),
        disposition: z.literal("historical_replay"),
        callbackResult: prepareHistoricalTerminalSchema,
        uiSnapshot: DraftAllowedSnapshotV1Schema,
      })
      .strict()
      .refine(historicalPrepareBlockersAgree, {
        message: "Historical blocked preparation must match current Draft blockers.",
      })
      .refine(
        (value) =>
          versionsNotOlder(
            value.uiSnapshot,
            expectedInputVersions(input),
          ),
        {
          message: "Historical blocked preparation cannot be newer than its snapshot.",
        },
      ),
    z
      .object({
        schema: z.literal("citeapply-webmcp-http-v1"),
        kind: z.literal("mutation_projection"),
        tool: z.literal("prepare_submission_review"),
        disposition: z.literal("current"),
        callbackResult: prepareSuccessResultSchema,
        uiSnapshot: ReviewSnapshotV1Schema,
      })
      .strict()
      .refine(currentProjectionVersionsAgree, {
        message: "Prepared Review versions must match the UI snapshot.",
      })
      .refine((value) => currentPrepareSuccessAgrees(input, value), {
        message: "Prepared Review does not match its source input coordinates.",
      }),
  ]);
}

export function webMcpHttpEnvelopeSchema<
  const K extends ToolName,
  const I extends ToolInputByName[K],
>(
  tool: K,
  input: I,
): z.ZodType {
  const parsedInput = TOOL_INPUT_SCHEMAS[tool].parse(input);
  const serverResult = serverResultSchemaForInvocation(tool, parsedInput);
  if (tool === "apply_evidence_backed_answers") {
    return applyEnvelopeSchema(
      parsedInput as ApplyEvidenceBackedAnswersInput,
    );
  }
  if (tool === "prepare_submission_review") {
    return prepareEnvelopeSchema(parsedInput as PrepareSubmissionReviewInput);
  }
  return agentOnlyEnvelope(tool, serverResult);
}

export function parseWebMcpHttpEnvelope<
  const K extends ToolName,
  const I extends ToolInputByName[K],
>(
  tool: K,
  input: I,
  value: unknown,
): WebMcpHttpEnvelopeV1<K, I> {
  return webMcpHttpEnvelopeSchema(tool, input).parse(
    value,
  ) as WebMcpHttpEnvelopeV1<K, I>;
}

type ReadToolName = Exclude<
  ToolName,
  "apply_evidence_backed_answers" | "prepare_submission_review"
>;

type AgentOnlyHttpEnvelope<
  K extends ReadToolName,
  I extends ToolInputByName[K],
> = {
  schema: "citeapply-webmcp-http-v1";
  kind: "agent_only";
  tool: K;
  callbackResult: ToolServerResultForInput<K, I>;
};

export type WebMcpHttpEnvelopeV1<
  K extends ToolName,
  I extends ToolInputByName[K] = ToolInputByName[K],
> = K extends ReadToolName
  ? AgentOnlyHttpEnvelope<K, I>
  : K extends "apply_evidence_backed_answers"
    ? z.infer<ReturnType<typeof applyEnvelopeSchema>>
    : z.infer<ReturnType<typeof prepareEnvelopeSchema>>;

export type RedactedState = z.infer<typeof RedactedStateSchema>;
export type AgentField = z.infer<typeof AgentFieldSchema>;
export type ProtectedState = z.infer<typeof ProtectedStateSchema>;
export type StaticRequirement = (typeof STATIC_REQUIREMENTS)[number];
export type ActiveRequirements = z.infer<typeof ActiveRequirementsSchema>;
export type EvidenceIndex = z.infer<typeof EvidenceIndexSchema>;
export type ApplySuccess = z.infer<typeof ApplySuccessSchema>;
export type ValidationIssues = z.infer<typeof ValidationIssuesSchema>;
export type PrepareSuccess = z.infer<typeof PrepareSuccessSchema>;

export function closeJsonSchemaTuples(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(closeJsonSchemaTuples);
  if (typeof value !== "object" || value === null) return value;
  const source = value as Record<string, unknown>;
  const closed: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(source)) {
    closed[key] = closeJsonSchemaTuples(child);
  }
  if (Array.isArray(closed["prefixItems"])) {
    const length = closed["prefixItems"].length;
    closed["minItems"] = length;
    closed["maxItems"] = length;
    closed["items"] = false;
  }
  return closed;
}

export function closedJsonSchema(schema: z.ZodType): object {
  return closeJsonSchemaTuples(z.toJSONSchema(schema)) as object;
}

export function buildWebMcpContractSnapshot() {
  return {
    schema: "citeapply-webmcp-contract-v1",
    tools: TOOL_NAMES.map((name) => ({
      name,
      description: TOOL_DESCRIPTIONS[name],
      annotations: TOOL_ANNOTATIONS[name],
      inputSchema: closedJsonSchema(TOOL_INPUT_SCHEMAS[name]),
      resultSchema: closedJsonSchema(TOOL_RESULT_SCHEMAS[name]),
    })),
  } as const;
}

export function serializedResultBytes(value: unknown): number {
  const serialized = JSON.stringify(value);
  return serialized === undefined
    ? Number.POSITIVE_INFINITY
    : new TextEncoder().encode(serialized).byteLength;
}

export function isToolName(value: string): value is ToolName {
  return (TOOL_NAMES as readonly string[]).includes(value);
}

export function isFieldId(value: string): value is FieldId {
  return FieldIdSchema.safeParse(value).success;
}
