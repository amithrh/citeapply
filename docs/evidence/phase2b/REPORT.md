# Phase 2B — the product a judge meets

Branch `hackathon-final`, worktree `scratchpad/wt-508940b`, base Phase 2A (`9fff6ac` + the
journey spec), this phase is the nine commits `d3493b9`…`bf672ff` plus this report.
Node v24.20.0, npm 11.19.0.
Browser: **Google Chrome 152.0.7977.66**, launched by Playwright with `channel: "chrome"`
and `--enable-features=WebMCPTesting`. Nothing below ran in headless Chromium except the
four `applicant-journey` specs, the two `receipt-delivery` specs and the landing axe scan,
which are deliberately WebMCP-free (they prove the manual path).
Database: the throwaway cluster `postgresql://citeapply@127.0.0.1:5433/citeapply`
(Phase 1 correction E-1).
App under test for every browser result: the **standalone production build** from a
`rm -rf .next && npm run build`, started as
`PORT=3100 HOSTNAME=127.0.0.1 node .next/standalone/server.js`.

## 1. The nine commits, with file:line

| Commit | Item | What changed |
|---|---|---|
| `d3493b9` | **D-5 (P1)** | Both income excerpts at the moment of decision |
| `8f36533` | **D-10** | Human-readable values |
| `f6e2ac2` | **D-4 (P1)** | Receipt affordances |
| `df7eff1` | Landing | A first minute a judge can use |
| `ce4fbfd` | Application | The human/agent boundary made visible |
| `a8ff3cf` | Review + receipt | Finished documents |
| `1297ecf` | **D-6 (P1)** | A real axe scan, and the one violation it found |
| `2006c33` | **D-12 + D-8** | `.next/static` documented; the red verify command retired |
| `bf672ff` | **D-11** | Docs aligned to the final on-screen labels |

### D-5 — the applicant reads both records before choosing (`d3493b9`)
Phase 1: *"you decide first and read the evidence afterwards"* — two bare integer buttons.

- `src/app/application/page.tsx:51-62` — `SourceExcerpt`, the record title plus its own
  words, as the applicant sees them.
- `src/app/application/page.tsx:585-604` — the handles a screen needs: both claims of an
  unresolved conflict, and every claim a saved answer already cites.
- `src/app/application/page.tsx:607-645` — the loader. It reads
  `POST /api/application {mode:"evidence_excerpt", claimHandle}` on the page's **own page
  capability**. That mode is a pre-existing human-only route mode
  (`src/contracts/http.ts:1205-1209`, `src/app/api/application/route.ts:243-262`); no tool
  was added, no descriptor touched, nothing new is reachable from the agent surface.
- `src/app/application/page.tsx:940-1010` — the conflict row is now two candidate records
  side by side: title, the excerpt verbatim in quotes, what that excerpt reads as in
  rupees, and a button that names the source — **Use the Synthetic Income Statement** —
  not the number.
- `src/app/globals.css:707-775` — the candidate cards.
- `tests/e2e/applicant-journey.spec.ts:79-82` — a new assertion that both excerpts are
  visible **before** the resolution click, not only in the Review afterwards.

### D-10 — values a person can read (`8f36533`)
- `src/app/application/page.tsx:85-124` — `fieldLabel` (sentence case, `id` → `ID`),
  `RUPEES` (`Intl.NumberFormat("en-IN", {style:"currency", currency:"INR"})`), and
  `displayValue` (boolean → Yes/No; income → ₹5,40,000; other numbers → `en-IN` grouping).
- Applied in the answers list, the conflict candidates, the Review and the Receipt.
- `src/app/globals.css:218-225` — `dt` no longer `text-transform: uppercase`, so the
  sentence case is actually visible. The all-caps micro-labels on `label span` and
  `.decide label` went the same way.
- **Nothing stored or hashed changed.** The formatting is computed by `Intl`, never a
  literal, so `npm run test:security` (which forbids `540000`, `INR 540,000` and the rest
  in `src/`) and `verify:built-anti-hardcode` both still pass — rows 8 and 10 below.
  `src/contracts`, `src/domain`, `src/server`, `src/evidence` and `src/webmcp` are
  byte-identical across this whole phase (row 21).

### D-4 — the receipt is a document (`f6e2ac2`)
Phase 1: the receipt screen contained **zero** interactive elements and `globals.css` had
**zero** `@media print` rules.

- `src/app/application/page.tsx:496-517` — `loadDelivery()` re-reads `/api/receipt` in
  `export_json` or `prepare_print` mode. Both modes already existed in the contract
  (`src/contracts/http.ts:1682-1686`) and both write nothing.
