# Phase 2D — a site the demonstration lives inside

Branch `hackathon-final`, worktree `scratchpad/wt-508940b`. Base is `a7b598a`
(the Phase 2C evidence report); this phase is the six commits `06fe8a1`…`665a550`
plus this report.

Node v24.20.0, npm 11.19.0. Browser for every UI result below: **Google Chrome
152.0.7977.66**, launched with `channel: "chrome"` and
`--enable-features=WebMCPTesting`, tools invoked through the browser's own
`document.modelContext.getTools()` / `executeTool(toolObject, JSON.stringify(args))`.
Database: the throwaway cluster `postgresql://citeapply@127.0.0.1:5433/citeapply`
(Phase 1 correction E-1); the user's Postgres.app on :5432 was not touched.
App under test: the **standalone production build** from
`rm -rf .next && npm run build`, started exactly as `README.md` prescribes.

The brief was the user's verdict: *"so bland, looks so bad, we should have a
full-fledged website and then show what we can do with and without WebMCP."*

---

## 1. What changed

| Commit | What |
|---|---|
| `06fe8a1` | A site shell and a visual system |
| `1dd2fbd` | The landing page rebuilt as a scholarship program's own site |
| `74fb42f` | A **For agents** page at `/agents` |
| `1f88b41` | The application laid out as a workspace with a rail |
| `f659a08` | The `/agents` route added to the axe scan |
| `665a550` | The rail's ledger scrolls, not the rail |

### The shell (`06fe8a1`)

`src/ui/site/shell.tsx` (new, 132 lines) and `src/app/layout.tsx:53-59`.

- **Masthead** — the program's mark (inline SVG, the product's own two colours),
  the wordmark, and four links: Scholarship, How it works, Apply, For agents.
- **Footer** — the synthetic-data disclaimer at full weight rather than as fine
  print, placeholder program-office contacts (`aid-office@horizon.test`, a
  placeholder address and line), and where the source and documents are:
  `LICENSE`, `README.md`, `docs/JUDGE-TESTING.md`,
  `docs/verification/genuine-chrome-webmcp.md`.
- Both carry `data-print="hide"`, so neither reaches a printed receipt.

`src/app/globals.css` is where the "bland" was. The two colours keep their
meanings exactly — teal is the portal speaking with a record behind it, ochre is
the portal declining to decide — and what is new is a world for them to sit in:

- `:root:12-30` — `--band #0a2f33` (masthead and footer), `--field #e9eef0`
  (the page ground), `--edge`, `--measure-wide 69rem`.
- `body:39-62` — the ground is ruled archival stock: a 4 rem rule at 2.8 %
  opacity, drawn as a repeating gradient. **No asset, nothing to fetch**; the
  CSP is `default-src 'self'` and no exception was needed anywhere in this phase.
- `main:64-82` — every page is now a filed sheet: paper on the field, a 3 px
  teal top edge, a hairline border and one soft shadow.
- Type is unchanged. Newsreader / Public Sans / IBM Plex Mono were already a
  deliberate trio, already self-hosted at build time by `next/font/google`, and
  already CSP-clean. The scale was tightened (hero to `clamp(2.4rem, …, 3.6rem)`,
  section headings to 1.65 rem on a rule).

One selector had to move: `section article button` became `.packets article
button`, because the packet chooser left its `<section>` for the hero. Missing
that would have shipped a WCAG contrast failure — axe caught it, and it is
row 14 below.

### The landing page (`1dd2fbd`)

`src/app/page.tsx` (191 → 464 lines), `src/ui/site/hero-figure.tsx` (new).

- **Hero** — the headline is unchanged (`The agent cites. You decide.`), the
  standing synthetic-data stamp sits under it, and beside it is
  `HeroFigure`: an application sheet whose answers each stand on a teal citation
  rule and two of which are tethered down to the records they were read from,
  with the last row left **blank**, stamped **You decide** in ochre, and joined
  by a *broken* tether to the two income statements that disagree. Inline SVG,
  ~150 lines, no external asset.
