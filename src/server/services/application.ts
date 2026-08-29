import type { PoolClient } from "pg";

import {
  ParsedPacketV1Schema,
  type AuthorityMetaV1,
  type ParsedClaim,
  type ParsedPacketV1,
} from "../../contracts/common.ts";
import {
  HumanActivitySummaryV1Schema,
  HumanDraftV1Schema,
  HumanEvidenceExcerptV1Schema,
  HumanSnapshotV1Schema,
  TakeoverSnapshotV1Schema,
  type HumanDraftV1,
  type HumanEvidenceExcerptV1,
  type HumanSnapshotV1,
  type TakeoverSnapshotV1,
} from "../../contracts/http.ts";

type HumanActivitySummaryV1 = ReturnType<
  typeof HumanActivitySummaryV1Schema.parse
>;

export type { HumanActivitySummaryV1 };
import {
  parseDraftAggregateForPacket,
  type DraftAggregateV1,
} from "../../domain/draft.ts";
import { evaluateDraftReadiness } from "../../domain/readiness.ts";
import type { StoredApplication } from "../db/applications.ts";
import {
  derivePageCapability,
  type SessionClock,
} from "../security/capabilities.ts";
import type { Keyring } from "../security/keys.ts";

export const EMPTY_ACTIVITY: HumanActivitySummaryV1 =
  HumanActivitySummaryV1Schema.parse({
    totals: {
      allowed: 0,
      revoked: 0,
      acceptedBatches: 0,
      refusals: 0,
      assistedReviewsPrepared: 0,
    },
    latest: [],
  });

const MAX_PROJECTION_SEQUENCE = 128;

export function parsedPacketOf(application: StoredApplication): ParsedPacketV1 {
  return ParsedPacketV1Schema.parse(application.parsedPacket);
}

export function draftOf(
  application: StoredApplication,
  packet: ParsedPacketV1,
): DraftAggregateV1 {
  return parseDraftAggregateForPacket(application.draft, packet);
}

/**
 * The projection sequence must dominate the number of committed revision
 * effects. The saved revision always does, and the contract bounds it.
 */
function projectionSequence(application: StoredApplication): number {
  return Math.min(application.revision, MAX_PROJECTION_SEQUENCE);
}

export function authorityMeta(
  application: StoredApplication,
  clock: SessionClock,
): AuthorityMetaV1 {
  return {
    applicationRevision: application.revision,
    requirementsVersion: application.requirementsVersion,
    pageEpoch: application.pageEpoch,
    projectionSequence: projectionSequence(application),
    expiresAt: clock.expiresAt,
    serverNow: clock.serverNow,
  };
}

function claimByFingerprint(
  packet: ParsedPacketV1,
  fingerprint: string,
): ParsedClaim {
  const claim = packet.claims.find(
    (candidate) => candidate.fingerprint === fingerprint,
  );
  if (claim === undefined) {
    throw new Error("A saved binding does not identify a current claim.");
  }
  return claim;
}

function humanBinding(packet: ParsedPacketV1, fingerprint: string) {
  const claim = claimByFingerprint(packet, fingerprint);
  return { claimHandle: claim.claimHandle, document: claim.document, page: 1 };
}

type DraftField = DraftAggregateV1["fields"][number];

function projectHumanField(
  saved: DraftField,
  packet: ParsedPacketV1,
  dependencySaved: boolean,
): unknown {
  const conditional =
    saved.field === "guardian_name" || saved.field === "household_size";
  if (conditional && !dependencySaved) {
    return { field: saved.field, active: false, status: "not_required" };
  }

  if (saved.status === "missing") {
    return { field: saved.field, active: true, status: "missing" };
  }

  if (saved.field === "preferred_contact_email") {
    if (saved.status === "needs_declaration") {
      return {
        field: saved.field,
        active: true,
        status: "needs_declaration",
        value: saved.value,
        origin: saved.origin,
      };
    }
    return {
      field: saved.field,
      active: true,
      status: "ready",
      value: saved.value,
      origin: saved.origin,
      declaredByApplicant: true,
    };
  }

  if (saved.field === "annual_household_income") {
    if (saved.status === "conflict") {
      return {
        field: saved.field,
        active: true,
        status: "conflict",
        claims: [packet.claims[6].claimHandle, packet.claims[7].claimHandle],
      };
    }
    if (saved.resolution === "source_supported") {
      return {
        field: saved.field,
        active: true,
        status: "ready",
        value: saved.value,
        origin: saved.origin,
        resolution: "source_supported",
        bindings: [
          humanBinding(packet, saved.bindings[0].fingerprint),
          humanBinding(packet, saved.bindings[1].fingerprint),
        ],
      };
    }
    return {
      field: saved.field,
      active: true,
      status: "ready",
      value: saved.value,
      origin: "manual",
      resolution: {
        chosen: humanBinding(packet, saved.resolution.chosenFingerprint),
        reason: saved.resolution.reason,
      },
    };
  }

  return {
    field: saved.field,
    active: true,
    status: "ready",
    value: saved.value,
    origin: saved.origin,
    bindings: [humanBinding(packet, saved.bindings[0].fingerprint)],
  };
}

