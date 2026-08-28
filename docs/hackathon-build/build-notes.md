# Hackathon Build Notes

## 2026-08-27 — Product-selection standard

- Amit rejected the initial food-rescue concept because it did not feel compelling enough.
- Amit pushed the team away from simulations presented as real products and toward demonstrably real integrations, real users, real problems, and credible commercial or community value.
- Amit clarified that a cloud product must not be restricted to one provider.
- Active shaping quote: “Is it real useful for real users, what is the problem it is solving, is it really a problem, how do we fix it, will someone pay for it and why? If free, is it helpful for community?”
- Decision rule: no idea advances until those questions have concrete answers and its WebMCP role is essential rather than decorative.

## 2026-08-27 — Market and hackathon mapping

- A generic multi-cloud incident investigator is rejected. AWS, Azure, GCP, Datadog, PagerDuty, Rootly, and incident.io already cover much of investigation, evidence, approvals, audit, and remediation.
- A generic WebMCP inspector, evaluator, or security gateway is also rejected. Official and community WebMCP inspectors/eval runners/workbenches already occupy that surface.
- Current leading direction: a cloud-neutral **Incident Agent Flight Recorder / Assurance Lab**. It captures a controlled real cloud incident into a frozen, portable evidence capsule, replays identical evidence against different agents through WebMCP, scores claims/tool use/safety/approval compliance, and produces an auditable report.
- Product boundary: it does not replace cloud monitoring or incident response. It tests whether an incident-response agent is safe and reliable before that agent receives production authority.
- Commercial hypothesis: platform, SRE, security, MSP/MSSP, and regulated teams pay for private runners, cloud and observability connectors, policy packs, redaction, retention, and regression testing.
- Community hypothesis: publish the capsule schema, local runner, and ground-truthed benchmark packs so agent builders can reproduce failures and improve safety without production access.
- Defensibility hypothesis: the moat would be the ground-truthed incident corpus, adapter fidelity, longitudinal agent results, and trusted policy packs—not WebMCP itself.
- Honest demo boundary: cloud-neutral core and schema; name only the providers actually tested. Prefer one real, controlled live-cloud drill plus Azure/GCP/OpenTelemetry fixtures or test events unless authenticated sandbox accounts are available for all three.
- Runner-up: an accessibility remediation studio. It has a clearer immediate buyer and easier real demo, but its market and feature surface are substantially more crowded and its WebMCP novelty is weaker.

## 2026-08-27 — MCP versus WebMCP architecture correction

- AWS, Azure, and Google Cloud all publish server-side/backend MCP capabilities. No official documentation reviewed establishes a supported `document.modelContext` WebMCP contract on their management-console incident pages.
- Browser support is not website support: Chrome/Edge may implement the WebMCP API, but each website must register its own tools. Our product therefore implements WebMCP on a web application we control.
- Proposed architecture: cloud APIs, webhooks, OpenTelemetry, and optionally provider MCP servers feed a least-privilege capture/normalization backend; our incident page exposes incident-scoped WebMCP tools over the normalized store. Cloud credentials never go into browser tool arguments.
- A WebMCP wrapper around cloud APIs is not sufficient value and is rejected. Providers could add that surface themselves.
- Generic agent traces, evaluation, mock tool responses, safety scores, replay, and import/export are also not unique; Google Agent Platform and other systems already offer substantial versions of them.
- Sharpened product thesis: an independent **Cross-cloud Incident Agent Certification Lab**. It black-box tests third-party browser agents on identical frozen, incident-specific evidence through one WebMCP contract, then scores causal evidence coverage, unsafe actions, approval compliance, rollback planning, and recovery verification.
- Defensible combination: open provider-neutral incident capsule + real/sanitized cross-cloud incident corpus + browser-agent compatibility + domain-specific safety benchmark + portable certification history.
- Future operational extension: an ordered, portable incident trace across cloud events, MCP/API calls, browser actions, human approvals, tickets, and third-party tools. This complements provider logs rather than claiming they lack auditing.
- WebMCP is the hackathon interaction surface and a useful no-install, tab-scoped distribution mechanism. It is not the business foundation or moat; the same domain service should remain exposable through REST/MCP as WebMCP evolves.

## 2026-08-27 — Candidate parked; web-first search opened

- **Parked candidate A:** Cross-cloud Incident Agent Certification Lab. Preserve all prior research and architecture; it is not the selected project.
- New selection question from Amit: because WebMCP is a producer-side website API, should the winning project concentrate on a web-first product whose site we own or whose operator intentionally installs our integration?
- Working rule: browser support alone does not make an unmodified third-party site WebMCP-capable and does not reveal additional private data. A site must register tools, or an explicitly installed extension/adapter must add its own behavior with appropriate permissions.
- A shopping assistant that merely scrapes or actuates Amazon, Flipkart, or another retailer is not automatically a WebMCP product. Any additional product, price, policy, safety, or comparison data must come from visible page content or authorized external APIs; WebMCP only exposes structured actions and context.
- Explore web-first ideas where tab-bound state, the user's authenticated session, visible human review, and reliable structured actions are core product advantages.

## 2026-08-27 — Web-first candidate ranking

- Current recommendation: **ProofFill — an evidence-backed copilot for high-stakes forms.** Working line: “Autofill guesses; ProofFill shows its work.”
- Initial wedge: an owned, instrumented application journey such as a benefit, grant, insurance, rental, admission, or employee claim—not arbitrary third-party government sites.
- Distinguishing workflow: ingest synthetic supporting documents; map each answer to evidence; expose uncertainty and contradictions; require clarification where support is missing; show a final diff; keep submission human-controlled; issue a field-level provenance receipt.
- Why WebMCP is central: declarative tools operate on the actual live form and its conditional validation in the user’s visible session. The result is not merely saved-profile autofill or a chatbot that produces untraceable answers.
- Buyer hypothesis: institutions and form platforms pay to reduce application errors, abandonment, manual review, and support load. A sponsored/free public-interest edition can improve access to essential services.
- Honest demo: three owned forms with shared synthetic documents, branching questions, conflicting evidence, unsupported-claim blocking, visible approval, and a submission receipt. Do not claim universal website support.
- Runner-up: **ShowMe Once**, a private semantic task recipe recorded through participating WebMCP pages and safely replayed with different user values. Novel and demo-friendly, but the present pain and buyer are less certain.
- Third: **Fix-First Case Router + Technician Handoff Passport.** Real repair, warranty, recall, and e-waste pain; strong visual demo and community value. Generic AI repair and digital product-passport versions are rejected because iFixit FixBot, manufacturer apps, lifecycle platforms, and emerging regulation already occupy them. The viable wedge is cross-brand safety routing plus a technician-ready evidence handoff.
- Fourth: **Agent-coached Inquiry Lab.** Engaging demo and direct semantic state control, but PhET, Khanmigo, Labster, PraxiLabs, and Gizmos make the broad product crowded. A one-lab provenance standard could be useful, but near-term willingness to pay and moat are weaker.
- Fifth: **Agent Seatbelt**, a preview/policy/receipt layer for state-changing WebMCP actions. Future-relevant and technically aligned, but presently developer-focused and likely to be absorbed in part by browsers and agent platforms.
- Market signal: recent browser-agent discussion focuses more on reliability, state, action safety, approval, and traceability than on autonomous novelty. Selection should reward products where a wrong action is costly and a visible evidence trail materially improves trust.
- Selection status: recommendation made, but no candidate is final until Amit reacts and supplies the available build-time budget.

## 2026-08-27 — ProofFill goal activated

- Amit authorized implementation in durable goal mode and selected a quality-first operating policy: multi-agent review at every stage, full applicable flow testing, remediation before progression, continuously updated agent/status documentation, and no shortcuts or demo hacks.
- Selection is now treated as confirmed: **ProofFill** is the active project. Parked candidates remain research context only.
- Official Devpost data fetched this turn: submissions close at `2026-09-03T20:00:00Z` (`2026-09-04 01:30 IST`). The build is planned as a seven-day quality sprint; Amit said there is enough time and explicitly prioritized quality over speed.
- Official judging criteria are equally weighted on a five-point scale: WebMCP Leverage, Execution, Potential Impact, and Creativity & Ambition.
- Official submission constraints that now shape the build: working live URL; public source repository with a visible open-source license; public demo video under three minutes with audio; explicit tested agent/client list; clear explanation of WebMCP fit, human-agent collaboration, user-experience improvement, and implementation.
- Workspace audit: the project directory currently contains planning/state files only and is not yet a Git repository. Repository initialization, license selection, application scaffold, deployment, and public-repository setup must be explicit checklist items. No deployment or Devpost write is authorized yet.
- Stage-gate rule: a stage passes only after its artifact exists, independent subagent reviews complete, all material findings are resolved or explicitly accepted, applicable automated/manual verification passes, and the status/journal records the evidence.

## 2026-08-27 — Stage 0 review corrected the concept and name