- **The chooser is inside the hero** (`page.tsx:196-244`), so
  **Start supported packet** / **Start conflict packet** are one click from the
  headline, as the brief required. The secondary action —
  **See how agents help** — links to `/agents`.
- **What the scholarship is** — award (INR 120,000 for the academic year,
  renewable once), who can apply, cycle dates (1 March – 30 June 2026,
  decisions by 15 August), and the three records. Prefaced with *"Every figure
  below is invented for this demonstration."*
- **How it works** — three numbered steps. Numbered because it genuinely is a
  sequence.
- **With and without an assistant** — two facing timelines, the manual one on
  ochre (it is made of decisions), the assisted one on teal (evidence is all it
  contributes), each six beats, converging on: *"Both paths reach the same three
  decisions that are only yours, and the same frozen review — the same content
  hash on the same receipt. The assistant removes the reading and the retyping.
  It does not remove you."*
- **The six tools** — cards carrying the `readOnly` / `untrustedContentHint`
  values from the registered descriptors; the two that can move the draft carry
  an ochre top edge instead of a teal one.
- **Try it with an agent** — the flag text and all three prompts are **verbatim**
  from the previous landing page. Nothing was reworded.
- **Common questions** — is this real, what the assistant can never do, what is
  stored and for how long.

### For agents (`74fb42f`)

`src/app/agents/page.tsx` (new, 260 lines) and `src/app/agents/layout.tsx`.

The six tools with their hints, their consent stage and a summary drawn from
each descriptor's own description; the boundary read from
`ASSISTED_ACCESS_CATALOG` — the same constant the consent disclosure renders,
so the page and the dialog cannot drift; the Chrome steps; what to ask; the
verbatim `conflict_requires_human` refusal; the ChatGPT in-app browser including
its honest "WebMCP is unavailable" fallback; and a closing section on what the
demonstration does **not** claim. Every sentence is restated from `README.md`,
`docs/JUDGE-TESTING.md` or the descriptors. **No new claim was introduced.**

The page is a client component with its title in a route layout: the catalog
lives in `src/ui/components/consent.tsx`, which is `"use client"`, and a server
component importing a non-component export from it receives `undefined`. That
was a real 500 during the build, found and fixed. `consent.tsx` is one of the
verifier's frozen `ERRATUM_PROOF_PATHS` and was **not** modified.

### The application workspace (`1f88b41`, `665a550`)

`src/app/application/page.tsx`. **Every label, control name, data attribute and
test locator is unchanged. No Playwright spec needed editing.**

- `page.tsx:47-60, 795-816` — a stage indicator: Draft → Review → Submitted,
  with `data-state` of `done` / `current` / `todo` and `aria-current="step"`.
  Both crossings are one-way and the page now shows all three stages, not only
  the one it is on.
- `page.tsx:929-931, 1235-1236` — two columns at desktop
  (`globals.css`, `.workspace`): the form is the page, and **Assisted access +
  Assisted activity + Where the assistant stops** move into a sticky rail beside
  it. At ≤ 62 rem the rail stacks *above* the form; at ≤ 40 rem each answer's
  question sits above its own controls.
- `main` is `portal portal-wide` on the draft and `portal` on the review and the
  receipt — the draft is a workspace and needs width, the frozen review and the
  receipt are documents and keep the 47 rem reading measure.
- The **disputed income row** drops the label column and takes the full width,
  so the two candidate records sit side by side at 1440 and 1024 rather than
  stacked in a 30 %-wide cell.
