# CiteApply Replacement Scope

Status: Approved and locked at G1 local-first delivery amendment; product boundary unchanged
Date: 2026-08-27
Working codename: CiteApply

## Decision Context

The first CiteApply scope produced a technically detailed but undeliverable specification: 6,720 lines, 23 HTTP/page surfaces, 15 tables, three blocking portability spikes, and eight concurrency-proof families. G3 correctly failed. That specification remains design evidence, not an implementation contract.

This replacement keeps the complete judge-visible product proof and removes generalized platform and distributed-systems breadth. It is a clean scope reset, not permission to implement only part of the former design or weaken the safety, accessibility, privacy, and verification requirements of behavior that remains.

## Project Name Candidates

- **CiteApply** — internal working codename and the name used throughout the build artifacts.
- **Final public name** — deferred until Amit ratifies the name and an appropriate trademark, domain, and handle review is completed.
- **ProofFill** — retired because an active product uses the name in an overlapping area.
- **TraceApply** — retired because ApplyTrace is active in the application-software market.

The internal name is not a legal clearance claim.

## One-Line Summary

CiteApply is a WebMCP-enabled scholarship application portal where an agent can draft answers from runtime-parsed synthetic source-linked claims, while the participating website enforces evidence policy, refuses contradictory evidence, and leaves declaration, conflict resolution, review, and submission under visible applicant control.

## Product Thesis

The difficult part of a document-backed form is not typing. It is deciding which current question applies, which source supports an answer, what to do when sources disagree, and whether the final application faithfully reflects what the applicant reviewed.

Generic browser agents and autofill products may propose plausible values. CiteApply adds something the receiving website is uniquely positioned to provide: an explicit, deterministic evidence contract. The model proposes bindings; the portal decides whether each binding is permitted and whether the application is ready.

“Ready” means complete under this fictional program's declared source and declaration rules. It does not mean the documents are authentic, the applicant is eligible, or an award is approved.

## Target User

### Primary user

A first-time student completing a document-backed, need-based scholarship application who is uncertain which evidence supports each answer. A guardian may help, but the student remains the applicant and controls the final action.

### Hypothesized buyer

A scholarship foundation or university aid team operating a document-backed program. Its potential reason to pay is fewer incomplete applications, clarification contacts, and manual source-matching steps. Those outcomes and willingness to pay are hypotheses to validate with design partners; CiteApply will not claim measured ROI, adoption, or customer demand during this hackathon. A future pilot would measure incomplete-application rate, clarification contacts per application, reviewer source-matching time, and applicant completion.

### Community value

Applicant use is free. The public repository will provide the evidence-policy schema, synthetic PDFs, reviewed golden tests, WebMCP contract tests, security test patterns, and reference portal under an open-source license. Nonprofits and agent builders can reuse the receiving-site safety pattern without accepting CiteApply as a hosted vendor.

### Commercial path

The future product hypothesis is a managed or operator-hosted B2B service priced per active aid program or completed application, not an applicant fee. Future integrations could consume claims from an operator's document system or verification provider. Billing, multitenancy, operator administration, and production integrations are outside the hackathon build.

## Problem

Education-aid forms combine identity details, household and income evidence, conditional questions, unfamiliar terminology, and a high perceived cost of error. Existing alternatives address only parts of this:

- browser autofill repeats profile values but does not understand a program's evidence policy;
- general assistants can suggest answers but cannot make a receiving site accept a source binding;
- document AI can extract text but does not own the live form's readiness or human-commitment rules; and
- workflow/form platforms can validate fields but do not necessarily expose a semantic, agent-usable evidence contract in the page.

The resulting applicant problems are knowing what applies, which source supports a value, why a value is blocked, what the agent changed, and whether the exact final snapshot is safe to submit. The operator problem is avoidable clarification and review work caused by incomplete or source-mismatched applications.

## Why WebMCP Is Essential

CiteApply is built for a participating website that intentionally registers tools. Browser support alone does not add WebMCP to Amazon, a cloud console, or any other unmodified third-party site, and CiteApply will never claim arbitrary-site support.

WebMCP lets an external agent collaborate with the actual visible application through six small semantic operations: state, requirements, evidence, source-backed mutation, validation, and review preparation. The page and the agent share one authoritative form. Conditional requirements can change after a mutation, conflicts return as structured policy results, and the portal—not the model—decides readiness.