- Independent product, judge, and repository reviewers all returned a conditional go, not an unconditional approval.
- The generic “evidence-backed autofill” framing was rejected as insufficiently differentiated. The scoped product is now an owned education-aid portal with a site-enforced evidence policy: an external agent proposes source-linked drafts through WebMCP, while deterministic application logic blocks unsupported, contradictory, stale, or low-confidence required values and the applicant controls submission.
- The project is limited to one scholarship/fee-assistance workflow. The prior three-form idea is retired from v1; a second compatibility portal is stretch-only after the complete primary flow passes every gate.
- “Verified” is prohibited for model/OCR-extracted values. Use source-linked, user-declared, missing, conflicting, stale, or low-confidence; v1 does not authenticate documents or decide eligibility.
- **ProofFill is retired as a name** because an active evidence-backed questionnaire product already uses it. An eight-candidate obvious-collision screen selected **CiteApply** as the lowest-risk working codename. This is not trademark clearance; Amit must ratify the public name before launch.
- Timebox assumption is now concrete: use the seven remaining calendar days as the scope ruler, target six days for build/verification, and retain one day for deployment proof, demo, submission materials, and contingency. If needed, cut stretch breadth before quality or safety gates.
- Scope deepening used the full prior conversation plus three independent audit passes; no redundant user questions were asked because Amit explicitly authorized autonomous quality-first progression and already supplied the product-selection criteria.

## 2026-08-27 — G1 scope remediation

- Three independent scope reviewers returned conditional verdicts. No reviewer allowed progression without changes.
- The most important correction: an agent-supplied `userDeclaration` would defeat the entire evidence policy. The scope now permits an agent to bind an allowed claim or propose an unresolved value only. A declaration is a versioned human record created through the visible UI and cannot satisfy evidence-required fields.
- Submission wording is now precise: CiteApply exposes no WebMCP or agent-facing submit capability and requires a visible, version-bound confirmation, but does not claim proof of personhood or protection from every privileged browser automation mechanism.
- The committed deadline slice was reduced to one portal, 8–10 fields, one branch, exactly two synthetic evidence packets, deterministic text-PDF extraction, one conflict, review/approval/submission/receipt, refresh/resume, stale protection, and one real external-client trace.
- Arbitrary upload, image OCR, model extraction, a second branch/client/portal, and generated receipt PDFs are not mandatory v1 work.
- Real external-client feasibility is the first implementation spike after the planning gates. A harness is required for CI but cannot substitute for actual WebMCP discovery and invocation evidence.
- Scope now includes consent-gated sensitive tools, untrusted-document boundaries, exact-diff approval binding, replay/idempotency tests, anti-hardcoding proof, clean repository/deployment checks, and an explicit state machine.
- G1 remains open until product, judge, and technical reviewers recheck the remediated artifact.

## 2026-08-27 — G0 and G1 passed

- Product/market/UX, Devpost-judge, and technical/privacy/testability reviewers independently rechecked the remediated scope and each returned **PASS** with no remaining material scope blocker.
- `docs/hackathon-build/scope.md` is locked. Any change to the one-portal deadline slice must reopen G1 and be reviewed again.
- Git was initialized on `main`; no application code exists. The planning baseline commit will be created after the gate documents and state are validated.
- Guided-build state now records CiteApply, the scope path, completed onboarding, and `build-prd` as the next stage.
- G2 product requirements started immediately under Amit's autonomous goal-mode instruction. No redundant confirmation was requested.

## 2026-08-27 — G2 PRD drafted and remediated

- The PRD locks ten possible fields, one guardian-dependency branch, two three-PDF synthetic packets, the exact supported/conflict/manual/blocked journeys, visible statuses, five information-architecture stages, and measurable black-box acceptance criteria.
- Three parallel preparation passes and three formal reviews were used. The prior conversation supplied the mandatory beats; one deepening round focused on field policy, consent, declarations, races, recovery, accessibility, buyer/community value, and demo proof.
- Product review caught a P0 policy gap: income was initially conditional, so an independent applicant could avoid financial evidence. Income is now always required; guardian name and household size alone form the branch.
- Security review caught a P0 disclosure gap: consent now gates every value-bearing WebMCP output, not merely the evidence index. Always-available metadata contains no applicant values; exact source snippets and the complete review diff are human-UI-only.
- Consent copy no longer claims control over privileged browser/page access. It governs only CiteApply's structured WebMCP disclosure and cannot retract information already returned.
- Manual edits remove mismatched bindings/declarations and invalidate review; populated branch closure requires visible confirmation and clears inactive values; equal normalized claims use deterministic primary binding without a false conflict.
- Recovery is explicit for revocation/cancellation/reset races, stale versions, expired/wrong confirmation, unknown submission outcomes, refresh during every commitment state, receipt failure, and submitted-state locking.
- Judge review separated the minimum feasibility spike from the final non-trivial composed WebMCP trace and separated the two-minute video proof from repository regression proof.
- Bulk draft removal and starting/deleting another submitted demo were cut from v1 to protect the locked deadline slice.
- G2 remains open until product, security/test, and judge reviewers recheck the remediated PRD.

## 2026-08-27 — G2 passed

- Product/UX/accessibility, security/privacy/testability, and Devpost-judge reviewers independently rechecked the remediated PRD and each returned **PASS** with no remaining material blocker.
- `docs/hackathon-build/prd.md` is locked. It is the observable product contract for G3; material changes reopen G2.
- The saved guided-build state now records completed scope, current PRD, and `build-spec` as the next stage.
- The initial planning baseline commit is `ecc9f9d`. Its automatically generated local committer email must be replaced with Amit's chosen repository-local identity before any public push; no public repository action has occurred.
- G3 technical specification and threat modeling started immediately under the authorized autonomous workflow. No application code has begun.

## 2026-08-27 — G3 technical specification drafted

- Primary documentation was rechecked for the current WebMCP draft/Chromium contract, Chrome origin trial and security guidance, OpenAI desktop-client support, Next.js/Node, PostgreSQL/Neon/Drizzle, PDF parsing, and test/accessibility tooling.
- The proposed system is one Next.js 16.3.3/Node 24 modular monolith with a pure TypeScript domain core, thin same-origin Route Handlers, PostgreSQL 17 locally/in CI/in Neon, Drizzle/node-postgres interactive transactions, and no in-product model or unnecessary service.
- The six-tool WebMCP contract is explicit: two always-registered redacting reads and four consent-gated evidence/draft/validation/review capabilities. There is no declaration, conflict-resolution, confirmation, submission, packet-selection, arbitrary-document, or fill-everything tool.
- Current registered callbacks return plain JSON-serializable objects. The draft/Chromium mismatch in the in-page `executeTool()` helper is isolated to a test-only adapter and cannot influence production policy.
- Sensitive disclosure uses a page-memory capability separate from the HttpOnly demo session, synchronizer CSRF token, and page-memory one-use review approval. Refresh/revoke/reset behavior and privileged-extension limitations are stated precisely.
- A persisted operation ledger plus PostgreSQL row locks/compare-and-swap linearizes stale writes, idempotency, cancellation, revocation, reset, and unknown submission outcomes. Real PostgreSQL controlled-barrier tests—not an in-memory fake—must prove both race winners.
- The evidence pipeline parses exactly six committed text-native synthetic PDFs through one reviewed adapter, verifies hashes/limits, extracts kind-specific labels, persists exact page/character anchors, and compares real parses to test-only goldens. `pdf-parse` 2.4.5 is only a candidate until local Node 24, Linux, Next production build, and hosted-runtime spikes pass.
- Exact current candidate versions, data model, state machines, endpoints, security headers, threat matrix, retention, logging allowlist, accessibility/manual matrix, CI lanes, performance budgets, deployment credentials, and under-three-minute proof flow are recorded in `spec.md`.
- The current host has Docker 29.4.0 but defaults to Node 26.7.0; the project must explicitly select Node 24.20.0. Deployment/database/origin-token/public-repository actions remain unauthorized.
- The 1,021-line draft passed `git diff --check` and is now under three independent formal reviews. No application code exists.

## 2026-08-27 — G3 first review failed and was remediated

