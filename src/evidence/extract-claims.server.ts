import { createHash, randomBytes } from "node:crypto";

import {
  ParsedClaimSchema,
  ParsedDocumentSchema,
  ParsedPacketV1Schema,
  type DocumentClass,
  type DocumentCode,
  type EvidenceField,
  type PacketCode,
  type ParsedClaim,
  type ParsedDocument,
  type ParsedPacketV1,
} from "../contracts/common.ts";
import {
  findUniqueLabelledValue,
  sliceCharacterRange,
  type CharacterRange,
} from "./anchors.ts";
import {
  parseRegisteredPdf,
  PdfAdapterError,
  type ParsedRegisteredPdf,
} from "./pdf-adapter.server.ts";
import {
  getRegisteredPacketDocuments,
  type RegisteredDocumentClass,
  type RegisteredPacketDocument,
} from "./packet-registry.server.ts";

const SYNTHETIC_MARKER = "SYNTHETIC — NOT VALID";
const SYNTHETIC_CONTEXT = "Horizon Education Aid — fictional demonstration only";
const SYNTHETIC_DISCLAIMER =
  "Fictional demo. Do not use as an identity, enrollment, or financial record.";
const MAX_STRING_VALUE_CHARACTERS = 160;
const MAX_HANDLE_ATTEMPTS = 8;

const DOCUMENT_SPECS = Object.freeze({
  synthetic_enrollment_record: Object.freeze({
    code: "enrollment",
    title: "Synthetic Enrollment Record",
    claimCount: 3,
  }),
  synthetic_household_statement: Object.freeze({
    code: "household",
    title: "Synthetic Household Statement",
    claimCount: 4,
  }),
  synthetic_income_statement: Object.freeze({
    code: "income",
    title: "Synthetic Income Statement",
    claimCount: 1,
  }),
} as const satisfies Record<
  RegisteredDocumentClass,
  Readonly<{ code: DocumentCode; title: string; claimCount: number }>
>);

export const PACKET_EXTRACTION_ERROR_CODES = [
  "invalid_packet",
  "document_unavailable",
  "invalid_document_structure",
  "invalid_claim_value",
  "invalid_claim_shape",
  "invalid_packet_shape",
  "invalid_income_relationship",
] as const;

export type PacketExtractionErrorCode =
  (typeof PACKET_EXTRACTION_ERROR_CODES)[number];

export class PacketExtractionError extends Error {
  readonly code: PacketExtractionErrorCode;
  readonly documentClass?: DocumentClass;

  constructor(code: PacketExtractionErrorCode, documentClass?: DocumentClass) {
    super("The selected synthetic packet could not be parsed.");
    this.name = "PacketExtractionError";
    this.code = code;
    if (documentClass !== undefined) {
      this.documentClass = documentClass;
    }
  }
}

type ExtractedDocument = Readonly<{
  parsed: ParsedRegisteredPdf;
  document: ParsedDocument;
  registration: RegisteredPacketDocument;
}>;

type AnchoredValue = Readonly<{
  value: string;
  range: CharacterRange;
}>;

function extractionFailure(
  code: PacketExtractionErrorCode,
  documentClass?: DocumentClass,
): never {
  throw new PacketExtractionError(code, documentClass);
}

function documentSpec(documentClass: RegisteredDocumentClass) {
  return DOCUMENT_SPECS[documentClass];
}

function validateSyntheticStructure(
  parsed: ParsedRegisteredPdf,
  expectedClaimLines: number,
  title: string,
): void {
  const lines = parsed.pageText.split("\n");
  if (
    lines.length !== expectedClaimLines + 4 ||
    lines[0] !== SYNTHETIC_MARKER ||
    lines[1] !== title ||
    lines[2] !== SYNTHETIC_CONTEXT ||
    lines.at(-1) !== SYNTHETIC_DISCLAIMER
  ) {
    extractionFailure("invalid_document_structure", parsed.documentClass);
  }
}

function readAnchoredValue(
  document: ExtractedDocument,
  label: string,
): AnchoredValue {
  try {
    const anchor = findUniqueLabelledValue(document.parsed.pageText, label);
    if (sliceCharacterRange(document.parsed.pageText, anchor.range) !== anchor.value) {
      extractionFailure("invalid_document_structure", document.parsed.documentClass);
    }
    return Object.freeze({ value: anchor.value, range: anchor.range });
  } catch (error) {
    if (error instanceof PacketExtractionError) {
      throw error;
    }
    return extractionFailure(
      "invalid_document_structure",
      document.parsed.documentClass,
    );
  }
}