A chatbot beside the form could generate suggestions, and coordinate clicking could manipulate controls, but neither demonstrates this site-owned, agent-independent contract. WebMCP is therefore the collaboration surface; server/domain policy remains the authorization and correctness boundary.

## Exact Committed Product

### One fictional portal

The owned demo site is **Horizon Education Aid — Need-Based Scholarship**. It is conspicuously fictional, uses synthetic data only, and has a complete manual path when WebMCP is unavailable or the applicant declines assistance.

### Exactly eight fields

1. Full legal name — evidence required.
2. Student ID — evidence required.
3. Institution — evidence required.
4. Preferred contact email — a synthetic `.test` address; visible applicant declaration required.
5. Financially dependent on a guardian — evidence required and controls the one branch.
6. Annual household income — evidence required and is the deliberate conflict field.
7. Guardian full name — evidence required only when dependency is `Yes`.
8. Household size — evidence required only when dependency is `Yes`.

Closing the branch clears and excludes its two inactive values. The rules will not let a declaration satisfy an evidence-required field.

### Exactly two synthetic packets

- **Supported packet:** accepted household and income sources agree.
- **Conflict packet:** the same source types disagree about annual household income.

Each packet contains exactly three one-page, text-native, visibly synthetic PDFs:

1. an enrollment record for legal name, student ID, and institution;
2. a household statement for guardian dependency, guardian name, household size, and an income claim; and
3. an income statement containing the second income claim.

Both packets set guardian dependency to `Yes`, so the one branch is exercised in every committed journey. Both use the same production code path. Packet data alone determines whether income is corroborated or conflicting. When normalized income values agree, the income statement is the canonical binding and the household statement is retained as corroboration. When they disagree, neither source wins automatically; the conflict remains unresolved until the applicant acts.

### Real, bounded parsing

Selecting a packet reads its three committed PDF byte streams at runtime, verifies the allowlisted SHA-256 hash and byte/page/text limits, invokes one pinned deterministic parser/extractor, normalizes claims, and persists exact page/span/hash anchors. The evidence drawer reconstructs the displayed source from those stored anchors.

Reviewed goldens are test-only oracles and must not be imported by production code. There is no production claim manifest, hardcoded field-to-answer map, arbitrary upload, OCR, model extraction, parser worker, retry scheduler, or claim that the parser handles general documents.

A fixed-file parse either commits the complete packet result or fails visibly without creating partial claims. The failure screen explains that no application was created and offers **Return to packet selection**. A parser or runtime portability failure is a scope no-go, not permission to replace parsing with precomputed claims.

### Exact WebMCP contract

All six tools register once when the application page loads:

1. `get_application_state` — version, progress, branch/readiness summary, and safe next actions; redacted before consent.
2. `get_form_requirements` — static field policies for `all`, plus consent-gated active requirements.
3. `get_evidence_index` — consent-gated, bounded claim metadata and opaque source handles; never full PDF text or complete snippets.
4. `apply_evidence_backed_answers` — an expected-version atomic batch of allowed claim bindings or unresolved proposed values; it cannot declare, resolve, confirm, or submit.
5. `get_validation_issues` — consent-gated missing, conflict, declaration-needed, invalid, and stale results.
6. `prepare_submission_review` — creates an immutable review only when ready and returns bounded metadata, not the full diff or source excerpts.

Registration visibility is not permission. A protected operation whose final server authorization occurs without current consent returns the same value-free `consent_required` result and performs no new protected read or mutation. Current session, page, and consent authority is checked before both first execution and any idempotent replay projection; a page-memory capability is injected by the page bridge outside agent-supplied tool arguments.

Before **Allow assisted access**, visible and screen-reader-accessible copy states:

- the purpose and scope: help with this synthetic application in the current page/session;
- included categories: current application state and values, program requirements, normalized evidence claims and source metadata, validation results, and bounded review metadata;
- permitted actions: request policy-allowed source bindings and propose the synthetic `.test` email;
- excluded data/actions: raw PDFs, complete source excerpts, the complete review diff, packet selection, applicant declaration, conflict resolution, confirmation, submission, and export;
- Revoke stops future operations that have not already passed final server authorization, but cannot erase returned or already-authorized in-flight data and cannot govern separate privileged-browser access; and
- refresh, newer-page takeover, session expiry, and successful review preparation clear assisted access.

Protected reads finalize current page/consent authority and serialize their small result under the application lock. If that authorization wins before Revoke, review-close, or page takeover, its response may arrive later and cannot be retracted. If authority loss wins first, the operation returns a value-free refusal. The visible application ignores stale-page UI updates, but CiteApply does not claim it can erase data already delivered to an external client.

