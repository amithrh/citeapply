# Phase 2A — P0/P1/P2 defect fixes and re-verification

Branch `hackathon-final`, worktree `scratchpad/wt-508940b`, base `d51ce9b`, head `9fff6ac`
(plus this report). Node v24.20.0, npm 11.19.0.
Browser: **Google Chrome 152.0.7977.66**, launched by Playwright with
`channel: "chrome"` and `--enable-features=WebMCPTesting`. Nothing here ran in headless Chromium.
Database: the throwaway cluster `postgresql://citeapply@127.0.0.1:5433/citeapply`
(Phase 1 correction E-1; the user's Postgres.app on :5432 still refuses the Homebrew node binary).
App under test for every browser result below: the **standalone production build**
(`node .next/standalone/server.js`, `PORT=3100`), from a `rm -rf .next && npm run build`.

## 1. What was fixed, with file:line

### D-1 (P0) — assisted mutations are now visible immediately — commit `e07a1fb`
The dispatcher returned the tool result to the agent and stopped, so a successful
`apply_evidence_backed_answers` changed four fields on the server and not one pixel on the page,
and the page kept claiming "Assisted access is allowed" after the server had closed it.

- `src/webmcp/invoke.ts:31-51` — new `AssistedActivityEntry` and `DispatchObserver` types: a
  read-only sink for the page. No capability travels in either direction.
- `src/webmcp/invoke.ts:165-190` — `report()` runs on every dispatch outcome. For the two
  mutating tools it hands the page the `uiSnapshot` from the server's existing
  `mutation_projection` envelope (`onMutationProjection`), or, when the response carried no
  projection, asks the page to re-read (`onMutationUnprojected`). Every call is also recorded for
  the visible activity list.
- `src/app/application/page.tsx:127-141` — `reconcile()` performs exactly the `mode: "snapshot"`
  read the page already uses, with the page capability the page already holds.
- `src/app/application/page.tsx:143-151` — `adoptProjection()` parses the projection with
  `HumanSnapshotV1Schema` before trusting it, and falls back to `reconcile()` if it does not parse.
- `src/app/application/page.tsx:110-118` — adopting a snapshot drops the page's consent capability
  the moment the server stops reporting an allowed Draft.
- `src/app/application/page.tsx:85-88, 361-370, 494` — the banner and the page status line are
  derived from the server's own `draft.assistance`, not from page memory; the consent controller
  is re-keyed on that server value so it can never disagree with it.
- `src/app/application/page.tsx:385-410`, `src/app/globals.css:556-600` — the **Assisted activity**
  list: tool name, outcome code, application revision, requirements version, time. It is a
  projection of the response the page already received.

**No new agent authority.** The agent still sends no capabilities in tool arguments; the
`x-citeapply-page` / `x-citeapply-consent` headers are still injected by the page per invocation
(`src/webmcp/invoke.ts:96-108`), and no tool was added, widened, or relaxed.

### D-2 (P0) — the standalone build now contains a working pdfjs-dist — commit `5be55c5`
- `next.config.ts:72-84` — `outputFileTracingIncludes` for `/api/demo` now also traces
  `node_modules/pdfjs-dist/package.json`, `legacy/build/**` and `standard_fonts/**`.
  `/api/demo` is the only route that reaches the parser
  (`src/server/services/demo.ts` → `src/evidence/extract-claims.server.ts` → `pdf-adapter.server.ts`).

### D-7 (P1) — `npm run dev` works again — commit `f6e7e77`
- `next.config.ts:3-6, 20-23` — `'unsafe-eval'` is added to `script-src` only when
  `process.env.NODE_ENV !== "production"`.

### D-9 (P2) — the unregistered Permissions-Policy feature is gone — commit `e81b34f`
- `next.config.ts:41-43` and `src/server/security/headers.ts:13-15` — `tools=(self)` removed from
  both the page headers and the API headers. (Phase 1 named only `next.config.ts`; the API helper
  carried the same string.)

### D-3 (P1) — infrastructure failure returns a readable JSON outcome — commit `9fff6ac`
- `src/server/security/headers.ts:55-96` — `supportReference()` and `infrastructureUnavailable()`,
  producing the product's existing `temporarily_unavailable` shape at HTTP 503.
- Failure boundaries on every stateful route: `src/app/api/demo/route.ts:206,221`,
  `src/app/api/application/route.ts:297`, `src/app/api/application/actions/route.ts:321`,
  `src/app/api/submission/route.ts:192`, `src/app/api/receipt/route.ts:190`.
- `src/app/page.tsx:16-22, 33, 55, 117-120` — the landing page shows the server's own words, adds
  "This is a temporary problem. Try again in a moment." for a `temporarily_unavailable` code, and
  offers a **Try again** control.
- **`/api/webmcp` deliberately keeps its bare failure.** The bridge already converts a non-JSON
  response into the correct read or mutation outcome (`src/webmcp/invoke.ts:57-79, 216-227`), and a
  mutating tool must never be told a failed call was retry-safe. Changing it would have been the
  weaker answer, not the stronger one.

### New tests
- `tests/e2e/assisted-visibility.spec.ts` (commit `b60f359`) — the D-1 regression spec.
- `tests/e2e/webmcp-journey.spec.ts` — the full 13-step journey for both packets, driven through
  `document.modelContext`. Both launch the installed Chrome channel themselves and **skip with a
  stated reason** when Chrome or `document.modelContext` is unavailable. Screenshots and the tool
  log are written only when `CITEAPPLY_EVIDENCE_DIR` is set; the assertions always run.

## 2. Evidence table (command → exact result)

| # | Command / action | Result |
|---|---|---|
| 1 | `npm run verify:versions` | PASS — `v24.20.0 npm/11.19.0` |
| 2 | `npm run verify:dependencies` | PASS — `18 exact direct dependency pins` |
| 3 | `npm run verify:fixture-hashes` | PASS — `Verified 6 deterministic synthetic one-page PDFs.` |
| 4 | `npm run verify:production-imports` | PASS — `49 source files, no test/golden/generator/fixture/dev-only imports` |
| 5 | `npm run verify:surfaces` | PASS — `gate=W0-C0 manifest=42f69d1d… paths=76` (unchanged from Phase 1) |
| 6 | `npm run typecheck` | PASS — no output |
| 7 | `npm run lint` | PASS — no output, `--max-warnings=0` |
| 8 | `npm run test:all` | PASS — **57/57**, 0 fail, 0 skipped |
| 9 | `rm -rf .next && npm run build` | PASS — 8 routes, standalone output |
| 10 | `npm run verify:built-anti-hardcode` | PASS — `145 production text artifacts` |
| 11 | **D-2**: `find .next/standalone/node_modules/pdfjs-dist -type f \| wc -l` | **27** files: `legacy/build/pdf.mjs`, `pdf.worker.mjs`, `package.json`, 14 `standard_fonts/*.pfb` |
| 12 | **D-2**: start `.next/standalone/server.js` after copying **only** `.next/static` (no hand-copied `pdfjs-dist`), then `POST /api/demo` | `{"ok":true,"data":{"kind":"started",…}}` for **`supported`** and for **`conflict`** |
| 13 | **D-7**: `npx next dev -p 3100`, landing page in real Chrome | Heading renders, `Start supported packet` navigates to the Application; zero CSP console errors (only a favicon 404). `d7-dev-landing-buttons-work.png` |
| 14 | **D-7**: `curl -sI http://localhost:3100/` against the production standalone build | `script-src 'self' 'unsafe-inline'` — **no `'unsafe-eval'`** |
| 15 | **D-9**: same `curl -sI`, page and `/api/demo` | `Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=(), usb=(), browsing-topics=()` |
| 16 | **D-9**: landing page console in real Chrome | Only `404 (Not Found)` (favicon). No `Permissions-Policy` / `'tools'` error. `d9-landing-console-clean.png` |
| 17 | **D-3**: `DATABASE_URL=…127.0.0.1:5999…`, `GET /api/demo` | `HTTP/1.1 503` + `{"ok":false,"error":{"code":"temporarily_unavailable","message":"CiteApply could not prepare a synthetic start.","supportReference":"CA-HNESYJNM","safeActions":["return_to_packet_selection"]}}` |
| 18 | **D-3**: same, `POST /api/demo` | `HTTP/1.1 503` + `…"message":"CiteApply could not start this synthetic application.","supportReference":"CA-2D3JSNEZ"…` |
| 19 | **D-3**: landing page against the dead database, real Chrome | Alert reads the server message + "This is a temporary problem. Try again in a moment."; a **Try again** button is present. `d3-database-outage-landing.png` |
| 20 | `APP_ORIGIN=… npx playwright test tests/e2e tests/accessibility` | **20 passed, 1 skipped, 0 failed** (19.3 s) |
| 21 | **D-1**: real-Chrome 13-step journey, **supported** packet | Completed to receipt. 15 screenshots. |
| 22 | **D-1**: real-Chrome 13-step journey, **conflict** packet | Completed to receipt. 15 screenshots. |

### The 20/1 breakdown
16 of the passing tests are the Phase 1 baseline set, unchanged. The 4 new ones are the 2 specs in
`assisted-visibility.spec.ts` and the 2 packet runs in `webmcp-journey.spec.ts`. The single skip is
still `tests/e2e/raw-genuine-client-chronology.spec.ts:37`
(`CITEAPPLY_GENUINE_TRACE_FILES_JSON` unset — it needs three real, unedited ChatGPT-desktop capture
files that only the user can produce). **No test was weakened, loosened, or deleted.**

## 3. The 13-step journey, re-driven in real Chrome, both packets

Screenshots in this directory; every tool request/response pair is verbatim in `tool-log.md`.

| Step | Supported | Conflict | Evidence |
|---|---|---|---|
| 1–2 packet start, runtime PDF parse, form opens | PASS | PASS | `*-step01-landing.png`, `*-step02-form-open.png` |
| 3 all six tools discovered; protected calls before consent | PASS | PASS | `getTools()` returns exactly the six names; 4 × `consent_required`; redacted state discloses no field ids. `*-step03-pre-consent-refusals.png` |
| 4 disclosure dialog + Allow | PASS | PASS | `*-step04a-consent-dialog.png`, `*-step04b-access-allowed.png` |
| 5 read state / requirements / evidence, version-checked batch | PASS | PASS | `apply_evidence_backed_answers` → `ok:true` |
| 6 **the form updates visibly**, guardian branch reveals | **PASS** | **PASS** | `*-step06-after-assisted-batch-VISIBLE.png`. Readiness goes to "of 8", `guardian name` appears, the unlinked-row count drops, and the full-page screenshot bytes differ (asserted in the spec) |
| 6b agent re-reads active requirements and binds the branch | PASS | PASS | `*-step06b-branch-bound.png` |
| 7 income | binds (`ok:true`) | **refused** `conflict_requires_human`, revision unchanged, "Two accepted sources disagree. You decide." still shown | `*-step07-income.png` |
| 8 agent proposes the `.test` email; field stays undeclared | PASS | PASS | page shows "not yet declared". `*-step08-…png` |
| 9 premature `prepare_submission_review` fails closed | PASS (`declaration_required`) | PASS (**both** `conflict_requires_human` and `declaration_required`) | `*-step09-premature-prepare-refused.png` |
| 10 applicant decides in the visible UI only | PASS | PASS (chooses the income source, then declares) | `*-step10-human-decisions.png` |
| 11 agent prepares; **assisted access closes and the page says so** | **PASS** | **PASS** | Review appears with no reload; "Assisted access is allowed for this page and session." is gone (asserted `toHaveCount(0)`); "Assisted access is closed while you review it." is shown; the next protected read returns `consent_required`. The tool result contains no `contentHash`. `*-step11-review-assistance-closed.png` |
| 12 Return invalidates; manual Prepare reaches the same Review | PASS | PASS (Review shows **both** disagreeing excerpts) | `*-step12a-returned-to-draft.png`, `*-step12b-manual-review.png` |
| 13 one atomic submission; receipt | PASS | PASS + "Income evidence differed and was resolved by the applicant." | `*-step13-receipt.png` |

### D-1 proven the way Phase 1 disproved it
Phase 1's `supported-step04b-access-allowed.png` and `supported-step06-…png` shared the identical
MD5 `80f7e1270dfb0c7019ad5bc68b66c54d`. The same two frames now:

```
286833e2de1d335a43317fdb818e7887  supported-step04b-access-allowed.png
f921a667d5990a3c1f504d9e7cca615f  supported-step06-after-assisted-batch-VISIBLE.png
514402145e64f0967868e04d3afa931f  conflict-step04b-access-allowed.png
372acab152ca1f2b6b941ec58a49b74d  conflict-step06-after-assisted-batch-VISIBLE.png
```

### Console during the journeys
`supported-console-errors.txt` / `conflict-console-errors.txt` contain only one favicon `404` and
the HTTP status lines Chrome logs for the product's own deliberate refusals (`403` for
`consent_required`, `409` for `conflict_requires_human` / `not_ready_for_review`). No CSP error, no
Permissions-Policy error, no page error.