- All three independent lanes correctly blocked G3. The WebMCP/judge lane found the six-tool surface was still prose rather than an exact snapshot-testable contract. The product/feasibility and security lanes found P0 ABA, cancellation, protected-disclosure, and submission-reconciliation races. No implementation work started.
- The revised specification uses a nonsecret random `draftEpoch` plus rotated `csrfEpoch` on every mutable/authority/parser/snapshot path; late old-page requests and responses cannot reuse a reset version zero.
- State-changing work now has a durable reservation followed by one short final transaction with a documented global PostgreSQL lock order. Cancel/revoke/reset and commit have reachable linearization points and a mandatory real-PG barrier matrix.
- Protected reads now reserve a server execution, authorize exact serialized bytes under final grant locks, classify disclosure before revoke completes, and pass a browser grant-epoch check immediately before resolving the native callback.
- Submission is an acknowledged intent → commit protocol. Intent binds the visible approval but cannot submit; the browser may call commit only after acknowledgement. Status cancels a still-reserved intent or returns the commit-first receipt, and refresh derives the sole pending pointer server-side without browser-stored application data.
- The parser now has claim/worker/finalize phases, an expiring attempt lease, exact epoch/hash/attempt/version compare-and-swap, one terminal version increment, and a blocking proof that worker termination actually stops timeout work.
- `WebMCP Contract v1` now records exact closed identifiers, six full strict input schemas, descriptors/descriptions/annotations, result DTOs, errors/actions, cursor bindings, output budgets, atomic registration rollback, cancellation semantics, and the exact ChatGPT/Chrome support matrix.
- Session start/CSRF bootstrap, exact body/rate/concurrency limits, relational ownership/delete order, canonical review/receipt projections, provider-backup retention wording, one-session demo chronology, release freeze, dependency versions, and G4 capacity no-go rules are explicit.
- The remediation expanded `spec.md` from 1,021 to roughly 1,700 lines because security and agent contracts are now executable rather than implied. `reviews/03-spec.md` maps every first-pass finding to its disposition. G3 remains closed pending local preflight and unanimous recheck.

## 2026-08-27 — G3 deep recheck remediation continues

- The recheck deliberately remained open after the first large rewrite. Reviewers found additional P0/P1 lifecycle edges in keyed request privacy, operation capacity, cross-tab submission generations, page authority, approval retention, exact expiry semantics, and physical cleanup throughput. No application code was started.
- Submission reconciliation now uses a randomized AES-256-GCM status-only envelope containing the complete original digest preimage and server binding. Intent, commit, and status authenticate the same outer tuple; status can fence an absent/delayed request after the current review/version changes without persisting a raw digest or reconstructing mutable review data.
- Page authority is now durable and recoverable: a counted same-origin/no-store GET mints a one-load bootstrap token; POST bootstrap/renew/check-pending advances page generations, renews in-document before 30 minutes, preserves dirty input during soft rebootstrap, and cancels an orphaned different-lineage intent only at authoritative expiry. Retention is capped at 192 page rows without a smaller active-lineage cap.
- Consent and confirmation retries replace prior same-page authority under locks, so lost responses do not accumulate unreachable live capabilities. Authority/coordination FKs are RESTRICT with live-non-null constraints and explicit terminalize/scrub/null-before-parent cleanup.
- All expiry-dependent PostgreSQL decisions now use one same-client `SELECT clock_timestamp()` after relevant locks and nontrivial work, immediately before the conditional transition. Transaction-start/process timestamps are forbidden and will be statically plus real-PG boundary tested.
- Retention admission is now capacity-coupled instead of aspirational: at most 20 new sessions/fixed UTC hour, nominal per-minute authorized cleanup, one unique success marker/minute, automatic new-start shutdown beyond a 20% miss allowance, and a mandatory maximum-child-graph benchmark proving `1,152 >= 1,000` even across the worst rolling-window boundary. Vercel Pro/equivalent cadence and any spend/provisioning remain blocked until Amit explicitly authorizes them.
- At this checkpoint the specification exposed 20 API route families plus 3 user-facing page routes over 15 tables. `reviews/03-spec.md` recorded 59 findings and their candidate dispositions; deeper review continued after this checkpoint. Product and security reviewers remain in full contradiction/feasibility reread, and the judge lane will be reactivated only after the candidate freezes.

## 2026-08-27 — G3 delivery-feasibility NO-GO and scope reopen

- The deep-remediation candidate ultimately reached 6,720 lines, 75,417 words, and 642,661 bytes, with 23 HTTP/page surfaces, 15 tables, three blocking portability spikes, eight real-PostgreSQL concurrency-proof families, and zero application code.
- Mechanical checks passed: all TypeScript fences parsed with Node's TypeScript stripper and `git diff --check` was clean. That established document syntax, not delivery feasibility.
- Independent product/feasibility and repository/security reviewers both returned a hard NO-GO for the seven-day quality window. Even an unrealistically optimistic component-only lower bound consumed 60 hours before UI/domain work, integration, remediation, accessibility, deployment, clean-room proof, video, or the required final 24-hour reserve.
- Active shaping from Amit remains decisive: “no hacks,” “no shortcuts,” “no laziness,” and test/review every stage. The correct response is therefore to cut breadth before code, not to implement an untestable fraction or relax retained safety promises.
- G1 and G2 are formally reopened. The long specification and review remain evidence of explored risks, but they are not an approved implementation contract.
- The replacement scope must keep the judged product loop: owned scholarship portal, real WebMCP discovery/invocation, two fixed synthetic packets, site-enforced source binding, one structured conflict/refusal, visible declaration, exact review, human-only submission, and matching receipt.
- Candidate cuts under independent review: same-epoch policy migration; parser lease/worker-retry protocol; multi-lineage/page-renewal/three-tab authority graph; acknowledged intent/commit/encrypted reconciliation; production-scale admission/cleanup/WAF arithmetic; server-streamed value-bearing receipt; broad historical replay and retained-row limits. Safety claims shrink with those surfaces rather than being waived.
- Scope deepening used the complete prior product conversation plus the failed G3 capacity evidence; no repeated user interview was needed because Amit already provided the target user/problem/value/payment/community/WebMCP/demo/quality criteria and authorized autonomous progression.

## 2026-08-27 — Replacement G1 candidate frozen for review

- Three independent clean-sheet rescope passes agreed that the differentiating proof must remain: one owned scholarship portal, two fixed synthetic evidence packets, site-enforced source binding, a real income conflict/refusal, visible applicant declaration/resolution, exact review, human-only submission, and a matching receipt.
- The candidate locks exactly eight fields, one guardian branch, two packets with three one-page PDFs each, one primary external client, and one complete manual fallback.
- The WebMCP surface remains six composable tools because state, policy, evidence, mutation, deterministic issues, and review preparation are distinct judge-visible acts. All six register once for experimental-client portability. Server-enforced consent—not descriptor visibility—is the authority boundary; protected calls before Allow and after Revoke return a value-free refusal.
- Production parses all six committed PDFs at runtime through one hash-pinned, bounded deterministic adapter. Test goldens cannot enter the production import graph. Preprocessed production claims were rejected as incompatible with the product claim and Amit's no-hack instruction.
- The scope removes dynamic tool lifecycle, arbitrary upload/OCR, multi-page authority graphs, offline/collaborative-tab promises, parser workers/retries, online policy migration, two-phase/encrypted submission reconciliation, persistent approvals, streamed receipts, production-scale retention machinery, extra clients, and all hackathon stretch features.
- Hard caps are one portal, exactly six tools, three page routes, at most eight API families, six product tables, five real-PostgreSQL race families, and a replacement specification under 15,000 words.
- Conservative delivery forecast is 65 focused hours P50 and 123 hours P90 including a 21-hour integration/remediation reserve, followed by a protected 24-hour release window. Primary-client and parser portability must pass within 12 post-G4 build hours or the project immediately reopens scope/no-go review.
- The 4,124-word replacement scope candidate is `eb6130c7abd4cd04d3629a626d5a7b0024e8d0d3b152440baa2df735f72a7c87`. Product/UX, engineering/security/test, and Devpost-judge reviewers are independently reviewing that exact artifact. G1 remains open and no application code has started.

## 2026-08-27 — Replacement G1 first review remained conditional

- All three lanes reviewed the same 4,124-word hash and returned **CONDITIONAL**, with no P0 concept blocker. The judge lane scored the concept 4.25/5 overall but did not pass the gate.
- Product/UX found two P1s: no manual review-preparation/Return-to-edit lifecycle, and insufficiently informed assisted-access copy.
- Engineering/security found five P1s: focused-hours versus wall-time capacity math; authority-before-idempotent-replay contradiction; in-flight disclosure/takeover overclaim; a transactional cancellation promise unsupported by native abort; and admission/cleanup/read races hidden outside the numeric caps.
- Judge review added three P1s: insufficient first-ten-second payoff, official submission obligations not made normative, and no actual-time/external-authorization rebase.
- The remediated candidate adds the complete Review/Return/re-review lifecycle, explicit consent categories/actions/exclusions/in-flight limits, a same-session cold open with real mutation by second 10, normative release obligations, and an explicit authorization deadline.
- Current authority now precedes replay projection. Read-first versus authority-loss-first outcomes are precise, and protected reads join the takeover/review-close/revoke race. Native cancellation is deliberately narrowed to graceful best effort with authoritative reconciliation; no durable cancel/rollback protocol is claimed.
- A concrete cap witness uses five tables, six API families, three pages, and four PostgreSQL race families. A PostgreSQL `rate_buckets` path covers bounded demo admission; there is no cleanup endpoint or immediate physical-deletion claim.
- Capacity now separates 170 aggregate agent-hours P90, 102 critical-path wall hours, 12 external/user latency hours, and a 20-hour remediation reserve: 134 pre-freeze wall hours P90. G1 and G4 must rebase this against actual remaining time.
- The remediated 5,681-word candidate is SHA-256 `9be525de0dc769f223ca10592ca233e880b93337a316afb15bc15a152436c0a4`; `reviews/01b-rescope.md` maps every finding to its candidate disposition. Exact-hash recheck is pending; G1 remains open and no application code has started.

