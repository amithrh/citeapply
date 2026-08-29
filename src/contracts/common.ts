import { z } from "zod";

export const FIELD_IDS = [
  "legal_name",
  "student_id",
  "institution",
  "preferred_contact_email",
  "dependency",
  "guardian_name",
  "household_size",
  "annual_household_income",
] as const;

export const EVIDENCE_FIELD_IDS = [
  "legal_name",
  "student_id",
  "institution",
  "dependency",
  "guardian_name",
  "household_size",
  "annual_household_income",
] as const;

export const ORDINARY_CLEAR_FIELD_IDS = [
  "legal_name",
  "student_id",
  "institution",
  "guardian_name",
  "household_size",
  "annual_household_income",
] as const;

export const DOCUMENT_CODES = ["enrollment", "household", "income"] as const;
export const DOCUMENT_CLASSES = [
  "synthetic_enrollment_record",
  "synthetic_household_statement",
  "synthetic_income_statement",
] as const;
export const PACKET_CODES = ["supported", "conflict"] as const;
export const CONFLICT_REASONS = [
  "more_recent",
  "corrected_record",
  "confirmed_for_application",
] as const;

export const FieldIdSchema = z.enum(FIELD_IDS);
export const EvidenceFieldSchema = z.enum(EVIDENCE_FIELD_IDS);
export const OrdinaryClearFieldSchema = z.enum(ORDINARY_CLEAR_FIELD_IDS);
export const DocumentCodeSchema = z.enum(DOCUMENT_CODES);
export const DocumentClassSchema = z.enum(DOCUMENT_CLASSES);
export const PacketCodeSchema = z.enum(PACKET_CODES);
export const ConflictReasonSchema = z.enum(CONFLICT_REASONS);

export type FieldId = z.infer<typeof FieldIdSchema>;
export type EvidenceField = z.infer<typeof EvidenceFieldSchema>;
export type OrdinaryClearField = z.infer<typeof OrdinaryClearFieldSchema>;
export type DocumentCode = z.infer<typeof DocumentCodeSchema>;
export type DocumentClass = z.infer<typeof DocumentClassSchema>;
export type PacketCode = z.infer<typeof PacketCodeSchema>;
export type ConflictReason = z.infer<typeof ConflictReasonSchema>;
export type ClaimKind = EvidenceField;

export const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const SHA256_PATTERN = /^[0-9a-f]{64}$/;
export const BASE64URL_128_PATTERN = /^[A-Za-z0-9_-]{22}$/;
export const SUPPORT_REFERENCE_PATTERN = /^CA-[0-9A-HJKMNP-TV-Z]{8}$/;
export const RFC3339_INSTANT_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
export const SYNTHETIC_TEST_EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.test$/i;

export const UuidV4Schema = z.string().regex(UUID_V4_PATTERN);
export const Sha256Schema = z.string().regex(SHA256_PATTERN);
export const ClaimHandleSchema = z.string().regex(BASE64URL_128_PATTERN);
export const OpaqueReferenceSchema = z.string().regex(BASE64URL_128_PATTERN);
export const SupportReferenceSchema = z
  .string()
  .regex(SUPPORT_REFERENCE_PATTERN);
export const Rfc3339InstantSchema = z
  .string()
  .regex(RFC3339_INSTANT_PATTERN)
  .pipe(z.iso.datetime({ offset: true }));
export const SyntheticTestEmailSchema = z
  .string()
  .min(3)
  .max(254)
  .regex(SYNTHETIC_TEST_EMAIL_PATTERN)
  .pipe(z.email())
  .refine(
    (value) => {
      const separator = value.lastIndexOf("@");
      const local = value.slice(0, separator);
      const domain = value.slice(separator + 1);
      return (
        value === value.normalize("NFC") &&
        local.length <= 64 &&
        domain === domain.toLocaleLowerCase("en-US")
      );
    },
    { message: "Email must be canonical and use a lowercase .test domain." },
  );
