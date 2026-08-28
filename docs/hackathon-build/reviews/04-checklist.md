# G4 Review — Build And Verification Checklist

Date: 2026-08-27
Gate: G4 — sequenced implementation, verification, and release contract
Artifact: `docs/hackathon-build/checklist.md`
Status: Historical G4 passed at the eleventh pair; appended G4L and A0L passed, Item 1 local-only implementation authorized, and A0P/public actions deferred

## Locked Inputs

- Scope SHA-256: `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`
- PRD SHA-256: `1fc13ede1edec072f1776d35b88a4c688bfc5a6e33ddda9d554226b9fe37f0f9`
- Specification SHA-256: `9baf6bab2e779cd6b014dac982dde1a547802fd77c634074d0662b729c03830a`
- Checklist locked SHA-256: `dddde1c29828301ccf05e708abaf8bd800f2804e8abd0fdf3dbabe0b0131b2ee`
- Passed checklist content SHA-256: `2fcd09b877b3f35c3f451758a8cd345d1232821a627c32b20a0fb837aade39da`
- Producer-ledger candidate SHA-256: `fe7dfb9a4f88621a139d9624e82d7904f3ce964693fd2dae0c862ed4e5421ace`
- Locked metrics: checklist 325 lines / 14,686 words / 128,769 bytes; ledger 12,872 lines / 22,549 words / 305,290 bytes

## Local Preflight

- `git diff --check`: pass
- Checklist item titles: 12
- `Spec ref` fields: 12
- `What to build` fields: 12
- `Acceptance` fields: 12
- `Verify` fields: 12
- Items 1–11: 615 consecutive, unique owner-tagged 15/30-minute units / 168.25 aggregate agent-hours P90
- A0: 16 consecutive one-output units / 5.00 active hours outside H0 and external latency
- Item 12: 97 consecutive, unique owner-tagged 15/30-minute units / 30.75 aggregate agent-hours, at most 21.75 critical release hours inside a 27.75-hour release envelope, preserving at least 6 contingency hours
- Producer ledger: strict JSON and duplicate-key clean; 232 tracked + 8 literal excluded-private rows; 240 creators + 183 exact modifiers = 423 unique file units; 87/87 locked spec leaves; race modules 65 + 7 infrastructure/runners
- Application code/dependencies/migrations/fixtures/tests: not started

## Capacity Preflight

The eleventh candidate keeps the locked 94-hour fully loaded implementation/verification envelope. Its complete-start capacity demand is 5.00 active A0 hours + 94 H-clock hours + 12 unresolved external/user/provisioning hours + 20 protected abnormal-remediation hours = 131.00 hours. Items 1–11 contain 168.25 aggregate implementation/pre-freeze agent-hours P90, and A0 brings total active pre-release effort to 173.25 hours without changing the dependency-derived 94-hour H-clock.

The final release sequence is separately rebased to 97 outputs / 30.75 aggregate hours / at most 21.75 critical hours inside a 27.75-hour envelope beginning at the voluntary internal release-only cutoff `2026-09-02T16:15:00Z`. That cutoff is 3.75 hours earlier than the mandatory `2026-09-02T20:00:00Z` feature freeze and preserves the locked final 24 hours plus six untouched contingency hours.

At `2026-08-27T23:20:43.408Z`, the exact frozen pair had 136.905 hours until the internal release-only start versus 131.00 hours complete-start demand, leaving 5.905 hours gross scheduling slack. The inequality passes. Resample immediately before the eventual G4 lock; the slack is not a feature budget. A result below the then-current unfinished demand fails the gate and requires reviewed capacity correction.

## Review Protocol

Three independent lanes must verify the candidate hash before and after a complete reread:

1. product value, complete user journeys, UX/accessibility, scope/PRD coverage, and usable stage boundaries;
2. engineering dependencies, security/privacy, PostgreSQL concurrency, test commands/evidence, capacity realism, and implementation order; and
3. WebMCP correctness, genuine-client proof, judge criteria, official release obligations, causal demo, and authorization boundaries.

Each lane returns P0/P1/P2 findings with exact citations and a pass/fail verdict. G4 cannot pass conditionally. Every P0/P1 must be fixed and rechecked; every P2 must be fixed or explicitly accepted. After unanimous content pass, a status-only lock edit requires three independent candidate-hash reproductions before application implementation may begin.

## First Candidate Verdict — Rejected

All three lanes independently verified checklist SHA-256 `bd21821173b1808d7f023e0e526d37c63663742679c1d4dbcc6408885fd494ec` before and after complete rereads. Metrics remained 170 lines / 3,101 words / 26,582 bytes, `git diff --check` stayed clean, and no reviewer edited a file. P0 was zero, but every lane returned **FAIL**. The nominal 40-story coverage and 94-hour arithmetic could not offset an impossible execution order and deferred prerequisites.

| ID | Severity | Consolidated finding | Required disposition |
|---|---|---|---|
| G4R1-01 | P1 | Strict item serialization put Supported Receipt at H56, complete Conflict collaboration at H70, and core race/security/accessibility proof at H86 instead of locked H30/H48/H72 checkpoints. | Replace serialization with an explicit dependency DAG and checkpoint-aligned parallel waves; show fully loaded aggregate effort, wall maxima, ownership, merge/review allowance, and true dependencies. |
| G4R1-02 | P1 | H12 required final two-packet PDF evidence while all six final PDF bytes, hashes, registrations, and anchors were deferred to item 4. | Reproducibly generate and freeze all six final PDFs plus minimum reviewed anchors before the H12 proof; later hardening may not replace them without rerunning H12. |
| G4R1-03 | P1 | H12 disclosed protected data and mutated PostgreSQL before complete informed-consent copy and the final minimum authority/replay/schema/logging kernel existed. | Move the final disclosure/modal/keyboard/copy tests and final minimum credential, Origin/fetch, cap, lock, authority, keyed-replay, safe-log/no-store, descriptor/result, and atomic-registration semantics ahead of the first protected run. |
| G4R1-04 | P1 | The combined authorization package was first presented in the final release item, although H12 required an authorized HTTPS origin and scope requires the request immediately after G4. | Add a non-mutating immediate-post-G4/pre-item-1 authorization checkpoint; record each permission/refusal and run the 12-hour latency allowance in parallel. Keep final Devpost confirmation separate. |
| G4R1-05 | P1 | The checklist omitted locked autonomous/pause/comprehension/Git/update preferences and left 6–13-hour epics without atomic execution units. | Record the answered preferences and add ordered 15–30-minute execution units inside the 12 reviewed gates so build execution neither re-asks nor invents sequencing. |
| G4R1-06 | P1 | The 94-hour wall claim did not prove that repeated merge, commands/evidence, three-lane review, and normal recheck costs were loaded. | Show 150 aggregate agent-hours P90, four-slot limits, per-wave wall maxima, and state that each wave P90 includes integration, evidence, concurrent review, documentation, and one normal recheck; keep the 20-hour reserve for abnormal remediation. |
| G4R1-07 | P1 | The handoff did not freeze the Devpost entry, repository, video, live deployment/configuration, and release branch after deadline through winners. | Disable mutation paths after submission, monitor availability read-only, use a separate fork for later work, and permit exceptional correction only with Sponsor/Devpost and Amit authorization through `2026-09-23T21:00:00Z`. |
| G4R1-08 | P2 | Several `Spec ref` labels and scope `Release slice` did not exist in locked inputs. | Use exact current headings and stable subsection names. |
| G4R1-09 | P2 | H12 wording could measure separate PDF work instead of the complete Start transaction. | Record p50/p95/max for each whole three-document parse, cleanup, admission, and insert transaction in every required runtime. |
| G4R1-10 | P2 | Item 2 omitted its independent review-record path. | Add exact `docs/hackathon-build/reviews/05b-portability-client.md`. |
| G4R1-11 | P2 | Submission acceptance did not explicitly map evidence to the four equal judging criteria or explain the real audience/problem and differentiation. | Add an evidence-linked four-row README/Devpost/video matrix with honest no-validation limits. |
| G4R1-12 | P2 | Finalization did not require a new official overview/announcements/dates/rules/submission-field check. | Re-fetch official sources immediately before final mutation, timestamp the record, and resolve any delta first. |

The current official FAQ additionally says that after the September 3, 2026 1:00 pm PT deadline the submission, repository, and live site must remain untouched until winners; continued work belongs in a separate fork. The replacement checklist must encode that operationally.

## Second Candidate

The replacement checklist is SHA-256 `cd1fc69079f819bd31228e6634f5ccf305f99716a7cd5e4ccfed5fa1e26bdc05`, 127 lines / 4,786 words / 40,457 bytes. It retains 12 five-field gates and contains 275 explicitly numbered 15–30-minute atomic execution units.

It replaces strict serialization with five dependency waves totaling 150 aggregate agent-hours P90 and 94 fully loaded critical-path wall hours P90; moves the immutable six PDFs, complete informed-consent UI, and final minimum authority/replay/WebMCP kernel ahead of H12; adds immediate post-G4 authorization checkpoint A0; records every answered build preference; names exact review/evidence paths and current headings; measures complete Start transactions; adds the four-criterion judge matrix and fresh official-rules check; and freezes submitted artifacts until winners are actually announced.

