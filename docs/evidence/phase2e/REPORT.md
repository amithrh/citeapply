# Phase 2E — a landing page that looks like a product

Branch `hackathon-final`, worktree `scratchpad/wt-508940b`. Base is `438964e`
(the Phase 2D evidence report); this phase is the commit `accb8fc` plus this
report.

Node v24.20.0, npm 11.19.0. Browser for every UI result below: **Google Chrome**
launched through Playwright's `channel: "chrome"`. Database: the throwaway
cluster `postgresql://citeapply@127.0.0.1:5433/citeapply`; the user's
Postgres.app on :5432 was not touched. App under test for every row of the
evidence table and every screenshot: the **standalone production build** from
`rm -rf .next && npm run build`, started exactly as `README.md` prescribes and
left running on :3100.

The brief was the user's verdict on Phase 2D: *"slightly better, but make the
landing page more fancy; it should look like a real, pretty good landing page,
as many are able to create such pages."*

---

## 1. The design decision

Phase 2D made the whole site one visual object: every route is a filed sheet on
a ruled archival ground. That is right for the application, the review and the
receipt, which are documents. It is wrong for the front page, which is a
shopfront — and being the same object as the receipt is exactly why it read as
bland.

So the landing page, and only the landing page, stops being a sheet.
`main.landing` drops the frame, the border, the shadow and the measure, and the
page becomes a stack of full-bleed bands, each with its own ground and its own
reading column (76 rem, wider than the 69 rem the filed sheets use). Every
other route is untouched: the change is scoped by the `.landing` class, and the
one rule that had to reach outside it — the sticky masthead — is scoped with
`body:has(main.landing)`, so `/application`'s own sticky rail is not disturbed.

**Boldness is spent in one place.** The hero is a dark engraved board with two
soft lamps in the product's own two colours, carrying a display headline at
`clamp(2.5rem … 4.15rem)` in Newsreader at 0.99 line-height, and one large
animated illustration. Everything below it is disciplined: light bands,
alternating grounds, one accent per section, and the two colours never used for
decoration. Teal still means the portal speaking with a record behind it; ochre
still means the portal declining to decide. Nothing on this page uses either
colour for anything else.

The typeface trio is unchanged — Newsreader, Public Sans, IBM Plex Mono, still
self-hosted at build time by `next/font/google`, still CSP-clean. What changed
is the scale and the weight contrast.

### The hero illustration (`src/ui/site/hero-scene.tsx`)

One inline SVG on a fixed `viewBox`, animated with CSS keyframes. It shows the
sequence this product actually performs: three answers arrive on their citation
rules and tether down to the record each was read from; a ledger beside the
sheet names the three real registered tools doing it; the income row's two
tethers reach for two records that disagree and arrive at neither; the write
comes back `conflict_requires_human` with *nothing was written*; and the row is
stamped **You decide** in ochre.

Three properties were designed in, not discovered:

1. **It does not fake a live tool call.** A visible `figcaption` under it reads
   *"An illustration of the sequence this demonstration performs. It is a
   drawing, not a live session."* The tool names shown are the real registered
   ones and are never abbreviated, because a shortened tool name is a wrong
   tool name.
2. **The unanimated state is the finished state.** Every element's resting
   style is the end of the sequence; the keyframes only take things away and
   hand them back. The whole animation block sits inside
   `@media (prefers-reduced-motion: no-preference)`, so a reduced-motion reader
   gets `animation: none` — which is the *complete* diagram, not an empty
   frame. Row 12 of the screenshot table is the proof.
3. **It is deterministic.** Every animated element shares one 18 s linear loop
   with no delay and no randomness, so the composition at a given moment is
   identical on every loop and a screenshot of it is reproducible.

### What is on the page

Hero (two CTAs, conflict primary in ochre, supported secondary, plus the
*See how agents help* link) · a proof strip of four facts · the program's own
facts · four alternating feature bands, the second of which is the refusal
rendered as the server's verbatim payload on a dark console card · two facing
timelines whose three human-only beats sit on the same grid rows (CSS
`subgrid`) so the ochre markers line up across the gap before you read a word ·
the six tools grouped four-that-read against two-that-write, with hover lift ·
a console panel with copy buttons for the Chrome flag, the launch switch and
the three prompts · three numbered steps on a connected progress line · a
`<details>` accordion · a closing band.

### The four proof tiles are checkable, not asserted

| Tile | Where it comes from |
|---|---|
| **6** WebMCP tools registered | `npm run verify:surfaces` — `webmcpTools: 6`, manifest unchanged since Phase 1 |
| **0** ways an agent can submit | the frozen `ASSISTED_ACCESS_CATALOG` and the server's refusals, both untouched this phase |
| **1** call to bind a whole batch | `apply_evidence_backed_answers`, atomic and version-checked |
| **=** same review, either way | `tests/integration/…` — *"identical answers hash identically whether manual or assisted"* |