export const SafeRevisionSchema = z.number().int().safe().nonnegative();
export const PositiveRequirementsVersionSchema = z.number().int().safe().min(1);
export const PageEpochSchema = z.number().int().safe().nonnegative();
export const ProjectionSequenceSchema = z.number().int().safe().min(0).max(128);

export const VersionsSchema = z
  .object({
    applicationRevision: SafeRevisionSchema,
    requirementsVersion: PositiveRequirementsVersionSchema,
  })
  .strict();

export type Versions = z.infer<typeof VersionsSchema>;

export const RecoveryActionSchema = z.enum([
  "use_visible_application",
  "reload_current_application",
  "reread_state_and_requirements",
  "resolve_in_visible_application",
  "start_new_synthetic_demo",
  "try_again_after_delay",
  "return_to_packet_selection",
  "load_receipt_again",
  "retry_export",
  "reconcile_current_state",
]);

export type RecoveryAction = z.infer<typeof RecoveryActionSchema>;

const MissingEvidenceBlockerSchema = z
  .object({
    code: z.literal("missing_evidence"),
    field: EvidenceFieldSchema,
    message: z.literal("Required evidence is not linked."),
    action: z.literal("reread_state_and_requirements"),
  })
  .strict();

const ConflictBlockerSchema = z
  .object({
    code: z.literal("conflict_requires_human"),
    field: z.literal("annual_household_income"),
    message: z.literal("Income sources disagree. Resolve this in CiteApply."),
    action: z.literal("resolve_in_visible_application"),
  })
  .strict();

const InvalidEmailBlockerSchema = z
  .object({
    code: z.literal("invalid_email"),
    field: z.literal("preferred_contact_email"),
    message: z.literal("Save a valid synthetic .test email in CiteApply."),
    action: z.literal("use_visible_application"),
  })
  .strict();

const DeclarationBlockerSchema = z
  .object({
    code: z.literal("declaration_required"),
    field: z.literal("preferred_contact_email"),
    message: z.literal("Declare the saved synthetic email in CiteApply."),
    action: z.literal("use_visible_application"),
  })
  .strict();

export const DomainReadinessBlockerSchema = z.discriminatedUnion("code", [
  MissingEvidenceBlockerSchema,
  ConflictBlockerSchema,
  InvalidEmailBlockerSchema,
  DeclarationBlockerSchema,
]);

export const AgentUnsavedChangesBlockerSchema = z
  .object({
    code: z.literal("unsaved_changes"),
    message: z.literal("Save or discard visible changes before Review."),
    action: z.literal("use_visible_application"),
  })
  .strict();

export const HumanUnsavedChangesBlockerSchema = z
  .object({
    code: z.literal("unsaved_changes"),
    field: z.enum(["preferred_contact_email", "annual_household_income"]),
    message: z.literal("Save or discard this visible change before Review."),
    action: z.literal("use_visible_application"),
  })
  .strict();

export const AgentReadinessBlockerSchema = z.union([
  DomainReadinessBlockerSchema,
  AgentUnsavedChangesBlockerSchema,
]);
export const HumanReadinessBlockerSchema = z.union([
  DomainReadinessBlockerSchema,
  HumanUnsavedChangesBlockerSchema,
]);

type ReadinessBlockerLike = Readonly<{
  code: string;
  field?: FieldId | "preferred_contact_email" | "annual_household_income";
}>;

const MISSING_EVIDENCE_ORDER = new Map<FieldId, number>(
  EVIDENCE_FIELD_IDS.map((field, index) => [field, index]),
);

