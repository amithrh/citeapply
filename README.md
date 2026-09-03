# CiteApply

**A WebMCP scholarship portal where the website — not the model — owns the evidence rules.**

CiteApply is a fictional, synthetic-data-only aid application portal (“Horizon
Education Aid — Need-Based Scholarship”) that registers six WebMCP tools on
`document.modelContext`. An agent can read the form’s policy, list the
applicant’s parsed source claims, and propose evidence-backed answers; it can
never declare the applicant’s email, resolve a contradiction between two
sources, confirm, or submit. Those decisions stay with the visible applicant,
and the server — not the tool descriptions — enforces that boundary.

> This is a demonstration. It uses synthetic records only, submits nothing to any
> real scholarship program, and makes no claim that any document is authentic or
> any applicant eligible.

---

## Judge quick start (90 seconds)

1. **Use Chrome with WebMCP enabled.** Open `chrome://flags/#enable-webmcp-testing`,
   set it to **Enabled**, and relaunch — or launch Chrome with
   `--enable-features=WebMCPTesting`. (Last verified end-to-end on Chrome
   152.0.7977.66; see
   [docs/verification/genuine-chrome-webmcp.md](docs/verification/genuine-chrome-webmcp.md).)
2. **Open the live URL:** `LIVE_URL`
3. **Pick the Conflict packet.** Click **Start conflict packet**. This is the
   packet that shows the whole point: two accepted sources disagree about
   income. (**Start supported packet** is the happy path.)
4. On the application page, confirm the status line ends
   **“WebMCP: six CiteApply tools registered.”**, then click
   **Review and allow assisted access** → **Allow assisted access**. The
   **Where the assistant stops** panel states the boundary in two columns, and
   the **Assisted activity** panel at the foot of the page logs every tool call
   with its outcome as it happens.
5. **Give your agent these three prompts** (any WebMCP-capable client on the page,
   or Chrome’s own `document.modelContext.executeTool` from DevTools):
   - “List the CiteApply tools on this page, then read the application state in
     `redacted` mode and tell me what it discloses.”
   - “Read the evidence index and the active form requirements, then apply every
     supported binding you are allowed to apply in one atomic call.”
   - “Now bind annual household income from the best source you can find.”
6. **What refusal looks like.** The third prompt cannot succeed on the Conflict
   packet. The portal returns, verbatim:

   ```json
   {"ok":false,"error":{"code":"conflict_requires_human",
    "message":"Income sources disagree. Resolve this in CiteApply.",
    "safeActions":["resolve_in_visible_application"]}}
   ```

   Nothing is written, and the refusal appears in the Assisted activity panel
   with a **conflict requires human** badge. The income row on the page keeps
   reading **“Two accepted sources disagree. You decide.”**, showing both
   records with their quoted excerpts, until *you* choose a reason under **Why
   you chose this source** and click **Use the Synthetic Income Statement** (or
   the Household Statement). A protected read before you allow access is refused
   the same way, with `consent_required`.

7. **Finish it.** **Prepare review** → **Submit this application** → the
   **Submitted** receipt, where **Download JSON**, **Print**, and **Start a new
   synthetic demo** present the same accepted record three ways.

Step-by-step instructions with expected output at every step, including the
ChatGPT in-app browser, are in [docs/JUDGE-TESTING.md](docs/JUDGE-TESTING.md).

---

## The problem

The hard part of a document-backed form is not typing. It is deciding which
question currently applies, which source supports an answer, what to do when two
accepted sources disagree, and whether the final application faithfully reflects
what the applicant actually reviewed.

Browser autofill repeats profile values but knows nothing about a program’s
evidence policy. A general assistant can suggest answers but cannot make a
receiving site accept a source binding. Document AI can extract text but does not
own the live form’s readiness rules.

## Why WebMCP is essential here

CiteApply is a *participating website*. Browser support alone does not add WebMCP
to a site that did not implement it, and CiteApply never claims arbitrary-site
support.

