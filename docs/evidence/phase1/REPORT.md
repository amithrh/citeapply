# Phase 1 — Baseline and real-browser proof

Commit under test: branch `hackathon-final` at `4af50ca`; `git diff 508940b..HEAD -- src tests
next.config.ts package.json db scripts` is **empty**, so all product code is exactly `508940b`.
Date: 2026-09-03 (07:40–08:15 IST). Node v24.20.0, npm 11.19.0.
Browser: **Google Chrome 152.0.7977.66** with WebMCP enabled.
Artifacts: 21 full-page screenshots and `tool-log.md` / `tool-log.json` in this directory.

## 0. Two environment findings that gate everything

**E-1 — The local Postgres.app database refuses connections from the app server.**
`psql` works, but every connection the Next server opens is denied by Postgres.app's
GUI permission hook and stalls until pg's 2 s `connectionTimeoutMillis` fires:

```
FATAL: Postgres.app failed to verify "trust" authentication
DETAIL: auth_permission_dialog: /opt/homebrew/Cellar/node@24/24.20.0/bin/node is not allowed to
        connect without a password because system('.../PostgresPermissionDialog' ...) terminated with signal 15.
```
(`/Users/amitmishra/Library/Application Support/Postgres/var-16/postgresql.log`)

This is **not a product defect** — it is why the four `@journey` Playwright specs failed for
Fable too, and the "missing `APP_ORIGIN`" diagnosis in HACKATHON-PLAN.md is wrong: I exported
`APP_ORIGIN=http://localhost:3100` and they still failed. Docker is not running on this Mac, so
I started a throwaway Homebrew PostgreSQL 17.9 cluster on **port 5433** (datadir
`…/scratchpad/pgdata`, user `citeapply`, socket dir `/tmp/ca-sock`, `LC_ALL=C`) and applied all
five migrations in order with `-v ON_ERROR_STOP=1`. Everything below ran against
`DATABASE_URL=postgresql://citeapply@127.0.0.1:5433/citeapply`.
**Action for the user:** either approve node in Postgres.app → Settings → App Permissions, or
start Docker and use `compose.yaml`. I did not change any system or security setting.

**E-2 — The WebMCP flag is on, and it can be scripted.**
`chrome://flags/#enable-webmcp-testing` is enabled in the user's Chrome profile
(`typeof document.modelContext === "object"`, prototype exposes
`getTools`, `executeTool`, `registerTool`, `ontoolchange`). I also determined the launch-flag
equivalent — **`--enable-features=WebMCPTesting`** — which is what makes the whole journey
scriptable in real Chrome. (`WebMcpTesting` and `ModelContextAPI` do not work.) This belongs in
the README and the judge instructions.

## 1. Evidence table (command → exact result)

| # | Command | Result |
|---|---|---|
| 1 | `npm run verify:versions` | **PASS** — `v24.20.0 npm/11.19.0` |
| 2 | `npm run verify:dependencies` | **PASS** — `18 exact direct dependency pins` |
| 3 | `npm run verify:fixture-hashes` | **PASS** — `Verified 6 deterministic synthetic one-page PDFs.` |
| 4 | `npm run verify:production-imports` | **PASS** — `49 source files, no test/golden/generator/fixture/dev-only imports` |
| 5 | `npm run verify:surfaces` | **PASS** — `gate=W0-C0 manifest=42f69d1d… paths=76 surfaces={"userPages":2,"apiFamilies":4,"productTables":5,"raceFamilies":4,"webmcpTools":6}` |
| 6 | `npm run verify:file-structure` | **FAIL** — `Candidate tree does not match W0-C0` + 14 `unexpected:` / 7 `future:` entries (`src/app/api/receipt/route.ts`, `src/domain/review.ts`, `tests/e2e/applicant-journey.spec.ts`, …). Stale scaffolding gate; see D-8. |
| 7 | `npm run typecheck` | **PASS** — no output |
| 8 | `npm run lint` | **PASS** — no output, `--max-warnings=0` |
| 9 | `npm run test:all` | **PASS — 57/57**, 0 fail, 0 skipped, 25.3 s |
| 10 | `npm run build` | **PASS** — 8 routes, standalone output |
| 11 | `npm run verify:built-anti-hardcode` | **PASS** — `123 production text artifacts` |
| 12 | `PORT=3100 node .next/standalone/server.js` | **Starts, but every packet start returns `document_unavailable`** until `node_modules/pdfjs-dist` is copied into `.next/standalone/node_modules/`. See **D-2 (P0)**. |
| 13 | `npx playwright test tests/e2e tests/accessibility` (`APP_ORIGIN` exported, counters cleared) | **16 passed, 1 skipped, 0 failed** (10.4 s) |
| 14 | Real-Chrome 13-step journey, **supported** packet | **Completed to receipt.** 10 screenshots, 18 tool calls logged. |
| 15 | Real-Chrome 13-step journey, **conflict** packet | **Completed to receipt.** 11 screenshots, 20 tool calls logged. |
| 16 | Idempotent replay: same `requestId`, same args, twice | **PASS** — both return `applicationRevision: 3`; state confirms one effect, not two. |