## 2026-08-27 — Replacement G1 passed

- Product/UX/accessibility, engineering/security/test, and Devpost-judge reviewers each reread the complete 5,681-word remediated scope and returned **PASS** with no remaining P0/P1.
- After the status line changed from candidate to approved, all three reviewers independently verified final SHA-256 `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`, reproduced the passed content hash by restoring only that line, and confirmed no material change.
- G1 capacity was rebased at `2026-08-27T12:06:50Z`: 151.89 wall hours remained before feature freeze, P90 pre-freeze demand was 134 hours, and conservative scheduling slack was 17.89 hours. The slack is not a feature budget, and G4 must rebase again.
- The locked build is now exactly one portal, eight fields, one branch, two packets/six runtime-parsed PDFs, six once-registered tools, informed server-enforced consent, one structured income conflict, complete manual review/return/re-review, human-only declaration/resolution/submit, and one canonical session receipt.
- The starting architecture witness is five tables, six API families, three pages, and four PostgreSQL race families. Strong transactional cancellation was cut; native abort is best effort with atomic outcome reconciliation.
- `.devpost-hackathon-state.json`, `AGENTS.md`, `learner-profile.md`, `status.md`, historical PRD/spec banners, and `reviews/01b-rescope.md` now agree. Guided-build state points to `build-prd`.
- Replacement G2 starts next under the same goal-mode discipline. No application code has begun, and none may begin until replacement G2, G3, and G4 pass.

## 2026-08-27 — Replacement G2 drafted from the locked scope

- The historical PRD was replaced cleanly rather than patched. One nonredundant deepening round used the complete prior conversation plus parallel product/UX/accessibility, engineering/security/testability, and judge/scope lanes.
- The new PRD locks three pages, six primary/exceptional workflow stages plus bounded presentations, 40 stable user-story identifiers, exact fixture values, eight claims/fields, exact manual and assisted journeys, and observable recovery/error behavior.
- Exact applicant-facing behavior now includes the three bounded conflict-reason choices, human-resolved status/edit/discard/clear behavior, plain-language assisted-access disclosure, deterministic Review/Return/reprepare, exact final confirmation, value-free Receipt loading, accepted-but-unavailable Receipt, bounded connection reconciliation, and semantic screen/JSON/print equality.
- The first complete candidate was 12,154 words at SHA-256 `ee1216a010a1d4ed82128f1a0a15e9e246c92bc9a02ba9c29bbd9bd1c796aed0`. All three formal reviewers verified the same bytes and correctly returned FAIL; no application code started.

## 2026-08-27 — Replacement G2 exact-hash remediation cycles

- First-pass P1s removed an unapproved 60-call/100-change/10-Review/latest-20 workflow subsystem, narrowed VoiceOver/manual proof to locked G1, restored full official release/authorization and genuine-client Supported proof, closed initial Receipt/connection recovery, restored parser anti-hardcoding proof, and moved the video ceiling to 2:50.
- Product behavior was made exact: consent names applicant values/current rules/exclusions in plain language; conflict has exact reasons/statuses; Review always opens with complete diff/excerpt access; failed Review focuses the summary; confirmation and unknown-submit copy are fixed; assisted attribution persists with the value.
- Engineering review separated machine outcomes, nested blockers, and browser presentations; defined manual/assisted canonical-hash equality without lying about activity differences; closed expiry/read/apply/prepare orderings; restored redacted state/static-`all` pre-consent modes; and removed conflict history from assisted metadata.
- The first remediated candidate `832cf4885e0d4d299ec658d40f25676fd9e67ccb0bf19441198c6026864313cf` still failed product and engineering recheck because resolved income plus a deterministic Review hash let an agent enumerate the human-only two-source × three-reason choice. It also lacked stable native-abort acceptance and a separate-browser-permission caveat.
- The next candidate masked human-resolved income to readiness-only in every agent projection, made assisted Review metadata fresh/opaque/non-content-derived with no hash/digest, required six-way agent-output indistinguishability, scoped consent to CiteApply's six tools, and added pre-/post-dispatch native-abort barriers without a tombstone, state, API, table, rollback, or new race family.
- Candidate `f38ae047c17e570f2d56923630ee9644335f46952621865b8929822b3ba54aaa` still failed product and engineering because throttling order against expiry/stale/consent was deferred to G3. The PRD now makes throttling a public value-free no-lookup preflight that may win first; a fresh admitted request follows normal authority precedence.
- Candidate `126706dcbd82001b85504dbcc00b09d85d2e1ec8652efedb04de1b165b6b736e` passed every material lane. Engineering and judge then identified one final P2: income can be edited before the guardian branch, so dirty progress must preserve `n` of the current active total, not always `n of 8`. The final wording tests 5/6, 7/8, and 8/8.

## 2026-08-27 — Replacement G2 passed

- Product/UX/accessibility, engineering/security/testability, and Devpost judge/scope each independently passed content SHA-256 `5a315e67169fcb4c1625e943fb4f0ca698179adce4de2277096d21cedde757dc` with no remaining P0/P1/P2.
- After the status-only change, all three independently verified final locked PRD SHA-256 `f9fb37f38aa9a1b3b62ebdc46d5673dd8609669f1392df8f87a49e20a2ade40f` and reproduced the passed content hash by restoring only the prior Draft line.
- The final PRD is 1,036 lines / 14,664 words / 105,055 bytes. `git diff --check` passes and all 40 story identifiers are unique.
- `reviews/02b-prd.md` records every failed cycle, disposition, exact hash, and final proof. The guided state, status, learner profile, agent contract, and review index now point to `build-spec` / replacement G3.
- No application code has begun. G3 must fit every story into the locked three-page/six-API/five-table/four-race witness and stay below 15,000 words; G4 still blocks implementation afterward.

## 2026-08-27 — Replacement G2 final errata and lock

- Two narrow reviewed corrections closed the pre-consent recovery action and externally triggered Review-focus behavior without changing scope. `reviews/02c-prd-erratum.md` and `02d-prd-errata.md` record the exact review and metadata proof.
- The actual final locked PRD is SHA-256 `1fc13ede1edec072f1776d35b88a4c688bfc5a6e33ddda9d554226b9fe37f0f9`, 1,038 lines / 14,835 words / 106,255 bytes. Earlier `f9fb37…` status references are superseded.
- Scope remains SHA-256 `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`; no application code or external mutation occurred.

## 2026-08-27 — Bounded G3 exact-hash review cycles

- The clean replacement specification retained exactly three pages, six APIs, five tables, four PostgreSQL race families, six tools, and all 40 stories. Application implementation stayed prohibited throughout.
- First bounded candidate `c544182…` failed all lanes; `reviews/03b-spec.md` records one P0 plus complete contract, concurrency, dependency, parser, accessibility, client-proof, release, and impact corrections.
- Second candidate `6f278091…` passed the judge lane but failed product and engineering on the rate-cap mutex, close reserve, prepare/edit gate, submit recovery, human DTO closure, parser scan scope, focus erratum, accessibility states, and registration rollback.
- Third candidate `73a74cfe6b445dd45a99186a68769ad642042397b325dbd83b6ce0c8d6835279` passed all mechanical limits but all three lanes correctly failed it. The consolidated G3R3 set covers bootstrap authority, private mutation projection/install fencing, historical replay, exact Review/Receipt relations, submit precedence, route establishment, cookie validity, no-op Revoke reserve behavior, focus, safe support references, countdown/Return copy, deterministic validation dirty handling, Receipt-acceptance gating, and finite anti-hardcoding proof.

## 2026-08-27 — G3 fourth candidate frozen

- Fourth candidate SHA-256 is `47c5379832890c561765e01388df56ea81cb284830768818c3d2920b7c8fa21e`, 1,158 lines / 14,567 words / 119,160 bytes, bound to final G1/G2 hashes.
- Local preflight passes `git diff --check`, balanced 26 fences, exact 3/6/5/4/6 surfaces, and 40 unique story rows. The candidate remains below 15,000 words without deleting genuine-client proof, release obligations, causal demo requirements, manual parity, or impact honesty.
- All three lanes reread the unchanged fourth hash. The judge/WebMCP/rules lane passed, but product/accessibility and engineering/security found twelve consolidated P1/P2 defects. The fourth candidate was rejected; no application code started.

## 2026-08-27 — G4 third checklist candidate frozen

