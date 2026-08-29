import assert from "node:assert/strict";
import test from "node:test";

import { canonicalizeAssistedChanges } from "../../src/contracts/webmcp.ts";
import { canonicalizeDraft, contentHash } from "../../src/domain/canonicalize.ts";
import {
  applyAssistedDraftChanges,
  bindDraftEvidence,
  clearDraftDependency,
  clearDraftEvidence,
  clearDraftIncomeResolution,
  createInitialDraft,
  declareDraftEmail,
  resolveDraftIncome,
  saveDraftEmail,
  type DraftAggregateV1,
} from "../../src/domain/draft.ts";
import { evaluateDraftReadiness } from "../../src/domain/readiness.ts";
import { prepareReview } from "../../src/domain/review.ts";
import type { ParsedPacketV1 } from "../../src/contracts/common.ts";
import { parseRegisteredPacket } from "../../src/evidence/extract-claims.server.ts";

const EMPTY_ACTIVITY = {
  totals: {
    allowed: 0,
    revoked: 0,
    acceptedBatches: 0,
    refusals: 0,
    assistedReviewsPrepared: 0,
  },
  latest: [],
};

const supported = await parseRegisteredPacket("supported");
const conflict = await parseRegisteredPacket("conflict");

function handle(
  packet: ParsedPacketV1,
  kind: string,
  document?: string,
): string {
  const claim = packet.claims.find(
    (candidate) =>
      candidate.kind === kind &&
      (document === undefined || candidate.document === document),
  );
  assert.ok(claim !== undefined, `no ${kind} claim`);
  return claim.claimHandle;
}

function bind(
  draft: DraftAggregateV1,
  packet: ParsedPacketV1,
  field: string,
  claimHandle: string,
  origin: "manual" | "assisted" = "manual",
): DraftAggregateV1 {
  const result = bindDraftEvidence({
    draft,
    packet,
    field: field as never,
    claimHandle,
    origin,
  });
  assert.equal(result.outcome, "applied", `${field}: ${result.outcome}`);
  return result.draft;
}

function completeDraft(
  packet: ParsedPacketV1,
  origin: "manual" | "assisted" = "manual",
): DraftAggregateV1 {
  let draft = createInitialDraft(packet);
  for (const field of [
    "legal_name",
    "student_id",
    "institution",
    "dependency",
    "guardian_name",
    "household_size",
  ]) {
    draft = bind(draft, packet, field, handle(packet, field), origin);
  }

  if (packet.packet === "supported") {
    draft = bind(
      draft,
      packet,
      "annual_household_income",
      handle(packet, "annual_household_income", "income"),
      origin,
    );
  } else {
    const resolved = resolveDraftIncome({
      draft,
      packet,
      claimHandle: handle(packet, "annual_household_income", "income"),
      reason: "more_recent",
    });
    assert.equal(resolved.outcome, "applied");
    draft = resolved.draft;
  }

  const saved = saveDraftEmail(draft, packet, "anaya.rao@example.test");
  assert.equal(saved.outcome, "applied");
  const declared = declareDraftEmail(saved.draft, packet);
  assert.equal(declared.outcome, "applied");
  return declared.draft;
}

test("an unresolved income conflict blocks readiness and cannot be bound", () => {
  const draft = createInitialDraft(conflict);
  const blockers = evaluateDraftReadiness(draft).blockers;
  assert.ok(
    blockers.some((blocker) => blocker.code === "conflict_requires_human"),
  );

  const refused = bindDraftEvidence({
    draft,
    packet: conflict,
    field: "annual_household_income",
    claimHandle: handle(conflict, "annual_household_income", "income"),
    origin: "manual",
  });
  assert.equal(refused.outcome, "conflict_requires_human");
  assert.deepEqual(refused.updatedFields, []);
  assert.equal(refused.applicationRevisionDelta, 0);
});

test("assistance cannot resolve a conflict through the batch path either", () => {
  const draft = createInitialDraft(conflict);
  const refused = applyAssistedDraftChanges({
    draft,
    packet: conflict,
    changes: canonicalizeAssistedChanges([
      {
        kind: "bind_claim",
        field: "annual_household_income",
        claimHandle: handle(conflict, "annual_household_income", "household"),
      },
    ]),
  });
  assert.equal(refused.outcome, "conflict_requires_human");
});

test("only a real parsed income claim can resolve the conflict", () => {
  const draft = createInitialDraft(conflict);
  const refused = resolveDraftIncome({
    draft,
    packet: conflict,
    claimHandle: handle(conflict, "legal_name"),
    reason: "more_recent",
  });
  assert.equal(refused.outcome, "evidence_unavailable");

  const resolved = resolveDraftIncome({
    draft,
    packet: conflict,
    claimHandle: handle(conflict, "annual_household_income", "household"),
    reason: "corrected_record",
  });
  assert.equal(resolved.outcome, "applied");
  const income = resolved.draft.fields[7];
  assert.equal(income.status, "ready");
  if (income.status !== "ready" || income.field !== "annual_household_income") {
    return;
  }
  assert.notEqual(income.resolution, "source_supported");
  assert.equal(income.value, 480000);
});

