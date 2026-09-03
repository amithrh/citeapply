# Phase 2C — closing the independent gate

Branch `hackathon-final`, worktree `scratchpad/wt-508940b`. Base is `6848629`,
the commit that records the independent Phase 5 gate verbatim into
`docs/evidence/phase5/GATE.md`; this phase is the nine commits
`6bee900`…`0151d7f` plus this report.

Node v24.20.0, npm 11.19.0.
Browser for every UI result below: **Google Chrome 152.0.7977.66**, launched
with `channel: "chrome"` and `--enable-features=WebMCPTesting`, tools invoked
through the browser's own `document.modelContext.getTools()` /
`executeTool(toolObject, JSON.stringify(args))`.
Database: the throwaway cluster `postgresql://citeapply@127.0.0.1:5433/citeapply`
(Phase 1 correction E-1). The user's Postgres.app on :5432 was not touched.
App under test: the **standalone production build** from
`rm -rf .next && npm run build`, started **exactly as the README now says**,
from a shell that had followed only the README.

The gate's verdict was **NO-GO on one blocker**, D-P0-1. That blocker is fixed
and re-verified; so are both P1s, all seven P2s, the panel placement, and every
video-script mismatch. D-P1-3 (no live URL) is out of scope and remains open —
see §6.

---

## 1. The nine commits, with file:line

| Commit | Item | What changed |
|---|---|---|
| `6bee900` | **D-P0-1 + D-P2-7** | The documented start command works, and a refusal says why |
| `ae60e6a` | **D-P1-1** | The conflict reason is the applicant's, or there is no resolution |
| `78c17db` | **D-P1-2** | A superseded tab stops claiming to be current |
| `1d4c190` | **D-P2-1** | The heading and the tab title say which stage you are on |
| `e29403b` | **D-P2-2** | The site has a mark of its own |
| `3bad75b` | **D-P2-4** | The receipt's own controls are named in the print rules |
| `b126702` | **D-P2-5** | A malformed tool argument is a structured refusal |
| `080716c` | panel | The tool-call ledger sits where the tool calls happen |
| `0151d7f` | **D-P2-3, D-P2-6**, video script, JUDGE-TESTING | The guides describe what the product actually does |

### D-P0-1 + D-P2-7 — the start command, and a failure that diagnoses itself (`6bee900`)

The README prescribed `PORT=3100 node .next/standalone/server.js`. Next's
standalone server defaults `HOSTNAME` to `0.0.0.0`, `request.url` therefore read
`http://0.0.0.0:3100/…`, the exact same-origin check compared that host against
the `APP_ORIGIN` host, and **every** API request returned 403 — a landing page
that could not start a packet, and a server log that printed nothing at all.

- `README.md:284-288` — the block is now `npm run build` /
  `cp -R .next/static …` / `set -a; . ./.env.local; set +a` /
  `HOSTNAME=localhost PORT=3100 node .next/standalone/server.js`.
- `README.md:290-297` — one paragraph saying *why*: the same-origin check is
  exact, so the host you bind must be the host in `APP_ORIGIN`.
- `README.md:299-306` — `.next/standalone/server.js` `chdir`s into its own
  directory and has none of Next's dotenv loading, so it never reads
  `.env.local`; source it, or use `node --env-file=.env.local`
  (README friction 4).
- `README.md:277-279` — `npm run dev` rewrites `.next/` and removes the
  standalone build (README friction 5).
- `README.md:269-275` — the `APP_ORIGIN` warning is corrected: a mismatch
  refuses with 403 `invalid_request`, not `stale_page`. The gate noted this
  paragraph was "very nearly the P0 diagnosis, just attributed to the wrong
  knob and the wrong error code."
- `docs/DEPLOYING.md:21-56` — the same, plus a new *Running the standalone
  build* section at `:30`, the proxy note (a TLS-terminating proxy must forward
  the public `Host` unchanged), and the dev-build warning.