- The first checklist candidate `bd218211…` and second candidate `cd1fc690…` were each rejected by all three independent lanes. The durable review record preserves twelve first-cycle and nine second-cycle findings; application implementation remained prohibited.
- Third-candidate checklist SHA-256 is `e023a597f4f6504c54e9c78d0dc545c1ea0d12f04fb5fe40aed126099c83ec3b`, 148 lines / 6,800 words / 54,320 bytes. It has exactly 12 five-field gates, 608 unique consecutive pre-freeze units totaling 152 aggregate P90 hours, and 42 final-release units totaling 17.5 hours with 6.5 hours retained for final contingency.
- Root-owned frozen contracts, disjoint lane ownership, merge points, H12 production anti-hardcode proof, exact race manifests, mechanical surface caps, full client-environment evidence, authorized Devpost draft preparation, five non-inferable answer fields, critical-work/external-latency semantics, and the exact release tag lifecycle are now explicit.
- At `2026-08-27T17:36:47.487Z`, the live capacity sample left 20.39 hours gross slack beyond 94 critical-work + 12 external-latency + 20 abnormal-remediation hours. Three fresh exact-hash rereads and the immediate pre-lock rebase still block G4.

## 2026-08-27 — G4 third checklist candidate rejected

- Product, engineering, and judge/rules independently reread unchanged checklist SHA-256 `e023a597f4f6504c54e9c78d0dc545c1ea0d12f04fb5fe40aed126099c83ec3b` and all returned FAIL with no P0. The exact arithmetic passed, but the plan was not dependency-feasible and omitted required real actions.
- Wave 0 had a mathematical lower bound of 12.3125 hours before real dependencies, while H12 also lacked the minimum Start/rate/admission kernel and all authorized hosted provisioning/deployment actions. The family-2 manifest omitted clean prepare; every remediation lacked an independent reviewer recheck.
- Item 12 omitted its own evidence/review/remediation closure. Tagging preceded review/remediation/final commit, and repository/license/About/video operations were missing or verified before creation. Current Devpost connector semantics also disprove a remote custom-answer draft: challenge answers are passed only by the final confirmed `submit_project` operation.
- A live read-only requirement refresh at `2026-08-27T17:44:35Z` confirmed required fields `28249`, `28250`, `28252`, `28254`, `28256`, `28257`, `28258`, `28259`, and `28260`; `28251`/`28253` are conditional and `28255` is optional. No external mutation or application implementation occurred.

## 2026-08-27 — G3 fifth candidate frozen

- Fifth candidate SHA-256 is `a7ae079f23bf163a3179f29f1faff9bac6c52916ec4bbdedd6194a4f7599a335`, 1,164 lines / 14,537 words / 119,362 bytes, bound to the unchanged final G1/G2 hashes.
- It normatively disposes G3R4-01 through G3R4-12: independent Start nonce/request uniqueness, direct fresh no-change DTOs, unavailable-income replay, non-redisclosing prepare replay, closed Submitted retry, BFCache challenge/takeover, truthful Review origin, cross-equal submission clocks, value-free establishment failure, dormant callback fencing, unknown-submit expiry copy, and route-specific recovery actions.
- Local preflight passed `git diff --check`, 26 balanced fences, exact 3/6/5/4/6 surfaces, and 40 unique story mappings. All three lanes reread the unchanged hash; judge/rules passed, but product and engineering independently found three P1 regressions and engineering one P2 lock-model ambiguity. The fifth candidate was rejected and no application code started.

## 2026-08-27 — G3 sixth candidate frozen

- Sixth candidate SHA-256 is `c6faa55a7d45d6fe2fd39cf4be36b2439284c389dc4d7ddbf792aa6dc159e459`, 1,165 lines / 14,732 words / 121,092 bytes, bound to unchanged final G1/G2 hashes.
- It preserves Submitted new-ID `stale_state` while restoring Return-first `review_invalidated`; adds a truthful zero-dispatch bridge lifecycle result; makes Review/Receipt assistance activity path-specific; and re-resolves income evidence under the existing Application row lock. Registration rollback is now stated as abort, all settlements, zero CiteApply names, and no retry.
- Local preflight remained clean with the exact 3/6/5/4/6/40 witness and 26 balanced fences. All three lanes reread the unchanged hash; judge/rules passed, while product and engineering found two P1 and two P2 contract defects. The sixth candidate was rejected and no application code started.

## 2026-08-27 — G3 seventh candidate frozen

- Seventh candidate SHA-256 is `d5193ae74029e4634a333435e1c57e20f55ce4d4ab671bc849e8c79a016c453e`, 1,169 lines / 14,816 words / 121,809 bytes, bound to unchanged final G1/G2 hashes.
- It never rewrites server-authorized validation with later dirty state; splits the four string fields into inhabitable Review-diff discriminants; restores protected state's static safe action; and creates/passes one identical registration-lifetime AbortController signal to all six tool calls with rollback proof.
- Local preflight remained clean with the exact 3/6/5/4/6/40 witness and 26 balanced fences. All three lanes rejected the missing validation callback terminal; engineering also proved `webmcp-types@0.1.3` incompatible with the required callback and registration signals. The seventh candidate was rejected and no application code started.

## 2026-08-27 — G3 eighth candidate frozen

- Eighth candidate SHA-256 is `1c189ddca3b5184428855e2cec13ebe4b365bdfc305d5954f12ef6986c2aa2a2`, 1,169 lines / 14,826 words / 121,928 bytes, bound to unchanged final G1/G2 hashes.
- Validation now returns the captured server-final-authorized callback bytes across local drift while reconciling only the human UI; native abort remains the sole ordinary abort terminal. The reviewed declaration pin is `webmcp-types@0.1.5`, with a strict `skipLibCheck:false` signal-signature fixture required.
- Local preflight remains clean with the exact 3/6/5/4/6/40 witness and 26 balanced fences. Three fresh exact-byte full rereads are required; G3 and implementation remain closed.
- All three lanes then reread unchanged content SHA-256 `1c189ddca3b5184428855e2cec13ebe4b365bdfc305d5954f12ef6986c2aa2a2` and passed unconditionally with P0/P1/P2 all zero. The status-only lock is SHA-256 `9baf6bab2e779cd6b014dac982dde1a547802fd77c634074d0662b729c03830a`, 1,169 lines / 14,831 words / 121,951 bytes.
- Product/accessibility, engineering/security/testability, and WebMCP/judge/rules each verified that final hash, restored only the candidate status line in memory, reproduced `1c189ddc…aa2a2`, and made no edit. G3 passed. G4 checklist and live capacity review began; application code remains prohibited until G4 passes.

## 2026-08-27 — G4 checklist candidate and live capacity rebase

- G3 closure was committed locally as `ae494ce`; the repository still contains planning/evidence only and no application implementation.
- The live interval at `2026-08-27T16:52:06Z` was 147.13 hours to feature freeze. Unfinished post-G4 critical-path P90 is 94 hours, unresolved external/user/provisioning latency is 12 hours, and the remediation reserve is 20 hours: 126 hours total and 21.13 hours gross slack before remaining G4 work.
- Three independent capacity lenses recommended retaining the full locked scope. Cutting now would consume review time and weaken evidence; contingency cuts remain available only after a failed inequality or checkpoint.
- G4 candidate `checklist.md` is SHA-256 `bd21821173b1808d7f023e0e526d37c63663742679c1d4dbcc6408885fd494ec`, 170 lines / 3,101 words / 26,582 bytes. It contains 12 ordered five-field items, first-12-hour portability/client no-go, all four PostgreSQL race families, full manual/assisted/accessibility/security flows, a frozen release-candidate gate, and authorization-gated Devpost handoff.
- Local preflight passed `git diff --check` and exact counts of 12 item titles plus 12 each of Spec ref, What to build, Acceptance, and Verify fields. Three exact-hash full reviews are required; implementation remains prohibited.
- All three exact-hash lanes rejected the first G4 candidate. The serial order missed H30/H48/H72; final PDF bytes, informed consent, and the final minimum authority/replay contract appeared after the H12 proof; external authorization was requested after it was needed; ordinary review/integration overhead was not mapped into the 94-hour critical path; atomic execution preferences were absent; and post-deadline immutability was not operationally closed.
- Official rules/FAQ were refreshed during remediation. The FAQ says not to touch the Devpost entry, repository, or live site after the September 3 deadline until winners and to continue only in a separate fork. The replacement checklist will add the immutable release/monitor boundary, live final rules refresh, and a four-criterion judge-evidence matrix.
- Replacement G4 candidate SHA-256 is `cd1fc69079f819bd31228e6634f5ccf305f99716a7cd5e4ccfed5fa1e26bdc05`, 127 lines / 4,786 words / 40,457 bytes. Its 12 stage gates contain 275 numbered 15–30-minute units and exact five-field structure.
- Five explicit dependency waves now reach H12 PDF/client proof, H30 Supported manual Receipt, H48 complete Conflict collaboration, H72 core races/security/accessibility, and H94 frozen release candidate. The wave table maps 150 aggregate agent-hours P90 onto 94 fully loaded critical-path hours with three worker/reviewer lanes plus root; routine integration, evidence, reviews, and one recheck are included rather than charged to the remediation reserve.
- Final six PDF bytes/registrations/minimum anchors, complete consent copy/modal/accessibility, and the final minimum credential/Origin/cap/lock/authority/keyed-replay/log/schema/registration kernel now precede H12. A0 requests the combined authorization package immediately after G4 without performing a mutation.
- The replacement also closes exact Start-transaction timing, review paths, current-heading traceability, four-criterion narrative proof, live final rules refresh, and immutable submitted artifacts until winners actually announce. At `2026-08-27T17:09:04Z`, the candidate still had 20.85 hours gross scheduling slack before remaining G4 review work. Three new exact-hash full passes are required.
- All three lanes rejected the second candidate. Its 250 pre-freeze units could represent at most 125 hours at the promised 30-minute ceiling, not 150; several units still hid multiple contracts/suites/review lanes. Engineering also found Wave 1 consumed unfrozen shared DTOs, H12 lacked mutation/import/bundle anti-hardcode proof, and the race checklist abbreviated required cartesian cases.
- Live read-only Devpost review found no CiteApply/WebMCP project and no local submission draft. The current form requires five user-supplied answers—Submitter Type, Country, App Status, Learning level, and Career AI value—that must never be inferred. The third candidate will schedule authorized project create/update/preview plus explicit answer collection before separate submit confirmation.
- Third-candidate remediation also adds exact H12 client build/model/account/settings/origin/date evidence, mechanical hidden-surface caps, critical-work versus external-latency clocks, and authorized `devpost-2026-final` tag equality.

