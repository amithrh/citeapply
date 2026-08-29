import { randomUUID } from "node:crypto";

import type {
  ParsedClaim,
  ParsedPacketV1,
  Versions,
} from "../contracts/common.ts";
import {
  HumanActivitySummaryV1Schema,
  HumanReviewV1Schema,
  type HumanReviewV1,
} from "../contracts/http.ts";
import { canonicalizeDraft, contentHash } from "./canonicalize.ts";
import type { DraftAggregateV1 } from "./draft.ts";
import { evaluateDraftReadiness } from "./readiness.ts";

const SHORT_ID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** A short, human-readable handle for the frozen Review. */
export function shortIdFromUuid(reviewId: string): string {
  const hex = reviewId.replaceAll("-", "");
  let shortId = "";
  for (let index = 0; index < 10; index += 1) {
    const byte = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
    shortId += SHORT_ID_ALPHABET[byte % SHORT_ID_ALPHABET.length];
  }
  return shortId;
}

function claimByHandle(packet: ParsedPacketV1, handle: string): ParsedClaim {
  const claim = packet.claims.find(
    (candidate) => candidate.claimHandle === handle,
  );
  if (claim === undefined) {
    throw new TypeError("A Review binding does not identify a current claim.");
  }
  return claim;
}

function claimByFingerprint(
  packet: ParsedPacketV1,
  fingerprint: string,
): ParsedClaim {
  const claim = packet.claims.find(
    (candidate) => candidate.fingerprint === fingerprint,
  );
  if (claim === undefined) {
    throw new TypeError("A Review binding does not identify a current claim.");
  }
  return claim;
}

function excerptFor(packet: ParsedPacketV1, claim: ParsedClaim): unknown {
  const document = packet.documents.find(({ code }) => code === claim.document);
  if (document === undefined) {
    throw new TypeError("A Review claim has no current source document.");
  }
  return {
    claimHandle: claim.claimHandle,
    title: claim.title,
    kind: claim.kind,
    page: 1,
    excerpt: document.pageText.slice(claim.anchor.start, claim.anchor.end),
    normalizedValue: claim.normalizedValue,
  };
}

function humanBinding(claim: ParsedClaim) {
  return { claimHandle: claim.claimHandle, document: claim.document, page: 1 };
}

type DraftField = DraftAggregateV1["fields"][number];

function finalField(field: DraftField, packet: ParsedPacketV1): unknown {
  if (field.status !== "ready") {
    throw new TypeError("Only a ready Draft can be frozen into a Review.");
  }

  if (field.field === "preferred_contact_email") {
    return {
      field: field.field,
      active: true,
      status: "ready",
      value: field.value,
      origin: field.origin,
      declaredByApplicant: true,
    };
  }

  if (field.field === "annual_household_income") {
    if (field.resolution === "source_supported") {
      return {
        field: field.field,
        active: true,
        status: "ready",
        value: field.value,
        origin: field.origin,
        resolution: "source_supported",
        bindings: [
          humanBinding(
            claimByFingerprint(packet, field.bindings[0].fingerprint),
          ),
          humanBinding(
            claimByFingerprint(packet, field.bindings[1].fingerprint),
          ),
        ],
      };
    }
    return {
      field: field.field,
      active: true,
      status: "ready",
      value: field.value,
      origin: "manual",
      resolution: {
        chosen: humanBinding(
          claimByFingerprint(packet, field.resolution.chosenFingerprint),
        ),
        reason: field.resolution.reason,
      },
    };
  }

  return {
    field: field.field,
    active: true,
    status: "ready",
    value: field.value,
    origin: field.origin,
    bindings: [
      humanBinding(claimByFingerprint(packet, field.bindings[0].fingerprint)),
    ],
  };
}

function excerptsFor(field: DraftField, packet: ParsedPacketV1): unknown[] {
  if (field.status !== "ready") return [];
  if (field.field === "preferred_contact_email") return [];
  if (field.field === "annual_household_income") {
    // Both accepted income sources are shown, in Income then Household order,
    // so the applicant reviews the disagreement rather than only the winner.
    const statement = packet.claims[7];
    const household = packet.claims[6];
    return [excerptFor(packet, statement), excerptFor(packet, household)];
  }
  return [
    excerptFor(
      packet,
      claimByFingerprint(packet, field.bindings[0].fingerprint),
    ),
  ];
}

export type PrepareReviewResult =
  | Readonly<{ kind: "ready"; review: HumanReviewV1; contentHash: string }>
  | Readonly<{
      kind: "not_ready";
      blockers: ReturnType<typeof evaluateDraftReadiness>["blockers"];
    }>;

/**
 * Freezes an exactly ready Draft into an immutable Review. The Review is built
 * from saved state only; nothing an agent supplied at request time reaches it.
 */
export function prepareReview(
  draft: DraftAggregateV1,
  packet: ParsedPacketV1,
  sourceVersions: Versions,
  activity: unknown,
  reviewId: string = randomUUID(),
): PrepareReviewResult {
  const readiness = evaluateDraftReadiness(draft);
  if (readiness.blockers.length > 0 || readiness.progress.total !== 8) {
    return { kind: "not_ready", blockers: readiness.blockers };
  }

  const content = canonicalizeDraft(draft);
  const hash = contentHash(content);
  const income = draft.fields[7];
  const resolvedByApplicant =
    income.status === "ready" &&
    income.field === "annual_household_income" &&
    income.resolution !== "source_supported";

  const review = HumanReviewV1Schema.parse({
    reviewId,
    shortId: shortIdFromUuid(reviewId),
    sourceVersions,
    contentHash: hash,
    content,
    diffs: draft.fields.map((field) => ({
      field: field.field,
      initial: null,
      final: finalField(field, packet),
      excerpts: excerptsFor(field, packet),
    })),
    warnings: resolvedByApplicant
      ? [
          {
            code: "conflicting_income_resolved",
            message:
              "Income evidence differed and was resolved by the applicant.",
          },
        ]
      : [],
    activity: HumanActivitySummaryV1Schema.parse(activity),
  });

  return { kind: "ready", review, contentHash: hash };
}

export { claimByHandle };