- `src/app/application/page.tsx:519-543` — **Download JSON** serves the canonical
  `citeapply-receipt-v1` record straight from that read, as `citeapply-receipt-<id>.json`.
- `src/app/application/page.tsx:545-556` — **Print** calls `prepare_print`, then
  `window.print()`.
- `src/app/application/page.tsx:711-733` — the delivery row, including
  **Start a new synthetic demo**.
- `src/app/globals.css:807-860` — a real `@media print` block: `[data-print="hide"]` and
  the masthead status line are dropped, the receipt loses its screen chrome, rows get
  `break-inside: avoid`.
- `tests/e2e/receipt-delivery.spec.ts` — the assertion the task asked for: the file is
  downloaded, parsed, its `schema` checked, and **every accepted value and every cited
  excerpt in that file is asserted visible on screen**, then asserted still visible under
  `emulateMedia({media:"print"})` while **Download JSON** and **Assisted activity** are
  asserted hidden.

### Landing (`df7eff1`)
`src/app/page.tsx:87-190`. Headline **"The agent cites. You decide."**; three sentences
saying what it is, why WebMCP, and where authority stops; two packet cards with one-line
descriptions, the Conflict one marked `.interesting` and wearing the ochre the product
reserves for a decision it will not make (`src/app/globals.css:862-894`); a **Try it with
an agent** box with `chrome://flags/#enable-webmcp-testing`, the launch switch
`--enable-features=WebMCPTesting`, three prompts to say in order, and what the refusal
looks like; one line saying everything is synthetic.

### Application page (`ce4fbfd`)
- `src/app/application/page.tsx:779-801` — **Where the assistant stops**: two columns,
  *What the assistant may do* on the teal evidence rule, *What only you can do* on the
  ochre judgment rule. Both are projected from `ASSISTED_ACCESS_CATALOG`, the same
  constant the consent dialog renders, so the visible boundary cannot drift from what was
  consented to.
- `src/app/application/page.tsx:806-820` — readiness leads with the count and a gauge
  (`aria-hidden`; the count is the accessible text).
- `src/app/application/page.tsx:126-140, 918-933` — every saved answer now carries the
  record it rests on and that record's words.
- `src/app/application/page.tsx:1029-1070` — the Assisted activity panel: newest first, an
  outcome badge per call, a `<time>` stamp, revision and requirements version when the
  response carried them. It now lives **outside** the stage branch, so the transcript
  survives onto the Review and the Receipt.
- `src/app/globals.css:565-624` — badges: teal for `ok`, ochre for every refusal
  (`li:not([data-outcome="ok"])`).
- Loading and failure for the source excerpts are stated, not silent
  (`src/app/application/page.tsx:944-955`).

### Review and receipt (`a8ff3cf`)
`src/app/application/page.tsx:170-231` — one `FrozenRow` component renders both the frozen
Review and the Receipt, so screen, file and paper cannot drift. Where the applicant
resolved the disagreement the row says so in their terms — *"You chose the Synthetic
Income Statement because it is the more recent source."* — and keeps both excerpts, the
chosen one marked and the other marked *not chosen* (`src/app/globals.css:927-966`). That
block wears the judgment ochre: the one value on the document that no source produced is
the one that looks different.

### D-6 — a real axe scan (`1297ecf`)
`tests/accessibility/axe-scan.test.ts`. Landing, the Conflict draft, the assisted-access
disclosure dialog, the ready draft, the frozen Review and the Receipt, all against
`wcag2a wcag2aa wcag21a wcag21aa`, failing with the rule id and offending nodes printed.
The application walk drives the installed Chrome channel with WebMCP enabled, because the
disclosure dialog is only offered when the tools can register; it skips with a stated
reason when Chrome is absent. The existing `consent-kernel.test.ts` is untouched.

**The scan found one real defect, and it is fixed.** The applicant's resolution line, ochre
`#a75a06` on the receipt's teal ground `#e4f0ef`, measured **4.38:1** against a 4.5:1
requirement. `src/app/globals.css:17` — the judgment ochre is darkened to `#8c4b05`, which
clears 4.5:1 on every ground it appears over. Second run: zero violations on all six
screens.

### D-12 and D-8 (`2006c33`)
- `README.md` "Run the production build" — the
  `cp -R .next/static .next/standalone/.next/static` line with the reason: `next build`
  with `output: "standalone"` deliberately leaves the client bundles outside the standalone
  tree and expects the deploy step to copy them, and the standalone server chdirs into its
  own directory, so without it the HTML renders and every `/_next/static/…` request 404s —
  an unstyled page whose buttons do nothing.
