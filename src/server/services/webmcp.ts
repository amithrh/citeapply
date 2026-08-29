import { randomBytes } from "node:crypto";

import type { Pool, PoolClient } from "pg";

import {
  ConflictRequiresHumanFailureSchema,
  ConsentRequiredFailureSchema,
  DemoChangeLimitFailureSchema,
  EvidenceUnavailableFailureSchema,
  InvalidRequestFailureSchema,
  MutationUnavailableSchema,
  NotReadyForReviewFailureSchema,
  ReadUnavailableSchema,
  RequestReuseMismatchFailureSchema,
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  StaleStateFailureSchema,
} from "../../contracts/outcomes.ts";
import {
  TOOL_INPUT_SCHEMAS,
  canonicalizeAssistedChanges,
  parseServerToolResult,
  type ToolInputByName,
  type ToolName,
} from "../../contracts/webmcp.ts";
import {
  projectActiveRequirements,
  projectApplySuccess,
  projectEvidenceIndex,
  projectProtectedState,
  projectRedactedState,
  projectStaticRequirements,
  projectValidationIssues,
} from "../../domain/agent-projectors.ts";
import { applyAssistedDraftChanges } from "../../domain/draft.ts";
import { evaluateDraftReadiness } from "../../domain/readiness.ts";
import {
  lockApplicationBySessionDigest,
  saveLockedApplicationState,
  type StoredApplication,
} from "../db/applications.ts";
import { classifyOperationReplay, insertOperation } from "../db/operations.ts";
import { withReadCommittedTransaction } from "../db/transactions.ts";
import {
  finalizeAuthority,
  type AuthorityMode,
} from "../security/capabilities.ts";
import { operationIntentDigest, type Keyring } from "../security/keys.ts";
import { draftOf, parsedPacketOf } from "./application.ts";

/**
 * Capabilities are injected by the page, never carried in tool arguments.
 */
export type ToolAuthority = Readonly<{
  sessionDigest: Uint8Array | null;
  pageCapability: string | null;
  consentCapability: string | null;
  localDirty: boolean;
}>;

export type ToolCall = Readonly<{ tool: ToolName; input: unknown }>;

const SUPPORT_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** A fresh, value-free reference so two failures are never conflated. */
function supportReference(): string {
  const bytes = randomBytes(8);
  let reference = "CA-";
  for (const byte of bytes) {
    reference += SUPPORT_ALPHABET[byte % SUPPORT_ALPHABET.length];
  }
  return reference;
}

const READ_ONLY_TOOLS = [
  "get_application_state",
  "get_form_requirements",
  "get_evidence_index",
  "get_validation_issues",
] as const;

/**
 * A read that cannot complete is safe to retry; a mutation that cannot be
 * confirmed must send the page to reconciliation instead.
 */
function unavailableFor(tool: ToolName): unknown {
  return (READ_ONLY_TOOLS as readonly string[]).includes(tool)
    ? readUnavailable()
    : mutationUnavailable();
}

function readUnavailable(): unknown {
  return ReadUnavailableSchema.parse({
    ok: false,
    error: {
      code: "temporarily_unavailable",
      message: "CiteApply is temporarily unavailable.",
      supportReference: supportReference(),
      safeActions: ["use_visible_application"],
    },
  });
}

function mutationUnavailable(): unknown {
  return MutationUnavailableSchema.parse({
    ok: false,
    error: {
      code: "temporarily_unavailable",
      message:
        "CiteApply could not confirm this action. Checking the latest application.",
      supportReference: supportReference(),
      safeActions: ["reconcile_current_state"],
    },
  });
}

function authorityFailure(code: string): unknown {
  if (code === "session_expired") {
    return SessionExpiredFailureSchema.parse({
      ok: false,
      error: {
        code: "session_expired",
        message: "This synthetic session has expired.",
        safeActions: ["start_new_synthetic_demo"],
      },
    });
  }
  if (code === "stale_page") {
    return StalePageFailureSchema.parse({
      ok: false,
      error: {
        code: "stale_page",
        message: "This page is no longer current.",
        safeActions: ["reload_current_application"],
      },
    });
  }
  return ConsentRequiredFailureSchema.parse({
    ok: false,
    error: {
      code: "consent_required",
      message: "Use the visible CiteApply application to continue.",
      safeActions: ["use_visible_application"],
    },
  });
}

/**
 * The change ledger is full. This is a deterministic, zero-effect refusal, so
 * it is never reported as an uncertain dependency failure.
 */
function demoChangeLimit(): unknown {
  return DemoChangeLimitFailureSchema.parse({
    ok: false,
    error: {
      code: "demo_change_limit",
      message:
        "That change was not saved. Continue the remaining application steps or start a new synthetic demo.",
      safeActions: ["use_visible_application", "start_new_synthetic_demo"],
    },
  });
}

