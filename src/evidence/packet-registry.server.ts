const PDF_LIMITS = Object.freeze({
  maxBytes: 65_536,
  exactPages: 1,
  maxTextCharacters: 4_096,
});

export type RegisteredPacketCode = "supported" | "conflict";

export type RegisteredDocumentClass =
  | "synthetic_enrollment_record"
  | "synthetic_household_statement"
  | "synthetic_income_statement";

export type RegisteredPacketDocument = Readonly<{
  packetCode: RegisteredPacketCode;
  filePath: string;
  documentClass: RegisteredDocumentClass;
  expectedSha256: string;
  limits: Readonly<{
    maxBytes: number;
    exactPages: number;
    maxTextCharacters: number;
  }>;
}>;

export const REGISTERED_PACKET_DOCUMENTS = Object.freeze([
  Object.freeze({
    packetCode: "supported",
    filePath: "fixtures/packets/supported/enrollment.pdf",
    documentClass: "synthetic_enrollment_record",
    expectedSha256: "0a7d7c2621d5f7d372c0116991e9445052dcca4a6227253e238886d2203a2773",
    limits: PDF_LIMITS,
  }),
  Object.freeze({
    packetCode: "supported",
    filePath: "fixtures/packets/supported/household.pdf",
    documentClass: "synthetic_household_statement",
    expectedSha256: "b0a0832235875dd41cbaa37129d2bd2e4eb69daefcf25370b4cd7c4bea1365cc",
    limits: PDF_LIMITS,
  }),
  Object.freeze({
    packetCode: "supported",
    filePath: "fixtures/packets/supported/income.pdf",
    documentClass: "synthetic_income_statement",
    expectedSha256: "ade7f91327947b7faa84e475f57f9c10384c7c46d4dca0204a40b96f6996541c",
    limits: PDF_LIMITS,
  }),
  Object.freeze({
    packetCode: "conflict",
    filePath: "fixtures/packets/conflict/enrollment.pdf",
    documentClass: "synthetic_enrollment_record",
    expectedSha256: "0a7d7c2621d5f7d372c0116991e9445052dcca4a6227253e238886d2203a2773",
    limits: PDF_LIMITS,
  }),
  Object.freeze({
    packetCode: "conflict",
    filePath: "fixtures/packets/conflict/household.pdf",
    documentClass: "synthetic_household_statement",
    expectedSha256: "b0a0832235875dd41cbaa37129d2bd2e4eb69daefcf25370b4cd7c4bea1365cc",
    limits: PDF_LIMITS,
  }),
  Object.freeze({
    packetCode: "conflict",
    filePath: "fixtures/packets/conflict/income.pdf",
    documentClass: "synthetic_income_statement",
    expectedSha256: "29a8d9c1078512ec67229ee43e0d5a653e304cd43b6957f228b4f9e49a5dc9c7",
    limits: PDF_LIMITS,
  }),
] as const satisfies readonly RegisteredPacketDocument[]);

export function getRegisteredPacketDocuments(
  packetCode: RegisteredPacketCode,
): readonly RegisteredPacketDocument[] {
  const documents = REGISTERED_PACKET_DOCUMENTS.filter(
    (document) => document.packetCode === packetCode,
  );
  if (documents.length !== 3) {
    throw new Error("Registered packet must contain exactly three documents.");
  }
  return Object.freeze(documents);
}