## 2026-08-27 — G4 fourth checklist candidate frozen

- All three lanes rejected third-candidate hash `e023a597…ec3b` with no P0. The precise arithmetic still serialized Wave 0 beyond H12, omitted complete pre-H12 admission/provider work, missed clean-prepare and takeover proofs, omitted independent post-remediation rechecks, ordered tag/repository/video work impossibly, and incorrectly treated challenge-answer draft persistence as supported.
- Fourth-candidate hash is `92e5f8af9a9b7be4fef4a8bb4c00d20c85156bf6d1a77d96cc4d68a57a6d560f`, 209 lines / 9,335 words / 76,960 bytes. Mechanical checks prove 12 five-field gates, 609 consecutive unique pre-freeze units totaling 167 aggregate P90 hours, and 75 final-window units totaling 23.25 aggregate / 17.5 critical hours with 6.5 hours contingency.
- Root invalidated the first dispatched fourth-candidate hash before any verdict because the H12 raw trace did not explicitly name every required client-environment field and conditional units could be read as silent skips. The frozen replacement names app/build/model/account availability/settings/origin/UTC date and requires a receipt or signed inapplicable/no-change disposition from every conditional unit.
- Integrated Wave 0 is now a four-slot 129-unit DAG: 42.75 aggregate hours inside 48 slot-hours, exact H12 closure, three 30-minute initial reviews, three exact-candidate rechecks, real provision/configure/migrate/deploy receipts, complete Start/admission, and three fresh ordinary `/api/demo` genuine-client runs. There is zero critical-path slack; a 15-minute critical slip forces reforecast.
- The race contract contains 65 individually named row artifacts across exactly four families: 15 admission/replay, 21 WebMCP authority/recovery, 18 human-change/prepare/Return, and 11 submit/recovery. It includes clean/dirty prepare, both authority winners, takeover no-growth/replay, duplicate versus changed confirmation, and lost-submit versus lost-takeover.
- The final release sequence keeps challenge answers local until an immediate exact “yes, submit”; create/update are core-only, thumbnail is separate and conditional, and only live `Submitted` plus matching relationship/public URL/non-null `submitted_at` counts. Tag/manifest/push equality and post-submit immutability are ordered after all evidence/reviews/rechecks.
- At `2026-08-27T18:10:02.299Z`, 145.83 hours remained versus the 126-hour fully reserved post-G4 demand, leaving 19.83 hours gross slack. Three new exact-hash full rereads and status-only metadata proof still block application implementation.

## 2026-08-28 — G4 fourth candidate rejected; fifth candidate frozen

- Product, engineering, and judge/rules independently reread unchanged fourth-candidate hash `92e5f8af…560f`, verified it before and after, made no edit, and all returned FAIL. The consolidated G4R4 union covers phase-owner collisions, missing pre-H12 domain behavior, false wave closure timings, proof before candidate commits, missing C1/C2 pins, inexact paths/multi-output units, no-change rerun semantics, late-source freshness, executable entrant/team eligibility, and the falsely completed judging-period watch.
- Fifth-candidate checklist SHA-256 is `fe39a1ac9a4a85f005822d96b351a724a1367e5380f4dde9b5f01ed34e233684`, 238 lines / 9,718 words / 83,367 bytes. Mechanical proof shows exactly 12 five-field gates; 601 consecutive owner-tagged items 1–11 units / 165.00 aggregate hours; nine A0 units / 2.75 active hours; 80 final-window units / 24.50 aggregate hours / at most 18 active hours / at least 6 contingency hours; 40 unique PRD stories; and exact race rows 15/21/18/11.
- The replacement has disjoint phase owners, exact locked source paths, a four-lane H0–H6.5 kernel and candidate-bound C0/Linux/client proof, constructive Wave-1/2/3 closure schedules, C1/C2-before-review/rerun/recheck ordering, full Individual/Team/Organization eligibility and authenticated membership proof, an excluded schema-bound `devpost-submission.md`, final just-in-time official field refresh, and honest passive/post-announcement monitoring.
- At `2026-08-27T19:09:27.939Z`, 144.84 hours remained versus the conservative 126-hour fully reserved post-G4 demand, leaving 18.84 gross slack before review work. Three fresh exact-hash full rereads, a final live inequality, and status-only metadata proof still block application implementation. No external mutation or application code occurred.

## 2026-08-28 — G4 fifth candidate rejected; sixth candidate frozen

- Product, engineering, and judge/rules independently reread unchanged fifth-candidate hash `fe39a1ac…33684`, verified it before and after, made no edit, and all returned FAIL with P0 zero. The consolidated G4R5 union covers pre-freeze contract consumers, the missing successful assisted-prepare server path, a false item-9 critical path, hidden A0 effort, missing receipt/export-versus-expiry winners, non-executable race artifacts, F1 proof-before-infrastructure, bundled outputs, stale media after R2, stale entrant proof, and stale review metadata.
- Sixth-candidate checklist SHA-256 is `cc79d50d668221830d7b0ea6ee180dc50e8d1d43e87db8f35540867b9284997e`, 240 lines / 10,175 words / 88,284 bytes. Mechanical proof shows exactly 12 five-field gates; consecutive item counts `74/53/56/48/59/51/39/38/83/53/56/80`; unit-level 30-minute counts `31/9/0/0/0/0/0/0/0/0/17/18`; 610 items 1–11 outputs / 166.75 aggregate hours; 12 A0 outputs / 3.50 active hours; 80 final-window outputs / 24.50 fixed aggregate hours; 40 unique PRD stories; and exact executable race modules `15/21/18/11`.
- `W0-CONTRACTS` now freezes five shared contract/schema outputs at H3.50 before any consumer. Frozen executable Family-1 common infrastructure/cases/runner and the production successful assisted-prepare path move into item 3; item 9 consumes F1 immutably and owns executable F2–F4 modules, closes by H57, and explicitly proves both receipt-load/export-versus-expiry winner orders.
- The final release plan now compares R1/R2 against captured media and either proves currency, rebuilds/reviews/rebinds replacement media while retaining six untouched hours, or returns no-go. An authenticated Individual/Team/Organization freshness digest is taken immediately before final readiness, bound through preview/submit, and restarted on any change.
- At `2026-08-27T19:48:08.320Z`, 144.20 hours remained versus honest complete-start demand `3.50 + 94 + 12 + 20 = 129.50`, leaving 14.70 hours gross slack. Three fresh exact-hash full rereads, a final live inequality, and status-only metadata proof still block application implementation. No external mutation or application code occurred.

## 2026-08-28 — G4 sixth candidate rejected; seventh candidate frozen

- All three lanes reread unchanged sixth-candidate SHA-256 `cc79d50d…84997e`, reproduced its metrics, and made no edit. Product and engineering each found one P1 plus one P2; judge/rules found the same P2. The deduplicated G4R6 union is a 15-minute Wave-0 overlap—readiness began before atomic Draft completion—and a controlling exit predicate that omitted G4R5.
- Seventh-candidate checklist SHA-256 is `55d371d00f073198f2e523b7ac3fc5254961798025c85a7939669347391fd7f0`, 240 lines / 10,191 words / 88,407 bytes. Mechanical counts remain exactly `74/53/56/48/59/51/39/38/83/53/56/80`, with 610 items 1–11 outputs / 166.75 hours, A0 12 / 3.50 hours, item 12 80 / 24.50 hours, 40 stories, and races 15/21/18/11.
- The count-neutral correction orders post-contract P outputs as fields H3.50–3.75, evidence policy through H4.00, Draft through H4.50, registry through H5.00, adapter/extraction through H6.00, and fixtures through H6.50. Readiness starts H4.75 after Draft; projectors and the H6 service retain their valid boundary. The exit predicate now requires every recorded union through current G4R6.
- At `2026-08-27T19:58:25.519Z`, 144.03 hours remained versus 129.50 hours complete-start demand, leaving 14.53 hours gross slack. Three fresh exact-hash rereads still block implementation. No external mutation or application code occurred.