What WebMCP makes possible is a **site-owned evidence contract**: the agent
proposes bindings, and the portal decides whether each binding is permitted and
whether the application is ready. Conditional requirements change after a
mutation. Contradictions come back as structured refusals. Readiness is the
server’s answer, never the model’s.

A chatbot beside the form could generate suggestions, and click automation could
manipulate controls, but neither demonstrates a contract the receiving site
actually enforces.

## Architecture

```mermaid
flowchart TB
  agent["External WebMCP client<br/>(Chrome document.modelContext)"]
  subgraph page["Application page (browser)"]
    bridge["src/webmcp/bridge.ts<br/>registers 6 tools once,<br/>one shared AbortController"]
    desc["src/webmcp/descriptors.ts<br/>descriptors generated from Zod"]
    dispatch["src/webmcp/invoke.ts<br/>injects page + consent capability<br/>as request headers"]
    ui["src/app/application/page.tsx<br/>src/ui/** — visible manual controls:<br/>Allow / Revoke, declare, resolve,<br/>Prepare review, Submit"]
  end
  subgraph server["Next.js server (Node runtime)"]
    route["src/app/api/webmcp/route.ts<br/>re-parses args with the same schema"]
    auth["src/server/security/**<br/>capability + origin + session checks"]
    svc["src/server/services/**<br/>ledger, idempotency, throttling"]
    domain["src/domain/**<br/>field policy, evidence policy, draft,<br/>readiness, canonicalize, review freeze"]
    ev["src/evidence/**<br/>hash-allowlisted PDF parse,<br/>page/span anchors"]
  end
  db[("PostgreSQL<br/>applications · operations · reviews<br/>submissions · rate_buckets")]

  agent -- "tool args only" --> bridge
  bridge --> desc
  bridge --> dispatch
  dispatch -- "args + X-CiteApply-Page + X-CiteApply-Consent" --> route
  route --> auth --> svc --> domain
  svc --> ev
  svc --> db
  svc -- "snapshot" --> ui
  ui -- "human-only actions" --> svc
```

## The six tools

All six register once when the application page loads. Annotations below are the
values in `TOOL_ANNOTATIONS` (`src/contracts/webmcp.ts`), carried onto every
descriptor by `src/webmcp/descriptors.ts`.

| Tool | `readOnlyHint` | `untrustedContentHint` | Effect | What it cannot do |
|---|---|---|---|---|
| `get_application_state` | `true` | `true` | Bounded read; redacted before consent, protected after | Expose the private conflict choice or reason, declarations, or the receipt |
| `get_form_requirements` | `true` | `false` | Field policies, static (all fields) or currently active | Return a field-to-answer map |
| `get_evidence_index` | `true` | `true` | Bounded claims and opaque handles, after consent | Return raw PDF text, exact excerpts, or storage paths |
| `apply_evidence_backed_answers` | `false` | `true` | One atomic Draft mutation, or none | Declare the email, resolve a conflict, close a populated branch, submit |
| `get_validation_issues` | `true` | `false` | Ordered readiness blockers | Change anything |
| `prepare_submission_review` | `false` | `false` | Freezes a ready Draft into an immutable Review and closes assisted access | Reveal the Review contents or hash, confirm, or submit |

`untrustedContentHint: true` marks exactly the three tools whose payloads carry
values that came out of the synthetic PDFs; requirements and blockers are
portal-authored policy text, and `prepare_submission_review` returns only opaque
readiness metadata.

## The safety boundary

The agent can **never**, through any tool, at any stage:

- declare the applicant’s contact email (only the visible
  **I declare this is my address** button does that);
- resolve the income conflict (only **Use the Synthetic Income Statement** or
  **Use the Synthetic Household Statement**, with a reason, in the visible
  portal does that);
- read the frozen Review’s contents, its content hash, the private conflict
  choice or reason, or the declaration records;