At `2026-08-27T17:09:04Z`, 146.85 hours remained to feature freeze versus the unchanged 126-hour fully reserved post-G4 demand, leaving 20.85 hours gross slack before remaining G4 review work. This is a candidate sample only; approval must resample.

Local preflight passes `git diff --check`, exactly 12 titles and 12 each of the four named fields, 275 numbered atomic units, and zero stale heading labels identified by G4R1-08. No application implementation exists.

Product/UX/accessibility, engineering/security/testability, and WebMCP/judge/rules each verified this exact hash before and after a complete reread. All three returned **FAIL**. P0 remained zero; the replacement closed most first-candidate defects but did not yet make the execution/capacity witness mechanically honest.

### Second Candidate Verdict — Rejected

| ID | Severity | Consolidated finding | Required disposition |
|---|---|---|---|
| G4R2-01 | P1 | Items 1–11 contained only 250 purported 15–30-minute units for 150 aggregate hours, capped at 125 hours even before bundled composite units/reviews/rechecks; ownership/minute arithmetic was absent. | Split every composite into one-output implementation/test/evidence/reviewer/recheck units and add exact owner/P90-minute/item/wave arithmetic within four slots. |
| G4R2-02 | P1 | Parallel Wave 1 consumed human HTTP, domain, Review, Receipt, and agent contracts that item 1 had not frozen; Wave 2 also overlapped WebMCP-owned files without a merge contract. | Add a root-owned compile/typecheck contract mini-gate before Wave 1, freeze all shared DTO/Zod contracts, and name file owners/merge points. Later work implements behind those contracts. |
| G4R2-03 | P1 | H12 could pass a hash-selected hardcoded adapter because changed-byte, accepted-value, separate-anchor, forbidden-import/literal, and built-bundle proofs were deferred. | Run the minimum full anti-hardcode/mutation set through built production output before H12; retain the exhaustive item-4 matrix later. |
| G4R2-04 | P1 | Item 9 abbreviated families 2–4 and could pass without Review-close, dirty-prepare, branch-clear/path cartesian, Return/edit, third-page, and other locked cases. | Create an exact parameterized case-ID manifest matching every locked cell and both winners; family commands fail on any absent ID/winner. |
| G4R2-05 | P1 | No CiteApply/WebMCP Devpost project exists, no local submission draft exists, and the checklist omitted authorized create/update/completeness steps plus five non-inferable required answers. | Add authorized draft creation/update for all core fields and links; collect/reconfirm every required user answer without inference; show complete preview; retain separate final-submit confirmation. |
| G4R2-06 | P2 | H12 evidence omitted app build, model, visible account availability, settings, origin, and date. | Capture every spec-listed exact-client field at H12 and repeat on the frozen release build. |
| G4R2-07 | P2 | No command mechanically counted hidden pages/routes/Server Actions/middleware business calls/tables/race manifests/descriptors against caps. | Add `verify:surfaces` at foundation, Wave 1 closure, and release candidate. |
| G4R2-08 | P2 | H0–H94 was called wall time while separate external latency could consume 12 hours before H12. | Define H as cumulative critical-work time, document paused external-only intervals and calendar maximum, and impose the H12 approval cutoff while keeping the additive inequality. |
| G4R2-09 | P2 | The locked `devpost-2026-final` release tag was absent from authorization, creation, and manifest/remote verification. | Add explicit tag authority, create it at the frozen commit, and prove local/remote/manifest equality. |

Live read-only Devpost inspection during this review found two unrelated RevenueCat `Untitled` drafts but no CiteApply project; local submission state is still `not-started`. The then-current form additionally required Amit-supplied Submitter Type `28249`, Country `28250`, App Status `28252`, Learning level `28259`, and Career AI value `28260`. These answers remain unknown and cannot be inferred.

## Third Candidate

Frozen checklist SHA-256 `e023a597f4f6504c54e9c78d0dc545c1ea0d12f04fb5fe40aed126099c83ec3b`, 148 lines / 6,800 words / 54,320 bytes. The candidate has exactly 12 checklist titles and 12 each of `Spec ref`, `What to build`, `Acceptance`, and `Verify`. `git diff --check` passes.

Mechanical enumeration proves consecutive, unique item counts of 120, 48, 40, 56, 52, 48, 36, 36, 63, 49, 60, and 42 with zero gaps or duplicates. Items 1–11 therefore contain 608 auditable 15-minute units and exactly 152 aggregate P90 hours; item 12 separately contains 42 25-minute final-release units totaling 17.5 hours and retains 6.5 contingency hours.

The candidate closes the complete prior finding union as follows:

- G4R2-01: exact unit/minute/item/wave arithmetic, four-slot ownership, explicit review/recheck/documentation/commit units, and an overrun split/reforecast rule replace hidden composite effort.
- G4R2-02: root compile-freezes every shared HTTP/domain/Review/Receipt/agent/WebMCP DTO/Zod contract and hash before parallel work; disjoint file ownership and H20/H26/H29/H36/H44/H47/H60/H70 merge points are explicit.
- G4R2-03: changed-byte, accepted-value, separate-anchor, forbidden-import/literal, and built-bundle proofs run through production output before H12.
- G4R2-04: family 2 enumerates read/apply/dirty-prepare against Revoke, Review close, takeover, and expiry with both winners; family 3 enumerates bind/edit/declaration/resolution/clear/branch-clear against manual, assisted, and Return orders; family 4 enumerates every locked submit/Return/edit/confirmation/takeover/loss/third-page/expiry/Receipt/export case. `verify:race-manifest` enforces completeness.
- G4R2-05: A0 collects five non-inferable answers; item 11 creates or updates an authorized CiteApply draft and local `devpost-submission.md`; item 12 refreshes actual fields, shows the complete preview, and keeps final submit behind separate immediate confirmation.
- G4R2-06 through G4R2-09: H12 and release evidence include every exact client/environment field; `verify:surfaces` counts authored and hidden business surfaces; H means critical work while separately bounded external latency remains additive; and `devpost-2026-final` authority, creation, push, and local/remote/manifest equality are explicit.

At `2026-08-27T17:36:47.487Z`, 146.39 hours remained to feature freeze. The third candidate requires 94 unfinished critical-path hours + 12 unresolved external-latency hours + 20 protected remediation hours = 126 hours, leaving 20.39 hours gross slack before remaining G4 review. This is still a sample; approval must resample the same inequality immediately before lock.

### Third Candidate Verdict — Rejected

All three lanes independently verified SHA-256 `e023a597f4f6504c54e9c78d0dc545c1ea0d12f04fb5fe40aed126099c83ec3b` before and after complete rereads, reproduced the metrics and unit arithmetic, made no file edits, and returned **FAIL**. Product reported four P1 findings; engineering reported six P1 and two P2 findings; judge/rules reported four P1 and one P2 finding. P0 remained zero. The arithmetic was internally exact but omitted required work and did not prove the dependency path.

| ID | Severity | Consolidated finding | Required disposition |
|---|---|---|---|
| G4R3-01 | P1 | Under strict item 1 → item 2 gating, four slots, and the stated unit timeboxes, item 1 has an optimistic 8.3125-hour floor and item 2 a 4-hour floor: Wave 0 is already at least 12.3125 hours before real dependencies. The genuine-client calls are mostly sequential and item 1 lacks a per-lane unit DAG. | Assign every Wave-0 unit to an explicit disjoint owner/lane, show dependencies and merge/review closure, group only genuine one-output artifacts, and mechanically prove the longest path is no more than H12. Rebase all counts/hours/capacity. |
| G4R3-02 | P1 | H12 claimed complete Start cleanup/admission/insert and hosted proof, but `rate_buckets`, sentinels, throttle/prune/512 admission, and the real Start service were deferred; no authorized provider/database provisioning, secrets/origin, remote migration, deployment, or HTTPS establishment units preceded the hosted measurement. | Put the minimum final Start/rate/admission kernel and explicit authorized provision → configure → migrate → deploy sequence before H12. No seed, hidden work, or bypass may substitute. |
| G4R3-03 | P1 | The family-2 manifest enumerated read, apply, and dirty prepare versus four authority losses but omitted ordinary/clean prepare in both winners and did not explicitly prove takeover no-growth/replay. | Add exact clean-prepare × Revoke/Review-close/takeover/expiry cells and explicit takeover no-growth/replay case IDs; rebase item 9 and make completeness mechanical. |
| G4R3-04 | P1 | Items scheduled test reruns after remediation but no independent finding-owner reviewer recheck, contrary to the gate protocol. | Add a separately allocated independent reviewer recheck after remediation/proof rerun at every implementation/release gate. |
| G4R3-05 | P1 | Item 12 named evidence/review files in acceptance but allocated no evidence write, frozen regression, three same-state reviews, triage, remediation, proof rerun, independent recheck, or closure documentation before irreversible submission. | Allocate the complete closure inside the final release window before confirmation/submit and preserve at least six hours of contingency. |
| G4R3-06 | P1 | Item 11 created the final tag before its reviews, remediation, documentation, and later checkpoint commit; item 12 could then amend history. Tag/manifest/local/remote/submitted equality was impossible. | Finish every authorized history action, evidence, review, remediation, recheck, documentation, and final commit first; generate the manifest and create/push the tag last; forbid later history/commit drift. |
| G4R3-07 | P1 | The plan verified repository/license/About and YouTube before creating/pushing/uploading them, and omitted public repository creation, approved top-level license, About metadata, and public video upload/readback units. | Enumerate authorized repository create → license/About → push → verify and video capture → edit → local QA → public upload → readback → link in executable order; include effort and authorization. |
| G4R3-08 | P2 | Several units remained multi-output (`visible thin UI/bridge`, both transaction distributions, multi-cell matrices, `clone/install/migrate/build`), and “restore identical saved start state” could imply a fake DB/harness reset. | Split outputs or name one bounded generated artifact; create a fresh normal Conflict demo through `/api/demo` for each raw run and prove identical authoritative initial state with no DB/test reset or edited trace. |
| G4R3-09 | P2 | The checklist promised a remote non-submitted Devpost draft containing challenge custom answers, but current `create_project`/`update_project` support only core project fields/links; `custom_answers` belongs to the high-stakes `submit_project` operation. | Keep exact current and conditional answers in the reviewed local packet/preview; pass them to `submit_project` only after explicit immediate confirmation, unless a separately tested browser Draft-save route is deliberately authorized. |

