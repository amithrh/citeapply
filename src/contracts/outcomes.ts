import { z } from "zod";

import {
  AgentUnsavedChangesBlockerSchema,
  NonEmptyDomainReadinessBlockersSchema,
  SupportReferenceSchema,
  VersionsSchema,
} from "./common.ts";

function failureSchema<const T extends z.ZodRawShape>(error: T) {
  return z
    .object({ ok: z.literal(false), error: z.object(error).strict() })
    .strict();
}

export const SessionExpiredFailureSchema = failureSchema({
  code: z.literal("session_expired"),
  message: z.literal("This synthetic session has expired."),
  safeActions: z.tuple([z.literal("start_new_synthetic_demo")]),
});

export const StalePageFailureSchema = failureSchema({
  code: z.literal("stale_page"),
  message: z.literal("This page is no longer current."),
  safeActions: z.tuple([z.literal("reload_current_application")]),
});

export const ConsentRequiredFailureSchema = failureSchema({
  code: z.literal("consent_required"),
  message: z.literal("Use the visible CiteApply application to continue."),
  safeActions: z.tuple([z.literal("use_visible_application")]),
});

export const StaleStateFailureSchema = failureSchema({
  code: z.literal("stale_state"),
  message: z.literal("The saved application changed."),
  safeActions: z.tuple([z.literal("reread_state_and_requirements")]),
  currentVersions: VersionsSchema,
});

export const RequestReuseMismatchFailureSchema = failureSchema({
  code: z.literal("request_reuse_mismatch"),
  message: z.literal("That request identity was already used differently."),
  safeActions: z.tuple([z.literal("reread_state_and_requirements")]),
});

export const EvidenceUnavailableFailureSchema = failureSchema({
  code: z.literal("evidence_unavailable"),
  message: z.literal(
    "That evidence is not currently available for this field.",
  ),
  safeActions: z.tuple([z.literal("reread_state_and_requirements")]),
});

export const ConflictRequiresHumanFailureSchema = failureSchema({
  code: z.literal("conflict_requires_human"),
  message: z.literal("Income sources disagree. Resolve this in CiteApply."),
  safeActions: z.tuple([z.literal("resolve_in_visible_application")]),
});

export const AgentPrepareReviewBlockersSchema = z.union([
  NonEmptyDomainReadinessBlockersSchema,
  z.tuple([AgentUnsavedChangesBlockerSchema]),
]);

export const NotReadyForReviewFailureSchema = failureSchema({
  code: z.literal("not_ready_for_review"),
  message: z.literal("The application is not ready for Review."),
  safeActions: z.tuple([z.literal("use_visible_application")]),
  blockers: AgentPrepareReviewBlockersSchema,
});

export const ReviewInvalidatedFailureSchema = failureSchema({
  code: z.literal("review_invalidated"),
  message: z.literal("That Review is no longer current."),
  safeActions: z.tuple([z.literal("reread_state_and_requirements")]),
});

export const DemoChangeLimitFailureSchema = failureSchema({
  code: z.literal("demo_change_limit"),
  message: z.literal(
    "That change was not saved. Continue the remaining application steps or start a new synthetic demo.",
  ),
  safeActions: z.tuple([
    z.literal("use_visible_application"),
    z.literal("start_new_synthetic_demo"),
  ]),
});

export const InvalidRequestFailureSchema = failureSchema({
  code: z.literal("invalid_request"),
  message: z.literal("The request is not valid."),
  safeActions: z.tuple([z.literal("use_visible_application")]),
});

export const RateLimitedFailureSchema = failureSchema({
  code: z.literal("rate_limited"),
  message: z.literal("Please wait before trying again."),
  safeActions: z.tuple([z.literal("try_again_after_delay")]),
  retryAfterSeconds: z.number().int().safe().min(1),
});

export const SharedFailureSchema = z.union([
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  ConsentRequiredFailureSchema,
  StaleStateFailureSchema,
  RequestReuseMismatchFailureSchema,
  EvidenceUnavailableFailureSchema,
  ConflictRequiresHumanFailureSchema,
  NotReadyForReviewFailureSchema,
  ReviewInvalidatedFailureSchema,
  DemoChangeLimitFailureSchema,
  InvalidRequestFailureSchema,
  RateLimitedFailureSchema,
]);

export type SharedFailure = z.infer<typeof SharedFailureSchema>;
export type SharedFailureCode = SharedFailure["error"]["code"];
export type SharedOnly<C extends SharedFailureCode> = Extract<
  SharedFailure,
  { error: { code: C } }
>;

export const AtCapacityFailureSchema = failureSchema({
  code: z.literal("at_capacity"),
  message: z.literal("At capacity."),
  safeActions: z.tuple([z.literal("try_again_after_delay")]),
  retryAfterSeconds: z.number().int().safe().min(1),
});

export const DocumentUnavailableFailureSchema = failureSchema({
  code: z.literal("document_unavailable"),
  message: z.literal("A synthetic document could not be accepted."),
  document: z.enum(["enrollment", "household", "income"]),
  safeActions: z.tuple([z.literal("return_to_packet_selection")]),
});

