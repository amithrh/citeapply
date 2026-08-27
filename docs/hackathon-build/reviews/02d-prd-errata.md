# G2E-02/03 Review — Focus And Bounded-Demo Refusals

Date: 2026-08-27
Gate: Narrow replacement-G2 errata discovered during G3R engineering review
Artifact: `docs/hackathon-build/prd.md`
Status: Passed and locked
Upstream scope: SHA-256 `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`

## Authorized Erratum Boundary

The G3R exact-hash review exposed three internal contradictions in otherwise locked G2 behavior. This reopen changes only:

1. an externally triggered blocked Review preparation updates and announces the shared error summary without stealing applicant focus; applicant-activated **Review application** retains the existing focus-to-summary behavior;
2. the bounded synthetic-session operation ledger may return one nonnumeric `demo_change_limit` refusal only when another non-closing request would consume the remaining manual closing path; it saves nothing, reserves no request identity, exposes no counter, and offers only the visible remaining application or a new synthetic demo; and
3. `review_invalidated` no longer implies that a hidden direct edit is possible inside immutable Review; visible Return is the invalidating behavior.

No story, page, API family, database table, race family, tool, field, evidence rule, human-only boundary, stage, parser behavior, genuine-client proof, impact claim, or release obligation changes. The previously reviewed G2E-01 stage-agnostic pre-consent recovery remains unchanged.

## Review Protocol

Product/accessibility, engineering/security/testability, and WebMCP/judge/rules lanes must independently:

- verify and reread the same complete PRD SHA-256, not only the edited lines;
- confirm the three changes stay inside the boundary above and preserve all 40 stories;
- reject any focus theft, hidden Review edit, numerical workflow counter, retry promise, lost manual closing path, new persistent state, or privacy regression; and
- return P0/P1/P2 findings without editing files.

After unanimous content pass, a status-only lock edit requires all three lanes to reproduce the passed content hash by restoring only the candidate status line in memory.

## Review Record

All three lanes independently reread and passed the exact 1,038-line candidate:

- PRD SHA-256: `62c95401af8539204fca1f19d63dc0200a4decffe3ca8a10e4df2bb478346dd4`
- Product/accessibility: **PASS**, no P0/P1/P2 findings
- Engineering/security/testability: **PASS**, no P0/P1/P2 findings
- WebMCP/judge/rules: **PASS**, no P0/P1/P2 findings
- Mechanical proof: all 40 unique story identifiers remained present and `git diff --check` passed
- Boundary proof: reversing only the candidate status line and three authorized errata reproduced the previously approved PRD SHA-256 `4b460ec0fe70dd92afbae3e13764cfda5e9b5851f458809a6609102b74dfb38f`

The reviewers confirmed that the errata prevent externally triggered focus theft, close the immutable-Review wording, and define a nonnumeric noncommitting demo-limit refusal without exposing a counter, promising a retry, reserving a request identity, or losing the remaining manual closing path. G3 retains responsibility for exact reserve arithmetic and per-route/tool failure subsets.

The status-only lock produced final PRD SHA-256 `1fc13ede1edec072f1776d35b88a4c688bfc5a6e33ddda9d554226b9fe37f0f9`. Product, engineering, and judge lanes each independently restored only the candidate status line in memory and reproduced `62c95401af8539204fca1f19d63dc0200a4decffe3ca8a10e4df2bb478346dd4`; no lane edited a file. G2E-02/03 is therefore locked.