Read-only live connector refresh at `2026-08-27T17:44:35Z` confirmed nine required submission fields: five Amit-supplied/non-inferable answers (`28249`, `28250`, `28252`, `28259`, `28260`) plus live URL `28254`, public repository `28256`, tested clients `28257`, and AI tools `28258`. `28251` and `28253` become relevant conditionally; `28255` is optional judge-only testing guidance. The same refresh confirmed the `2026-09-03T20:00:00Z` deadline.

## Fourth Candidate

Frozen checklist SHA-256 `92e5f8af9a9b7be4fef4a8bb4c00d20c85156bf6d1a77d96cc4d68a57a6d560f`, 209 lines / 9,335 words / 76,960 bytes. `git diff --check` passes. The candidate has exactly 12 checklist titles and exactly one newline-delimited `Spec ref`, `What to build`, `Acceptance`, and `Verify` field per item.

Mechanical enumeration proves consecutive, unique item counts of 81, 48, 32, 59, 55, 51, 39, 39, 99, 52, 54, and 75 with zero gaps or duplicates. The explicit 30-minute counts are 37, 5, 0, 0, 0, 0, 0, 0, 0, 0, 17, and 18. Items 1–11 therefore contain 609 owner-tagged outputs and exactly 167 aggregate P90 hours; item 12 contains 75 outputs / 23.25 aggregate hours / 17.5 critical hours / 6.5 contingency hours. The story map contains all 40 unique PRD IDs. The checked race design contains exactly 65 unique rows split F1/F2/F3/F4 as 15/21/18/11.

Before any reviewer returned a verdict, root invalidated a briefly dispatched predecessor hash because X28 did not explicitly name all G4R2-06 client-environment fields and conditional units did not explicitly require a no-change/inapplicable output. The current hash adds the exact app/build/model/account-availability/settings/origin/UTC-date trace header and the global conditional-output/no-silent-skip rule. No review verdict from the predecessor is being reused.

The candidate resolves the third-review union as follows:

- G4R3-01: items 1–2 are one integrated gate with four fixed H0–H6.5 lanes, exact cross-lane releases, every X01–X43 interval, H9.75–H12 closure, 129 units / 42.75 aggregate hours inside 48 slot-hours, and an exact 12-hour critical path. Item numbering does not invent a false dependency; neither checkbox closes before C14.
- G4R3-02: all five minimum DDLs, fixed-key throttle/prune, Start cleanup/512 admission, nonce/replay, capability, envelope, final authority, hard-128 operations, complete Start, real Neon/Vercel configuration, remote migration, deployment, HTTPS/origin, and hosted timing precede H12.
- G4R3-03 and G4R3-08: 65 one-file race rows replace matrices. Family 2 contains exactly 12 operation×authority-loss rows with clean/dirty prepare variants plus takeover no-growth/replay; Family 3 contains all 18 action×manual/assisted/Return rows. Every genuine-client run starts a fresh normal `/api/demo` application/session and uses no restore/reset shortcut. Supplemental Chrome moved to item 11.
- G4R3-04: every implementation/release item now allocates three initial independent verdicts and three post-remediation exact-candidate rechecks. Later-wave four-slot serialization and wall margins are explicit.
- G4R3-05: item 12 contains isolated clean-room proof, immutable pre-submit evidence, three reviews, triage, remediation, rerun, three rechecks, final-SHA/manifest/tag/push equality, immediate confirmation, submit receipt/readback, and post-submit freeze within 17.5 critical hours plus 6.5 contingency.
- G4R3-06 and G4R3-07: authorized local identity/history/license changes precede the reviewed candidate. Public repository creation, video capture/edit/QA/upload/readback, README/judge/limitations/criteria outputs, final commit, non-tracked manifest, tag, push, About metadata, and public equality occur in executable order. No tag/public push/video occurs in item 11.
- G4R3-09: create/update operations carry only core project fields and complete replacement arrays. Challenge answers stay in the local provenance packet until the exact payload is shown and Amit immediately confirms “yes, submit”; live `Submitted`, correct relationship/public URL, and non-null `submitted_at` are mandatory.

The live capacity sample at `2026-08-27T18:10:02.299Z` is 145.83 hours remaining versus 94 unfinished critical hours + 12 external-latency hours + 20 abnormal-remediation hours = 126 hours, leaving 19.83 gross hours before remaining G4 review work. Approval must resample again.

### Fourth exact-hash verdict — rejected

Product/UX/accessibility, engineering/security/testability, and WebMCP/judge/rules each reread unchanged SHA-256 `92e5f8af9a9b7be4fef4a8bb4c00d20c85156bf6d1a77d96cc4d68a57a6d560f` from byte zero, verified the hash before and after, made no edit, and returned **FAIL**. Product reported P0 0 / P1 2 / P2 3; engineering P0 0 / P1 3 / P2 3; judge/rules P0 0 / P1 2 / P2 1. The consolidated G4R4 union is:

| ID | Severity | Finding | Required disposition |
|---|---|---|---|
| G4R4-01 | P1 | Items 6–8 reused one phase owner for simultaneous work, so the advertised four-slot Wave 2 was impossible. | Assign disjoint phase-scoped owners and exclusive file paths in every parallel wave. |
| G4R4-02 | P1 | The pre-H12 genuine-client chronology required branch, income, readiness, masking, and blocked-prepare behavior that item 4 deferred until after H12. | Put the executable minimum domain/projector behavior before C0; permit later hardening but no replacement. |
| G4R4-03 | P1 | Wave-1 and Wave-2 closure timestamps did not include all post-merge evidence, reviews, remediation, reruns, rechecks, documents, and checkpoint work. | Publish a constructive four-slot schedule with every output charged and each wave closed inside its envelope. |
| G4R4-04 | P1 | Clone/Linux/CI proof was not consistently bound to a prior immutable candidate; some proof preceded the candidate it purported to verify. | Commit or pin the exact candidate before clone/CI/rerun proof and record checked SHA equality. |
| G4R4-05 | P1 | Items 3–10 lacked unambiguous shared C1/C2 identities before initial reviews and post-remediation rechecks. | Freeze C1 before reviews, freeze/pin C2 before reruns, bind all rechecks to C2, and use documentation-only C3. |
| G4R4-06 | P2 | The Wave-0 review path and private Devpost packet path/schema were not exact or complete. | Name `reviews/05b-portability-client.md`, the excluded top-level `devpost-submission.md`, its schema, provenance, and Git-index absence proof. |
| G4R4-07 | P2 | Contract/evidence file names drifted from the locked specification, while one release unit combined deployment and equality outputs. | Use the exact locked File Structure and split every mutation receipt from its equality report. |
| G4R4-08 | P2 | Item 12's remediation/no-change path still required an affected rerun even when the signed disposition proved no change. | Emit either an R2-bound rerun or a signed no-rerun-required proof index, then recheck the exact pin. |
| G4R4-09 | P1 | The final official-rules/field refresh occurred too early to protect the actual payload immediately before confirmation/submission. | Re-fetch every governing source and live field after all public artifacts are frozen and before preview/confirmation. |
| G4R4-10 | P1 | Eligibility was a prose assertion, not an executable Individual/Team/Organization branch; an invite link did not prove accepted membership. | Add a pre-H0 branch validator, representative authority, private invite handling, authenticated acceptance/registration readback, and no-go outcomes. |
| G4R4-11 | P2 | A 15-minute unit falsely treated the multiweek judging-period monitor as completed work. | Count only monitor configuration plus the initial check; model passive six-hour checks and post-announcement closure as future read-only work. |