- `src/server/security/origin.ts:43-46` — `refuse(detail)` writes one
  operator-facing line and then throws. Each comparison calls it with what
  mismatched: `:112` (scheme), `:115-118` (request host, with the `HOSTNAME`
  hint), `:125` (`Host` header), `:155` (`Origin` header), `:107` (unparsable
  URL).
- `src/server/security/origin.ts:35-41` — `HOST_SHAPED` / `printableHost`. Only
  host-shaped identifiers are ever printed; anything else becomes
  `<unprintable>` or `<absent>`. No request body, cookie, capability, token or
  field value can reach the log through this path, and the **response body is
  unchanged and still opaque**.

Reproduced and fixed, both directions:

```
$ PORT=3100 node .next/standalone/server.js          # the old command
HTTP 403
origin check refused: request host 0.0.0.0:3100 does not match APP_ORIGIN host localhost:3100 (if this server bound 0.0.0.0, set HOSTNAME to the APP_ORIGIN hostname)

$ HOSTNAME=localhost PORT=3100 node .next/standalone/server.js   # the new one
{"ok":true,"data":{"kind":"start_token", …}}
HTTP 200
```

### D-P1-1 — the reason is the applicant's, or there is no resolution (`ae60e6a`)

The selector defaulted to `CONFLICT_REASONS[0]`, so clicking a source button
without ever touching it manufactured the sentence the review and the receipt
then quote as the applicant's own — and froze it into the content hash. The
gate called it "the sharpest contradiction in the build," and it was.

- `src/app/application/page.tsx:245-249` — the state starts `""`, with the
  reason written down in a comment.
- `page.tsx:1088-1112` — the selector moves **above** the two candidate records
  (the reason is chosen before the source), leads with the placeholder
  *"Choose a reason before you decide…"*, and is followed by `#reason-hint`
  (`:1107`), which says the review and the receipt will quote it back and that
  CiteApply will not pick one.
- `page.tsx:1093-1094, 1140-1141` — both **Use the …** buttons carry
  `disabled={stale || reason === ""}` and `aria-describedby="reason-hint"`, and
  the handler returns early as defence in depth.
- `src/app/globals.css:772-796` — `.reason-choice`, `.reason-hint`, and a real
  disabled treatment for the candidate buttons.

**Nothing was widened.** The server already refuses: the `resolve_income` member
of `HumanActionRequestSchema` (`src/contracts/http.ts:1296-1302`) takes
`reason: ConflictReasonSchema` — a closed three-value enum on a `.strict()`
object — so an omitted field or the empty placeholder never reaches
`src/server/services/actions.ts:216`. The new test pins that narrowness rather
than adding to it.

- `tests/contract/http-contract.test.ts:5731-5799` — *"resolve_income refuses
  every reason the applicant did not state"*: the three valid reasons parse;
  omitted, `""`, whitespace, case variants, near-misses and six non-string
  shapes all fail; and the enum is asserted equal to the three the UI offers,
  so selector and server cannot drift.
- `tests/e2e/applicant-journey.spec.ts:85-118` — asserts the selector starts
  empty, both buttons are disabled, the hint is visible, a **forced** click
  resolves nothing (the income row still disagrees, **Prepare review** still
  refuses), then selects a reason and proceeds.
- `receipt-delivery.spec.ts:141-145`, `axe-scan.test.ts:120-123` and
  `webmcp-journey.spec.ts:200-211` now state a reason before resolving; the
  journey spec also asserts the button is disabled first.

### D-P1-2 — a superseded tab stops claiming to be current (`78c17db`)

The server always answered `stale_page` correctly. The first tab was the one
lying: it kept displaying *"This page is current. Assisted access is allowed."*
indefinitely, **including after receiving the refusal**, with every mutating
control enabled.

- `src/app/application/page.tsx:264-278` — a latched `stale` flag and
  `noteOutcome(code)`. It latches because only a reload can win the session
  back.
- `page.tsx:337` (`recordActivity` — the **tool** route, via the outcome the
  bridge already reports), `page.tsx:313` (`reconcile`), `page.tsx:454`
  (`runAction` — the **human** route). Both routes, as the task required.