### Why it is 16/17 and not 17/17
The one skip is `tests/e2e/raw-genuine-client-chronology.spec.ts:37` —
`@genuine-client validates three unedited primary-client chronologies`. It skips itself when
`CITEAPPLY_GENUINE_TRACE_FILES_JSON` is unset, with the reason
`"G5B-L remains unproven until three actual ChatGPT desktop trace files are supplied."`
**17/17 is unreachable by any agent**: it requires three real, unedited ChatGPT-desktop capture
files that only the user can produce. It is a deliberate honesty gate, not a bug. Treat the
target as **16 passed + 1 documented skip**.

## 2. Real-Chrome journey — what actually happened

All 13 steps were driven twice (supported, conflict) through `document.modelContext` using the
Chrome 151/152 contract (`getTools()` is a Promise; `executeTool(toolObject, jsonString)`).

| Step | Supported | Conflict | Evidence |
|---|---|---|---|
| 1–2 packet start, runtime PDF parse, form opens | ✅ | ✅ | `step01-landing.png`, `*-step02-form-open.png` |
| 3 all six tools discovered; protected calls pre-consent | ✅ | ✅ | 4 × `consent_required`, `get_application_state{redacted}` returns only `{access:"consent_required"}` — no values leaked |
| 4 disclosure dialog + Allow | ✅ | ✅ | `*-step04a-consent-dialog.png`, `*-step04b-access-allowed.png` |
| 5 read state / requirements / evidence index, version-checked batch | ✅ | ✅ | `apply_evidence_backed_answers` → `updatedFields:["legal_name","student_id","institution","dependency"]`, `rereadRequirements:true` |
| 6 **form updates visibly**, guardian branch reveals | ❌ **FAILS** (server side is correct: `activeFieldCount` 6→8) | ❌ **FAILS** | `*-step06-after-assisted-batch-NO-VISIBLE-UPDATE.png` — see **D-1 (P0)** |
| 7 income binding refused, nothing changes | n/a | ✅ | `conflict_requires_human`; revision stays `2`; a mixed batch containing a valid `legal_name` bind was also refused **atomically** |
| 8 agent proposes `.test` email, field stays "Needs your declaration" | ✅ | ✅ | field status `needs_declaration` with the value present |
| 9 premature `prepare_submission_review` fails closed | ✅ (declaration blocker) | ✅ (**both** `conflict_requires_human` and `declaration_required`) | `not_ready_for_review` with the blocker list |
| 10 human inspects excerpts, picks a source with a reason, declares email | ⚠️ partial | ⚠️ partial | Resolution and declaration work; **the two income excerpts are not shown at the moment of choice** — see **D-5 (P1)** |
| 11 agent prepares Review, assisted access closes, review appears only in UI; manual parity | ✅ server-side; ❌ visibly | ✅ server-side; ❌ visibly | Post-prepare protected read → `consent_required` (access closed). Manual `Prepare review` produced Review `JCH07CCE8J` with **the same content hash `7538ac5ecdf69dae…`** as agent-prepared Review `WVAQNM7NMY` — parity proven. But the page kept showing the Draft and still said "Assisted access is allowed" — see **D-1**. |
| 12 inspect review; Return invalidates; confirm commits | ✅ (`Return to draft` withdrew the frozen review, manually verified; also covered by the passing spec) | ✅ | `*-step11b-review.png` |
| 13 one atomic submission; receipt | ✅ receipt with matching hash | ✅ receipt + "Income evidence differed and was resolved by the applicant." | `*-step13-receipt.png` |
| 13 JSON download + print view semantically equal | ❌ **absent** | ❌ **absent** | The receipt screen contains **zero** buttons or links (`document.querySelectorAll('a,button')` → `[]`). See **D-4 (P1)**. |

Safety boundary held everywhere I pushed on it. Two results are worth quoting to a judge:
`annual_household_income` after the human resolved it reads, to the agent,
`{"field":"annual_household_income","status":"ready","resolution":"human_completed","humanActionComplete":true}`
— readiness without the chosen value or the reason; and the Review shows **both** disagreeing
excerpts (`"INR 540,000"` chosen, `"INR 480,000"` not), not just the winner.