No application code or external mutation occurred. Root then used the three reviewers' design-only remediation notes to rebuild the dependency witness; no fourth-candidate verdict is reused for the replacement candidate.

## Fifth Candidate

Frozen checklist SHA-256 `fe39a1ac9a4a85f005822d96b351a724a1367e5380f4dde9b5f01ed34e233684`, 238 lines / 9,718 words / 83,367 bytes. `git diff --check` passes. The candidate has exactly 12 checklist titles and exactly one newline-delimited `Spec ref`, `What to build`, `Acceptance`, and `Verify` field per item.

Mechanical enumeration proves consecutive, unique, owner-tagged item counts of 72, 53, 34, 48, 59, 51, 39, 38, 98, 53, 56, and 80 with zero gaps or duplicates. The unit-level 30-minute counts are 33, 9, 0, 0, 0, 0, 0, 0, 0, 0, 17, and 18. Items 1–11 therefore contain 601 outputs and exactly 165.00 aggregate P90 hours; A0 adds 9 outputs / 2.75 active hours; item 12 contains 80 outputs / 24.50 aggregate hours / at-most-18 active hours / at least 6 contingency hours. The story map contains all 40 unique PRD IDs. The race design contains exactly 65 unique rows split 15/21/18/11.

The replacement closes the G4R4 union by putting the executable minimum domain/projectors before C0; assigning disjoint phase owners and exact locked paths; publishing constructive Wave-0/1/2/3 candidate schedules; creating C1/C2 before reviews/reruns/rechecks; binding fresh-clone Linux proof to C0/C1; naming every verification/review/private-packet artifact; splitting mutation and equality outputs; executing Individual/Team/Organization eligibility and authenticated membership acceptance before H0; moving the complete official-source/field refresh immediately before preview; and modeling only monitor setup/initial check as release work while leaving passive/post-announcement checks in the future.

The live capacity sample at `2026-08-27T19:09:27.939Z` is 144.84 hours to feature freeze versus the conservative 94-hour fully loaded schedule envelope + 12 external-latency hours + 20 abnormal-remediation hours = 126 hours, leaving 18.84 gross hours before remaining G4 review work. Approval must resample again.

### Fifth exact-hash verdict — rejected

All three lanes verified SHA-256 `fe39a1ac9a4a85f005822d96b351a724a1367e5380f4dde9b5f01ed34e233684` before and after complete byte-zero rereads, reproduced every metric, made no edit, and returned **FAIL**. Product reported P0 0 / P1 5 / P2 1; engineering P0 0 / P1 4 / P2 1; judge/rules P0 0 / P1 2 / P2 1. The deduplicated G4R5 union is:

| ID | Severity | Finding | Required disposition |
|---|---|---|---|
| G4R5-01 | P1 | Wave-0 HTTP/WebMCP consumers start before the shared DTO/Zod contracts and hash are frozen. | Publish an exact contract release before every S/U consumer and rebase the constructive Wave-0 schedule. |
| G4R5-02 | P1 | Successful assisted Review prepare has no owned production server integration after item-4 Review logic. | Allocate the exact `src/server/services/webmcp.ts` integration before W2-C1 and its dependent tests. |
| G4R5-03 | P1 | Item 9's longest owner path is at least 12.25 hours, so H60/W3-C1 timing is false. | Correct the item-9/W3 witness or reassign actual outputs while preserving H72 honestly. |
| G4R5-04 | P1 | A0 active work occurs before H0 but is hidden inside the external-latency bucket. | Add the full revised A0 active wall to `94 + 12 + 20`, reconcile every capacity record, and resample. |
| G4R5-05 | P1 | Family 4 does not explicitly prove both receipt-load-versus-expiry and export-versus-expiry winners. | Name both expiry antagonists/case IDs, enforce them in the real-PostgreSQL manifest, and rebase counts/schedule. |
| G4R5-06 | P2 | Race rows use unowned `artifacts/races/**` instead of the locked `tests/races/**` structure. | Move rows/validators to an exact locked test path. |
| G4R5-07 | P1 | Item 3 invokes Family-1 barriers/schema/validator/runner before item 9 creates them; F2–F4 JSON rows also lack explicit executable dispatch modules. | Move frozen common/F1 infrastructure before item 3's race proof and allocate executable F2–F4 case modules in item 9. |
| G4R5-08 | P1 | A0.2, 1.14, 1.29, and 9.94 still bundle distinct required files/mutations/proofs despite the one-output rule. | Split exact files and local mutations/proofs, or use one named aggregate command report that emits no subsidiary artifact; rebase all affected counts. |
| G4R5-09 | P1 | Public video/thumbnail can remain bound to rejected R1 after product-changing R2 remediation. | Add a candidate-sensitive media disposition and mandatory recapture/QA/upload/readback/project/packet/evidence/review loop or no-go. |
| G4R5-10 | P1 | A0 membership/entrant proof can become stale before submission, while connector readback cannot prove the roster. | Immediately before final readiness, re-prove the exact Individual/Team/Organization branch, roster/countries/acceptance/registration/authority/facts, bind its digest through submission, and loop/no-go on delta. |
| G4R5-11 | P2 | The review record's controlling header still names the rejected fourth candidate. | Update current metadata on every new freeze while preserving historical candidate sections. |

The live judge refresh found no rule or submission-field delta. At `2026-08-27T19:23:00Z`, 144.62 hours remained; using the honest fifth-candidate additive interpretation `94 + 2.75 + 12 + 20 = 128.75` left about 15.87 hours before further remediation/review. No application code or external mutation occurred.

## Sixth Candidate

Frozen checklist SHA-256 `cc79d50d668221830d7b0ea6ee180dc50e8d1d43e87db8f35540867b9284997e`, 240 lines / 10,175 words / 88,284 bytes. `git diff --check` passes. The candidate has exactly 12 checklist titles and exactly one newline-delimited `Spec ref`, `What to build`, `Acceptance`, and `Verify` field per item.

Mechanical enumeration proves consecutive, unique, owner-tagged item counts of 74, 53, 56, 48, 59, 51, 39, 38, 83, 53, 56, and 80 with zero gaps or duplicates. The unit-level 30-minute counts are 31, 9, 0, 0, 0, 0, 0, 0, 0, 0, 17, and 18. Items 1–11 contain 610 outputs and exactly 166.75 aggregate P90 hours; A0 adds 12 outputs / 3.50 active hours; item 12 remains 80 outputs / 24.50 aggregate hours / at most 18 active hours / at least 6 contingency hours. The story map contains all 40 unique PRD IDs. The race design contains exactly 65 executable modules split 15/21/18/11.

The replacement closes the G4R5 union by freezing `W0-CONTRACTS` before every shared consumer; splitting every cited composite output; moving frozen common/Family-1 executable infrastructure before its proof; adding the owned successful assisted-prepare production path and dependent test; replacing JSON race descriptions with one-file executable F2–F4 modules; explicitly proving both receipt-load/export-versus-expiry winners; correcting item 9 to a constructive H48–H57 graph; counting active A0 separately; adding an R2-sensitive replacement-media loop/no-go; and binding a fresh authenticated Individual/Team/Organization proof immediately through final preview and submission.

The live capacity sample at `2026-08-27T19:48:08.320Z` is 144.20 hours to feature freeze versus `3.50 + 94 + 12 + 20 = 129.50` hours of complete-start demand, leaving 14.70 hours gross slack. Approval must resample again. No application code or external mutation occurred.

### Sixth exact-hash verdict — rejected

All three lanes verified SHA-256 `cc79d50d668221830d7b0ea6ee180dc50e8d1d43e87db8f35540867b9284997e` before and after complete byte-zero rereads, reproduced the exact counts, made no edit, and returned **FAIL**. Product reported P0 0 / P1 1 / P2 1; engineering P0 0 / P1 1 / P2 1; judge/rules P0 0 / P1 0 / P2 1. The deduplicated G4R6 union is:

| ID | Severity | Finding | Required disposition |
|---|---|---|---|
| G4R6-01 | P1 | Sequential P-lane arithmetic completed `draft.ts` at H5.00 while U-lane `readiness.ts` began at H4.75, creating a 15-minute producer/consumer overlap despite the claimed H4.75 Draft release. | Publish a count-neutral P/U sequence whose atomic Draft output completes before readiness starts; correct every stated release time and preserve H6.50 C0. |
| G4R6-02 | P2 | The controlling G4 exit predicate required only G4R1–G4R4, omitting the G4R5 union candidate 6 existed to close. | Require the complete G4R1–G4R5 union in the normative exit criterion. |

The remaining product, engineering, security, WebMCP, judge, rules, release, eligibility, media, race, and capacity checks passed in all applicable lanes. No application code or external mutation occurred.

## Seventh Candidate

Frozen checklist SHA-256 `55d371d00f073198f2e523b7ac3fc5254961798025c85a7939669347391fd7f0`, 240 lines / 10,191 words / 88,407 bytes. `git diff --check` passes. Mechanical enumeration remains exactly 12 five-field gates; item counts `74/53/56/48/59/51/39/38/83/53/56/80`; 30-minute counts `31/9/0/0/0/0/0/0/0/0/17/18`; items 1–11 `610 / 166.75h`; A0 `12 / 3.50h`; item 12 `80 / 24.50h`; 40 unique stories; and races `15/21/18/11`.

