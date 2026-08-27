# G1 Review — Focused Product Scope

Date: 2026-08-27  
Artifact: `docs/hackathon-build/scope.md`  
Status: Passed

## Review Panel

| Perspective | Initial verdict | Recheck |
|---|---|---|
| Product, market, and UX | Conditional pass | Pass |
| Devpost judge | Conditional | Pass |
| Technical feasibility, privacy, and testability | Conditional | Pass |

## Findings And Dispositions

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| G1-01 | P0 | ProofFill collides with an active overlapping product; TraceApply is confusingly close to ApplyTrace. | Resolved. CiteApply is the internal codename after an eight-candidate obvious-collision screen. Public use still requires Amit's ratification and formal clearance. |
| G1-02 | P0 | Unrestricted declarations let an agent bypass required evidence. | Resolved. Agent tools accept an allowed claim binding or an unresolved proposal only. Human declarations can be created only through the visible UI where versioned field policy permits them; forgery/reuse tests are mandatory. |
| G1-03 | P0 | “The agent cannot submit” overclaims control over privileged browser automation. | Resolved. No WebMCP tool or agent-facing API can submit; normal UI requires version-bound confirmation. The project explicitly makes no proof-of-personhood or privileged-automation guarantee. |
| G1-04 | P0 | Original seven-day scope was too broad. | Resolved. Committed slice is one portal, 8–10 fields, one branch, two synthetic packets with deterministic text-PDF extraction, one conflict, one client trace, and the complete review/submission/receipt flow. Upload, OCR/model extraction, second branch/client/portal, and generated receipt PDF are stretch or excluded. |
| G1-05 | P0 | External-client WebMCP proof was scheduled too late. | Resolved in scope. The first implementation spike must prove registration, discovery, invocation, result, cancellation, and visible version-checked mutation in the primary external client; failure blocks broader product implementation. |
| G1-06 | P1 | Evidence disclosure lacked explicit consent and revocation. | Resolved. Sensitive evidence tools register only after explicit session consent, return bounded least-disclosure claims/opaque handles, unregister on revocation, and are covered by wrong-session/post-revocation tests. |
| G1-07 | P1 | Document text and tool inputs were not explicitly treated as hostile. | Resolved. Extracted text is untrusted data, never instructions; hostile text, oversized/schema-injection values, forged handles, cross-application reads, and log leakage are required negative tests. |
| G1-08 | P1 | Extraction could be hardcoded or become an uncontrolled OCR project. | Resolved. Both committed packets use real, deterministic extraction from versioned text PDFs and reviewed golden anchors. No precomputed answer route exists. Arbitrary upload, image OCR, and model extraction are outside the committed slice. |
| G1-09 | P1 | Review, approval, idempotency, and receipt persistence were underspecified. | Resolved at scope level. The required state machine, invalidation triggers, exact-diff approval binding, replay/stale rejection, authoritative persistence, and receipt relationship are explicit; datastore/TTL topology remains a G3 decision. |
| G1-10 | P1 | User, buyer, willingness-to-pay path, and community value were too broad. | Resolved. Primary user is a first-time need-based scholarship applicant; buyer is the program's foundation/university aid team; B2B unit and validation metrics are hypotheses; the open schema, fixtures, tests, and reference portal are v1 community outputs. |
| G1-11 | P1 | WebMCP could still look like a decorative autofill trigger or scripted demo. | Resolved. Scope requires multiple live reads/mutations/errors, identical production handlers for both packets, divergent state-derived behavior, a reconciled external-client trace, no demo-only route, and a visible conflict/refusal moment. |
| G1-12 | P1 | Competitive, safety, compatibility, and impact wording overclaimed evidence. | Resolved. Claims are limited to tested clients/versions and prototype behavior; no authenticity, eligibility, adoption, ROI, arbitrary-site, safety, or production claim is allowed. |
| G1-13 | P1 | Repository and clean-environment verification were absent. | Resolved. Git is initialized before code; public repository/license/setup and deployed client instructions must be checked from clean/incognito environments before submission. |
| G1-14 | P2 | Demo opening risked network/model dead time or fake animation. | Resolved. Begin with the genuine invocation visible, edit only waiting, preserve the complete real call/result/UI relationship, and prohibit simulated invocation. |

## Scope Lock

The mandatory submission build is intentionally limited to the committed deadline slice in `scope.md`. Stretch items do not enter the checklist unless all mandatory functionality, deployment proof, accessibility, security/privacy, and complete E2E regression gates have passed with contingency intact.

## Final Gate Decision

**Passed.** All three independent reviewers confirmed that their material findings were resolved. The single-workflow boundary is locked, the working name and saved state agree, and no application code has begun. G2 may start.