Dynamic register/unregister is excluded from the committed build. It may improve presentation in the future, but it is not a security boundary and adds experimental-client lifecycle risk without improving the product proof.

There is no WebMCP tool for packet selection, source-snippet reading, applicant declaration, conflict resolution, review confirmation, submission, or receipt export.

### Human and agent boundaries

- The agent can bind a policy-allowed claim or propose a synthetic email value that remains blocked.
- The agent cannot create or impersonate the applicant's email declaration.
- When two accepted income sources disagree, the agent cannot choose a winner. The portal returns `conflict_requires_human` and preserves both sources.
- The applicant resolves that conflict in the visible UI by inspecting both exact excerpts, choosing one source, and selecting a bounded reason. This records a resolution; it does not authenticate the document or prove the value true.
- The applicant visibly declares the `.test` email in the normal UI.
- The agent may prepare an immutable review after the portal becomes ready. Successful preparation closes assisted access.
- The complete diff, source excerpts, declaration, conflict history, disclosure summary, and warnings remain human-UI-only.
- Draft always provides **Review application**, which invokes the same readiness and immutable-review creation service as `prepare_submission_review`.
- Review provides **Return to application** and **Confirm and submit this review**. Return invalidates that review, preserves valid committed answers/resolutions, returns to Draft, and leaves assisted access closed. Another assisted pass requires a new Allow.
- The submit action locks the current application, verifies the exact current review ID/hash/version and page authority, and creates at most one immutable submission and receipt in a single PostgreSQL transaction. Invalidated or stale reviews are rejected.
- Manual and agent preparation of identical application state must produce the same canonical review hash and receipt projection.

No WebMCP or agent-facing API exposes submission. CiteApply does not claim proof of personhood or protection from every privileged browser automation mechanism; it claims a deliberately absent semantic submission capability and a visible normal-UI commitment step.

### Manual fallback

The applicant can complete the same application without WebMCP by choosing policy-allowed source claims in the form, resolving the same conflict, declaring the same synthetic email, selecting **Review application**, returning to edit when needed, and receiving the same receipt. Manual and agent-assisted paths call the same domain rules and persistence layer. When WebMCP is unsupported or the applicant declines access, one nonblocking message explains that agent assistance is unavailable while every manual control remains usable.

### Refresh, single-page authority, and recovery

Only one application page is active for a demo session. A refresh or newer tab becomes authoritative, preserves saved Draft, Review, or Submitted state, and makes an older page read-only with a clear reload message. It clears WebMCP consent and any open confirmation UI. Explicitly unsaved browser text may be lost.

The authenticated demo session expires exactly 60 minutes after creation and warns at minute 50. Expiry makes application and receipt APIs unavailable and offers **Start a new synthetic demo**; a previously downloaded JSON file remains outside CiteApply. Fixed synthetic database records may be retained through the official judging period and deleted afterward through an explicitly authorized operator action subject to the selected provider's backup policy. CiteApply makes no immediate physical-deletion promise.

Every mutation after successful demo creation uses the current epoch/revision, a request UUID, a canonical request digest, and application-row locking. Initial demo creation instead uses a bootstrap nonce plus request identity. Same ID/same digest guarantees no duplicate effect and a stable committed outcome, but current session/page/consent authority is checked before redisclosing a protected result. An unauthorized retry returns `consent_required` or `stale_page` while the human UI may still show the earlier committed state. Same ID/different digest and stale writes fail without a new mutation.

The native WebMCP `AbortSignal` is passed to the page fetch. Abort before dispatch makes no request. After server acceptance it is graceful best-effort cancellation, not a durable database cancellation or rollback guarantee: the atomic operation may commit or may not commit, never partially commits, and an authoritative state read resolves the outcome. No server cancellation tombstone/control protocol is in scope.

Submission uses one locked, idempotent transaction and a unique application submission. If the response is lost, an exact retry or refreshed bootstrap returns the persisted receipt when committed; otherwise the unchanged review remains available and the applicant confirms again. There is no two-phase intent protocol, encrypted reconciliation token, or persistent confirmed state.

### Receipt

`/receipt` is a value-free shell that fetches one canonical immutable `ReceiptRecord` during the 60-minute session. The screen, downloaded JSON, and print stylesheet are semantically equal projections of that record, although formatting bytes differ: final active fields, source bindings, declaration, preserved conflict resolution, review hash, accepted application revision, bounded WebMCP activity summary, and submission timestamp.

