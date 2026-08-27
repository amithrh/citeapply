# G3R Review — Bounded Replacement Technical Specification

Date: 2026-08-27
Gate: Replacement G3 — practical implementation specification
Artifact: `docs/hackathon-build/spec.md`
Status: Passed and locked after seven rejected candidates, unanimous eighth-candidate review, and three metadata proofs
Upstream scope: SHA-256 `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`
Upstream PRD at first review: SHA-256 `f9fb37f38aa9a1b3b62ebdc46d5673dd8609669f1392df8f87a49e20a2ade40f`

## Review Protocol

The replacement specification deliberately stays inside the approved witness: three pages, six API families, five PostgreSQL tables, four real-PostgreSQL race families, six statically registered tools, two fixed packets, and no application code before G3/G4 approval. Three independent lanes reviewed the same complete candidate:

1. product, UX, accessibility, and PRD fidelity;
2. engineering, security, concurrency, dependency, and testability; and
3. WebMCP correctness, genuine-client proof, Devpost rules, judge fit, and impact evidence.

Every lane independently verified candidate SHA-256:

`c544182ecfd3a54143a989b5cf4a9cd44ae6589724b637f508277c631e92ac09`

The candidate was 932 lines / 11,487 words / 90,409 bytes. It passed the mechanical caps and mapped all 40 PRD story identifiers, but all three lanes returned **FAIL**. G3 did not advance and application implementation remained prohibited.

## First-Pass P0 Finding

| ID | Finding | Required disposition |
|---|---|---|
| G3R-01 | Assisted Review preparation returned local `unsaved_changes` before any request, letting a delayed callback distinguish protected dirty email/conflict state after Revoke, takeover, or expiry. | Manual Review may keep its local gate. Assisted prepare must inject only a value-free dirty bit outside agent arguments and send the existing WebMCP request. The server applies public throttle then session → page → consent before it may return `unsaved_changes`; authority-loss combinations remain value-free. |

## First-Pass P1 Findings