- `page.tsx:1005-1009` — one line under **Answers**: *"Every control below is
  yours, with or without an assistant. Nothing here is hidden while assisted
  access is off — that is simply the application, filled in by hand."* This is
  the without-WebMCP path stated on the page itself; it was already proven by
  `applicant-journey.spec.ts:154` ("assistance is optional and the manual path
  never depends on it").
- The two waiting states became `.waiting` panels that say what is happening and
  why it takes a moment, instead of one grey sentence on an empty page.
- `665a550` — the sticky rail's `max-height` clipped **Where the assistant
  stops**, which does not grow. The bound moved onto `.activity`, the only part
  that does; below 62 rem nothing scrolls.

---

## 2. Evidence table

Every row was run after the final commit, against a clean
`rm -rf .next && npm run build`.

| # | Command / action | Result |
|---|---|---|
| 1 | `npm run verify:versions` | **PASS** — `v24.20.0 npm/11.19.0` |
| 2 | `npm run verify:dependencies` | **PASS** — `18 exact direct dependency pins` (no dependency was added) |
| 3 | `npm run verify:fixture-hashes` | **PASS** — `Verified 6 deterministic synthetic one-page PDFs.` |
| 4 | `npm run verify:production-imports` | **PASS** — `54 source files` (50 → 54: `shell.tsx`, `hero-figure.tsx`, `agents/page.tsx`, `agents/layout.tsx`) |
| 5 | `npm run verify:surfaces` | **PASS** — `gate=W0-C0 manifest=42f69d1d…` — **unchanged from Phase 1, 2A, 2B, 2C and the gate**; still 6 webmcp tools |
| 6 | `npm run typecheck` | **PASS** — no output |
| 7 | `npm run lint` | **PASS** — no output, `--max-warnings=0` |
| 8 | `npm run test:all` | **PASS** — **59 tests, 59 pass, 0 fail, 0 skipped** (unchanged from 2C) |
| 9 | `rm -rf .next && npm run build` | **PASS** — 11 routes (`/agents` is the new one), standalone output |
| 10 | `npm run verify:built-anti-hardcode` | **PASS** — `137 production text artifacts` |
| 11 | **README-verbatim start, fresh shell** (`env -i`, only the README's four lines) | **PASS** — `/` 200, `/agents` 200, `/application` 200, `/icon.svg` 200, `GET /api/demo` 200, the CSS bundle 200, and the first `woff2` the bundle references 200 (fonts are served **from this origin**). Server log is the plain banner, nothing else |
| 12 | `npx playwright test tests/e2e tests/accessibility` | **26 passed, 1 skipped, 0 failed** (29.5 s). 25 → 26 is the new `/agents` axe case; **no existing spec was edited** |
| 13 | Axe, WCAG 2.1 A + AA: landing, **For agents**, Conflict draft, disclosure dialog, ready draft, frozen Review, receipt | **0 violations each**. The shell is scanned implicitly on all seven |
| 14 | Axe, first run after the shell landed | **1 violation, found and fixed**: `.interesting > button` had 2.43:1 contrast because the chooser had left its `<section>` and lost `color: #fff`. `globals.css` now keys the primary treatment off `.packets article button`. Re-scanned clean |
| 15 | `CITEAPPLY_EVIDENCE_DIR=docs/evidence/phase2d npx playwright test tests/e2e/webmcp-journey.spec.ts` | **2 passed** — the 13-step journey, **both packets**, real Chrome 152. 608-line `tool-log.md`, 32 step screenshots |
| 16 | Conflict refusal in the tool log | `tool-log.md:495` — `{"ok":false,"error":{"code":"conflict_requires_human","message":"Income sources disagree. Resolve this in CiteApply.","safeActions":["resolve_in_visible_application"]}}`, and `:565` the premature prepare failing closed on **both** blockers |
| 17 | Console during both journeys | Only Chrome's HTTP status lines for the product's own deliberate refusals (403 `consent_required`, 409 `conflict_requires_human` / `not_ready_for_review`). **No CSP error, no font or image failure, no page error** — the ruled ground and both inline SVGs add nothing to fetch. `*-console-errors.txt` |
| 18 | Screenshots at 1440, 1024 and 390 of landing (full page), `/agents`, application after the agent batch, review, receipt | **15 files**, `docs/evidence/phase2d/screens/`. The application shot is a real assisted mutation: four `bind_claim` entries applied through `document.modelContext` in one version-checked call |
| 19 | `git diff a7b598a..HEAD -- src/contracts src/domain src/server src/webmcp/bridge.ts src/webmcp/invoke.ts src/webmcp/descriptors.ts src/ui/components/consent.tsx` | **empty** — every path the brief froze is untouched, and so is the consent catalog |

### The 26/1 breakdown

25 are the Phase 2C set, **unedited** — every locator, label, control name and
data attribute survived the redesign. The new one is the `/agents` axe case. The
single skip is still `tests/e2e/raw-genuine-client-chronology.spec.ts:37`: it
needs three real, unedited ChatGPT-desktop capture files that only the user can
produce. **No test was weakened, loosened, or deleted.**

---

## 3. Agent authority

Unchanged, and provably so — row 19. No file under `src/contracts`,
`src/domain`, `src/server`, `src/evidence`, or `src/webmcp` was touched. The
Assisted activity panel is still a projection of responses the page already
received. The **For agents** page reads the boundary from the same constant the
consent disclosure renders, and adds nothing to it.

---

## 4. What is NOT verified

- **A live URL.** Still none, and still out of scope (the 2026-09-03 08:10
  decision). `devpost-submission.md` still asserts a deployment it does not have
  and **must not be submitted as written**. `__Host-` cookie behaviour over
  HTTPS, HSTS and production headers on a real domain remain unverified.
- **The footer's repository and document links are text, not links.** No public
  repository exists yet and nothing under `docs/` is served by the app (Next
  serves only `public/`), so linking them would produce a 404 or a claim about a
  URL that does not exist. They are shown as paths. When Phase 3 publishes a
  repository, they should become real links.
- **27/27 Playwright.** Still unreachable for the reason above.
- **The ChatGPT in-app browser.** Untouched, and the `/agents` page's section on
  it is restated from `docs/JUDGE-TESTING.md`, not re-tested. Only the user can
  test it.
- **An autonomous agent choosing the calls.** Every tool call in this phase was
  scripted through Chrome's own `document.modelContext`, exactly the limitation
  `README.md` and the new `/agents` page both declare.
- **Widths other than 1440, 1024 and 390.** Those three were photographed on
  every required screen. 62 rem and 40 rem are the two breakpoints; both were
  exercised by the 1024 and 390 captures, but no intermediate width was
  photographed, and no real phone or tablet was used — only emulated viewports
  in desktop Chrome.
- **The sticky rail under a short viewport.** The rail is `position: sticky` and
  its ledger scrolls at 21 rem. It was verified at 900 px viewport height. A
  much shorter window (a laptop with many toolbars, or a landscape phone) was
  not tried.
- **Print, beyond what 2C verified.** The shell carries `data-print="hide"` and
  the print block resets the sheet, but this phase did **not** re-run the print
  computed-style check; `receipt-delivery.spec.ts` (which asserts **Download
  JSON** is hidden under print media) passed, and that is the whole of the print
  evidence here. No page was sent to a printer.
- **Dark mode.** Still none. The product renders in its own light palette
  regardless of the OS setting. The new ground and band are light-mode values.
- **Screen readers.** Axe is a static rule engine. The stage indicator's
  `aria-current="step"`, the nav landmark, the footer's three labelled sections
  and the two hero/figure `aria-label`s are all axe-clean, but no assistive
  technology was driven.
- **The hero illustration at very small sizes.** It scales with the column and
  was inspected at 1440, 1024 and 390. It was not checked against Windows
  high-contrast mode or forced-colors.
- **Session expiry at minute 50.** Still not exercised; Phase 1's finding that
  no expiry copy exists still stands. This phase added none.
- **Rate limiting under real pressure.** `counter` rows were cleared before each
  browser run (sentinels untouched); `at_capacity` was never observed and its
  friendly copy is still unproven.
- **`/favicon.ico` still returns 404** for a client that ignores
  `<link rel="icon">`. Unchanged from 2C.
- **The user's Postgres.app cluster on :5432.** Every result came from the :5433
  throwaway cluster. No system or security setting was changed.