- `package.json` — `verify:file-structure` **removed**. It pinned the tree to gate `W0-C0`
  and reported files that shipped long ago as `unexpected`, so it could only fail. I did
  **not** edit `tests/contract/file-structure-producers.json` to make it pass: that
  manifest is frozen by a hash in `tests/contract/frozen-contract-hashes.json` and
  advancing it would have meant rewriting a frozen contract to satisfy a stale gate. The
  surface inventory the same script computes stays as `npm run verify:surfaces`, which
  passes, and is now listed in the README's verify block. The repo no longer ships a red
  verify command.

### D-11 (`bf672ff`)
`README.md`, `docs/JUDGE-TESTING.md`, `docs/VIDEO-SCRIPT.md` all named controls that no
longer exist (`Use <document>: <value>`, `Why this source`, the `Apply with synthetic
records` headline) and still said Chrome 151 with 152 pending. All three now match the
screen, and the video script no longer assumes DevTools is the only place a judge can see a
tool call land — it uses the Assisted activity panel.

## 2. Evidence table (command → exact result)

Every row below was run after the final commit, against the fresh standalone build.

| # | Command / action | Result |
|---|---|---|
| 1 | `npm run verify:versions` | PASS — `v24.20.0 npm/11.19.0` |
| 2 | `npm run verify:dependencies` | PASS — `18 exact direct dependency pins` |
| 3 | `npm run verify:fixture-hashes` | PASS — `Verified 6 deterministic synthetic one-page PDFs.` |
| 4 | `npm run verify:production-imports` | PASS — `49 source files, no test/golden/generator/fixture/dev-only imports` |
| 5 | `npm run verify:surfaces` | PASS — `gate=W0-C0 manifest=42f69d1d… paths=76 surfaces={"userPages":2,"apiFamilies":4,"productTables":5,"raceFamilies":4,"webmcpTools":6}` (unchanged from Phase 1 and 2A) |
| 6 | `npm run typecheck` | PASS — no output |
| 7 | `npm run lint` | PASS — no output, `--max-warnings=0` |
| 8 | `npm run test:all` | PASS — **57 tests, 57 pass, 0 fail, 0 skipped** |
| 9 | `rm -rf .next && npm run build` | PASS — 8 routes, standalone output |
| 10 | `npm run verify:built-anti-hardcode` | PASS — `123 production text artifacts` |
| 11 | `npm run verify:file-structure` | **Gone.** No such script; D-8. |
| 12 | `PORT=3100 … node .next/standalone/server.js` then `GET /` | `200` |
| 13 | `npx playwright test tests/e2e tests/accessibility` | **24 passed, 1 skipped, 0 failed** (27.3 s) |
| 14 | Axe: landing | 0 violations, WCAG 2.1 A + AA |
| 15 | Axe: Conflict draft, disclosure dialog, ready draft, frozen Review, receipt | 0 violations each |
| 16 | `CITEAPPLY_EVIDENCE_DIR=docs/evidence/phase2b npx playwright test tests/e2e/webmcp-journey.spec.ts` | **2 passed** — the 13-step journey, both packets, real Chrome 152 |
| 17 | Console during both journeys | Only one favicon `404` and the HTTP status lines Chrome logs for the product's own refusals (`403` consent_required, `409` conflict_requires_human / not_ready_for_review). No CSP error, no Permissions-Policy error, no page error. `*-console-errors.txt` |
| 18 | Receipt: downloaded file | `schema: "citeapply-receipt-v1"`; every accepted value and cited excerpt in it asserted visible on screen |
| 19 | Receipt: `emulateMedia({media:"print"})` | Record and excerpts still visible; **Download JSON** and **Assisted activity** hidden |
| 20 | Screenshots at 1280px and 390px | landing, application after the agent batch, review, receipt, print preview — 16 files in this directory |
| 21 | `git diff 9fff6ac..HEAD -- src/contracts src/webmcp src/server src/domain src/evidence` | **empty** — no contract, descriptor, bridge, dispatcher, service, domain or evidence file changed in this phase |

### The 24/1 breakdown
20 are the Phase 2A set, unchanged in intent (three label assertions were updated to the
new on-screen text and two waits were **tightened**, never loosened). The 4 new ones are
2 in `receipt-delivery.spec.ts` and 2 in `axe-scan.test.ts`. The single skip is still
`tests/e2e/raw-genuine-client-chronology.spec.ts:37` — it needs three real, unedited
ChatGPT-desktop capture files that only the user can produce. **No test was weakened,
loosened, or deleted.**

