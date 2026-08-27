# Project Scope

Status: Approved and locked at G1; changes require the gate to reopen  
Date: 2026-08-27  
Working codename: CiteApply (temporary; user ratification and a formal trademark/domain/handle review are required before public launch)

## Project Name

- CiteApply — current internal working codename; lowest obvious-collision risk found in an eight-candidate initial screen
- Final public name — intentionally deferred until Amit's ratification and a formal trademark/domain/handle review
- ProofFill — retired because an active product uses the name and overlapping positioning
- TraceApply — rejected because ApplyTrace is active in the application-software market

## One-Line Summary

An education-aid application portal where WebMCP agents bind answers to source-linked claims or propose unresolved values for human review; only the visible applicant UI can create a declaration where portal policy permits it, required-evidence fields fail closed, and no WebMCP tool can submit.

## Product Thesis

An agent should not earn trust merely by producing a plausible answer. The participating website should expose the live application state and enforce what counts as support.

The model proposes. The portal's deterministic policy decides whether a draft is source-linked and submission-ready. The applicant sees every change, resolves ambiguity, and owns the irreversible action.

“Submission-ready” means complete under the portal's declared evidence and declaration rules. It does not mean the documents are authentic, the applicant is eligible, or an award is approved.

Field policy is explicit: evidence-required fields cannot be satisfied by a declaration; declaration-allowed fields must be visibly marked; and resolving an evidence conflict requires selecting a supported current source or supplying corrected evidence. A note alone cannot make an evidence-required field ready. An agent cannot create or impersonate a user declaration: it may only propose an unresolved value that remains blocked until the applicant acts in the normal UI.

### Competitive boundary

CiteApply does not compete on scholarship discovery, essay generation, generic cross-site autofill, or caseworker decisioning. Its wedge is the receiving website's evidence contract: every tested compatible agent receives the same field rules, structured conflicts, version checks, and human commitment gate in the live form. Applicant-side assistants may organize or suggest answers; CiteApply makes the participating portal enforce what can become submission-ready.

## Target User

### Primary user

A first-time student completing a document-backed, need-based scholarship application who is uncertain which evidence supports each answer. A guardian may assist, but the student remains the applicant and final approver.

### Hypothesized economic buyer

The scholarship foundation or university aid team operating that document-backed program. It would evaluate paying for a safer applicant workflow that may reduce incomplete submissions, clarification loops, and manual source matching; those outcomes remain hypotheses until measured with a design partner.

### Community path

The v1 public repository ships the evidence-policy schema, synthetic education-aid fixtures, WebMCP compatibility tests, and reference portal under an open-source license so nonprofits and agent builders can reproduce the safety pattern. Applicant access remains free. A hosted free tier for qualifying nonprofits is a future hypothesis, not a v1 claim.

### Commercial model hypothesis

Applicant use remains free. The initial paid product would be an operator-hosted or managed B2B deployment priced per active aid program, with usage tiers based on completed applications rather than applicant fees. A design-partner pilot would validate willingness to pay against completion rate, clarification volume, and reviewer matching time before any public price or ROI claim. Billing and enterprise administration are outside v1.

## Problem

Education-aid applications combine repetitive identity data, document-backed financial/academic claims, conditional questions, unfamiliar terminology, and a high perceived cost of error. Conventional profile autofill is not designed to enforce an institution-specific evidence policy. General assistants may suggest values, but this prototype focuses on a narrower mechanism: the receiving site deterministically validates the permitted binding for each drafted field.

The resulting user problem is not typing alone. It is knowing:

- which live questions apply;
- which document supports a value;
- when two sources disagree;
- what remains missing or user-declared;
- what the agent changed; and
- whether required evidence, declarations, conflicts, and warnings are complete enough for the user's final review.

For form operators, incomplete or inconsistent applications create clarification email, manual matching, rework, and avoidable applicant abandonment. V1 demonstrates the workflow; it does not claim measured savings or real institutional adoption.

## Why WebMCP Is Essential

The browser agent needs a structured contract with the actual participating page and its demo-scoped synthetic, visible, changing session. Through WebMCP it can:

