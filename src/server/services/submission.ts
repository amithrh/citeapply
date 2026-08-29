import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import {
  ReceiptRecordV1Schema,
  type HumanAction,
  type SubmitIntentV1,
} from "../../contracts/http.ts";
import { prepareReview } from "../../domain/review.ts";
import { evaluateDraftReadiness } from "../../domain/readiness.ts";
import {
  classifyOperationReplay,
  insertOperation,
  type StoredOperation,
} from "../db/operations.ts";
import { operationIntentDigest, type Keyring } from "../security/keys.ts";
import {
  saveLockedApplicationState,
  type StoredApplication,
} from "../db/applications.ts";
import {
  findCurrentReview,
  insertReview,
  invalidateCurrentReview,
  type StoredReview,
} from "../db/reviews.ts";
import { findSubmission, insertSubmission } from "../db/submissions.ts";
import { listOperations } from "../db/operations.ts";
import { draftOf, parsedPacketOf, projectActivity } from "./application.ts";

export type PrepareOutcome =
  | Readonly<{
      kind: "prepared";
      application: StoredApplication;
      review: StoredReview;
    }>
  | Readonly<{ kind: "not_ready"; blockers: readonly unknown[] }>
  | Readonly<{ kind: "stale_state" }>;

/**
 * Freezes the current Draft into an immutable Review and moves the application
 * to the Review stage. Assisted access is closed by the same effect: the
 * applicant reviews and submits without an agent holding access.
 */
export async function prepareApplicationReview(
  client: PoolClient,
  application: StoredApplication,
  reviewId: string = randomUUID(),
): Promise<PrepareOutcome> {
  if (application.stage !== "draft") {
    return { kind: "stale_state" };
  }

  const packet = parsedPacketOf(application);
  const draft = draftOf(application, packet);
  const frozen = prepareReview(
    draft,
    packet,
    {
      applicationRevision: application.revision,
      requirementsVersion: application.requirementsVersion,
    },
    projectActivity(await listOperations(client, application.id)),
    reviewId,
  );
  if (frozen.kind !== "ready") {
    return { kind: "not_ready", blockers: frozen.blockers };
  }

  const review = await insertReview(client, {
    id: frozen.review.reviewId,
    shortId: frozen.review.shortId,
    applicationId: application.id,
    sourceApplicationRevision: application.revision,
    sourceRequirementsVersion: application.requirementsVersion,
    contentHash: Buffer.from(frozen.contentHash, "hex"),
    reviewSnapshot: frozen.review,
  });

  const next = await saveLockedApplicationState(client, {
    id: application.id,
    draft: application.draft,
    stage: "review",
    revision: application.revision + 1,
    requirementsVersion: application.requirementsVersion,
    pageEpoch: application.pageEpoch,
    pageBootstrapRequestId: application.pageBootstrapRequestId,
    pageBootstrapRequestDigest: application.pageBootstrapRequestDigest,
    consentRequestId: null,
    currentReviewId: review.id,
  });

  return { kind: "prepared", application: next, review };
}

export type ReturnOutcome =
  | Readonly<{
      kind: "returned";
      application: StoredApplication;
      invalidatedReviewId: string;
    }>
  | Readonly<{ kind: "stale_state" }>;

/** Return is the only action that invalidates a Review. */
export async function returnApplicationToDraft(
  client: PoolClient,
  application: StoredApplication,
): Promise<ReturnOutcome> {
  if (application.stage !== "review") {
    return { kind: "stale_state" };
  }
  const invalidatedReviewId = await invalidateCurrentReview(
    client,
    application.id,
  );
  if (invalidatedReviewId === null) {
    return { kind: "stale_state" };
  }

  const next = await saveLockedApplicationState(client, {
    id: application.id,
    draft: application.draft,
    stage: "draft",
    revision: application.revision + 1,
    requirementsVersion: application.requirementsVersion,
    pageEpoch: application.pageEpoch,
    pageBootstrapRequestId: application.pageBootstrapRequestId,
    pageBootstrapRequestDigest: application.pageBootstrapRequestDigest,
    consentRequestId: null,
    currentReviewId: null,
  });

  return { kind: "returned", application: next, invalidatedReviewId };
}

