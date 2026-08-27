# G2R Review — Bounded Replacement Product Requirements

Date: 2026-08-27
Gate: Replacement G2 — user behavior and acceptance criteria
Artifact: `docs/hackathon-build/prd.md`
Status: Passed
Upstream: locked replacement G1 scope SHA-256 `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`

## Why G2 Was Replaced

The prior PRD belonged to the failed 75,417-word technical design and could not be patched safely into the bounded replacement. The new PRD was written cleanly from the locked eight-field, two-packet, six-tool G1 contract. It defines user-observable behavior and acceptance criteria; implementation remains prohibited until replacement G2, G3, and G4 pass.

## Deepening And First Candidate

One nonredundant deepening round used the full prior product-selection conversation plus three parallel lanes:

| Lane | Contribution before formal review |
|---|---|
| Product/UX/accessibility | Three-page information architecture, visible field/consent/conflict/Review copy, manual parity, focus and accessibility behavior |
| Engineering/security/testability | Closed state/error behavior, authority/replay/race outcomes, privacy constraints, anti-regrowth checks |
| Devpost judge/product strategy | Same-session sub-three-minute proof, epics, impact/release evidence, claim discipline |

The first complete candidate was 952 lines / 12,154 words / 85,381 bytes with SHA-256:

`ee1216a010a1d4ed82128f1a0a15e9e246c92bc9a02ba9c29bbd9bd1c796aed0`

All three independent reviewers verified that exact hash and the locked scope hash. All returned **FAIL**, with no P0 concept failure and multiple remediable P1 findings. The gate did not advance.

## First-Pass Material Findings And Dispositions

| ID | Severity | Finding | Candidate disposition |
|---|---|---|---|
| G2R-01 | P1 | New 60-call, 100-change, 10-Review, latest-20 activity, and `limit_reached` machinery regrew scope and created replay/capacity ambiguity. | Removed the numerical workflow subsystem, outcome, tests, and status references. Retained locked public admission, fixed session, bounded inputs/results/activity, and technical rate/payload thresholds without a new application state. |
| G2R-02 | P1 | Conflict resolution lacked exact reason choices, a resolved status, and deterministic local edit/clear behavior. | Locked three ordered reason codes/labels, unresolved/partial/resolved statuses, Save/Discard/Clear effects, Review blocking, and Draft/Review/Receipt evidence. |
| G2R-03 | P1 | Consent was protocol-complete but not applicant-comprehensible; safe pre-consent state/static-requirements modes were missing. | Added literal plain-language included values/actions/exclusions/revocation copy, secondary technical details, exact redacted-state/static-`all` outputs, and protected-mode refusal. |
| G2R-04 | P1 | Review-preparation/current-state wording permitted a human conflict reason/category to reach the agent. | Assisted results now exclude selected conflict source, reason/category, and history; only bounded readiness may be exposed. Negative contract evidence is required. |
| G2R-05 | P1 | Successful Review behavior, complete diff/source content, and failed-Review focus were ambiguous or contradictory. | Manual/assisted preparation always enters Review, focuses/announces the heading, closes assistance, shows every field's complete diff/source/excerpt access and conflict history; blocked attempts focus the grouped summary first. |
| G2R-06 | P1 | Human confirmation/uncertainty copy, initial Receipt loading, accepted-but-unavailable Receipt, print-local-copy behavior, and sustained connection loss were incomplete. | Locked exact confirmation and neutral uncertainty copy; added bounded three-attempt/ten-second reconciliation, Connection unavailable, Checking receipt, authoritative Receipt unavailable, safe recovery controls, and product-detectable export boundaries. |
| G2R-07 | P1 | Cross-journey “identical receipt” claims contradicted truthful assisted attribution/activity. | Defined the canonical application-content hash projection. Identical content hashes equally; path activity is excluded. Journeys share submitted application content and Receipt projection rules while activity sections differ truthfully. |
| G2R-08 | P1 | Expiry absolutes contradicted final-authorization-first delivery and omitted read/apply/prepare orderings. | Defined expiry-first versus final-authorization-first for protected reads, apply, prepare, submit, receipt, and export; added all authority-loss orderings and committed-Review/response-loss behavior. |
| G2R-09 | P1 | Parser verification could pass while production ignored parser output. | Restored a test-only accepted mutated PDF whose value/anchor must change, changed-production-byte failure, and a static production import/bundle assertion against goldens, precomputed claims, manifests, and answer maps. |
| G2R-10 | P1 | VoiceOver/manual release evidence expanded beyond locked G1. | Kept comprehensive automated/keyboard/reflow/zoom/motion/contrast coverage; narrowed named screen-reader evidence to one complete canonical Conflict pass plus one manual-fallback smoke and one complete manual Conflict release journey. |
| G2R-11 | P1 | Official release obligations and authorization no-go were incomplete. | Added normative public HTTPS, public repository/license, public narrated YouTube, exact client/model/settings/version/date, reproducible paths, exact deadline, and explicit authorization deadline/no-go requirements. |
| G2R-12 | P1 | Required genuine-client proof covered Conflict but not Supported. | Added one complete Supported exact-primary-client run through corroboration, declaration, Review, visible submission, and matching Receipt; a harness cannot satisfy it. |
| G2R-13 | P1 | The 2:59 video plan had unsafe export/platform margin. | Internal encoded target is at most 2:50, with a compressed 2:48 content plan and strict below-180-second release check. |
| G2R-14 | P1 | Assisted attribution ended on the untestable condition that the applicant “sees” it. | Attribution persists for the saved value through Draft/Review until that value is manually replaced or cleared. |