1. read current field requirements and conditional branches;
2. inspect a least-disclosure index of source-linked claims;
3. bind field updates to allowed claim identifiers or propose unresolved values that require visible human action;
4. receive deterministic missing, conflict, validation, and stale-state errors;
5. update the same form the applicant is reviewing; and
6. prepare a structured final review without owning submission.

A backend-only chatbot could generate suggestions, but it would not demonstrate agent-independent, site-enforced readiness in the live form. Coordinate clicking or DOM scraping would also miss the point: the site intentionally publishes safe semantic actions and preserves visible human control.

## Core Workflow

1. The applicant opens the owned **Horizon Education Aid — Need-Based Scholarship** portal in a demo-scoped synthetic session.
2. They select one of two included, clearly synthetic evidence packets. Each packet's text PDFs are processed by the same deterministic extraction pipeline; arbitrary upload is stretch.
3. The application creates structured claims with content-addressed, versioned source anchors: document ID and hash, page, text span, normalized value, extraction version, and confidence/status. Extraction confidence is an adapter signal, not the probability that a claim is true.
4. An external browser agent discovers the page's WebMCP tools and reads the live application requirements.
5. After the applicant explicitly allows the current agent session to access the selected synthetic packet, the site registers the sensitive evidence tools. The agent lists permitted evidence claims and drafts 8–10 fields. Each proposal includes either an allowed `evidenceClaimId` or an unresolved `proposedValue`; it cannot set declaration actor or status.
6. The live form visibly updates and labels each field as source-linked, user-declared, needs user declaration, missing, conflicting, or low-confidence. Stale state is a rejected-operation result, not a lasting evidence label.
7. An answer reveals one conditional branch. The agent re-reads state and completes only supported fields.
8. In the conflict scenario, two synthetic documents disagree on a required value. The conflict record remains visible and readiness is blocked; the agent asks the applicant instead of guessing.
9. The applicant inspects both source snippets and either selects the current policy-supported source with a recorded resolution reason or supplies corrected evidence. For a declaration-allowed field, only the visible UI may create a version-bound declaration record. Choosing a source records a human resolution; it does not authenticate the document, prove the value true, or erase conflict history. If no source satisfies the field policy, readiness remains blocked.
10. The agent requests a submission review. The page shows the exact final diff, evidence snippets, disclosed data, warnings, and readiness state.
11. The applicant may edit, cancel, or confirm the exact review snapshot. No WebMCP tool or agent-facing API can submit. Submission requires a visible, version-bound confirmation in the normal UI; the prototype does not claim technical proof of personhood or immunity from privileged browser automation.
12. The portal issues a persisted, version-bound provenance receipt containing field/value/status/source bindings, the WebMCP action summary, final application version, and human approval timestamp.

## What We Are Building

### Committed deadline slice

One portal; 8–10 fields; one conditional branch; two synthetic evidence packets containing versioned text PDFs processed by the real deterministic parsing pipeline; one happy scenario and one contradictory scenario; source inspection; policy-valid conflict resolution; version-bound review; visible confirmation and submission; a persisted receipt view with JSON export/print styling; refresh/resume; stale-write rejection; and a real external WebMCP client trace.

### Stretch only after the committed slice passes every gate

Arbitrary upload, image OCR and region anchors, model-based extraction, a second conditional branch, additional fields, receipt PDF generation, additional extraction adapters, and additional client compatibility. No second portal enters the submission build.

### Product surface

- One polished, responsive, accessible education-aid application portal we own.
- Two synthetic applicant packets—happy and contradictory—with 2–3 real text-PDF files each containing conspicuously synthetic data, all processed by the committed deterministic parser. A preloaded demo session must have been created through the same parser and handlers, never a hardcoded answer map.
- 8–10 application fields and one conditional branch.
- An evidence drawer that reveals the exact source page/span for each source-linked field.
- Clear field and application readiness states.
- Conflict comparison and human-resolution UI.
- Final diff, consent/disclosure summary, visible confirmation and submit, success state, and persisted version-bound provenance receipt with JSON export and printable HTML. Generated PDF output is stretch.
- Refresh/resume behavior for an in-progress synthetic application.

### Deterministic domain core