## 4. Reproducing this

```sh
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
export DATABASE_URL=postgresql://citeapply@127.0.0.1:5433/citeapply
export APP_ORIGIN=http://localhost:3100
export CITEAPPLY_MASTER_KEY=<from .env.local>

rm -rf .next && npm run build
cp -R .next/static .next/standalone/.next/static      # still required; see D-12, not fixed
PORT=3100 HOSTNAME=127.0.0.1 node .next/standalone/server.js &

psql "$DATABASE_URL" -c "delete from rate_buckets where family='counter';"   # sentinels untouched
npx playwright test tests/e2e tests/accessibility
CITEAPPLY_EVIDENCE_DIR=docs/evidence/phase2a npx playwright test tests/e2e/webmcp-journey.spec.ts
```

`pdfjs-dist` is **not** copied by hand any more. `.next/static` still is — Next does not place it in
the standalone tree, and that is documented, not fixed (D-12).

## 5. What is NOT verified

- **D-4, D-5, D-6, D-8, D-10, D-11, D-12 were not in scope for this phase and are untouched.**
  The receipt still has no JSON download, no print view and no way back (D-4); the income excerpts
  are still absent at the moment of choice (D-5); `test:a11y` still runs no axe scan, so there is
  still **no** evidence for "zero axe violations" (D-6); `npm run verify:file-structure` still fails
  (D-8); raw `true` / `540000` values are still shown to humans (D-10); the copy still drifts from
  scope.md (D-11); `.next/static` still needs a manual `cp -R` (D-12).
