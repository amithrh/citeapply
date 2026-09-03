# Phase 5 independent gate review — CiteApply

**Reviewer:** independent gate (no prior exposure to the work).
**Date:** 2026-09-03.
**Method:** fresh `git clone -b hackathon-final` into a new directory; `README.md`
followed literally; real Google Chrome 152.0.7977.66 launched with
`--enable-features=WebMCPTesting`; every tool call made through
`document.modelContext.getTools()` / `executeTool()`; `docs/JUDGE-TESTING.md`
walked step by step for the Conflict packet and then the Supported packet.
**Environment:** Node 24.20.0, npm 11.19.0, PostgreSQL cluster at
`postgresql://citeapply@127.0.0.1:5433/citeapply` (Docker unavailable),
`APP_ORIGIN=http://localhost:3100`, self-generated `CITEAPPLY_MASTER_KEY`.
No product code was modified; only `.env.local` was created.

---

## Verdict: **NO-GO** (single blocker; one-line fix converts it to GO)

The product is genuinely good. Every behavioural claim in `README.md` and
`docs/JUDGE-TESTING.md` that I could test was true, verbatim, including the exact
refusal JSON. The safety boundary held under every adversarial probe I threw at
it. All 12 automated suites pass.

It is **NO-GO** for exactly one reason: **a judge who follows the README's
"Run the production build" block literally gets a completely dead demo.** The
prescribed command line omits `HOSTNAME`, the standalone server therefore binds
`0.0.0.0`, `requireExactRequestUrl` compares that host against `APP_ORIGIN` and
refuses **every** API request with HTTP 403, and the landing page's only visible
response is *"CiteApply could not prepare a synthetic start."* No packet starts.
Nothing else in the demo is reachable. Server stdout logs nothing at all.

This is a runbook defect, not a product defect — the same build served by
`next start` or `next dev` works perfectly — but the gate question is whether a
judge can get to the demo by following the README, and today they cannot.
Fix D-P0-1, re-verify, and this is a confident GO.

---

## Evidence table