function parseApplicantString(
  anchored: AnchoredValue,
  grammar: RegExp,
  documentClass: DocumentClass,
): string {
  const value = anchored.value.normalize("NFC");
  if (
    value.length < 1 ||
    value.length > MAX_STRING_VALUE_CHARACTERS ||
    !grammar.test(value)
  ) {
    extractionFailure("invalid_claim_value", documentClass);
  }
  return value;
}

function parseBinaryChoice(
  anchored: AnchoredValue,
  documentClass: DocumentClass,
): boolean {
  const token = anchored.value.normalize("NFC").toLocaleLowerCase("en-US");
  if (/^(?:yes|true)$/u.test(token)) {
    return Boolean(1);
  }
  if (/^(?:no|false)$/u.test(token)) {
    return Boolean(0);
  }
  return extractionFailure("invalid_claim_value", documentClass);
}

function parsePositiveInteger(
  anchored: AnchoredValue,
  maximum: number,
  documentClass: DocumentClass,
): number {
  if (!/^[1-9][0-9]*$/u.test(anchored.value)) {
    extractionFailure("invalid_claim_value", documentClass);
  }
  const value = Number(anchored.value);
  if (!Number.isSafeInteger(value) || value > maximum) {
    extractionFailure("invalid_claim_value", documentClass);
  }
  return value;
}

function parseInrAmount(
  anchored: AnchoredValue,
  documentClass: DocumentClass,
): number {
  const match = /^INR ([1-9][0-9]{0,2}(?:,[0-9]{3})*)$/u.exec(anchored.value);
  if (match === null) {
    extractionFailure("invalid_claim_value", documentClass);
  }
  const digits = match[1]!.replaceAll(",", "");
  const value = Number(digits);
  if (!Number.isSafeInteger(value) || value < 1 || value > 10_000_000_000) {
    extractionFailure("invalid_claim_value", documentClass);
  }
  return value;
}

function fingerprint(
  documentHash: string,
  kind: EvidenceField,
  range: CharacterRange,
  normalizedValue: string | number | boolean,
): string {
  const canonicalBytes = JSON.stringify([
    documentHash,
    kind,
    1,
    [range.start, range.end],
    normalizedValue,
  ]);
  return createHash("sha256").update(canonicalBytes, "utf8").digest("hex");
}

function freshClaimHandle(allocatedHandles: Set<string>): string {
  for (let attempt = 0; attempt < MAX_HANDLE_ATTEMPTS; attempt += 1) {
    const handle = randomBytes(16).toString("base64url");
    if (!allocatedHandles.has(handle)) {
      allocatedHandles.add(handle);
      return handle;
    }
  }
  return extractionFailure("invalid_packet_shape");
}

function createClaim(
  document: ExtractedDocument,
  kind: EvidenceField,
  anchored: AnchoredValue,
  normalizedValue: string | number | boolean,
  allocatedHandles: Set<string>,
): ParsedClaim {
  const spec = documentSpec(document.registration.documentClass);
  const candidate: unknown = {
    claimHandle: freshClaimHandle(allocatedHandles),
    fingerprint: fingerprint(
      document.parsed.documentHash,
      kind,
      anchored.range,
      normalizedValue,
    ),
    document: spec.code,
    title: spec.title,
    documentClass: document.parsed.documentClass,
    documentHash: document.parsed.documentHash,
    page: 1,
    anchor: anchored.range,
    kind,
    normalizedValue,
  };
  const result = ParsedClaimSchema.safeParse(candidate);
  if (!result.success) {
    extractionFailure("invalid_claim_shape", document.parsed.documentClass);
  }
  return result.data;
}

function extractEnrollmentClaims(
  document: ExtractedDocument,
  handles: Set<string>,
): readonly ParsedClaim[] {
  const legalName = readAnchoredValue(document, "Legal name");
  const studentId = readAnchoredValue(document, "Student ID");
  const institution = readAnchoredValue(document, "Institution");
  return Object.freeze([
    createClaim(
      document,
      "legal_name",
      legalName,
      parseApplicantString(
        legalName,
        /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,159}$/u,
        document.parsed.documentClass,
      ),
      handles,
    ),
    createClaim(
      document,
      "student_id",
      studentId,
      parseApplicantString(
        studentId,
        /^[A-Z0-9][A-Z0-9-]{0,39}$/u,
        document.parsed.documentClass,
      ),
      handles,
    ),
    createClaim(
      document,
      "institution",
      institution,
      parseApplicantString(
        institution,
        /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .,'&()/-]{0,159}$/u,
        document.parsed.documentClass,
      ),
      handles,
    ),
  ]);
}