export type SubmitOutcome =
  | Readonly<{
      kind: "submitted";
      application: StoredApplication;
      receipt: unknown;
      submittedAt: string;
    }>
  | Readonly<{ kind: "review_invalidated" }>
  | Readonly<{ kind: "stale_state" }>;

/**
 * Accepts the exact Review the applicant confirmed. The supplied review
 * identity, source revision, and content hash must all still match, so a
 * changed application can never be submitted under an old confirmation.
 */
export async function submitApplication(
  client: PoolClient,
  application: StoredApplication,
  intent: SubmitIntentV1,
): Promise<SubmitOutcome> {
  const existing = await findSubmission(client, application.id);
  if (existing !== null) {
    // An exact replay returns the stored delivery; anything else is stale.
    return existing.reviewId === intent.reviewId
      ? {
          kind: "submitted",
          application,
          receipt: existing.receiptRecord,
          submittedAt: existing.submittedAt.toISOString(),
        }
      : { kind: "stale_state" };
  }

  if (application.stage !== "review") {
    return { kind: "stale_state" };
  }

  const review = await findCurrentReview(client, application.id);
  if (
    review === null ||
    review.id !== intent.reviewId ||
    review.invalidatedAt !== null ||
    application.currentReviewId !== review.id
  ) {
    return { kind: "review_invalidated" };
  }
  if (
    review.sourceApplicationRevision !== intent.reviewSourceRevision ||
    review.contentHash.toString("hex") !== intent.contentHash ||
    application.pageEpoch !== intent.expectedPageEpoch ||
    application.revision !== intent.expectedApplicationRevision
  ) {
    return { kind: "stale_state" };
  }

  const receiptId = randomUUID();
  const next = await saveLockedApplicationState(client, {
    id: application.id,
    draft: application.draft,
    stage: "submitted",
    revision: application.revision + 1,
    requirementsVersion: application.requirementsVersion,
    pageEpoch: application.pageEpoch,
    pageBootstrapRequestId: application.pageBootstrapRequestId,
    pageBootstrapRequestDigest: application.pageBootstrapRequestDigest,
    consentRequestId: null,
    currentReviewId: review.id,
  });

  const receiptRecord = ReceiptRecordV1Schema.parse({
    schema: "citeapply-receipt-v1",
    receiptId,
    submittedAt: next.updatedAt.toISOString(),
    acceptedApplicationRevision: review.sourceApplicationRevision,
    acceptedReview: review.reviewSnapshot,
  });

  await insertSubmission(client, {
    id: randomUUID(),
    applicationId: application.id,
    reviewId: review.id,
    receiptId,
    acceptedApplicationRevision: review.sourceApplicationRevision,
    receiptRecord,
  });

  return {
    kind: "submitted",
    application: next,
    receipt: receiptRecord,
    submittedAt: next.updatedAt.toISOString(),
  };
}

export async function loadReceipt(
  client: PoolClient,
  application: StoredApplication,
): Promise<unknown | null> {
  if (application.stage !== "submitted") return null;
  const submission = await findSubmission(client, application.id);
  return submission?.receiptRecord ?? null;
}

export async function loadCurrentReview(
  client: PoolClient,
  application: StoredApplication,
): Promise<StoredReview | null> {
  return findCurrentReview(client, application.id);
}

/**
 * Stage transitions the applicant owns. They run under the same guards as
 * every other human action: current coordinates, one recorded operation per
 * request identity, and the ledger row committed before the effect.
 */