function blockerOrder(blocker: ReadinessBlockerLike): number {
  if (blocker.code === "missing_evidence" && blocker.field !== undefined) {
    return (
      MISSING_EVIDENCE_ORDER.get(blocker.field) ?? Number.POSITIVE_INFINITY
    );
  }
  if (blocker.code === "conflict_requires_human") return 20;
  if (blocker.code === "invalid_email") return 21;
  if (blocker.code === "declaration_required") return 22;
  if (blocker.code === "unsaved_changes") {
    if (blocker.field === "preferred_contact_email") return 23;
    if (blocker.field === "annual_household_income") return 24;
    return 25;
  }
  return Number.POSITIVE_INFINITY;
}

function blockerIdentity(blocker: ReadinessBlockerLike): string {
  return blocker.field ?? blocker.code;
}

export function hasCanonicalReadinessBlockerOrder(
  blockers: readonly ReadinessBlockerLike[],
): boolean {
  const identities = new Set<string>();
  let previousOrder = -1;
  for (const blocker of blockers) {
    const order = blockerOrder(blocker);
    const identity = blockerIdentity(blocker);
    if (
      !Number.isFinite(order) ||
      order <= previousOrder ||
      identities.has(identity)
    ) {
      return false;
    }
    identities.add(identity);
    previousOrder = order;
  }
  return true;
}

function canonicalBlockerArray<const T extends z.ZodType>(
  blocker: T,
  minimum: 0 | 1,
) {
  return z
    .array(blocker)
    .min(minimum)
    .max(8)
    .refine(
      (blockers) =>
        hasCanonicalReadinessBlockerOrder(
          blockers as readonly ReadinessBlockerLike[],
        ),
      {
        message: "Readiness blockers must be unique and in canonical order.",
      },
    );
}

export const DomainReadinessBlockersSchema = canonicalBlockerArray(
  DomainReadinessBlockerSchema,
  0,
);
export const NonEmptyDomainReadinessBlockersSchema = canonicalBlockerArray(
  DomainReadinessBlockerSchema,
  1,
);
export const AgentReadinessBlockersSchema = canonicalBlockerArray(
  AgentReadinessBlockerSchema,
  0,
);
export const NonEmptyAgentReadinessBlockersSchema = canonicalBlockerArray(
  AgentReadinessBlockerSchema,
  1,
);

export type DomainReadinessBlocker = z.infer<
  typeof DomainReadinessBlockerSchema
>;
export type AgentReadinessBlocker = z.infer<typeof AgentReadinessBlockerSchema>;
export type HumanReadinessBlocker = z.infer<typeof HumanReadinessBlockerSchema>;

export const DOCUMENT_METADATA = [
  {
    code: "enrollment",
    title: "Synthetic Enrollment Record",
    documentClass: "synthetic_enrollment_record",
  },
  {
    code: "household",
    title: "Synthetic Household Statement",
    documentClass: "synthetic_household_statement",
  },
  {
    code: "income",
    title: "Synthetic Income Statement",
    documentClass: "synthetic_income_statement",
  },
] as const;

function agentDocumentSchema<
  const M extends (typeof DOCUMENT_METADATA)[number],
>(metadata: M) {
  return z
    .object({
      code: z.literal(metadata.code),
      title: z.literal(metadata.title),
      documentClass: z.literal(metadata.documentClass),
    })
    .strict();
}

const EnrollmentAgentDocumentSchema = agentDocumentSchema(DOCUMENT_METADATA[0]);
const HouseholdAgentDocumentSchema = agentDocumentSchema(DOCUMENT_METADATA[1]);
const IncomeAgentDocumentSchema = agentDocumentSchema(DOCUMENT_METADATA[2]);

export const AgentDocumentSchema = z.union([
  EnrollmentAgentDocumentSchema,
  HouseholdAgentDocumentSchema,
  IncomeAgentDocumentSchema,
]);
export const AgentDocumentsV1Schema = z.tuple([
  EnrollmentAgentDocumentSchema,
  HouseholdAgentDocumentSchema,
  IncomeAgentDocumentSchema,
]);

