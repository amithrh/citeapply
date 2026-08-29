# CiteApply Replacement Technical Specification

Status: G3 consent-disclosure second-replacement locked; implementation paused pending A0 rebind

Date: 2026-08-27

G1 consent-disclosure second-replacement candidate input: SHA-256 `199196c77d5f8b0a9c6c58b6c8d0751e2a269d80df42f020479044fcc91a6f29`

G2 consent-disclosure second-replacement candidate input: SHA-256 `643b21aa5f12653a1c91022a9653d23bf76a40cbfa2cae7145b56f27ba36567a`

## Overview

CiteApply is a fictional aid portal: it runtime-parses either fixed three-PDF synthetic packet; supports the same evidence-backed form manually or through WebMCP; reserves declaration/conflict judgment for the applicant; freezes one Review; and accepts one confirmed canonical Receipt.

This modular-monolith specification implements all 40 locked stories within the replacement witness:

| Surface | Locked implementation |
|---|---:|
| User pages | exactly 3: Landing, Application, Receipt |
| API families | exactly 6 |
| PostgreSQL product tables | exactly 5 |
| Real-PostgreSQL race families | exactly 4 |
| WebMCP tools | exactly 6, registered once per Application document |
| Runtime inputs | exactly 2 packets / 6 committed one-page PDFs |
| Fields | exactly 8, with one dependency branch |

The imperative WebMCP bridge and visible UI share application services. Registration is discovery; the server enforces session/page/consent/version/evidence/Review/submission authority.

No production/legal/user/adoption/savings/ROI claim; no real data, upload/OCR/model/URL/third-party action; no account/dashboard/queue/cache/worker/cron/analytics/cancellation/approval/pending/recovery/PDF-receipt/cleanup surface. A fourth page, seventh API, sixth table, fifth race, seventh tool, persistent stage, arbitrary document, or second claimed client reopens G1/G2/capacity.

## Stack