export function projectHumanDraft(
  application: StoredApplication,
  packet: ParsedPacketV1,
  draft: DraftAggregateV1,
  activity: HumanActivitySummaryV1 = EMPTY_ACTIVITY,
): HumanDraftV1 {
  const dependencySaved = draft.fields[4].status === "ready";
  const readiness = evaluateDraftReadiness(draft);

  return HumanDraftV1Schema.parse({
    packet: packet.packet,
    assistance: application.consentRequestId === null ? "off" : "allowed",
    progress: readiness.progress,
    blockers: readiness.blockers,
    fields: draft.fields.map((saved) =>
      projectHumanField(saved, packet, dependencySaved),
    ),
    documents: packet.documents.map(({ code, title, documentClass }) => ({
      code,
      title,
      documentClass,
    })),
    claims: packet.claims.map(
      ({ claimHandle, document, kind, page, normalizedValue }) => ({
        claimHandle,
        document,
        kind,
        page,
        normalizedValue,
      }),
    ),
    activity,
  });
}

export function projectHumanSnapshot(
  application: StoredApplication,
  clock: SessionClock,
  activity: HumanActivitySummaryV1 = EMPTY_ACTIVITY,
  reviewSnapshot: unknown = null,
): HumanSnapshotV1 {
  const meta = authorityMeta(application, clock);
  if (application.stage === "draft") {
    const packet = parsedPacketOf(application);
    return HumanSnapshotV1Schema.parse({
      ...meta,
      stage: "draft",
      view: projectHumanDraft(
        application,
        packet,
        draftOf(application, packet),
        activity,
      ),
    });
  }
  if (application.stage === "submitted") {
    return HumanSnapshotV1Schema.parse({
      ...meta,
      stage: "submitted",
      submittedAt: application.updatedAt.toISOString(),
      receiptState: "load_required",
    });
  }
  if (reviewSnapshot === null) {
    throw new Error("A Review stage projection requires its frozen Review.");
  }
  return HumanSnapshotV1Schema.parse({
    ...meta,
    stage: "review",
    review: reviewSnapshot,
  });
}

/**
 * A takeover always lands with assistance off: a new page never inherits the
 * previous page's consent.
 */
export function projectTakeoverSnapshot(
  application: StoredApplication,
  clock: SessionClock,
  activity: HumanActivitySummaryV1 = EMPTY_ACTIVITY,
  reviewSnapshot: unknown = null,
): TakeoverSnapshotV1 {
  const meta = authorityMeta(application, clock);
  if (application.stage !== "draft") {
    return TakeoverSnapshotV1Schema.parse(
      projectHumanSnapshot(application, clock, activity, reviewSnapshot),
    );
  }
  const packet = parsedPacketOf(application);
  return TakeoverSnapshotV1Schema.parse({
    ...meta,
    stage: "draft",
    view: {
      ...projectHumanDraft(
        application,
        packet,
        draftOf(application, packet),
        activity,
      ),
      assistance: "off",
    },
  });
}

export function projectEvidenceExcerpt(
  packet: ParsedPacketV1,
  claimHandle: string,
): HumanEvidenceExcerptV1 | null {
  const claim = packet.claims.find(
    (candidate) => candidate.claimHandle === claimHandle,
  );
  if (claim === undefined) return null;
  const document = packet.documents.find(({ code }) => code === claim.document);
  if (document === undefined) return null;

  return HumanEvidenceExcerptV1Schema.parse({
    claimHandle: claim.claimHandle,
    title: claim.title,
    kind: claim.kind,
    page: 1,
    excerpt: document.pageText.slice(claim.anchor.start, claim.anchor.end),
    normalizedValue: claim.normalizedValue,
  });
}

export function currentPageCapability(
  keyring: Keyring,
  application: StoredApplication,
): string {
  return derivePageCapability(keyring, application);
}

export async function lockCurrentApplication(
  client: PoolClient,
  sessionDigest: Uint8Array,
): Promise<StoredApplication | null> {
  const { lockApplicationBySessionDigest } =
    await import("../db/applications.ts");
  return lockApplicationBySessionDigest(client, sessionDigest);
}