## 3. The 13-step journey, re-driven in real Chrome, both packets

Screenshots and the verbatim tool log are in this directory.

| Step | Supported | Conflict | Evidence |
|---|---|---|---|
| 1–2 packet start, runtime PDF parse, form opens | PASS | PASS | `*-step01-landing.png`, `*-step02-form-open.png` |
| 3 six tools discovered; protected calls before consent | PASS | PASS | 4 × `consent_required`; redacted state discloses no field ids |
| 4 disclosure + Allow | PASS | PASS | `*-step04a-consent-dialog.png`, `*-step04b-access-allowed.png` |
| 5 reads, then a version-checked batch | PASS | PASS | `ok:true` |
| 6 the form updates visibly; guardian branch opens | PASS | PASS | `*-step06-…-VISIBLE.png`; the two frames differ (`6f2a3a92…` vs `6e888762…`) |
| 6b agent re-reads active requirements and binds the branch | PASS | PASS | `*-step06b-branch-bound.png` |
| 7 income | binds `ok:true` | **refused** `conflict_requires_human`, revision unchanged | `*-step07-income.png` |
| 8 agent proposes the `.test` email; field stays undeclared | PASS | PASS | `*-step08-…png` |
| 9 premature prepare fails closed | PASS (`declaration_required`) | PASS (**both** blockers) | `*-step09-…png` |
| 10 applicant decides, **now reading both excerpts first** | PASS | PASS | `*-step10-human-decisions.png` |
| 11 agent prepares; assistance closes and the page says so | PASS | PASS | `*-step11-…png`; tool result carries no `contentHash` |
| 12 Return invalidates; manual prepare reaches the same Review | PASS | PASS (both excerpts, marked chosen / not chosen) | `*-step12a/b-…png` |
| 13 one atomic submission; receipt | PASS | PASS + the conflict warning | `*-step13-receipt.png` |
| 13b JSON download + print view semantically equal | **PASS** | **PASS** | `tests/e2e/receipt-delivery.spec.ts`; `receipt-print-*.png` |

Step 13b is the one Phase 1 recorded as **absent** in both columns.

## 4. What is NOT verified

- **17/17 Playwright.** Still unreachable: `raw-genuine-client-chronology.spec.ts` needs
  three real ChatGPT-desktop capture files. The honest target is 24 passed + 1 documented
  skip.
- **The ChatGPT in-app browser.** Untouched. Only the user can test it.
- **Any deployed or HTTPS origin.** Everything is `http://localhost:3100`. `__Host-`
  cookie behaviour over HTTPS, HSTS and the production headers on a real domain remain
  unverified.
- **The user's own Postgres.app database on :5432.** Every result came from the :5433
  throwaway cluster. I changed no system or security setting.
- **Actual paper output.** "Print" is verified through `page.emulateMedia({media:"print"})`
  and a print-preview screenshot at both widths. No page was sent to a printer or rendered
  to PDF by a print driver, and pagination across more than one physical page is unproven.
- **`window.print()` itself.** The assertions cover the button, the `prepare_print` read
  and the print-media rendering; the browser's print dialog is not driven.
- **The `onMutationUnprojected` fallback path** — still implemented, typechecked and never
  exercised in a browser, exactly as Phase 2A reported.
- **Rate limiting under real pressure.** I cleared the `counter` rows (sentinels untouched)
  before each browser run and never observed `at_capacity`; the friendly at-capacity copy
  is still unproven. Note the real policy is `demo_start: 120 per 600 s`
  (`src/server/db/rate-buckets.ts:34`), not the 6/10 min in HACKATHON-PLAN.md.
- **Session expiry at minute 50, and a second-tab takeover.** Not exercised. Phase 1's
  finding that no expiry copy exists in `src/app/application/page.tsx` still stands, and
  this phase did not add any.
- **Refresh mid-journey.** Not re-tested this phase.
- **Dark mode.** The product declares no dark palette and none was added; it renders in its
  own light palette regardless of the OS setting. Not a violation, but not adaptive.
- **Widths other than 1280px and 390px.** Both were screenshotted and neither overflows;
  intermediate breakpoints were reasoned about in the CSS (`auto-fit minmax` grids and the
  existing 34rem stack), not photographed.
- **Axe on the Supported packet's draft.** The scan walks the Conflict packet, a strict
  superset of what the Supported draft renders. The Supported-only rendering of a
  `source_supported` income row was not separately scanned.
- **Screen-reader behaviour.** Axe is a static rule engine. No assistive technology was
  driven; the readiness gauge is `aria-hidden` with the count as its accessible text, and
  that decision is untested with a real screen reader.