const EvidenceClaimBaseShape = {
  claimHandle: ClaimHandleSchema,
  page: z.literal(1),
} as const;

function stringEvidenceClaimSchema<
  const K extends "legal_name" | "student_id" | "institution" | "guardian_name",
  const D extends "enrollment" | "household",
>(kind: K, document: D) {
  return z
    .object({
      ...EvidenceClaimBaseShape,
      document: z.literal(document),
      kind: z.literal(kind),
      normalizedValue: z
        .string()
        .min(1)
        .max(160)
        .refine((value) => value === value.normalize("NFC")),
    })
    .strict();
}

function numericEvidenceClaimSchema<
  const K extends "household_size" | "annual_household_income",
  const D extends "household" | "income",
>(kind: K, document: D) {
  const value = z
    .number()
    .int()
    .safe()
    .min(kind === "household_size" ? 1 : 0);
  return z
    .object({
      ...EvidenceClaimBaseShape,
      document: z.literal(document),
      kind: z.literal(kind),
      normalizedValue: value,
    })
    .strict();
}

const LegalNameEvidenceClaimSchema = stringEvidenceClaimSchema(
  "legal_name",
  "enrollment",
);
const StudentIdEvidenceClaimSchema = stringEvidenceClaimSchema(
  "student_id",
  "enrollment",
);
const InstitutionEvidenceClaimSchema = stringEvidenceClaimSchema(
  "institution",
  "enrollment",
);
const DependencyEvidenceClaimSchema = z
  .object({
    ...EvidenceClaimBaseShape,
    document: z.literal("household"),
    kind: z.literal("dependency"),
    normalizedValue: z.literal(true),
  })
  .strict();
const GuardianEvidenceClaimSchema = stringEvidenceClaimSchema(
  "guardian_name",
  "household",
);
const HouseholdSizeEvidenceClaimSchema = numericEvidenceClaimSchema(
  "household_size",
  "household",
);
const HouseholdIncomeEvidenceClaimSchema = numericEvidenceClaimSchema(
  "annual_household_income",
  "household",
);
const IncomeStatementEvidenceClaimSchema = numericEvidenceClaimSchema(
  "annual_household_income",
  "income",
);

export const EvidenceClaimSchema = z.union([
  LegalNameEvidenceClaimSchema,
  StudentIdEvidenceClaimSchema,
  InstitutionEvidenceClaimSchema,
  DependencyEvidenceClaimSchema,
  GuardianEvidenceClaimSchema,
  HouseholdSizeEvidenceClaimSchema,
  HouseholdIncomeEvidenceClaimSchema,
  IncomeStatementEvidenceClaimSchema,
]);
export const EvidenceClaimsV1Schema = z
  .tuple([
    LegalNameEvidenceClaimSchema,
    StudentIdEvidenceClaimSchema,
    InstitutionEvidenceClaimSchema,
    DependencyEvidenceClaimSchema,
    GuardianEvidenceClaimSchema,
    HouseholdSizeEvidenceClaimSchema,
    HouseholdIncomeEvidenceClaimSchema,
    IncomeStatementEvidenceClaimSchema,
  ])
  .refine(
    (claims) =>
      new Set(claims.map(({ claimHandle }) => claimHandle)).size === 8,
    { message: "Evidence claim handles must be unique." },
  );

export type AgentDocument = z.infer<typeof AgentDocumentSchema>;
export type EvidenceClaim = z.infer<typeof EvidenceClaimSchema>;

function parsedDocumentSchema<
  const M extends (typeof DOCUMENT_METADATA)[number],
>(metadata: M) {
  return z
    .object({
      code: z.literal(metadata.code),
      title: z.literal(metadata.title),
      documentClass: z.literal(metadata.documentClass),
      documentHash: Sha256Schema,
      page: z.literal(1),
      pageText: z.string().min(1).max(4096),
    })
    .strict();
}

