import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import type { HumanAction } from "../../contracts/http.ts";
import {
  bindDraftEvidence,
  clearDraftDependency,
  clearDraftEvidence,
  clearDraftIncomeResolution,
  declareDraftEmail,
  resolveDraftIncome,
  saveDraftEmail,
  type DraftTransitionResult,
} from "../../domain/draft.ts";
import {
  lockApplicationById,
  saveLockedApplicationState,
  type StoredApplication,
} from "../db/applications.ts";
import {
  classifyOperationReplay,
  insertOperation,
  type OperationAction,
  type StoredOperation,
  type StoredOperationOutcome,
  type StoredOutcomeCode,
} from "../db/operations.ts";
import { deriveConsentCapability } from "../security/capabilities.ts";
import { operationIntentDigest, type Keyring } from "../security/keys.ts";
import { draftOf, parsedPacketOf } from "./application.ts";

/**
 * Every Draft-stage human action. Review preparation and Return belong to the
 * Review service and are refused here.
 */
export const W0_SUPPORTED_ACTIONS = [
  "bind_evidence",
  "clear_evidence",
  "clear_dependency",
  "save_email",
  "declare_email",
  "resolve_income",
  "clear_income_resolution",
  "allow_assisted_access",
  "revoke_assisted_access",
] as const;

export type W0SupportedAction = (typeof W0_SUPPORTED_ACTIONS)[number];

export function isW0SupportedAction(
  action: HumanAction["action"],
): action is W0SupportedAction {
  return (W0_SUPPORTED_ACTIONS as readonly string[]).includes(action);
}

export type ActionEffect =
  | Readonly<{
      kind: "applied";
      outcome: StoredOutcomeCode;
      application: StoredApplication;
      consentCapability: string | null;
    }>
  | Readonly<{ kind: "replayed"; operation: StoredOperation }>
  | Readonly<{ kind: "stale_state" }>
  | Readonly<{ kind: "request_reuse_mismatch" }>
  | Readonly<{ kind: "evidence_unavailable" }>
  | Readonly<{ kind: "conflict_requires_human" }>
  | Readonly<{ kind: "unavailable_at_w0" }>;

/**
 * The stored digest binds the exact request identity to the exact requested
 * effect, so a replayed identity carrying different content is a mismatch
 * rather than a second effect.
 */
function intentDigest(keyring: Keyring, action: HumanAction): Uint8Array {
  return operationIntentDigest(
    keyring,
    Buffer.from(canonicalIntent(action), "utf8"),
  );
}

function canonicalIntent(action: HumanAction): string {
  const entries = Object.entries(action as Record<string, unknown>).sort(
    ([left], [right]) => (left < right ? -1 : left > right ? 1 : 0),
  );
  return JSON.stringify(entries);
}

function coordinatesAreCurrent(
  application: StoredApplication,
  action: HumanAction,
): boolean {
  return (
    application.pageEpoch === action.expectedPageEpoch &&
    application.revision === action.expectedApplicationRevision &&
    application.requirementsVersion === action.expectedRequirementsVersion
  );
}

/**
 * A plan is pure: it decides the exact next saved state without writing it, so
 * the operation row can be committed first and no effect can outlive its
 * ledger entry.
 */
type EffectPlan =
  | Readonly<{
      kind: "commit";
      outcome: StoredOutcomeCode;
      draft: unknown;
      revision: number;
      requirementsVersion: number;
      consentRequestId: string | null;
      updatedFields: readonly string[];
    }>
  | Readonly<{
      kind: "no_change";
      consentCoordinate: string | null;
      updatedFields: readonly string[];
    }>
  | Readonly<{ kind: "evidence_unavailable"; field: string }>
  | Readonly<{ kind: "conflict_requires_human" }>
  | Readonly<{ kind: "unavailable_at_w0" }>;