test("clearing a resolution returns the field to the unresolved conflict", () => {
  const draft = createInitialDraft(conflict);
  const resolved = resolveDraftIncome({
    draft,
    packet: conflict,
    claimHandle: handle(conflict, "annual_household_income", "income"),
    reason: "more_recent",
  });
  assert.equal(resolved.outcome, "applied");

  const cleared = clearDraftIncomeResolution(resolved.draft, conflict);
  assert.equal(cleared.outcome, "applied");
  assert.equal(cleared.draft.fields[7].status, "conflict");
});

test("an ordinary clear refuses to discard a human conflict resolution", () => {
  const draft = createInitialDraft(conflict);
  const resolved = resolveDraftIncome({
    draft,
    packet: conflict,
    claimHandle: handle(conflict, "annual_household_income", "income"),
    reason: "more_recent",
  });
  assert.equal(resolved.outcome, "applied");

  const refused = clearDraftEvidence({
    draft: resolved.draft,
    packet: conflict,
    field: "annual_household_income",
  });
  assert.equal(refused.outcome, "evidence_unavailable");
});

test("closing the branch clears both conditional answers in one effect", () => {
  let draft = createInitialDraft(supported);
  draft = bind(draft, supported, "dependency", handle(supported, "dependency"));
  draft = bind(
    draft,
    supported,
    "guardian_name",
    handle(supported, "guardian_name"),
  );
  draft = bind(
    draft,
    supported,
    "household_size",
    handle(supported, "household_size"),
  );

  const closed = clearDraftDependency(draft, supported);
  assert.equal(closed.outcome, "applied");
  assert.deepEqual(closed.updatedFields, [
    "dependency",
    "guardian_name",
    "household_size",
  ]);
  assert.equal(closed.requirementsVersionDelta, 1);
  assert.equal(closed.draft.fields[5].status, "missing");
  assert.equal(closed.draft.fields[6].status, "missing");
});

test("saving a new email withdraws the previous declaration", () => {
  const draft = createInitialDraft(supported);
  const saved = saveDraftEmail(draft, supported, "anaya.rao@example.test");
  assert.equal(saved.outcome, "applied");
  const declared = declareDraftEmail(saved.draft, supported);
  assert.equal(declared.outcome, "applied");
  assert.equal(declared.draft.fields[3].status, "ready");

  const changed = saveDraftEmail(
    declared.draft,
    supported,
    "other.person@example.test",
  );
  assert.equal(changed.outcome, "applied");
  assert.equal(changed.draft.fields[3].status, "needs_declaration");
});

test("assistance cannot overwrite an email the applicant declared", () => {
  const draft = createInitialDraft(supported);
  const saved = saveDraftEmail(draft, supported, "anaya.rao@example.test");
  const declared = declareDraftEmail(saved.draft, supported);
  assert.equal(declared.outcome, "applied");

  const proposal = applyAssistedDraftChanges({
    draft: declared.draft,
    packet: supported,
    changes: canonicalizeAssistedChanges([
      {
        kind: "propose_email",
        field: "preferred_contact_email",
        value: "anaya.rao@example.test",
      },
    ]),
  });
  assert.equal(proposal.outcome, "no_change");
  assert.equal(proposal.draft.fields[3].status, "ready");
});

test("identical answers hash identically whether manual or assisted", () => {
  const manual = completeDraft(supported, "manual");
  const assisted = completeDraft(supported, "assisted");

  const manualContent = canonicalizeDraft(manual);
  const assistedContent = canonicalizeDraft(assisted);
  assert.deepEqual(manualContent, assistedContent);
  assert.equal(contentHash(manualContent), contentHash(assistedContent));
});

test("a resolved conflict changes the content hash and adds the warning", () => {
  const resolvedToStatement = completeDraft(conflict);
  const review = prepareReview(
    resolvedToStatement,
    conflict,
    { applicationRevision: 9, requirementsVersion: 2 },
    EMPTY_ACTIVITY,
  );
  assert.equal(review.kind, "ready");
  if (review.kind !== "ready") return;
  assert.equal(review.review.warnings.length, 1);
  assert.equal(review.review.warnings[0]?.code, "conflicting_income_resolved");

  const supportedReview = prepareReview(
    completeDraft(supported),
    supported,
    { applicationRevision: 9, requirementsVersion: 2 },
    EMPTY_ACTIVITY,
  );
  assert.equal(supportedReview.kind, "ready");
  if (supportedReview.kind !== "ready") return;
  assert.equal(supportedReview.review.warnings.length, 0);
  assert.notEqual(review.contentHash, supportedReview.contentHash);
});

test("an incomplete draft can never be frozen into a Review", () => {
  const draft = createInitialDraft(supported);
  const result = prepareReview(
    draft,
    supported,
    { applicationRevision: 1, requirementsVersion: 1 },
    EMPTY_ACTIVITY,
  );
  assert.equal(result.kind, "not_ready");
  if (result.kind !== "not_ready") return;
  assert.ok(result.blockers.length > 0);
});

test("the Review carries both disagreeing income excerpts, not just the winner", () => {
  const review = prepareReview(
    completeDraft(conflict),
    conflict,
    { applicationRevision: 9, requirementsVersion: 2 },
    EMPTY_ACTIVITY,
  );
  assert.equal(review.kind, "ready");
  if (review.kind !== "ready") return;

  const excerpts = review.review.diffs[7].excerpts;
  assert.equal(excerpts.length, 2);
  assert.notEqual(excerpts[0]?.normalizedValue, excerpts[1]?.normalizedValue);
});