const EnrollmentParsedDocumentSchema = parsedDocumentSchema(
  DOCUMENT_METADATA[0],
);
const HouseholdParsedDocumentSchema = parsedDocumentSchema(
  DOCUMENT_METADATA[1],
);
const IncomeParsedDocumentSchema = parsedDocumentSchema(DOCUMENT_METADATA[2]);

export const ParsedDocumentSchema = z.union([
  EnrollmentParsedDocumentSchema,
  HouseholdParsedDocumentSchema,
  IncomeParsedDocumentSchema,
]);
export const ParsedDocumentsV1Schema = z.tuple([
  EnrollmentParsedDocumentSchema,
  HouseholdParsedDocumentSchema,
  IncomeParsedDocumentSchema,
]);

const ParsedClaimAnchorSchema = z
  .object({ start: z.number().int().min(0), end: z.number().int().min(1) })
  .strict()
  .refine(({ start, end }) => start < end && end - start <= 320);

function parsedClaimBase<const M extends (typeof DOCUMENT_METADATA)[number]>(
  metadata: M,
) {
  return {
    claimHandle: ClaimHandleSchema,
    fingerprint: Sha256Schema,
    document: z.literal(metadata.code),
    title: z.literal(metadata.title),
    documentClass: z.literal(metadata.documentClass),
    documentHash: Sha256Schema,
    page: z.literal(1),
    anchor: ParsedClaimAnchorSchema,
  } as const;
}

function parsedStringClaimSchema<
  const K extends "legal_name" | "student_id" | "institution" | "guardian_name",
  const M extends (typeof DOCUMENT_METADATA)[number],
>(kind: K, metadata: M) {
  return z
    .object({
      ...parsedClaimBase(metadata),
      kind: z.literal(kind),
      normalizedValue: z
        .string()
        .min(1)
        .max(160)
        .refine((value) => value === value.normalize("NFC")),
    })
    .strict();
}

function parsedNumericClaimSchema<
  const K extends "household_size" | "annual_household_income",
  const M extends (typeof DOCUMENT_METADATA)[number],
>(kind: K, metadata: M) {
  return z
    .object({
      ...parsedClaimBase(metadata),
      kind: z.literal(kind),
      normalizedValue: z
        .number()
        .int()
        .safe()
        .min(kind === "household_size" ? 1 : 0),
    })
    .strict();
}

const LegalNameParsedClaimSchema = parsedStringClaimSchema(
  "legal_name",
  DOCUMENT_METADATA[0],
);
const StudentIdParsedClaimSchema = parsedStringClaimSchema(
  "student_id",
  DOCUMENT_METADATA[0],
);
const InstitutionParsedClaimSchema = parsedStringClaimSchema(
  "institution",
  DOCUMENT_METADATA[0],
);
const DependencyParsedClaimSchema = z
  .object({
    ...parsedClaimBase(DOCUMENT_METADATA[1]),
    kind: z.literal("dependency"),
    normalizedValue: z.literal(true),
  })
  .strict();
const GuardianParsedClaimSchema = parsedStringClaimSchema(
  "guardian_name",
  DOCUMENT_METADATA[1],
);
const HouseholdSizeParsedClaimSchema = parsedNumericClaimSchema(
  "household_size",
  DOCUMENT_METADATA[1],
);
const HouseholdIncomeParsedClaimSchema = parsedNumericClaimSchema(
  "annual_household_income",
  DOCUMENT_METADATA[1],
);
const IncomeStatementParsedClaimSchema = parsedNumericClaimSchema(
  "annual_household_income",
  DOCUMENT_METADATA[2],
);