function planEffect(
  locked: StoredApplication,
  action: HumanAction,
): EffectPlan {
  if (action.action === "allow_assisted_access") {
    if (locked.consentRequestId !== null) {
      return {
        kind: "no_change",
        consentCoordinate: locked.consentRequestId,
        updatedFields: [],
      };
    }
    return {
      kind: "commit",
      outcome: "assistance_allowed",
      draft: locked.draft,
      revision: locked.revision + 1,
      requirementsVersion: locked.requirementsVersion,
      consentRequestId: action.requestId,
      updatedFields: [],
    };
  }

  if (action.action === "revoke_assisted_access") {
    if (locked.consentRequestId === null) {
      return { kind: "no_change", consentCoordinate: null, updatedFields: [] };
    }
    return {
      kind: "commit",
      outcome: "assistance_revoked",
      draft: locked.draft,
      revision: locked.revision + 1,
      requirementsVersion: locked.requirementsVersion,
      consentRequestId: null,
      updatedFields: [],
    };
  }

  const packet = parsedPacketOf(locked);
  const draft = draftOf(locked, packet);
  const transition = contentTransition(action, draft, packet);
  if (transition === null) return { kind: "unavailable_at_w0" };

  if (transition.outcome === "evidence_unavailable") {
    return { kind: "evidence_unavailable", field: transition.field };
  }
  if (transition.outcome === "conflict_requires_human") {
    return { kind: "conflict_requires_human" };
  }
  if (transition.outcome === "no_change") {
    return {
      kind: "no_change",
      consentCoordinate: null,
      updatedFields: [],
    };
  }

  return {
    kind: "commit",
    outcome: "action_applied",
    draft: transition.draft,
    revision: locked.revision + transition.applicationRevisionDelta,
    requirementsVersion:
      locked.requirementsVersion + transition.requirementsVersionDelta,
    consentRequestId: locked.consentRequestId,
    updatedFields: transition.updatedFields,
  };
}

function contentTransition(
  action: HumanAction,
  draft: ReturnType<typeof draftOf>,
  packet: ReturnType<typeof parsedPacketOf>,
): DraftTransitionResult | null {
  switch (action.action) {
    case "bind_evidence":
      return bindDraftEvidence({
        draft,
        packet,
        field: action.field,
        claimHandle: action.claimHandle,
        origin: "manual",
      });
    case "clear_evidence":
      return clearDraftEvidence({ draft, packet, field: action.field });
    case "clear_dependency":
      return clearDraftDependency(draft, packet);
    case "save_email":
      return saveDraftEmail(draft, packet, action.value);
    case "declare_email":
      return declareDraftEmail(draft, packet);
    case "resolve_income":
      return resolveDraftIncome({
        draft,
        packet,
        claimHandle: action.claimHandle,
        reason: action.reason,
      });
    case "clear_income_resolution":
      return clearDraftIncomeResolution(draft, packet);
    default:
      return null;
  }
}

function storedOutcome(
  action: HumanAction,
  plan: EffectPlan,
  versions: Readonly<{
    applicationRevision: number;
    requirementsVersion: number;
  }>,
): StoredOperationOutcome {
  if (plan.kind === "no_change") {
    if (action.action === "allow_assisted_access") {
      return {
        outcome: "no_change",
        action: action.action,
        consentCoordinate: plan.consentCoordinate ?? action.requestId,
        fields: [],
        versions,
      };
    }
    return {
      outcome: "no_change",
      action: action.action,
      fields: [],
      versions,
    };
  }
  if (plan.kind !== "commit") {
    throw new TypeError("Only committed or no-change plans carry an outcome.");
  }
  if (plan.outcome === "action_applied") {
    return {
      outcome: "action_applied",
      action: action.action,
      fields: [...plan.updatedFields],
      versions,
    };
  }
  return { outcome: plan.outcome, action: action.action, versions };
}

/**
 * Runs one human action under an already-held Application row lock. The
 * operation row is inserted before the state save, and a refused insert throws
 * so the surrounding transaction rolls the state change back with it.
 */