- confirm or submit (only **Submit this application** on the frozen review does
  that), or read the receipt or export it — **Download JSON** and **Print** on
  the receipt are visible human controls with no tool behind them.

Two structural reasons this holds, both worth copying:

**Authority never travels in tool arguments.** A tool call carries only its
arguments. The *page* injects its current capabilities as request headers
(`src/webmcp/invoke.ts`), and the server re-parses every tool input against the
same Zod schema the descriptor was generated from (`src/app/api/webmcp/route.ts`,
`src/contracts/webmcp.ts`).

```
agent ──tool args──▶ page bridge ──args + X-CiteApply-Page ─────▶ /api/webmcp
                     (holds the             + X-CiteApply-Consent      │
                      capabilities                                    ▼
                      in page memory,                        re-parse args,
                      never exposes                          verify capabilities,
                      them as a tool)                        then decide
```

An agent holding a valid session cookie but no live page capability gets
`stale_page` from all six tools. Revoking assisted access clears the consent
capability in page memory *before* the network call, so no in-flight tool call
can outlive the revocation.

**A displayed excerpt cannot be fabricated.** Claims store the document hash and
the exact page span they came from (`src/evidence/anchors.ts`). Every excerpt in
the evidence drawer and in the frozen Review is reconstructed by slicing stored
page text at those offsets — the UI never renders remembered or model-supplied
text, so it cannot display a quote the source does not contain.

### Retries are safe, and a stale agent is told what changed

Every mutation carries a `requestId` plus the revision and requirements version
the agent last read. Idempotency is keyed on an HMAC of the *canonicalized*
change set, so a semantically identical retry replays its recorded effect
instead of applying twice, and reusing one identity for different content is
refused as `request_reuse_mismatch`. A stale attempt returns `stale_state`
carrying the current versions, so the agent can re-read rather than guess.

## The demonstration

Two synthetic packets, three one-page PDFs each, parsed at runtime — hash-checked,
size-bounded, and anchored so every displayed excerpt is reconstructed from stored
page offsets rather than remembered text.

- **Supported packet** — the income statement and the household statement agree.
  The portal accepts the binding and keeps the second source as corroboration.
- **Conflict packet** — the same two source types disagree about annual household
  income (₹540,000 vs ₹480,000). The agent’s attempt to bind income is refused
  with `conflict_requires_human`, and the field stays unresolved until the
  applicant chooses a source *and* states a reason in the visible portal.

Both packets run the same production code path. Only the packet data differs.
Binding the dependency field reveals the conditional branch — `guardian_name`
and `household_size` (`src/domain/fields.ts`) — so the agent must re-read active
requirements mid-session.

The frozen Review shows every answer beside the exact source text it came from —
including *both* disagreeing income excerpts, with the one the applicant chose
marked and the one they set aside kept in view — and carries a warning when the
applicant resolved a conflict. That warning, and the whole annotated record,
survive into the receipt and into its downloaded JSON.

The applicant sees both excerpts *before* deciding, not only afterwards: the
conflict row itself quotes each record.

## Running it locally

Requires **Node 24.20.0**, npm 11.19.0, and PostgreSQL 17 (both pins are
enforced by `npm run verify:versions` and `package.json` `engines`).

```bash
npm ci
```

Start a database (or point `DATABASE_URL` at your own). `compose.yaml` runs
`postgres:17.6-alpine` on port 5432 with user/password/database all `citeapply`,
and mounts `db/migrations` as the container’s init directory, so a *fresh*
volume applies all five migrations for you:

```bash
docker compose up -d db
```

Against an existing database, apply them yourself, in order:

```bash
for f in db/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

`0005_rate_buckets.sql` seeds two sentinel rows the Start path locks against;
without them, starting a demo fails.

Create `.env.local` with the three required variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | e.g. `postgres://citeapply:citeapply@localhost:5432/citeapply` |
| `CITEAPPLY_MASTER_KEY` | base64url-encoded 32 random bytes: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `APP_ORIGIN` | the exact origin you serve from, e.g. `http://localhost:3100` |

