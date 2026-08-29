import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { createInitialDraft } from "../../src/domain/draft.ts";
import { parseRegisteredPacket } from "../../src/evidence/extract-claims.server.ts";
import {
  acquireStartParserLease,
  insertApplication,
  lockApplicationById,
  type StoredApplication,
} from "../../src/server/db/applications.ts";
import { listOperations } from "../../src/server/db/operations.ts";
import {
  closeDatabasePool,
  getDatabasePool,
} from "../../src/server/db/pool.ts";
import { findCurrentReview } from "../../src/server/db/reviews.ts";
import { withReadCommittedTransaction } from "../../src/server/db/transactions.ts";
import { deriveKeyring, sha256 } from "../../src/server/security/keys.ts";
import {
  runHumanAction,
  runPageTakeover,
} from "../../src/server/services/actions.ts";
import { projectActivity } from "../../src/server/services/application.ts";
import { runToolCall } from "../../src/server/services/webmcp.ts";

/**
 * The collaboration this product exists to demonstrate: the agent does the
 * evidence work, the applicant makes the decisions only they can make, and the
 * portal refuses anything in between.
 */

const keyring = deriveKeyring();
const pool = getDatabasePool();

type Session = Readonly<{
  applicationId: string;
  sessionDigest: Buffer;
  pageCapability: string;
}>;

async function startSession(
  packetCode: "supported" | "conflict",
): Promise<Session> {
  const packet = await parseRegisteredPacket(packetCode);
  const applicationId = randomUUID();
  const sessionDigest = sha256(randomUUID());

  await withReadCommittedTransaction(pool, async (client) => {
    const lease = await acquireStartParserLease(client);
    await insertApplication(client, lease, {
      id: applicationId,
      startNonceHash: sha256(randomUUID()),
      startRequestId: randomUUID(),
      startRequestDigest: sha256(randomUUID()),
      sessionDigest,
      packetCode,
      parsedPacket: packet,
      draft: createInitialDraft(packet),
    });
  });

  const application = await withReadCommittedTransaction(
    pool,
    async (client) => {
      const locked = await lockApplicationById(client, applicationId);
      assert.ok(locked !== null);
      return runPageTakeover(
        client,
        locked,
        randomUUID(),
        sha256(randomUUID()),
      );
    },
  );

  const { currentPageCapability } =
    await import("../../src/server/services/application.ts");
  return {
    applicationId,
    sessionDigest,
    pageCapability: currentPageCapability(keyring, application),
  };
}

async function current(id: string): Promise<StoredApplication> {
  const application = await withReadCommittedTransaction(pool, (client) =>
    lockApplicationById(client, id),
  );
  assert.ok(application !== null);
  return application;
}

async function humanAction(
  session: Session,
  action: Record<string, unknown>,
): Promise<string> {
  const application = await current(session.applicationId);
  const effect = await withReadCommittedTransaction(pool, async (client) => {
    const locked = await lockApplicationById(client, session.applicationId);
    assert.ok(locked !== null);
    return runHumanAction(client, keyring, locked, {
      requestId: randomUUID(),
      expectedPageEpoch: application.pageEpoch,
      expectedApplicationRevision: application.revision,
      expectedRequirementsVersion: application.requirementsVersion,
      ...action,
    } as never);
  });
  return effect.kind === "applied" ? effect.outcome : effect.kind;
}

async function allowAssistance(session: Session): Promise<string> {
  const application = await current(session.applicationId);
  const effect = await withReadCommittedTransaction(pool, async (client) => {
    const locked = await lockApplicationById(client, session.applicationId);
    assert.ok(locked !== null);
    return runHumanAction(client, keyring, locked, {
      requestId: randomUUID(),
      expectedPageEpoch: application.pageEpoch,
      expectedApplicationRevision: application.revision,
      expectedRequirementsVersion: application.requirementsVersion,
      action: "allow_assisted_access",
    });
  });
  assert.equal(effect.kind, "applied");
  if (effect.kind !== "applied" || effect.consentCapability === null) {
    throw new Error("assistance was not allowed");
  }
  return effect.consentCapability;
}

function authority(session: Session, consentCapability: string | null) {
  return {
    sessionDigest: session.sessionDigest,
    pageCapability: session.pageCapability,
    consentCapability,
    localDirty: false,
  };
}

async function tool(
  session: Session,
  consent: string,
  toolName: string,
  input: unknown,
): Promise<
  Record<string, never> & { ok: boolean; data?: never; error?: never }
> {
  return (await runToolCall(
    pool,
    keyring,
    { tool: toolName as never, input },
    authority(session, consent),
  )) as never;
}

type Claim = Readonly<{ claimHandle: string; kind: string; document: string }>;

async function claims(session: Session, consent: string): Promise<Claim[]> {
  const index = (await tool(
    session,
    consent,
    "get_evidence_index",
    {},
  )) as unknown as {
    ok: boolean;
    data: { claims: Claim[] };
  };
  assert.equal(index.ok, true);
  return index.data.claims;
}