| ID | Finding | Required disposition |
|---|---|---|
| G3R-02 | The generic error shape allowed privacy-invalid code/detail cross-pairs; `ReadinessBlocker` and public aliases were not closed; resolved Conflict fields could structurally carry a value/origin. | Replace the generic error bag with exact code-discriminated variants and per-route/tool subsets. Close every public enum/blocker shape and create a distinct masked human-resolved income variant. Negative cross-pair, output-size, and six-way indistinguishability tests are mandatory. |
| G3R-03 | The canonical mutation request digest was referenced but undefined. | Define exact versioned canonical intent variants per mutation family, included/excluded fields, normalization/ordering/encoding, and keyed stored digest. Add golden and changed-field/cross-family tests. |
| G3R-04 | Manual actions lacked ordinary evidence clearing and an exact action-by-stage matrix; prose could permit a direct edit to invalidate Review without visible Return. | Add bounded `clear_evidence`; lock Draft-only, Review-only, and Submitted-forbidden actions. Only `return_to_draft` may invalidate a Review and reopen editing. |
| G3R-05 | Manual email was restricted to the one agent fixture value. | Accept any bounded syntactically valid `.test` address from the applicant; keep assisted proposal exactly `anaya.rao@example.test`; test alternate/invalid values, declaration invalidation, and hashing. |
| G3R-06 | The saved assisted-activity summary could not render the PRD-required one batch event with affected field names. | Store one authoritative bounded ordered event union with closed codes and ordered `FieldId[]`; project it consistently into Draft, Review, and Receipt. Reads remain non-writing. |
| G3R-07 | Recovery actions were incomplete and the public redacted action advertised Allow even after Review made it impossible. | Close every route-specific recovery presentation. Resolve the one G2 safe-action inconsistency through a narrow reviewed PRD erratum before the spec recheck. Mutation-delivery ambiguity always reconciles; it never exposes a generic blind retry. |
| G3R-08 | The rate design allowed attacker-selected pre-authentication keys, unbounded row growth, and two Start mutex rows at a fixed-window rollover. | Use a finite global pre-auth keyspace, a timeless parser sentinel distinct from window counters, explicit independent transactions, retained-row/storage ceilings, pruning throughput greater than creation, and rollover/spray/backlog tests inside race family 1. |
| G3R-09 | No retained application/operation storage ceiling was defined. | Admission must fail safely at a documented synthetic-demo storage ceiling; proof must bound the full retained graph without adding a route, job, table, or deletion promise. |
| G3R-10 | The client lacked authoritative clock calibration and could leave values visible after server expiry or install a late authorized response. | Return `serverNow` from the same final database clock, derive one conservative monotonic browser deadline, never extend it, clear synchronously on deadline/foreground/BFCache, and reject late UI installation. |
| G3R-11 | The pinned dependency set was not proven/installable: `eslint-config-next@16.3.3` was not published, TypeScript 7 needs a special Next path, and direct type packages were omitted. | Pin published packages and a boring compatible TypeScript/tooling path; list all direct dev pins. Clean Node 24/Linux install, typecheck, lint, and production build must be an early blocking proof. |
| G3R-12 | Parser validation could compare extracted applicant answers with exact fixture constants and the mutation proof could pass by changing only an anchor. | Production parsing may enforce structure/types/cardinality/relationships but never exact applicant answers. One accepted test-only PDF must change a normalized value, plus a separate anchor mutation and altered-production-hash failure. |
| G3R-13 | The inactive guardian/household summary required by the PRD was absent. | Specify the collapsed **Not currently required** summary, two named statuses, keyboard/announcement behavior, projection, and E2E/a11y proof. |
| G3R-14 | Accessibility proof omitted meaningful titles and several named presentations; an agent-triggered refusal stole focus. | Add a presentation → title/heading/focus matrix covering every PRD state. Only applicant-triggered failed Review focuses the summary; agent-triggered updates announce without moving focus. |
| G3R-15 | The six-tool result contract omitted exact public aliases, blocker order/detail/privacy, and complete schema-output proofs. | Define every contract enum and blocker literal, total ordering, allowed messages/actions, privacy exclusions, descriptor snapshots, recursive unknown-key rejection, and 1,536-byte worst-case fixtures. |
| G3R-16 | The first-12-hour genuine-client no-go omitted the locked three consecutive unedited sub-120-second sequences. | Restore all three runs and their exact chronology to the 12-hour gate; any missing call, failed visible mutation, or over-120-second run stops implementation for scope/no-go review. |
| G3R-17 | Official release acceptance regressed below G1/G2 and rules. | Restore the free judging-period HTTPS app, complete public repository/setup/top-level approved OSI license, public narrated YouTube under 180 seconds, exact tested-client fields, truthful AI-use fields, dated project-history proof, submission deadline, and explicit authorization deadline/no-go. |
| G3R-18 | The required Potential-Impact proof artifact disappeared. | Restore `docs/verification/impact-evidence.md` with exact Supported/Conflict/manual outcomes, clarification states, observed synthetic sessions, separately labelled future-pilot measures, and literal **No user validation occurred** when true. |

## First-Pass P2 Findings

| ID | Finding | Required disposition |
|---|---|---|
| G3R-19 | Registration could race page bootstrap. | Register the six tools only after successful takeover and current page-capability installation. |
| G3R-20 | Landing rendering and `/api/demo GET` both appeared to own Start-token issuance. | Choose one no-store issuance path and define token replay behavior. |
| G3R-21 | Receipt bootstrap family wording was ambiguous. | State explicitly that Receipt uses `/api/application` challenge/takeover before `/api/receipt`. |
| G3R-22 | Current authority revision and immutable Review source revision were conflated. | Define both coordinates and submission/Receipt use so takeover never invalidates an unchanged current Review. |
| G3R-23 | Activity was split ambiguously between Draft JSON and operations. | Define one authoritative bounded projection; operation rows retain replay/audit-safe coordinates only. |
| G3R-24 | Full navigation was said to destroy the document despite BFCache. | Treat navigation as deactivation, then fail closed/revalidate on `pageshow`; never rely on destruction. |
| G3R-25 | Indexed digest lookup was called constant-time. | Limit constant-time claims to in-process secret comparison; database indexes compare only digests. |
| G3R-26 | Database pool/connection budgets were not pinned. | Pin pool, connect, idle, lifetime, queue, lock, statement, and hosted-connection budgets with load proof. |
| G3R-27 | The Chrome overview link was stale. | Use `https://developer.chrome.com/docs/ai/webmcp`. |