function invalidRequest(): unknown {
  return InvalidRequestFailureSchema.parse({
    ok: false,
    error: {
      code: "invalid_request",
      message: "The request is not valid.",
      safeActions: ["use_visible_application"],
    },
  });
}

function staleState(application: StoredApplication): unknown {
  return StaleStateFailureSchema.parse({
    ok: false,
    error: {
      code: "stale_state",
      message: "The saved application changed.",
      safeActions: ["reread_state_and_requirements"],
      currentVersions: versionsOf(application),
    },
  });
}

function versionsOf(application: StoredApplication) {
  return {
    applicationRevision: application.revision,
    requirementsVersion: application.requirementsVersion,
  };
}

/**
 * `protected` mode requires a current visible consent capability; the two
 * unprotected read modes require only a live session and current page.
 */
function requiredMode(tool: ToolName, input: unknown): AuthorityMode {
  if (tool === "get_application_state") {
    return (input as { mode?: string }).mode === "protected"
      ? "protected"
      : "page";
  }

  if (tool === "get_form_requirements") {
    return (input as { mode?: string }).mode === "active"
      ? "protected"
      : "page";
  }
  return "protected";
}

export async function runToolCall(
  pool: Pool,
  keyring: Keyring,
  call: ToolCall,
  authority: ToolAuthority,
): Promise<unknown> {
  const schema = TOOL_INPUT_SCHEMAS[call.tool];
  const parsed = schema.safeParse(call.input);
  if (!parsed.success) {
    return invalidRequest();
  }
  const input = parsed.data as ToolInputByName[ToolName];

  if (authority.sessionDigest === null) {
    return authorityFailure("session_expired");
  }

  try {
    const result = await withReadCommittedTransaction(pool, async (client) => {
      const application = await lockApplicationBySessionDigest(
        client,
        authority.sessionDigest as Uint8Array,
      );
      const decision = await finalizeAuthority(
        client,
        keyring,
        application,
        requiredMode(call.tool, input),
        {
          pageCapability: authority.pageCapability,
          consentCapability: authority.consentCapability,
        },
      );
      if (!decision.ok) {
        // Protected modes refuse before consent exists; the redacted read is the
        // separate, always-safe mode and is never substituted here.
        return authorityFailure(decision.code);
      }
      if (application === null) {
        return authorityFailure("session_expired");
      }
      if (application.stage !== "draft") {
        // Only the mutating tools admit stale_state; a read outside Draft is a
        // page-currency problem from the agent's point of view.
        return call.tool === "apply_evidence_backed_answers" ||
          call.tool === "prepare_submission_review"
          ? staleState(application)
          : authorityFailure("stale_page");
      }

      return dispatch(
        client,
        keyring,
        application,
        call.tool,
        input,
        authority,
      );
    });
    return parseServerToolResult(call.tool, input as never, result as never);
  } catch {
    return unavailableFor(call.tool);
  }
}

async function dispatch(
  client: PoolClient,
  keyring: Keyring,
  application: StoredApplication,
  tool: ToolName,
  input: ToolInputByName[ToolName],
  authority: ToolAuthority,
): Promise<unknown> {
  const packet = parsedPacketOf(application);
  const draft = draftOf(application, packet);
  const versions = versionsOf(application);

  switch (tool) {
    case "get_application_state": {
      const mode = (input as { mode: "redacted" | "protected" }).mode;
      if (mode === "protected") {
        return { ok: true, data: projectProtectedState(draft, versions) };
      }
      // The redacted read is the pre-consent mode only; it never stands in for
      // a protected read once the applicant has allowed access.
      if (application.consentRequestId !== null) return invalidRequest();
      return { ok: true, data: projectRedactedState() };
    }
    case "get_form_requirements": {
      const mode = (input as { mode: "all" | "active" }).mode;
      return mode === "all"
        ? { ok: true, data: projectStaticRequirements() }
        : { ok: true, data: projectActiveRequirements(draft, versions) };
    }
    case "get_evidence_index":
      return { ok: true, data: projectEvidenceIndex(packet) };
    case "get_validation_issues":
      return {
        ok: true,
        data: projectValidationIssues(draft, versions, authority.localDirty),
      };
    case "apply_evidence_backed_answers":
      return applyAnswers(client, keyring, application, input as never);
    case "prepare_submission_review":
      return prepareReview(application, draft);
  }
}

type ApplyInput = ToolInputByName["apply_evidence_backed_answers"];

/**
 * The digest covers the canonicalized change set, so two byte-different but
 * semantically identical retries share one identity instead of colliding.
 */
