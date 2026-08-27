# G1R Review — Bounded Replacement Scope

Date: 2026-08-27
Gate: Reopened G1 — product scope and delivery feasibility
Artifact: `docs/hackathon-build/scope.md`
Status: Passed

## Why G1 Reopened

The prior G1 scope produced a G3 candidate of 75,417 words, 23 HTTP/page surfaces, 15 tables, three blocking portability spikes, and eight concurrency-proof families. It was mechanically coherent but could not be implemented and verified in the remaining quality window. G3 failed and reopened G1/G2 before any application code began.

## Review Panel

| Lens | Initial reviewer verdict | Artifact reviewed |
|---|---|---|
| Product, UX, accessibility, buyer/community value | Conditional; no P0, two P1 | SHA-256 `eb6130c7abd4cd04d3629a626d5a7b0024e8d0d3b152440baa2df735f72a7c87` |
| Engineering, security, privacy, concurrency, capacity | Conditional; no P0, five P1 | Same hash |
| Devpost judge and release fit | Conditional; no P0, three P1 | Same hash |

The judge lane scored the initial replacement candidate 4.25/5 overall: WebMCP Leverage 4.6, Execution 4.1, Potential Impact 3.9, and Creativity/Ambition 4.4. This was evidence of competitive potential, not permission to pass with material findings open.

## Material Findings And Candidate Dispositions

| ID | Severity | Finding | Candidate disposition in remediated scope |
|---|---|---|---|
| G1R-01 | P1 | Review lifecycle could trap an applicant; manual review preparation and return-to-edit parity were absent. | Draft now has **Review application** using the same service as the tool. Review has **Return to application** and **Confirm and submit this review**. Return invalidates the review, preserves valid work, closes assistance, and requires re-preparation. Manual/agent identical-state hashes and stale-review rejection are tested. |
| G1R-02 | P1 | Assisted-access consent did not tell the applicant which data/actions the client could receive/use. | Pre-Allow accessible copy now enumerates scope, included categories, permitted actions, exclusions, revocation limits, in-flight limits, and every event that clears assistance. DTO-to-copy and keyboard/screen-reader tests are mandatory. |
| G1R-03 | P1 | Video opened with procedural consent refusal rather than visible product value. | A clearly labelled cold-open excerpt from the same continuously recorded Conflict session shows a genuine tool-driven visible mutation by second 10. The video then shows the chronological trace; only labelled waiting compression is allowed, and the unedited trace remains release evidence. |
| G1R-04 | P1 | Official release obligations were linked but not normative gate criteria. | A new release gate requires public HTTPS, public repository, Amit-approved visible OSI license, public narrated video under three minutes, exact client/model/settings/date, reproducible judge instructions, availability through judging, and completed submission before the deadline. |
| G1R-05 | P1 | External authorization/provisioning latency had no deadline. | The combined public name/license/repository/provisioning/deployment/video/Devpost authorization package is requested after G4 and must be approved by `2026-08-30T20:00:00Z`. Missing authorization is release no-go, never implied authority. |
| G1R-06 | P1 | Capacity subtracted focused labor from wall time and called the residual contingency. | Aggregate agent-hours, critical-path wall hours, user/external latency, and remediation reserve are separated. Current P90 is 170 aggregate agent-hours, 102 critical-path wall hours, 12 latency hours, and 20 remediation hours: 134 pre-freeze wall hours. G1 and G4 must rebase against actual remaining time. |
| G1R-07 | P1 | Unconditional idempotent replay contradicted consent loss, review-close, and page takeover. | Current session/page/consent authority now precedes replay projection. Same ID/digest guarantees no duplicate effect and stable committed outcome, not protected redisclosure. Unauthorized retry returns `consent_required`/`stale_page`; the UI may show the committed state. Response-loss orderings are tested. |
| G1R-08 | P1 | Revocation/takeover wording overclaimed control of an already-authorized in-flight response; protected reads were absent from takeover races. | The scope now defines one final server-authorization linearization under the application lock. Read-first may arrive later and cannot be retracted; authority-loss-first releases no protected result. Protected read/apply/prepare are all in the authority-loss PostgreSQL family and consent copy states the limit. |
| G1R-09 | P1 | Native `AbortSignal` could not prove the promised durable cancellation race. | The stronger cancellation claim is removed. Abort before dispatch sends nothing; after server acceptance the outcome is no mutation or exactly one atomic mutation, resolved by authoritative state. There is no server cancel tombstone/control or rollback claim. |
| G1R-10 | P1 | Admission/cleanup and page-read behavior were hidden outside route/table/race caps. | A cap witness allocates five tables and six API families, including `rate_buckets`. Four explicit PostgreSQL families cover admission/pruning/replay, authority loss, review races, and submission races. API-family counting includes all authored handlers/actions. No cleanup endpoint or physical-deletion SLA is claimed. |