## 3. Ranked defect list

### P0 — blocks the demo

**D-1. Assisted tool mutations never reach the visible page.**
`src/app/application/page.tsx:139-145` builds the bridge with
`createCiteApplyDispatch(...)` and nothing else; `src/webmcp/invoke.ts:121-125` returns the
parsed response to the tool caller and stops. There is no snapshot re-read, no
`mutation_projection` consumer, no polling. Consequences observed in real Chrome:
- After a successful `apply_evidence_backed_answers` (`applicationRevision` 2→3, four fields
  updated) the form still reads "0 of 6 required answers are ready" and "Not linked yet". A
  page reload is required to see the agent's work — and the reload **drops the consent
  capability**, so the applicant must re-authorize before the agent can continue.
- After a successful `prepare_submission_review` the page still shows the Draft **and still
  says "Assisted access is allowed for this page and session"**, which is false: the server had
  already closed assistance (the very next protected read returned `consent_required`). The
  page is asserting an authority state it no longer has.

The screenshots prove it byte-for-byte: `supported-step04b-access-allowed.png` and
`supported-step06-after-assisted-batch-NO-VISIBLE-UPDATE.png` have the identical MD5
`80f7e1270dfb0c7019ad5bc68b66c54d` — four fields were bound on the server and not one pixel
changed. The conflict pair is identical too.

This breaks journey step 6 outright, breaks the "agent did this" moment the video depends on,
and is a trust defect, not only a polish one. The Phase 2 "Assisted activity" panel is
worthless until this is fixed. **Fix first.**

**D-2. The standalone build ships a broken `pdfjs-dist`, so every packet start fails.**
`next.config.ts:57` marks `pdfjs-dist` as a server-external package and `:58` traces only
`fixtures/packets/**/*.pdf`. Next's file tracing copies only
`.next/standalone/node_modules/pdfjs-dist/legacy/build/pdf.mjs` — no `pdf.worker.mjs`, no
`standard_fonts/`, not even `package.json`. Next's `server.js:12` does `process.chdir(__dirname)`,
so `STANDARD_FONT_DATA_PATH` (`src/evidence/pdf-adapter.server.ts:19`) also resolves inside the
standalone tree. Result: `POST /api/demo` → `503 {"code":"document_unavailable"}` on **every**
start of a freshly built server. I reproduced this on two clean builds and fixed it only by
`cp -R node_modules/pdfjs-dist .next/standalone/node_modules/pdfjs-dist`.
HACKATHON-PLAN.md warns that a deployment dropping the PDFs fails every start — the PDFs are
fine; **the parser is what gets dropped**. Vercel will hit this. Fix by adding
`node_modules/pdfjs-dist/**` to `outputFileTracingIncludes` for `/api/demo` (and verifying with
a from-scratch `next build` + standalone start, not `next dev`).

### P1 — a judge will notice

**D-3. A database outage returns a bare HTTP 500 with an empty body.**
While the DB was unreachable, `POST /api/demo` answered `500` with no JSON payload and the
landing page rendered only "CiteApply could not start this synthetic demo." The graceful
`at_capacity` / `document_unavailable` shapes exist; the infrastructure-failure path does not use
one. Recovery requires guessing. (Reproduced 8× in `/tmp/citeapply-3100.log`.)

**D-4. The receipt is a dead end: no JSON download, no print view, no way back.**
Journey step 13 requires "receipt screen, JSON download, and print view are semantically equal".
The receipt screen has **no interactive elements at all**, and `src/app/globals.css` (555 lines)
contains **zero** `@media print` rules. `/api/receipt` is only used to re-hydrate after reload
(`src/app/application/page.tsx:271`); nothing exposes it to the applicant.

**D-5. The income excerpts are not visible where the decision is made.**
At the conflict prompt the applicant sees "Use household: 480000" and "Use income: 540000" —
two bare integers and a reason dropdown. The source excerpts (`Synthetic Income Statement:
"INR 540,000"`) only appear later, inside the frozen Review. The product's whole claim is
"inspect both excerpts, then decide"; right now you decide first and read the evidence
afterwards. (`conflict-step10a-after-reload.png`.)

**D-6. `test:a11y` performs no accessibility testing.**
`@axe-core/playwright@4.13.0` is a pinned devDependency and `grep -rn axe tests src` returns
exactly one unrelated hit (`tests/security/safe-events.test.ts:691`, the word "axes").
`npm run test:a11y` runs `tests/accessibility/consent-kernel.test.ts`, which is a consent-authority
suite, not an axe scan. Phase 2's "zero axe violations on landing, application, review, receipt"
currently has no test behind it. Do not claim a11y coverage until one exists.

