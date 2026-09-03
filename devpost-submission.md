# CiteApply — Devpost submission

Fill the three placeholders before submitting: `LIVE_URL`, `REPO_URL`,
`VIDEO_URL`.

| Field | Value |
|---|---|
| Live URL (Chrome with `chrome://flags/#enable-webmcp-testing`, or the ChatGPT in-app browser) | `LIVE_URL` |
| Public repository (MIT `LICENSE` at root) | `REPO_URL` |
| Demo video (public YouTube, under 3:00, with audio) | `VIDEO_URL` |

---

## Tagline

**A scholarship portal where the website — not the model — owns the evidence rules.**

---

## Elevator pitch

CiteApply is a WebMCP-enabled, synthetic-data-only aid application portal. An
agent can read the form's live policy, list the applicant's parsed source
records, and propose evidence-backed answers in one atomic call. It cannot
declare the applicant's email, resolve a contradiction between two accepted
sources, confirm, or submit — and that is not a prompt instruction, it is a
server-enforced contract.

---

## The story

### The problem

The hard part of a document-backed form is not typing. It is deciding which
question currently applies, which source supports an answer, what to do when two
accepted sources disagree, and whether the final application faithfully reflects
what the applicant actually reviewed.

Need-based student aid is exactly this shape: identity details, household and
income evidence, conditional questions, unfamiliar terminology, and a high
perceived cost of getting it wrong. Existing options each solve a slice.
Autofill repeats profile values but knows nothing about a program's evidence
policy. A general assistant can suggest answers but cannot make a receiving site
accept a source binding. Document AI extracts text but does not own the live
form's readiness rules.

### WebMCP Leverage — why this could not be built any other way

<!-- claim: six tools registered once on document.modelContext — src/webmcp/bridge.ts (registerTool loop, single AbortController at line 91), src/contracts/webmcp.ts TOOL_NAMES -->
CiteApply is a *participating website*. Browser support alone does not add WebMCP
to a site that did not implement it, and CiteApply never claims arbitrary-site
support. What WebMCP makes possible here is a **site-owned evidence contract**:
six small semantic operations — state, requirements, evidence index,
source-backed mutation, validation, review preparation — through which an
external agent collaborates with the actual visible application rather than
around it.

<!-- claim: descriptors generated from the same Zod schemas the server re-validates — src/webmcp/descriptors.ts (CITEAPPLY_DESCRIPTORS built from TOOL_INPUT_SCHEMAS/TOOL_DESCRIPTIONS/TOOL_ANNOTATIONS), src/contracts/webmcp.ts -->
Three things fall out of the protocol that a sidecar chatbot or click automation
cannot demonstrate:

- **Requirements are live, not a static schema.** Binding the dependency field
  reveals a conditional branch — `guardian_name` and `household_size` — and the
  agent is told to re-read active requirements mid-session.
  <!-- claim: conditional branch fields — src/domain/fields.ts CONDITIONAL_FIELD_IDS; reveal logic src/domain/draft.ts:830-836 -->
- **Contradictions are structured refusals, not silence.** Two accepted income
  sources disagree; `apply_evidence_backed_answers` returns
  `conflict_requires_human` and writes nothing.
  <!-- claim: conflict_requires_human refusal — src/domain/evidence-policy.ts, contract in src/contracts/outcomes.ts; observed in real Chrome, docs/verification/genuine-chrome-webmcp.md step 7 -->
- **Readiness is the server's answer, never the model's.**
  `prepare_submission_review` freezes a Draft only if the server says it is
  ready, and returns opaque metadata — not the Review.
  <!-- claim: prepare_submission_review returns opaque readiness metadata only — src/contracts/webmcp.ts TOOL_DESCRIPTIONS.prepare_submission_review + result schema; src/domain/review.ts -->

### Execution — what is actually built and proven

<!-- claim: Next.js App Router on Node runtime, PostgreSQL, 5 migrations — package.json (next 15.5.24, pg 8.23.0), db/migrations/0001..0005 -->
A complete portal — landing, application, receipt — on Next.js App Router with
PostgreSQL for all state, exactly eight fields, one conditional branch, two
packets, six committed one-page PDFs, one deliberate conflict, and one
declaration-only field.