## Core Workflow

1. The applicant chooses Supported or Conflict on the landing page and starts a 60-minute synthetic demo.
2. The server verifies and parses all three packet PDFs through the production parser, then opens the visible manual form.
3. The external client discovers all six registered WebMCP tools. Protected calls before consent disclose nothing and return `consent_required`.
4. The applicant reads the category/exclusion/in-flight disclosure and selects visible **Allow assisted access**.
5. The agent reads state, requirements, and the evidence index, independently composes supported claim bindings, and applies a version-checked batch.
6. The visible form updates. Guardian dependency reveals guardian name and household size, so the agent re-reads active requirements and applies those supported bindings.
7. In the Conflict packet, an income binding is refused because the two accepted sources disagree. The agent reads structured issues and does not bypass the conflict.
8. The agent may propose the prompt-supplied `.test` email, but the field remains `Needs your declaration`.
9. Premature review preparation fails closed with the conflict and declaration requirements.
10. The applicant inspects both income excerpts, chooses one supported source with a bounded reason, and visibly declares the email.
11. The agent prepares the immutable review. Assisted access closes, and the full review appears only in the normal UI. A manual-only journey reaches the same state through **Review application**.
12. The applicant inspects the exact review. They may choose **Return to application**, edit, and prepare a new review, or activate **Confirm and submit this review**.
13. The portal atomically persists one submission and opens a matching receipt. JSON download and print show semantically equal projections of the same canonical record.

## Demo Path

The submission video uses one continuously recorded Conflict-packet session. A clearly labelled cold-open excerpt from later in that same recording shows the genuine tool result and visible form mutation by second 10, with the same request/session evidence used in the chronological trace. The video then returns to the start of that session:

- by second 10: a genuine external-client result and visible form mutation, labelled as the later same-session excerpt;
- chronological discovery and a protected pre-consent result;
- visible consent, separate state/rules/evidence reads, and a real visible mutation;
- branch reveal and active-requirement re-read;
- structured income refusal and undeclared-email block;
- visible applicant resolution and declaration;
- agent-prepared review, human-only confirm/submit, and matching receipt/JSON identifiers.

The Supported packet and complete manual/no-WebMCP flow are regression evidence and judge testing instructions, not competing video narratives. Waiting may be compressed only when transparently labelled. The unedited external-client trace remains a release artifact. No invocation animation, precomputed result, harness-only capability, unrelated session, or causally disconnected edit may substitute for the real call/result/UI relationship.

## What We Are Building

- One polished, responsive, accessible scholarship portal with three page routes: landing, application, and receipt.
- Exactly eight fields, one conditional branch, two packets, six real PDFs, one real conflict, and one declaration-only field.
- A real deterministic fixed-PDF parser with hash/limit checks, test-only goldens, and exact source anchors.
- A normal manual source-selection path and a six-tool WebMCP path over the same domain service.
- Server-enforced consent with visible Allow/Revoke and no reliance on tool visibility as authorization.
- Deterministic readiness, structured refusal, source inspection, human conflict resolution, and human email declaration.
- Immutable review preparation, one atomic human submission, and one matching screen/JSON/print receipt.
- Sixty-minute synthetic sessions, newest-page authority, refresh recovery, stale protection, request idempotency, and honest abort/unknown-outcome reconciliation.
- A modular Next.js/Node application and PostgreSQL persistence with pinned dependencies, migrations, CI, and a public open-source repository.
- Unit, contract, real-PostgreSQL integration/race, browser E2E, security/privacy, accessibility, clean-build, hosted, and genuine external-client verification.

## What We Are Not Building

- Support for unmodified third-party sites, browser-extension scraping, or generic cross-site autofill.
- A second portal, a generic form platform, or multiple industries.
- Real applicant data, real applications, real institution accounts, document authenticity, identity verification, fraud detection, eligibility/adjudication, or legal/compliance claims.
- Arbitrary upload, image PDFs, OCR, model extraction, corrected-document replacement, or a general document-ingestion product.
- Preprocessed production claims, a hardcoded answer map, demo-only mutation routes, simulated tool calls, or a harness presented as the external client.
- Dynamic WebMCP registration/removal, a second external client, broad browser compatibility claims, or support beyond exact tested client/version combinations.
- Concurrent collaborative tabs, offline continuation, BFCache recovery promises, dirty-input transfer, or multi-lineage page protocols.
- Parser workers, leases, timeouts, retries, online policy migration, key-rotation choreography, event sourcing, encrypted submission reconciliation, or a two-phase submit protocol.
- Durable server cancellation tombstones, transactional cancel/rollback claims, or a dedicated cancellation control surface.
- A persistent confirmation/approval authority. Confirmation is the visible final UI action bound to the exact current review and transaction.
- Server-rendered value-bearing receipt streaming, generated receipt PDF, or a separate printable artifact; semantic HTML print styling is sufficient.
- Production-scale retention promises, custom WAF/capacity systems, operator dashboards, analytics, billing, multitenancy, SSO, or caseworker workflow.
- Claims of production readiness, institutional adoption, time savings, accuracy gains, environmental impact, or ROI without evidence.