`APP_ORIGIN` is not cosmetic: same-origin enforcement and key derivation both
use it. The same-origin check is **exact** — it compares the scheme and the
`host:port` of the request URL, the `Host` header and the `Origin` header
against `APP_ORIGIN`, character for character. A mismatch refuses every request,
including the very first `GET /api/demo`, with HTTP 403 `invalid_request`, and
the landing page can then only say “CiteApply could not prepare a synthetic
start.”

For iteration, `npm run dev -- -p 3100` works. Note that `npm run dev` rewrites
`.next/` and **removes the standalone build**; after a dev run you must
`npm run build` again before `node .next/standalone/server.js` will start.

### Run the production build

```bash
npm run build
cp -R .next/static .next/standalone/.next/static
set -a; . ./.env.local; set +a          # the standalone server does not read .env.local
HOSTNAME=localhost PORT=3100 node .next/standalone/server.js
```

`HOSTNAME=localhost` is required, not optional. Next's standalone server
defaults `HOSTNAME` to `0.0.0.0`, so every `request.url` it builds reads
`http://0.0.0.0:3100/…`; the exact same-origin check compares that host
against the `APP_ORIGIN` host (`localhost:3100`), they differ, and **every** API
request is refused with HTTP 403 `invalid_request` — a landing page that can
never start a packet. The hostname you bind must be the hostname in
`APP_ORIGIN`. (When it does refuse, the server logs one line naming the
mismatch, so you are not left guessing.)

The `set -a; . ./.env.local; set +a` line is also required.
`.next/standalone/server.js` `chdir`s into its own directory and is a plain Node
process — it has none of Next's dotenv loading, so it never reads the
`.env.local` you created above and would start with `APP_ORIGIN`,
`DATABASE_URL` and `CITEAPPLY_MASTER_KEY` all unset. Sourcing the file into the
shell first (or `node --env-file=.env.local .next/standalone/server.js` on
Node 24) puts them in the environment the server actually inherits.

The `cp -R` line is required, not optional. `next build` with
`output: "standalone"` emits a self-contained server tree under
`.next/standalone`, but Next deliberately leaves the client bundles, CSS and
fonts in `.next/static` and expects the deploy step to copy them next to that
server — its own docs say so, and it is why every hosting adapter does this
copy for you. `node .next/standalone/server.js` chdirs into its own directory
at startup, so without the copy the HTML renders and every `/_next/static/…`
request 404s: an unstyled page whose buttons do nothing. (The PDF parser used
to need a hand copy too; that one is fixed, and `next.config.ts` now traces
`pdfjs-dist` into the standalone output.)

Open the origin you configured, choose a packet, and the application page takes
over the session and registers the tools.

Details and platform notes: [docs/DEPLOYING.md](docs/DEPLOYING.md).

### Trying the agent side

The page registers all six tools against `document.modelContext` when the
application page loads. In a browser without WebMCP the page says so plainly
(“WebMCP is unavailable in this browser”) and the complete application remains
usable through the visible manual controls — assistance is always optional,
never required.

**Last verified against Chrome 152.0.7977.66**
(`chrome://flags/#enable-webmcp-testing` enabled, or
`--enable-features=WebMCPTesting` on the command line): all six tools register
and are invocable through the browser’s own
`document.modelContext.executeTool`, and the consent boundary, a permitted
binding, and the `conflict_requires_human` refusal were all exercised from the
client side. The full
transcript, including Chrome’s actual invocation contract, is in
[docs/verification/genuine-chrome-webmcp.md](docs/verification/genuine-chrome-webmcp.md).