- **Evidence is real and anchored.** Selecting a packet reads committed PDF
  bytes at runtime, verifies an allowlisted SHA-256, parses with a pinned
  parser, and stores page/span anchors. Every excerpt shown is reconstructed by
  slicing stored page text at those offsets, so the interface cannot display a
  quote the source does not contain.
  <!-- claim: hash-allowlisted runtime parse + span anchors — src/evidence/packet-registry.server.ts, src/evidence/pdf-adapter.server.ts, src/evidence/anchors.ts; hash check enforced by scripts/generate-fixtures.mjs --check (npm run verify:fixture-hashes) -->
- **No hardcoded answers.** A verifier asserts no fixture-derived answer appears
  anywhere in the production source, and another forbids production code from
  importing test goldens, the fixture generator, or `pdf-lib`.
  <!-- claim: verifiers — scripts/verify-production-imports.mjs, scripts/verify-built-anti-hardcode.mjs; wired as npm run verify:production-imports / verify:built-anti-hardcode -->
- **Tested at every layer.** Contract, unit, security and real-PostgreSQL
  integration suites (`npm run test:all`), plus Playwright browser journeys and
  axe accessibility runs (`npm run test:e2e`, `npm run test:a11y`).
  <!-- claim: test scripts — package.json scripts test:contracts/test:unit/test:security/test:integration/test:all/test:e2e/test:a11y -->
- **Verified against a genuine browser client.** All six tools registered and
  were invoked through Chrome's own `document.modelContext.executeTool`, with
  the consent boundary, a permitted binding and the conflict refusal all
  exercised from the client side. That run was on Chrome 151 and is transcribed
  in full, including Chrome's actual (spec-divergent) invocation contract.
  <!-- claim: genuine Chrome client run — docs/verification/genuine-chrome-webmcp.md; defensive options?.signal handling that this uncovered is src/webmcp/descriptors.ts executionSignal() -->
- **Honest about what is unproven.** The Chrome run was scripted calls to the
  browser's WebMCP API, not a model choosing the calls.
  `tests/e2e/raw-genuine-client-chronology.spec.ts` exists for autonomous-agent
  traces and skips until such traces are supplied.
  <!-- claim: skipping chronology spec — tests/e2e/raw-genuine-client-chronology.spec.ts -->

### Potential Impact — why the pattern matters beyond this demo

Every high-stakes form on the web faces the same question the moment agents
arrive: which decisions may a visiting agent make, and who guarantees it? The
answer most sites will reach for — asking the model nicely in a tool description
— fails the first time a model is confused, jailbroken, or simply wrong.

CiteApply's answer generalises. **Authority never travels in tool arguments.** A
tool call carries only its arguments; the *page* injects its live page and
consent capabilities as request headers from page memory, and the server
re-parses every input against the same schema the descriptor was generated from.
<!-- claim: capabilities injected as headers by the page, not passed as tool args — src/webmcp/invoke.ts:70-76 (x-citeapply-page, x-citeapply-consent, x-citeapply-local-dirty); server re-validation in src/app/api/webmcp/route.ts -->
An agent holding a valid session cookie but no live page capability gets
`stale_page` from all six tools. Revoking assisted access clears the consent
capability in page memory *before* the network call, so no in-flight tool call
can outlive the revocation.
<!-- claim: revoke clears the page-memory capability before awaiting the server — src/app/application/page.tsx revokeAssistedAccess; src/ui/controllers/application.tsx handleRevoke comment -->

Any regulated portal — benefits, tax, admissions, insurance, lending — can copy
that shape without adopting a line of CiteApply's domain logic: derive
descriptors from the schema you already validate against, keep authority in the
page, and make every human-only act structurally unreachable from the tool
surface.

### Creativity & Ambition — the refusal is the feature

Most agent demos are a race to show more automation. CiteApply's central moment
is the portal saying **no**, and being right to.

Two accepted sources disagree — ₹540,000 on the income statement, ₹480,000 on
the household statement. The agent asks to bind income. The portal answers
`conflict_requires_human` and changes nothing. The field stays unresolved until
a person picks a source in the visible portal *and* states a reason. That choice
is then carried as a warning into the frozen review and into the receipt, so the
applicant can defend what they submitted.
<!-- claim: both conflicting excerpts and the conflict warning appear in the frozen Review and survive into the receipt — src/domain/review.ts; rendered at src/app/application/page.tsx (review.warnings, review.diffs excerpts; receipt.acceptedReview.warnings) -->