| Layer | Locked choice | Reason and verification boundary |
|---|---|---|
| Runtime | Node.js `24.20.0` local/CI; production `24.x`, patch recorded | Current [LTS](https://nodejs.org/en/blog/release/v24.20.0); evidence records `process.version`. |
| Web | Next.js `15.5.24`, App Router/Node, strict TypeScript | Patched [Maintenance LTS](https://nextjs.org/blog); no Edge or TypeScript-7 path. |
| UI | React/React DOM `19.2.8`; semantic HTML; CSS tokens/modules | No UI/state/form/icon/font/script dependency. |
| Tooling | TypeScript `6.0.3`, ESLint `9.39.2`, `eslint-config-next` `15.5.23` | `strict`, `noUncheckedIndexedAccess`; separate lint/build compatibility spike. |
| Validation | Zod `4.4.3` | One closed schema source for inference, server checks, and descriptor JSON Schema. |
| Database | PostgreSQL 18; `postgres:18.6-alpine3.23`; `pg@8.23.0`, `@types/pg@8.23.1` | Parameterized SQL, migrations, `READ COMMITTED`, explicit locks; no ORM/fake substitute. |
| PDF | `pdfjs-dist@6.2.108` | Blocking Node/Linux/Next/host tracing spike; no precomputed fallback. |
| WebMCP types | `webmcp-types@0.1.5`, development-only | Reviewed DOM augmentation; strict `skipLibCheck:false` fixture asserts callback options and registration signal. |
| Platform types | `@types/node@24.13.3`, `@types/react@19.2.18`, `@types/react-dom@19.2.5` | All direct pins exact. |
| Browser | `@playwright/test@1.62.1`, `@axe-core/playwright@4.13.0` | E2E, a11y, races, loss, privacy, Receipt equality. |
| Other tests | Node runner; `fast-check@4.9.0` | Unit/property/contract/parser/integration/PostgreSQL races. |
| Fixture generation | `pdf-lib@1.17.1`, development-only | Reproducible PDFs; forbidden production import. |
| Package manager | npm `11.19.0`; locked `npm ci` | Exact direct pins/frozen transitives; no ranges. |

Production dependencies are only Next, React/DOM, `pg`, Zod, and PDF.js; development dependencies are exactly those named above. CiteApply calls no model; the external client invokes deterministic portal tools.

### Deployment model

The authorization-gated target is one Vercel Node-24 project and same-region Neon PostgreSQL 18 over pooled TLS, replaceable by any Node-24/PostgreSQL-18 host because domain code imports no provider SDK. Next tracing includes only `fixtures/packets/**/*.pdf` for Demo; build proof verifies all six hashes.

Local/CI run the same migrations on pinned PostgreSQL 18.6 and Linux Node 24.20.0. Provisioning, credentials, deployment, publication, and retention claims require Amit's A0P public-release authorization.

Required variables are `DATABASE_URL`, base64url 32-byte `CITEAPPLY_MASTER_KEY`, and `APP_ORIGIN`. HKDF-SHA-256 derives labelled start/session/page/consent/rate/operation keys. Preview/test separate origins, keys, and databases; no secret is `NEXT_PUBLIC_`.

`pg.Pool`: two connections/process; 2,000-ms acquire, 10,000-ms idle, 300-second lifetime, `allowExitOnIdle:true`. Transactions set 1,000-ms lock and 3,000-ms statement/idle-in-transaction timeouts; Start is measured below 2,000 ms. The pooled endpoint must budget 80 clients and hosted proof stay below 64; otherwise release fails. No unpooled deployment.

## Architecture

```text
External client
      │ native WebMCP discovery/callback
      ▼
Application document ── memory-only page + consent capabilities
      │ same-origin bounded fetch
      ▼
Six Next Route Handler families
      │ strict envelope → public throttle → final authority → domain
      ▼
Shared application services and pure domain reducers
      │ one explicit pg client per transaction
      ▼
PostgreSQL: applications → operations → reviews → submissions
      ▲
      └── rate_buckets is a separate public preflight/admission lock
```

The server is a modular monolith. Pure domain code knows nothing about React, HTTP, WebMCP, or PostgreSQL. Human actions and assisted mutations call the same reducer and readiness/review functions. Human and agent projections are separate constructors over the resulting aggregate. Browser UI never independently decides authoritative readiness, active requirements, canonical Review content, submission acceptance, or Receipt content.

The three page routes are value-free shells at first render:

- `/` renders only synthetic-demo copy and packet cards. After hydration its controller obtains one memory-only signed short-lived Start token from no-store `/api/demo GET`; the token never enters cached HTML or Web Storage.
- `/application` renders **Checking latest state** and performs a value-free bootstrap challenge followed by one idempotent takeover before receiving values.
- `/receipt` renders **Checking receipt**, bootstraps current page authority, establishes Submitted through application state, and only then requests the canonical Receipt.

Application Draft/Review are `/application` modes; evidence, consent, conflict, and confirmation are overlays. Full navigation reaches Receipt. `pagehide` synchronously advances lifecycle/install generations, dormants callbacks, and clears page/consent capabilities. A persisted `pageshow` checks deadline then performs fresh challenge→takeover before values/actions become live, clearing consent; it never tries the erased capability. Correctness never assumes document destruction/unregister.

| Shell | Stage established by takeover | Required controller action |
|---|---|---|
| Application | Draft / Review | render that Application snapshot |
| Application | Submitted | announce/focus accepted transition, then `location.replace("/receipt")`; never offer confirmation |
| Receipt | Submitted | call Receipt load and render its canonical record |
| Receipt | Draft / Review | clear Receipt controller state, then `location.replace("/application")`; claim no failure, acceptance, or resubmit |
| Either | unresolved / expired | remain value-free through bounded recovery / clear and show Session expired |

Before navigation the controller advances generation and deactivates callbacks/capabilities; destinations are unprefetched and a same-destination guard prevents loops. Direct URLs, refresh, response loss, delayed takeover, BFCache, and every matrix row have browser tests. Receipt never calls `/api/receipt` for Draft/Review.

## File Structure

```text
src/
  app/
    layout.tsx
    page.tsx
    application/page.tsx
    receipt/page.tsx
    api/
      demo/route.ts
      application/route.ts
      application/actions/route.ts
      webmcp/route.ts
      submission/route.ts
      receipt/route.ts
  contracts/
    common.ts
    outcomes.ts
    http.ts
    webmcp.ts
  domain/
    fields.ts
    evidence-policy.ts
    draft.ts
    readiness.ts
    canonicalize.ts
    review.ts
    receipt.ts
    agent-projectors.ts
  evidence/
    packet-registry.server.ts
    pdf-adapter.server.ts
    extract-claims.server.ts
    anchors.ts
  server/
    db/{pool,transactions,applications,operations,reviews,submissions,rate-buckets}.ts
    services/{demo,application,actions,webmcp,submission,receipt}.ts
    security/{keys,session,capabilities,origin,throttle,headers}.ts
    observability/safe-events.ts
  webmcp/
    bridge.ts
    descriptors.ts
    invoke.ts
  ui/
    controllers/{application,receipt,reconciliation}.tsx
    components/{landing,draft-field,evidence-dialog,consent,conflict,review,confirmation,receipt}.tsx
    focus.ts
    announcements.ts
    styles/
fixtures/
  packets/{supported,conflict}/*.pdf
db/migrations/
  0001_applications.sql
  0002_operations.sql
  0003_reviews.sql
  0004_submissions.sql
  0005_rate_buckets.sql
scripts/
  generate-fixtures.mjs
  verify-production-imports.mjs
  verify-receipt-semantics.mjs
tests/
  {unit,contract,parser,integration,races,e2e,accessibility,security}/
  goldens/
docs/verification/
  impact-evidence.md
compose.yaml
next.config.ts
playwright.config.ts
eslint.config.mjs
tsconfig.json
package.json
package-lock.json
.nvmrc
.env.example
```

`tests/goldens`, the fixture generator, and all test adapters are forbidden imports from `src`. `packet-registry.server.ts` contains only packet code, file path, document class, expected SHA-256, and byte/page/text limits. It contains no normalized claim, expected applicant value, field-to-claim assignment, or fallback answer.

## Fixed Domain And Evidence Model

### Identifiers and values

Closed field identifiers are `legal_name`, `student_id`, `institution`, `preferred_contact_email`, `dependency`, `guardian_name`, `household_size`, and `annual_household_income`. Canonical typed values are strings, boolean `true`, integer `4`, and integer paise-free INR amounts `480000` or `540000`; display formatting produces **INR 480,000** or **INR 540,000**.

The six PDFs are three distinct documents in each of `supported` and `conflict`: Synthetic Enrollment Record, Synthetic Household Statement, and Synthetic Income Statement. Enrollment yields legal name, student ID, and institution. Household yields dependency, guardian name, household size, and income. Income yields the second income claim. There are exactly eight claims per packet. The only differing value is Conflict's income-statement amount of `540000`; its household amount remains `480000`.

`ParsedPacketV1` stores three bounded normalized page strings and eight claims. Each claim has a fresh random 128-bit base64url handle, document code/title/class, production document hash, one-based page `1`, claim kind, typed normalized value, and exact `[start,end)` character anchor into the stored page string. Handles resolve only inside the same application and packet. Human excerpts are always `pageText.slice(start,end)` rendered as text. Agent evidence receives normalized metadata but never `pageText`, the slice, filesystem paths, or raw bytes.

### Draft aggregate

`DraftAggregateV1` stores only authoritative saved state:

- one entry per field with typed value, readiness status, stable evidence fingerprint(s), and latest origin `manual` or `assisted` where applicable;
- saved `.test` email plus a declaration record bound to that exact normalized email;
- Conflict resolution with the chosen stable evidence fingerprint and one of the three locked reason codes;
- per-field latest origin only; activity history is not duplicated in Draft JSON. The authoritative bounded activity projection is derived from safe mutation/refusal operation rows as defined below;
- no dirty local text, open dialog, confirmation, countdown, page capability, consent capability, or downloaded file.

Active fields are derived. The initial active set has six fields. Saving dependency `true` activates guardian name and household size and increments `requirements_version`. Confirmed human clearing removes dependency and both conditional answers atomically and increments it again. Inactive fields are excluded from readiness, agent projections, Review, submission, Receipt, and progress.

Supported income canonicalizes to the Synthetic Income Statement fingerprint plus the equal Synthetic Household Statement fingerprint as corroboration. Conflict has no value until a human atomically saves source plus reason. Assisted binding of either unequal claim returns `conflict_requires_human` with no revision change.

### Application content and canonical hash

`ApplicationContentV1` is the sole hash input. It contains schema version, the fixed-order active-field list, typed final values, stable evidence fingerprints and corroboration, the exact email declaration, and the exact Conflict resolution when present. An evidence fingerprint is SHA-256 over document hash, claim kind, page, anchor, and canonical typed value; it never contains the random handle.

Before hashing, strings are NFC-normalized, objects are recursively key-sorted, field and evidence arrays use their fixed domain order, integers remain base-10 JSON numbers, and the UTF-8 JSON bytes are hashed with SHA-256. Floats, `undefined`, locale formatting, timestamps, and unordered maps are impossible by schema.

The hash excludes application/requirements revisions, page epoch, review identity, preparation path, latest-origin attribution, consent/activity, display ordering outside the fixed schema, and timestamps. Therefore identical saved content has an equal hash across manual and assisted preparation. The hash appears only in human Review, Receipt, human JSON, and print; it is never returned by `/api/webmcp`.

### Canonical mutation intents

`CanonicalIntentV1` is a closed union, separate from `ApplicationContentV1`. Every member contains literal `schema:"citeapply-intent-v1"`, one family and discriminator, and only its semantic payload/preconditions:

| Family | Included canonical intent |
|---|---|
| Start | `demo/start`, packet code, signed nonce coordinate, and Start-token expiry |
| Page | `application/takeover`, expected page epoch and current application revision, and challenge coordinate |
| Human action | `actions/<exact action>`, expected page/application/requirements coordinates, field/claim/reason/confirmed/value payload exactly as applicable |
| WebMCP apply/prepare | `webmcp/<tool>`, expected application/requirements versions, canonical ordered changes, and injected local-dirty boolean for prepare |
| Submission | `submission/submit`, expected current page/application coordinates, immutable Review ID, Review source revision, and content hash |

The request UUID, cookie, raw Start token/signature, challenge bytes, session/page/consent capabilities, headers, timestamps not listed above, and transport key order are excluded. Strings are NFC-normalized; object keys are recursively sorted; omitted optional properties stay omitted; arrays use their specified semantic order; integers are safe base-10 JSON numbers; UTF-8 JSON is the sole preimage. The same helper and committed goldens cover every family.

PostgreSQL never stores an unkeyed low-entropy request hash. It stores `HMAC-SHA-256(operation-digest key, canonical intent bytes)`. After locating `(application_id, request_id)`, Node compares the stored and recomputed 32-byte MAC with `timingSafeEqual`. Goldens vary JSON key order, Unicode normalization, omission, family, discriminator, every semantic field, expected coordinate, Review identity/hash, and submit/takeover-fence relationship; same semantics match and any semantic change mismatches.

## PostgreSQL Data Model

There are exactly five product tables. JSONB is used only for the closed versioned aggregates defined above; migrations add byte-size checks using `octet_length(...::text)` and services validate again before write.

### `applications`

| Column group | Required content |
|---|---|
| Identity/start | `id uuid` PK; independently unique `start_nonce_hash bytea` and `start_request_id uuid`; `start_request_digest bytea` |
| Session | `session_digest bytea` unique; `created_at timestamptz`; `expires_at timestamptz`; expiry is exactly creation plus 60 minutes |
| Evidence | `packet_code text` check Supported/Conflict; `parsed_packet jsonb` capped at 32 KiB |
| Draft | `draft jsonb` capped at 24 KiB; `stage text` check Draft/Review/Submitted; `revision bigint >= 0`; `requirements_version bigint >= 1` |
| Page authority | `page_epoch bigint >= 0`; nullable `page_bootstrap_request_id uuid` and `page_bootstrap_request_digest bytea` identifying the current derived capability |
| Consent | nullable `consent_request_id uuid`; consent is current only for the current page epoch and Draft stage |
| Review link | nullable `current_review_id uuid`; set only for Review/Submitted and checked against `reviews` in service transactions |
| Audit-safe time | `updated_at timestamptz`; no applicant value is duplicated into scalar log/search columns |

Session credentials are deterministic HMAC capabilities over the signed Start nonce/request coordinates, but the database stores only their SHA-256 digest. Page and consent capabilities are deterministic HMACs over stored nonsecret coordinates, so an exact lost-response replay can reissue the same raw token while that coordinate remains current without storing a raw secret. A superseded bootstrap/Allow replay cannot retake authority.

### `operations`

Primary key is `(application_id, request_id)`. Each row stores action/tool, keyed intent digest, closed outcome, bounded coordinates (fields, versions, optional Review/page/observed-consent coordinate, or blocker pairs), and `created_at`. Human coordinates implement `StoredHumanActionOutcomeV1`; assisted apply retains fields/versions for replay, while assisted prepare retains Review identity only to classify closure and never redisclose it. No row stores bodies, snapshots, excerpts, applicant values, raw tokens, content hashes, or request MACs.

Consent changes, human edits, assisted apply, Review preparation/Return, and submit commit an operation row with their effect; protected reads do not. Page takeover alone stores its current request ID, keyed Page-intent digest, and epoch on Application. Under the Application lock, existing identity is checked before stage/capacity: matching digest reconstructs the stored bounded outcome without effect, mismatch is `request_reuse_mismatch`. It then projects current human state separately; this makes a bind replay in Review, Return replay after repreparation, and Revoke replay after a new Allow representable.

Ordinary admitted operations may create rows through 104. Rows 105–128 are a 24-row human-close reserve. After authority, existing replay, version, and pure-domain evaluation, simulate a candidate and set `nextCount = currentCount + 1`. For a non-Submitted projection, `manualCloseFloor` sums: one save per canonical evidence field not ready in the final eight-field path; email steps (`0` ready, `1` valid-saved/undeclared, else `2`); current Revoke (`0|1`); Draft preparation (`0|1`); submission (`1`); and `returnReserve`. That last term is `6` before the one promised Return is used (Return + dependency clear/rebind/guardian/household + repreparation), `4` immediately after Return while no content-changing Draft action follows it, and `0` after such an edit or after the cycle is re-prepared. The existing ordered operations derive this phase; no column is added. A Submitted projection has floor `0`. Maximum floor is 18.

At `currentCount >= 104`, admit an effective human or assisted Draft content mutation, current effective Revoke, ready preparation, Return, or submit only when `nextCount + manualCloseFloor <= 128`. Replay adds no row. Outside the reserve, stable no-op/domain refusals get replay rows without revision/activity; inside it, Allow, no-op (including a fresh already-Off Revoke), blocked preparation, domain refusal, or unsafe projection gets noncommitted `demo_change_limit`, no row, and requires a fresh identity. The current effective Revoke and exact replay never receive that refusal. The enumerated 104–128 model proves ready prepare/submit and the first promised Return never receive it; an additional Return does only if its projected correction plus reprepare/submit cannot fit. Effective apply, correction/redeclare, and replay remain possible. Numbers are never workflow state.

Operation rows are the sole activity source. The visible assisted subset is `assistance_allowed`, `assistance_revoked`, `answers_applied` with one to eight domain-ordered field IDs, `income_refused` with only income, and `assisted_review_prepared` only for successful `prepare_submission_review`; none contains values. Manual `prepare_review` retains its replay/capacity operation but never projects an assisted event. One batch/refusal creates one event; replay/reads create none. Snapshots derive totals and latest eight by committed revision, authoritative `created_at`, then request UUID. Review freezes that path-specific summary and Receipt copies it; Draft JSON never competes.

### `reviews`

Each row has random `id`, random unique ten-character human `short_id`, `application_id`, immutable source application and requirements revisions, `content_hash`, immutable `review_snapshot jsonb` capped at 48 KiB, `created_at`, and nullable `invalidated_at`. A partial unique index permits at most one non-invalidated Review per application. Snapshot bytes never change; Return sets only `invalidated_at` before Draft becomes editable. Review creation/Return each consume operation identities, so the 128-operation ceiling also bounds Review history.

### `submissions`

Each row has random `id`, unique `application_id`, unique `review_id`, random unique `receipt_id`, accepted application revision, immutable `receipt_record jsonb` capped at 48 KiB, and authoritative `submitted_at`. The Review snapshot, submission, Receipt record, operation coordinates, and Application transition to Submitted commit atomically. There is no pending, approved, confirmed, or intent row.

### `rate_buckets`

Primary key is `(family, bucket_key, window_start)`. Counter keys are only `demo_get`, `demo_start`, `application`, `actions`, `webmcp`, `submission`, `receipt`, and `all_api`; presented credentials never create keys. Each counter stores only fixed key/window/count/expiry, never client metadata. Migration `0005` inserts exactly one `rate_capacity_mutex` and one `start_parser_mutex` epoch sentinel and asserts both; schema tests fail if either is absent or duplicated.

Every public preflight is one independent transaction: lock `rate_capacity_mutex FOR UPDATE`; take one `clock_timestamp()`; prune at most three expired non-sentinels (strictly more than the maximum two inserts); derive required current-window keys (`demo_get` or `demo_start` alone, otherwise `all_api` then route); and count all retained physical rows plus missing required rows. If that projection exceeds 256, commit only pruning and return the value-free transport refusal. Otherwise lock existing required rows in that fixed order; if any limit is reached change none, else insert missing rows at zero and increment all atomically. `Retry-After` is at least one second and derives from the limiting window end, earliest future retained expiry, or one second while draining only expired backlog. The mutex linearizes rollover/count/insert; 255/256-row old/new-window barriers prove the ceiling and no deadlock. Only an admitted Start may next lock `start_parser_mutex`.

The Start sentinel also bounds product storage. Before a new parse, it deletes at most one oldest expired application graph, then refuses **At capacity** if 512 applications remain. All inserts use this sentinel, so rollover cannot race the ceiling. One application retains at most 128 operations, the implied bounded Review history, and one Submission. Cleanup is best effort in active PostgreSQL only; 60 minutes remains an access deadline, not a deletion promise, and provider backups/PITR/logs follow documented retention.

### Transaction and lock order

Application transactions use `READ COMMITTED`, one checked-out `pg` client, parameterized statements, `lock_timeout = 1000ms`, and `statement_timeout = 3000ms` except the Start parse transaction, whose parse/cleanup/insert total is proven below 2000ms in the portability spike. The global relational order is:

```text
timeless rate-cap mutex → bounded prune/count → all_api → route, committed preflight
optional timeless Start sentinel
application row FOR UPDATE
operation row / unique-key decision
current review row
submission row / unique-key decision
```

No code path locks these in reverse. Child foreign keys use `ON DELETE CASCADE`; expired-graph cleanup holds the Start sentinel, locks one application with `SKIP LOCKED`, and issues one parent delete after exclusive application ownership. It never explicitly acquires child locks in a competing order or runs inside a non-Start application transaction. After the relevant row locks and all nontrivial pure validation, one `SELECT clock_timestamp()` on the same client performs the final expiry decision immediately before result serialization or the conditional effect. `now()`, `CURRENT_TIMESTAMP`, transaction-start time, and process time never authorize a protected result or mutation.

## Request Security, Authority, And Limits

### Public envelope

Every API handler follows the same outer order before any application lookup:

1. Require the configured Host, HTTPS in production, allowed method, allowed content type, and body byte ceiling. State-changing requests require exact `Origin: APP_ORIGIN` and `Sec-Fetch-Site: same-origin`; authenticated reads require same Host, current page capability, and same-origin fetch metadata. The sole page-capability exception is value-free `/api/application` `bootstrap_challenge`, whose purpose is to establish that capability: it still requires the valid session cookie, configured Host, same-origin fetch metadata, throttle, strict body, and output cap. Proxy-forwarded host or client-IP headers are not authority. Direct, cross-site, missing/expired-session, and capability-on-every-other-read tests lock the exception.
2. Run the exact mutex-serialized fixed-key preflight above. It performs no application, authority, replay, or domain lookup and may return the same value-free `429` before any protected outcome.
3. Parse the strict closed outer JSON union. Syntax, unknown key, wrong discriminator, excessive array, and type failures return a bounded `invalid_request` without echoing input.
4. Only then resolve the session digest and enter the application transaction.

This order intentionally means a throttled expired, stale, unconsented, or exact-replay request receives the same transport refusal. After `Retry-After`, the page rereads authoritative state before computing a new state-changing action. Throttling never retries or mutates an application.

### Exact technical ceilings

| Boundary | Limit |
|---|---:|
| Start token lifetime | 15 minutes; one random 128-bit nonce |
| Session access | exactly 60 minutes from successful application insert; never renewed |
| `/api/demo` body | 1 KiB; GET 60/fixed minute; 6 POST Start admissions/fixed 10-minute global window |
| `/api/application` body/result | 4 KiB / 64 KiB; 120 admitted global calls per fixed minute |
| `/api/application/actions` body/result | 8 KiB / 64 KiB; 120 global calls per fixed minute |
| `/api/webmcp` body/internal HTTP result | 16 KiB / 64 KiB; 60 global calls per fixed minute; batch at most 8 distinct field entries |
| Agent-visible serialized WebMCP result | 1,536 UTF-8 bytes, enforced by contract tests and a final fail-closed guard |
| `/api/submission` body/result | 4 KiB / 64 KiB; 30 global calls per fixed minute |
| `/api/receipt` body/result | 1 KiB / 64 KiB; 60 global calls per fixed minute |
| All authenticated non-demo API families | 600 admitted calls per fixed minute |
| One committed PDF | 64 KiB, exactly 1 page, at most 4,096 normalized text characters |
| One packet | exactly 3 registered PDFs and exactly 8 extracted claims |
| Exact excerpt | at most 320 characters; longer or missing labelled anchor fails parsing |
| Request/review/receipt identifiers | UUID v4 except random ten-character Review short ID |
| Automatic reconciliation | at most 3 attempts ending within 10 seconds |

Numerical thresholds are technical abuse/output bounds, never displayed as application progress or a call/change/Review quota. A Start admission lock timeout or exhausted Start window uses Landing-only **At capacity** with a safe retry time. Other 429s use **Please wait before trying again** and clear local busy state. Output-size guard failure returns a generic safe unavailable result and records only a safe event code; it never truncates JSON into an invalid or misleading result.

### Session, page, and consent capabilities

The session cookie is always `__Host-citeapply_session; HttpOnly; Secure; SameSite=Strict; Path=/`, never has `Domain`, and keeps the original 60-minute expiry. It contains a derived credential, not an application ID; PostgreSQL indexes only its digest. Hosted production and hosted genuine-client proof use HTTPS. Local/CI may use exact potentially trustworthy `http://localhost:<port>` in a fresh isolated browser context that visits no other localhost port only when the unmodified client proves `isSecureContext` and unconditional Secure `__Host-` cookie acceptance; otherwise separately approved trusted loopback HTTPS is required. A server test parses attributes without retaining the value; Playwright proves `isSecureContext`, real-Start acceptance, absence from `document.cookie`, and authentication of the next bootstrap without injection. Rejection by the pinned browser requires that explicit local HTTPS approval or stops for review—never a renamed/weakened cookie. Constant-time claims cover only same-length in-process comparisons.

Application and Receipt shells perform this same-family two-call bootstrap:

1. `bootstrap_challenge` is an authenticated value-free read returning only current `pageEpoch`, `applicationRevision`, and a signed five-minute challenge. It returns no packet, stage, value, progress, Review, or Receipt. Receipt invokes it through `/api/application`.
2. `takeover` posts that challenge, expected epoch/revision, and a request UUID. Under the application lock it rechecks expiry and the signed coordinates, replaces the current Page replay coordinate, increments `page_epoch`, clears consent, and returns the current human snapshot plus a derived page capability.

Exact response-loss replay returns the same page capability only while that stored Page coordinate remains current. If another takeover has superseded it, replay returns `stale_page`; it never retakes authority. A deliberate Reload obtains a fresh challenge/request. A challenge mismatch refetches the challenge rather than forcing the old takeover.

The page capability stays in the controller closure and is sent in `X-CiteApply-Page`. New takeover broadcasts only `{type:"citeapply-page-taken"}`; older pages become read-only. Without prior `pagehide`, delayed/missing broadcast makes focus/visibility run authenticated snapshot, whose old capability gets `stale_page`. After `pagehide`, persisted `pageshow` instead uses challenge→takeover with callbacks dormant. The channel is only a hint; tests cover direct/back Application/Receipt restore, stale, expiry, and delayed callbacks.

Visible Allow is an idempotent `/api/application/actions` mutation. It requires current page, Draft, expected revisions, and the exact locked disclosure presentation. Before Allow, the accessible permitted-action catalog enumerates in canonical order: link policy-allowed sources; propose the synthetic `.test` email; and create a Review only from a ready Draft with no unsaved changes. It states that successful Review creation keeps that exact saved content and turns assisted access off; the separate prohibited-action catalog says the tools cannot Return from Review, confirm, or submit. Allow sets `consent_request_id`, records the operation, and returns a derived consent capability to browser memory. The WebMCP bridge adds it as `X-CiteApply-Consent`, outside agent-visible schemas. Revoke clears the coordinate under the same application lock. Takeover, successful Review preparation, Return, submission, and expiry also make consent invalid. Exact lost-response Allow replay can reissue the capability only if the same consent coordinate remains current; a later Revoke or Allow is never undone by replay.

### Final protected precedence

For an admitted, well-formed protected request, the transaction locks the application and applies:

```text
session missing or final clock expired  → session_expired
page capability/epoch not current       → stale_page
consent capability not current          → consent_required
request identity/digest or versions     → request_reuse_mismatch / stale_state
pure domain then close-reserve admission → evidence_unavailable / conflict_requires_human / not_ready_for_review / demo_change_limit
```

Session validity is checked before page detail, page before consent, and consent before replay/version/domain detail. The app row remains locked through bounded projection or the complete mutation plus its agent/human projections. Thus a protected read/apply/prepare whose final authorization wins may return its bounded result or whole effect even if Revoke, Review close, takeover, or expiry becomes visible before delivery. If authority loss holds the row first, the request returns the higher-precedence value-free refusal and no effect.

Human-only submit, receipt, and export omit consent from their checks but retain expiry then page then request/review/domain order. No request beginning after expiry is authorized. A final-authorization-first operation may commit or deliver after the clock boundary; the UI does not reopen controls or a session.

Every authorized human snapshot/takeover/Receipt result includes final-database-clock `serverNow` and immutable `expiresAt`. The browser sets the deadline to the earlier prior value or `requestStartPerformance + max(0, expiresAt-serverNow)`; wall time never authorizes/extends. Application/Receipt show **About N minutes remain in this synthetic session**, `N=ceil(remainingMonotonicMs/60000)`, then **Less than 1 minute remains in this synthetic session**. Non-live text updates at minute boundaries/foreground; only ten-minute warning/expiry announce. Deadline clears values and blocks late install; focus/visibility/pageshow first synchronously test it, clearing only when reached. Persisted BFCache then performs fresh takeover.

## Shared Contracts And Outcomes

All route bodies and results are closed discriminated unions. Expected domain refusals resolve as typed JSON, including inside WebMCP callbacks; only registration failure, an unclassified programming fault, or browser serialization failure rejects generically. No error echoes a body, value, excerpt, token, SQL text, stack, path, or raw exception.

```ts
type Versions = {
  applicationRevision: number;
  requirementsVersion: number;
};

type FieldId =
  | "legal_name"
  | "student_id"
  | "institution"
  | "preferred_contact_email"
  | "dependency"
  | "guardian_name"
  | "household_size"
  | "annual_household_income";

type EvidenceField = Exclude<FieldId, "preferred_contact_email">;
type OrdinaryClearField = Exclude<EvidenceField, "dependency">;
type DocumentClass =
  | "synthetic_enrollment_record"
  | "synthetic_household_statement"
  | "synthetic_income_statement";
type ClaimKind = EvidenceField;

type RecoveryAction =
  | "use_visible_application"
  | "reload_current_application"
  | "reread_state_and_requirements"
  | "resolve_in_visible_application"
  | "start_new_synthetic_demo"
  | "try_again_after_delay"
  | "return_to_packet_selection"
  | "load_receipt_again"
  | "retry_export"
  | "reconcile_current_state";

type DomainReadinessBlocker =
  | {
      code: "missing_evidence";
      field: EvidenceField;
      message: "Required evidence is not linked.";
      action: "reread_state_and_requirements";
    }
  | {
      code: "conflict_requires_human";
      field: "annual_household_income";
      message: "Income sources disagree. Resolve this in CiteApply.";
      action: "resolve_in_visible_application";
    }
  | {
      code: "invalid_email";
      field: "preferred_contact_email";
      message: "Save a valid synthetic .test email in CiteApply.";
      action: "use_visible_application";
    }
  | {
      code: "declaration_required";
      field: "preferred_contact_email";
      message: "Declare the saved synthetic email in CiteApply.";
      action: "use_visible_application";
    };

type AgentReadinessBlocker =
  | DomainReadinessBlocker
  | {
      code: "unsaved_changes";
      message: "Save or discard visible changes before Review.";
      action: "use_visible_application";
    };

type HumanReadinessBlocker =
  | DomainReadinessBlocker
  | {
      code: "unsaved_changes";
      field: "preferred_contact_email" | "annual_household_income";
      message: "Save or discard this visible change before Review.";
      action: "use_visible_application";
    };

type Success<T> = { ok: true; data: T };
type SupportReference = string; // exactly /^CA-[0-9A-HJKMNP-TV-Z]{8}$/
type SharedFailure =
  | { ok: false; error: { code: "session_expired"; message: "This synthetic session has expired."; safeActions: ["start_new_synthetic_demo"] } }
  | { ok: false; error: { code: "stale_page"; message: "This page is no longer current."; safeActions: ["reload_current_application"] } }
  | { ok: false; error: { code: "consent_required"; message: "Use the visible CiteApply application to continue."; safeActions: ["use_visible_application"] } }
  | { ok: false; error: { code: "stale_state"; message: "The saved application changed."; safeActions: ["reread_state_and_requirements"]; currentVersions: Versions } }
  | { ok: false; error: { code: "request_reuse_mismatch"; message: "That request identity was already used differently."; safeActions: ["reread_state_and_requirements"] } }
  | { ok: false; error: { code: "evidence_unavailable"; message: "That evidence is not currently available for this field."; safeActions: ["reread_state_and_requirements"] } }
  | { ok: false; error: { code: "conflict_requires_human"; message: "Income sources disagree. Resolve this in CiteApply."; safeActions: ["resolve_in_visible_application"] } }
  | { ok: false; error: { code: "not_ready_for_review"; message: "The application is not ready for Review."; safeActions: ["use_visible_application"]; blockers: AgentReadinessBlocker[] } }
  | { ok: false; error: { code: "review_invalidated"; message: "That Review is no longer current."; safeActions: ["reread_state_and_requirements"] } }
  | { ok: false; error: { code: "demo_change_limit"; message: "That change was not saved. Continue the remaining application steps or start a new synthetic demo."; safeActions: ["use_visible_application", "start_new_synthetic_demo"] } }
  | { ok: false; error: { code: "invalid_request"; message: "The request is not valid."; safeActions: ["use_visible_application"] } }
  | { ok: false; error: { code: "rate_limited"; message: "Please wait before trying again."; safeActions: ["try_again_after_delay"]; retryAfterSeconds: number } };

type StartFailure =
  | { ok: false; error: { code: "at_capacity"; message: "At capacity."; safeActions: ["try_again_after_delay"]; retryAfterSeconds: number } }
  | { ok: false; error: { code: "document_unavailable"; message: "A synthetic document could not be accepted."; document: "enrollment" | "household" | "income"; safeActions: ["return_to_packet_selection"] } }
  | { ok: false; error: { code: "invalid_request"; message: "This synthetic application could not be started from that request."; safeActions: ["return_to_packet_selection"] } }
  | { ok: false; error: { code: "request_reuse_mismatch"; message: "This synthetic application could not be started from that request."; safeActions: ["return_to_packet_selection"] } }
  | { ok: false; error: { code: "temporarily_unavailable"; message: "CiteApply could not start this synthetic application."; supportReference: SupportReference; safeActions: ["return_to_packet_selection"] } };
type MutationUnavailable = { ok: false; error: { code: "temporarily_unavailable"; message: "CiteApply could not confirm this action. Checking the latest application."; supportReference: SupportReference; safeActions: ["reconcile_current_state"] } };
type ReadUnavailable = { ok: false; error: { code: "temporarily_unavailable"; message: "CiteApply is temporarily unavailable."; supportReference: SupportReference; safeActions: ["use_visible_application"] } };
type BridgeInactiveFailure = { ok: false; error: { code: "assistance_unavailable"; message: "Assisted access is not active on this page."; safeActions: ["use_visible_application"] } };
type ConnectionUnavailable = { ok: false; error: { code: "temporarily_unavailable"; message: "CiteApply could not establish the latest state."; supportReference: SupportReference; safeActions: ["reload_current_application"] } };
type DemoTokenUnavailable = { ok: false; error: { code: "temporarily_unavailable"; message: "CiteApply could not prepare a synthetic start."; supportReference: SupportReference; safeActions: ["return_to_packet_selection"] } };
type ReceiptUnavailable = { ok: false; error: { code: "temporarily_unavailable"; message: "Your submission remains accepted, but the receipt could not be loaded."; supportReference: SupportReference; safeActions: ["load_receipt_again"] } };
type ExportUnavailable = { ok: false; error: { code: "temporarily_unavailable"; message: "Your submission remains accepted, but the receipt export could not be prepared."; supportReference: SupportReference; safeActions: ["retry_export"] } };
type HumanNotReadyFailure = { ok: false; error: { code: "not_ready_for_review"; message: "The application is not ready for Review."; safeActions: ["use_visible_application"]; blockers: DomainReadinessBlocker[] } };
type SharedOnly<C extends SharedFailure["error"]["code"]> = Extract<SharedFailure, { error: { code: C } }>;
```

There is no generic `Result<T>` bag. Demo GET and POST select `DemoGetFailure` and `StartFailure`; every other schema selects only its named aliases. The Start document code maps to one fixed public title. Unknown keys and code/detail cross-pairs fail. Authority failures cannot carry versions, blockers, retries, or field detail; only stale state carries versions, readiness blockers, and throttle/capacity delay. Each server/dependency `temporarily_unavailable` constructor creates a fresh support reference from random bytes; it is unrelated to application, session, page, consent, request, Review, Receipt, or packet identity, appears as secondary copy, and is the only request-correlating value admitted to the matching safe log event. Deterministic browser-only `assistance_unavailable` represents no fault or request and carries no reference.

Blockers are total-ordered: missing evidence in active field order, income conflict, invalid email, email declaration, then local unsaved changes in visible field order. Only one blocker per field is emitted. The canonical pre-human Conflict list is income conflict then email declaration. Agent `unsaved_changes` has no field because the injected dirty bit contains none; the manual controller constructs the field-specific human variant locally. Stale version is never a field status or blocker. Recursive negative contract tests reject every forbidden cross-pair and unknown key.

HTTP status is an additional transport signal: `400` invalid envelope, `403` current authority refusal, `409` replay/version/domain conflict, `429` throttle, and `503` bounded dependency/unavailable failure. The JSON code and visible copy, not the status alone, drive recovery.

### Closed human HTTP projections

```ts
type AuthorityMetaV1 = {
  pageEpoch: number; projectionSequence: number; versions: Versions;
  expiresAt: string; serverNow: string; // strict RFC 3339 instants
};
type HumanBindingV1 = { claimHandle: string; document: "enrollment" | "household" | "income"; page: 1 };
type HumanFieldV1 =
  | { field: "guardian_name" | "household_size"; active: false; status: "not_required" }
  | { field: EvidenceField; active: true; status: "missing" }
  | ({ active: true; status: "ready"; origin: "manual" | "assisted"; bindings: [HumanBindingV1] } & (
      | { field: "legal_name"; value: string }
      | { field: "student_id"; value: string }
      | { field: "institution"; value: string }
      | { field: "guardian_name"; value: string }
      | { field: "dependency"; value: true }
      | { field: "household_size"; value: number }))
  | { field: "annual_household_income"; active: true; status: "conflict"; claims: [string, string] }
  | { field: "annual_household_income"; active: true; status: "ready"; value: number; origin: "manual" | "assisted"; resolution: "source_supported"; bindings: [HumanBindingV1, HumanBindingV1] }
  | { field: "annual_household_income"; active: true; status: "ready"; value: number; origin: "manual"; resolution: { chosen: HumanBindingV1; reason: "more_recent" | "corrected_record" | "confirmed_for_application" } }
  | { field: "preferred_contact_email"; active: true; status: "missing" }
  | { field: "preferred_contact_email"; active: true; status: "needs_declaration"; value: string; origin: "manual" | "assisted" }
  | { field: "preferred_contact_email"; active: true; status: "ready"; value: string; origin: "manual" | "assisted"; declaredByApplicant: true };
type HumanActivityV1 =
  | { kind: "assistance_allowed" | "assistance_revoked" | "assisted_review_prepared"; at: string; revision: number }
  | { kind: "answers_applied"; at: string; revision: number; fields: FieldId[] }
  | { kind: "income_refused"; at: string; revision: number; field: "annual_household_income" };
type HumanEvidenceExcerptBaseV1 = { claimHandle: string; title: string; page: 1; excerpt: string };
type HumanEvidenceExcerptV1 =
  | (HumanEvidenceExcerptBaseV1 & { kind: "legal_name" | "student_id" | "institution" | "guardian_name"; normalizedValue: string })
  | (HumanEvidenceExcerptBaseV1 & { kind: "dependency"; normalizedValue: true })
  | (HumanEvidenceExcerptBaseV1 & { kind: "household_size" | "annual_household_income"; normalizedValue: number });
type HumanDraftV1 = {
  packet: "supported" | "conflict"; assistance: "off" | "allowed";
  progress: { ready: number; total: 6 | 8 }; blockers: DomainReadinessBlocker[];
  fields: HumanFieldV1[]; documents: AgentDocument[]; claims: EvidenceClaim[];
  activity: { totals: { allowed: number; revoked: number; acceptedBatches: number; refusals: number; assistedReviewsPrepared: number }; latest: HumanActivityV1[] };
};
type HumanReadyFieldV1 = Extract<HumanFieldV1, { active: true; status: "ready" }>;
type HumanReviewWarningV1 = { code: "conflicting_income_resolved"; message: "Income evidence differed and was resolved by the applicant." };
type HumanReviewDiffV1<F extends FieldId> = {
  field: F; initial: null; final: Extract<HumanReadyFieldV1, { field: F }>;
  excerpts: HumanEvidenceExcerptV1[];
};
type HumanReviewDiffsV1 = [
  HumanReviewDiffV1<"legal_name">, HumanReviewDiffV1<"student_id">,
  HumanReviewDiffV1<"institution">, HumanReviewDiffV1<"preferred_contact_email">,
  HumanReviewDiffV1<"dependency">, HumanReviewDiffV1<"guardian_name">,
  HumanReviewDiffV1<"household_size">, HumanReviewDiffV1<"annual_household_income">
];
type HumanReviewV1 = {
  reviewId: string; shortId: string; sourceVersions: Versions; contentHash: string;
  content: ApplicationContentV1; diffs: HumanReviewDiffsV1;
  warnings: [] | [HumanReviewWarningV1]; activity: HumanDraftV1["activity"];
};
type ReceiptRecordV1 = {
  schema: "citeapply-receipt-v1"; receiptId: string; submittedAt: string;
  acceptedApplicationRevision: number; acceptedReview: HumanReviewV1;
};
type DraftSnapshotV1 = AuthorityMetaV1 & { stage: "draft"; view: HumanDraftV1 };
type DraftOffSnapshotV1 = AuthorityMetaV1 & { stage: "draft"; view: HumanDraftV1 & { assistance: "off" } };
type DraftAllowedSnapshotV1 = AuthorityMetaV1 & { stage: "draft"; view: HumanDraftV1 & { assistance: "allowed" } };
type ReviewSnapshotV1 = AuthorityMetaV1 & { stage: "review"; review: HumanReviewV1 };
type SubmittedSnapshotV1 = AuthorityMetaV1 & { stage: "submitted"; submittedAt: string; receiptState: "load_required" };
type HumanSnapshotV1 = DraftSnapshotV1 | ReviewSnapshotV1 | SubmittedSnapshotV1;
type TakeoverSnapshotV1 = DraftOffSnapshotV1 | ReviewSnapshotV1 | SubmittedSnapshotV1;
type ReceiptDeliveryV1 = { receipt: ReceiptRecordV1; expiresAt: string; serverNow: string };
```

Draft arrays are bounded to eight fields/claims, three documents, and eight latest events. Review exists only with dependency `true` and exactly the ordered eight ready diffs. Refinements require outer/final field equality; final value/bindings/declaration/resolution equal canonical content; `final.origin` equals the frozen ready-Draft attribution but stays outside content/hash; each binding matches excerpt handle/document/page/kind/value/fingerprint; ordinary evidence has one pair; email none plus exact declaration; Supported income exactly two corroborating pairs/no warning; Conflict both sources, chosen amount/reason/**Resolved by you**, and one warning. Compile-time `satisfies HumanReviewDiffsV1` fixtures inhabit all eight finals; missing/swapped variants fail. `contentHash` recomputes from content and equals database columns. Receipt embeds stored Review bytes; accepted revision equals its source. In `SubmissionSuccess`, snapshot/Receipt/database `submittedAt`, snapshot/delivery `serverNow`, and snapshot/delivery/Application `expiresAt` are respectively equal. Receipt-load clock comes from its own final lock. Negatives alter every duplicated value, origin, binding, excerpt, hash, warning, revision, and valid timestamp; manual/assisted identical content hashes equally despite truthful differing origins. Screen/JSON/print reconstruct nothing.

```ts
type DemoGetSuccess = Success<{ kind: "start_token"; startToken: { nonce: string; issuedAt: string; expiresAt: string; signature: string } }>;
type DemoStartSuccess = Success<{ kind: "started"; destination: "/application"; expiresAt: string }>;
type ApplicationSuccess =
  | Success<{ kind: "challenge"; pageEpoch: number; applicationRevision: number; challenge: string; challengeExpiresAt: string }>
  | Success<{ kind: "takeover"; pageCapability: string; snapshot: TakeoverSnapshotV1 }>
  | Success<{ kind: "snapshot"; snapshot: HumanSnapshotV1 }>
  | Success<{ kind: "evidence_excerpt"; meta: AuthorityMetaV1; evidence: HumanEvidenceExcerptV1 }>;
type StoredBlockerCoordinateV1 =
  | { code: "missing_evidence"; field: EvidenceField }
  | { code: "conflict_requires_human"; field: "annual_household_income" }
  | { code: "invalid_email" | "declaration_required"; field: "preferred_contact_email" };
type DraftContentAction = Exclude<HumanAction["action"], "allow_assisted_access" | "revoke_assisted_access" | "prepare_review" | "return_to_draft">;
type StoredHumanActionOutcomeV1 =
  | { outcome: "action_applied" | "no_change"; action: DraftContentAction; fields: FieldId[]; versions: Versions }
  | { outcome: "assistance_allowed"; action: "allow_assisted_access"; versions: Versions }
  | { outcome: "assistance_revoked"; action: "revoke_assisted_access"; versions: Versions }
  | { outcome: "no_change"; action: "allow_assisted_access"; consentCoordinate: string; fields: []; versions: Versions }
  | { outcome: "no_change"; action: "revoke_assisted_access"; fields: []; versions: Versions }
  | { outcome: "review_prepared"; action: "prepare_review"; reviewId: string; versions: Versions }
  | { outcome: "returned_to_draft"; action: "return_to_draft"; invalidatedReviewId: string; versions: Versions }
  | { outcome: "evidence_unavailable"; action: "bind_evidence"; field: EvidenceField; versions: Versions }
  | { outcome: "evidence_unavailable"; action: "resolve_income"; field: "annual_household_income"; versions: Versions }
  | { outcome: "conflict_requires_human"; action: "bind_evidence"; field: "annual_household_income"; versions: Versions }
  | { outcome: "not_ready_for_review"; action: "prepare_review"; blockers: StoredBlockerCoordinateV1[]; versions: Versions };
type HistoricalActionReplayV1 = Success<{
  kind: "action_replayed"; original: StoredHumanActionOutcomeV1;
  snapshot: HumanSnapshotV1;
}>;
type ActionSuccess =
  | Success<{ kind: "assistance_allowed"; consentCapability: string; snapshot: DraftAllowedSnapshotV1 }>
  | Success<{ kind: "action_applied"; action: DraftContentAction; snapshot: DraftSnapshotV1 }>
  | Success<{ kind: "no_change"; action: DraftContentAction; snapshot: DraftSnapshotV1 }>
  | Success<{ kind: "no_change"; action: "allow_assisted_access"; consentCapability: string; snapshot: DraftAllowedSnapshotV1 }>
  | Success<{ kind: "no_change"; action: "revoke_assisted_access"; snapshot: DraftOffSnapshotV1 }>
  | Success<{ kind: "assistance_revoked"; action: "revoke_assisted_access"; snapshot: DraftOffSnapshotV1 }>
  | Success<{ kind: "review_prepared"; action: "prepare_review"; snapshot: ReviewSnapshotV1 }>
  | Success<{ kind: "returned_to_draft"; action: "return_to_draft"; snapshot: DraftOffSnapshotV1 }>
  | HistoricalActionReplayV1;
type SubmissionSuccess = Success<{ kind: "submitted"; snapshot: SubmittedSnapshotV1; delivery: ReceiptDeliveryV1 }>;
type ReceiptSuccess = Success<{ mode: "load" | "export_json" | "prepare_print"; delivery: ReceiptDeliveryV1 }>;

type DemoGetFailure =
  | { ok: false; error: { code: "invalid_request"; message: "CiteApply could not prepare a synthetic start."; safeActions: ["return_to_packet_selection"] } }
  | SharedOnly<"rate_limited"> | DemoTokenUnavailable;
type ChallengeFailure = SharedOnly<"session_expired" | "invalid_request" | "rate_limited"> | ConnectionUnavailable;
type TakeoverFailure = SharedOnly<"session_expired" | "stale_page" | "stale_state" | "request_reuse_mismatch" | "invalid_request" | "rate_limited"> | ConnectionUnavailable;
type SnapshotFailure = SharedOnly<"session_expired" | "stale_page" | "invalid_request" | "rate_limited"> | ReadUnavailable;
type ExcerptFailure = SnapshotFailure | SharedOnly<"evidence_unavailable">;
type ActionBaseFailure = SharedOnly<"session_expired" | "stale_page" | "stale_state" | "request_reuse_mismatch" | "invalid_request" | "rate_limited"> | MutationUnavailable;
type EvidenceActionFailure = ActionBaseFailure | SharedOnly<"evidence_unavailable" | "conflict_requires_human" | "demo_change_limit">;
type EmailActionFailure = ActionBaseFailure | SharedOnly<"demo_change_limit">;
type AllowFailure = ActionBaseFailure | SharedOnly<"demo_change_limit">;
type RevokeFailure = ActionBaseFailure | SharedOnly<"demo_change_limit">;
type PrepareActionFailure = ActionBaseFailure | HumanNotReadyFailure | SharedOnly<"demo_change_limit">;
type ReturnActionFailure = ActionBaseFailure | SharedOnly<"review_invalidated" | "demo_change_limit">;
type SubmissionFailure = ActionBaseFailure | SharedOnly<"review_invalidated">;
type ReceiptLoadFailure = SharedOnly<"session_expired" | "stale_page" | "invalid_request" | "rate_limited"> | ConnectionUnavailable | ReceiptUnavailable;
type ReceiptExportFailure = SharedOnly<"session_expired" | "stale_page" | "invalid_request" | "rate_limited"> | ConnectionUnavailable | ExportUnavailable;
```

Each route returns only named members. Fresh no-change has no revision/activity; Allow stores the observed consent coordinate and returns its current capability. In reserve it is noncommitted `demo_change_limit`. Replay reissues capability only while that stored coordinate remains current; otherwise `action_replayed` carries none. Refusals reconstruct while domain-current, otherwise expose stored coordinates beside current human state. Tests cover every action/failure, same binding, unavailable income resolution, already-Off/Allowed, counts 103/104–128, and replay after Review/Return/re-Allow/Submitted; cross-pairs fail.

## Six API Families

No other authored HTTP handler, Server Action, middleware-owned business call, health endpoint, cleanup endpoint, status endpoint, upload endpoint, or test endpoint exists.

### `/api/demo`

Implements `CA-START-01` through `CA-START-04` and parser portions of `CA-RECOVER-04`.

- `GET` is the sole issuer and returns exact `DemoGetSuccess` with the structured signed token under `private, no-store`; Landing holds it only in memory and disables Start until present.
- `POST {mode:"start", packet:"supported"|"conflict", startToken, requestId}` derives the canonical intent digest.
- The fixed-key Start preflight commits first; refusal precedes lookup/PDF access. An admitted request holds the parser sentinel across cleanup and a nonce-hash-OR-request-ID lookup. Only one row matching the exact nonce/request/digest replays the derived session/destination; either coordinate matched differently is `request_reuse_mismatch`. With neither present, parse/insert one application. Independent unique constraints and sentinel-order tests cover same ID/new nonce, same nonce/new ID, both packets, response loss, and concurrent orderings.
- The client presents **Parsing** from activation until response. Parse failure commits no application and returns a safe document title/code plus **Return to packet selection**; the admitted rate slot may remain consumed, but no partial evidence/session exists. A deliberate retry fetches a new token/request; no automatic reuse occurs after a terminal parse failure.
- Successful response sets the session cookie and sends the browser to `/application`; applicant values and identifiers never enter the URL.

### `/api/application`

Implements page bootstrap/takeover, authoritative human snapshot/reconciliation, and exact human evidence projection for `CA-FORM-01`, `CA-FORM-03`, `CA-RECOVER-01`, `CA-RECOVER-03`, and `CA-SUBMIT-05`.

The strict union is:

```ts
type ApplicationRequest =
  | { mode: "bootstrap_challenge" }
  | {
      mode: "takeover";
      requestId: string;
      expectedPageEpoch: number;
      expectedApplicationRevision: number;
      challenge: string;
    }
  | { mode: "snapshot" }
  | { mode: "evidence_excerpt"; claimHandle: string };
```

`bootstrap_challenge` is the sole session-authenticated, no-page-capability mode and returns only closed challenge coordinates—never stage, packet, requirements, values, progress, blockers, Review, submission, Receipt, or cross-session existence. `snapshot` and `evidence_excerpt` require current page capability but not assisted consent. Snapshot returns the stage-appropriate human projection; evidence returns title/page/value and one inert exact excerpt for a current handle. A stale page may retain rendered local values but receives no new ones.

### `/api/application/actions`

Implements all visible saved actions in `CA-FORM-02`, `CA-FORM-04` through `CA-FORM-07`, `CA-CONSENT-01` through `CA-CONSENT-04`, `CA-HUMAN-01` through `CA-HUMAN-03`, and `CA-REVIEW-01` through `CA-REVIEW-03`.

Every variant includes `requestId`, expected page epoch, application revision, and requirements version. The closed action payloads are:

```ts
type HumanAction =
  | { action: "bind_evidence"; field: EvidenceField; claimHandle: string }
  | { action: "clear_evidence"; field: OrdinaryClearField }
  | { action: "clear_dependency"; confirmed: true }
  | { action: "save_email"; value: string }
  | { action: "declare_email" }
  | { action: "resolve_income"; claimHandle: string; reason: ConflictReason }
  | { action: "clear_income_resolution"; confirmed: true }
  | { action: "allow_assisted_access" }
  | { action: "revoke_assisted_access" }
  | { action: "prepare_review" }
  | { action: "return_to_draft" };
```

`ConflictReason` is exactly `more_recent`, `corrected_record`, or `confirmed_for_application`, projected to the locked visible labels. Applicant `save_email` trims and NFC-normalizes a 3–254-character address, requires Zod's syntactic email check and an ASCII domain whose final label is `.test`, and preserves the normalized local part; assisted proposal remains exactly `anaya.rao@example.test`. Cancel/Discard/open/close/partial selections remain local and make no request.

The action × stage matrix is exact:

| Stage | Accepted action discriminators |
|---|---|
| Draft | bind/clear ordinary evidence, confirmed dependency clear, save/declare email, resolve/confirmed-clear income, Allow/Revoke, prepare Review |
| Review | `return_to_draft` only; submit belongs only to `/api/submission` |
| Submitted | none |

Stage-invalid edits return `stale_state`; only `return_to_draft` invalidates Review. `clear_evidence` covers ordinary fields/Supported income; dependency and resolved Conflict use confirmed clears. `resolve_income` re-resolves its handle from `parsed_packet` under the already-held Application `FOR UPDATE` lock; absence/ineligibility records stable `evidence_unavailable` outside reserve, changes nothing, never selects the other claim, and introduces no packet lock or coordination seam. A lock-trace test admits only the existing Application → operation order. Responses carry authoritative human projection/capability only as typed; UI is never optimistic.

### `/api/webmcp`

Implements all six tools for `CA-ASSIST-01` through `CA-ASSIST-06`, assisted boundaries in `CA-HUMAN-01` through `CA-HUMAN-04`, and abort handling in `CA-RECOVER-06`.

The body is `{tool: ToolName, input: unknown}`. Page/consent capabilities are callback-injected headers; validation/prepare also inject field-free `X-CiteApply-Local-Dirty:0|1`. After envelope/throttle, the route selects the exact Zod schema. Reads write nothing. Apply commits one atomic effect; prepare creates one Review only after current authority, clean input, and saved readiness. Under the same final Application lock, an authorized mutation terminal constructs the private HTTP envelope below. No declaration, resolution, Return, confirmation, submit, receipt, export, excerpt, or packet choice is hidden here.

### `/api/submission`

Implements `CA-REVIEW-04`, `CA-SUBMIT-01`, `CA-SUBMIT-02`, and submission portions of `CA-RECOVER-03`.

```ts
type SubmitIntentV1 = {
  requestId: string; expectedPageEpoch: number; expectedApplicationRevision: number;
  reviewId: string; reviewSourceRevision: number; contentHash: string;
};
type SubmissionRequest = { mode: "submit"; intent: SubmitIntentV1 };
```

After throttle, submission locks Application, checks session/page, then any operation identity: digest mismatch is `request_reuse_mismatch`; exact committed submit locks its Review/Submission and returns stored delivery. A new identity in Submitted returns `stale_state` with versions and no Receipt—the accepted Review remains immutable, not falsely called invalidated. Draft or Review next locks the supplied Review in Application → operation decision → Review order. Missing/foreign/invalidated/superseded/not-current is `review_invalidated` before stage or ordinary revision comparison, so Return-first queued submission receives the locked invalidation outcome. Only a current Review-stage request then reaches revision/source/hash/capacity and atomic commit. Tests cover Return-first queued submit, takeover, submit-first/replay, new ID in Submitted, changed digest, double confirmation, both lock winners, and zero Receipt leakage. No status/intent/approval/pending state.

After uncertain delivery, the controller shows **Checking latest state**, guards confirmation, and obtains fresh challenge/takeover. Submit-first commits/returns Submitted; takeover-first increments epoch, returns Review, and stales delayed submit. Lost takeover response replays only while its coordinate remains current. Three attempts end within ten seconds; Submitted loads Receipt, fenced Review permits deliberate confirmation, expiry/stale use exact presentations, and only unresolved authority enables Reload. Generations reject predecessors; race family 4 proves both winners, lost responses, third-page takeover, and expiry.

### `/api/receipt`

Implements `CA-SUBMIT-03` through `CA-SUBMIT-05` and receipt/export portions of `CA-RECOVER-03` and `CA-RECOVER-05`.

Receipt first obtains challenge/takeover through `/api/application`; its current page capability and Submitted stage are required here.

```ts
type ReceiptRequest = { mode: "load" } | { mode: "export_json" } | { mode: "prepare_print" };
```

Each mode returns exact `ReceiptSuccess` with the same stored record inside `delivery`; mode must equal the request. Exports write no database state. The browser creates labelled JSON only on activation and prints the semantic Receipt DOM. Product-detectable preparation failure preserves screen record and Submitted state; OS print cancellation has no CiteApply outcome.

The Receipt shell/bootstrap contain no receipt value. `ReceiptUnavailable`/`ExportUnavailable` may be constructed only after the transaction locks Application, establishes current Submitted, and matches its Submission/Receipt; earlier failure is value-free `ConnectionUnavailable`. An already-installed Submitted controller may retain the acceptance assurance. If neither state nor receipt is established after bounded reconciliation, it claims no acceptance. Expiry is value-free; unauthenticated access cannot reveal submission existence. Fault tests inject before pool, after Application lock, after Submitted proof, and during projection/export; Draft/Review never receive acceptance copy.

## WebMCP Contract V1 — Normative

The contract follows the [WebMCP Community Group draft dated 2026-08-26](https://webmachinelearning.github.io/webmcp/) and current [Chrome imperative API guidance](https://developer.chrome.com/docs/ai/webmcp/imperative-api). WebMCP remains a Community Group report, not a W3C Standard. CiteApply claims only the exact clients/builds proven in release evidence.

All six names fit the current Chrome name recommendation. Descriptions remain below 500 characters, parameter descriptions below 150, and results at or below 1,536 serialized UTF-8 bytes. Annotations are descriptive, never authorization. State, evidence, and apply set `untrustedContentHint` because protected normalized values originate in PDFs; instruction-like text remains inert and exact excerpts are excluded.

| Name | Exact description | Annotations | Server effect | Human-only boundary |
|---|---|---|---|---|
| `get_application_state` | Read CiteApply's current saved application status. Redacted mode is safe before access is allowed; protected mode requires visible CiteApply consent. It never returns full source excerpts, the private conflict choice or reason, declaration records, confirmation, submission, receipt, or export. | `readOnlyHint: true`, `untrustedContentHint: true` | bounded read | Cannot perform or expose human-only decisions/actions |
| `get_form_requirements` | Read CiteApply's field policies. Static all-fields mode is packet-independent and safe before consent; active mode requires visible CiteApply consent. It returns rules, not a field-to-claim answer map, and cannot declare, resolve, return, confirm, submit, receive a receipt, or export. | `readOnlyHint: true`, `untrustedContentHint: false` | bounded read | Rules only |
| `get_evidence_index` | List the current packet's bounded normalized claims and opaque handles after visible CiteApply consent. Values came from untrusted synthetic PDFs. No raw PDF, full text, exact excerpt, storage path, answer map, private resolution, declaration record, Review, receipt, or export is returned. | `readOnlyHint: true`, `untrustedContentHint: true` | bounded read | No excerpt or judgment |
| `apply_evidence_backed_answers` | Atomically link current allowed evidence handles to Draft fields and optionally propose CiteApply's fixed synthetic .test email after visible consent. The portal validates all entries or changes nothing. It cannot declare email, resolve conflicting income, close a populated branch, prepare through dirty input, return, confirm, submit, or export. | `readOnlyHint: false`, `untrustedContentHint: true` | one idempotent Draft mutation or none | Declaration/conflict/submit absent |
| `get_validation_issues` | Read CiteApply's current ordered readiness blockers after visible consent. It changes nothing and returns no full excerpt, private conflict choice/reason, declaration record, canonical hash, confirmation, submission, receipt, or export. | `readOnlyHint: true`, `untrustedContentHint: false` | bounded read | Blockers only |
| `prepare_submission_review` | Ask CiteApply to freeze the exact ready Draft into a fresh immutable Review after visible consent. It changes stage and closes assisted access, but returns only opaque readiness metadata. It cannot bypass dirty input, declare, resolve conflict, reveal the full Review/hash, return, confirm, submit, receive a receipt, or export. | `readOnlyHint: false`, `untrustedContentHint: false` | one idempotent Review creation or none | Visible applicant inspects and submits |

### Descriptor and registration source of truth

`src/contracts/webmcp.ts` defines six strict Zod inputs and exact per-tool success/failure unions. `z.toJSONSchema()` produces descriptors with `additionalProperties:false`; a committed snapshot freezes exact names, descriptions, annotations, required keys, public aliases, blocker variants, enum values, lengths, integer bounds, and array bounds. The server imports the Zod schemas directly and validates again. Contract tests assert that descriptor names are unique, exactly the locked set, and have no human-only synonym.

The exact tool failure-code sets are closed. Server `temporarily_unavailable` uses Read or Mutation copy as marked; bridge-only `assistance_unavailable` is a guaranteed pre-dispatch, zero-effect lifecycle result with no uncertainty or reconciliation claim:

| Tool | Allowed failure codes |
|---|---|
| `get_application_state`, `get_form_requirements` | `session_expired`, `stale_page`, protected-mode `consent_required`, `invalid_request`, `rate_limited`, Read unavailable, bridge `assistance_unavailable` |
| `get_evidence_index`, `get_validation_issues` | `session_expired`, `stale_page`, `consent_required`, `invalid_request`, `rate_limited`, Read unavailable, bridge `assistance_unavailable` |
| `apply_evidence_backed_answers` | `session_expired`, `stale_page`, `consent_required`, `request_reuse_mismatch`, `stale_state`, `evidence_unavailable`, `conflict_requires_human`, `demo_change_limit`, `invalid_request`, `rate_limited`, Mutation unavailable, bridge `assistance_unavailable` |
| `prepare_submission_review` | `session_expired`, `stale_page`, `consent_required`, `request_reuse_mismatch`, `stale_state`, `not_ready_for_review`, `demo_change_limit`, `invalid_request`, `rate_limited`, Mutation unavailable, bridge `assistance_unavailable` |

No other `SharedFailure` member validates for that tool or mode.

After takeover, `bridge.ts` creates one `registrationLifetime = new AbortController()` and attempts all six `registerTool(tool, {signal: registrationLifetime.signal})` calls with the identical signal object despite synchronous throws. Any rejection aborts that controller, awaits all six settlements, verifies `getTools()` contains none of the six CiteApply names, marks Unavailable, and never retries; complete success keeps it un-aborted for the document lifetime and never re-registers. After the required synchronous already-aborted execution-signal check, callbacks read current bridge `{generation,registered,active}` and capture generation per invocation; inactive/dormant returns exact `BridgeInactiveFailure` without value/dirty read, fetch, effect, support reference, or reconciliation. MutationUnavailable is impossible on that path. Late settlement may mark all-six registered but cannot activate an obsolete generation; fresh BFCache takeover may activate that settled set. Tests assert six-call signal identity, every settlement prefix/pagehide/pageshow ordering, exact copy, zero dispatch/effect, and rollback-to-zero; transient discovery is not claimed impossible. No ordinary unregister, dynamic/declarative/iframe tool, `navigator.modelContext`, or `document.domain`.

If `document.modelContext` is absent, the same nonblocking Unavailable/manual path applies. `getTools()` and DevTools diagnose registration only; genuine external discovery remains required.

The current draft expects object callback input, while current Chrome manual `executeTool` documentation describes a JSON string. Production does not call `executeTool`. A Chrome-only test adapter resolves the exact installed-build shape during the blocking spike and stays outside the product import graph and video. Genuine external-client invocation is the primary proof.

### Exact input schemas

All strings are trimmed where the schema says so; coercion is disabled. UUIDs are lowercase canonical v4. Revisions are nonnegative safe integers. Tool arguments never contain application/session/page/consent/review authority tokens.

```ts
type GetApplicationStateInput = {
  mode: "redacted" | "protected";
};

type GetFormRequirementsInput = {
  mode: "all" | "active";
};

type GetEvidenceIndexInput = Record<string, never>;
type GetValidationIssuesInput = Record<string, never>;

type AssistedChange =
  | {
      kind: "bind_claim";
      field:
        | "legal_name"
        | "student_id"
        | "institution"
        | "dependency"
        | "guardian_name"
        | "household_size"
        | "annual_household_income";
      claimHandle: string;
    }
  | {
      kind: "propose_email";
      field: "preferred_contact_email";
      value: "anaya.rao@example.test";
    };

type ApplyEvidenceBackedAnswersInput = {
  requestId: string;
  expectedApplicationRevision: number;
  expectedRequirementsVersion: number;
  changes: AssistedChange[]; // 1..8; each field occurs once
};

type PrepareSubmissionReviewInput = {
  requestId: string;
  expectedApplicationRevision: number;
  expectedRequirementsVersion: number;
};
```

Unknown properties, duplicate fields, incompatible duplicate claims, empty batches, any email other than the exact `.test` fixture, declaration/resolution/confirmation-like keys, and arrays over eight are `invalid_request` before protected state inspection. A syntactically valid income binding reaches portal policy so the Conflict demonstration returns `conflict_requires_human`, not a schema failure.

### Exact success projections

```ts
type RedactedState = {
  access: "consent_required";
  safeActions: ["use_visible_application"];
};

type AgentField =
  | { field: FieldId; status: "missing" }
  | { field: "legal_name" | "student_id" | "institution" | "guardian_name"; status: "ready"; value: string; updatedThroughAssistance?: true }
  | { field: "dependency"; status: "ready"; value: true; updatedThroughAssistance?: true }
  | { field: "household_size"; status: "ready"; value: number; updatedThroughAssistance?: true }
  | { field: "preferred_contact_email"; status: "needs_declaration"; value: string; updatedThroughAssistance?: true }
  | { field: "preferred_contact_email"; status: "ready"; value: string; humanActionComplete: true; updatedThroughAssistance?: true }
  | { field: "annual_household_income"; status: "needs_human_action" }
  | { field: "annual_household_income"; status: "ready"; resolution: "source_supported"; value: number; updatedThroughAssistance?: true }
  | { field: "annual_household_income"; status: "ready"; resolution: "human_completed"; humanActionComplete: true };

type ProtectedState = Versions & {
  stage: "draft";
  assistance: "allowed";
  activeFieldCount: 6 | 8;
  readyFieldCount: number;
  blockerCount: number;
  fields: AgentField[];
  safeActions: ["use_visible_application"];
};

type StaticRequirement = {
  field: FieldId;
  label: string;
  policy: "evidence" | "applicant_declared_test_email" | "income_policy";
  acceptedDocumentClasses: DocumentClass[];
  condition?: { field: "dependency"; equals: true };
};

type ActiveRequirements = Versions & {
  fields: Array<StaticRequirement & { active: true }>;
};

type AgentDocument = {
  code: "enrollment" | "household" | "income";
  title: string;
  documentClass: DocumentClass;
};

type EvidenceClaimBase = { claimHandle: string; document: AgentDocument["code"]; page: 1 };
type EvidenceClaim =
  | (EvidenceClaimBase & { kind: "legal_name" | "student_id" | "institution" | "guardian_name"; normalizedValue: string })
  | (EvidenceClaimBase & { kind: "dependency"; normalizedValue: true })
  | (EvidenceClaimBase & { kind: "household_size" | "annual_household_income"; normalizedValue: number });

type EvidenceIndex = {
  documents: AgentDocument[]; // exactly 3
  claims: EvidenceClaim[]; // exactly 8
};

type ApplySuccess = Versions & {
  updatedFields: FieldId[];
  rereadRequirements: boolean;
};

type ValidationIssues = Versions & {
  blockers: AgentReadinessBlocker[];
};

type PrepareSuccess = Versions & {
  readiness: "ready";
  reviewRef: string; // fresh random, non-content-derived
};

type WebMcpHttpEnvelopeV1<K extends ToolName, R> =
  | { schema: "citeapply-webmcp-http-v1"; kind: "agent_only"; tool: K; callbackResult: R }
  | { schema: "citeapply-webmcp-http-v1"; kind: "mutation_projection"; tool: K; disposition: "current" | "historical_replay"; callbackResult: R; uiSnapshot: HumanSnapshotV1 };
```

This private same-origin envelope is closed and at most 64 KiB; each `K/R` is that tool's exact schema. Reads and pre-authority/unavailable mutations are `agent_only`; finally authorized mutation terminals pair with same-lock current Draft or successful eight-field Review. Old apply may reconstruct its result. A successful prepare response is disclosed only from its committing authorization: later consent-Off replay is `consent_required`; after Return/new Allow, takeover, expiry, or repreparation it returns the applicable authority refusal or current `stale_state` plus private snapshot, never old `reviewRef`. Per-tool cross-pairs fail. The bridge installs only `uiSnapshot`, returns only ≤1,536-byte `callbackResult`, and tests response loss/closure/re-Allow/reprepare.

`RedactedState` succeeds only while consent is Off and is byte-identical in Draft, Review, and Submitted presentation. Current consent plus `mode:"redacted"` returns that tool's exact value-free `invalid_request`; it never auto-escalates. It has no packet, stage, field, version, progress, activity, blocker, handle, or Review metadata. Revoke restores it; session/page/expiry remain higher. Public `mode:"all"` is a compile-time eight-field policy/condition/document-class constant without protected state.

Protected state lists only active fields. The strict variant determines exactly when a value/origin/human flag can exist. Once Conflict income has been human-resolved, its entry is exactly `{field:"annual_household_income", status:"ready", resolution:"human_completed", humanActionComplete:true}`. It structurally cannot carry amount, claim handle, document, reason/category, history, origin, or content hash. Evidence index continues to show both preexisting claims, so its contents do not disclose which one was chosen.

Protected active requirements return policy and accepted document classes, not claim handles or an answer map. Evidence index uses handles, but claims do not state which claim the portal will accept for each field; the agent composes kinds against requirements. Validation returns only current ordered blockers. Prepare returns a fresh random identity, readiness, and current versions; it never returns the canonical content hash, request digest, deterministic content identifier, full Review, declaration details, or Conflict details.

Across the two income sources times three reason codes, dedicated differential tests build all six resolved aggregates. After normalizing application/requirements versions and fresh opaque Review identities, every agent-facing current-state and successful-prepare result must be byte-for-byte equal. The test also recursively rejects the chosen amount, claim handle, document title, reason code/label, canonical hash, request digest, and any unknown key.

Every success/failure fixture is serialized with `TextEncoder`; exact worst cases for all six tools, every blocker list, eight maximum-length handles/claims, and every allowed error remain at or below 1,536 bytes. The server validates the per-tool result, measures bytes, and replaces any oversized/unclassified result with that tool's safe `temporarily_unavailable` variant. It never truncates. Recursive negative fixtures attempt authority-plus-version/blocker/retry detail, masked-income values/origin, wrong field/value pairs, human-only keys, and unknown properties; all must fail before release.

### Callback and abort behavior

The controller owns one synchronous same-document `prepareGate`, acquired before reading dirty state or any `await`. Capture-phase guards and the reducer reject email/conflict edits, Save, Discard, and another prepare while held. Edit-first increments dirty generation; clean-prepare-first prevents later edits. Manual dirty Review releases after its focused summary and sends nothing. Assisted dirty stays gated and sends only the field-free bit, preserving authority-first disclosure. A terminal result releases after state installation; abort/loss holds through authoritative reconciliation. Pre-dispatch abort releases immediately. Barriers prove both task orders, concurrent prepare, authority loss, abort/loss, and release.

Every callback receives `(input,{signal})`: already-aborted rejects `AbortError`; fetch receives memory headers/signal without automatic retry. `installGeneration` increments synchronously before every human mutation, takeover/reconciliation/expiry reduction, and WebMCP mutation dispatch. The call captures it, page epoch, projection tuple, dirty generation, request-start monotonic time, and signal. After both size/schema checks, the reducer first tightens the deadline, then accepts only in the live matching generation/page before expiry and only when `(applicationRevision, projectionSequence)` is not below the installed tuple; equal revision requires equal requirements version. `projectionSequence` is the under-lock operation-row count `0..128`, adds no column/workflow state, and orders same-revision activity. A later Review/Submitted/takeover/Revoke wins; predecessors are discarded. Current-disposition result coordinates cross-match the snapshot; historical coordinates may be older. Mutation success reaches the agent only after eligible installation or an already-installed/reconciled later authoritative presentation; only `callbackResult` is returned.

Apply installation updates authoritative backing/activity but preserves an advanced local email/conflict buffer while Draft/active. Its frozen base revision makes the first Save `stale_state`, never a silent rebase; after that surfaced reconciliation only a new deliberate Save adopts the newer revision. Discard restores installed state; leaving Draft/inactivation drops the buffer. Tests cover assisted proposal against dirty email and older same-revision refusal activity.

Validation captures dirty generation/bit once. Once a schema-valid server response exists, its callback resolves byte-for-byte with that server-final-authorized `callbackResult` unless the native execution signal aborts. Dirty/install-generation, authoritative-base, Revoke, expiry, or takeover drift prevents UI installation and triggers bounded Application reconciliation, but never rewrites or withholds that terminal; reconciliation updates only the human UI. Current dirty state remains human-UI-only and affects the next invocation. It never issues a second tool request. Externally blocked prepare announces without moving focus. Post-dispatch abort follows the exact `AbortError` path, says **The assistant stopped waiting. This action may have completed. Checking the latest application.**, and reconciles without cancellation. Mutation uncertainty resolves only Mutation-unavailable. Tests assert exact callback bytes for unchanged, `0→1`, `1→0`, `1→1`, version change, Revoke, expiry, and authorization → takeover commit → delayed broadcast → old-page edit → response; no callback reflects the later edit. Delayed mutation and private-envelope races remain covered.

The server does not add an abort endpoint or durable abort state. It may observe request disconnection and stop before its transaction, or its short transaction may complete. Allowed post-acceptance outcomes are no protected result/effect or one already-final-authorized bounded result/whole atomic effect. Partial batches, duplicate effect, tombstone, compensating rollback, and guaranteed cancellation are impossible by design and test.

## Data Lifecycles

### Start and runtime parsing

After packet selection, Start enters **Parsing**. For a new admitted Start, `packet-registry.server.ts` selects three paths; the adapter verifies hash/bytes, loads `Uint8Array` with `stopAtErrors:true`, requires one page, bounds normalized `TextItem.str`/`hasEOL`, and destroys the task in `finally`.

Labelled grammars require each line once, anchor typed values, and validate classes, 3/4/1 claim counts, ranges, cross-document structure, and income equality/inequality—never expected answers. Only a complete aggregate/blank Draft inserts. Any file/PDF/shape failure commits nothing, safely names one document, and requires fresh Start identity.

`AGENT_EMAIL_PROPOSAL = "anaya.rao@example.test"` is the sole fixture-value exception and only its schema/reducer may import it. A reviewed test-only forbidden corpus contains every other fixture-derived applicant string/number and its NFC/NFD, JSON/JS escape, UTF-8 hex, base64/base64url, decimal character-array, and SHA-256 forms. The scanner constant-folds concatenation and rejects those forms as production AST literals, keys/values, arrays, regex/cases, or built bytes; low-entropy `true`/`4` are rejected specifically in parsed-value comparisons, fallbacks, and claim construction, while a snapshotted node/file allowlist permits structural flags/cardinality. It also rejects imports from tests, goldens, generator, test registry, precomputed claims/manifests, and answer maps; only registry path/file hashes are scoped exceptions. It does not claim arbitrary-obfuscation detection: source/import-graph review plus production-path mutations provide residual proof. One admitted test PDF changes a normalized value through stored `ParsedPacketV1` and agent evidence; another changes human anchor/slice; altered production bytes under the registered hash fail before parsing. Tests snapshot the finite corpus and every rule/exception.

### Draft and manual completion

Takeover installs an authoritative snapshot beside a local dirty map. Evidence controls show value, title/page, and excerpt; they accept no text. Shared reducer handles bind/replace/clear. Same-binding is a stable no-revision/activity outcome recorded outside the reserve and `demo_change_limit` inside it. Review/Submitted reject edits; only visible Return invalidates Review.

Dependency `true` atomically activates guardian/household and both versions. Before it, keyboard-reachable **Not currently required** names both fields as inert text excluded from blockers/progress/agent requirements. Reveal inserts them after dependency, announces once, and retains focus; confirmed clear atomically removes all three values. Snapshot, keyboard, reflow, and screen-reader tests lock both states.

Supported income binds income plus household corroboration. Conflict gives equal-priority claims/excerpts; partial choice says **Selection not saved**, `resolve_income` saves source/reason, confirmed clear removes both, and Discard is local. Any bounded valid `.test` email is allowed; save invalidates mismatched declaration, declaration binds current email, and dirty copy says **Unsaved — not in your application**. Assisted schemas omit both judgments.

**Clear source** covers ordinary evidence/Supported income; dependency and resolved Conflict require confirmed actions. Progress excludes dirty/inactive/unresolved/undeclared state. Tests lock 5/6, 7/8, 8/8-dirty, clear/replacement/alternate-email/stage forgery. Only authoritative snapshots label values saved.

### Assisted composition

Before Allow, only redacted state/static requirements succeed; protected work is `consent_required`. Each apply rechecks authority/replay/versions/packet handles, evaluates one all-or-none batch, and commits one operation/revision visible after refresh. Conflict income changes nothing: outside reserve it records one refusal; inside it returns unrecorded `demo_change_limit`. Copy is **Income was refused; no value changed.** Blockers are Conflict then declaration; Supported accepts income/corroboration.

### Revision rule

Application `revision` increments once per takeover, consent change, saved field/declaration/resolution/clear, Review preparation, Return, or submission; reads/no-ops/refusals do not. Takeover also increments `page_epoch`; only active-set change increments requirements. Human/apply replay reconstructs its allowed bounded outcome beside current state; assisted prepare obeys the closed-reference rule above. Except for submission's explicit invalid-Review precedence, a fresh old-coordinate request is `stale_state`.

### Review, Return, and fresh preparation

Both paths use `prepareGate`. Manual dirty input focuses its local summary and sends nothing; assisted sends the field-free bit, preserving authority precedence and no focus move. Server orders authority/replay/version → readiness → reserve. Dirty records nothing; saved blockers record only outside reserve. Ready work atomically stores Review/content/hash/detail/link/stage, clears consent, and advances once. Only WebMCP preparation appends `assisted_review_prepared`; manual preparation retains its operation row but adds no assisted event. Tests prove manual-only count zero, assisted count one, path-specific Review/Receipt activity, and equal hashes for identical content.

Review source versions identify the ready Draft; preparation/takeover advance current authority. Submit classifies Review currentness before current revision/source/hash. Refresh cannot invalidate it; Receipt accepts its source revision. Manual returns the Review; assisted installs it privately and returns only `PrepareSuccess`. Review is fixed-order/read-only, focuses heading, announces assistance Off, and puts identity/hash in technical details.

Visible **Return to application** locks Application then Review, invalidates before reopening Draft, clears link/consent, preserves saved content, and increments revision. Direct success—or reconciliation/historical replay whose current snapshot is that returned Draft—announces once: **The previous Review can no longer be submitted. Review your saved application, make any needed changes, then prepare a new Review.** Focus moves to the Draft heading because the old control is gone. The notice is controller-local, absent from unrelated Draft bootstrap and later Review, and adds no stored field. Back/delayed submit cannot revive the Review; repreparation creates a new identity while unchanged content preserves the hash.

### Confirmation, submission, and canonical Receipt

Confirmation is browser-only state over the exact visible current Review. Its text and controls are exactly:

> **Submit this fictional application?**
>
> This submits Review `[short identifier]` exactly as shown. You cannot edit it afterward.

**Cancel** and **Confirm and submit this review** are the only controls. Open/cancel is local; Confirm sends current page/revision, Review ID/source/hash, and UUID, becomes guarded busy, and claims no optimistic success. One transaction validates Review/capacity/uniqueness and stores operation, Submission, immutable Receipt, and Submitted; constraints prevent a second receipt.

`ReceiptRecordV1` contains schema/ID/time, accepted Review source revision, and frozen Review; it excludes inactive fields, capabilities, PDFs/paths, and request digests. Screen/JSON/print consume it directly. JSON is the only product-created value-bearing download; print is page CSS.

Uncertain submit guards confirmation and uses challenge/takeover—never status—three attempts by ten seconds. Submit-first yields Receipt; takeover-first yields Review and stales delayed submit. Stale page keeps its Reload action. Only authority still unreachable after the bound becomes Connection unavailable with **Reload current application**. If the deadline passes while outcome is still unknown, Session expired adds controller-local **CiteApply could not confirm whether the earlier submission completed before the session expired.** and only **Start a new synthetic demo**—no acceptance, failure, resubmit, or recovery-token claim. Combined deadline/loss tests assert copy and sole control.

### Session time, refresh, takeover, and connectivity

Snapshots calibrate the deadline and warning announces once. Foreground/BFCache checks clear values only when expired and reject late installs; persisted restore stays dormant through fresh takeover. Refresh restores saved state, clears consent/dirty/confirmation, and stales other pages; PostgreSQL preserves stages.

Reconciliation runs immediately, at one second, and by nine, ending by ten: apply/prepare reread Application; submit uses takeover; Receipt rereads Submitted/record. Production has no status/pending/worker/fault endpoint and no service worker, Web Storage, IndexedDB, offline cache, analytics, recorder, or prefetch. Navigation/expiry deactivates secrets; BFCache stays dormant until deadline check/fresh takeover. Saved JSON/print is thereafter external.

## Security, Privacy, And Threat Model

| Threat | Required control and proof |
|---|---|
| Cross-site/CSRF | Host/Origin/fetch metadata, SameSite cookie, page capability, closed JSON, frame denial, browser negatives |
| Stolen/replayed request | Session digest, page/consent coordinate, authority-first keyed intent, exact/mismatch/stale tests |
| Stale tab/callback | Application lock, takeover CAS, BroadcastChannel hint, focus check, real-PostgreSQL winners |
| Conflict-choice inference | Separate agent projection, no agent hash, six-way DTO equality |
| Forged human action | Human operations absent from tool schemas/dispatcher; unknown-key/forged-route tests |
| PDF injection | Fixed hashes, no URL/upload, labelled extraction, untrusted hint, inert React text, XSS canaries |
| Ambient leakage | No values/IDs in ambient surfaces; safe-log allowlist and canary scan |
| Duplicate/partial effect | Row lock, atomic reducer, operation digest, Review/Submission constraints, loss tests |
| Supply chain | Exact lockfile, audit/licenses/baseline, parser/build spike, no runtime CDN/import |
| Resource abuse | Fixed schemas/caps/keys, sentinels, row/graph/pool budgets, spray/rollover/load proof |
| Privileged extension/client claims | Copy explicitly limits consent to CiteApply's six tools and does not claim control over separate browser/extension permissions |
| Retention misconception | 60 minutes is access authority, not deletion; synthetic only; selected provider backup/PITR/log policy documented before launch |

`next.config.ts` uses self-only CSP, no external connect/media/font/frame/object/base/form target, `frame-ancestors 'none'`, no `unsafe-eval`, documented minimal Next hydration allowances, COOP/COEP, origin isolation, `tools=(self)`, no-referrer, nosniff, and HSTS. Stateful pages/APIs are `private, no-store`; PDFs have no public route.

Safe logs allow only timestamp, support reference, route/action/outcome codes, duration bucket, and size bucket—never bodies, authority, values, excerpts, product IDs, URL query, SQL, stack, or raw errors. Analytics/telemetry stay off. Failure canaries scan browser/server output, URLs, storage/cache, traces, and error pages.

## Accessibility, UX, And Performance

The UI uses native buttons, inputs, fieldsets/legends, headings, lists, `<dialog>`, status text, and one concise `aria-live` queue. No interaction requires hover, drag, color, motion, or timing. Only applicant-activated failed Review focuses and links its error summary; assisted blocked Review announces without moving focus. Dialog close restores focus, branch reveal retains it, and successful Review/Receipt focuses the heading. A busy initiator promised to retain focus (Parsing Start, Confirm, applicant reconciliation, Reload/export) remains a focusable button with `aria-disabled="true"`, `aria-busy="true"`, and synchronous pointer/Enter/Space duplicate guards; it never receives native `disabled` while focused. Native disabling is allowed only where no retention promise exists. Server idempotency remains authoritative.

Status iconography is supplementary to exact text. Both sources in Conflict have equal prominence. Currency has visible and accessible INR wording. Exact excerpts/identifiers wrap. At 320 CSS pixels and 200% zoom there is no two-dimensional page scroll or missing control. Reduced motion removes nonessential transitions. Text/control/focus contrast meets WCAG 2.2 A/AA. Touch targets and adjacent destructive controls are spaced safely.

The document-title, one page-level `<h1>`, and focus contract is exact:

| Presentation | `document.title` / page `<h1>` | Focus behavior |
|---|---|---|
| Landing | `CiteApply synthetic aid demo` / `Apply with synthetic records` | Natural entry; packet controls follow the heading |
| At capacity | `CiteApply at capacity` / `Apply with synthetic records` | Start retains focus; safe retry time announces once |
| Parsing | `Parsing synthetic records — CiteApply` / `Parsing synthetic records` | Remains at guarded busy Start activation; status announces |
| Parse failed | `Document could not be parsed — CiteApply` / `Document could not be parsed` | Heading receives focus, then Return control |
| Draft | `Application draft — CiteApply` / `Application` | Takeover/explicit reload focuses heading; ordinary updates do not |
| WebMCP unavailable | inherits Draft | No focus move; persistent explanation; announce once only on dynamic loss |
| Checking latest state | `Checking latest application — CiteApply` / `Application` | Initial entry focuses the heading; applicant work retains its guarded busy initiator; external work retains current focus; status announces once |
| Connection unavailable | `Connection unavailable — CiteApply` / `Connection unavailable` | Applicant/initial recovery focuses heading; externally triggered recovery retains focus; only Reload is enabled |
| Consent | `Assisted access — CiteApply` / `Application` | Modal heading/first choice receives focus; close restores opener |
| Evidence | `Evidence source — CiteApply` / `Application` | Dialog heading receives focus; close restores evidence button |
| Conflict | `Income conflict — CiteApply` / `Application` | No automatic movement; manual failed Review focuses linked summary |
| Declaration | `Email declaration — CiteApply` / `Application` | Save failure stays at email; declaration update announces only |
| Stale page | `Application page out of date — CiteApply` / `This application page is out of date` | Values become read-only; warning announces without stealing focus |
| Review | `Review application — CiteApply` / `Review application` | Successful manual/assisted transition focuses heading once |
| Confirmation | `Confirm fictional submission — CiteApply` / `Review application` | Modal heading then Cancel receives focus; close restores Submit |
| Submitted transition | `Submission accepted — CiteApply` / `Submission accepted` | Authoritative success focuses heading before full navigation |
| Checking receipt | `Checking receipt — CiteApply` / `Checking receipt` | Route entry focuses heading once; no acceptance claim or action is enabled |
| Receipt | `Application receipt — CiteApply` / `Application receipt` | Authenticated load focuses heading once |
| Receipt unavailable | `Receipt unavailable — CiteApply` / `Receipt unavailable` | Heading receives focus; accepted-submission assurance and Retry load announce once |
| Receipt export failed | `Receipt export problem — CiteApply` / `Application receipt` | Error announces; focus stays on activated export control |
| Session expired | `Session expired — CiteApply` / `Session expired` | After synchronous value clearing, heading receives focus |

An agent-triggered blocked prepare updates the same visible error summary and live region but never moves focus. Only the applicant-activated **Review application** failure focuses that summary. Tests assert exactly one page `<h1>`, the title, modal heading, focus target/retention, and announcement count for every row.

Every pointer/keyboard activation receives feedback within 100ms. Any ordinary action over one second names its busy state and blocks duplicate activation; focus/dispatch tests cover pointer, Enter, and Space. No skeleton invents values. The parser spike records p50/p95 for all packets below its two-second Start budget on Node 24/Linux production build. Release evidence records timings but makes no universal SLA claim.

Automated axe, semantic/keyboard, 320px, 200% zoom, reduced-motion, focus, live-announcement, title, and contrast coverage spans every matrix row, including Parsing, evidence, declaration, confirmation, Submitted, and Session expired, plus Return, accepted-but-unavailable, and connection unavailable. One complete VoiceOver run covers canonical Conflict through consent/tool effects/human decisions/Review/submit/Receipt, and one manual/no-WebMCP smoke covers source selection, ordinary clear, alternate `.test` email, Review entry, and error focus. Any known material A/AA defect blocks its stage and release.

## Verification Architecture

### Test layers and commands

G4L will sequence these commands and name exact evidence files; none may be replaced by a verbal check:

1. From an empty npm cache on Node 24.20.0/Linux: `npm ci`, exact direct-version/peer assertion, TypeScript 6 CLI/programmatic import, ESLint config load, `npm run typecheck`, `npm run lint`, minimal `next build`, lockfile integrity, production dependency/license inventory, and `npm audit --omit=dev` triage. Any install/peer/lint/build failure blocks feature work and reopens the stack choice.
2. Migration/schema/table/count/storage-ceiling checks, forbidden-import/value-sentinel scan, six-tool descriptor/per-tool result snapshots, error cross-pair negatives, route-family/page count, and serialized output caps.
3. Node unit/property tests for normalization, active fields, all manual/assisted reducers, blocker order, canonicalization/hash, projectors, outcome precedence, and Receipt projection.
4. Parser tests over all six real PDFs, independently reviewed anchors, changed production byte, accepted normalized-value mutation, separate anchor mutation, every limit/failure, exact-fixture-literal rejection, and built-bundle anti-hardcode assertion.
5. Route/service integration tests on PostgreSQL 18.6 for envelopes, Origin/Host/fetch metadata, capabilities, calibrated expiry, keyed canonical intents, action × stage, forged handles/actions, review/submission constraints, fixed-key rate admission, retained-graph ceilings, and no-store results.
6. Four parameterized real-PostgreSQL controlled-barrier suites below; no SQLite, in-memory repository, fake lock, or process mutex satisfies them.
7. `next build` and Linux production `next start` smoke under Node 24.20.0, including server-traced PDF presence and parser execution from the built output.
8. Playwright E2E, full title/heading/focus matrix, privacy, response-loss, two-page/BFCache, skew/RTT/background expiry, ordinary clear/alternate `.test`, Receipt semantic equality, and fault-proxy suites against production build plus PostgreSQL.
9. Exact ChatGPT desktop primary-client evidence and supplemental exact Chrome/DevTools evidence. An in-page harness can test contracts but cannot pass this lane.

Service tests inject barriers as function dependencies at after-application-lock, before-final-authorization, after-final-authorization, before-commit, and after-commit-before-response. Production construction supplies no-op barriers; there is no header, environment-controlled behavior, test route, cancellation route, or database test state. Separate PostgreSQL clients and explicit barrier releases choose each winner. Expiry tests use real `clock_timestamp()` boundaries, not a mocked authorization clock.

### Exactly four PostgreSQL race families

| Family | Controlled cases | Required invariant |
|---|---|---|
| 1. Demo, admission, and replay | double/lost Start; rate mutex with 255/256 rows, same key and old/new windows; Start-sentinel rollover; 10,000 forged credentials; 512-app cleanup; every 104–128 operation-floor state; keyed replay/stale versions | counters never exceed 256; refused Start never looks up/parses/creates; arbitrary credentials create no key; one complete app/effect; manual close/Revoke/replay remain; operations never exceed 128 |
| 2. Authority versus WebMCP | protected reads/apply/prepare—including dirty prepare—against Revoke, Review close, takeover, expiry in both lock orders; takeover no-growth/replay; prepare/edit task orders; response loss/abort | dirty follows authority; prepare/edit cannot cross; authority-loss-first is value-free/no effect; operation-first is one whole effect; Revoke reduces; no redisclosure/cancel state |
| 3. Human changes versus Review | bind/edit, declaration, resolution/clear, branch clear versus manual/assisted prepare and Return invalidation | zero or one valid immutable Review; snapshot matches one whole application state; old Review never becomes current again |
| 4. Submit and recovery | submit versus Return/edit, duplicate/different confirmation, submit-first/takeover-fence-first, lost submit/takeover response, third page, expiry, Receipt load/export | at most one Submission/Receipt; fence returns Submitted or disables delayed old submit and returns Review; uncertainty never enables unsafe resubmit; projections remain equal |

Native abort is browser/contract evidence inside family 2, not another PostgreSQL protocol. Rate-bucket concurrency is inside family 1. Receipt retrieval and export race under family 4. No implementation may split a scenario into a fifth claimed proof family to hide added coordination.

### Required complete and adversarial flows

The release regression must include: complete manual Conflict to Receipt with WebMCP unavailable; Supported manual source/corroboration/ordinary clear/Review; alternate valid `.test` plus invalid non-`.test`; inactive summary reveal/clear; complete genuine-client Supported to Receipt; genuine-client Conflict composition/refusal followed by human resolution/declaration/Review/submit; Review/Return/edit/stale-submit/reprepare; pre-consent and post-Revoke refusals; dirty-plus-expired/stale/revoked precedence; all final-authorization orderings; response loss after apply/prepare/submit; Draft/Review/in-flight-submit/Submitted refresh and BFCache; parser/hash failure and Return; stale page; skewed-clock/background minute-50 warning/expiry/late-response rejection; Receipt unknown versus accepted-but-unavailable; Connection unavailable after bounded checks; JSON and print failure; and semantic screen/JSON/print equality for both packets.

Security/adversarial coverage includes malformed and oversized envelopes, cross-site requests, absent/wrong cookies/capabilities, wrong packet/cross-session/forged/expired handles, duplicate/inconsistent batches, declaration/resolution smuggling, direct edits in Review/Submitted, stale requirements after branch reveal, canonical-intent key/order/Unicode/digest changes, instruction/markup/URL/Unicode excerpts, result cross-pairs/size guards, credential spray/window rollover/storage ceilings, mixed throttle with expired/stale/unconsented state, no value in ambient surfaces, and no production import or exact comparison of fixture answers.

### Story-to-component and proof traceability

| Story | Primary implementation | Blocking proof |
|---|---|---|
| `CA-START-01` | Landing/Start controller | truthful-copy and double-activation E2E |
| `CA-START-02` | packet registry/parser | six PDFs, anchors, mutation, byte/hash/import tests |
| `CA-START-03` | session authority/countdown | exact boundary races plus focus/timer E2E |
| `CA-START-04` | fixed Start counter + timeless sentinel | capacity/rollover/prune PG race and keyboard retry |
| `CA-FORM-01` | Draft snapshot/readiness | six/eight active, collapsed inactive summary, progress and a11y E2E |
| `CA-FORM-02` | evidence reducer/human actions | source policy, idempotency, replacement/ordinary clear/stage matrix tests |
| `CA-FORM-03` | evidence projector/dialog | anchor slice, inert rendering, focus/reflow tests |
| `CA-FORM-04` | branch reducer/clear confirm | atomic reveal/clear, cancel, assisted-refusal tests |
| `CA-FORM-05` | income policy/conflict UI | Supported corroboration and every Conflict edit path |
| `CA-FORM-06` | email/declaration component | alternate valid `.test`, fixed agent proposal, dirty/save/discard, forgery/invalidation tests |
| `CA-FORM-07` | shared domain/manual UI | full manual Conflict plus parity comparison |
| `CA-CONSENT-01` | consent disclosure | copy-completeness contract and VoiceOver pass |
| `CA-CONSENT-02` | consent service/public projectors | exact pre-consent DTO snapshots/manual continuity |
| `CA-CONSENT-03` | Revoke/application lock | both race winners and post-Revoke refusal |
| `CA-CONSENT-04` | takeover/review/return/submit | every authority boundary clears consent E2E |
| `CA-ASSIST-01` | bridge/descriptors | exact six snapshot, no duplicates, genuine discovery |
| `CA-ASSIST-02` | three read projectors | strict schemas, values/limits, authority races |
| `CA-ASSIST-03` | apply service/operations | atomic batch, persisted UI, exact/mismatch replay PG |
| `CA-ASSIST-04` | branch versions | canonical first/stale/reread/second sequence E2E |
| `CA-ASSIST-05` | income policy/projector | Conflict no-change/two-blocker and Supported accept |
| `CA-ASSIST-06` | shared prepare/agent projector | blocked/success contracts, closure, no-submit proof |
| `CA-HUMAN-01` | declaration-only action | absent tool schema plus forged/direct negative tests |
| `CA-HUMAN-02` | resolution-only action | absent tool schema plus six private combinations |
| `CA-HUMAN-03` | origin/operation activity/Review diff | one batch event/ordered field names, refusal persistence, projection parity |
| `CA-HUMAN-04` | copy and dispatcher boundary | no overclaim/human-only surface audit |
| `CA-REVIEW-01` | dirty gate/readiness | manual zero-request gate, assisted authority-first dirty refusal, focus/error E2E |
| `CA-REVIEW-02` | Review snapshot/renderer | complete diff/excerpts/hash/identity assertions |
| `CA-REVIEW-03` | Return/invalidation | real-PG Return versus submit/edit/reprepare |
| `CA-REVIEW-04` | confirmation binding | exact copy, stale/two-page confirmation E2E |
| `CA-SUBMIT-01` | submit transaction/dialog | no implicit submit, double confirm, unique row |
| `CA-SUBMIT-02` | takeover-fence reconciliation | response-loss/expiry/current Review/one Receipt |
| `CA-SUBMIT-03` | `ReceiptRecordV1` projections | semantic equality for Supported and Conflict |
| `CA-SUBMIT-04` | export controller | failure/retry never mutates Submitted/Receipt |
| `CA-SUBMIT-05` | value-free shell/load controller | unknown/accepted-unavailable/auth/expiry E2E |
| `CA-RECOVER-01` | page challenge/epoch/channel | two-page takeover PG and read-only UI |
| `CA-RECOVER-02` | operation/Page digests and versions | stale/exact/mismatch manual and assisted tests |
| `CA-RECOVER-03` | final authority transaction | precedence matrix including dirty prepare and every required race ordering |
| `CA-RECOVER-04` | fixed buckets/sentinel/storage/caps | rollover/spray/prune/ceiling, body/output/load and no-state tests |
| `CA-RECOVER-05` | projections/headers/safe logs | URL/referrer/storage/cache/log/console canaries |
| `CA-RECOVER-06` | native signal/reconciliation | deterministic pre-dispatch/no-effect/one-effect proof |

## Blocking Portability And Genuine-Client Gates

Explicit local-only authority splits this checkpoint without weakening release. `G5B-L` must pass within the first 12 amended critical-path build hours and permits only local items 3–10. `G5B-H` runs after A0P public-release authority as a blocking subgate inside item 11/G9; it must close before any hosted-compatibility/release claim and before item-11/G9 closure. Neither state authorizes publication or supports a release-ready claim.

1. `G5B-L` parses a committed PDF with exact anchor under Node 24.20.0 on macOS, isolated Linux, and the production Next output/local Node path. `G5B-H` repeats the proof on the selected hosted Node path. All packet parses meet the Start lock budget; no fallback, preprocessed production claim, or hardcoded map may rescue either gate.
2. For `G5B-L`, the exact ChatGPT desktop built-in browser/account/model must empirically discover the six real once-registered tools on the actual fixed local route. Exact potentially trustworthy `http://localhost:<port>` is allowed only when the unmodified client reports a secure context and accepts the unconditional Secure `__Host-` cookie; otherwise trusted loopback HTTPS is required. The client must show the value-free pre-consent refusal, post-Allow protected data, and a visible PostgreSQL-backed mutation, then complete three unedited raw Conflict runs: state → requirements → evidence → first apply → branch state/requirements reread → second apply → separate income refusal → issues → blocked prepare. Every name appears, persistence is visible, every run is at most 120 seconds, and evidence records the actual app/build/model/account availability/settings/origin/date, raw chronology, elapsed time, causal request data, and database/UI result. Failure stops before Wave 1; Chrome and harness evidence are supplemental only. `G5B-H` repeats the exact sequence on the authorized public HTTPS candidate before any hosted-compatibility or release claim.

The supplemental Chrome lane records the actual exact installed Chrome build captured at proof time, required WebMCP testing/origin-trial setting, secure/origin-isolated context, descriptor listing, callback object/result shape, DevTools evidence, and abort behavior. The dated amendment preflight observed `151.0.7922.175`; that observation is evidence, not a timeless version pin. Chrome is not substituted for the primary ChatGPT site-tools claim. OpenAI currently documents site tools only in the desktop app's built-in browser; availability depends on account/model/page. If genuine discovery cannot be made reliable, a harness or ordinary Chrome animation cannot be presented as success.

Before release, the early three-run evidence is rerun on the frozen build, and at least one complete genuine-client Supported journey continues through human declaration, Review, visible submission, and matching Receipt. Raw chronological traces remain available; the harness is supplemental only.

## Delivery, Operations, And Release

CI is install/version → fresh migrations → type/lint/contracts → unit/property → parser → integration/races → production build/start → Playwright/a11y/security. A second fresh database proves twice-safe migrations and exactly five tables. Hackathon migrations are additive.

After authorization, create one same-region Vercel/Neon deployment, use provider secrets, run migrations, and record runtime/database versions. `/` is the availability target; no health API. Synthetic load proves thresholds. Selected-plan backup/PITR/log retention is documented, never called minute-60 deletion.

Release freezes commit, lockfile, migrations, deployment, client record, raw traces, evidence, and `devpost-2026-final` tag. Every public action remains separately authorized. Amit approves the OSI license and intended Git identity before push.

## Potential-Impact Evidence

`docs/verification/impact-evidence.md` records exact Supported-client, Conflict-client, and manual/no-WebMCP outcome rows: start, calls/human actions, persistence, clarification/refusal, Review/Receipt, elapsed time, build/client, and automated/developer/external provenance. Tests are never relabelled user validation.

It records each synthetic participant session/clarification; if none, exactly **No user validation occurred**. Future-pilot measures are explicitly unmeasured. No adoption, savings, accuracy, eligibility, ROI, or buyer evidence is invented; contracts require rows, limitations, provenance, and the no-validation statement.

## Official Release Acceptance

These requirements are normative but never authorize an external mutation:

- The working public HTTPS app is usable without payment/restriction and remains available through the official judging period ending September 21, 2026 at 5:00 pm PDT.
- The public GitHub/GitLab/Bitbucket repository points to the frozen release commit and contains every source file, migration, fixture/PDF, asset, configuration, proof document, and reproducible setup/judge instruction needed for Supported, Conflict, and manual paths. An Amit-approved OSI-compatible license is visible at repository top level and About metadata where supported.
- Dated Git history proves this new project was created during the Submission Period beginning August 25, 2026 at 11:00 am PDT. If any prior asset is reused, documentation distinguishes it and proves the meaningful WebMCP extension with dated commits.
- One publicly visible YouTube video is in English (or has English translation), has audible narration, contains a faithful working demo, uses only permitted media/marks, and has encoded duration strictly below 180 seconds; the internal target remains at most 2:50.
- Release evidence names exact ChatGPT desktop application/build, model/account availability, settings, origin, date, Chrome/browser/runtime versions, database/server versions, and every tested client. The Devpost tested-client field matches that evidence exactly.
- The Devpost text explains WebMCP fit, better user experience, what people and agents do together, implementation, human-only boundary, limitations, and truthful development AI use. It links the live URL, repository, and video and includes reproducible judge credentials/instructions if ever needed.
- The complete submission is accepted before `2026-09-03T20:00:00Z` (`2026-09-04 01:30 IST`), not merely sent.
- Public name/license ratification, repository creation/push, provider provisioning, deployment/origin configuration, video upload, Devpost mutation, and outreach require Amit's explicit authorization by `2026-08-30T20:00:00Z` (`2026-08-31 01:30 IST`). Missing authorization is release no-go and never permits inferred authority or reserve erosion.

The video cold open shows one real persisted same-session WebMCP mutation by second 10 and labels it as the later excerpt from the same chronological capture; raw request/session correlation proves causality. The complete unedited trace remains available. Feature freeze is `2026-09-02T20:00:00Z`; the final 24 hours permit regression, hosted/client/accessibility evidence, video, materials, and contingency only.

## Demo And Submission Flow

The locked 2:48 causal video shows: same-session cold-open mutation; packet/three runtime PDFs; pre-consent refusal/Allow; state/rules/evidence; batch/branch/reread/second batch; separate no-change Conflict refusal; human resolution/declaration; assisted Review/access closure; human confirmation; matching Receipt/JSON; proof panel for manual parity, trace, tests, limitations.

Editing preserves captured session/request causality and labels compressed waits. Public video is at most 2:50 and below 180 seconds. Instructions reproduce three paths, name client/settings/date, link frozen commit/app/video, explain WebMCP/human boundary, and match impact evidence.

## Risks And No-Go Triggers

| Risk | Mitigation / no-go |
|---|---|
| Primary ChatGPT site tools unavailable or unreliable | early exact-client spike; stop/reopen scope, never substitute simulation |
| PDF.js tracing/runtime/anchor instability | early four-environment spike; no precomputed fallback |
| Conflict choice inferred from agent metadata | separate allowlist types plus six-way byte equality; any leak blocks stage |
| Local dirty callback defect | local gate; value-free header, authority-first refusal, focus/race tests |
| Admission lock too slow | two-second parser/load/race proof; failure reopens G3 choice |
| Next/WebMCP dependency changes | exact pins and lockfile; no update after freeze without rerunning full gates |
| Public host/database limits | measured authorized hosted runs; sleeping/unavailable is no-go |
| Schedule consumes reserve | G4L capacity rebase, no stretch; defects outrank additions |
| Privacy/accessibility defect | fail relevant stage and remediate before progression |
| Missing release authorization, identity, name, or license | release no-go; build permission never implies publication permission |

## G3 Exit Criteria

G3 requires fewer than 15,000 words, exact capped surfaces, all 40 stories, mechanical preflight, and same-SHA passes from product/accessibility, engineering/security, and WebMCP/judge lanes. Every P0/P1 is fixed and rechecked; every P2 is fixed or accepted. A status-only lock then needs three candidate-hash reproductions.

Until planning review completes, application bytes remain frozen at the v1 witness. Replacement G3/G4L lock is followed by a declared private-ledger rebind; only its exact three-lane pass establishes `local_ready`. Declared HTTP, safe-event, consent, executable-test, mirror, verifier, and manifest units may then run. Their v2 witness, separate erratum-proof digest, and non-vacuous W0-CONTRACTS review precede the 17 absent producers and full W0-C0 closure. No pass is reused or external mutation authorized.
