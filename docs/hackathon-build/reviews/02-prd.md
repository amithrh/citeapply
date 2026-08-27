# G2 Review — Product Requirements

Date: 2026-08-27  
Artifact: `docs/hackathon-build/prd.md`  
Status: Passed

## Review Panel

| Perspective | Initial verdict | Recheck |
|---|---|---|
| Product, UX, accessibility, buyer/community | Conditional pass | Pass |
| Security, privacy, state, and black-box testability | Conditional | Pass |
| Devpost judge and scope enforcement | Conditional | Pass |

## Findings And Dispositions

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| G2-01 | P0 | Income was conditional on guardian dependency, allowing an independent applicant to avoid all financial evidence. | Resolved. Annual household income is required and initially visible for every applicant; only guardian name and household size are conditional. |
| G2-02 | P0 | Consent covered only the evidence index, leaving form state, conflicts, validation, declarations, or review tools as possible value-exfiltration paths. | Resolved. PRD defines always-available non-value metadata, consent-gated value-bearing outputs, and human-UI-only source snippets/complete review diff; every registered tool is tested before/after consent and revocation. |
| G2-03 | P0 | Consent wording implied control over a privileged external browser client. | Resolved. Consent governs CiteApply's structured WebMCP disclosure only and explicitly cannot revoke separate browser/extension permission or erase data already observed/returned. |
| G2-04 | P0 | Editing a source-linked value could leave a mismatching allowed claim attached. | Resolved. Any mismatch removes the binding/status, increments state, invalidates review/confirmation, records history, and blocks readiness until a claim is explicitly reselected. Declared edits invalidate declarations. |
| G2-05 | P1 | One-read/one-mutation feasibility was too weak to prove non-trivial WebMCP leverage. | Resolved. That is now spike-only. Final acceptance requires requirements/evidence reads, independently composed bindings, versioned apply, branch re-read, and behavior change after structured conflict/stale state; no precomputed assignment tool is allowed. |
| G2-06 | P1 | Bulk removal, starting another submitted session, and exhaustive bespoke substate copy expanded the locked deadline slice. | Resolved. Bulk removal and post-submission restart/delete are post-v1. Required copy is organized by six state families with a consistent outcome/preservation/submission/next-action contract. |
| G2-07 | P1 | Conditional-branch closure could leak or silently preserve inactive sensitive values. | Resolved. Inactive fields cannot be mutated or submitted. Closing a populated branch requires visible human confirmation, clears values/bindings, increments version, and reopens empty. |
| G2-08 | P1 | Declaration email could look agent-invented. | Resolved. The recorded synthetic user prompt supplies the exact `.test` email; absent that instruction, the agent must leave it missing. Human UI still creates the declaration. |
| G2-09 | P1 | Consent-revocation/cancellation/reset races lacked deterministic outcomes. | Resolved. No protected late response or pre-commit mutation survives revocation/cancel/reset; a fully committed atomic mutation remains visibly attributed; reset invalidates every handle/request/review/approval. |
| G2-10 | P1 | Expired, cancelled, wrong-version, wrong-session, and used confirmation outcomes were ambiguous. | Resolved. Each reason now maps to Review prepared, Draft, unchanged legitimate session, or existing Submitted receipt with Submit disabled where required. |
| G2-11 | P1 | Refresh/resume did not specify prepared, confirmed, checking, and submitted recovery. | Resolved. Current review may reconstruct; visible confirmation never silently survives a page refresh; checking resumes without duplicate Submit; accepted submission restores only the receipt. |
| G2-12 | P1 | Reset, delete, new application, and submitted receipt lifecycle were conflated. | Resolved. V1 Reset draft is pre-submission only. Submitted state is locked to view/export/print until automatic expiry; new-demo/delete actions are post-v1. |
| G2-13 | P1 | Receipt/export could include source bodies, approval material, inactive fields, or diagnostics. | Resolved. All representations contain the same active submitted semantic record and exclude those categories; export failure cannot alter/retry submission. |
| G2-14 | P1 | Receipt called an immutable snapshot without cryptographic guarantees. | Resolved. It is a persisted accepted snapshot locked against further editing through the product; no cryptographic/authenticity/certification claim. |
| G2-15 | P1 | Accessibility gates allowed moderate A/AA failures and conflicted with confirmation expiry. | Resolved. Each of five named stages blocks on any known WCAG 2.2 A/AA failure, with keyboard and named screen-reader/browser checks; expiry preserves data and supports reconfirmation. |
| G2-16 | P1 | Video proof conflated conflict demo with exhaustive regression evidence. | Resolved. Video proof and repository/test evidence are separate, and claims require linked reproducible evidence. |
| G2-17 | P1 | Manual/WebMCP paths and packet switching were underspecified. | Resolved. Manual source selection follows identical policy; packet/reset is destructively confirmed and invalidates all dependent state/handles. |
| G2-18 | P1 | Submission-outcome ambiguity could invite blind retry. | Resolved. **Submission checking** suppresses duplicate action and reconciles the original request before returning receipt or a proven-not-submitted confirmed review. |
| G2-19 | P2 | Equal normalized values, status terminology, and exact accessibility enumeration needed precision. | Resolved. Equal values do not conflict; income-record priority is deterministic with both sources preserved; stale is only an operation result; all five stages are named. |
| G2-20 | P2 | Same-parser/no-bypass claims are not screenshot-observable. | Resolved. Behavioral tests, modified-hash/parser-failure cases, and public-source inspection are required supplementary evidence. |

## Locked Product Contract

- Exactly ten possible fields, one guardian-dependency branch, and income required in every branch.
- Exactly two three-PDF synthetic packets processed by the same deterministic text parser.
- One declaration-allowed field whose value is supplied explicitly in the demo prompt and confirmed only through the normal UI.
- Value-bearing WebMCP disclosure is session-consented; source excerpts and the complete review diff remain human-UI-only.
- No WebMCP declaration, conflict-resolution, confirmation, or submission action.
- One submitted application and matching persisted receipt per accepted idempotent request.

## Final Gate Decision

**Passed.** All three independent reviewers confirmed that every material finding is resolved. The PRD is locked as the observable product contract, the state/status/journal agree, and G3 may start.