## Recheck Record

### Second complete candidate — rejected

All three lanes independently verified and fully reread SHA-256 `6f278091ce44e74f03a9ea44cac25b71a549927d24f5f0925737c3329b0ebcc4` (1,077 lines / 14,923 words / 118,154 bytes) against locked PRD SHA-256 `4b460ec0fe70dd92afbae3e13764cfda5e9b5851f458809a6609102b74dfb38f`. Mechanical caps passed: exactly three pages, six API families, five tables, four race families, six tools, and all 40 stories. The WebMCP/judge/rules lane passed with no finding. Product/accessibility and engineering/security independently returned **FAIL**, so G3 did not advance.

| ID | Severity | Independent finding | Required disposition |
|---|---|---|---|
| G3R2-01 | P1 | The 256-row rate ceiling lacked a shared lock; rollover transactions could both observe space and insert past it. | Add one timeless in-table rate-cap mutex, fixed mutex → prune/count → `all_api` → route order, projected-insert arithmetic, and a 255-row rollover barrier test. |
| G3R2-02 | P1 | The 112/128 operation reserve could strand manual completion after blocked attempts or Return and had no exact admission arithmetic/outcome. | Define category/state-aware admission that never records above-cap no-effect assisted refusals, preserves the complete remaining human closing path, refuses Return unless correction/redeclare/reprepare/submit remain possible, closes the non-mutating limit outcome, and exhaustively tests rows 111–128. |
| G3R2-03 | P1 | Sampling the browser dirty bit did not fence a later same-document edit before Review commit. | Add one synchronous same-document prepare/edit gate; edit-first becomes dirty, prepare-first freezes relevant controls through terminal response or authoritative reconciliation; test both orders, abort, response loss, and release. |
| G3R2-04 | P1 | Submission status had no closed result union, absent-operation semantics, original-page binding, or deterministic controller mapping. | Bind the original page coordinate inside the retained tuple; define current-authority-first, digest, absent/current/committed/other-submission outcomes and exact response-loss tests without pending state or resubmission. |
| G3R2-05 | P1 | Human HTTP success/error contracts were asserted closed but Start, stage snapshots, bootstrap/evidence/action, submission, Receipt, and per-mode failure subsets remained prose. | Add minimal mechanically closed human unions and recursive unknown/cross-stage privacy tests inside the existing route families. |
| G3R2-06 | P1 | The global parser sentinel scan contradicted the required production literal `anaya.rao@example.test`. | Scope AST/import/literal proof to the parser/extractor/evidence-policy graph; explicitly allow the public email contract elsewhere and prove parser code cannot import it. |
| G3R2-07 | P1 | The locked PRD required agent-triggered blocked preparation to move focus, while the safer spec correctly prohibited focus theft. | Reopen G2 only for a reviewed focus erratum: update/announce the summary but retain applicant focus for externally triggered preparation. Rebind G3 to the final erratum hash. |
| G3R2-08 | P1 | The exact accessibility matrix omitted Checking latest state, Connection unavailable, Checking receipt, Receipt unavailable, At capacity, and WebMCP unavailable. | Add exact or inherited title, heading, focus/announcement, and enabled-control contracts plus tests for each. |
| G3R2-09 | P2 | Same-revision activity used random UUID rather than time for its secondary order. | Order by committed revision, authoritative `created_at`, then request UUID. |
| G3R2-10 | P2 | Export failure copy omitted that the accepted submission remains accepted. | Put the assurance in the exact visible error copy while keeping retry export as the action. |
| G3R2-11 | P2 | `RedactedState.access:"consent_required"` could be requested while consent was already active. | Restrict redacted success to consent-Off; current consent returns protected state or a closed invalid mode outcome without exposing stage. |
| G3R2-12 | P2 | A mid-sequence registration rejection could leave a partial tool set because no startup rollback signal existed. | Use one shared registration-lifetime `AbortController`; abort only to roll back startup failure, keep it alive afterward, and never retry that document. |