- Versioned schemas for documents, source anchors, claims, field rules, drafts, conflicts, human declarations, application versions, review snapshots, approvals, submissions, and receipts.
- Policy rules that fail closed for missing, conflicting, stale, unsupported, invalid, or low-confidence required values.
- Explicit separation between extraction/model adapters and provenance/readiness policy.
- Idempotent submission and replay/stale-state protection.
- Privacy-safe structured logging with no document body or synthetic PII values.
- Evidence access is scoped to the current application and requires explicit user authorization. Tool payloads exclude raw document bodies by default and expose only policy-relevant structured claims and opaque source handles.
- Extracted document text is labeled untrusted data and is never interpreted as instructions. Security tests cover prompt-like document content, oversized values, schema injection, unauthorized claim handles, and cross-application access attempts.
- A human declaration is created only by the visible UI and records the session actor, field ID, exact value, application version, declaration-policy version, timestamp, and optional resolution reason. Agent/API attempts to forge or reuse declarations fail.
- The authoritative state machine is `draft → review_prepared(version/hash) → user_confirmed → submitted`. Any edit, branch change, evidence resolution, or changed-version refresh returns to `draft` and invalidates confirmation.
- A one-use, expiring approval record is bound server-side to the demo session, canonical review snapshot, exact diff, application version, and policy versions. The submission endpoint rejects missing, stale, expired, wrong-session, wrong-version, or replayed approval and is idempotent for the accepted request.

### Initial WebMCP contract

The technical spec may refine names and schemas, but the required capabilities are:

- `get_application_state` — current version, progress, branch state, readiness summary, and safe next actions.
- `get_form_requirements` — field rules, conditional dependencies, accepted evidence classes, and declaration policy.
- `get_evidence_index` — consent-gated, bounded or paginated, least-disclosure claim metadata and opaque source handles needed for drafting; raw document bodies/snippets are not returned.
- `apply_evidence_backed_answers` — draft-only batch mutation with an allowed claim binding or unresolved proposed value and an expected application version; it cannot create a human declaration.
- `get_validation_issues` — structured missing, conflict, stale, low-confidence, and validation results.
- `prepare_submission_review` — produces the exact review snapshot/diff for visible human confirmation.

There is no WebMCP submission tool or agent-facing submission API in v1. This is a semantic contract and server-policy boundary, not a claim that the application can identify or defeat every privileged browser automation mechanism.

### Engineering and proof surface

- Actual WebMCP registration using the supported browser API, not a simulated final demo.
- Imperative WebMCP is the primary contract for reads, batched mutations, version checks, cancellation, and structured failures; semantic HTML remains the normal human form. Registration lifecycle, cancellation, bounded output, tool annotations, and server-side validation are required in the technical spec.
- A labeled testing-only client/harness for deterministic automated contract tests where needed.
- Unit, contract, integration, browser E2E, accessibility, security/privacy, and full regression suites.
- Setup documentation, architecture/data-flow documentation, threat model, open-source license, pinned lockfile, CI, and deployable configuration.
- A compatibility record naming the exact browser/agent versions actually tested.
- Version control is initialized before application code. Before submission, the public repository, setup path, and visible open-source license are verified from an incognito session; the deployed URL and testing instructions are verified from a clean supported client.
- Primary submission target: ChatGPT's in-app browser. Secondary target: Chrome with WebMCP enabled. A first implementation spike must record the exact browser channel/version, agent/client and version, origin-trial or feature setup, secure-origin requirements, registration, discovery, invocation, result, cancellation, and visible mutation. Compatibility is claimed only for clients and versions actually tested.

## What We Are Not Building

- Arbitrary third-party form support, browser-extension scraping, or compatibility with unmodified government, university, insurance, shopping, or cloud sites.
- Three industries or a generic universal form platform.
- Real applicant PII, real applications, real institution accounts, or production document retention.
- Arbitrary document upload, image OCR, or model-based extraction in the committed slice.
- Document authenticity, identity verification, fraud scoring, eligibility/adjudication, award decisions, legal advice, or compliance certification.
- Essay generation, invented supporting statements, autonomous apply, or agent-controlled final submission.
- A cross-site identity/proof wallet, verifiable credentials, cryptographic signatures, blockchain, or production integrations such as DigiLocker.
- Institution back-office analytics, billing, multitenancy, enterprise SSO, or caseworker workflow in v1.
- Multilingual, voice, native-mobile, offline, or broad OCR-format coverage in v1.
- Claims of production readiness, institutional adoption, accuracy improvement, time savings, or ROI without separate evidence.