**D-7. `next dev` is unusable, so the README's local-dev path is broken.**
The CSP at `next.config.ts:16` is `script-src 'self' 'unsafe-inline'` with no `'unsafe-eval'`.
Next's dev bundle evals, so the landing page dies at hydration with
`Evaluating a string as JavaScript violates the following Content Security Policy directive…`
and no button works. Verified in Chromium against `npm run dev -- -p 3100`. Phase 5's
fresh-clone reviewer will hit this in the first two minutes. (Do **not** add `'unsafe-eval'` to
production; make the directive development-conditional.)

### P2 — worth fixing if time allows

**D-8. `npm run verify:file-structure` fails.** It pins the tree to gate `W0-C0` and now reports
14 `unexpected:` and 7 `future:` paths for files that shipped long ago (review, submission,
receipt, e2e specs, `docs/verification/genuine-chrome-webmcp.md`). `verify:surfaces` — the same
script with `--surfaces` — passes. Either retire the gate or advance it; leaving a red verify
script in the repo invites a judge to run it.

**D-9. `Permissions-Policy: tools=(self)` is not a real feature** (`next.config.ts:34`) and Chrome
logs `Error with Permissions-Policy header: Origin trial controlled feature not enabled: 'tools'`
on every page load. A judge opening DevTools sees a red console on the landing page.

**D-10. Raw domain values are shown to humans.** `DEPENDENCY: true` and
`ANNUAL HOUSEHOLD INCOME: 540000` appear in the Answers list, the Review and the conflict
buttons — booleans and unformatted integers where "Yes" and "₹5,40,000" belong.

**D-11. UI copy and scope.md drift.** The plan's step 12 names "Return to application" and
"Confirm and submit this review"; the buttons say "Return to draft" and "Submit this
application". Pick one vocabulary before the video script is written.

**D-12. `.next/standalone` needs `.next/static` copied by hand.** Documented in the plan, but the
README/DEPLOYING docs should carry the two `cp -R` lines (static **and** `pdfjs-dist`, per D-2).

## 4. Explicitly NOT verified

- **17/17.** Never achieved and not achievable here — see the skip analysis above.
- **The ChatGPT in-app browser.** Untouched. Only the user can test it.
- **Any deployed/HTTPS origin.** Everything is `http://localhost:3100`. `__Host-` cookie
  behaviour over HTTPS, HSTS, and the production security headers are unverified.
- **The user's own Postgres.app database.** All results come from a throwaway cluster on
  port 5433. The five migrations were applied fresh; I did not re-run anything against
  `localhost:5432`.
- **Rate limiting under real pressure.** I cleared the `counter` rows (sentinels untouched)
  before each run and never observed `at_capacity`. The friendly at-capacity copy is unproven,
  and I found no `at_capacity`/`capacity` string in either page component.
- **Session expiry at minute 50.** I found no expiry copy in `src/app/application/page.tsx` and
  no test hook. Treat "the copy exists" as **false until someone points at the line**.
- **Stale page after a second-tab takeover.** Not exercised by hand. The `stale_page` error shape
  exists and appeared once (a redacted read after submission), but the two-tab scenario is untested.
- **Refresh mid-journey keeps saved state.** Partly proven as a side effect of D-1: reloads
  preserved every saved answer. But the reload **loses assisted consent**, which is not the same
  as "keeps state".
- **Mobile widths, print output, dark mode.** Not looked at.
- **Screenshots of the hand-driven Claude-in-Chrome session.** Those ran in the user's own Chrome
  profile and the MCP screenshot tool did not write to a path I could reach; the 21 PNGs here are
  the same journey re-driven through **the same Chrome 152 binary** via Playwright
  `channel: "chrome"` with `--enable-features=WebMCPTesting`. `tool-log.md` is verbatim from that
  run. Nothing here is from headless Chromium.

## 5. Recommended Phase 2 order

1. **D-1** — reconcile the visible snapshot after every assisted mutation (and derive the
   assisted-access banner from server truth, not local state). Nothing else matters until a judge
   can *see* the agent work.
2. **D-2** — trace `pdfjs-dist` into the standalone output; re-verify with a from-scratch build.
   Phase 3 cannot deploy without this.
3. **D-7** — make the CSP dev-aware, or Phase 5 fails at the first `npm run dev`.
4. **D-4**, **D-5**, **D-3**, **D-6** — receipt affordances, excerpts at the decision point,
   the outage path, and a real axe scan.