The candidate remains rejected even though the original P0 and all first-pass judge/rules findings were fixed. Remediation must produce new complete PRD/spec hashes. All three lanes must reread and pass those exact bytes; a later status-only lock edit still requires independent metadata-hash proof that reproduces the passed content hash.

### Third complete candidate — rejected

All three lanes independently verified and fully reread SHA-256 `73a74cfe6b445dd45a99186a68769ad642042397b325dbd83b6ce0c8d6835279` (1,112 lines / 14,516 words / 116,292 bytes) against final PRD SHA-256 `1fc13ede1edec072f1776d35b88a4c688bfc5a6e33ddda9d554226b9fe37f0f9` and scope SHA-256 `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`. Each reviewer confirmed the hash before and after, made no edit, and passed `git diff --check` plus the exact 3-page / 6-API / 5-table / 4-race / 6-tool / 40-story mechanical witness. There was no P0. All three lanes returned **FAIL**, so G3 remains closed and implementation remains prohibited.

| ID | Severity | Independent finding | Required disposition |
|---|---|---|---|
| G3R3-01 | P1 | The blanket page-capability rule made the capability-establishing `bootstrap_challenge` impossible. | Make it the sole value-free authenticated-read exception while retaining session, Host, fetch metadata, throttle, and bounded-output checks; prove direct, cross-site, and expired-session cases. |
| G3R3-02 | P1 | WebMCP mutations returned only agent DTOs, so callbacks could neither install authoritative Draft/Review state nor prevent a delayed projection overwriting Revoke, Review, or takeover. | Add a closed browser-only HTTP envelope containing separately validated agent result and same-lock human snapshot; install through a page/revision/controller/deadline/dirty-generation reducer before returning only the agent member. Cap the full envelope and test every delay race. |
| G3R3-03 | P1 | Exact action replay became unrepresentable after stage or consent evolution. | Add a closed historical replay carrying bounded original non-value coordinates and the current authoritative snapshot. Reissue a capability only while that exact coordinate remains current; preserve enough refusal coordinates and test every cross-stage example. |
| G3R3-04 | P1 | Review could contain six fields and its duplicated content/diff/binding/excerpt/hash/Receipt projections were not relationally closed. | Require exactly eight ordered ready diffs and enumerate constructor/refinement equality, Supported/Conflict/email rules, accepted-Review identity, database equality, and negative cross-pair/property tests. |
| G3R3-05 | P1 | Submission checked current revision before invalidated/noncurrent Review, producing `stale_state` after Return instead of locked `review_invalidated`. | After value-free session/page and request-digest checks, classify the supplied same-application Review before generic version mismatch without reversing the Application → operation → Review lock order. |
| G3R3-06 | P1 | Page establishment omitted the exact Application/Receipt routing for a stage that belongs on the other route. | Define a full-document stage-to-route table, loop prevention, controller fencing, and direct-URL/refresh browser tests. |
| G3R3-07 | P1 | `__Host-citeapply_session` made `Secure` conditional, invalidating the cookie contract and local browser proof. | Set `Secure` unconditionally with `Path=/` and no `Domain`; prove browser acceptance on the chosen trustworthy loopback origin or use local HTTPS/stop for review—never weaken silently. |
| G3R3-08 | P1 | Reserve-phase no-op Revoke could produce `demo_change_limit`, which `RevokeFailure` could not represent. | Add that failure only for a fresh already-Off no-effect Revoke in reserve; current effective Revoke and replay remain guaranteed. Exhaustively test counts 104–128. |
| G3R3-09 | P1 | Focus-retention rows relied on native disabled controls that may drop focus. | Use focusable `aria-disabled`, `aria-busy`, and guarded pointer/keyboard activation wherever initiator focus is promised; reserve native disabled for controls without that promise. |
| G3R3-10 | P2 | Context-specific unknown/internal failures omitted the PRD-required safe support reference. | Add one bounded opaque reference unrelated to all product/authority/request identifiers to every unavailable variant and its allowlisted log/display path. |
| G3R3-11 | P2 | Application and Receipt lacked an understandable remaining-time display, and Return lacked its required visible invalidation notice. | Derive a nonauthoritative minute display from the conservative monotonic deadline without live-region spam; add the exact transient Return notice and tests. |
| G3R3-12 | P2 | Validation both forbade automatic retry and allowed reissuing after a dirty-generation race. | If captured versions remain current, overlay the local unsaved blocker; otherwise discard and enter ordinary bounded reconciliation, with no second tool request. |
| G3R3-13 | P2 | `ReceiptUnavailable` could claim acceptance before Submitted was established. | Permit it only after a validated Submitted snapshot or already-installed Submitted state; pre-establishment failures remain value-free Connection unavailable. |
| G3R3-14 | P2 | The anti-hardcoding scan claimed it could reject every encoded lookup, which is not a mechanically finite assertion. | Enumerate the forbidden literal/encoding/import set and rely on full-path value/anchor mutations, built-output scan, and source review for broader proof. |
| G3R3-15 | P2 | Product review additionally required the human projection not to leak through the external callback and the route envelope itself to have an explicit size limit. | Separate internal HTTP and public agent schemas mechanically, cap both, and test that every external callback result recursively rejects human snapshot keys. |