| # | Check | Command / action | Result |
|---|---|---|---|
| 1 | `verify:versions` | npm run | **PASS** — `v24.20.0 npm/11.19.0` |
| 2 | `verify:dependencies` | npm run | **PASS** — 18 exact direct pins |
| 3 | `verify:fixture-hashes` | npm run | **PASS** — 6 deterministic one-page PDFs |
| 4 | `verify:production-imports` | npm run | **PASS** — 49 source files, no test/golden/generator imports |
| 5 | `verify:surfaces` | npm run | **PASS** — gate=W0-C0, 76 paths, 6 webmcp tools |
| 6 | `verify:built-anti-hardcode` | after build | **PASS** — 145 production text artifacts |
| 7 | `typecheck` | npm run | **PASS** — clean |
| 8 | `lint` | npm run | **PASS** — clean, `--max-warnings=0` |
| 9 | `test:contracts` | npm run | **PASS** — 30/30 |
| 10 | `test:security` | npm run | **PASS** — 8/8 (29.7 s; one oracle alone takes 29.4 s) |
| 11 | `test:unit` | npm run | **PASS** — 12/12 |
| 12 | `test:integration` | npm run | **PASS** — 7/7 against the real Postgres cluster |
| 13 | `test:e2e` | npm run, README-verbatim server | **FAIL — 10 failed, 1 skipped** (D-P0-1) |
| 14 | `test:e2e` | npm run, `HOSTNAME=localhost` server | **PASS** — 10 passed, 1 skipped (22.0 s) |
| 15 | `test:a11y` | npm run, corrected server | **PASS** — 14/14 |
| 16 | `npm run build` | README | **PASS**; `cp -R .next/static …` step is correct and necessary |
| 17 | Start standalone, README verbatim | `PORT=3100 node .next/standalone/server.js` | **FAIL** — every API 403; landing shows "could not prepare a synthetic start" (`P0-readme-verbatim-start-fails.png`) |
| 18 | Start standalone + `HOSTNAME=localhost` | — | **PASS** — full demo works |
| 19 | A1 landing page | real Chrome 152 | **MATCH** — header, "FICTIONAL DEMO · SYNTHETIC DATA ONLY", "The agent cites. You decide.", both packet cards, "Try it with an agent" box (`A1-landing.png`) |
| 20 | A1 application page status line | — | **MATCH** verbatim: "This page is current. Assisted access is off. WebMCP: six CiteApply tools registered." (`A1-application-initial.png`) |
| 21 | A2 `getTools()` | Chrome API | **MATCH** — exactly the six documented names |
| 22 | A2 annotations | — | **MATCH** — `TOOL_ANNOTATIONS` table in README is accurate for all six tools |
| 23 | A3 `get_application_state` redacted, pre-consent | — | **MATCH byte-for-byte**: `{"ok":true,"data":{"access":"consent_required","safeActions":["use_visible_application"]}}` |
| 24 | A3 protected + `get_evidence_index`, pre-consent | — | **MATCH byte-for-byte** `consent_required` refusal |
| 25 | A4 consent dialog | — | **MATCH** — all four catalogues plus Technical details; the strongest artifact in the project (`A4-consent-dialog.png`) |
| 26 | A5 `get_form_requirements` active | — | **MATCH** — policies only, no field-to-value map anywhere |
| 27 | A5 `get_evidence_index` | — | **MATCH** — opaque 22-char handles, no raw text/paths; income claims `540000` and `480000` |
| 28 | A6 atomic apply (5 changes) | — | **PASS** — `ok:true`, 5 `updatedFields`, `rereadRequirements:true`, form updated live, activity panel logged it (`A6-after-batch.png`) |
| 29 | A6 replay identical `requestId` | — | **PASS** — recorded effect replayed, revision unchanged at 3 |
| 30 | A6 reuse `requestId`, different content | — | **PASS** — `request_reuse_mismatch` |
| 31 | A7 conditional branch | — | **PASS** — active set grew 6 → 8 (`guardian_name`, `household_size`) |
| 32 | A7 stale expected revision | — | **PASS** — `stale_state` carrying `{applicationRevision:3, requirementsVersion:2}` |
| 33 | A8 bind income (both handles) | — | **MATCH byte-for-byte** `conflict_requires_human`; nothing written; income row unchanged; badge in activity panel (`A8-conflict-refusal.png`) |
| 34 | A8 `get_validation_issues` | — | **MATCH** — ordered blockers: conflict, then declaration |
| 35 | A9 premature `prepare_submission_review` | — | **PASS** — `not_ready_for_review` with both blockers; stage unchanged |
| 36 | A10 human resolve + declare | — | Reaches 8/8 ready (`A10-declared.png`) — but see D-P1-1 |
| 37 | A11 frozen Review | — | **MATCH** — short id, content hash, conflict warning, both disagreeing excerpts, chosen one named (`A11-review.png`) |
| 38 | A11 submit → receipt | — | **MATCH** — receipt id, review short id, same hash `2d06473c…`, warning carried through (`A11-receipt.png`) |
| 39 | A11 Download JSON | — | **PASS** — `citeapply-receipt-0cd40137-….json`, `schema: "citeapply-receipt-v1"` |
| 40 | Receipt JSON vs screen diff | manual field-by-field | **PASS — zero discrepancies.** All 8 values, the content hash, the warning, and both income excerpts are identical in file and on screen |
| 41 | A11 Print | `emulateMedia('print')` | **MOSTLY PASS** — activity panel and status line hidden, receipt + excerpts kept; Download JSON / Print buttons still print (D-P2-4) (`A11-print-preview.png`) |
| 42 | Supported packet, full journey | — | **PASS** — income binds, second source kept as corroboration, no conflict warning, receipt reached (`SUP-01`…`SUP-04`) |
| 43 | `prepare_submission_review` via tool | Supported packet | **PASS** — returns only `readiness:"ready"` + opaque `reviewRef`; no contents, no hash; assisted access closed afterwards (subsequent call → `consent_required`) |
| 44 | Console errors | whole journey, both packets | **PASS — zero** errors or warnings |

### Adversarial checks (reported, not fixed)