- **Any deployed or HTTPS origin.** Everything is `http://localhost:3100`. `__Host-` cookie
  behaviour over HTTPS, HSTS and the production headers on a real domain remain unverified.
- **The ChatGPT in-app browser.** Untouched; only the user can test it.
- **The user's own Postgres.app database on :5432.** Every result came from the :5433 throwaway
  cluster. I changed no system or security setting.
- **Rate limiting under real pressure.** I cleared the `counter` rows (sentinels untouched) before
  each browser run and never observed `at_capacity`; the friendly at-capacity copy is still unproven.
- **Session expiry at minute 50, and a second-tab takeover.** Not exercised. Phase 1's finding that
  no expiry copy exists in `src/app/application/page.tsx` still stands.
- **Refresh mid-journey.** Not re-tested this phase. Note that the fix changes the earlier picture:
  a reload no longer costs the agent's work, but it still costs assisted consent, because the
  consent capability lives in page memory by design.
- **Mobile widths, print output, dark mode.** Not looked at.
- **The `onMutationUnprojected` fallback path** is implemented and typechecked but was never
  exercised in a browser: every mutating call in both journeys returned a `mutation_projection`
  envelope, which is the designed behaviour. The fallback is untested at runtime.
- **`/api/webmcp` under a database outage** was not curled; the argument for leaving it bare is
  reasoning about `src/webmcp/invoke.ts`, not an observed result.