There are no hackathon stretch features. New feature ideas are post-submission backlog only; quality work on the committed product is not considered stretch.

## Hard Scope Caps

The replacement specification and checklist must remain within all of these limits unless G1/G2 and capacity review are reopened:

| Dimension | Cap |
|---|---:|
| Owned portals | 1 |
| Application fields | exactly 8 |
| Conditional branches | exactly 1 |
| Synthetic packets | exactly 2 |
| PDFs | exactly 3 per packet |
| Deliberate conflicts | exactly 1 field |
| WebMCP tools | exactly 6, registered once |
| Primary external clients claimed | exactly 1 |
| User page routes | at most 3 |
| API route families | at most 8 |
| Product database tables | at most 6 |
| Real-PG concurrency proof families | at most 5 |
| Replacement technical specification | at most 15,000 words |

If a required guarantee cannot be expressed inside these caps, the team must simplify the claimed behavior or reopen scope. It must not add hidden infrastructure or silently weaken the test.

### Cap feasibility witness

The replacement architecture starts from this aggregate witness, leaving one table and two API families of headroom. Later artifacts may refine names but may not split aggregate state into hidden extra surfaces without reopening capacity.

Product tables:

1. `applications` — session credential digest, packet and parsed aggregate, page epoch, revision, current consent, lifecycle, and expiry;
2. `operations` — mutation request digest, committed outcome, and idempotent replay metadata;
3. `reviews` — immutable canonical review snapshots and validity;
4. `submissions` — one unique accepted submission plus canonical receipt; and
5. `rate_buckets` — bounded fixed-window public demo admission and pruning.

API families:

1. `/api/demo` — bootstrap-nonce-bound, rate-limited synthetic demo creation and fixed-PDF parse;
2. `/api/application` — authenticated bootstrap/takeover, snapshot, and human source projection;
3. `/api/application/actions` — manual bindings, declaration, conflict resolution, Allow/Revoke, review/return-to-edit;
4. `/api/webmcp` — all six tool executions through one strict discriminated server union;
5. `/api/submission` — visible confirm-submit, exact retry/status, and receipt recovery; and
6. `/api/receipt` — authenticated canonical receipt data and JSON export.

An API family means every authored HTTP handler or Server Action surface, including operational, cleanup, control, and status behavior; alternate framework plumbing cannot evade the cap. Static synthetic PDFs and the three user pages are not authored APIs. There is no cleanup endpoint or automated physical-deletion claim in the hackathon build. Concurrent demo admission and bounded expired-bucket pruning occur inside `/api/demo` and are part of the retained PostgreSQL proof.

## Acceptance Proof

### Parser and provenance

- All six committed PDFs are parsed at runtime through the same production adapter.
- Hash, byte, page, and extracted-text caps are enforced before claims commit.
- Runtime claims and exact page/span anchors match independently reviewed test goldens.
- A test-only mutated PDF changes the parsed value/anchor, proving byte-derived behavior.
- Modified production bytes with the old hash fail without claims; instruction-like text remains inert data.
- Static import/bundle checks prove production code cannot import golden claim data or a precomputed claim manifest.

### Domain and contract

- Field evidence classes, branch reveal/clear, equal-income canonical binding plus corroboration, unequal-income conflict, email proposal/declaration, declaration-forgery rejection, readiness, canonical review hash, review invalidation/re-preparation, and active-field receipt projection have deterministic tests.
- Every tool descriptor, strict recursive input schema, bounded result/error DTO, annotation, value budget, and server-side validation path has a snapshot/contract test.
- Forged, cross-session, wrong-packet, evidence-class-mismatched, and stale handles fail without mutation.
- No agent-facing path can create a declaration, resolve a conflict, confirm, submit, or receive full source excerpts/the complete review diff.
- A DTO-to-visible-copy completeness test proves that every protected category/action and every excluded category/action is accurately represented in the assisted-access disclosure.
- Manual and agent review preparation from identical state produce the same canonical review hash; return-to-edit invalidates the old review, and stale-review submission fails.