**What has and has not been verified.** The registration path is proven
automatically in `tests/contract/webmcp-registration.test.ts` against a
spec-shaped `ModelContext` stand-in: all six tools register with one shared
abort signal, an inactive or deactivated bridge refuses to dispatch at all, and
a malformed tool argument never reaches the server. The server side is proven
against a real database in `tests/integration/minimum-client-spine.test.ts`.
What is *not* yet proven is a session in which an autonomous agent chooses the
calls itself: the Chrome verification above was driven by scripted calls to the
browser’s WebMCP API. `tests/e2e/raw-genuine-client-chronology.spec.ts` exists to
validate full agent-client chronologies and skips until such traces are supplied.

## Verifying it

```bash
npm run verify:versions
npm run verify:dependencies
npm run verify:fixture-hashes
npm run verify:production-imports
npm run verify:surfaces      # route, table and tool surface inventory
npm run typecheck
npm run lint
npm run test:contracts       # tool contract, projections, registration
npm run test:security        # safe-event and no-hardcoded-answer oracles
npm run test:unit
npm run test:integration     # database-backed client spine (needs DATABASE_URL)
npm run test:all             # contracts + security + unit + integration
```

Browser suites need a running server and `APP_ORIGIN` **exported** into the
shell (Playwright’s baseURL comes from it; without it the suite hits port 3000
and every journey fails):

```bash
export APP_ORIGIN=http://localhost:3100
npm run test:e2e
npm run test:a11y            # axe WCAG 2.1 AA scan + the consent-authority kernel
npm run verify:built-anti-hardcode   # after npm run build
```

The scaffolding gate `verify:file-structure` has been removed from
`package.json`: it pinned the tree to an early build gate and reported files
that shipped long ago (the review, submission and receipt routes, the e2e
specs) as unexpected, so it could only ever fail here. Its surface inventory —
the half that is still true — remains as `npm run verify:surfaces`, which runs
the same script with `--surfaces`.

## How it is built

- **Next.js App Router** on the Node runtime, PostgreSQL for all state.
- `src/contracts/` — Zod schemas that are the single source of truth for the
  WebMCP descriptors, the HTTP surface, and every failure code.
- `src/domain/` — pure decision logic: field policy, evidence policy, the draft
  aggregate, readiness, canonical content, and the Review freeze.
- `src/evidence/` — hash-allowlisted PDF parsing and claim extraction with page
  and span anchors.
- `src/server/` — capability derivation, session and page authority, throttling,
  the operation ledger, and the services behind each route.
- `src/webmcp/` — descriptor generation, the registration bridge, and the
  page-injected-capability dispatcher.

Production code cannot import test goldens, the fixture generator, or `pdf-lib`;
a verifier enforces that boundary, and another asserts no fixture-derived answer
is hardcoded anywhere in `src/`.

## Honest limits

- Everything is synthetic. Nothing here verifies a real document or a real
  applicant, and no eligibility or award decision is implied.
- The parser handles exactly the six committed one-page fixtures. It is not a
  general document parser, and it does not do OCR or model extraction.
- Rate limits are deployment-wide counters, not per-visitor: repeated demo
  starts in one ten-minute window return the friendly `at_capacity` response
  rather than an error page.
- The commercial framing in the planning documents is a hypothesis, not a
  measured result. There are no adoption or ROI claims.
- WebMCP is a Community Group draft, not a W3C standard, and support varies by
  browser build.
- The session cookie is always `__Host-` + `Secure`, which Chrome accepts on
  `http://localhost` but Safari does not; use Chrome or HTTPS locally.

## Deploying and submitting

- [docs/DEPLOYING.md](docs/DEPLOYING.md) — environment, migrations, platform
  notes, and post-deploy checks.
- [docs/JUDGE-TESTING.md](docs/JUDGE-TESTING.md) — exact judge walkthrough with
  expected results.
- [docs/VIDEO-SCRIPT.md](docs/VIDEO-SCRIPT.md) — the recorded-demo shot list.
- [devpost-submission.md](devpost-submission.md) — the submission text.

## License

MIT — see [LICENSE](LICENSE).