- `page.tsx:686-712` — assistance is forced to `off` when stale, so the
  "allowed" claim disappears; the status line becomes *"This page is no longer
  current. Reload to continue."*
- `page.tsx:771-788` — the status line carries `data-stale`, and a
  `.stale-recovery` panel (`:778`) explains ("Another tab took over this
  synthetic session… Nothing you have saved is lost.") and offers **Reload this
  page**.
- Mutating controls disabled — `disabled={stale}` at `page.tsx:878` (Submit),
  `:885` (Return to draft), `:963` (Prepare review), `:1015` (Link `<record>`),
  `:1037` (email input), `:1046` (Save email), `:1059` (I declare), `:1093`
  (the reason selector and both source buttons).
- `src/ui/controllers/application.tsx:26-34, 47, 137-140, 159, 167` — a `stale`
  prop disables the consent controls and replaces the status with *"Assisted
  access ended when another tab took over this session."*
- `src/app/globals.css:175-207` — the stale line and recovery panel wear the
  judgment ochre, and disabled controls read as unavailable.
- `tests/e2e/stale-page.spec.ts` (new, 87 lines) — the Playwright test the task
  asked for: opens a second tab, asserts the first tab **still** says it is
  current until **its own next call**, then asserts the line flips, the
  assisted-access claim is gone, **Reload this page** appears, six mutating
  controls are disabled, the state latches across a re-render, a reload wins the
  session back with work intact, and the second tab is then the stale one.

### D-P2-1 — the heading and the title name the stage (`1d4c190`)

- `src/app/application/page.tsx:688-701` — one derived `stage` drives
  `stageHeading` ("Application" / "Review before submitting" / "Submitted") and,
  through a small effect, `document.title`.
- `page.tsx:771-773` — `<h1 id="stage-heading" data-stage={stage}>`.
- `page.tsx:795`, `page.tsx:856` — the receipt and review sections drop their
  now-duplicate `<h2>` and are labelled by the `h1`, so each stage has exactly
  one heading with that name and the existing test locators stay unambiguous.
- `src/app/application/layout.tsx` (new) — the route's opening title, since the
  page is a client component. Next writes the title only on a route change and
  the two later stages are reached without one, so the page's own updates
  survive.
- `src/app/globals.css:81-105, 925` — the "Frozen" and "Accepted" stamps move
  from the removed section headings onto `h1[data-stage]`, which is the thing
  that actually changed.

### D-P2-2 — a favicon (`e29403b`)

`src/app/icon.svg` — the product's own mark in its own two colours: a record
with a citation rule down its left edge in the evidence teal, and one line left
unwritten in the judgment ochre. Next's file-based metadata picks it up; no
layout change.

### D-P2-4 — the print rules name the controls (`3bad75b`)

`src/app/globals.css:896-909`. `.delivery` already carried `data-print="hide"`,
so an ancestor with `display:none` did keep the three controls off the printed
page — but each control's **own** computed display stayed `inline-block`, which
is what the gate inspected. Naming `[data-print="hide"] button` and
`[data-print="hide"] a` makes the computed style agree with what paints, and
keeps them off the page if the row is ever unwrapped.

### D-P2-5 — a malformed argument is a structured refusal (`b126702`)

- `src/webmcp/descriptors.ts:97-107` — `INVALID_REQUEST_RESULT`, built through
  `InvalidRequestFailureSchema` so it cannot drift, and already a member of
  every tool's callback result union.
- `descriptors.ts:158-162` — the input parse becomes `safeParse`; a failure
  returns that constant instead of throwing a raw ZodError at the host. The
  ZodError is deliberately not forwarded: it would echo the caller's own input
  back, and the message is a fixed literal in the contract.
- `tests/contract/webmcp-registration.test.ts:182-247` — the existing test is
  **strengthened, not weakened**: eight malformations across four tools
  (unknown enum value, unknown key, missing required key, wrong type, extra key
  on an otherwise valid input, three wrong-shape payloads), each asserted to
  return the exact `invalid_request` body, re-parsed through
  `InvalidRequestFailureSchema`, checked for JSON round-trip, and still asserted
  never to reach dispatch. A new companion test asserts a well-formed argument
  **does** still reach dispatch, so the guard refuses only what the schema
  refuses.

### The Assisted activity panel moves up (`080716c`)

`src/app/application/page.tsx:711-722` extracts the panel to one `activityPanel`
element; `page.tsx:898-904` hands it to `ApplicationController` as children,
which places it **directly beneath "Assisted access" and above the answers**.
On the frozen Review and the receipt — where there is no Assisted access
section — it stays at the foot of the page (`page.tsx:1176`), so the transcript
still survives the whole journey as Phase 2B intended. It remains a projection
of responses the page already received; no agent authority changed.

### Docs (`0151d7f`)

- **D-P2-3** — `docs/JUDGE-TESTING.md:152-158` and `docs/VIDEO-SCRIPT.md:100-106`
  now say the rows **become required** (they are on screen from first load,
  labelled "Not required"), and the script directs the shot to frame them
  *before* the binding so the label flip is the beat.
- **D-P2-6** — `README.md:55-56` and `docs/JUDGE-TESTING.md:172-173` quote the
  real copy: *"CiteApply will not choose between these. Read both records and
  pick the source you stand behind."*
- **All seven video-script mismatches** — see §5.
- `docs/JUDGE-TESTING.md` is aligned to every 2C change and gains two optional
  sections: **A13** (a second tab supersedes the first, with the exact
  `stale_page` JSON and the six things the first tab then does) and **A14** (a
  malformed argument returns `invalid_request` rather than throwing).

---

## 2. Evidence table

Every row was run after the final commit, against a clean
`rm -rf .next && npm run build`.

| # | Command / action | Result |
|---|---|---|
| 1 | `npm run verify:versions` | **PASS** — `v24.20.0 npm/11.19.0` |
| 2 | `npm run verify:dependencies` | **PASS** — `18 exact direct dependency pins` |
| 3 | `npm run verify:fixture-hashes` | **PASS** — `Verified 6 deterministic synthetic one-page PDFs.` |
| 4 | `npm run verify:production-imports` | **PASS** — `50 source files, no test/golden/generator/fixture/dev-only imports` (49 → 50: the new `src/app/application/layout.tsx`) |
| 5 | `npm run verify:surfaces` | **PASS** — `gate=W0-C0 manifest=42f69d1d…` — **unchanged from Phase 1, 2A, 2B and the gate**; still 6 webmcp tools |
| 6 | `npm run typecheck` | **PASS** — no output |
| 7 | `npm run lint` | **PASS** — no output, `--max-warnings=0` |
| 8 | `npm run test:all` | **PASS** — **59 tests, 59 pass, 0 fail, 0 skipped** (57 → 59: the two new contract tests) |
| 9 | `rm -rf .next && npm run build` | **PASS** — 9 routes (8 + `/icon.svg`), standalone output |
| 10 | `npm run verify:built-anti-hardcode` | **PASS** — `127 production text artifacts` |
| 11 | **README-verbatim start, fresh shell** (`env -i`, only the README's four lines) | **PASS** — landing `200`, `GET /api/demo` `200`, and the CSS bundle the page references `200`. Server log is the plain banner, nothing else. **This is the row the gate failed.** |
| 12 | Same, **without** `HOSTNAME` (the old command) | Refused `403` **and** logged `origin check refused: request host 0.0.0.0:3100 does not match APP_ORIGIN host localhost:3100 (if this server bound 0.0.0.0, set HOSTNAME to the APP_ORIGIN hostname)` |
| 13 | `npx playwright test tests/e2e tests/accessibility` | **25 passed, 1 skipped, 0 failed** (29.1 s) |
| 14 | Axe, WCAG 2.1 A + AA: landing, Conflict draft, disclosure dialog, ready draft, frozen Review, receipt | **0 violations each**, after the activity panel moved |
| 15 | `CITEAPPLY_EVIDENCE_DIR=docs/evidence/phase2c npx playwright test tests/e2e/webmcp-journey.spec.ts` | **2 passed** — the 13-step journey, **both packets**, real Chrome 152 |
| 16 | Console during both journeys | Only Chrome's HTTP status lines for the product's own deliberate refusals (403 `consent_required`, 409 `conflict_requires_human` / `not_ready_for_review`). **The favicon 404 Phase 2B recorded is gone.** No CSP error, no page error. `*-console-errors.txt` |
| 17 | `document.title` / `h1` across all three stages, Chrome 152 | `Application` / `Application — CiteApply`; `Review before submitting` / `Review before submitting — CiteApply`; `Submitted` / `Submitted — CiteApply` |
| 18 | `/icon.svg`, and the emitted tag | `200 image/svg+xml`; `<link rel="icon" href="/icon.svg?a4470bff1cb18e06" type="image/svg+xml" sizes="any">`. Zero console errors **or warnings** across landing + application |
| 19 | Print, `emulateMedia({media:'print'})`, computed styles | **Download JSON**, **Print** and **Start a new synthetic demo** all `display: none`; `.receipt` still `display: block`. `P2-4-print-preview.png` shows the full record and no interface |
| 20 | Activity panel position, 1280×900, after two tool calls | Heading order `Assisted access → Assisted activity → Where the assistant stops → Readiness → Answers → Synthetic sources`; panel top edge at **y = 448**, above the fold, both entries visible without scrolling (`P2-8-activity-panel-above-fold.png`) |
| 21 | `git diff 6848629..HEAD -- src/contracts src/domain src/evidence src/server/services src/server/db src/webmcp/bridge.ts src/webmcp/invoke.ts` | **empty** — no contract, domain, evidence, service, database, bridge or dispatcher file changed in this phase |

### The 25/1 breakdown
24 are the Phase 2B set, unchanged in intent — three specs gained a
`selectOption` for the reason and two gained a `toBeDisabled` assertion, both
**tightenings**. The new one is `tests/e2e/stale-page.spec.ts`. The single skip
is still `tests/e2e/raw-genuine-client-chronology.spec.ts:37` — it needs three
real, unedited ChatGPT-desktop capture files that only the user can produce.
**No test was weakened, loosened, or deleted.**

---

## 3. The 13-step journey, re-driven in real Chrome, both packets

Screenshots and the verbatim 608-line tool log are in this directory
(`tool-log.md`, `<packet>-step*.png`).

| Step | Supported | Conflict | Evidence |
|---|---|---|---|
| 1–2 packet start, runtime PDF parse, form opens | PASS | PASS | `*-step01-landing.png`, `*-step02-form-open.png` |
| 3 six tools discovered; protected calls before consent | PASS | PASS | `*-step03-pre-consent-refusals.png`; `consent_required`, no field ids disclosed |
| 4 disclosure + Allow | PASS | PASS | `*-step04a-consent-dialog.png`, `*-step04b-access-allowed.png` |
| 5 reads, then a version-checked batch | PASS | PASS | `ok:true` |
| 6 the form updates visibly; guardian branch opens | PASS | PASS | `*-step06-…-VISIBLE.png` |
| 6b agent re-reads active requirements and binds the branch | PASS | PASS | `*-step06b-branch-bound.png` |
| 7 income | binds `ok:true` | **refused** `conflict_requires_human`, revision unchanged | `*-step07-income.png`; `tool-log.md:495` |
| 8 agent proposes the `.test` email; field stays undeclared | PASS | PASS | `*-step08-…png` |
| 9 premature prepare fails closed | PASS (`declaration_required`) | PASS (**both** blockers) | `tool-log.md:565` |
| 10 applicant decides — **now having to state the reason first** | PASS | PASS | `*-step10-human-decisions.png` |
| 11 agent prepares; assistance closes and the page says so | PASS | PASS | `*-step11-…png`; tool result carries no `contentHash` |
| 12 Return invalidates; manual prepare reaches the same Review | PASS | PASS | `*-step12a/b-…png` |
| 13 one atomic submission; receipt | PASS | PASS + the conflict warning | `*-step13-receipt.png` |
| 13b JSON download + print view semantically equal | PASS | PASS | `receipt-delivery.spec.ts`, 2/2 |

---

## 4. The gate's adversarial list, re-run in Chrome 152

| Probe | Result |
|---|---|
| `getTools()` surface | Exactly the six documented names. Filtering for `submit\|declare\|resolve\|confirm\|receipt\|export` returns `[]` — **no such tool exists** |
| **Malformed arguments** (D-P2-5) — `{bindings:[]}`, `{detail:"full"}`, `{unexpected:1}` | All three return `{"ok":false,"error":{"code":"invalid_request","message":"The request is not valid.","safeActions":["use_visible_application"]}}`. **No `UnknownError`.** None reached the server |
| Protected reads before consent | `consent_required`, byte-for-byte, disclosing nothing |
| **Reason omitted** (D-P1-1) | Selector value `""`; **both** source buttons `disabled`; a **forced** click leaves the income row reading "Two accepted sources disagree. You decide." No resolution, no manufactured reason (`ADV-reason-omitted.png`) |
| Agent attempts to bind the conflicted income (well-formed) | **HOLDS** — `conflict_requires_human`, nothing written (`tool-log.md:495`) |
| **Second tab** (D-P1-2) | Tab 2 lands with assisted access **off** (fails closed). Tab 1 still says it is current until its own next call; that call returns `{"ok":false,"error":{"code":"stale_page","message":"This page is no longer current.","safeActions":["reload_current_application"]}}`, and tab 1 then reads **"This page is no longer current. Reload to continue."**, the "Assisted access is allowed" claim is gone, **Reload this page** is present, and **Prepare review**, **Save email** and **Review and allow assisted access** are all disabled (`ADV-stale-tab.png`, `P1-2-tab1-before.png`, `P1-2-tab1-after-tool-call.png`) |
| Reload after being superseded | Session won back, assisted access off (fails closed), no saved work lost, second tab now stale (asserted in `stale-page.spec.ts`) |
| Replay / reuse / stale revision | Unchanged from the gate: replay, `request_reuse_mismatch`, `stale_state` all still correct (`webmcp-journey.spec.ts`) |

---

## 5. The seven video-script mismatches

| # | Gate finding | What `docs/VIDEO-SCRIPT.md` says now |
|---|---|---|
| 1 | `LIVE_URL` does not exist | The recording target is the local production build at `http://localhost:3100`, started as the README prescribes; with a standing instruction never to narrate a URL that is not on screen, and what to substitute if one is published |
| 2 | "I say why" was false | It is now **true** (D-P1-1), and the script makes it a shot: the disabled buttons and the placeholder are framed, and the narration reads *"Notice the buttons are dead until I say why: the site will not write a reason on my behalf."* The receipt narration now names the reason as the one the presenter gave |
| 3 | The branch does not "appear" | Rewritten as *"just became required — watch the labels flip"*, with the shot directed to frame both rows **before** the binding lands |
| 4 | **Save email** after `propose_email` | Dropped. The shot is **I declare this is my address** alone, with the reason stated: re-saving withdraws a declaration already made |
| 5 | Narration claimed the tool path over a shot of a button | The shot now calls `prepare_submission_review` **on camera** and shows it returning only `readiness` and an opaque `reviewRef`; an alternative wording is given for anyone who would rather click the button |
| 6 | "Nobody clicked anything" | *"Nobody typed into that form"* — true of the whole session, in both the shot list and the continuous narration |
| 7 | Print preview still shows the two buttons | Now a positive note: the two buttons and **Start a new synthetic demo** are **correctly absent** from the print preview, which is verified (row 19) |

---

## 6. What is NOT verified

- **A live URL / any deployed origin. D-P1-3 is NOT fixed** — it is out of this
  phase's scope and blocked on the user (deployment was deferred by the
  2026-09-03 08:10 decision). `LIVE_URL` is still an unfilled placeholder in
  `devpost-submission.md:3,8,210,230`, which still asserts *"Working, deployed,
  publicly reachable"*. **That file must not be submitted as written.**
  `README.md` and `docs/JUDGE-TESTING.md` no longer depend on it — both now
  point at the local build — and `docs/VIDEO-SCRIPT.md` can be shot as written.
  `__Host-` cookie behaviour over HTTPS, HSTS and the production headers on a
  real domain remain unverified.
- **26/26 Playwright.** Still unreachable:
  `raw-genuine-client-chronology.spec.ts` needs three real ChatGPT-desktop
  capture files. The honest target is 25 passed + 1 documented skip.
- **The ChatGPT in-app browser.** Untouched. Only the user can test it.
- **An autonomous agent choosing the calls.** Every tool call in this phase was
  scripted through Chrome's own `document.modelContext` API, exactly the
  limitation `README.md` declares.
- **`stale_page` reaching the page by any route other than the three wired.**
  The latch is proven on tool results (`recordActivity`), human actions
  (`runAction`) and `reconcile`. Nothing else in the page issues a request that
  can return `stale_page`, but I did not exhaustively enumerate future call
  sites — a new fetch path added later would need to call `noteOutcome`.
- **Session expiry at minute 50.** Still not exercised, and Phase 1's finding
  that no expiry copy exists in `src/app/application/page.tsx` still stands.
  This phase added none.
- **The review stage's own buttons under print.** **Submit this application**
  and **Return to draft** are *not* hidden under `@media print` — only the
  receipt's delivery row was in scope for D-P2-4. Printing a frozen review
  (rather than a receipt) will show them. Not a regression; not fixed.
- **`/favicon.ico` still returns 404.** Chrome does not request it once
  `<link rel="icon">` is present — verified, zero console errors — but a client
  that ignores the link tag and asks for `/favicon.ico` by convention still gets
  a 404. No `public/favicon.ico` was added.
- **The favicon at small sizes.** The SVG was served correctly and inspected in
  the page source; it was not rasterised and eyeballed in a real tab strip or
  bookmark bar.
- **Actual paper output.** Print is verified through
  `emulateMedia({media:'print'})`, computed styles and a screenshot. No page was
  sent to a printer or rendered by a print driver; pagination across more than
  one physical page is unproven.
- **Screen-reader behaviour.** Axe is a static rule engine. The new
  `aria-describedby` hint on the reason selector and both source buttons, the
  `data-stale` status line and the stage `h1` are all axe-clean, but no
  assistive technology was driven.
- **Widths other than 1280 px** for the moved activity panel. It was
  photographed at 1280×900; the panel is a plain block in the same
  `auto-fit minmax` system Phase 2B reasoned about, but intermediate breakpoints
  and 390 px were not re-photographed this phase.
- **Rate limiting under real pressure.** `counter` rows were cleared before each
  browser run (sentinels untouched); `at_capacity` was never observed and its
  friendly copy is still unproven.
- **Dark mode.** Still no dark palette; the product renders in its own light
  palette regardless of the OS setting.
- **The user's Postgres.app cluster on :5432.** Every result came from the :5433
  throwaway cluster. No system or security setting was changed.
- **The `onMutationUnprojected` fallback path.** Still implemented, typechecked,
  and never exercised in a browser.

---

## 7. Agent authority

Unchanged, and provably so. `git diff 6848629..HEAD` over `src/contracts`,
`src/domain`, `src/evidence`, `src/server/services`, `src/server/db`,
`src/webmcp/bridge.ts` and `src/webmcp/invoke.ts` is **empty**.
`verify:surfaces` reports the same manifest hash `42f69d1d…` as Phase 1.

The seven source files this phase touched are the application page, its new
layout, the stylesheet, the favicon, the consent controller (one `disabled`
prop), `origin.ts` (logging only — the response body is byte-identical), and
`descriptors.ts` (`parse` → `safeParse`, returning a refusal the contract
already defined). The agent can still read, bind and prepare; it still cannot
declare, resolve, confirm, submit or export. `getTools()` filtered for those
verbs returns `[]`.
