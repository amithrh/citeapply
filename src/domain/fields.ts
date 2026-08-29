import {
  EVIDENCE_FIELD_IDS,
  FIELD_IDS,
  type EvidenceField,
  type FieldId,
} from "../contracts/common.ts";
import {
  STATIC_REQUIREMENTS,
  type StaticRequirement,
} from "../contracts/webmcp.ts";

export const FIELD_ORDER = FIELD_IDS;
export const EVIDENCE_FIELD_ORDER = EVIDENCE_FIELD_IDS;

export const CONDITIONAL_FIELD_IDS = [
  "guardian_name",
  "household_size",
] as const satisfies readonly FieldId[];

export type ConditionalFieldId = (typeof CONDITIONAL_FIELD_IDS)[number];

export const FIELD_REQUIREMENTS = STATIC_REQUIREMENTS;

const CONDITIONAL_FIELDS = new Set<FieldId>(CONDITIONAL_FIELD_IDS);
const EVIDENCE_FIELDS = new Set<FieldId>(EVIDENCE_FIELD_IDS);
const REQUIREMENT_BY_FIELD = new Map<FieldId, StaticRequirement>(
  FIELD_REQUIREMENTS.map((requirement) => [requirement.field, requirement]),
);

export function isConditionalField(
  field: FieldId,
): field is ConditionalFieldId {
  return CONDITIONAL_FIELDS.has(field);
}

export function isEvidenceField(field: FieldId): field is EvidenceField {
  return EVIDENCE_FIELDS.has(field);
}

export function requirementForField(field: FieldId): StaticRequirement {
  const requirement = REQUIREMENT_BY_FIELD.get(field);
  if (requirement === undefined) {
    throw new Error(`No requirement is registered for field ${field}.`);
  }
  return requirement;
}

export function activeFieldIds(
  dependencyIsSaved: boolean,
): readonly FieldId[] {
  return FIELD_ORDER.filter(
    (field) => dependencyIsSaved || !isConditionalField(field),
  );
}

export function activeEvidenceFieldIds(
  dependencyIsSaved: boolean,
): readonly EvidenceField[] {
  return activeFieldIds(dependencyIsSaved).filter(isEvidenceField);
}

export function isFieldActive(
  field: FieldId,
  dependencyIsSaved: boolean,
): boolean {
  return dependencyIsSaved || !isConditionalField(field);
}