The count-neutral G4R6-01 fix keeps Compose at H3.25–H3.50, then orders `fields.ts` H3.50–3.75, `evidence-policy.ts` H3.75–4.00, atomic `draft.ts` H4.00–4.50, packet registry H4.50–5.00, adapter H5.00–5.50, extraction H5.50–6.00, and fixtures through H6.50. U readiness therefore starts H4.75 only after Draft completes, projectors still complete H5.75, and the S WebMCP service still begins H6.00. The exit predicate now requires every recorded union through current G4R6.

The live candidate-lock sample at `2026-08-27T19:58:25.519Z` is 144.03 hours to feature freeze versus 129.50 hours complete-start demand, leaving 14.53 hours gross slack. Approval must resample again. No application code or external mutation occurred.

### Seventh exact-hash verdict — rejected

Product, engineering, and judge/rules each verified SHA-256 `55d371d00f073198f2e523b7ac3fc5254961798025c85a7939669347391fd7f0` before and after a complete byte-zero reread and made no edit. Product returned FAIL with P0 0 / P1 1 / P2 0; engineering returned FAIL with P0 0 / P1 2 / P2 0; judge/rules returned PASS with P0 0 / P1 0 / P2 0. A focused design-only remediation audit then reread the same unchanged hash and expanded the exact-path finding without changing the artifact. The deduplicated G4R7 union is:

| ID | Severity | Finding | Required disposition |
|---|---|---|---|
| G4R7-01 | P1 | Complete Start and its direct extraction producer both occupied H5.50–H6.00. | Publish a four-slot witness in which extraction completes before Start, with C0 and H12 unchanged. |
| G4R7-02 | P1 | The checklist had no mechanically exhaustive one-file/one-producer mapping for the locked File Structure; named examples included `layout.tsx`, `.nvmrc`, `.env.example`, `verify-receipt-semantics.mjs`, DB/service leaves, UI helpers, and concrete test directories. | Add a literal design-time producer ledger, bind its canonical implementation form to candidate hashes, assign every missing/ambiguous file, and prove producer-before-consumer order. |
| G4R7-03 | P1 | X28–X31 promised visible Allow/Revoke before H9.25 while `/api/application/actions` and its application/actions services were deferred until Wave 1, making the claimed three-API W0 surface non-executable. | Move the lawful human actions route and both services before C0; truthfully expose a four-API W0 subset; rebase the later surface gate and all dependencies. |

The post-verdict audit also required provider/configuration mutations to move behind A0 authorization, a cumulative Wave-1 producer gate for reviews/submissions/Receipt files, and explicit producers for test/accessibility/release obligations. No application code or external mutation occurred.

## Eighth Candidate

Frozen checklist SHA-256 `8be881fa3c100cb10ecdd56ce4b8de9f57484181e8c467a707e85b6a3deef125`, 319 lines / 11,877 words / 102,844 bytes, paired with design-time producer-ledger SHA-256 `54a05e127210c2151e68120e9f6becee00168972f0291e54e2d2e6c86f232e50`, 127 lines / 106 unique literal entries / 17,006 bytes. Both parse/check cleanly and `git diff --check` passes.

Mechanical enumeration proves exactly 12 five-field gates; consecutive item counts `75/53/56/48/59/51/39/38/83/53/56/80`; 30-minute counts `30/9/0/0/0/0/0/0/0/0/17/18`; items 1–11 `611 / 166.75h`; A0 `15 / 4.50h`; item 12 `80 / 24.50h`; 40 unique stories; and race modules `15/21/18/11`. The producer ledger has zero missing fields, duplicate paths, or duplicate creator IDs and covers all 87 concrete leaves obtained by expanding the locked File Structure, plus necessary manifests, tests, and release obligations.

The four H0–H6.50 lanes each total exactly 6.50 hours. A mechanical schedule check over every literal W0 producer/consumer pair returns zero producer-after-consumer edges. Contracts release H3.25; Draft H4.25; extraction and application service H5.00; actions service and complete Start H5.50; minimum WebMCP service H6.00; actions route H6.25; demo/WebMCP routes H6.50; and C0 H6.50–6.75. The truthful C0 subset is 2 pages / 4 APIs / 5 tables / 4 races / 6 tools. Wave 1 reuses vacated units for reviews/submissions repositories and submission/Receipt services, reaching the exact 3/6/5/4/6 path set at H13.50 without changing its aggregate or H30 closure.

Provider/project/configuration receipts now execute only inside the explicitly authorized 15-unit A0. The complete-start capacity demand is therefore `4.50 + 94 + 12 + 20 = 130.50h`. The candidate-lock sample at `2026-08-27T20:43:11.339Z` found 143.28 hours to feature freeze and 12.78 hours gross slack. Approval must resample again. No application code or external mutation occurred.

### Eighth paired exact-hash verdict — rejected

All three lanes verified checklist SHA-256 `8be881fa3c100cb10ecdd56ce4b8de9f57484181e8c467a707e85b6a3deef125` and producer-ledger SHA-256 `54a05e127210c2151e68120e9f6becee00168972f0291e54e2d2e6c86f232e50` before and after complete no-edit rereads. Judge/rules returned PASS with P0 0 / P1 0 / P2 0. Product returned FAIL with P0 0 / P1 1 / P2 1. Engineering returned FAIL with P0 0 / P1 4 / P2 1. The deduplicated G4R8 union is:

| ID | Severity | Finding | Required disposition |
|---|---|---|---|
| G4R8-01 | P1 | The supposed exhaustive ledger deferred race, test, evidence, and review paths to prose expansion and omitted promised kind/time/dependency/release/verification metadata plus the exact CI workflow. | Make the design ledger itself canonical and fully literal; add exact tracked rows and metadata before the next freeze; copy rather than invent it at 1.7. |
| G4R8-02 | P1 | W0/W1/W2 accessibility, integration, and E2E commands preceded or lacked manifested test-source producers. | Allocate exact stage-specific test files before separate run/report units; keep genuine-client traces distinct from test-only evidence. |
| G4R8-03 | P1 | Unit 4.4 combined parser-test authorship and production extractor hardening, violating one-output atomicity. | Keep table-driven test authorship in 4.3 and make 4.4 production hardening only; use exact later test modifiers. |
| G4R8-04 | P1 | Receipt projector units 4.24–4.26 had no legal file target. | Declare three exact export modifiers of `src/domain/receipt.ts` and order the verifier after all four Receipt units. |
| G4R8-05 | P2 | The H12 mini-gate text said nine units although the published lanes contain 12. | Correct both statements to `2 + 3 + 6 + 1 = 12`; preserve the existing feasible interval. |
| G4R8-06 | P2 | The controlling review header still named the seventh candidate. | Update controlling metadata on the next freeze while preserving all historical sections. |

The post-verdict three-lane remediation design additionally fixed exact release ownership: create `docs/verification/11-release-candidate.md` at 11.36 and finalize it at 11.52; keep README changes as exact modifiers; record private `devpost-submission.md` from A0.4 and the final manifest sidecar only in an excluded-operations ledger. Product required two additional Item-8 test-source units rather than bundling four independent layers; this adds 0.50 aggregate agent-hours inside previously idle M8 slots without moving H43/H48 or the 94-hour envelope. No application code or external mutation occurred.

## Ninth Candidate

Frozen checklist SHA-256 `2cd0f60e14539922dba22de132ca6b855a4406a96064a04cd6967669590914d0`, 322 lines / 13,669 words / 119,722 bytes, paired with design-time producer-ledger SHA-256 `e0c4d589096f2a7a81138711c5159e927353a9161c01b237a190b667a4bd5f77`, 11,766 lines / 21,264 words / 284,094 bytes. `git diff --check`, strict JSON parsing, and an independent duplicate-key scan pass.

Mechanical enumeration proves item counts `75/53/56/48/59/51/39/40/83/53/56/80`, 30-minute vector `30/9/0/0/0/0/0/0/0/0/17/18`, Items 1–11 `613 / 167.25h`, A0 `16 / 5.00h`, Item 12 `80 / 24.50h`, and 709 total checklist units. The literal ledger has 232 tracked and 8 excluded-private rows, 240 unique creator units, 175 unique modifiers, and 415 unique file units; every creator/modifier owner and duration matches the checklist. All 87 locked spec leaves, the 65 race cases plus seven manifest/runner/support rows, legal gates, exact W0/mini-gate occupancy, A0.16 handoff, README/packet/operations modifiers, and producer-before-consumer checks pass.

The G4R8 remediation makes the ledger itself fully literal and canonical; allocates every test source before its run; splits unit 4.4; assigns exact Receipt modifiers; corrects the 12-unit mini-gate; and updates controlling metadata. The deeper prefreeze audits additionally:

- model all repository-local private media, authorization, packet, manifest, and operations files literally while excluding only non-file, Git-internal, pre-existing plugin, connector, and automation state;
- make A0 an executable 16-unit identity/history/Submission-Period/reuse/name-risk/eligibility gate with no inferred answers or legal-clearance claim;
- define the complete `citeapply-devpost-v1` packet, canonical non-self-referential payload digests, reviewed release-slot-only finalization, core-only pre-submit writes, immediate exact confirmation, connector/manual/already-submitted branches, and strict live submitted-payload equality;
- keep tracked 12.55/12.56 records truthfully pre-submit, put actual outcome only in ignored private state, refresh public impact evidence at 12.49, and scan the exact final tree/history before deploy/tag/push; and
- bind same-worktree ignored-sidecar preservation, media privacy/causality, release immutability, Submission-Period/reuse evidence, and read-only post-submit monitoring without hiding repeated work or external latency.

An independent engineering child audit and the root mechanical validator both passed the frozen content/ledger structure with zero findings. A judge/rules preflight found no remaining P0/P1/P2 across value, criteria, demo, privacy, eligibility, release, submission, fallback, freeze, or monitoring. These are preflight results, not substitutes for the three required exact-pair full rereads now pending.

### Ninth paired exact-hash verdict — rejected

Product/UX/accessibility, engineering/security/testability, and WebMCP/judge/rules each hashed checklist `2cd0f60e14539922dba22de132ca6b855a4406a96064a04cd6967669590914d0` and ledger `e0c4d589096f2a7a81138711c5159e927353a9161c01b237a190b667a4bd5f77` before and after complete no-edit rereads. Product and judge/rules returned unconditional PASS with P0/P1/P2 `0/0/0`. Engineering returned FAIL with P0/P1/P2 `0/3/1`; the pair is rejected and neither earlier pass is reused for a replacement candidate.

| ID | Severity | Finding | Required disposition |
|---|---|---|---|
| G4R9-01 | P1 | A source-changing final R2 can reach rechecks/release while build, regression, integration/race, E2E, accessibility, security, and surface proof remain bound to R1; 12.49 refreshes impact/media/docs and 12.58 proves equality rather than execution. | Allocate honest R2-bound affected proof before 12.52–12.58; permit signed no-rerun only for an exact R1 pin; rebase Item-12 unit/minute/wall/contingency arithmetic. |
| G4R9-02 | P1 | Unit 1.50 and the ledger route `anchors.ts` into metadata-only `packet-registry.server.ts`, contradicting the locked parser whitelist; extractor 1.52 lacks that edge. | Keep 1.50 to code/path/class/hash/limits and move the 1.43 consumer/dependency edge to extractor 1.52, count- and schedule-neutrally. |
| G4R9-03 | P1 | Private operations modifier 12.74 may run after only 12.4/12.41/12.79, before the readiness/submit-result branch it records; the prose also says skipped units despite the global signed-disposition rule. | Make bypassed 12.70–12.73 emit signed inapplicable dispositions and make 12.74 join the completed readiness/submit-result branch explicitly. |
| G4R9-04 | P2 | Evidence creators 9.68 and 10.41 list backward release obligations 9.67 and 10.39 even though those units precede the files. | Replace them with the exact post-creation consumers/release obligations and revalidate the DAG. |

All other mechanical, product, accessibility, security, WebMCP, judge, eligibility, release, submission, monitoring, story, race, and capacity checks passed. At the engineering sample `2026-08-27T22:29:02Z`, 141.516 hours remained versus the then-current 131-hour RHS. No application code or external mutation occurred.

## Tenth Candidate

Frozen checklist SHA-256 `9a47b0064457f7933c42adf11e80f86a98b74c56b49f027cc8aec39f718a4c0e`, 325 lines / 14,208 words / 124,927 bytes, is paired with design-time producer-ledger SHA-256 `79fc29ea40b10f899db23de223c4c20b89e760a9505844302392a50529adc884`, 12,811 lines / 22,450 words / 303,785 bytes. `git diff --check`, strict JSON and duplicate-key parsing, and the root mechanical validator pass.

Mechanical enumeration proves 726 total checklist units: 16 A0 outputs / 5.00 active hours, 613 Items 1–11 outputs / 167.25 aggregate hours, and 97 Item-12 outputs / 30.75 aggregate hours. The ledger has 232 tracked plus 8 excluded-private rows, 240 creators plus 181 exact modifiers = 421 unique file units, 421/421 owner-duration matches, 87/87 locked File Structure leaves, 65 race cases plus seven infrastructure/runner rows, zero dependency cycles or backward same-lane edges, and fixed schedules peaking at four slots. All 24 final schedules use `FINAL_RELEASE` and end at tick 111, the end of the 27.75-hour release envelope.

The replacement closes the complete G4R9 union:

- G4R9-01: units 12.81–12.97 bind every source-changing R2 to a fresh non-local exact-candidate checkout, empty-cache install, twice-fresh migration, production build, full domain/parser/integration/all-four-race regression, production E2E/privacy/performance, automated plus named-manual accessibility, security/privacy/secret/log-console canaries, surface/dependency/audit/file-producer proof, and exact R2 README/packet/operations finalization. Only a byte-identical R1 commit-and-tree pin may use signed no-rerun dispositions; partial path-based skipping is forbidden.
- G4R9-02: 1.43 now supplies value-independent labelled grammar/character helpers to extractor 1.52, while metadata-only packet registry 1.50 owns only code/path/class/hash/byte/page/text limits and cannot contain anchors, claims, or fixture values.
- G4R9-03: 12.70–12.73 emit signed inapplicable dispositions on the already-submitted branch, 12.73 explicitly joins the readiness/submit-result branches, and private outcome unit 12.74 cannot run until those joins complete.
- G4R9-04: evidence creators 9.68 and 10.41 now bind only to their exact post-creation release obligations; both backward edges are removed.

An independent engineering author/auditor and a separate child ledger audit both passed the structure before freeze. Root then reproduced the hashes and all validator results without editing the pair. These are preflight results, not substitutes for the three fresh exact-pair verdicts.

At `2026-08-27T22:55:50.325Z`, 137.319 hours remained until the voluntary internal release-only start `2026-09-02T16:15:00Z` versus the 131.00-hour complete-start requirement, leaving 6.319 hours gross slack. The mandatory feature freeze remains `2026-09-02T20:00:00Z`; the early cutoff protects the 27.75-hour release envelope rather than weakening the final-24-hour rule.

### Tenth paired exact-hash verdict — rejected

Product/UX/accessibility, engineering/security/testability, and WebMCP/judge/rules each hashed checklist `9a47b0064457f7933c42adf11e80f86a98b74c56b49f027cc8aec39f718a4c0e` and ledger `79fc29ea40b10f899db23de223c4c20b89e760a9505844302392a50529adc884` before and after complete no-edit rereads. Product and engineering each returned FAIL with P0/P1/P2 `0/1/0`; judge/rules returned unconditional PASS with `0/0/0`. The pair is rejected and the judge pass will not be reused.

| ID | Severity | Finding | Required disposition |
|---|---|---|---|
| G4R10-01 | P1 | The ledger creates Draft-field, evidence-dialog, Review, confirmation, Conflict, and reconciliation UI producers, but no declared production page/controller modifier consumes them. Their first consumers are tests or same-file modifiers, so the claimed Supported and Conflict browser flows are unconstructible without undeclared source edits. | Add explicit Wave-1 and Wave-2 production-composition modifiers on the locked Application controller, bind each component/controller producer before route-level tests and shared merges, rebase counts/schedules/ledger, and obtain three fresh exact-pair reviews. |

Every other audited invariant passed: strict/canonical structure, 87 locked leaves, 65 + 7 race artifacts, acyclic four-slot scheduling, parser ownership, R2 candidate proof, normalized submission joins, release obligations, capacity, judge criteria, deadline, and the 27.75-hour release envelope. No application code or external mutation occurred.

## Eleventh Candidate

Frozen checklist SHA-256 `2fcd09b877b3f35c3f451758a8cd345d1232821a627c32b20a0fb837aade39da`, 325 lines / 14,693 words / 128,853 bytes, is paired with design-time producer-ledger SHA-256 `fe7dfb9a4f88621a139d9624e82d7904f3ce964693fd2dae0c862ed4e5421ace`, 12,872 lines / 22,549 words / 305,290 bytes. `git diff --check`, strict/canonical JSON and duplicate-key parsing, construction-agent audits, and the root combined validator pass.

Mechanical enumeration proves 728 total checklist units: 16 A0 outputs / 5.00 active hours, 615 Items 1–11 outputs / 168.25 aggregate hours, and unchanged 97 Item-12 outputs / 30.75 aggregate hours. The ledger has 232 tracked plus 8 excluded-private rows, 240 creators plus 183 exact modifiers = 423 unique file units, 423/423 owner-duration matches, 87/87 locked File Structure leaves, 65 race cases plus seven infrastructure/runner rows, zero dependency cycles or backward same-lane edges, no duplicate ordinals, and fixed schedules peaking at four slots. H30, H48, H94, and all 24 final schedules ending at tick 111 remain unchanged.