export async function runHumanAction(
  client: PoolClient,
  keyring: Keyring,
  locked: StoredApplication,
  action: HumanAction,
): Promise<ActionEffect> {
  if (!isW0SupportedAction(action.action)) {
    return { kind: "unavailable_at_w0" };
  }

  const digest = intentDigest(keyring, action);
  const replay = await classifyOperationReplay(
    client,
    locked.id,
    action.requestId,
    digest,
  );
  if (replay.kind === "mismatch") {
    return { kind: "request_reuse_mismatch" };
  }
  if (replay.kind === "exact") {
    return { kind: "replayed", operation: replay.operation };
  }

  if (!coordinatesAreCurrent(locked, action)) {
    return { kind: "stale_state" };
  }

  const plan = planEffect(locked, action);
  if (plan.kind === "unavailable_at_w0") {
    return { kind: "unavailable_at_w0" };
  }
  if (
    plan.kind === "evidence_unavailable" ||
    plan.kind === "conflict_requires_human"
  ) {
    // A refusal is a committed decision: it is recorded so a replayed identity
    // returns the same refusal instead of retrying the effect.
    await recordOperation(client, locked, action, digest, {
      outcome: plan.kind,
      action: action.action,
      field:
        plan.kind === "conflict_requires_human"
          ? "annual_household_income"
          : plan.field,
      versions: versionsOf(locked),
    });
    return plan.kind === "evidence_unavailable"
      ? { kind: "evidence_unavailable" }
      : { kind: "conflict_requires_human" };
  }

  const versions =
    plan.kind === "commit"
      ? {
          applicationRevision: plan.revision,
          requirementsVersion: plan.requirementsVersion,
        }
      : versionsOf(locked);

  await recordOperation(
    client,
    locked,
    action,
    digest,
    storedOutcome(action, plan, versions),
  );

  if (plan.kind === "no_change") {
    return {
      kind: "applied",
      outcome: "no_change",
      application: locked,
      consentCapability:
        action.action === "allow_assisted_access"
          ? deriveConsentCapability(keyring, locked)
          : null,
    };
  }

  const application = await saveLockedApplicationState(client, {
    id: locked.id,
    draft: plan.draft,
    stage: locked.stage,
    revision: plan.revision,
    requirementsVersion: plan.requirementsVersion,
    pageEpoch: locked.pageEpoch,
    pageBootstrapRequestId: locked.pageBootstrapRequestId,
    pageBootstrapRequestDigest: locked.pageBootstrapRequestDigest,
    consentRequestId: plan.consentRequestId,
    currentReviewId: locked.currentReviewId,
  });

  return {
    kind: "applied",
    outcome: plan.outcome,
    application,
    consentCapability:
      plan.outcome === "assistance_allowed"
        ? deriveConsentCapability(keyring, application)
        : null,
  };
}

function versionsOf(application: StoredApplication) {
  return {
    applicationRevision: application.revision,
    requirementsVersion: application.requirementsVersion,
  };
}

export class OperationLedgerError extends Error {
  constructor(reason: "request_reuse_mismatch" | "hard_limit") {
    super(`The operation ledger refused this effect: ${reason}.`);
    this.name = "OperationLedgerError";
  }
}

/**
 * A refused ledger insert throws rather than returning, so the caller's
 * transaction can never commit an effect the ledger does not record.
 */
async function recordOperation(
  client: PoolClient,
  application: StoredApplication,
  action: HumanAction,
  keyedIntentDigest: Uint8Array,
  outcome: StoredOperationOutcome,
): Promise<void> {
  const recorded = await insertOperation(client, {
    applicationId: application.id,
    requestId: action.requestId,
    action: action.action as OperationAction,
    keyedIntentDigest,
    outcome,
  });
  if (recorded.kind === "request_reuse_mismatch") {
    throw new OperationLedgerError("request_reuse_mismatch");
  }
  if (recorded.kind === "hard_limit") {
    throw new OperationLedgerError("hard_limit");
  }
}

/**
 * A takeover installs a fresh page coordinate, closes any assisted access held
 * by the previous page, and counts as one committed non-requirements effect.
 */
export async function runPageTakeover(
  client: PoolClient,
  locked: StoredApplication,
  requestId: string,
  requestDigest: Uint8Array,
): Promise<StoredApplication> {
  return saveLockedApplicationState(client, {
    id: locked.id,
    draft: locked.draft,
    stage: locked.stage,
    revision: locked.revision + 1,
    requirementsVersion: locked.requirementsVersion,
    pageEpoch: locked.pageEpoch + 1,
    pageBootstrapRequestId: requestId,
    pageBootstrapRequestDigest: requestDigest,
    consentRequestId: null,
    currentReviewId: locked.currentReviewId,
  });
}

export async function relockApplication(
  client: PoolClient,
  applicationId: string,
): Promise<StoredApplication | null> {
  return lockApplicationById(client, applicationId);
}

export function newRequestId(): string {
  return randomUUID();
}