The third candidate remains rejected. The next candidate must dispose every G3R3 row in the normative contract, stay below 15,000 words, pass all mechanical checks, and receive three new full rereads of the exact same bytes before G3 can lock.

### Fourth complete candidate — under review

The consolidated candidate is SHA-256 `47c5379832890c561765e01388df56ea81cb284830768818c3d2920b7c8fa21e`, 1,158 lines / 14,567 words / 119,160 bytes. It is bound to final PRD `1fc13ede1edec072f1776d35b88a4c688bfc5a6e33ddda9d554226b9fe37f0f9` and scope `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`.

Local preflight passes `git diff --check`, 26 balanced code fences, exactly three page files, six API headings, five product-table headings, four PostgreSQL race rows, six unique descriptor tools, and 40 unique story mappings. The contract now contains the sole value-free bootstrap exception, private capped WebMCP mutation envelope and monotonic install reducer, closed historical human replay, exact eight-field Review/Receipt relations, invalidated-Review submission precedence, complete route matrix, always-Secure `__Host-` cookie proof, reserve no-op Revoke result, focusable busy controls, support-safe references, monotonic remaining-time/Return notice, deterministic dirty-generation handling, Submitted-gated Receipt unavailability, and a finite honest anti-hardcoding proof.

This record does not pre-approve those dispositions. Product/accessibility, engineering/security/testability, and WebMCP/judge/rules must each verify the hash before and after a complete independent reread and return an unconditional pass before G3 changes state.

### Fourth candidate verdict — rejected

All three lanes verified unchanged SHA-256 `47c5379832890c561765e01388df56ea81cb284830768818c3d2920b7c8fa21e` before/after a full reread. Mechanics remained clean. WebMCP/judge/rules passed unconditionally; product/accessibility and engineering/security failed. There was no P0. G3 did not advance.