## Success Measures

### Product invariants

- Every ready field uses a binding kind allowed by that field's versioned policy. An agent-proposed unbound value remains `needs_user_declaration`, and a required-evidence field cannot be converted to declaration-only.
- Within the committed synthetic test corpus, missing, conflicting, stale, invalid, unsupported, or policy-disallowed low-confidence values cannot reach ready state.
- No WebMCP tool or agent-facing API can submit. Submission requires a visible, version-bound confirmation in the normal UI; no proof-of-personhood claim is made.
- Every source-linked field lets the applicant inspect its exact synthetic source anchor.
- The applicant can modify or cancel before submission.
- The receipt exactly matches the approved application version and source bindings.
- For every committed synthetic fixture, extracted claims and source anchors match a reviewed golden dataset; extraction failures surface as missing or low-confidence rather than silently producing a ready value.

### Verified scenarios

- Happy path.
- Conditional-branch path.
- Contradictory evidence and human resolution.
- Missing and low-confidence evidence.
- Stale concurrent draft rejection.
- Manual edit after agent draft.
- Cancellation before approval.
- Refresh and resume.
- Duplicate/replayed submission attempt.
- Agent/API declaration forgery and declaration reuse on another field, value, application version, or policy version.
- Unknown, malformed, wrong-packet, wrong-session, evidence-class-mismatched, and modified-document/hash-mismatched claim handles.
- Consent absent, revoked, wrong-session, and post-revocation evidence-tool calls.
- Review invalidation after a manual edit, branch change, evidence resolution, or changed application version.
- Missing, expired, reused, wrong-session, wrong-version, and direct-endpoint approval bypass.
- Hostile or instruction-like fixture text treated only as untrusted data.
- Tool cancellation during mutation and duplicate request IDs with same/different payloads.
- Log-capture assertion that no document text, source snippets, or synthetic PII values are emitted.
- Keyboard-only review and submission.
- Receipt view/export.

### Hackathon proof

- The product is visibly working within the first 15 seconds of the demo.
- Judges see a real external agent discover and invoke the page's WebMCP tools.
- The deliberate conflict/refusal moment is shown, not merely narrated.
- The hosted app is verified in the exact supported client(s) named in the submission.
- Repository, license, setup, public URL, and sub-three-minute narrated demo meet official requirements.
- Both synthetic packets invoke the same production WebMCP handlers and produce different conflict/readiness behavior from their actual state. There is no demo-only mutation route, precomputed field-to-claim answer map, or harness-only capability. The recorded external-client trace reconciles exactly with visible mutations and the final receipt.
- If participants are available, complete at least three observed synthetic-data sessions and report the exact sample and findings. Otherwise state explicitly that no user validation occurred.
- Prototype buyer-learning metrics are application completion without unresolved evidence gaps and the number of clarification-required fields per application; no ROI conclusion is drawn from synthetic tests.

## Inspiration And References

- Chrome WebMCP declarative API: <https://developer.chrome.com/docs/ai/webmcp/declarative-api>
- Chrome WebMCP imperative API (primary contract): <https://developer.chrome.com/docs/ai/webmcp/imperative-api>
- Existing application assistants such as CAPP, GoScholar, and Nava Labs show adjacent category activity and overlapping approaches; they do not establish prevalence, efficacy, willingness to pay, or product-market fit: <https://cappapp.com/>, <https://www.goscholar.ai/apply>, <https://caseworker.navapbc.com/demos/form-filling-assistant>
- EliteApply shows overlap around document-to-requirement mapping and unsupported claims: <https://eliteapply.net/>
- ProofFill naming collision and positioning overlap: <https://prooffill.com/en>

These references are competitive context, not endorsements, integrations, or evidence of product-market fit.

## Demo Path

### Opening: 0:00–0:15

Begin with the synthetic **Horizon Education Aid — Need-Based Scholarship** application, the external browser agent, and the first genuine WebMCP invocation already visible. Show its resulting field mutation and source chips by second 10. Record the interaction in short clips and remove model/network waiting while preserving the complete real tool call and resulting UI state; never replace invocation with a simulated animation. Prompt:

> Complete this application using only my selected evidence packet. Never guess, and leave final submission to me.