## P2 Remediation Included

- Added all six exact locked tool names.
- Replaced ambiguous “real source-backed” judge wording with **runtime-parsed synthetic source-backed**.
- Changed dependency behavior to clearing the accepted binding; no unsupported `No` claim was introduced.
- Distinguished absent inactive controls from the collapsed **Not currently required** summary.
- Classified At capacity and all receipt/connection states as human presentations rather than pretending every state is an automated code.
- Put hashes, raw identifiers, and codes under secondary **Technical details** with plain-language primary copy.
- Made minute-50 warning appear on the next foreground/focus opportunity after browser timer throttling.
- Clarified Reload as sole-page authority, not collaborative joining.
- Clarified that the confirmation presentation is transient and creates no durable approval/confirmed/pending state.
- Replaced agent-attributed human-submit uncertainty with neutral applicant copy; reserved assistant interruption copy for assisted Draft operations.
- Clarified JSON as the only CiteApply-generated download while browser Print/Save as PDF may create a user-controlled local copy.

## First Remediated Candidate And Recheck

The remediated candidate is 1,017 lines / 13,967 words / 99,940 bytes with SHA-256:

`832cf4885e0d4d299ec658d40f25676fd9e67ccb0bf19441198c6026864313cf`

All three lanes verified that hash. The judge lane passed, but product/UX and engineering/security independently returned **FAIL** with two shared P1s; product also found one consent-copy P1. A pass from one lane could not advance a changed or materially disputed artifact.

| ID | Severity | Recheck finding | Second-remediation disposition |
|---|---|---|---|
| G2R-15 | P1 | Resolved income in agent-facing state plus a low-entropy canonical Review hash allowed inference/enumeration of the supposedly human-only source and reason. | Resolved Conflict state is readiness-only; assisted preparation returns a fresh opaque non-content-derived identity/current metadata with no hash/digest. Human Review/Receipt keep the full value/hash. Six source/reason combinations must be agent-output-indistinguishable after normalizing versions/opaque IDs. |
| G2R-16 | P1 | Consent still overclaimed control and omitted separate browser/extension permissions, contact email/current rules, and excluded packet selection. | Literal copy now scopes every claim to CiteApply's six tools, names email/current questions/source rules/packet choice, explains readiness-only inference, and states that separately granted browser/extension/assistant permissions are unaffected. Keyboard/VoiceOver copy-completeness evidence is required. |
| G2R-17 | P1 | Native abort was narrative only; locked pre-dispatch versus post-acceptance behavior lacked stable acceptance/tests. | Added CA-RECOVER-06 and an adversarial scenario: pre-dispatch has no request/activity/effect; post-acceptance yields no or one bounded read/result/atomic effect, disables blind retry, and reconciles. Tombstones, cancel APIs/states/tables, rollback, and a new race family remain prohibited. |