export const ParsedClaimSchema = z.union([
  LegalNameParsedClaimSchema,
  StudentIdParsedClaimSchema,
  InstitutionParsedClaimSchema,
  DependencyParsedClaimSchema,
  GuardianParsedClaimSchema,
  HouseholdSizeParsedClaimSchema,
  HouseholdIncomeParsedClaimSchema,
  IncomeStatementParsedClaimSchema,
]);
export const ParsedClaimsV1Schema = z
  .tuple([
    LegalNameParsedClaimSchema,
    StudentIdParsedClaimSchema,
    InstitutionParsedClaimSchema,
    DependencyParsedClaimSchema,
    GuardianParsedClaimSchema,
    HouseholdSizeParsedClaimSchema,
    HouseholdIncomeParsedClaimSchema,
    IncomeStatementParsedClaimSchema,
  ])
  .refine(
    (claims) =>
      new Set(claims.map(({ claimHandle }) => claimHandle)).size === 8,
    { message: "Parsed claim handles must be unique." },
  )
  .refine(
    (claims) =>
      new Set(claims.map(({ fingerprint }) => fingerprint)).size === 8,
    { message: "Parsed claim fingerprints must be unique." },
  );

export const ParsedPacketV1Schema = z
  .object({
    schema: z.literal("citeapply-parsed-packet-v1"),
    packet: PacketCodeSchema,
    documents: ParsedDocumentsV1Schema,
    claims: ParsedClaimsV1Schema,
  })
  .strict()
  .superRefine(({ packet, documents, claims }, context) => {
    if (new Set(documents.map(({ documentHash }) => documentHash)).size !== 3) {
      context.addIssue({
        code: "custom",
        message: "Document hashes must be unique.",
      });
    }
    for (const [index, claim] of claims.entries()) {
      const document = documents.find(({ code }) => code === claim.document);
      if (
        document === undefined ||
        claim.documentHash !== document.documentHash ||
        claim.anchor.end > document.pageText.length
      ) {
        context.addIssue({
          code: "custom",
          message: "Parsed claim provenance must match its parsed document.",
          path: ["claims", index],
        });
      }
    }
    const householdIncome = claims[6].normalizedValue;
    const statementIncome = claims[7].normalizedValue;
    if (
      (packet === "supported" && householdIncome !== statementIncome) ||
      (packet === "conflict" && householdIncome === statementIncome)
    ) {
      context.addIssue({
        code: "custom",
        message: "Packet income relationship does not match its packet code.",
        path: ["claims"],
      });
    }
  });

export type ParsedDocument = z.infer<typeof ParsedDocumentSchema>;
export type ParsedClaim = z.infer<typeof ParsedClaimSchema>;
export type ParsedPacketV1 = z.infer<typeof ParsedPacketV1Schema>;

export const EvidenceBindingSchema = z
  .object({
    fingerprint: Sha256Schema,
    document: DocumentCodeSchema,
    page: z.literal(1),
  })
  .strict();

const CanonicalContentStringSchema = z
  .string()
  .min(1)
  .max(160)
  .refine((value) => value === value.normalize("NFC"));

function stringContentFieldSchema<
  const K extends "legal_name" | "student_id" | "institution" | "guardian_name",
>(field: K) {
  return z
    .object({
      field: z.literal(field),
      value: CanonicalContentStringSchema,
      evidence: z.tuple([Sha256Schema]),
    })
    .strict();
}

const LegalNameContentFieldSchema = stringContentFieldSchema("legal_name");
const StudentIdContentFieldSchema = stringContentFieldSchema("student_id");
const InstitutionContentFieldSchema = stringContentFieldSchema("institution");
const EmailContentFieldSchema = z
  .object({
    field: z.literal("preferred_contact_email"),
    value: SyntheticTestEmailSchema,
    declaration: z
      .object({
        email: SyntheticTestEmailSchema,
        declaredByApplicant: z.literal(true),
      })
      .strict(),
  })
  .strict()
  .refine(({ value, declaration }) => value === declaration.email, {
    message: "The email declaration must bind the exact saved email.",
  });
const DependencyContentFieldSchema = z
  .object({
    field: z.literal("dependency"),
    value: z.literal(true),
    evidence: z.tuple([Sha256Schema]),
  })
  .strict();