The replacement closes G4R10-01 with two explicit 30-minute controller modifiers and one count-neutral composition change:

- 5.60 production-composes the completed Draft field, evidence dialog, Review, confirmation, focus, and announcements into `src/ui/controllers/application.tsx`, which the existing `/application` page renders. The route-level 5.43 test, Wave-1 merge, E2E, evidence, candidate, and final affected-proof chain all depend on it.
- 6.9 now production-composes the completed Conflict component into that controller after 5.60 and 6.8 while preserving the human-declaration dispatch; its existing resolution, Review, recovery, and browser chain remains downstream.
- 8.41 production-composes the completed reconciliation controller into the Application controller after the human recovery and mutation/reconciliation producers. Human-boundary integration, assisted E2E, the mutations-ready report, Wave-2 merge, evidence, candidate, and final affected-proof chain all depend on it.

Wave 1 increases to 41.25 aggregate hours and Wave 2 to 33.00, but their protected lane margins retain H30 and H48 without exceeding four slots. The 94-hour H-clock, 131-hour capacity RHS, Item-12 proof/release arithmetic, parser fixes, R2 proof, branch joins, and final release envelope are unchanged.

At `2026-08-27T23:20:43.408Z`, 136.905 hours remained until the voluntary internal release-only start `2026-09-02T16:15:00Z` versus the 131.00-hour complete-start requirement, leaving 5.905 hours gross slack. The mandatory feature freeze remains `2026-09-02T20:00:00Z`; a fresh immediate pre-lock sample is still mandatory.

### Eleventh paired exact-hash verdict — unanimous content pass

Product/UX/accessibility, engineering/security/testability, and WebMCP/judge/rules each hashed checklist `2fcd09b877b3f35c3f451758a8cd345d1232821a627c32b20a0fb837aade39da` and ledger `fe7dfb9a4f88621a139d9624e82d7904f3ce964693fd2dae0c862ed4e5421ace` before and after complete no-edit rereads. All three returned unconditional PASS with P0/P1/P2 `0/0/0`; no earlier verdict was reused.

- Product verified that 5.60, 6.9, and 8.41 make every Supported, Conflict, and reconciliation producer reachable through the real `/application` route before route-level integration/E2E/accessibility/privacy/release proof, while all human-only actions remain outside the six-tool surface.
- Engineering reproduced the strict/canonical 728-unit and 423-file-unit graph, 728/728 acyclic reachability, unique ordinals, four-slot maximum, H12/H30/H48/H72/H94 closures, parser/race/security/accessibility/R2/branch/release invariants, and the producer-declared 12.41→12.97 edge.
- Judge/rules refreshed the live official sources with no delta, confirmed the open deadline, four equally weighted criteria, required deliverables/fields/eligibility, exact submit confirmation and success equality, causal WebMCP proof, manual fallback, and winner-quality narrative without unsupported claims.

The immediate pre-lock capacity sample at `2026-08-27T23:32:16.339Z` found 136.712 hours to the internal release-only start versus 131.00 required, leaving 5.712 hours gross slack. The inequality passes; the slack remains reserve, not feature budget.

### Status-only lock proof — passed

The only checklist content change after unanimous review was the exact status-line replacement. Locked checklist SHA-256 is `dddde1c29828301ccf05e708abaf8bd800f2804e8abd0fdf3dbabe0b0131b2ee`; the producer ledger remained `fe7dfb9a4f88621a139d9624e82d7904f3ce964693fd2dae0c862ed4e5421ace`. Product, engineering, and judge/rules each independently:

1. verified both locked disk hashes before and after;
2. confirmed exactly one locked status line;
3. restored only the prior candidate status line in memory;
4. reproduced passed candidate SHA-256 `2fcd09b877b3f35c3f451758a8cd345d1232821a627c32b20a0fb837aade39da`; and
5. made no file edit.

## Gate Decision

**PASS.** G4 is approved and locked at checklist SHA-256 `dddde1c29828301ccf05e708abaf8bd800f2804e8abd0fdf3dbabe0b0131b2ee` plus producer-ledger SHA-256 `fe7dfb9a4f88621a139d9624e82d7904f3ce964693fd2dae0c862ed4e5421ace`. The exact pair passed three unconditional content rereads, the immediate live capacity inequality, and three status-only hash proofs. Next is A0 authorization/eligibility/provider/identity; no application file, dependency, migration, fixture, or test may be implemented until A0.16 records `ready`.

## 2026-08-28 — Local-first directive reopened delivery sequencing

Amit clarified that CiteApply should be built and tested locally before any submission discussion. This disables provider, deployment, public-repository, Devpost, upload, outreach, monitoring, and submission actions now; it does not remove the fictional in-product confirmation, Submission row, immutable Receipt, or manual path.

Three independent read-only design audits—product/UX/accessibility, engineering/security/testability, and WebMCP/judge/rules—agreed that changing G4 alone would be invalid. Locked G1/G3 required selected-host/client proof inside the first 12 critical hours, while the old A0 required public/provider/identity authority before any code. Their consolidated design finding was P0 until a narrow cross-artifact timing/authorization amendment reconciled G1→G4L. Product behavior, caps, safety, accessibility, privacy, real-client truth, and final public acceptance remain unchanged.

The exact amendment candidate is:

- scope SHA-256 `c3c73bae20974c96a0351f5db790d91ca83b7f1bff9226bc417ff86a84cb0a5b`, 443 lines / 5,753 words / 42,428 bytes;
- PRD SHA-256 `54bb323ad37db6076e66a45fcd75b1664c94a22ffc648dff4756467fdcc62fed`, 1,038 lines / 14,833 words / 106,278 bytes; requirements unchanged, upstream metadata aligned;
- specification SHA-256 `70acddf91fe47ca322c0ad657e65ec53651f42107d77426fc495ebb79e5784bd`, 1,169 lines / 14,840 words / 122,134 bytes, still below the 15,000-word cap;
- checklist SHA-256 `692585cfee28e3d64b1586a4a3e4db9bdf4967d1f43b191aa052da8c62b06bdc`, 335 lines / 15,298 words / 133,620 bytes; and
- producer ledger SHA-256 `df4a27b4f53984aac17afcb46b8f12151a7f02a1be946b06cd1695677909a982`, 12,877 lines / 22,554 words / 305,414 bytes.

Root invalidated the preceding dispatched hashes before any verdict after finding stale G4/L0/A0 gate labels; engineering and judge independently identified the same Wave-0 remote/deployment/hosted labels. The corrected candidate above replaces those terms with A0L/A0P and exact loopback PostgreSQL 18.6, Node 24 local-production, local-equality, and local-production-output timing witnesses. All three lanes withheld verdicts and must restart from byte zero on these hashes.

The amendment preserves 728 total units by splitting the original 16-unit/5.00-hour A0 into A0L `2 / 0.50h` before H0 and A0P `14 / 4.50h` after local acceptance and before item 11. Items 1–11 remain 615 units / 168.25 aggregate hours; item 12 remains 97 / 30.75h. Ledger mechanics remain 232 tracked + 8 excluded-private rows, 240 creators + 183 modifiers = 423 unique file units, 65 + 7 race artifacts, sorted literal paths, and exact unchanged surface counts. Four root creators now depend on A0L.2; the private ledger is created by A0L.2 and finalized by A0P.14; the private packet/index proof move to A0P.2/A0P.3.

`G5B-L` requires the exact installed ChatGPT desktop built-in browser/account/model to empirically discover and invoke all six tools on the actual local route, perform a visible local-PostgreSQL mutation, and complete three unedited under-120-second raw Conflict chronologies. Chrome and harness evidence remain supplemental only. After A0P, `G5B-H` repeats selected-host parser/runtime/client proof as a blocking subgate inside item 11 before any hosted/release claim and before G9 closure. OpenAI's current [built-in browser documentation](https://help.openai.com/en/articles/20001277-using-the-built-in-browser-in-the-chatgpt-desktop-app) explicitly supports local development routes, while its [site-tools documentation](https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app) requires actual tool availability on the current page; localhost compatibility therefore remains an empirical gate, not a documentation claim. Chrome's [WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp) supplies only the supplemental local-testing lane.

At `2026-08-28T02:09:16Z`, 134.095 hours remained to the internal release-only start versus the historical unchanged 131.00-hour full public-path demand, leaving 3.095 hours before amendment/review overhead. That sample is not reused as a public-path pass. Local A0L+H0–H72 work remains separately viable; A0P must trigger a fresh public-capacity rebase. H30/H48 wave-close updates report deadline/capacity risk only and do not request approval or present A0P. Honoring Amit's instruction to discuss release only after the H72 local test may miss the existing public-decision deadline and make public release no-go while local work continues.

### Exact-candidate review state

The design audit shaped the candidate but does not approve these bytes. Fresh exact-hash product, engineering/security, and judge/rules full rereads, finding union/remediation, exact-candidate rechecks, and three status-only proofs across all four artifact status lines still block G4L. No dependency, container image, trust-store entry, application source, migration, fixture, test, private A0L file, provider project, public artifact, or Devpost mutation has been created.

