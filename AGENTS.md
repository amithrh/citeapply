# CiteApply Agent Operating Contract

## Mission

Build and verify a winning-quality, honest WebMCP product that helps applicants complete a fictional education-aid application with source-linked answers, explicit conflicts, visible human authority, and an auditable receipt.

Quality means complete behavior, proportionate security, accessibility, real-client proof, and truthful claims. It does not mean maximizing protocol or feature breadth.

## Current Gate

- G3 failed because the prior 75,417-word technical candidate could not be implemented and verified inside the quality window.
- Replacement G1 passed after unanimous product/UX, engineering/security/test, and judge recheck. `docs/hackathon-build/scope.md` is the locked bounded contract.
- Replacement G2 passed after five exact-content review cycles plus unanimous final content and metadata-hash proof. `docs/hackathon-build/prd.md` is the locked behavioral contract.
- G3 is active next: regenerate a clean technical specification from locked G1/G2; do not patch the historical oversized specification into compliance.
- The prior oversized `spec.md` content and `reviews/03-spec.md` are historical design/review evidence, not implementation contracts.
- Do not scaffold or implement application code until replacement G3 and G4 each pass their independent review gates.
- If a later artifact exceeds a replacement scope cap, reopens a named cut, or contradicts the approved product boundary, stop and reopen capacity review.

## Sources Of Truth

Read these before acting, in order:

1. `.devpost-hackathon-state.json`
2. `docs/hackathon-build/status.md`
3. `docs/hackathon-build/scope.md`
4. The current replacement artifacts once approved: `prd.md`, then `spec.md`, then `checklist.md`
5. `docs/hackathon-build/build-notes.md`
6. The current stage review under `docs/hackathon-build/reviews/`

During the reopen, ignore architecture requirements that exist only in the failed long specification. If active documents disagree, do not implement; reconcile them and record the decision first.

## Replacement Product Boundary

- One owned fictional scholarship portal: Horizon Education Aid.
- Exactly eight fields, one guardian branch, two synthetic packets, three one-page PDFs per packet, and one deliberate income conflict.
- Exactly six semantic WebMCP tools, all registered once. Dynamic registration/removal is not committed behavior.
- One claimed primary external client/version, one complete manual fallback, and no arbitrary-site claim.
- At most three user page routes, eight API families, six product database tables, five real-PostgreSQL race families, and a replacement specification under 15,000 words. The approved starting witness uses three pages, six API families, five tables, and four race families; headroom is not permission to expand.
- No hackathon stretch features. New ideas stay in a post-submission backlog unless scope is formally reopened.

## Non-Negotiable Product Truths

- CiteApply supports participating, intentionally instrumented sites. Browser support does not add WebMCP to unmodified third-party websites.
- Public demos and fixtures use conspicuously synthetic data only. Never commit, upload, or request real applicant documents or personal data.
- Every committed PDF is parsed at runtime through the same bounded production adapter. Test goldens are oracles only and cannot be imported by production code.
- Evidence is an immutable source binding from parsed bytes, not an LLM-generated citation and not proof that a document or claim is authentic.
- Missing, conflicting, invalid, stale, or policy-disallowed support fails closed for the affected field.
- An agent may bind an allowed claim or propose an unresolved synthetic email. It cannot create a user declaration, resolve an evidence conflict, confirm, or submit.
- Only the visible applicant UI may declare the `.test` email, resolve the income conflict, and activate **Confirm and submit this review**.
- No WebMCP tool or agent-facing API may submit. Do not claim proof of personhood or immunity from privileged browser automation.
- The receipt screen, JSON, and print projection must derive from the same immutable accepted review snapshot.
- Draft must support manual **Review application**. Review must support **Return to application** as well as **Confirm and submit this review**; returning invalidates the review, preserves valid committed work, and leaves assistance closed.
- Sessions expire 60 minutes after creation and warn at minute 50. Receipt access is session-bounded; screen/JSON/print are semantic projections of one canonical record.
- Do not fake WebMCP calls, parsing, results, user research, customer interest, environmental impact, security guarantees, compatibility, or production readiness.

## Consent And Disclosure

- Tool visibility is not authorization. All six descriptors remain discoverable.
- A protected operation whose final server authorization occurs without current consent returns only value-free `consent_required` and performs no new protected disclosure or mutation.
- The page bridge injects the current page-memory consent capability outside agent-supplied arguments. The server reauthorizes the session, page, packet, handle, consent, and operation on every protected call.
- Exact source excerpts and the complete review diff stay in the normal human UI. Agent results remain bounded and least-disclosure.
- After applicant conflict resolution, every agent-facing state projection exposes readiness/human-action-complete only—never the resolved income, source, reason, history, canonical content hash, or deterministic digest. Assisted Review preparation returns only fresh opaque non-content-derived identity/readiness/current-version metadata. Six source/reason combinations must remain agent-output-indistinguishable after normalizing fresh identities/versions.
- Before Allow, accessible copy must enumerate included data categories, permitted actions, excluded data/actions, and the current page/session scope.
- Consent cannot retract returned or already-final-authorized in-flight information or control separate browser/extension permissions. A read authorized before Revoke/review-close/takeover may arrive afterward; authority-loss-first returns no protected result. UI copy and tests must say and prove this precisely.

## State And Submission Boundary