## 2026-08-28 — G4 seventh candidate rejected; eighth producer-graph candidate frozen

- Product, engineering, and judge/rules reread unchanged seventh-candidate hash `55d371d0…1fd7f0` with byte-zero edits. The exact verdicts were product FAIL P0/P1/P2 `0/1/0`, engineering FAIL `0/2/0`, and judge/rules PASS `0/0/0`; the remediation audit on the same bytes expanded the union to three P1s: Start overlapped extraction, locked files lacked exhaustive one-producer assignments, and X28–X31 required a human actions API that did not exist before H12.
- Eighth checklist SHA-256 is `8be881fa3c100cb10ecdd56ce4b8de9f57484181e8c467a707e85b6a3deef125`, paired with design-time producer-ledger SHA-256 `54a05e127210c2151e68120e9f6becee00168972f0291e54e2d2e6c86f232e50`. The ledger has 106 unique literal path/creator entries, zero duplicate paths/creators, and covers all 87 expanded locked File Structure leaves plus necessary manifests, tests, and release obligations.
- Mechanical counts are now `75/53/56/48/59/51/39/38/83/53/56/80`, 30-minute vector `30/9/0/0/0/0/0/0/0/0/17/18`, items 1–11 `611 / 166.75h`, A0 `15 / 4.50h`, item 12 `80 / 24.50h`, 40 stories, and races `15/21/18/11`.
- All four W0 lanes remain exactly 6.50 hours. Draft finishes H4.25, extraction/application service H5.00, actions service and complete Start H5.50, WebMCP service H6.00, actions route H6.25, demo/WebMCP routes H6.50, and C0 H6.50–6.75. A programmatic check of literal W0 producer/consumer pairs found zero reversed edges. The legitimate minimum surface is now 2/4/5/4/6; Wave 1 reuses vacated units to reach the final 3/6/5/4/6 path set at H13.50 without changing H30.
- Provider/project/configuration receipts moved behind the combined A0 authorization. At `2026-08-27T20:43:11.339Z`, 143.28 hours remained versus corrected complete-start demand `4.50 + 94 + 12 + 20 = 130.50`, leaving 12.78 hours gross slack. Three fresh paired-artifact rereads still block implementation. No external mutation or application code occurred.

## 2026-08-28 — G4 eighth pair rejected; ninth exhaustive pair frozen

- Product and engineering rejected the eighth pair while judge/rules passed. The G4R8 union required a fully literal canonical producer ledger, test-source-before-command ordering, single-output parser hardening, legal Receipt modifier targets, a corrected 12-unit mini-gate, and current controlling metadata. No implementation or external mutation occurred.
- Ninth checklist SHA-256 is `2cd0f60e14539922dba22de132ca6b855a4406a96064a04cd6967669590914d0`, 322 lines / 13,669 words / 119,722 bytes. It has item counts `75/53/56/48/59/51/39/40/83/53/56/80`, 613 items 1–11 units / 167.25 aggregate hours, 16 A0 units / 5.00 active hours, 80 final-window units / 24.50 aggregate hours, and 709 total checklist units.
- Paired ledger SHA-256 is `e0c4d589096f2a7a81138711c5159e927353a9161c01b237a190b667a4bd5f77`, 11,766 lines / 21,264 words / 284,094 bytes. Independent strict parsing and duplicate-key/path/unit/owner/minute/gate/schedule/dependency/spec/race checks pass: 232 tracked + 8 excluded-private literal rows, 240 creators + 175 modifiers = 415 unique file units, all 87 locked leaves, 65 race cases, and seven race infrastructure/runner rows.
- Prefreeze audits made the authorization/release path executable: identity/history/Submission-Period/reuse/name-risk proof in A0; a complete private submission packet with non-self-referential canonical digests; typed release-slot-only finalization; explicit needs-submit/already-submitted/manual-fallback branches; live submitted-payload equality; truthfully pre-submit public records; final impact-evidence refresh; exact-final-tree/history secret/PII scan; and ignored-sidecar-preserving private operations state.
- At `2026-08-27T22:10:29.259Z`, 141.83 hours remained to feature freeze versus complete-start demand `5.00 + 94 + 12 + 20 = 131.00`, leaving 10.83 hours gross slack. The inequality passes but must be sampled again immediately before lock. Three byte-exact product, engineering, and judge/rules full rereads plus a three-lane status-only hash proof still block application implementation.

## 2026-08-28 — G4 ninth pair rejected; tenth exact pair frozen

- Product and judge/rules passed the ninth pair, but engineering correctly rejected it with three P1 and one P2: source-changing R2 lacked candidate-bound execution proof, parser anchors were routed through a metadata-only registry, the submission outcome did not join both branches, and two evidence rows pointed backward. No earlier pass is reused.
- Tenth checklist SHA-256 is `9a47b0064457f7933c42adf11e80f86a98b74c56b49f027cc8aec39f718a4c0e`, 325 lines / 14,208 words / 124,927 bytes. It contains 726 total units: A0 `16 / 5.00h`, Items 1–11 `613 / 167.25h`, and Item 12 `97 / 30.75h` with at most 21.75 critical hours inside a 27.75-hour release envelope.
- Paired ledger SHA-256 is `79fc29ea40b10f899db23de223c4c20b89e760a9505844302392a50529adc884`, 12,811 lines / 22,450 words / 303,785 bytes. Root and independent engineering/child audits prove 232 tracked + 8 excluded-private rows, 240 creators + 181 modifiers = 421 file units, 421/421 owner-duration matches, zero cycles/backward same-lane edges, four-slot peak, all 87 locked leaves, and 65 + 7 race artifacts.
- Units 12.81–12.97 require a source-changing R2 to rerun clean checkout/install/migrations/build/regression/integration/races/E2E/accessibility/security/privacy/surface proof and refinalize release documents. Only an exact R1 commit-and-tree pin may emit signed no-rerun dispositions; partial path-based skipping is forbidden. Parser ownership, submission joins, and backward release obligations are corrected count-neutrally.
- The voluntary release-only cutoff is `2026-09-02T16:15:00Z`, 3.75 hours before the mandatory feature freeze, so the 27.75-hour envelope still protects the locked final 24 hours and six contingency hours. At `2026-08-27T22:55:50.325Z`, 137.319 hours remained to that cutoff versus 131.00 required, leaving 6.319 hours gross slack. Three fresh exact-pair full rereads, an immediate pre-lock resample, and three status-only proofs still block application implementation.

## 2026-08-28 — G4 tenth pair rejected; eleventh composition remediation started

- All three reviewers verified the tenth checklist/ledger hashes before and after complete no-edit rereads. Product and engineering each returned FAIL with P0/P1/P2 `0/1/0`; judge/rules returned PASS `0/0/0`. The pair is rejected and the judge pass is not reusable.
- The deduplicated G4R10 P1 is a missing production composition path: Draft-field, evidence-dialog, Review, confirmation, Conflict, and reconciliation files existed in the ledger, but no declared Application page/controller modifier consumed them before the browser proofs. Implementing the planned experience would therefore have required undeclared source edits.
- The reviewed remediation design adds explicit 30-minute Wave-1 and Wave-2 Application-controller composition modifiers, makes existing 6.9 compose the Conflict UI count-neutrally, joins those outputs before route-level tests and shared merges, and preserves H30/H48/H94, four-slot occupancy, Item-12 arithmetic, and the 131-hour wall requirement. No application code or external mutation occurred.
- Eleventh checklist SHA-256 is `2fcd09b877b3f35c3f451758a8cd345d1232821a627c32b20a0fb837aade39da`, 325 lines / 14,693 words / 128,853 bytes; paired ledger SHA-256 is `fe7dfb9a4f88621a139d9624e82d7904f3ce964693fd2dae0c862ed4e5421ace`, 12,872 lines / 22,549 words / 305,290 bytes. Mechanical proof shows 728 checklist units, 615 Items 1–11 / 168.25 hours, 232 tracked + 8 private rows, and 240 creators + 183 modifiers = 423 exact file units with zero cycles or lane collisions.
- Units 5.60, 6.9, and 8.41 now bind all late Supported, Conflict, and reconciliation producers into the production Application controller before route-level integration/E2E tests and Wave-1/2 merges. At `2026-08-27T23:20:43.408Z`, 136.905 hours remained to the internal release start versus 131.00 required, leaving 5.905 hours slack. Three fresh exact-pair rereads and status-only proof still block implementation.

## 2026-08-28 — G4 passed and locked; A0 opened