The two shared P2s were also closed: dirty conflict editing now displays **8 of 8 saved answers ready · 1 unsaved change blocks Review**, and the canonical hash explicitly excludes revisions and assisted-origin attribution. Transport throttling is locked as a value-free non-workflow refusal whose detailed counter/security order belongs to G3.

## Second Remediation Candidate

The second remediation candidate is 1,036 lines / 14,547 words / 104,262 bytes with SHA-256:

`f38ae047c17e570f2d56923630ee9644335f46952621865b8929822b3ba54aaa`

The same three independent lanes are rechecking this exact artifact. No status has been changed to Approved.

## Third Recheck And Final Candidate Pending

All three lanes verified `f38ae047c17e570f2d56923630ee9644335f46952621865b8929822b3ba54aaa`. The judge lane passed. Product/UX and engineering/security independently returned **FAIL** on one shared P1: the PRD defined value-free throttling but left its ordering against expiry/stale-page/consent to G3, which would force a new observable product decision. Both also requested the same nonblocking dirty-progress generalization.

The next candidate makes throttling a public value-free preflight outside protected authority precedence. It performs no application/session/page/consent/replay/domain lookup and may win first; a fresh admitted request after `Retry-After` follows the normal authority order. Deterministic expired/stale/unconsented combinations must return the same transport refusal with no state effect. Dirty editing now preserves the actual prior **n of 8** count and tests both 7/8 and 8/8 examples.

The current fourth candidate is 1,036 lines / 14,640 words / 104,921 bytes with SHA-256:

`126706dcbd82001b85504dbcc00b09d85d2e1ec8652efedb04de1b165b6b736e`

All three lanes are rechecking this exact hash. No status has been changed to Approved.

All three lanes passed that hash with no P0/P1. Engineering and judge identified one last P2: income resolution can be edited before dependency opens the guardian branch, so the denominator is not always eight. The wording was generalized to the current active-field total and exact 5/6, 7/8, and 8/8 examples.

## Final Content-Hash Recheck

All three independent lanes verified and passed SHA-256 `5a315e67169fcb4c1625e943fb4f0ca698179adce4de2277096d21cedde757dc`:

| Lens | Verdict | Key confirmation |
|---|---|---|
| Product/UX/accessibility | Pass | No P0/P1/P2; current-active denominator, disclosure, conflict privacy, recovery, Review/Receipt, and accessibility remain closed |
| Engineering/security/test | Pass | The denominator was the sole change; authority/replay/abort/inference/parser/test contracts and caps remain coherent |
| Devpost judge/scope/release | Pass | Exact one-line denominator change adds no demo, scope, claim, capacity, or release regression |

The passed content candidate was 1,036 lines / 14,659 words / 105,043 bytes.

## Final Metadata-Hash Proof

The status line was changed from Draft to Approved only after the content pass. All three reviewers independently verified final SHA-256:

`f9fb37f38aa9a1b3b62ebdc46d5673dd8609669f1392df8f87a49e20a2ade40f`

Each reviewer restored only this prior line in memory:

```text
Status: Draft for replacement G2 review; application implementation remains prohibited
```

That operation reproduced passed content hash `5a315e67169fcb4c1625e943fb4f0ca698179adce4de2277096d21cedde757dc` exactly. The final approved artifact is 1,036 lines / 14,664 words / 105,055 bytes. `git diff --check` remains clean.

## Mechanical Verification

```text
wc -l -w -c docs/hackathon-build/prd.md
shasum -a 256 docs/hackathon-build/prd.md
git diff --check -- docs/hackathon-build/prd.md
```

Result for the current fourth candidate: size recorded above; SHA-256 matches; `git diff --check` passes; 40 stable story identifiers exist with no duplicate.

## Gate Decision

**Passed.** Every P0/P1/P2 was remediated, all three lanes passed the exact final content and metadata hashes, the PRD remains inside the locked product boundary, and no application code has started. Replacement G3 may begin. Application implementation remains prohibited until replacement G3 and G4 also pass.