- One application page is authoritative per demo session. A refresh/newer tab takes over, preserves saved Draft/Review/Submitted state, clears consent and open confirmation UI, and makes the old page stale/read-only.
- Every mutation after demo creation uses the current epoch/revision, a request UUID, a canonical digest, application-row locking, strict validation, and server authority. Demo creation uses a bootstrap nonce/request identity.
- Current session/page/consent authority precedes idempotent replay projection. Same ID/same digest guarantees no duplicate effect and a stable committed outcome, not unconditional redisclosure; unauthorized retries return `consent_required` or `stale_page`. Same ID/different digest and stale versions fail closed.
- Native abort is graceful best effort only. Abort before dispatch makes no request; after server acceptance, either no mutation or one complete atomic mutation is allowed and authoritative state resolves the outcome. There is no durable cancel/rollback guarantee or cancellation control protocol.
- Public request throttling is a value-free no-lookup transport preflight outside protected authority precedence and may win first. A fresh admitted request after `Retry-After` follows session → page → consent → request/version → domain ordering; throttling creates no workflow state.
- Every edit invalidates the current review. Successful review preparation creates one immutable review and closes assisted access.
- Human confirmation and submission are one visible final UI action. The server verifies the exact review ID/hash/revision and page authority and creates at most one submission/receipt in one PostgreSQL transaction.
- A lost response is recovered by exact retry or refreshed authoritative bootstrap. Do not reintroduce two-phase intent, encrypted reconciliation, or persistent approval protocols.

## Stage-Gated Workflow

Do not implement outside the current approved checklist item.

A stage passes only when all of the following are true:

1. The artifact or implementation slice is complete.
2. Applicable automated and manual verification passes.
3. Independent product/UX, engineering/security/test, and Devpost-judge reviews inspect the exact artifact or commit.
4. Every P0/P1 finding is fixed or explicitly accepted with evidence and rationale.
5. The reviewer rechecks pass; a first-pass conditional verdict is not a gate pass.
6. `status.md`, the stage review, checklist, and `build-notes.md` record the exact evidence.

Never advance merely because code compiles or the happy path works. After implementation, review and test the completed slice before starting the next slice.

## Engineering Quality

- Prefer a small modular monolith, deterministic domain logic, strict schemas, and explicit state transitions.
- Pin the Node and dependency versions, commit the lockfile, use migrations, and run PostgreSQL in integration/CI tests.
- Treat PDFs, extracted text, WebMCP arguments, route bodies, URL parameters, stored browser state, and model output as untrusted.
- Verify committed PDF hashes and byte/page/text limits before claims commit. Instruction-like PDF text remains inert quoted data.
- Keep production parser imports independent from goldens and precomputed claim data; add a static import/bundle assertion.
- Keep document contents, source snippets, synthetic personal values, session/page/consent secrets, and raw request bodies out of logs, URLs, analytics, console output, and browser storage.
- Pass native cancellation signals to fetch, test the allowed abort outcome set, and never describe cancellation as transactional rollback or a durable server cancel.
- Preserve user work and unrelated changes. Never use destructive Git or filesystem commands without explicit authorization.
- Use current official documentation for fast-moving WebMCP, client, framework, and deployment behavior.

## Required Verification Lanes

- Parser/provenance: six real PDFs, hashes/limits, exact goldens/anchors, mutated-byte proof, no production-golden import.
- Domain unit: field policies, branch clear/reveal, canonical/corroborating income, conflict, email declaration, review hash/invalidation/re-preparation, active-field receipt.
- WebMCP contract: six descriptors/schemas/results/errors, informed-consent copy completeness, authority-before-replay, bounded outputs, visible mutations, human-only exclusions.
- PostgreSQL integration: demo admission/rate pruning/stale/replay; authority loss versus protected read/apply/prepare; edit/declaration/resolution versus review; submit versus edit/takeover/duplicate/response loss/receipt.
- Browser E2E: Supported agent path, Conflict agent+human path, complete manual Review/Return/re-review path, informed consent/revoke/in-flight outcomes, refresh/recovery, parser failure, session expiry, receipt semantic equality.
- Accessibility: keyboard, focus, semantics, errors, contrast, 320 px, 200% zoom, reduced motion, automated checks, and one named screen-reader pass.
- Security/privacy: Origin/Host/session/page checks, strict input/output caps, forged/cross-session handles, XSS-safe excerpts, and log/console/value canaries.
- Release: clean install/build/test, public repository/license, hosted clean-room path, exact external-client trace, and honest compatibility instructions.

Run the complete relevant suite and independent review before every gate.

## Capacity And No-Go Rules

- Current forecast separates 170 aggregate agent-hours P90 from 102 critical-path wall hours P90, then allocates 12 wall hours for external/user latency and 20 for remediation: 134 pre-freeze wall hours P90 plus a separate protected 24-hour release reserve.
- Rebase actual remaining wall time at G1 lock and G4. G4 passes only when remaining time before freeze covers remaining critical-path P90, unresolved external/user latency, and the 20-hour remediation reserve.
- The exact primary client and fixed-PDF parser portability proofs are the first post-G4 checkpoint and must pass within 12 critical-path wall hours. Three raw agent sequences must each finish within 120 seconds.
- A checkpoint slip over six critical-path hours, a failed capacity inequality, missed authorization deadline, or failure of the native-client/parser proof reopens scope immediately.
- Never recover by simulating WebMCP, using precomputed production claims, skipping accessibility/security tests, or making an unsupported success claim.

## Documentation Discipline

After every material change:

- update the active checklist item and verification evidence;
- append decisions and implementation notes to `docs/hackathon-build/build-notes.md`;
- update `docs/hackathon-build/status.md` to reflect reality; and
- record independent findings, dispositions, artifact hash/commit, commands, and results in `docs/hackathon-build/reviews/<stage>.md`.

Public name/license choice, deployment, paid provisioning, public-repository creation/push, origin configuration, Devpost mutation, external messaging, thumbnail/video upload, and final submission require explicit user authorization. Request the combined package immediately after G4; approval is required by `2026-08-30T20:00:00Z`, or the public-release plan becomes no-go.