export const StartInvalidRequestFailureSchema = failureSchema({
  code: z.literal("invalid_request"),
  message: z.literal(
    "This synthetic application could not be started from that request.",
  ),
  safeActions: z.tuple([z.literal("return_to_packet_selection")]),
});

export const StartRequestReuseMismatchFailureSchema = failureSchema({
  code: z.literal("request_reuse_mismatch"),
  message: z.literal(
    "This synthetic application could not be started from that request.",
  ),
  safeActions: z.tuple([z.literal("return_to_packet_selection")]),
});

export const StartUnavailableFailureSchema = failureSchema({
  code: z.literal("temporarily_unavailable"),
  message: z.literal("CiteApply could not start this synthetic application."),
  supportReference: SupportReferenceSchema,
  safeActions: z.tuple([z.literal("return_to_packet_selection")]),
});

export const StartFailureSchema = z.union([
  AtCapacityFailureSchema,
  DocumentUnavailableFailureSchema,
  StartInvalidRequestFailureSchema,
  StartRequestReuseMismatchFailureSchema,
  StartUnavailableFailureSchema,
]);

export const MutationUnavailableSchema = failureSchema({
  code: z.literal("temporarily_unavailable"),
  message: z.literal(
    "CiteApply could not confirm this action. Checking the latest application.",
  ),
  supportReference: SupportReferenceSchema,
  safeActions: z.tuple([z.literal("reconcile_current_state")]),
});

export const ReadUnavailableSchema = failureSchema({
  code: z.literal("temporarily_unavailable"),
  message: z.literal("CiteApply is temporarily unavailable."),
  supportReference: SupportReferenceSchema,
  safeActions: z.tuple([z.literal("use_visible_application")]),
});

export const BridgeInactiveFailureSchema = failureSchema({
  code: z.literal("assistance_unavailable"),
  message: z.literal("Assisted access is not active on this page."),
  safeActions: z.tuple([z.literal("use_visible_application")]),
});

export const ConnectionUnavailableSchema = failureSchema({
  code: z.literal("temporarily_unavailable"),
  message: z.literal("CiteApply could not establish the latest state."),
  supportReference: SupportReferenceSchema,
  safeActions: z.tuple([z.literal("reload_current_application")]),
});

export const DemoTokenUnavailableSchema = failureSchema({
  code: z.literal("temporarily_unavailable"),
  message: z.literal("CiteApply could not prepare a synthetic start."),
  supportReference: SupportReferenceSchema,
  safeActions: z.tuple([z.literal("return_to_packet_selection")]),
});

export const ReceiptUnavailableSchema = failureSchema({
  code: z.literal("temporarily_unavailable"),
  message: z.literal(
    "Your submission remains accepted, but the receipt could not be loaded.",
  ),
  supportReference: SupportReferenceSchema,
  safeActions: z.tuple([z.literal("load_receipt_again")]),
});

export const ExportUnavailableSchema = failureSchema({
  code: z.literal("temporarily_unavailable"),
  message: z.literal(
    "Your submission remains accepted, but the receipt export could not be prepared.",
  ),
  supportReference: SupportReferenceSchema,
  safeActions: z.tuple([z.literal("retry_export")]),
});

export const HumanNotReadyFailureSchema = failureSchema({
  code: z.literal("not_ready_for_review"),
  message: z.literal("The application is not ready for Review."),
  safeActions: z.tuple([z.literal("use_visible_application")]),
  blockers: NonEmptyDomainReadinessBlockersSchema,
});

export type StartFailure = z.infer<typeof StartFailureSchema>;
export type MutationUnavailable = z.infer<typeof MutationUnavailableSchema>;
export type ReadUnavailable = z.infer<typeof ReadUnavailableSchema>;
export type BridgeInactiveFailure = z.infer<typeof BridgeInactiveFailureSchema>;
export type ConnectionUnavailable = z.infer<typeof ConnectionUnavailableSchema>;
export type DemoTokenUnavailable = z.infer<typeof DemoTokenUnavailableSchema>;
export type ReceiptUnavailable = z.infer<typeof ReceiptUnavailableSchema>;
export type ExportUnavailable = z.infer<typeof ExportUnavailableSchema>;
export type HumanNotReadyFailure = z.infer<typeof HumanNotReadyFailureSchema>;

export const ServerFailureSchema = z.union([
  SharedFailureSchema,
  StartFailureSchema,
  MutationUnavailableSchema,
  ReadUnavailableSchema,
  ConnectionUnavailableSchema,
  DemoTokenUnavailableSchema,
  ReceiptUnavailableSchema,
  ExportUnavailableSchema,
]);

export type ServerFailure = z.infer<typeof ServerFailureSchema>;

export function httpStatusForFailure(
  failure: ServerFailure,
): 400 | 403 | 409 | 429 | 503 {
  switch (failure.error.code) {
    case "invalid_request":
      return 400;
    case "session_expired":
    case "stale_page":
    case "consent_required":
      return 403;
    case "rate_limited":
    case "at_capacity":
      return 429;
    case "temporarily_unavailable":
      return 503;
    default:
      return 409;
  }
}