const GuardianContentFieldSchema = stringContentFieldSchema("guardian_name");
const HouseholdSizeContentFieldSchema = z
  .object({
    field: z.literal("household_size"),
    value: z.number().int().safe().min(1),
    evidence: z.tuple([Sha256Schema]),
  })
  .strict();
const SupportedIncomeContentFieldSchema = z
  .object({
    field: z.literal("annual_household_income"),
    value: z.number().int().safe().nonnegative(),
    evidence: z.tuple([Sha256Schema, Sha256Schema]),
    resolution: z.literal("source_supported"),
  })
  .strict()
  .refine(({ evidence }) => evidence[0] !== evidence[1], {
    message: "Income evidence fingerprints must be distinct.",
  });
const ResolvedIncomeContentFieldSchema = z
  .object({
    field: z.literal("annual_household_income"),
    value: z.number().int().safe().nonnegative(),
    evidence: z.tuple([Sha256Schema, Sha256Schema]),
    resolution: z
      .object({ chosenFingerprint: Sha256Schema, reason: ConflictReasonSchema })
      .strict(),
  })
  .strict()
  .refine(
    ({ evidence, resolution }) =>
      evidence[0] !== evidence[1] &&
      evidence.includes(resolution.chosenFingerprint),
    {
      message:
        "The chosen income fingerprint must identify one distinct source.",
    },
  );
const IncomeContentFieldSchema = z.union([
  SupportedIncomeContentFieldSchema,
  ResolvedIncomeContentFieldSchema,
]);

export const ApplicationContentFieldSchema = z.union([
  LegalNameContentFieldSchema,
  StudentIdContentFieldSchema,
  InstitutionContentFieldSchema,
  EmailContentFieldSchema,
  DependencyContentFieldSchema,
  GuardianContentFieldSchema,
  HouseholdSizeContentFieldSchema,
  IncomeContentFieldSchema,
]);

export const ApplicationContentFieldsV1Schema = z.tuple([
  LegalNameContentFieldSchema,
  StudentIdContentFieldSchema,
  InstitutionContentFieldSchema,
  EmailContentFieldSchema,
  DependencyContentFieldSchema,
  GuardianContentFieldSchema,
  HouseholdSizeContentFieldSchema,
  IncomeContentFieldSchema,
]);

export const ApplicationContentV1Schema = z
  .object({
    schema: z.literal("citeapply-application-content-v1"),
    activeFields: z.tuple([
      z.literal("legal_name"),
      z.literal("student_id"),
      z.literal("institution"),
      z.literal("preferred_contact_email"),
      z.literal("dependency"),
      z.literal("guardian_name"),
      z.literal("household_size"),
      z.literal("annual_household_income"),
    ]),
    fields: ApplicationContentFieldsV1Schema,
  })
  .strict()
  .refine(
    ({ fields }) => {
      const fingerprints = fields.flatMap((field) =>
        "evidence" in field ? [...field.evidence] : [],
      );
      return new Set(fingerprints).size === fingerprints.length;
    },
    { message: "Application content evidence fingerprints must be unique." },
  );

export type ApplicationContentField = z.infer<
  typeof ApplicationContentFieldSchema
>;
export type ApplicationContentV1 = z.infer<typeof ApplicationContentV1Schema>;

export const AuthorityMetaV1Schema = VersionsSchema.extend({
  pageEpoch: PageEpochSchema,
  projectionSequence: ProjectionSequenceSchema,
  expiresAt: Rfc3339InstantSchema,
  serverNow: Rfc3339InstantSchema,
}).strict();

export type AuthorityMetaV1 = z.infer<typeof AuthorityMetaV1Schema>;

export function successSchema<const T extends z.ZodType>(data: T) {
  return z.object({ ok: z.literal(true), data }).strict();
}

export type Success<T> = { ok: true; data: T };