No adoption figure, no benchmark, no logo, no testimonial, and no invented
metric appears anywhere on the page.

---

## 2. Evidence table

Every row was run after the final source commit, against a clean
`rm -rf .next && npm run build`.

| # | Command / action | Result |
|---|---|---|
| 1 | `npm run verify:versions` | **PASS** — `v24.20.0 npm/11.19.0` |
| 2 | `npm run verify:dependencies` | **PASS** — `18 exact direct dependency pins`. **No dependency was added**; every visual effect on this page is CSS or inline SVG |
| 3 | `npm run verify:fixture-hashes` | **PASS** — `Verified 6 deterministic synthetic one-page PDFs.` |
| 4 | `npm run test:security` (run first, before any edit, and again at the end) | **PASS** — 8 tests, 8 pass. No forbidden production literal, no forbidden import |
| 5 | `npm run verify:production-imports` | **PASS** — `57 source files` (54 → 57: `hero-scene`, `figures`, `motion`, `copy-button` added, `hero-figure` removed) |
| 6 | `npm run verify:surfaces` | **PASS** — `gate=W0-C0 manifest=42f69d1d…` — **unchanged from Phase 1, 2A, 2B, 2C, 2D and the gate**; still 6 webmcp tools |
| 7 | `npm run typecheck` | **PASS** — no output |
| 8 | `npm run lint` | **PASS** — no output, `--max-warnings=0` |
| 9 | `npm run test:all` | **PASS** — **59 tests, 59 pass, 0 fail, 0 skipped** (unchanged from 2C and 2D) |
| 10 | `rm -rf .next && npm run build` | **PASS** — 11 routes, standalone output. `/` is 9.83 kB, 116 kB first load |
| 11 | `npm run verify:built-anti-hardcode` | **PASS** — `137 production text artifacts` (unchanged) |
| 12 | **README-verbatim start, fresh shell** (`env -i`, only the README's four lines) | **PASS** — `/` 200, `/agents` 200, `/application` 200, `/icon.svg` 200, the CSS bundle 200, and the first `woff2` it references 200 (fonts served **from this origin**). `GET /api/demo` returns **403 `invalid_request`** to a bare `curl` and **200** with `Sec-Fetch-Site: same-origin` — the origin check working, and the server logs the one line naming it |
| 13 | `npx playwright test tests/e2e tests/accessibility` (`APP_ORIGIN` exported) | **26 passed, 1 skipped, 0 failed** (29.0 s). **No spec was edited, weakened or deleted**; both packet buttons keep their exact accessible names and every existing locator still finds them |
| 14 | Axe, WCAG 2.1 A + AA, **landing** | **0 violations** — including the dark hero, the proof strip, the dark refusal band, both consoles and the closing band, all of which are new colour on new ground |
| 15 | Axe, WCAG 2.1 A + AA, the other six screens (For agents, conflict draft, disclosure dialog, ready draft, frozen review, receipt) | **0 violations each** — `/agents` was re-scanned because it shared four CSS rules with the old landing block |
| 16 | Console, network and page errors across a full scroll of the built landing in Chrome | **completely empty** — no console line of any type, no page error, no failed request. **No CSP violation**: the gradients, the grid, the glow blurs and all five SVGs add nothing to fetch under `default-src 'self'` |
| 17 | Cumulative layout shift over the same scroll (`PerformanceObserver`, `layout-shift`) | **0** — every SVG carries a `viewBox` and reserves its height before paint, and no animation touches layout |
| 18 | Reveal behaviour without JavaScript | **Content is visible.** The hidden half of the reveal applies only under `html[data-motion="on"]`, which `motion.tsx` sets *after mount* — no script, no hiding. It is additionally inside `prefers-reduced-motion: no-preference`, and a `@media print` rule forces it visible on paper |
| 19 | Screenshots at 1440 (full page and above the fold), 1024, 768 and 390, plus mid-animation and `prefers-reduced-motion: reduce` | **11 files**, `docs/evidence/phase2e/screens/`, all from the standalone production build |
| 20 | `git diff 438964e..HEAD -- src/app/application src/ui/controllers src/ui/components/consent.tsx src/contracts src/domain src/server src/webmcp src/evidence` | **empty** — every path the brief froze is untouched. The change is 7 files: `page.tsx`, `globals.css`, and the four new components minus the one they replace |

### The 26/1 breakdown

The same 26 as Phase 2D, unedited. The single skip is still
`tests/e2e/raw-genuine-client-chronology.spec.ts:37`: it needs three real,
unedited ChatGPT-desktop capture files that only the user can produce.

### Screenshots

| File | What |
|---|---|
| `screens/landing-1440-full.png` | the whole page at 1440 |
| `screens/landing-1440-fold.png` | above the fold at 1440 — headline, lead, both CTAs and the illustration all visible in 900 px |
| `screens/landing-1024-full.png`, `screens/landing-1024-fold.png` | 1024 |
| `screens/landing-768-full.png`, `screens/landing-768-fold.png` | 768 — the hero has become one column |
| `screens/landing-390-full.png`, `screens/landing-390-fold.png` | 390 — CTAs full width, proof tiles one per row, lanes stacked |
| `screens/landing-1440-hero-animation.png` | the illustration at 13 s, 72 % through the loop: the refusal has popped and **You decide** has arrived |
| `screens/landing-1440-hero-reduced-motion.png` | the same illustration under `prefers-reduced-motion: reduce` — **the complete diagram**, which is the point |
| `screens/landing-1440-reduced-motion.png` | the whole fold under reduced motion |

Full-page shots are captured at device scale 1. At scale 2 the 1440 page is
17 954 px tall, past Chrome's 16 384 px texture limit, and its own full-page
stitcher silently repeats the top of the document into the tail of the image.
That is a capture artifact, not a page defect — the same page at scale 2 in a
900 px viewport is correct, and rows 16 and 17 were measured on a live scroll.

---

## 3. Agent authority

Unchanged, and provably so — row 20. No file under `src/contracts`,
`src/domain`, `src/server`, `src/evidence`, `src/webmcp`, `src/ui/controllers`,
`src/ui/components/consent.tsx` or `src/app/application` was touched, and the
surface manifest hash is the same one Phase 1 froze. This phase added no tool,
no route, no capability and no claim. The tool table on the page still restates
the descriptors the page really registers, and the refusal shown in the feature
band is the byte-for-byte payload the server sends.

---

## 4. What is NOT verified

- **A live URL.** Still none, and still out of scope.
  `devpost-submission.md` still asserts a deployment it does not have and
  **must not be submitted as written.** `__Host-` cookie behaviour over HTTPS,
  HSTS and production headers on a real domain remain unverified.
- **Browsers other than Chrome.** Every result here is Chrome. The page uses
  three features whose fallbacks were designed but not exercised in a browser
  that lacks them: `:has()` (without it the masthead is not sticky — the page
  is otherwise identical), `grid-template-rows: subgrid` (without it the two
  timelines still render, but their ochre beats no longer line up row for row),
  and `backdrop-filter` (without it the scrolled masthead is opaque rather than
  blurred). Safari and Firefox were not opened.
- **The Clipboard API fallback.** `copy-button.tsx` reports
  *"Clipboard unavailable — select the text above"* when `navigator.clipboard`
  is missing or the write is refused. The success path was clicked; **the
  failure path was not forced**, so that string has never been seen on screen.
- **Screen readers.** Axe is a static rule engine. The illustration's
  `role="img"` and its long `aria-label`, the `aria-hidden` on every decorative
  drawing and both glow shapes, the `role="status"` on the copy result and the
  `<details>` accordion are all axe-clean, but no assistive technology was
  driven and nobody listened to the `aria-label` read aloud.
- **Widths other than 1440, 1024, 768 and 390**, and no real phone or tablet —
  only emulated viewports in desktop Chrome. Short viewports (a landscape
  phone, a laptop with many toolbars) were not tried.
- **Forced-colors / Windows high-contrast mode.** Not tested. The dark bands
  and the SVGs use explicit fills, which is exactly the case that mode
  overrides.
- **Dark mode.** Still none. The hero and the closing band are dark by design,
  not by preference; the page renders identically whatever the OS is set to.
- **A Lighthouse run.** Row 17 measures layout shift directly and row 16
  measures request failures directly, which is what the brief's
  "Lighthouse-style hygiene" asked for, but the Lighthouse tool itself was not
  run and there is no performance, SEO or best-practices score here.
- **Print, beyond the one rule added.** `@media print` forces the reveals
  visible; nothing was sent to a printer and the printed landing page was not
  inspected.
- **The 18 s loop over a long session.** The animation was observed for about
  a minute. Drift, or behaviour after the tab has been backgrounded and
  restored, was not measured.
- **An autonomous agent choosing the calls.** Unchanged from every previous
  phase: every tool call in the journey specs is scripted through Chrome's own
  `document.modelContext`.
- **The ChatGPT in-app browser.** Untouched, and untested — only the user can
  test it.
- **`/favicon.ico` still returns 404** for a client that ignores
  `<link rel="icon">`. Unchanged from 2C.
- **Rate limiting under real pressure**, **session expiry at minute 50**, and
  **the user's Postgres.app cluster on :5432** — all unchanged from Phase 2D,
  and none of them was exercised here.
