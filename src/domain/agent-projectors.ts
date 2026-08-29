import {
  AgentReadinessBlockersSchema,
  type AgentReadinessBlocker,
  type FieldId,
  type ParsedPacketV1,
  type Versions,
} from "../contracts/common.ts";
import {
  ActiveRequirementsSchema,
  ApplySuccessSchema,
  EvidenceIndexSchema,
  PrepareSuccessSchema,
  ProtectedStateSchema,
  RedactedStateSchema,
  STATIC_REQUIREMENTS,
  StaticRequirementsSchema,
  ValidationIssuesSchema,
} from "../contracts/webmcp.ts";
import { type DraftAggregateV1, activeDraftFieldIds } from "./draft.ts";
import { FIELD_ORDER } from "./fields.ts";
import { evaluateDraftReadiness } from "./readiness.ts";

type RedactedState = ReturnType<typeof RedactedStateSchema.parse>;
type ProtectedState = ReturnType<typeof ProtectedStateSchema.parse>;
type StaticRequirements = ReturnType<typeof StaticRequirementsSchema.parse>;
type ActiveRequirements = ReturnType<typeof ActiveRequirementsSchema.parse>;
type EvidenceIndex = ReturnType<typeof EvidenceIndexSchema.parse>;
type ValidationIssues = ReturnType<typeof ValidationIssuesSchema.parse>;
type ApplySuccess = ReturnType<typeof ApplySuccessSchema.parse>;
type PrepareSuccess = ReturnType<typeof PrepareSuccessSchema.parse>;

export type {
  ActiveRequirements,
  ApplySuccess,
  EvidenceIndex,
  PrepareSuccess,
  ProtectedState,
  RedactedState,
  StaticRequirements,
  ValidationIssues,
};

/**
 * Assisted attribution is carried per projection call rather than stored on the
 * draft, so a later manual edit of the same field cannot inherit the marker.
 */
export type AssistedAttribution = ReadonlySet<FieldId>;

const EMPTY_ATTRIBUTION: AssistedAttribution = Object.freeze(
  new Set<FieldId>(),
);

function assistedMarker(
  field: FieldId,
  attribution: AssistedAttribution,
): { updatedThroughAssistance?: true } {
  return attribution.has(field) ? { updatedThroughAssistance: true } : {};
}

export function projectRedactedState(): RedactedState {
  return RedactedStateSchema.parse({
    access: "consent_required",
    safeActions: ["use_visible_application"],
  });
}

type DraftFields = DraftAggregateV1["fields"];

function projectAgentField(
  saved: DraftFields[number],
  attribution: AssistedAttribution,
): unknown {
  const marker = assistedMarker(saved.field, attribution);

  if (saved.status === "missing") {
    return { field: saved.field, status: "missing" };
  }

  if (saved.field === "preferred_contact_email") {
    if (saved.status === "needs_declaration") {
      return {
        field: saved.field,
        status: "needs_declaration",
        value: saved.value,
        ...marker,
      };
    }
    return {
      field: saved.field,
      status: "ready",
      value: saved.value,
      humanActionComplete: true,
      ...marker,
    };
  }

  if (saved.field === "annual_household_income") {
    if (saved.status === "conflict") {
      return { field: saved.field, status: "needs_human_action" };
    }
    if (saved.resolution === "source_supported") {
      return {
        field: saved.field,
        status: "ready",
        resolution: "source_supported",
        value: saved.value,
        ...marker,
      };
    }
    // A human-resolved conflict never exposes the chosen value or reason.
    return {
      field: saved.field,
      status: "ready",
      resolution: "human_completed",
      humanActionComplete: true,
    };
  }

  return { field: saved.field, status: "ready", value: saved.value, ...marker };
}

export function projectProtectedState(
  draft: DraftAggregateV1,
  versions: Versions,
  attribution: AssistedAttribution = EMPTY_ATTRIBUTION,
): ProtectedState {
  const active = new Set(activeDraftFieldIds(draft));
  const fields = draft.fields
    .filter((saved) => active.has(saved.field))
    .map((saved) => projectAgentField(saved, attribution));
  const ready = draft.fields.filter(
    (saved) => active.has(saved.field) && saved.status === "ready",
  ).length;

  return ProtectedStateSchema.parse({
    applicationRevision: versions.applicationRevision,
    requirementsVersion: versions.requirementsVersion,
    stage: "draft",
    assistance: "allowed",
    activeFieldCount: fields.length,
    readyFieldCount: ready,
    blockerCount: fields.length - ready,
    fields,
    safeActions: ["use_visible_application"],
  });
}

export function projectStaticRequirements(): StaticRequirements {
  return StaticRequirementsSchema.parse(STATIC_REQUIREMENTS);
}

export function projectActiveRequirements(
  draft: DraftAggregateV1,
  versions: Versions,
): ActiveRequirements {
  const active = new Set(activeDraftFieldIds(draft));
  return ActiveRequirementsSchema.parse({
    applicationRevision: versions.applicationRevision,
    requirementsVersion: versions.requirementsVersion,
    fields: STATIC_REQUIREMENTS.filter((requirement) =>
      active.has(requirement.field),
    ).map((requirement) => ({ ...requirement, active: true })),
  });
}

export function projectEvidenceIndex(packet: ParsedPacketV1): EvidenceIndex {
  return EvidenceIndexSchema.parse({
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
  });
}

export function projectValidationIssues(
  draft: DraftAggregateV1,
  versions: Versions,
  localDirty: boolean,
): ValidationIssues {
  const domain = evaluateDraftReadiness(draft).blockers;
  const blockers: AgentReadinessBlocker[] = [...domain];
  if (localDirty) {
    blockers.push({
      code: "unsaved_changes",
      message: "Save or discard visible changes before Review.",
      action: "use_visible_application",
    });
  }
  return ValidationIssuesSchema.parse({
    applicationRevision: versions.applicationRevision,
    requirementsVersion: versions.requirementsVersion,
    blockers: AgentReadinessBlockersSchema.parse(blockers),
  });
}

const FIELD_INDEX = new Map<FieldId, number>(
  FIELD_ORDER.map((field, index) => [field, index]),
);

export function projectApplySuccess(
  versions: Versions,
  updatedFields: readonly FieldId[],
): ApplySuccess {
  const canonical = [...new Set(updatedFields)].sort(
    (left, right) =>
      (FIELD_INDEX.get(left) ?? -1) - (FIELD_INDEX.get(right) ?? -1),
  );
  return ApplySuccessSchema.parse({
    applicationRevision: versions.applicationRevision,
    requirementsVersion: versions.requirementsVersion,
    updatedFields: canonical,
    rereadRequirements: canonical.includes("dependency"),
  });
}

export function projectPrepareSuccess(
  versions: Versions,
  reviewRef: string,
): PrepareSuccess {
  return PrepareSuccessSchema.parse({
    applicationRevision: versions.applicationRevision,
    requirementsVersion: versions.requirementsVersion,
    readiness: "ready",
    reviewRef,
  });
}