| Probe | Result |
|---|---|
| `apply_evidence_backed_answers` before consent | **HOLDS** — `consent_required`. So do `prepare_submission_review`, `get_validation_issues`, `get_form_requirements`, `get_evidence_index`, and protected `get_application_state`. Five protected tools, one boundary, no leak |
| Bind income in the Conflict packet (either source) | **HOLDS** — `conflict_requires_human` both times, nothing written |
| Any tool named submit / declare / resolve / confirm / receipt | **NONE EXIST** — filter over `getTools()` returns `[]`; `executeTool` on a fabricated `submit_application` finds no tool |
| Replay same `requestId`, identical content | **CORRECT** — effect replayed, no double application |
| Replay same `requestId`, different content | **CORRECT** — `request_reuse_mismatch` |
| Stale `expectedApplicationRevision` | **CORRECT** — `stale_state` + current versions |
| Open the application in a second tab | **PARTIAL FAIL** — server correctly hands tab 1 `stale_page`, and tab 2 correctly lands with assisted access **off**. But tab 1's own status line keeps reading *"This page is current. Assisted access is allowed."* forever, including after it has received `stale_page`. See D-P1-2 |
| Reload mid-journey | **CORRECT** — all saved work preserved, assisted access resets to off (fails closed) |
| Download receipt JSON and diff against screen | **CORRECT** — zero discrepancies |
| Print preview | Controls panel and status line dropped; the two receipt buttons are not (D-P2-4) |
| Malformed tool arguments (wrong key name) | Rejected before the network, as designed — but surfaces to the agent as an opaque `UnknownError`, not a structured refusal (D-P2-5) |

---

## Defects, ranked

### P0 — blocks the gate

**D-P0-1 · The README's production start command produces a dead demo.**
`README.md:270-273` prescribes:

```bash
PORT=3100 node .next/standalone/server.js
```

The Next standalone server defaults `HOSTNAME` to `0.0.0.0`, so `request.url`
resolves to `http://0.0.0.0:3100/…`. `requireExactRequestUrl`
(`src/server/security/origin.ts:78`) compares that host against the `APP_ORIGIN`
host (`localhost:3100`), mismatches, and throws `RequestOriginError` — **every**
API request, including the very first `GET /api/demo`, returns HTTP 403
`invalid_request`. The landing page shows only *"CiteApply could not prepare a
synthetic start."* and no packet can be started. All 10 e2e specs fail the same
way. Server stdout prints nothing.

Reproduced deterministically; fixed by prefixing `HOSTNAME=localhost`, after
which all 10 e2e and all 14 a11y specs pass. Evidence:
`P0-readme-verbatim-start-fails.png`.

Fix: change the README (and `docs/DEPLOYING.md:77`) to
`HOSTNAME=localhost PORT=3100 node .next/standalone/server.js`, with a sentence
explaining that the hostname must match `APP_ORIGIN` because the same-origin
check is exact. This is the single highest-value edit available to the project.

### P1 — would cost real credibility in front of a judge

**D-P1-1 · The conflict "reason" is never actually required, but the frozen
Review and the receipt assert the applicant gave one.**
`src/app/application/page.tsx:997-1010` renders "Why you chose this source" as a
plain `<select>` whose value defaults to the first option
(`CONFLICT_REASONS[0] = "more_recent"`, `src/app/application/page.tsx:36-38`) with
no empty/placeholder state. I clicked **Use the Synthetic Income Statement**
without ever touching the selector; the resolution succeeded, and the frozen
Review, the receipt screen and the receipt JSON all now read:

> "You chose the Synthetic Income Statement because **it is the more recent
> source**."
> `"resolution": {"reason": "more_recent", …}` — baked into the content hash.

I never said that. For a product whose entire thesis is *"a displayed excerpt
cannot be fabricated"* and *"the applicant chooses a source and states a
reason"*, silently manufacturing the applicant's stated justification and
freezing it into an immutable, hashed record is the sharpest contradiction in
the build. It also directly falsifies `README.md:56-57`, `JUDGE-TESTING A10.2`,
and the video narration *"I pick the source I'm willing to stand behind, **I say
why**"*.

Fix: make the select default to an unselected placeholder and refuse
`resolve_income` without an explicit reason — or drop the reason from the record.