### First exact-review union — rejected and remediated

Product, engineering, and judge/rules each verified the five hashes above before and after a complete no-edit reread. The candidate was invalidated during review and received no reusable pass. The deduplicated controlling union is seven P1 findings:

| ID | Finding | Exact disposition |
|---|---|---|
| G4L-R1-01 | H30/H48 release-decision language contradicted A0P only after Amit's H72 local test and explicit discussion. | H30/H48 reports progress/deadline/capacity risk only; it never requests approval or presents A0P. Missing the deadline makes only public release no-go. |
| G4L-R1-02 | G5B-H was called “before item 11/G9” although units 11.17–11.27 execute inside item 11/G9. | Define G5B-H as a blocking item-11 subgate after A0P, before hosted/release claims and G9 closure. |
| G4L-R1-03 | Current capacity/sequence controls still named historical G4 instead of active G4L. | Change every nonhistorical controlling label to G4L; retain explicitly historical G4 records. |
| G4L-R1-04 | Pre-A0P “non-local clone” could imply an unauthorized remote repository action. | Require an isolated clean local clone in a local Linux container/temp path from private local Git, with no remote fetch/push/repository/provider/public action. |
| G4L-R1-05 | Specification pinned stale supplemental Chrome `.174` while dated preflight found `.175`. | Capture the actual exact installed build at proof time; record `.175` only as dated preflight evidence, never a timeless pin. |
| G4L-R1-06 | An early paragraph said genuine-client always uses HTTPS while the local gate conditionally permits trustworthy localhost HTTP. | Limit unconditional HTTPS to hosted proof and mirror the exact empirical secure-context/Secure-cookie local exception. |
| G4L-R1-07 | Claim-bearing private packet modifier 11.32 did not mechanically descend from hosted G5B-H evidence. | Add dependency 11.31, yielding 11.32 → 11.31 → 11.30 → 11.28 → 11.20–11.27 without changing any unit count. |

The replacement exact candidate is:

- scope SHA-256 `180b2bacd9372a372dcb82836c342ab15fda07f789741a10f790fc591a4b894e`, 443 lines / 5,786 words / 42,688 bytes;
- PRD SHA-256 `a222925585fa5a59dcd2011c54b9346fb5a5499df1d02a718b1f45b57fafc94b`, 1,038 lines / 14,833 words / 106,278 bytes;
- specification SHA-256 `2a80039b8986a74ae23f000e61e9bd6df4f1f3de4e8c30b395961e4b4c19e111`, 1,169 lines / 14,901 words / 122,577 bytes, below the 15,000-word cap;
- checklist SHA-256 `47d6e8cacf2b2069708c1edd01dcd03845c4c38aa0d5c79f7587246895f721f1`, 335 lines / 15,424 words / 134,509 bytes; and
- producer ledger SHA-256 `800aa7148d06144fd2ae1c355aaebf10e284e8a26ac22bbd52cd326a0f640055`, 12,878 lines / 22,555 words / 305,435 bytes.

Fresh byte-zero product, engineering/security, and judge/rules rereads of this exact five-hash set are required. No prior finding-free portion or verdict is reused.

### Second exact-review union — rejected and remediated

Product returned an unconditional `0/0/0` pass on the preceding replacement, but engineering and judge independently found one remaining P1 capacity/no-go family. That product pass is rejected with the candidate and is not reused. The active scope/checklist/AGENTS controls still charged deferred public provisioning/authorization work to local G4L and made a missed public deadline or failed public inequality reopen local scope.

The replacement now defines two testable gates:

- local G4L/pre-A0L/local-wave capacity is `unfinished A0L + unfinished H0–H72 + genuinely unresolved local-only latency + 20h reserve` against the named `2026-09-02T16:15:00Z` local-candidate cutoff; complete-start demand is `0.50 + 72 + 0 + 20 = 92.50h`;
- only when A0P opens, public promotion evaluates every unfinished A0P active unit, H72–H94 envelope, external/user latency, and 20-hour reserve; item 12 retains its separate 27.75-hour envelope.

Failed local G4L/G5B-L/checkpoints reopen or stop local scope. A missed/non-ready A0P, missed public deadline, failed public inequality, or failed hosted G5B-H sets only `public_release_no_go`; it cannot block or invalidate items 1–10 or a truthful local candidate.

The new exact candidate is:

- scope SHA-256 `26b8b0fb1a68a2131a6d654198cb93f8c4bc32363e559a1d7a65747db642aa1a`, 445 lines / 5,956 words / 43,848 bytes;
- PRD SHA-256 `be037cbb876385174347624105a4ab96090ebba4257efd5856e167526a54dd37`, 1,038 lines / 14,833 words / 106,278 bytes;
- specification SHA-256 `dea4098fb031bae5df76b6888e086c1ef27b683f3bfbf0b81baa297f94646752`, 1,169 lines / 14,901 words / 122,577 bytes;
- checklist SHA-256 `18f886b89d7b467e028dbb294011d3f877d889962328bae9c56255f7725930e3`, 337 lines / 15,524 words / 135,154 bytes; and
- producer ledger SHA-256 `24c9499fe57830d5b09367389e0f4da5344f21bf048e68969954d39f2f10d335`, 12,878 lines / 22,555 words / 305,435 bytes.

All three lanes must perform a fresh full no-edit reread and exact-hash verification. No earlier verdict is reusable.

### Final exact-candidate review — passed

Product/UX/accessibility, engineering/security/testability, and WebMCP/judge/rules each performed a fresh byte-zero reread of the exact final candidate, verified all five hashes before and after, made no edit, and returned unconditional PASS with P0/P1/P2 `0/0/0`:

- scope `26b8b0fb1a68a2131a6d654198cb93f8c4bc32363e559a1d7a65747db642aa1a`;
- PRD `be037cbb876385174347624105a4ab96090ebba4257efd5856e167526a54dd37`;
- specification `dea4098fb031bae5df76b6888e086c1ef27b683f3bfbf0b81baa297f94646752`;
- checklist `18f886b89d7b467e028dbb294011d3f877d889962328bae9c56255f7725930e3`; and
- producer ledger `24c9499fe57830d5b09367389e0f4da5344f21bf048e68969954d39f2f10d335`.

The immediate pre-lock sample at `2026-08-28T03:20:45Z` found 132.904118 hours to the named local-candidate cutoff versus 92.50 hours complete-start local demand, leaving 40.404118 hours gross local slack. It passes G4L and makes no public-promotion claim.

### Four-artifact status-only lock proof — passed

Only line 3 changed in scope, PRD, specification, and checklist. Locked hashes are scope `4e6978083372b0043cdba26c2aaf51c1bfd5b37dce28d684c0d7c4dafa07f53c`, PRD `b6fd5e3c40c82086275962e1447185cae174fb601a1408c0ac56737e25ddc55d`, specification `236056cefb2b83bc7fea295848185ff4db9a4a583eafac2fda6480ef44657231`, and checklist `d7bef6a37eb58dd1a6f624a33c2ab28bd5df407a364774fa1a2ac02af70aff08`; the producer ledger remained `24c9499fe57830d5b09367389e0f4da5344f21bf048e68969954d39f2f10d335`.

Each independent lane verified those locked hashes before and after, restored only the exact prior candidate status line in memory for all four artifacts, reproduced all four passed candidate hashes above, and made no edit.

**G4L PASS.** The local-first G1/G2/G3/G4L amendment is approved and locked. A0L.1–A0L.2 are next; no application file, dependency, migration, fixture, or test may be created until A0L.2 records `local_ready`. A0P, item 11, item 12, and every provider/public/Devpost/upload/submission action remain deferred and unauthorized.

## A0L local-entry closure — 2026-08-28

The ignored A0L authorization ledger initially hashed to `4ab754696acf5fac0bb92a8509338b0e0c13430d671ff35f15e4aed1a7dca98a`. Product/UX/authority and WebMCP/judge/rules passed it `0/0/0`; engineering/security/testability returned P0/P1/P2 `0/0/1` because its six-decimal capacity values included a 517-millisecond sampling offset absent from the displayed timestamp. This was an auditability defect only; the 40-hour margin and decision were unaffected.

Root changed only `.capacity.sampledAtUtc` to `2026-08-28T03:26:00.517Z`. The final ignored ledger SHA-256 is `daae8e17b2ed9ac551f2c573a5a0b610d0b4015f93bf908f6e1433538a71ee1c`. All three lanes then performed fresh full exact-artifact rereads and returned unconditional P0/P1/P2 `0/0/0`. Each reproduced the final hash; each restored only the old timestamp in memory and reproduced the rejected hash. Engineering independently derived 132.816523 hours remaining and 40.316523 hours gross local slack, confirmed valid JSON with one `local_ready` decision, anchored Git ignores, zero private indexed files, locked artifact hashes, private identity digest without tracked raw address, matching local environment observations, and honest deferral of Node 24.20.0/PostgreSQL-image proof.

**A0L PASS.** Local Item-1 implementation is authorized. This verdict grants no A0P, provider, deployment, public-repository, upload, Devpost, or external-submission authority.
