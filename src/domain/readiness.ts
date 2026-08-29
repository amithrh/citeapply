import {
  DomainReadinessBlockersSchema,
  type DomainReadinessBlocker,
  type EvidenceField,
} from "../contracts/common.ts";
import {
  type DraftAggregateV1,
  activeDraftFieldIds,
} from "./draft.ts";
import { EVIDENCE_FIELD_ORDER } from "./fields.ts";

export type DraftReadinessV1 = Readonly<{
  progress: Readonly<{
    ready: number;
    total: 6 | 8;
  }>;
  blockers: readonly Readonly<DomainReadinessBlocker>[];
}>;

function deepFreezeJson<const T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  for (const child of Object.values(value)) deepFreezeJson(child);
  return Object.isFrozen(value) ? value : Object.freeze(value);
}

function missingEvidenceBlocker(
  field: EvidenceField,
): DomainReadinessBlocker {
  return {
    code: "missing_evidence",
    field,
    message: "Required evidence is not linked.",
    action: "reread_state_and_requirements",
  };
}

function activeTotal(draft: DraftAggregateV1): 6 | 8 {
  const total = activeDraftFieldIds(draft).length;
  if (total === 6 || total === 8) return total;
  throw new TypeError("Draft active-field cardinality is invalid.");
}

export function evaluateDraftReadiness(
  draft: DraftAggregateV1,
): DraftReadinessV1 {
  const activeFields = new Set(activeDraftFieldIds(draft));
  const blockers: DomainReadinessBlocker[] = [];

  for (const field of EVIDENCE_FIELD_ORDER) {
    if (!activeFields.has(field)) continue;
    const savedField = draft.fields.find(
      (candidate) => candidate.field === field,
    );
    if (savedField === undefined) {
      throw new TypeError("Draft field tuple is incomplete.");
    }
    if (savedField.status === "missing") {
      blockers.push(missingEvidenceBlocker(field));
    }
  }

  const income = draft.fields[7];
  if (income.status === "conflict") {
    blockers.push({
      code: "conflict_requires_human",
      field: "annual_household_income",
      message: "Income sources disagree. Resolve this in CiteApply.",
      action: "resolve_in_visible_application",
    });
  }

  const email = draft.fields[3];
  if (email.status === "missing") {
    blockers.push({
      code: "invalid_email",
      field: "preferred_contact_email",
      message: "Save a valid synthetic .test email in CiteApply.",
      action: "use_visible_application",
    });
  } else if (email.status === "needs_declaration") {
    blockers.push({
      code: "declaration_required",
      field: "preferred_contact_email",
      message: "Declare the saved synthetic email in CiteApply.",
      action: "use_visible_application",
    });
  }

  const parsedBlockers = DomainReadinessBlockersSchema.parse(blockers);
  const total = activeTotal(draft);
  const ready = draft.fields.filter(
    (field) => activeFields.has(field.field) && field.status === "ready",
  ).length;
  if (ready + parsedBlockers.length !== total) {
    throw new TypeError("Draft readiness is inconsistent with saved field state.");
  }

  return deepFreezeJson({
    progress: { ready, total },
    blockers: parsedBlockers,
  });
}