**D-P1-2 · A superseded tab keeps asserting "This page is current."**
Opening `/application` in a second tab correctly makes the first tab stale — the
server returns `stale_page` to every tool call from it. But the first tab's
status line continues to display *"This page is current. Assisted access is
allowed."* indefinitely, **including after it has received the `stale_page`
refusal**, and its manual controls (Prepare review, etc.) remain enabled. The
same false "This page is current" line also shows on the receipt screen, whose
tool calls are likewise answered `stale_page`. Opening a second tab is a normal
judge reflex. Evidence: `ADV-second-tab.png`,
`ADV-first-tab-after-second.png`, `ADV-stale-tab-after-call.png`.

Fix: flip the status line to the stale state on any `stale_page` response and
disable the mutating controls.

**D-P1-3 · No live URL exists.** `LIVE_URL` is an unfilled placeholder in
`README.md:26`, `docs/JUDGE-TESTING.md:3,39,250`, `docs/VIDEO-SCRIPT.md:8`, and
`devpost-submission.md:3,8,210,230` (which asserts *"Working, deployed, publicly
reachable at `LIVE_URL`"*). A judge given the README today has no URL to open and
must build from source. The video script's premise — *"the deployed, styled build
at `LIVE_URL`"* — cannot be executed as written.

### P2 — polish

**D-P2-1 · The page `<h1>` is "Application" on the Review and Receipt screens.**
Confirmed: `h1` reads `Application` on the draft form, on "Review before
submitting", and on the "Submitted" receipt. The heading never reflects where
the applicant is, so screen-reader users and anyone scanning the tab get no
stage signal, and the video's stage transitions read weaker than they are.

**D-P2-2 · No favicon.** `GET /favicon.ico` → 404; the page emits no
`<link rel="icon">`; `src/app/layout.tsx:35-46` sets `title`, `description` and
`robots` but no `icons`; there is no `public/` directory and no `src/app/icon.*`.
Chrome shows the generic globe. On a recorded demo and in a judge's tab strip
this reads as unfinished.

**D-P2-3 · The conditional-branch rows do not "appear".** `guardian_name` and
`household_size` rows are rendered from the very first load, labelled
*"Not required"*; binding `dependency` flips them to required. Both
`docs/JUDGE-TESTING.md:145-146` ("rows **appear** in the Answers list") and
`docs/VIDEO-SCRIPT.md:95-99` ("Guardian name and household size **just
appeared**") describe something the page does not do. The real behaviour is still
good, and the tool payload genuinely grows 6 → 8; the docs just oversell the
visual beat, and on camera the "appearance" moment will not land.

**D-P2-4 · Print keeps the receipt's own buttons.** Under print media the
Assisted activity panel and the WebMCP status line are correctly hidden
(`data-print="hide"`), but **Download JSON** and **Print** still render
(`display:inline-block`). `docs/JUDGE-TESTING.md:222-223` says the print view
"drops the page's controls".

**D-P2-5 · A malformed tool argument yields an opaque error.** Calling
`apply_evidence_backed_answers` with a wrong key name (`bindings` instead of
`changes`) makes `executeTool` throw
`UnknownError: Tool was executed but the invocation failed`. The bridge is doing
the right thing (the call never reaches the server), but an agent gets no
machine-readable reason and no `safeActions` — the one place in the system where
a failure is not a structured refusal.

**D-P2-6 · The income-row helper text is quoted wrongly in the docs.**
`README.md:56` and `docs/JUDGE-TESTING.md:163-164` quote *"CiteApply will not
choose between these. Pick the source you stand behind."* The page actually says
*"…Read both records and pick the source you stand behind."*

**D-P2-7 · Silent infrastructure failures.** When the standalone server was
refusing everything, its stdout printed nothing beyond the startup banner. The
403/503 boundaries are deliberately quiet by design, which is right for the
response body, but with no server-side log line a self-hosting judge has no
thread to pull. This is what turned D-P0-1 from a two-minute fix into a
twenty-minute investigation.

---

## README friction list

Every item below cost me time following the README literally.

1. **`LIVE_URL` is an unfilled placeholder** (`README.md:26`). The "Judge quick
   start (90 seconds)" cannot be started. (D-P1-3)
2. **The production start command is wrong** (`README.md:270-273`) — missing
   `HOSTNAME=localhost`. Produced a fully dead demo. (D-P0-1)
3. **Docker is assumed for the database.** `README.md:236-243` leads with
   `docker compose up -d db`. The fallback ("apply them yourself, in order") is
   present and correct, but there is no note that `compose.yaml` uses port 5432
   while a hand-rolled cluster may not, and no `psql`-less path.
4. **`.env.local` is not read by the standalone server.** README instructs
   creating `.env.local` (`README.md:254-260`) and then starting
   `.next/standalone/server.js`, which `chdir`s into its own directory and never
   sees that file. I had to `set -a; . ./.env.local` manually. The README
   explains the `cp -R .next/static` gotcha in careful detail but omits this one,
   which bites first.
5. **`npm run dev` deletes the standalone build.** Not documented; after a dev
   run I had to rebuild before the standalone server would start again. Worth one
   line, since README offers `npm run dev -- -p 3100` immediately above the
   production build section.
6. **`test:e2e` / `test:a11y` need a running server**, which the README does say
   (`README.md:337-339`) — correctly, and the `export APP_ORIGIN` warning is
   accurate and saved me a failure mode. Good.
7. **npm install-scripts warnings.** `npm ci` warns that `fsevents` and
   `unrs-resolver` install scripts are not approved. Harmless, but unmentioned,
   and it looks like an error to a first-time reader.
8. Minor: `README.md:56` misquotes the income-row copy (D-P2-6).

Positives worth stating: the README's explanation of *why* `cp -R .next/static`
is required is excellent and correct; the "Honest limits" section is the most
credible thing in the repo; the six-tool table matched the live annotations
exactly; and the `APP_ORIGIN` warning at `README.md:262-264` — *"a mismatch
refuses every request as `stale_page`"* — is very nearly the P0 diagnosis, just
attributed to the wrong knob and the wrong error code.

---

## Judge's-eye scores

Scored as a skeptical judge who has just spent ten minutes with the running
product, assuming the P0 is fixed and a live URL exists.

| Criterion | Score | Justification |
|---|---|---|
| **WebMCP Leverage** | **5 / 5** | This is the strongest WebMCP argument I have seen: the site, not the model, owns the evidence policy, and the proof is a structured `conflict_requires_human` refusal that no prompt can talk its way past — plus live requirements that change underneath the agent, forcing a re-read, which a static tool schema could not express. |
| **Execution** | **4 / 5** | Twelve automated suites green, zero console errors, byte-exact refusals, an idempotency and staleness story that actually works under adversarial replay — but the README's own start command yields a dead demo, a superseded tab lies about being current, and the "reason" the receipt attributes to the applicant is manufactured. |
| **Potential Impact** | **4 / 5** | The "receiving site enforces the contract" pattern generalises immediately to any document-backed form — aid, benefits, immigration, insurance, KYC — and the honest-limits section resists the usual overclaiming; it loses a point because adoption requires every such site to implement WebMCP, which the project acknowledges but cannot solve. |
| **Creativity** | **4 / 5** | Choosing *the contradiction between two accepted sources* as the demo's centrepiece — and making the product's headline moment a refusal rather than a completion — is a genuinely original framing; the consent dialog's four-column "will not receive / cannot do" catalogue is the kind of detail most entries never think of. |

### Top 5 things that would raise the score

1. **Fix the start command and publish a live URL** (D-P0-1, D-P1-3). A judge who
   cannot run it scores nothing else. This is the difference between a 4 and a 0
   on Execution.
2. **Make the conflict reason genuinely the applicant's** (D-P1-1). Requiring an
   explicit selection turns the most quotable line on the receipt — *"You chose
   the Synthetic Income Statement because…"* — from a liability into the single
   best proof of the thesis. Right now a hostile judge who notices this can
   dismantle the whole "the site never fabricates" claim in one sentence.
3. **Make the page tell the truth about its own staleness** (D-P1-2). The
   server already knows; the UI just has to say so. A judge opening a second tab
   currently sees the product assert something false about itself.
4. **Give the stage a heading and the site a favicon** (D-P2-1, D-P2-2). Two tiny
   edits that remove the two most visible "unfinished" signals in every
   screenshot and every second of the video.
5. **Show the tool-call ledger earlier and louder.** The **Assisted activity**
   panel — refusals rendered identically to acceptances, with outcome badges — is
   the most persuasive thing on the page and it sits at the very bottom, below
   the fold, unmentioned until README step 4. Move it up, or mirror it beside the
   form; it is the entry's best evidence and it is currently hidden.

---

## Video-script mismatches

Checked `docs/VIDEO-SCRIPT.md` line by line against the running product.

**Accurate and verified verbatim** — the header and headline copy (l.44-46), the
six-tool registration line (l.47-48), the redacted-mode JSON (l.58), the
`conflict_requires_human` JSON (l.107), the income row's persistence after
refusal (l.108-109), the consent-dialog structure (l.68-71), the
"Assisted access is allowed for this page and session." status line (l.71), the
**Where the assistant stops** two columns (l.72-73), the `540000` / `480000`
claims in the evidence index (l.82-83), the atomic mutation and its visible
effect (l.83-85), the frozen review's contents (l.134-136), the
"Assisted access is closed while you review it." copy (l.136), and the receipt's
matching hash, warning, excerpts and chosen-record line (l.146-149). The shot
timings sum to 2:50 as stated. This is an unusually faithful script.

**Mismatches:**

1. **l.8 — `LIVE_URL`.** The mandated recording target ("the deployed, styled
   build at `LIVE_URL`") does not exist. The script cannot be shot as written.
   (D-P1-3)
2. **l.124 and l.193 — "Pick a reason from *Why you chose this source*" /
   "I pick the source I'm willing to stand behind, **I say why**".** The narration
   asserts that stating a reason is part of the human act. It is not enforced: the
   selector is pre-filled and the resolution succeeds untouched, and the receipt
   claims a reason regardless. On camera the presenter can of course click a
   reason — but the claim being made about the *product* is false. (D-P1-1)
3. **l.95-99 — "the conditional branch appearing — Guardian name and Household
   size rows are now present" / "just appeared".** Those rows are on screen from
   first load, labelled "Not required". Nothing appears; a label changes. The beat
   will not read on camera as scripted. (D-P2-3)
4. **l.125 — "click Save email and I declare this is my address".** In the
   scripted flow the agent has already proposed the email via
   `propose_email`, so **Save email** is unnecessary; worse, re-saving withdraws a
   prior declaration (per `tests/unit`), so following the script literally after a
   declaration would undo it. The shot should be **I declare this is my address**
   alone.
5. **l.134 vs l.139 — narration/visual mismatch.** The narration says *"The agent
   can ask the site to freeze the application"*, while the shot direction has the
   presenter click **Prepare review** by hand. Both are true of the product (I
   verified the tool path on the Supported packet returns only opaque readiness
   metadata), but the shot does not show what the narration claims. Either call
   `prepare_submission_review` from the console on camera, or reword.
6. **l.39-40 — "Nobody clicked anything."** The cold open is cut from ~1:35, i.e.
   from *after* the presenter clicked **Review and allow assisted access** and
   **Allow assisted access**. The sentence is true of that instant and false of
   the session; a skeptical judge who watches the rest will notice. Suggest
   "Nobody typed into that form."
7. **l.148-149 — "Hover the Download JSON and Print buttons."** Fine as staged,
   but if the shot cuts to the print preview, note that those two buttons are
   still visible in it (D-P2-4).

---

## What I could not verify

- Any deployed environment (none exists).
- The ChatGPT in-app browser route (`docs/JUDGE-TESTING.md` §B) — out of scope
  for a local gate.
- `tests/e2e/raw-genuine-client-chronology.spec.ts` skips, as the README honestly
  states: no autonomous-agent chronology has been supplied. Every tool call in
  this review was scripted through Chrome's own `document.modelContext` API, which
  is exactly the limitation `README.md:315-318` declares. That honesty is to the
  project's credit.
