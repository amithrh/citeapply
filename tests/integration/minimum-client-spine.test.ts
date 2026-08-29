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
import { closeDatabasePool, getDatabasePool } from "../../src/server/db/pool.ts";
import { withReadCommittedTransaction } from "../../src/server/db/transactions.ts";
import { finalizeAuthority } from "../../src/server/security/capabilities.ts";
import { deriveKeyring, sha256 } from "../../src/server/security/keys.ts";
import { runHumanAction, runPageTakeover } from "../../src/server/services/actions.ts";
import {
  currentPageCapability,
  projectHumanSnapshot,
  projectTakeoverSnapshot,
} from "../../src/server/services/application.ts";
import { runToolCall } from "../../src/server/services/webmcp.ts";

const keyring = deriveKeyring();
const pool = getDatabasePool();

type Session = Readonly<{
  applicationId: string;
  sessionDigest: Buffer;
  pageCapability: string;
  consentCapability: string | null;
  application: StoredApplication;
}>;

async function startSession(packetCode: "supported" | "conflict"): Promise<Session> {
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

  const application = await withReadCommittedTransaction(pool, async (client) => {
    const locked = await lockApplicationById(client, applicationId);
    assert.ok(locked !== null);
    return runPageTakeover(client, locked, randomUUID(), sha256(randomUUID()));
  });

  return {
    applicationId,
    sessionDigest,
    pageCapability: currentPageCapability(keyring, application),
    consentCapability: null,
    application,
  };
}

async function currentApplication(id: string): Promise<StoredApplication> {
  const application = await withReadCommittedTransaction(pool, (client) =>
    lockApplicationById(client, id),
  );
  assert.ok(application !== null);
  return application;
}

async function allowAssistedAccess(session: Session): Promise<string> {
  const application = await currentApplication(session.applicationId);
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
  if (effect.kind !== "applied") throw new Error("unreachable");
  assert.ok(effect.consentCapability !== null);
  return effect.consentCapability;
}

function authorityFor(session: Session, consentCapability: string | null) {
  return {
    sessionDigest: session.sessionDigest,
    pageCapability: session.pageCapability,
    consentCapability,
    localDirty: false,
  };
}

test("the spine refuses protected reads until the applicant allows access", async () => {
  const session = await startSession("supported");

  const redacted = (await runToolCall(
    pool,
    keyring,
    { tool: "get_application_state", input: { mode: "redacted" } },
    authorityFor(session, null),
  )) as { ok: boolean; data?: { access?: string } };
  assert.equal(redacted.ok, true);
  assert.equal(redacted.data?.access, "consent_required");

  const refused = (await runToolCall(
    pool,
    keyring,
    { tool: "get_application_state", input: { mode: "protected" } },
    authorityFor(session, null),
  )) as { ok: boolean; error?: { code: string } };
  assert.equal(refused.ok, false);
  assert.equal(refused.error?.code, "consent_required");

  const index = (await runToolCall(
    pool,
    keyring,
    { tool: "get_evidence_index", input: {} },
    authorityFor(session, null),
  )) as { ok: boolean; error?: { code: string } };
  assert.equal(index.ok, false);
  assert.equal(index.error?.code, "consent_required");
});

test("an allowed agent can bind supported evidence and read its own effect", async () => {
  const session = await startSession("supported");
  const consent = await allowAssistedAccess(session);
  const application = await currentApplication(session.applicationId);

  const index = (await runToolCall(
    pool,
    keyring,
    { tool: "get_evidence_index", input: {} },
    authorityFor(session, consent),
  )) as { ok: boolean; data: { claims: readonly { kind: string; claimHandle: string }[] } };
  assert.equal(index.ok, true);
  const legalName = index.data.claims.find(({ kind }) => kind === "legal_name");
  assert.ok(legalName !== undefined);

  const applied = (await runToolCall(
    pool,
    keyring,
    {
      tool: "apply_evidence_backed_answers",
      input: {
        requestId: randomUUID(),
        expectedApplicationRevision: application.revision,
        expectedRequirementsVersion: application.requirementsVersion,
        changes: [
          {
            kind: "bind_claim",
            field: "legal_name",
            claimHandle: legalName.claimHandle,
          },
        ],
      },
    },
    authorityFor(session, consent),
  )) as { ok: boolean; data?: { updatedFields: readonly string[] } };
  assert.equal(applied.ok, true);
  assert.deepEqual(applied.data?.updatedFields, ["legal_name"]);
});