### PostgreSQL and security

Four controlled real-PostgreSQL race families cover:

1. bootstrap-nonce duplicate demo creation, concurrent rate admission/bucket pruning, stale revision, and same/different-digest request replay;
2. consent loss, review-close, page takeover, or session expiry versus protected read/apply/prepare, including read-first and authority-loss-first outcomes plus response loss after commit;
3. human edit/declaration/resolution versus review preparation and invalidation; and
4. submit versus edit, takeover, duplicate/exact retry, response loss, and receipt recovery.

Native abort behavior has no separate transactional race claim. Tests prove the allowed outcome set after server dispatch—no commit or exactly one atomic commit, never a partial/duplicate mutation—and authoritative state reconciliation.

Security tests cover exact Origin/Host/fetch metadata, HttpOnly same-site sessions, page/CSRF authority, strict body/output caps, session/packet-scoped opaque handles, XSS-safe source display, no value-bearing URLs/storage, and canary assertions that logs, console, analytics, and server errors contain no document text, snippets, synthetic personal values, or secrets.

### Complete flows

- Supported packet through a genuine WebMCP client.
- Conflict packet through genuine WebMCP collaboration plus human resolution/declaration.
- Complete manual/no-WebMCP path to the identical receipt model.
- Manual review preparation, Return to application, edit, stale-review rejection, and re-preparation.
- Protected calls before consent and after revoke, plus both final-authorization orderings for in-flight read/apply/prepare across Revoke, review-close, and page takeover.
- Response loss after a committed apply or review preparation followed by Revoke, review-close, or page takeover: the retry refuses current protected disclosure, creates no duplicate effect, and the normal UI exposes the already-committed authoritative state.
- Refresh at Draft, Review, in-flight submit, and Submitted.
- Parser/hash failure with Return to packet selection; WebMCP-unsupported/declined manual continuity; stale/read-only page; aborted-callback unknown outcome; 50-minute warning/session expiry; and receipt-export failure.
- Semantic equality between the accepted review, canonical `ReceiptRecord`, persisted receipt screen, JSON export, and print projection.

### Accessibility and compatibility

- Keyboard-complete Supported, Conflict, manual, consent/revoke, review/Return-to-edit, submit, parser failure, stale/read-only page, receipt, and export-failure flows.
- Semantic labels, source excerpts, status text, error summary, focus placement/return, and non-color-only states.
- Automated accessibility checks on landing, consent, draft, conflict, parser failure, stale page, review, Return-to-edit, receipt, and export failure; 320 CSS px, 200% zoom, reduced motion, and contrast checks.
- One named VoiceOver/browser pass on the primary path and a documented manual fallback browser pass.
- A real external-client trace names the exact application, model, browser/client version, settings, and date. Compatibility claims stop there.

### Impact evidence

The release includes `docs/verification/impact-evidence.md` with exact Supported, Conflict, and manual completion results; the number and type of clarification-required states each journey creates; and any observed synthetic-data participant sessions. If no participant observation occurs, it says **No user validation occurred**. It distinguishes regression evidence from future pilot measures and makes no ROI inference.

Any known material WCAG A/AA defect, privacy leak, fake integration, mismatching receipt, or unverified external-client claim blocks progression.

## Inspiration And References