function extractHouseholdClaims(
  document: ExtractedDocument,
  handles: Set<string>,
): readonly ParsedClaim[] {
  const dependency = readAnchoredValue(document, "Dependent on guardian");
  const guardianName = readAnchoredValue(document, "Guardian name");
  const householdSize = readAnchoredValue(document, "Household size");
  const income = readAnchoredValue(document, "Annual household income");
  return Object.freeze([
    createClaim(
      document,
      "dependency",
      dependency,
      parseBinaryChoice(dependency, document.parsed.documentClass),
      handles,
    ),
    createClaim(
      document,
      "guardian_name",
      guardianName,
      parseApplicantString(
        guardianName,
        /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,159}$/u,
        document.parsed.documentClass,
      ),
      handles,
    ),
    createClaim(
      document,
      "household_size",
      householdSize,
      parsePositiveInteger(householdSize, 20, document.parsed.documentClass),
      handles,
    ),
    createClaim(
      document,
      "annual_household_income",
      income,
      parseInrAmount(income, document.parsed.documentClass),
      handles,
    ),
  ]);
}

function extractIncomeClaims(
  document: ExtractedDocument,
  handles: Set<string>,
): readonly ParsedClaim[] {
  const income = readAnchoredValue(document, "Annual household income");
  return Object.freeze([
    createClaim(
      document,
      "annual_household_income",
      income,
      parseInrAmount(income, document.parsed.documentClass),
      handles,
    ),
  ]);
}

function extractDocumentClaims(
  document: ExtractedDocument,
  handles: Set<string>,
): readonly ParsedClaim[] {
  switch (document.registration.documentClass) {
    case "synthetic_enrollment_record":
      return extractEnrollmentClaims(document, handles);
    case "synthetic_household_statement":
      return extractHouseholdClaims(document, handles);
    case "synthetic_income_statement":
      return extractIncomeClaims(document, handles);
  }
}

async function parseDocument(
  registration: RegisteredPacketDocument,
): Promise<ExtractedDocument> {
  let parsed: ParsedRegisteredPdf;
  try {
    parsed = await parseRegisteredPdf(registration);
  } catch (error) {
    if (error instanceof PdfAdapterError) {
      return extractionFailure("document_unavailable", error.documentClass);
    }
    return extractionFailure("document_unavailable", registration.documentClass);
  }

  const spec = documentSpec(registration.documentClass);
  validateSyntheticStructure(parsed, spec.claimCount, spec.title);
  const candidate: unknown = {
    code: spec.code,
    title: spec.title,
    documentClass: parsed.documentClass,
    documentHash: parsed.documentHash,
    page: 1,
    pageText: parsed.pageText,
  };
  const result = ParsedDocumentSchema.safeParse(candidate);
  if (!result.success) {
    return extractionFailure("invalid_document_structure", parsed.documentClass);
  }
  return Object.freeze({ parsed, document: result.data, registration });
}

function validateIncomeRelationship(packet: PacketCode, claims: readonly ParsedClaim[]): void {
  const incomeValues: number[] = [];
  for (const claim of claims) {
    if (claim.kind === "annual_household_income") {
      incomeValues.push(claim.normalizedValue);
    }
  }
  if (incomeValues.length !== 2) {
    extractionFailure("invalid_packet_shape");
  }
  const valuesMatch = incomeValues[0] === incomeValues[1];
  if (
    (packet === "supported" && !valuesMatch) ||
    (packet === "conflict" && valuesMatch)
  ) {
    extractionFailure("invalid_income_relationship");
  }
}

export async function parseRegisteredPacket(packet: PacketCode): Promise<ParsedPacketV1> {
  if (packet !== "supported" && packet !== "conflict") {
    extractionFailure("invalid_packet");
  }
  const registrations = getRegisteredPacketDocuments(packet);
  const documentClasses = new Set(
    registrations.map((registration) => registration.documentClass),
  );
  if (registrations.length !== 3 || documentClasses.size !== 3) {
    extractionFailure("invalid_packet_shape");
  }

  const extractedDocuments: ExtractedDocument[] = [];
  for (const registration of registrations) {
    extractedDocuments.push(await parseDocument(registration));
  }

  const handles = new Set<string>();
  const claims = extractedDocuments.flatMap((document) =>
    extractDocumentClaims(document, handles),
  );
  if (claims.length !== 8 || handles.size !== 8) {
    extractionFailure("invalid_packet_shape");
  }
  validateIncomeRelationship(packet, claims);

  const candidate: unknown = {
    schema: "citeapply-parsed-packet-v1",
    packet,
    documents: extractedDocuments.map(({ document }) => document),
    claims,
  };
  const result = ParsedPacketV1Schema.safeParse(candidate);
  if (!result.success) {
    extractionFailure("invalid_packet_shape");
  }
  return result.data;
}
