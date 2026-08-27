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
