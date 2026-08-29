import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import type { HumanAction } from "../../contracts/http.ts";
import { bindDraftEvidence } from "../../domain/draft.ts";
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
import {
  draftOf,
  parsedPacketOf,
} from "./application.ts";

/**
 * The W0 kernel commits the visible spine: evidence binding and the two
 * assisted-access decisions. Manual clears, declaration, and conflict
 * resolution arrive with their domain transitions in W1 (units 4.14-4.19) and
 * are refused here as unavailable rather than silently accepted.
 */
export const W0_SUPPORTED_ACTIONS = [
  "bind_evidence",
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

type SaveInput = Readonly<{
  draft: unknown;
  revision: number;
  requirementsVersion: number;
  consentRequestId: string | null;
}>;

async function commit(
  client: PoolClient,
  application: StoredApplication,
  input: SaveInput,
): Promise<StoredApplication> {
  return saveLockedApplicationState(client, {
    id: application.id,
    draft: input.draft,
    stage: application.stage,
    revision: input.revision,
    requirementsVersion: input.requirementsVersion,
    pageEpoch: application.pageEpoch,
    pageBootstrapRequestId: application.pageBootstrapRequestId,
    pageBootstrapRequestDigest: application.pageBootstrapRequestDigest,
    consentRequestId: input.consentRequestId,
    currentReviewId: application.currentReviewId,
  });
}

/**
 * Runs one human action under an already-held Application row lock. Every exit
 * either commits exactly one effect with its operation row or commits nothing.
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

  const effect = await computeEffect(client, keyring, locked, action);
  if (
    effect.kind === "evidence_unavailable" ||
    effect.kind === "conflict_requires_human"
  ) {
    // A refusal is still a committed decision: it is recorded so a replayed
    // identity returns the same refusal instead of retrying the effect.
    await recordOperation(client, locked, action, digest, {
      outcome: effect.kind,
      action: action.action,
      field:
        effect.kind === "conflict_requires_human"
          ? "annual_household_income"
          : effect.field,
      versions: versionsOf(locked),
    });
    return effect.kind === "evidence_unavailable"
      ? { kind: "evidence_unavailable" }
      : { kind: "conflict_requires_human" };
  }
  if (effect.kind === "unavailable_at_w0") {
    return effect;
  }

  const recorded = await recordOperation(
    client,
    effect.application,
    action,
    digest,
    storedOutcome(action, effect),
  );
  if (recorded.kind === "request_reuse_mismatch") {
    return { kind: "request_reuse_mismatch" };
  }
  if (recorded.kind === "hard_limit") {
    return { kind: "unavailable_at_w0" };
  }

  return effect;
}

function versionsOf(application: StoredApplication) {
  return {
    applicationRevision: application.revision,
    requirementsVersion: application.requirementsVersion,
  };
}

function storedOutcome(
  action: HumanAction,
  effect: Extract<ComputedEffect, { kind: "applied" }>,
): StoredOperationOutcome {
  const versions = versionsOf(effect.application);

  if (action.action === "allow_assisted_access") {
    if (effect.outcome === "no_change") {
      return {
        outcome: "no_change",
        action: action.action,
        consentCoordinate: effect.application.consentRequestId ?? action.requestId,
        fields: [],
        versions,
      };
    }
    return { outcome: "assistance_allowed", action: action.action, versions };
  }

  if (action.action === "revoke_assisted_access") {
    if (effect.outcome === "no_change") {
      return {
        outcome: "no_change",
        action: action.action,
        fields: [],
        versions,
      };
    }
    return { outcome: "assistance_revoked", action: action.action, versions };
  }

  if (effect.outcome === "no_change") {
    return { outcome: "no_change", action: action.action, fields: [], versions };
  }
  return {
    outcome: "action_applied",
    action: action.action,
    fields: [effect.updatedField],
    versions,
  };
}

type ComputedEffect =
  | (Extract<ActionEffect, { kind: "applied" }> &
      Readonly<{ updatedField: string }>)
  | Readonly<{ kind: "evidence_unavailable"; field: string }>
  | Readonly<{ kind: "conflict_requires_human" }>
  | Readonly<{ kind: "unavailable_at_w0" }>;

async function computeEffect(
  client: PoolClient,
  keyring: Keyring,
  locked: StoredApplication,
  action: HumanAction,
): Promise<ComputedEffect> {
  if (action.action === "allow_assisted_access") {
    if (locked.consentRequestId !== null) {
      return {
        kind: "applied",
        outcome: "no_change",
        application: locked,
        consentCapability: deriveConsentCapability(keyring, locked),
        updatedField: "",
      };
    }
    const application = await commit(client, locked, {
      draft: locked.draft,
      revision: locked.revision + 1,
      requirementsVersion: locked.requirementsVersion,
      consentRequestId: action.requestId,
    });
    return {
      kind: "applied",
      outcome: "assistance_allowed",
      application,
      consentCapability: deriveConsentCapability(keyring, application),
      updatedField: "",
    };
  }

  if (action.action === "revoke_assisted_access") {
    if (locked.consentRequestId === null) {
      return {
        kind: "applied",
        outcome: "no_change",
        application: locked,
        consentCapability: null,
        updatedField: "",
      };
    }
    const application = await commit(client, locked, {
      draft: locked.draft,
      revision: locked.revision + 1,
      requirementsVersion: locked.requirementsVersion,
      consentRequestId: null,
    });
    return {
      kind: "applied",
      outcome: "assistance_revoked",
      application,
      consentCapability: null,
      updatedField: "",
    };
  }

  if (action.action !== "bind_evidence") {
    return { kind: "unavailable_at_w0" };
  }

  const packet = parsedPacketOf(locked);
  const transition = bindDraftEvidence({
    draft: draftOf(locked, packet),
    packet,
    field: action.field,
    claimHandle: action.claimHandle,
    origin: "manual",
  });

  if (transition.outcome === "evidence_unavailable") {
    return { kind: "evidence_unavailable", field: transition.field };
  }
  if (transition.outcome === "conflict_requires_human") {
    return { kind: "conflict_requires_human" };
  }
  if (transition.outcome === "no_change") {
    return {
      kind: "applied",
      outcome: "no_change",
      application: locked,
      consentCapability: null,
      updatedField: action.field,
    };
  }

  const application = await commit(client, locked, {
    draft: transition.draft,
    revision: locked.revision + transition.applicationRevisionDelta,
    requirementsVersion:
      locked.requirementsVersion + transition.requirementsVersionDelta,
    consentRequestId: locked.consentRequestId,
  });
  return {
    kind: "applied",
    outcome: "action_applied",
    application,
    consentCapability: null,
    updatedField: action.field,
  };
}

async function recordOperation(
  client: PoolClient,
  application: StoredApplication,
  action: HumanAction,
  keyedIntentDigest: Uint8Array,
  outcome: StoredOperationOutcome,
) {
  return insertOperation(client, {
    applicationId: application.id,
    requestId: action.requestId,
    action: action.action as OperationAction,
    keyedIntentDigest,
    outcome,
  });
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