The ambition is in the boring parts too: idempotency keyed on an HMAC of the
canonicalised change set, so a semantically identical retry replays instead of
double-applying, while reusing one request identity for different content is
refused as `request_reuse_mismatch`; and `stale_state` refusals that hand the
agent the current versions so it can re-read rather than guess.
<!-- claim: canonicalized change-set idempotency and request_reuse_mismatch / stale_state — src/domain/canonicalize.ts, src/server/services/**, codes declared in src/contracts/outcomes.ts -->

### What people and agents accomplish together

The agent does the tedious part: reading the parsed records, working out which
source supports which answer, and applying them atomically with the portal
validating every binding — then re-reading the requirements when its own
mutation changes which questions apply.

The applicant keeps every act of judgement: declaring their own contact address,
choosing between two accepted sources that disagree and saying why, inspecting
the frozen review beside the exact source text, and submitting.

Neither side can do the whole job. That is the point: the division is enforced
by the site, so it holds no matter which agent shows up.

### How the UX improves

- **Assistance is optional, never required.** Without WebMCP the page says so
  plainly and the entire application stays completable through visible manual
  controls — the manual path reaches the same review and the same content hash.
  <!-- claim: "WebMCP is unavailable in this browser" state and full manual path — src/app/application/page.tsx setBridgeStatus/assistance "unavailable"; manual controls in the same file (Link … record, Save email, I declare this is my address, Prepare review, Submit this application) -->
- **Consent is a real disclosure, not a checkbox.** The dialog enumerates what
  the tools may receive, what they may request, what they will **not** receive,
  and what they cannot do, before any protected data moves.
  <!-- claim: consent dialog content — src/ui/components/consent.tsx (ASSISTED_ACCESS_CATALOG includedCategories / permittedActions / excludedData / excludedActions) -->
- **Every agent action is visible in the page.** Bindings mutate the same form
  the applicant is looking at; blockers are listed in plain language.
  <!-- claim: blockers rendered in the Readiness section — src/app/application/page.tsx draft.blockers -->
- **Nothing is asserted without its source.** Answers appear beside the exact
  reconstructed excerpt, including both conflicting income figures.

### Honest limits

Everything is synthetic; nothing here verifies a real document or a real
applicant, and no eligibility or award decision is implied. The parser handles
exactly the six committed fixtures and is not a general document parser. Rate
limits are deployment-wide counters, so heavy simultaneous testing returns
`at_capacity` rather than an error page.
<!-- claim: at_capacity outcome — src/contracts/outcomes.ts:126-130 -->
WebMCP is a Community Group draft, not a W3C standard, and support varies by
browser build.

---

## Built with

`webmcp` · `document.modelContext` · Chrome WebMCP testing flag ·
TypeScript 6 · Next.js 15 (App Router, Node runtime, standalone output) ·
React 19 · Zod 4 · PostgreSQL 17 · `pg` · `pdfjs-dist` (runtime parsing) ·
`pdf-lib` (fixture generation, dev-only) · Playwright · `@axe-core/playwright` ·
`fast-check` · ESLint · Node 24.20.0 · Vercel
<!-- claim: exact dependency list and versions — package.json dependencies/devDependencies; standalone output + server-external packages in next.config.ts -->

---

## Submission form answers

- **App status:** Working, deployed, publicly reachable at `LIVE_URL`.
- **Tested agent/client:** Google Chrome with `chrome://flags/#enable-webmcp-testing`
  enabled — last full client-side verification on Chrome 151.0.7922.175
  (transcript in `docs/verification/genuine-chrome-webmcp.md`); re-verification
  against Chrome 152 pending. Calls were scripted against the browser's WebMCP
  API rather than chosen by an autonomous model; that limitation is stated in
  the repo rather than papered over.
- **AI tools used:** Claude Code (Claude Opus 5) for implementation, review, and
  documentation, under the entrant's direction. Codex was used earlier during
  planning.
- **What was learned:** _(entrant's own words — the honest version is about the
  difference between designing a contract and proving a website enforces it, and
  about how much of the work was deciding what an agent must not be allowed to
  do.)_

---

## Pre-submission checklist

- [ ] Public repository pushed to `REPO_URL`, with the MIT `LICENSE` at the root
- [ ] `LIVE_URL` reachable over HTTPS, `APP_ORIGIN` matching it exactly
- [ ] Migrations applied against the production database
- [ ] Both packets completed end to end on the deployed URL, in real Chrome
- [ ] YouTube video public at `VIDEO_URL`, under three minutes, with audio
- [ ] Description covers WebMCP fit, UX improvement, human+agent, implementation
- [ ] Devpost entry **submitted**, not left as a draft
