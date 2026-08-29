import type {
  DocumentClass,
  EvidenceField,
  ParsedClaim,
  ParsedPacketV1,
} from "../contracts/common.ts";
import { requirementForField } from "./fields.ts";

export type PolicyBinding = Readonly<
  Pick<ParsedClaim, "fingerprint" | "document" | "page">
>;

export type EvidencePolicyDecision =
  | Readonly<{
      outcome: "accepted";
      policy: "ordinary";
      value: Exclude<
        ParsedClaim,
        { kind: "annual_household_income" }
      >["normalizedValue"];
      bindings: readonly [PolicyBinding];
    }>
  | Readonly<{
      outcome: "accepted";
      policy: "source_supported";
      value: number;
      bindings: readonly [PolicyBinding, PolicyBinding];
    }>
  | Readonly<{ outcome: "evidence_unavailable" }>
  | Readonly<{ outcome: "conflict_requires_human" }>;

type IncomeClaim = Extract<ParsedClaim, { kind: "annual_household_income" }>;

const EVIDENCE_UNAVAILABLE = Object.freeze({
  outcome: "evidence_unavailable",
} as const);

const CONFLICT_REQUIRES_HUMAN = Object.freeze({
  outcome: "conflict_requires_human",
} as const);

function bindingFor(claim: ParsedClaim): PolicyBinding {
  return Object.freeze({
    fingerprint: claim.fingerprint,
    document: claim.document,
    page: claim.page,
  });
}

function documentClassIsAllowed(
  field: EvidenceField,
  documentClass: DocumentClass,
): boolean {
  return requirementForField(field).acceptedDocumentClasses.some(
    (acceptedClass) => acceptedClass === documentClass,
  );
}

function isIncomeClaim(claim: ParsedClaim): claim is IncomeClaim {
  return claim.kind === "annual_household_income";
}

export function evaluateEvidencePolicy(
  packet: Readonly<ParsedPacketV1>,
  field: EvidenceField,
  claimHandle: string,
): EvidencePolicyDecision {
  const matchingClaims = packet.claims.filter(
    (claim) => claim.claimHandle === claimHandle,
  );
  if (matchingClaims.length !== 1) return EVIDENCE_UNAVAILABLE;

  const requestedClaim = matchingClaims[0];
  if (
    requestedClaim === undefined ||
    requestedClaim.kind !== field ||
    !documentClassIsAllowed(field, requestedClaim.documentClass)
  ) {
    return EVIDENCE_UNAVAILABLE;
  }

  if (field !== "annual_household_income") {
    return Object.freeze({
      outcome: "accepted",
      policy: "ordinary",
      value: requestedClaim.normalizedValue,
      bindings: Object.freeze([bindingFor(requestedClaim)] as const),
    });
  }

  const incomeClaims = packet.claims.filter(isIncomeClaim);
  if (incomeClaims.length !== 2) return EVIDENCE_UNAVAILABLE;

  const statementClaim = incomeClaims.find(
    (claim) => claim.document === "income",
  );
  const householdClaim = incomeClaims.find(
    (claim) => claim.document === "household",
  );
  if (
    statementClaim === undefined ||
    householdClaim === undefined ||
    statementClaim.claimHandle === householdClaim.claimHandle ||
    statementClaim.fingerprint === householdClaim.fingerprint ||
    !documentClassIsAllowed(field, statementClaim.documentClass) ||
    !documentClassIsAllowed(field, householdClaim.documentClass)
  ) {
    return EVIDENCE_UNAVAILABLE;
  }

  const requestedIsCurrentIncomeSource =
    requestedClaim.claimHandle === statementClaim.claimHandle ||
    requestedClaim.claimHandle === householdClaim.claimHandle;
  if (!requestedIsCurrentIncomeSource) return EVIDENCE_UNAVAILABLE;

  if (statementClaim.normalizedValue !== householdClaim.normalizedValue) {
    return CONFLICT_REQUIRES_HUMAN;
  }

  if (requestedClaim.claimHandle !== statementClaim.claimHandle) {
    return EVIDENCE_UNAVAILABLE;
  }

  return Object.freeze({
    outcome: "accepted",
    policy: "source_supported",
    value: statementClaim.normalizedValue,
    bindings: Object.freeze([
      bindingFor(statementClaim),
      bindingFor(householdClaim),
    ] as const),
  });
}