function handleOf(list: Claim[], kind: string, document?: string): string {
  const claim = list.find(
    (candidate) =>
      candidate.kind === kind &&
      (document === undefined || candidate.document === document),
  );
  assert.ok(claim !== undefined, `no ${kind} claim`);
  return claim.claimHandle;
}

async function applyChanges(
  session: Session,
  consent: string,
  changes: unknown[],
): Promise<{ ok: boolean; error?: { code: string } }> {
  const application = await current(session.applicationId);
  return (await runToolCall(
    pool,
    keyring,
    {
      tool: "apply_evidence_backed_answers",
      input: {
        requestId: randomUUID(),
        expectedApplicationRevision: application.revision,
        expectedRequirementsVersion: application.requirementsVersion,
        changes,
      },
    },
    authority(session, consent),
  )) as never;
}

async function prepare(
  session: Session,
  consent: string,
): Promise<{
  ok: boolean;
  data?: { readiness: string; reviewRef: string };
  error?: { code: string; blockers?: readonly { code: string }[] };
}> {
  const application = await current(session.applicationId);
  return (await runToolCall(
    pool,
    keyring,
    {
      tool: "prepare_submission_review",
      input: {
        requestId: randomUUID(),
        expectedApplicationRevision: application.revision,
        expectedRequirementsVersion: application.requirementsVersion,
      },
    },
    authority(session, consent),
  )) as never;
}

test("the agent prepares a Review only after the applicant's own decisions", async () => {
  const session = await startSession("conflict");
  const consent = await allowAssistance(session);
  const list = await claims(session, consent);

  const applied = await applyChanges(session, consent, [
    {
      kind: "bind_claim",
      field: "legal_name",
      claimHandle: handleOf(list, "legal_name"),
    },
    {
      kind: "bind_claim",
      field: "student_id",
      claimHandle: handleOf(list, "student_id"),
    },
    {
      kind: "bind_claim",
      field: "institution",
      claimHandle: handleOf(list, "institution"),
    },
    {
      kind: "bind_claim",
      field: "dependency",
      claimHandle: handleOf(list, "dependency"),
    },
  ]);
  assert.equal(applied.ok, true);

  const branch = await applyChanges(session, consent, [
    {
      kind: "bind_claim",
      field: "guardian_name",
      claimHandle: handleOf(list, "guardian_name"),
    },
    {
      kind: "bind_claim",
      field: "household_size",
      claimHandle: handleOf(list, "household_size"),
    },
    {
      kind: "propose_email",
      field: "preferred_contact_email",
      value: "anaya.rao@example.test",
    },
  ]);
  assert.equal(branch.ok, true);

  // The portal will not let assistance settle the contradiction.
  const income = await applyChanges(session, consent, [
    {
      kind: "bind_claim",
      field: "annual_household_income",
      claimHandle: handleOf(list, "annual_household_income", "income"),
    },
  ]);
  assert.equal(income.ok, false);
  assert.equal(income.error?.code, "conflict_requires_human");

  // A refusal here must name the real blockers, not report uncertainty.
  const early = await prepare(session, consent);
  assert.equal(early.ok, false);
  assert.equal(early.error?.code, "not_ready_for_review");
  assert.ok((early.error?.blockers ?? []).length > 0);
  assert.ok(
    (early.error?.blockers ?? []).some(
      (blocker) => blocker.code === "conflict_requires_human",
    ),
  );

  assert.equal(
    await humanAction(session, { action: "declare_email" }),
    "action_applied",
  );
  assert.equal(
    await humanAction(session, {
      action: "resolve_income",
      claimHandle: handleOf(list, "annual_household_income", "income"),
      reason: "more_recent",
    }),
    "action_applied",
  );

  const prepared = await prepare(session, consent);
  assert.equal(prepared.ok, true);
  assert.equal(prepared.data?.readiness, "ready");
  assert.match(prepared.data?.reviewRef ?? "", /^[A-Za-z0-9_-]{22}$/);

  const application = await current(session.applicationId);
  assert.equal(application.stage, "review");

  // The opaque reference must not carry the Review identity or its short id.
  const review = await withReadCommittedTransaction(pool, (client) =>
    findCurrentReview(client, session.applicationId),
  );
  assert.ok(review !== null);
  const reference = prepared.data?.reviewRef ?? "";
  assert.ok(!reference.includes(review.shortId));
  assert.notEqual(
    Buffer.from(reference, "base64url").toString("hex"),
    review.id.replaceAll("-", ""),
  );

  // Preparing closes assisted access, so the applicant reviews alone.
  const afterPrepare = await tool(session, consent, "get_evidence_index", {});
  assert.equal(afterPrepare.ok, false);

  // The applicant can see exactly what assistance did.
  const activity = projectActivity(
    await withReadCommittedTransaction(pool, (client) =>
      listOperations(client, session.applicationId),
    ),
  );
  assert.equal(activity.totals.allowed, 1);
  assert.equal(activity.totals.acceptedBatches, 2);
  assert.equal(activity.totals.assistedReviewsPrepared, 1);
});

test.after(async () => {
  await closeDatabasePool();
});
