# Stage 0 Review — Workspace, Market, And Scope Audit

Date: 2026-08-27  
Gate: G0  
Status: Passed

## Reviewers

| Perspective | Reviewer | Verdict |
|---|---|---|
| Product and market | Independent subagent | Conditional go |
| Devpost judge | Independent subagent | Conditional go |
| Repository, privacy, and engineering | Independent subagent | Conditional go |

## Evidence Reviewed

- Official hackathon dates, criteria, submission requirements, and participant guidance retrieved from Devpost on 2026-08-27.
- Existing product-selection notes and learner profile.
- Empty-code workspace and saved guided-build state.
- Direct competitor and naming checks supplied by the product reviewer.
- WebMCP producer-side constraints and the requirement for an intentionally instrumented site.

## Consensus Decision

Proceed with one deeply implemented education-aid application on a site we own. Do not build a generic or arbitrary-site autofill assistant.

The winning thesis is:

> A participating form exposes a site-enforced evidence contract through WebMCP. An external browser agent may draft source-linked answers, but deterministic policy blocks unsupported, stale, or contradictory claims; the applicant sees the live changes and controls final submission.

This is materially stronger than “AI autofill with citations” because the application itself enforces the rules independently of whichever compatible agent is acting.

## Findings And Dispositions

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| S0-01 | P0 | ProofFill is already used by an active evidence-backed AI questionnaire product with overlapping positioning. | ProofFill is retired. An eight-candidate obvious-collision screen selected **CiteApply** as the lowest-risk working codename; final public use still requires user ratification and a proper trademark/domain/handle review. |
| S0-02 | P0 | Generic document-to-form autofill is crowded and would make WebMCP look decorative. | Narrow to an education-aid portal whose evidence policy, branching state, structured conflicts, and readiness checks are exposed through WebMCP. |
| S0-03 | P0 | “High-stakes forms” is not a first customer. | Primary user is a student or guardian applying for education aid; economic buyer is a university or nonprofit aid-operations team. |
| S0-04 | P0 | “Verified” would overclaim authenticity. | Use source-linked, user-declared, missing, conflicting, stale, or low-confidence. V1 never claims document authenticity. |
| S0-05 | P0 | Three form categories cannot reach winning execution quality within the remaining calendar. | Build one scholarship/fee-assistance workflow, two conditional branches, a happy packet, and a contradictory packet. A second portal is stretch-only after all gates pass. |
| S0-06 | P0 | No repository safety net exists. | Initialize Git and add a lockfile, CI, license, environment template, and quality commands before application implementation begins. |
| S0-07 | P0 | Provenance cannot be an LLM-generated citation. | Bind claims deterministically to immutable document ID, content hash, page, text/region span, extraction version, and normalized value. |
| S0-08 | P0 | WebMCP arguments and browser state are untrusted. | Server/domain policy revalidates all mutations. Tool calls are never an authorization boundary. Final submission is human-controlled. |
| S0-09 | P1 | The problem is credible but not yet customer-validated. | Make only prototype/test claims. Before submission, run documented representative-user observations if available; never relabel automated tests as user validation. |
| S0-10 | P1 | Exact human hours were not supplied. | Use the hard remaining window as the scope ruler: seven calendar days, six build/verification days plus one submission buffer. Reduce breadth—not quality—if throughput is lower than assumed. |
| S0-11 | P1 | Real documents would create unnecessary privacy and compliance risk. | Public demo, repository, screenshots, logs, and automated tests use conspicuously synthetic identities and documents only. |
| S0-12 | P1 | A polished happy path alone would not prove the product thesis. | The primary demo includes a deliberate contradiction that the agent cannot silently resolve, followed by human resolution, final diff, and provenance receipt. |

## Claims Boundary

The project may claim that the prototype:

- works on its owned, instrumented education-aid application;
- exposes real WebMCP tools in a supported client;
- links draft values to synthetic source spans or explicit user declarations;
- blocks the tested unsupported, conflict, and stale-state cases;
- requires a visible human action for final submission; and
- produces a provenance receipt for the tested flow.

It may not claim arbitrary-site compatibility, document authenticity, eligibility decisions, legal/compliance guarantees, institutional adoption, production readiness, or measured business improvement without new evidence.

## Winning Conditions

- WebMCP is the visible collaboration surface and cannot be replaced by a single opaque “autofill” button without losing the experience.
- The agent reads live requirements, proposes evidence-bound values, receives structured policy errors, and updates the same form the human sees.
- The conflict moment proves refusal to guess.
- The experience is complete: seeded/uploaded synthetic evidence through review, human submission, and receipt.
- Automated tests and browser evidence cover happy, conflict, missing, stale, cancellation, refresh/resume, manual-edit, keyboard, and receipt paths.
- The demo opens on the working product and shows value in its first 15 seconds.

## Gate Decision

G0 passed after the focused scope was independently reviewed, all material findings were remediated, the saved state and project documents were reconciled, and Git was initialized with a project `.gitignore`. No application code was started during G0.