## P2 Remediation Included

- The headline now says runtime-parsed **synthetic** claims.
- Both packets set dependency to `Yes`; equal income records canonical plus corroborating sources, while disagreement never auto-resolves.
- Parser failure creates no partial claims and provides **Return to packet selection**; WebMCP unsupported/declined preserves every manual control.
- Session access is exactly 60 minutes with a minute-50 warning and an explicit expired receipt outcome.
- Accessibility coverage includes consent/revoke, parser failure, stale page, Return-to-edit, and export failure.
- Buyer pilot measures are named, and `docs/verification/impact-evidence.md` must report actual test/observation evidence or **No user validation occurred**.
- Demo creation uses a bootstrap nonce/request identity rather than an application revision that does not yet exist.
- Screen, JSON, and print are semantic projections of one canonical `ReceiptRecord`, not byte-equal artifacts.
- The first client spike includes three raw agent sequences of at most 120 seconds each; tool merging requires formal G1/G2 reopening.

## Bounded Product Decision

The candidate retains the judge-visible proof:

- one fictional scholarship portal;
- exactly eight fields and one guardian branch;
- two synthetic packets with three runtime-parsed one-page PDFs each;
- one supported and one income-conflict behavior from the same handlers;
- exactly six once-registered WebMCP tools with server-enforced informed consent;
- agent binding/proposal but human-only declaration, conflict resolution, review decision, and submission;
- complete manual fallback; and
- one atomic submission with an immutable session receipt.

The candidate excludes dynamic tool lifecycle, arbitrary upload/OCR, multi-lineage/collaborative/offline behavior, parser workers/retries, online policy migration, two-phase/encrypted submission reconciliation, persistent approvals, transactional cancellation, streamed receipts, physical-deletion promises, extra clients, and hackathon stretch features.

## Exact-Hash Recheck

All three independent lanes reread SHA-256 `9be525de0dc769f223ca10592ca233e880b93337a316afb15bc15a152436c0a4` and returned **PASS** with no remaining P0/P1:

| Lens | Recheck verdict | Key confirmation |
|---|---|---|
| Product/UX/accessibility | Pass | Review/Return/reprepare parity, informed consent, all P2 UX/accessibility/session/impact cases closed |
| Engineering/security/test | Pass | Authority-before-replay, in-flight ordering, narrowed abort, 5-table/6-API/4-race witness, capacity units and release stress all sound |
| Devpost judge | Pass | Same-session payoff, normative submission gates, authorization deadline, synthetic wording, impact artifact, and four-criterion competitiveness preserved |

The status line was then changed from candidate to approved. Each reviewer independently confirmed that the resulting final hash `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f` differs only by that status metadata, reproduces the passed content hash when restored, and introduces no material finding.

## Capacity Rebase At G1 Lock

Recorded at `2026-08-27T12:06:50Z`:

- 151.89 wall hours remained before feature freeze at `2026-09-02T20:00:00Z`;
- 175.89 wall hours remained before the official submission deadline;
- current pre-freeze P90 calendar demand is 134 hours; and
- conservative pre-freeze scheduling slack is 17.89 hours.

The G1 inequality passes. This is not permission to spend the slack on features; G4 must recompute the remaining critical path, unresolved external/user latency, and full 20-hour remediation reserve.

## Mechanical Verification

The final approved scope is 443 lines / 5,686 words / 41,895 bytes with SHA-256:

`989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`

Commands:

```text
wc -l -w -c docs/hackathon-build/scope.md
shasum -a 256 docs/hackathon-build/scope.md
git diff --check
```

Result: size is below the 15,000-word technical-spec cap and `git diff --check` passes.

## Gate Decision

**Passed.** Every P0/P1 was remediated, all three independent lanes passed the exact content hash and the final status-only hash, the capacity rebase passes, the saved guided-build state and agent contract agree, and no application code has started. Replacement G2 may begin. Application implementation remains prohibited until replacement G2, G3, and G4 each pass.