| ID | Severity | Consolidated finding | Required disposition |
|---|---|---|---|
| G3R4-01 | P1 | A reused Start request ID with a fresh nonce could create a second application. | Make `start_request_id` unique; under the sentinel resolve nonce OR request ID and accept only exact nonce/request/digest equality. |
| G3R4-02 | P1 | Fresh human no-change outcomes had storage coordinates but no direct DTO. | Add action-refined no-change success variants with the exact Draft/assistance projection and capability rule; test fresh/replay/reserve boundaries. |
| G3R4-03 | P1 | `resolve_income` unavailable-claim refusal could not be stored/replayed. | Add its exact income-only refusal coordinate and action×failure replay tests. |
| G3R4-04 | P1 | Historical assisted-prepare replay could redisclose a closed Review reference after Return/re-Allow. | Redisclose `PrepareSuccess` only while its Review remains current and authority permits; otherwise return current `stale_state` plus private UI projection, never the old reference. |
| G3R4-05 | P1 | A new submit identity in Submitted had no closed non-Receipt outcome. | After exact replay, require Review stage for a new submit; Submitted returns value-free `stale_state` and no Receipt projection. |
| G3R4-06 | P1 | `pagehide` cleared capabilities that `pageshow` then tried to reuse. | BFCache restore must run challenge→takeover with callbacks dormant and consent cleared; old-capability snapshot checks apply only without pagehide. |
| G3R4-07 | P1 | Review refinement required origin from canonical content even though origin is intentionally excluded from the hash. | Bind value/evidence/declaration/resolution to canonical content and origin to the frozen ready Draft; prove equal manual/assisted hash with truthful differing origins. |
| G3R4-08 | P1 | Submitted/Receipt duplicated clocks were not explicitly cross-equal. | Require snapshot/record/database `submittedAt`, snapshot/delivery `serverNow`, and snapshot/delivery/application `expiresAt` equality with valid cross-pair negatives. |
| G3R4-09 | P1 | Initial challenge/takeover unavailable recovery pointed to a visible application that was not established, and challenge promised an absent access status. | Use value-free `ConnectionUnavailable` for establishment and remove the undefined status phrase. |
| G3R4-10 | P2 | Inactive/dormant registered callback invocation was not closed. | Add a synchronous lifecycle-generation guard returning the typed unavailable result without value/dirty read/fetch; late settlement cannot reactivate an old generation. |
| G3R4-11 | P2 | Expiry during unknown-submit recovery omitted the required honest uncertainty message. | Add exact controller-local unknown-before-expiry copy with no acceptance/failure/resubmit/recovery-token claim. |
| G3R4-12 | P2 | The lifecycle said only Reload remained even for expiry. | Reserve Reload for unresolved authority; expiry retains Start-new-demo and stale retains Reload-current-state. |

The judge pass cannot offset the other material failures. The fifth candidate must resolve the whole union and receive three new exact-byte full rereads.

### Fifth complete candidate — under review

The consolidated candidate is SHA-256 `a7ae079f23bf163a3179f29f1faff9bac6c52916ec4bbdedd6194a4f7599a335`, 1,164 lines / 14,537 words / 119,362 bytes. It is bound to final PRD `1fc13ede1edec072f1776d35b88a4c688bfc5a6e33ddda9d554226b9fe37f0f9` and scope `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`.

Local preflight passes `git diff --check`, 26 balanced code fences, exactly three page files, six API headings, five product-table headings, four PostgreSQL race rows, six unique descriptor tools, and 40 unique story mappings. The candidate normatively addresses all twelve G3R4 findings without changing the locked witness or beginning implementation.

This record does not pre-approve those dispositions. Product/accessibility, engineering/security/testability, and WebMCP/judge/rules must each verify the hash before and after a complete independent reread and return an unconditional pass before G3 changes state.

### Fifth candidate verdict — rejected

All three lanes verified unchanged SHA-256 `a7ae079f23bf163a3179f29f1faff9bac6c52916ec4bbdedd6194a4f7599a335` before/after complete rereads. Mechanics remained clean. WebMCP/judge/rules passed unconditionally; product/accessibility and engineering/security failed. There was no P0. G3 did not advance.

| ID | Severity | Consolidated finding | Required disposition |
|---|---|---|---|
| G3R5-01 | P1 | The new-ID Submitted fix checked Draft stage before classifying a Return-invalidated Review, regressing Return-first submission to `stale_state`. | Only Submitted short-circuits to non-Receipt `stale_state`; Draft/Review first classify the supplied Review so Return-first remains `review_invalidated`. |
| G3R5-02 | P1 | Dormant mutation callbacks guaranteed zero dispatch but could only return copy claiming an uncertain effect and reconciliation. | Add one bridge-only, value-free, zero-effect lifecycle result to all six tools; reserve Mutation unavailable for possible server acceptance. |
| G3R5-03 | P1 | Manual Review preparation projected `review_prepared` into the assisted-activity summary. | Keep its replay/capacity operation but emit/count an assisted preparation event only for the WebMCP prepare tool. |
| G3R5-04 | P2 | `resolve_income` referred to an undefined packet lock outside the closed lock model. | Re-resolve the claim from `parsed_packet` under the already-held Application row lock and add no coordination seam. |