export type StageTransitionOutcome =
  | Readonly<{
      kind: "review_prepared";
      application: StoredApplication;
      review: StoredReview;
    }>
  | Readonly<{ kind: "returned_to_draft"; application: StoredApplication }>
  | Readonly<{ kind: "replayed"; operation: StoredOperation }>
  | Readonly<{ kind: "not_ready"; blockers: readonly unknown[] }>
  | Readonly<{ kind: "request_reuse_mismatch" }>
  | Readonly<{ kind: "stale_state" }>;

function stageIntentDigest(keyring: Keyring, action: HumanAction): Uint8Array {
  const entries = Object.entries(action as Record<string, unknown>).sort(
    ([left], [right]) => (left < right ? -1 : left > right ? 1 : 0),
  );
  return operationIntentDigest(
    keyring,
    Buffer.from(JSON.stringify(entries), "utf8"),
  );
}

export async function runStageTransition(
  client: PoolClient,
  keyring: Keyring,
  application: StoredApplication,
  action: HumanAction,
): Promise<StageTransitionOutcome> {
  if (
    action.action !== "prepare_review" &&
    action.action !== "return_to_draft"
  ) {
    return { kind: "stale_state" };
  }

  const digest = stageIntentDigest(keyring, action);
  const replay = await classifyOperationReplay(
    client,
    application.id,
    action.requestId,
    digest,
  );
  if (replay.kind === "mismatch") return { kind: "request_reuse_mismatch" };
  if (replay.kind === "exact") {
    return { kind: "replayed", operation: replay.operation };
  }

  if (
    application.pageEpoch !== action.expectedPageEpoch ||
    application.revision !== action.expectedApplicationRevision ||
    application.requirementsVersion !== action.expectedRequirementsVersion
  ) {
    return { kind: "stale_state" };
  }

  const versions = {
    applicationRevision: application.revision + 1,
    requirementsVersion: application.requirementsVersion,
  };

  if (action.action === "prepare_review") {
    if (application.stage !== "draft") return { kind: "stale_state" };

    // Readiness is decided before anything is written, so a refusal records a
    // refusal and a preparation records a preparation.
    const packet = parsedPacketOf(application);
    const blockers = evaluateDraftReadiness(
      draftOf(application, packet),
    ).blockers;
    if (blockers.length > 0) {
      await insertOperation(client, {
        applicationId: application.id,
        requestId: action.requestId,
        action: "prepare_review",
        keyedIntentDigest: digest,
        outcome: {
          outcome: "not_ready_for_review",
          action: "prepare_review",
          blockers,
          versions: {
            applicationRevision: application.revision,
            requirementsVersion: application.requirementsVersion,
          },
        },
      });
      return { kind: "not_ready", blockers };
    }

    const reviewId = randomUUID();
    await insertOperation(client, {
      applicationId: application.id,
      requestId: action.requestId,
      action: "prepare_review",
      keyedIntentDigest: digest,
      outcome: {
        outcome: "review_prepared",
        action: "prepare_review",
        reviewId,
        versions,
      },
    });

    const prepared = await prepareApplicationReview(
      client,
      application,
      reviewId,
    );
    if (prepared.kind !== "prepared") {
      throw new Error(
        "A guarded Review preparation failed after its ledger row.",
      );
    }
    return {
      kind: "review_prepared",
      application: prepared.application,
      review: prepared.review,
    };
  }

  if (application.stage !== "review" || application.currentReviewId === null) {
    return { kind: "stale_state" };
  }

  await insertOperation(client, {
    applicationId: application.id,
    requestId: action.requestId,
    action: "return_to_draft",
    keyedIntentDigest: digest,
    outcome: {
      outcome: "returned_to_draft",
      action: "return_to_draft",
      invalidatedReviewId: application.currentReviewId,
      versions,
    },
  });

  const returned = await returnApplicationToDraft(client, application);
  if (returned.kind !== "returned") {
    throw new Error("A guarded Return failed after its ledger row.");
  }
  return { kind: "returned_to_draft", application: returned.application };
}