- [The WebMCP Challenge](https://webmcp.devpost.com/) — product theme and four equally weighted judging criteria.
- [Official challenge rules](https://webmcp.devpost.com/rules) — deadline, live URL, public repository/license, tested-client, and sub-three-minute public video requirements.
- [Chrome WebMCP Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api) — current `document.modelContext.registerTool`, tool-change, cancellation, and experimental lifecycle behavior.
- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp) — origin-trial and local-testing boundaries.
- [OpenAI site tools documentation](https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app) — current ChatGPT desktop discovery, page scope, permissions, and availability limits.
- Existing browser autofill, form platforms, and document-extraction systems are competitive context, not copied product designs.

## Submission Story

### WebMCP leverage

Six real semantic tools compose over one live page: the agent reads site rules and source claims separately, mutates with versioned bindings, re-reads a revealed branch, receives a deterministic conflict, and prepares—but cannot submit—the exact review. Consent is proved through server behavior rather than cosmetic tool visibility.

### Execution

Judges receive a coherent applicant product rather than a protocol demo: real PDFs, a polished manual form, visible source inspection, conflict resolution, declaration, accessible review, atomic submission, and a matching immutable session receipt.

### Potential impact

The project addresses a specific applicant and operator problem and explains a credible paid/operator and free/community path. All outcome and buyer claims remain hypotheses until measured.

### Creativity and ambition

The novel trust move is shifting evidence authority from whichever agent the user happens to run into the participating receiving site. The same agent contract succeeds on consistent evidence and refuses contradictory evidence because the portal owns the provenance policy.

## Official Release Acceptance

The release gate blocks unless every official submission obligation is evidenced:

- a working public HTTPS URL that judges can use without payment and that remains available through the official judging period;
- a public source repository containing all necessary source/setup material, with an Amit-approved OSI-compatible license visible at the repository top level and in repository metadata where supported;
- a public YouTube video shorter than three minutes with audible narration and a faithful demo of the working product;
- exact tested external client, browser/application, model, settings, version, and test date;
- reproducible judge/setup instructions for the Supported, Conflict, and manual paths; and
- a complete Devpost submission recorded before `2026-09-03T20:00:00Z`.

Public name ratification, license choice, repository creation/push, database/hosting provisioning, public deployment/origin configuration, video upload, and Devpost writes remain external mutations requiring Amit's explicit authorization. The H30/H48 wave-close updates report local progress and public-deadline/capacity risk only; they neither request approval nor present the authorization package. That package is presented only after Amit tests the H72 local candidate and explicitly opens the public-release discussion. Public approval remains required no later than `2026-08-30T20:00:00Z` (`2026-08-31 01:30 IST`), so honoring local-first sequencing may make the public-release plan a no-go. Missing authorization never blocks honest local implementation, permits unauthorized action, or silently consumes the final reserve.

## Timebox And Delivery Capacity

Official deadline: `2026-09-03T20:00:00Z` / `2026-09-04 01:30 IST`. Feature freeze is `2026-09-02T20:00:00Z`; the final 24 wall-clock hours are protected for release regression, hosted clean-room/client proof, accessibility evidence, video, submission materials, and contingency. No feature implementation is allowed in that reserve.

The table below is the full-public-path forecast retained for later A0P evaluation; it is not the local G4L entry inequality. Capacity uses three different units and never subtracts person-hours directly from wall time:

- **aggregate agent-hours** include root implementation plus parallel subagent review/test effort;
- **critical-path wall hours** are the elapsed dependency chain after allowed parallelism; and
- **external/user latency** is elapsed waiting/coordination for approvals and hosted services. Human-active work is capped at 4 hours P50 / 8 hours P90 and is included in aggregate effort; Amit is not assumed to work the engineering hours.

| Workstream | Aggregate agent-hours P50 | Aggregate agent-hours P90 | Critical-path wall P50 | Critical-path wall P90 |
|---|---:|---:|---:|---:|
| Replacement G1–G4L artifacts, remediation, and reviews | 12h | 20h | 5h | 8h |
| Native primary-client and fixed-PDF portability spikes | 10h | 16h | 7h | 12h |
| Foundation, PostgreSQL, security baseline, migrations, CI | 10h | 16h | 6h | 10h |
| Parser, goldens, domain policy, provenance | 13h | 20h | 8h | 13h |
| Accessible manual UI, review, submission, receipt | 22h | 34h | 13h | 21h |
| Six-tool bridge, consent, visible-store reconciliation | 13h | 22h | 8h | 14h |
| Integration, races, E2E, security, accessibility, hosted proof | 26h | 42h | 14h | 24h |
| **Engineering subtotal** | **106h** | **170h** | **61h** | **102h** |
| External/user/provisioning latency allowance | — | — | 4h | 12h |
| Explicit remediation reserve | — | — | 8h | 20h |
| **Pre-freeze calendar demand** | — | — | **73h** | **134h** |

This plan relies on autonomous goal-mode execution and parallel independent reviews, not continuous user labor. Task/Mac unavailability consumes wall time and triggers the same rebase as any other delay. At G1 lock, `status.md` records the exact remaining time to freeze and scheduling slack. Immediately before G4L approval, before A0L/H0, and at every local wave close, use the local-candidate inequality:

`remaining hours to 2026-09-02T16:15:00Z local-candidate cutoff >= unfinished A0L active wall + unfinished H0–H72 fully loaded local schedule P90 + genuinely unresolved local-only latency + 20h remediation reserve`

At complete local start the right side is `0.50 + 72 + 0 + 20 = 92.50h`. A genuinely unresolved local-only dependency is added when it exists; deferred A0P, hosted, provider, public, and submission work is never called finished or charged to this local gate. If this local inequality fails, G4L cannot pass without a reviewed scope cut.

Only when A0P opens, recompute the public-promotion inequality against the same internal release-only start using every still-unfinished A0P active unit, the unfinished H72–H94 fully loaded envelope, unresolved external/user latency, and the 20-hour reserve. A failed or non-ready A0P, missed public-decision deadline, failed public inequality, or failed G5B-H sets `public_release_no_go`; it never blocks or invalidates items 1–10 or a truthful local candidate. Item 12 remains governed separately by its protected 27.75-hour release-only envelope.

### Blocking checkpoints

- **Within 12 amended critical-path wall hours after local gate A0L:** the exact primary client must empirically discover all six tools on the actual local route, receive a value-free pre-consent refusal, read protected data after visible consent, and cause one genuine visible local-PostgreSQL mutation. Three consecutive unedited raw runs of the state/rules/evidence/apply/branch-re-read/issues sequence must each complete within 120 seconds with no missing call; Chrome and harness evidence are supplemental only. The pinned parser must parse a committed PDF with stable anchors under Node 24, a production Next build, isolated Linux, and the local production runtime. This `G5B-L` checkpoint permits local items 3–10 only. After explicit public-release authority, `G5B-H` runs as a blocking subgate inside item 11/G9: it repeats parser and exact-client proof on the selected hosted runtime and authorized public HTTPS origin before any hosted-compatibility/release claim and before item-11/G9 closure.
- **By amended H30 after A0L:** the complete Supported manual flow must reach an immutable matching receipt.
- **By amended H48 after A0L:** the Conflict flow, all six real tools, applicant resolution/declaration, and review preparation must work locally end to end.
- **By amended H72 after A0L:** the core automated suite, retained PostgreSQL races, security canaries, and primary accessibility flow must pass.
- **Twenty-four hours before deadline:** feature freeze is mandatory.

Failure of the local primary-client/parser checkpoint or the 120-second raw sequence is an immediate local scope/no-go review. A local checkpoint slip over six critical-path hours, a failed local G4L inequality, or a local defect that cannot fit the remaining remediation reserve also reopens local capacity. A missed A0P authorization deadline, non-ready A0P, failed public inequality, or failed hosted G5B-H instead sets `public_release_no_go` while honest local work may continue. A six-tool local latency failure may merge the least differentiated read tools only through formal G1/G2 reopening; it may not silently change the contract. Recovery may not introduce a shim, precomputed production claims, simulated invocation, skipped accessibility/security tests, or unsupported success claim.

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| Experimental WebMCP/client behavior | Register the six tools once, make the native-client spike first, retain a complete manual UI, and claim only the exact tested client/version. |
| Parser portability | Fixed allowlisted PDFs, one bounded deterministic adapter, early Node/Linux/production/host proof, and no hidden manifest fallback. |
| Scope regrowth | Enforce numeric caps, no hackathon stretch list, and reopen capacity before any cap changes. |
| Privacy/security overclaim | Synthetic fixed data only, server-enforced consent, least disclosure, strict session/handle scope, value-free logs, and black-box canary tests. |
| Human-control overclaim | Expose no semantic submit capability, require visible review/submit, and explicitly disclaim proof of personhood or privileged-browser resistance. |
| Buyer/impact uncertainty | Present a testable hypothesis and open community value; do not invent customers, user research, savings, or ROI. |
| Public abuse/retention | Use the allocated PostgreSQL `rate_buckets` admission path, strict payload/session limits, a 60-minute access TTL, synthetic-only records, no automated deletion claim, and provider-retention wording verified for the selected host. |

## G1 Replacement Exit Criteria

G1 passes only when:

- independent product/UX, engineering/security/test, and Devpost-judge reviewers approve this exact replacement artifact;
- all P0/P1 findings are resolved in the artifact or explicitly accepted with a documented rationale;
- reviewers agree that the exact committed loop remains competitive under all four official judging criteria;
- the six-tool/one-registration/real-parser decisions and every named cut are reflected consistently in the agent contract, learner profile, status, build notes, and saved guided-build state;
- the prior PRD and specification are marked historical and no longer appear as implementation contracts; and
- no application code has started.

Only then may G2 be regenerated from this scope.