The sixth remediation also replaces the ambiguous registration phrase “awaits zero” with the exact abort, all-settlements, `getTools()` zero-name verification, and no-retry behavior already intended by the prior rollback disposition. The sixth candidate must resolve this complete union and receive three new exact-byte full rereads.

### Sixth complete candidate — under review

The consolidated candidate is SHA-256 `c6faa55a7d45d6fe2fd39cf4be36b2439284c389dc4d7ddbf792aa6dc159e459`, 1,165 lines / 14,732 words / 121,092 bytes. It is bound to final PRD `1fc13ede1edec072f1776d35b88a4c688bfc5a6e33ddda9d554226b9fe37f0f9` and scope `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`.

Local preflight passes `git diff --check`, 26 balanced code fences, exactly three page files, six API headings, five product-table headings, four PostgreSQL race rows, six unique descriptor tools, and 40 unique story mappings. The candidate normatively addresses all four G3R5 findings plus the registration wording defect without changing the locked witness or beginning implementation.

This record does not pre-approve those dispositions. Product/accessibility, engineering/security/testability, and WebMCP/judge/rules must each verify the hash before and after a complete independent reread and return an unconditional pass before G3 changes state.

### Sixth candidate verdict — rejected

All three lanes verified unchanged SHA-256 `c6faa55a7d45d6fe2fd39cf4be36b2439284c389dc4d7ddbf792aa6dc159e459` before/after complete rereads. Mechanics remained clean. WebMCP/judge/rules passed unconditionally; product/accessibility and engineering/security failed. There was no P0. G3 did not advance.

| ID | Severity | Consolidated finding | Required disposition |
|---|---|---|---|
| G3R6-01 | P1 | Validation rewrote its server-authorized DTO with a later local dirty bit, allowing post-authority-loss editing state into the callback. | Return only captured server-authorized bytes; later dirty state stays human-UI-only, and changed generations/bases discard and reconcile. |
| G3R6-02 | P1 | Four grouped ready string fields made literal-field `Extract` resolve their required Review finals to `never`. | Split them into discriminated members and compile-check a complete eight-final tuple plus negative cross-pairs. |
| G3R6-03 | P2 | Protected application state omitted G1's locked safe-next-action projection. | Add exact `safeActions:["use_visible_application"]` and retain descriptor/result/size proofs. |
| G3R6-04 | P2 | Registration rollback implied but did not explicitly bind one AbortController signal to all six calls. | Create one controller, pass the identical signal to every registration, abort on any failure, await all settlements, and verify zero names. |

The seventh candidate must resolve the complete G3R6 union and receive three new exact-byte full rereads.

### Seventh complete candidate — under review

The consolidated candidate is SHA-256 `d5193ae74029e4634a333435e1c57e20f55ce4d4ab671bc849e8c79a016c453e`, 1,169 lines / 14,816 words / 121,809 bytes. It is bound to final PRD `1fc13ede1edec072f1776d35b88a4c688bfc5a6e33ddda9d554226b9fe37f0f9` and scope `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`.

Local preflight passes `git diff --check`, 26 balanced code fences, exactly three page files, six API headings, five product-table headings, four PostgreSQL race rows, six unique descriptor tools, and 40 unique story mappings. The candidate normatively addresses all four G3R6 findings without changing the locked witness or beginning implementation.

This record does not pre-approve those dispositions. Product/accessibility, engineering/security/testability, and WebMCP/judge/rules must each verify the hash before and after a complete independent reread and return an unconditional pass before G3 changes state.

### Seventh candidate verdict — rejected