- Product, engineering, and judge/rules each fully reread unchanged eleventh checklist content `2fcd09b877b3f35c3f451758a8cd345d1232821a627c32b20a0fb837aade39da` plus ledger `fe7dfb9a4f88621a139d9624e82d7904f3ce964693fd2dae0c862ed4e5421ace`, made no edit, and returned unconditional PASS with P0/P1/P2 `0/0/0`.
- The immediate pre-lock sample at `2026-08-27T23:32:16.339Z` found 136.712 hours to the internal release-only start versus 131.00 required, leaving 5.712 hours gross slack.
- The status-only lock is checklist SHA-256 `dddde1c29828301ccf05e708abaf8bd800f2804e8abd0fdf3dbabe0b0131b2ee`, 325 lines / 14,686 words / 128,769 bytes. Product, engineering, and judge/rules independently verified that locked hash, restored only the prior candidate status line in memory, reproduced `2fcd09b8…39da`, confirmed the ledger stayed unchanged, and made no edit.
- G4 passed. A0 is now the active gate. No application code may start until the explicit authorization/eligibility/provider/identity package and its 16 receipts produce A0.16 `ready`; final Devpost submission still requires a separate immediate exact **“yes, submit”** later.

## 2026-08-28 — A0 read-only readiness audit

- The live Devpost connector confirms Amit is authenticated and already registered for `webmcp`, submissions are open, no CiteApply project exists, and the two existing `Untitled` projects belong to unrelated RevenueCat hackathons and must remain untouched. Required submission choices are exact: Submitter Type `Individual | Team of Individuals | Organization`, App Status `New | Existing`, Learning `None | Moderate | Significant`, and Career AI value `Yes | No`.
- Local readback found no repository-local Git identity and proved all four existing unpushed commits use a machine-generated local-only address; the raw address is intentionally omitted from tracked notes. A0P.13 therefore needs an exact user-confirmed public identity, preservation of the private development ref, an authorized identity-normalized history or release branch, an old→new/tree-equality map, and final affected-proof reruns.

## 2026-08-28 — User selected local-first build; public release deferred

- Amit clarified: **“u dont have to submit, will test locally then we will talke about submission.”** This authorizes local implementation/testing, not deployment, provider provisioning, public repository work, Devpost mutation, uploads, outreach, monitoring, or submission. The in-product fictional confirmation/Receipt journey remains required locally.
- Three independent read-only design audits found that changing only A0/G4 would contradict the locked G1/G3 first-12-hour hosted/client gate. The narrow correction therefore aligns G1 timing, G2 upstream metadata, G3 local-versus-hosted proof, G4 execution/dependencies, and the producer ledger without changing any product behavior, surface cap, safety requirement, test lane, or final release obligation.
- The proposed two-part authorization keeps the original 16 units / 5.00 active hours: A0L.1–A0L.2 permit only local work; A0P.1–A0P.14 retain every public/provider/identity/eligibility/Devpost obligation before item 11. The ledger remains 232 tracked + 8 private rows and 240 creators + 183 modifiers = 423 file units.
- G5B-L requires the exact ChatGPT desktop built-in browser to discover and invoke all six real tools on the actual local route, including three raw under-120-second Conflict chronologies and a visible local-PostgreSQL mutation. Chrome and harness evidence remain supplemental. G5B-H repeats selected-host parser/client proof only after A0P as a blocking subgate inside item 11 before hosted/release claims and G9 closure.
- Official OpenAI documentation says the built-in browser is intended for local development and that site tools operate only in that browser on the current supporting page. It does not explicitly guarantee localhost site-tool discovery, so the plan treats support as an inference until the installed client passes empirically. Chrome documentation independently provides a local WebMCP testing flag.
- Environment preflight found Node 26.7.0, npm 11.19.0, a Docker CLI without a running-server readback, PostgreSQL client 17.9, and Chrome 151.0.7922.175. The contract still requires Node 24.20.0 and PostgreSQL 18.6; use pinned local/runtime images and prove actual versions. No dependency, image, trust-store, application, provider, or public mutation occurred.
- At `2026-08-28T02:09:16Z`, 134.095 hours remained to the internal release-only start versus the historical 131-hour full public-path demand, leaving only 3.095 hours before amendment overhead. This is not a renewed public-path pass. Local work remains viable; public promotion must rebase when A0P opens, and missing the existing decision deadline makes only the public release no-go.
- Two independent A0 audits reduced the user-controlled package to four decisions: entrant/eligibility facts; three subjective Devpost answers; name/license/Git identity and residual-risk acceptance; and a scoped external-action authorization with an exact spend ceiling. Codex can verify all remaining live facts and receipts. No A0 artifact, provider project, Devpost project, repository, deployment, invite, upload, history mutation, or application code was created.
- Root invalidated the first dispatched amendment hashes before any verdict after finding stale G4/L0/A0 labels. Engineering and judge independently found the same stale Wave-0 remote-migration/deployment/hosted-timing witness. All lanes withheld verdict; the corrected exact candidate is scope `c3c73bae…0a5b`, PRD `54bb323a…2fed`, spec `70acddf9…4bd`, checklist `692585cf…6bdc`, and ledger `df4a27b4…a982`. It now names A0L/A0P consistently and uses only loopback PostgreSQL 18.6, exact Node 24 local-production, local-equality, and local-production-output timing before A0P.
- Fresh byte-zero review rejected that corrected candidate with a seven-finding union: premature H30/H48 authorization timing; G5B-H order ambiguity; active G4/G4L label drift; an authority-ambiguous pre-A0P “non-local clone”; stale supplemental Chrome `.174`; contradictory local HTTP/HTTPS wording; and no mechanical G5B-H-to-11.32 narrative edge. The replacement honors H30/H48 as reporting only, keeps A0P after the H72 user test/discussion, defines G5B-H inside item 11, uses an isolated local Linux clone from private local Git with no remote action, captures the installed Chrome build at proof time, mirrors the conditional localhost rule, and makes 11.32 depend on 11.31→11.30→11.28→11.20–11.27. Counts and product behavior are unchanged.
- Product passed the next exact replacement, but engineering and judge rejected one remaining capacity/control family: scope, checklist, and AGENTS still applied the old all-public inequality and public-failure scope reopening at local G4L. The final remediation names a 92.50-hour complete-start local inequality against `2026-09-02T16:15:00Z`, keeps every A0P/H72–H94/external-latency/item-12 obligation explicitly unfinished, runs the full public inequality only when A0P opens, and makes public failure `public_release_no_go` without blocking items 1–10. The product pass is not reused; all three lanes must reread the replacement from byte zero.
- Product, engineering/security, and judge/rules each performed a fresh full reread of the final candidate scope `26b8b0fb…aa1a`, PRD `be037cbb…dd37`, spec `dea4098f…6752`, checklist `18f886b8…30e3`, and ledger `24c9499f…d335`; every lane returned unconditional `0/0/0`. The immediate local sample at `2026-08-28T03:20:45Z` passed with 132.904118 hours remaining versus 92.50 hours demand and 40.404118 hours gross slack.
- The four status-only edits produced locked scope `4e697808…f53c`, PRD `b6fd5e3c…c55d`, spec `236056ce…7231`, and checklist `d7bef6a3…ff08`; the ledger stayed `24c9499f…d335`. All three lanes independently restored only the four prior status lines in memory and reproduced every passed candidate hash. G4L passed; A0L is active and application code remains prohibited until A0L.2 is `local_ready`.

## 2026-08-28 — A0L local-only entry passed

A0L.1 added exact anchored Git-internal excludes for `/devpost-submission.md` and `/.citeapply-private/`. `git check-ignore` resolved both paths, and `git ls-files` proved neither private path is indexed. A0L.2 created the ignored private authorization ledger with the user's exact local-first instruction, the explicit external-action deny-list, official-client inference boundaries, locked G1–G4L hashes, private Git/environment evidence, and the sole decision `local_ready`.

The first exact engineering review rejected ledger SHA-256 `4ab754696acf5fac0bb92a8509338b0e0c13430d671ff35f15e4aed1a7dca98a` with one P2 auditability finding: the capacity values included 517 milliseconds that the displayed timestamp omitted. Root changed only `.capacity.sampledAtUtc` from `2026-08-28T03:26:00Z` to `2026-08-28T03:26:00.517Z`. The corrected arithmetic is exactly 132.816523 hours remaining minus 92.50 hours local demand = 40.316523 hours gross slack.

Product/UX/authority, engineering/security/testability, and WebMCP/judge/rules each fully reread remediated ledger SHA-256 `daae8e17b2ed9ac551f2c573a5a0b610d0b4015f93bf908f6e1433538a71ee1c`, reproduced the hash before/after, proved the timestamp was the sole change by restoring the rejected hash in memory, made no edit, and returned unconditional P0/P1/P2 `0/0/0`. JSON semantics, one `local_ready` decision, locked hashes, Git privacy, identity non-disclosure, environment claims, deferred Node/PostgreSQL proof, synthetic-only data, loopback-only execution, empirical genuine-client proof, and the no-public/no-Devpost boundary all passed.

**A0L PASS at `2026-08-28T03:38:59Z`.** Item 1 / Wave 0 local implementation may begin in the exact producer/dependency order. A0P, public release, deployment, remote providers, uploads, and Devpost remain unauthorized.