test("the portal refuses a conflicting income instead of choosing", async () => {
  const session = await startSession("conflict");
  const consent = await allowAssistedAccess(session);
  const application = await currentApplication(session.applicationId);

  const index = (await runToolCall(
    pool,
    keyring,
    { tool: "get_evidence_index", input: {} },
    authorityFor(session, consent),
  )) as {
    data: {
      claims: readonly { kind: string; document: string; claimHandle: string }[];
    };
  };
  const statement = index.data.claims.find(
    (claim) =>
      claim.kind === "annual_household_income" && claim.document === "income",
  );
  assert.ok(statement !== undefined);

  const refused = (await runToolCall(
    pool,
    keyring,
    {
      tool: "apply_evidence_backed_answers",
      input: {
        requestId: randomUUID(),
        expectedApplicationRevision: application.revision,
        expectedRequirementsVersion: application.requirementsVersion,
        changes: [
          {
            kind: "bind_claim",
            field: "annual_household_income",
            claimHandle: statement.claimHandle,
          },
        ],
      },
    },
    authorityFor(session, consent),
  )) as { ok: boolean; error?: { code: string } };

  assert.equal(refused.ok, false);
  assert.equal(refused.error?.code, "conflict_requires_human");

  // The refusal changed nothing.
  const after = await currentApplication(session.applicationId);
  assert.equal(after.revision, application.revision);
});

test("a stale expected revision is refused with the current versions", async () => {
  const session = await startSession("supported");
  const consent = await allowAssistedAccess(session);
  const application = await currentApplication(session.applicationId);

  const stale = (await runToolCall(
    pool,
    keyring,
    {
      tool: "apply_evidence_backed_answers",
      input: {
        requestId: randomUUID(),
        expectedApplicationRevision: application.revision + 5,
        expectedRequirementsVersion: application.requirementsVersion,
        changes: [
          {
            kind: "propose_email",
            field: "preferred_contact_email",
            value: "anaya.rao@example.test",
          },
        ],
      },
    },
    authorityFor(session, consent),
  )) as {
    ok: boolean;
    error?: { code: string; currentVersions?: { applicationRevision: number } };
  };

  assert.equal(stale.ok, false);
  assert.equal(stale.error?.code, "stale_state");
  assert.equal(
    stale.error?.currentVersions?.applicationRevision,
    application.revision,
  );
});

test("revoking access closes the agent surface without losing saved work", async () => {
  const session = await startSession("supported");
  const consent = await allowAssistedAccess(session);
  const beforeRevoke = await currentApplication(session.applicationId);

  const effect = await withReadCommittedTransaction(pool, async (client) => {
    const locked = await lockApplicationById(client, session.applicationId);
    assert.ok(locked !== null);
    return runHumanAction(client, keyring, locked, {
      requestId: randomUUID(),
      expectedPageEpoch: beforeRevoke.pageEpoch,
      expectedApplicationRevision: beforeRevoke.revision,
      expectedRequirementsVersion: beforeRevoke.requirementsVersion,
      action: "revoke_assisted_access",
    });
  });
  assert.equal(effect.kind, "applied");

  const refused = (await runToolCall(
    pool,
    keyring,
    { tool: "get_validation_issues", input: {} },
    authorityFor(session, consent),
  )) as { ok: boolean; error?: { code: string } };
  assert.equal(refused.ok, false);
  assert.equal(refused.error?.code, "consent_required");

  const after = await currentApplication(session.applicationId);
  const snapshot = await withReadCommittedTransaction(pool, async (client) => {
    const authority = await finalizeAuthority(client, keyring, after, "session");
    assert.ok(authority.ok);
    return projectHumanSnapshot(after, authority.clock);
  });
  assert.equal(snapshot.stage, "draft");
});

test("a takeover always lands with assisted access off", async () => {
  const session = await startSession("supported");
  await allowAssistedAccess(session);

  const taken = await withReadCommittedTransaction(pool, async (client) => {
    const locked = await lockApplicationById(client, session.applicationId);
    assert.ok(locked !== null);
    const next = await runPageTakeover(
      client,
      locked,
      randomUUID(),
      sha256(randomUUID()),
    );
    const authority = await finalizeAuthority(client, keyring, next, "session");
    assert.ok(authority.ok);
    return projectTakeoverSnapshot(next, authority.clock);
  });

  assert.equal(taken.stage, "draft");
  if (taken.stage !== "draft") return;
  assert.equal(taken.view.assistance, "off");
});

test.after(async () => {
  await closeDatabasePool();
});