function canonicalApplyIntent(input: ApplyInput): string {
  return JSON.stringify([
    "webmcp/apply_evidence_backed_answers",
    input.requestId,
    input.expectedApplicationRevision,
    input.expectedRequirementsVersion,
    canonicalizeAssistedChanges(input.changes).map((change) =>
      change.kind === "bind_claim"
        ? [change.kind, change.field, change.claimHandle]
        : [change.kind, change.field, change.value.normalize("NFC")],
    ),
  ]);
}

function requestReuseMismatch(): unknown {
  return RequestReuseMismatchFailureSchema.parse({
    ok: false,
    error: {
      code: "request_reuse_mismatch",
      message: "That request identity was already used differently.",
      safeActions: ["reread_state_and_requirements"],
    },
  });
}

async function applyAnswers(
  client: PoolClient,
  keyring: Keyring,
  application: StoredApplication,
  input: ApplyInput,
): Promise<unknown> {
  const digest = operationIntentDigest(
    keyring,
    Buffer.from(canonicalApplyIntent(input), "utf8"),
  );
  // Identity is classified before versions, so an exact replay of a committed
  // apply returns its recorded effect instead of a stale-version refusal.
  const replay = await classifyOperationReplay(
    client,
    application.id,
    input.requestId,
    digest,
  );
  if (replay.kind === "mismatch") {
    return requestReuseMismatch();
  }
  if (replay.kind === "exact") {
    const stored = replay.operation.outcome as {
      fields?: readonly string[];
      versions?: { applicationRevision: number; requirementsVersion: number };
    };
    return {
      ok: true,
      data: projectApplySuccess(
        stored.versions ?? versionsOf(application),
        (stored.fields ?? []) as never,
      ),
    };
  }

  if (
    application.revision !== input.expectedApplicationRevision ||
    application.requirementsVersion !== input.expectedRequirementsVersion
  ) {
    return staleState(application);
  }

  const packet = parsedPacketOf(application);
  const transition = applyAssistedDraftChanges({
    draft: draftOf(application, packet),
    packet,
    changes: canonicalizeAssistedChanges(input.changes),
  });

  if (transition.outcome === "evidence_unavailable") {
    return EvidenceUnavailableFailureSchema.parse({
      ok: false,
      error: {
        code: "evidence_unavailable",
        message: "That evidence is not currently available for this field.",
        safeActions: ["reread_state_and_requirements"],
      },
    });
  }
  if (transition.outcome === "conflict_requires_human") {
    // The portal refuses to pick a value: the applicant owns this decision.
    return ConflictRequiresHumanFailureSchema.parse({
      ok: false,
      error: {
        code: "conflict_requires_human",
        message: "Income sources disagree. Resolve this in CiteApply.",
        safeActions: ["resolve_in_visible_application"],
      },
    });
  }

  const nextRevision =
    application.revision + transition.applicationRevisionDelta;
  const nextRequirements =
    application.requirementsVersion + transition.requirementsVersionDelta;

  if (transition.outcome === "applied") {
    await saveLockedApplicationState(client, {
      id: application.id,
      draft: transition.draft,
      stage: application.stage,
      revision: nextRevision,
      requirementsVersion: nextRequirements,
      pageEpoch: application.pageEpoch,
      pageBootstrapRequestId: application.pageBootstrapRequestId,
      pageBootstrapRequestDigest: application.pageBootstrapRequestDigest,
      consentRequestId: application.consentRequestId,
      currentReviewId: application.currentReviewId,
    });
  }

  const versions = {
    applicationRevision: nextRevision,
    requirementsVersion: nextRequirements,
  };
  const recorded = await insertOperation(client, {
    applicationId: application.id,
    requestId: input.requestId,
    action: "apply_evidence_answers",
    keyedIntentDigest: digest,
    outcome:
      transition.outcome === "applied"
        ? {
            outcome: "answers_applied",
            action: "apply_evidence_answers",
            fields: [...transition.updatedFields],
            versions,
          }
        : {
            outcome: "no_change",
            action: "apply_evidence_answers",
            fields: [],
            versions,
          },
  });
  if (recorded.kind === "request_reuse_mismatch") {
    return requestReuseMismatch();
  }
  if (recorded.kind === "hard_limit") {
    return demoChangeLimit();
  }

  return {
    ok: true,
    data: projectApplySuccess(versions, transition.updatedFields),
  };
}

/**
 * The W0 kernel proves the refusal half of preparation. Freezing a ready Draft
 * into an immutable Review lands with the Review domain in W1.
 */
function prepareReview(
  application: StoredApplication,
  draft: ReturnType<typeof draftOf>,
): unknown {
  const blockers = evaluateDraftReadiness(draft).blockers;
  if (blockers.length > 0) {
    return NotReadyForReviewFailureSchema.parse({
      ok: false,
      error: {
        code: "not_ready_for_review",
        message: "The application is not ready for Review.",
        safeActions: ["use_visible_application"],
        blockers,
      },
    });
  }
  void application;
  return mutationUnavailable();
}