The real WebMCP invocation completes and source-linked fields visibly populate.

### Live contract: 0:15–0:40

Show semantic tool calls, conditional requirements, and a source chip opening the exact document passage. Establish that the agent is working with the page's contract, not hidden coordinate automation.

### Winning conflict: 0:40–1:15

Two synthetic documents disagree on household income. The portal returns a structured conflict, leaves the field unresolved, and blocks readiness. The agent asks the applicant which source is current; the applicant reviews the comparison, selects the current policy-supported source, and records why. If neither source satisfies policy, the only valid path is corrected evidence.

### Controlled commitment: 1:15–1:45

The agent prepares the final review. Show the diff, evidence/declaration status, disclosed data, no unresolved warnings, and the explicit statement that no WebMCP tool can submit and the normal UI requires a version-bound confirmation.

### Receipt and close: 1:45–2:05

The applicant clicks Submit. Show the success state and provenance receipt.

> The agent handles complexity, the website enforces evidence, and the person keeps control.

The remaining video time is reserved for a concise architecture/WebMCP explanation and closing impact statement; total must remain below three minutes.

## Submission Story

### WebMCP leverage

This is not an autofill button wrapped as a tool. Multiple semantic reads and draft mutations operate on live, conditional page state; structured policy errors change the agent's behavior; and visible form updates preserve human oversight. Any tested compatible client invokes the same site-defined contract and constraints. Compatibility is claimed only for exact clients and versions recorded in the submission.

### Execution

One complete journey runs from synthetic evidence through branching draft, contradiction, resolution, exact review, human submission, and receipt. The normal human UI works without pretending WebMCP is an authentication or safety boundary.

### Potential impact

The primary user faces a credible, consequential application problem. The buyer hypothesis is concrete: education-aid operators may pay to reduce incomplete applications, clarification loops, and manual source matching. The prototype demonstrates the mechanism, while customer and ROI claims remain explicitly unvalidated.

### Creativity and ambition

The distinctive contribution is an agent-independent, site-enforced evidence contract: source handles, deterministic refusal, structured conflict escalation, version-bound review, and human-controlled commitment in the live form. It converts browser-agent trust from a prompt request into application behavior.

## Timebox And Scope Ruler

- Official deadline: 2026-09-03 20:00 UTC / 2026-09-04 01:30 IST.
- Available scope window: seven calendar days from scope lock.
- Plan: six days for foundation, vertical slices, hardening, and full verification; retain the final day for deployment proof, demo capture, submission materials, and contingency.
- Amit explicitly authorized a quality-first autonomous build and said time is sufficient. If throughput threatens the deadline, cut stretch features and visual flourish before cutting provenance, conflict handling, accessibility, security, or required tests.

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| Experimental or client-specific WebMCP behavior | Make the first implementation slice a minimal page that registers one read tool and one version-checked mutation tool. Invoke both from the primary submission client, capture the real trace and visible UI update, and record the exact client/browser version. Failure blocks product implementation; a local harness alone cannot satisfy this proof. Request deployment authorization first if remote hosting is required. |
| Product appears to be ordinary autofill | Make site policy, structured conflict, live conditional state, and human-controlled commitment the center of both UX and demo. |
| Extraction variability consumes the sprint | Restrict the committed pipeline to deterministic text extraction from the included versioned PDFs, test against reviewed golden anchors, make arbitrary upload/image OCR/model extraction stretch, and never imply broader accuracy. |
| PII/privacy concerns overwhelm the story | Use unmistakably synthetic data, least disclosure, no content logging, bounded local retention, and a documented threat model. |
| Scope expansion | One portal only. Stretch work may deepen that portal after the complete committed slice passes all gates; no second portal enters the submission build. |
| No customer validation before deadline | Report test evidence honestly; pursue lightweight observed-user sessions only if available; do not invent traction. |

## Exit Criteria For G1

- Independent product, judge, feasibility, and testability reviewers approve this single-workflow boundary.
- P0/P1 findings are fixed or explicitly accepted with rationale.
- Working name is collision-screened enough for internal use; public name remains user-ratified and subject to a proper trademark/domain/handle review.
- Saved hackathon state, learner profile, agent contract, status, and build notes agree.
- No application code has started.
