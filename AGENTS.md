# CiteApply Agent Operating Contract

## Mission

Build a winning-quality, honest, production-minded WebMCP product that helps people complete education-aid applications with source-linked answers, explicit uncertainty, human approval, and auditable receipts.

## Sources Of Truth

Read these before acting, in order:

1. `.devpost-hackathon-state.json`
2. `docs/hackathon-build/status.md`
3. `docs/hackathon-build/scope.md`
4. `docs/hackathon-build/prd.md`
5. `docs/hackathon-build/spec.md`
6. `docs/hackathon-build/checklist.md`
7. `docs/hackathon-build/build-notes.md`
8. The current stage review under `docs/hackathon-build/reviews/`

If these disagree, stop implementation, reconcile the documents, and record the decision in `build-notes.md`.

## Non-Negotiable Product Truths

- CiteApply supports participating, intentionally instrumented WebMCP sites. Never claim arbitrary-site support.
- Public demos and committed fixtures use synthetic data only. Never commit or upload real personal documents.
- Evidence is an immutable source binding, not an LLM-generated citation.
- Missing, conflicting, stale, or low-confidence evidence fails closed for the affected field.
- An agent can bind an allowed evidence claim or propose an unresolved value; it cannot create or impersonate a user declaration. Only the visible human UI can create a declaration where versioned field policy permits it.
- No WebMCP tool or agent-facing API may submit. Submission requires a visible, version-bound confirmation through the normal UI. Do not claim proof of personhood or immunity from privileged browser automation.
- WebMCP is the collaboration surface, not the authorization boundary. All sensitive actions require independent application checks.
- Do not fake integrations, results, user research, environmental impact, security guarantees, or production readiness.

## Stage-Gated Workflow

Do not implement outside the current approved checklist item.

A stage passes only when all of the following are true:

1. The stage artifact or implementation is complete.
2. Applicable automated and manual verification passes.
3. Independent product, engineering, security/privacy, test, and judge-perspective reviews are complete.
4. All material findings are fixed or explicitly accepted with rationale.
5. `status.md`, the stage review, the checklist, and `build-notes.md` contain the verification evidence.

Never move to the next stage merely because code compiles or the happy path works.

## Engineering Quality

- Prefer deterministic domain logic and explicit schemas over prompt-only behavior.
- Keep extraction/model adapters separate from provenance, validation, conflict, approval, and receipt logic.
- Pin dependencies and commit a lockfile.
- Add tests with each behavior, including failure and abuse cases.
- Treat document input, WebMCP tool arguments, URL parameters, stored browser state, and model output as untrusted.
- Do not log document contents, extracted PII, approval secrets, or sensitive form values.
- Register sensitive evidence tools only after explicit session consent; unregister them on revocation and re-authorize every handle server-side.
- Bind review approval to the exact session, application/policy version, canonical diff, expiry, and one-use submission request. Invalidate it on any mutation.
- The first implementation slice must prove real registration, discovery, invocation, cancellation, and visible mutation in the primary external WebMCP client before broader product work proceeds.
- Preserve user work and unrelated changes. Never use destructive Git or filesystem commands without explicit authorization.
- Use official documentation for fast-moving WebMCP and framework behavior.

## Required Verification Lanes

- Domain unit tests: schemas, provenance, conflicts, unsupported claims, stale state, approval binding, receipts.
- API/integration tests: ingestion through reviewed submission and receipt.
- WebMCP contract tests: tool discovery, schemas, state transitions, authorization, confirmation, failure behavior.
- Browser E2E: first run, happy path, missing evidence, conflict, correction, refresh/resume, review, submission, receipt.
- Accessibility: keyboard, focus, labels, errors, contrast, reduced motion, screen-reader semantics.
- Security/privacy: hostile documents, injection content, tenant boundaries, replay, idempotency, logging, retention.
- Regression: run the complete relevant suite before every gate.

## Documentation Discipline

After every material change:

- Update the current checklist item and verification evidence.
- Append decisions and implementation notes to `docs/hackathon-build/build-notes.md`.
- Update `docs/hackathon-build/status.md` to reflect reality.
- Record independent findings and dispositions in `docs/hackathon-build/reviews/<stage>.md`.

Deployment, public-repository creation, Devpost project creation, thumbnail upload, and submission require explicit user authorization at the relevant stage.
