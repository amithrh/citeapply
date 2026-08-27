# CiteApply Implementation Status

Last updated: 2026-08-27

## Goal

Build and verify a winning-quality CiteApply WebMCP product with stage-gated implementation, independent multi-agent review, complete-flow testing, remediation before progression, and durable documentation.

## Current Position

- Active stage: G3 — regenerate the bounded technical specification from the locked scope and PRD
- Gate status: replacement G2 passed after unanimous exact-hash review; final locked PRD SHA-256 `f9fb37f38aa9a1b3b62ebdc46d5673dd8609669f1392df8f87a49e20a2ade40f`
- Active artifact: approved `scope.md` and `prd.md` are inputs; the historical oversized `spec.md` must be replaced, not patched into compliance
- Application code: Not started by design
- Repository: Git on `main`; historical planning baselines `ecc9f9d` and `c5c898a`; the current documentation set locks replacement G1/G2 and preserves the failed G3 design as history
- Deployment: Not started; not yet authorized
- Devpost submission: Not started; not authorized

## Schedule

- Official submission deadline: `2026-09-03T20:00:00Z`
- India deadline: `2026-09-04 01:30 IST`
- Feature freeze: `2026-09-02T20:00:00Z`; final 24 hours are release-only
- G1 rebase at `2026-08-27T12:06:50Z`: 151.89 hours to freeze versus 134 hours P90 pre-freeze demand, leaving 17.89 hours scheduling slack

## Quality Gates

| Gate | Deliverable | Status | Evidence |
|---|---|---|---|
| G0 | Workspace, decision, rules, and operating-contract audit | Passed | `AGENTS.md`, `learner-profile.md`, `build-notes.md`, `reviews/00-scope-audit.md` |
| G1 | Focused product scope | Passed | `scope.md`, `reviews/01b-rescope.md`; three content-hash passes, three final metadata-hash passes, and capacity rebase recorded |
| G2 | Product requirements and acceptance criteria | Passed | `prd.md`, `reviews/02b-prd.md`; five exact-content review cycles, unanimous final content pass, and three final metadata-hash proofs |
| G3 | Architecture, WebMCP contract, privacy and threat model | In progress | Historical `spec.md`, `reviews/03-spec.md`; regenerate cleanly below 15,000 words from locked G1/G2 |
| G4 | Sequenced build and verification contract | Pending | `checklist.md`, checklist reviews |
| G5 | Foundation and primary form experience | Pending | Tests, browser evidence, implementation review |
| G6 | Evidence, provenance, conflict and branching core | Pending | Unit/integration/E2E evidence and reviews |
| G7 | WebMCP collaboration, approval and receipt flow | Pending | Contract/E2E/security evidence and reviews |
| G8 | UX, accessibility, observability and demo polish | Pending | Accessibility and judge-flow evidence |
| G9 | Full regression, security, product and submission-readiness review | Pending | Final verification report and remediation log |

## Current Blockers And Risks

- The working name CiteApply still requires Amit's ratification and formal clearance before public launch.
- The initial Git commit used the machine's auto-generated local committer email; set the intended repository-local identity and amend before any public push.
- The project has no license, dependency lockfile, CI, or application foundation yet.
- CiteApply's document and form data model is privacy-sensitive even with synthetic demo fixtures; threat modeling must precede ingestion code.
- WebMCP is experimental and must have a normal human UI path while remaining central to the collaboration flow.
- The current shell is Node 26.7.0 while the locked application runtime is Node 24.20.0; the foundation gate must install/select the pinned runtime explicitly.
- Native WebMCP/client compatibility remains the first implementation proof; a harness cannot substitute for a genuine external-client trace.
- The locked replacement preserves six semantic tools, runtime parsing of all six fixed PDFs, the source/conflict/human-control loop, and a complete manual path. Its feasibility witness uses three pages, six API families, five product tables, and four PostgreSQL race families within the hard caps.
- The locked G2 PRD contains 40 stable acceptance stories and closes conflict-choice privacy through readiness-only agent projections, opaque non-content Review metadata, six-way indistinguishability tests, exact native-abort outcomes, and public throttle preflight ordering. G3 must map these requirements without adding product behavior.
- The replacement capacity model separates 170 aggregate agent-hours P90 from 102 critical-path wall hours, 12 hours of external/user latency, and a 20-hour remediation reserve: 134 pre-freeze wall hours P90, followed by the protected 24-hour release window. It must be rebased at G1 and G4.
- Public name/license/repository/provisioning/deployment/video/Devpost authorization must be requested after G4 and explicitly approved by `2026-08-30T20:00:00Z`; no external mutation is implied.
- No application code is permitted until replacement G3 and G4 each pass independently.

## Next Action

Regenerate a clean replacement technical specification from locked scope SHA-256 `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f` and PRD SHA-256 `f9fb37f38aa9a1b3b62ebdc46d5673dd8609669f1392df8f87a49e20a2ade40f`. Keep it below 15,000 words and inside the three-page/six-API/five-table/four-race witness; map every story to architecture, schemas, security, privacy, and verification without inventing product decisions. Obtain three-lane exact-hash review before G4. The old oversized specification remains historical evidence only.