All three lanes verified unchanged SHA-256 `d5193ae74029e4634a333435e1c57e20f55ce4d4ab671bc849e8c79a016c453e` before and after complete rereads. Mechanics remained clean. There was no P0. All three lanes rejected the undefined validation callback terminal; engineering additionally proved the pinned WebMCP declarations incompatible. G3 did not advance and no application code started.

| ID | Severity | Consolidated finding | Required disposition |
|---|---|---|---|
| G3R7-01 | P1 | Validation discarded a schema-valid server DTO on local drift without defining the callback terminal, then incorrectly allowed generic read rejection. | Reconcile only the human UI and resolve the callback byte-for-byte with the captured server-final-authorized result unless its native signal aborts; assert exact bytes across every named drift. |
| G3R7-02 | P1 | `webmcp-types@0.1.3` declares a one-argument callback, fails strict TypeScript 6.0.3 checking, and cannot represent the required execution/registration signals. | Pin reviewed `webmcp-types@0.1.5` and require a strict `skipLibCheck:false` fixture for `(input,{signal})` plus `registerTool(tool,{signal})`. |

The eighth candidate must resolve both G3R7 findings and receive three new exact-byte full rereads.

### Eighth complete candidate — under review

The consolidated candidate is SHA-256 `1c189ddca3b5184428855e2cec13ebe4b365bdfc305d5954f12ef6986c2aa2a2`, 1,169 lines / 14,826 words / 121,928 bytes. It is bound to final PRD `1fc13ede1edec072f1776d35b88a4c688bfc5a6e33ddda9d554226b9fe37f0f9` and scope `989a8ab2573512f60ae0609ea1fee9dc74b2a0823c432006ca77915e97b2f94f`.

Local preflight passes `git diff --check`, 26 balanced code fences, exactly three page files, six API headings, five product-table headings, four PostgreSQL race rows, six unique descriptor tools, and 40 unique story mappings. The candidate closes the validation callback terminal across every named local/authority drift and pins the strict-compile-compatible WebMCP declarations without changing the locked witness or beginning implementation.

This record does not pre-approve those dispositions. Product/accessibility, engineering/security/testability, and WebMCP/judge/rules must each verify the hash before and after a complete independent reread and return an unconditional pass before G3 changes state.

### Eighth candidate content verdict — passed

Product/accessibility, engineering/security/testability, and WebMCP/judge/rules each verified unchanged SHA-256 `1c189ddca3b5184428855e2cec13ebe4b365bdfc305d5954f12ef6986c2aa2a2` before and after a complete independent reread and returned an unconditional pass. Each reported P0 0 / P1 0 / P2 0, no edits, clean mechanics, and closure of G3R7-01/-02. Engineering additionally compiled all nine normative TypeScript fences and the actual `webmcp-types@0.1.5` declarations under strict TypeScript 6.0.3 with `noUncheckedIndexedAccess:true` and `skipLibCheck:false` at zero diagnostics.

The candidate content passes G3. A status-only lock edit now requires all three lanes to verify the final hash and reproduce this passed content hash by restoring only the candidate status line in memory before the gate may close.

### Final status-only lock — metadata proof passed

Changing only the first metadata line to `Status: Approved and locked at replacement G3; implementation remains prohibited until G4 passes` produced SHA-256 `9baf6bab2e779cd6b014dac982dde1a547802fd77c634074d0662b729c03830a`, 1,169 lines / 14,831 words / 121,951 bytes. Product/accessibility, engineering/security/testability, and WebMCP/judge/rules independently verified that final hash, restored only `Status: G3 eighth exact-hash candidate; implementation remains prohibited` in memory, reproduced passed content SHA-256 `1c189ddca3b5184428855e2cec13ebe4b365bdfc305d5954f12ef6986c2aa2a2`, and made no edit. Mechanics remained exact and `git diff --check` passed.

## Gate Decision

**Passed.** The bounded replacement specification is locked at SHA-256 `9baf6bab2e779cd6b014dac982dde1a547802fd77c634074d0662b729c03830a`. G4 checklist planning may begin. Application implementation remains prohibited until G4 independently passes its artifact, verification, and capacity gates.
