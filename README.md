# CiteApply

**A WebMCP scholarship portal where the website — not the model — owns the evidence rules.**

CiteApply is a fictional, synthetic-data-only aid application portal (“Horizon
Education Aid — Need-Based Scholarship”) that registers six WebMCP tools. An
agent can read the form’s policy, list the applicant’s parsed source claims, and
propose evidence-backed answers. It cannot declare, resolve a contradiction,
confirm, or submit. Those stay with the visible applicant, and the portal
enforces that boundary on the server.

> This is a demonstration. It uses synthetic records only, submits nothing to any
> real scholarship program, and makes no claim that any document is authentic or
> any applicant eligible.

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

## The six tools

All six register once when the application page loads.

| Tool | Effect | What it cannot do |
|---|---|---|
| `get_application_state` | Bounded read; redacted before consent, protected after | Expose the private conflict choice or reason, declarations, or the receipt |
| `get_form_requirements` | Field policies, static or currently active | Return a field-to-answer map |
| `get_evidence_index` | Bounded claims and opaque handles | Return raw PDF text, exact excerpts, or storage paths |
| `apply_evidence_backed_answers` | One atomic Draft mutation, or none | Declare the email, resolve a conflict, close a populated branch, submit |
| `get_validation_issues` | Ordered readiness blockers | Change anything |
| `prepare_submission_review` | Freezes a ready Draft into an immutable Review | Reveal the Review contents, confirm, or submit |

### Authority never travels in tool arguments

This is the pattern most worth copying. A tool call carries only its arguments.
The *page* injects its current capabilities as request headers, and the server
re-validates every tool input against the same Zod schema the descriptor was
generated from.

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

### Retries are safe, and a stale agent is told what changed

Every mutation carries a `requestId` plus the revision and requirements version
the agent last read. Idempotency is keyed on an HMAC of the *canonicalized*
change set, so a semantically identical retry replays its recorded effect
instead of applying twice, and reusing one identity for different content is
refused as `request_reuse_mismatch`. A stale attempt returns `stale_state`
carrying the current versions, so the agent can re-read rather than guess.

### A displayed excerpt cannot be fabricated

Claims store the document hash and the exact page span they came from. Every
excerpt shown in the evidence drawer and in the frozen Review is *reconstructed
by slicing stored page text at those offsets* — the UI never renders remembered
or model-supplied text, so it cannot display a quote the source does not
contain.

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

The frozen Review shows every answer beside the exact source text it came from —
including *both* disagreeing income excerpts — and carries a warning when the
applicant resolved a conflict. That warning survives into the receipt.

## Running it locally

Requires Node 24.20.0, npm 11.19.0, and PostgreSQL 17.

```bash
npm ci
```

Start a database (or point `DATABASE_URL` at your own):

```bash
docker compose up -d db
```

Apply the migrations in order:

```bash
for f in db/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

Create `.env.local` from the example — `DATABASE_URL`, a base64url 32-byte
`CITEAPPLY_MASTER_KEY`, and `APP_ORIGIN` set to the exact origin you serve from:

```bash
cp .env.example .env.local
```

Then:

```bash
npm run build && npm start
```

Open the origin you configured, choose a packet, and the application page takes
over the session and registers the tools.

### Trying the agent side

The page registers all six tools against `document.modelContext` when the
application page loads. In a browser without WebMCP the page says so plainly and
the complete application remains usable through the visible manual controls —
assistance is always optional, never required.

**Verified against Chrome 151.** With
`chrome://flags/#enable-webmcp-testing` enabled, all six tools register and are
invocable through the browser's own `document.modelContext.executeTool`. The
consent boundary, a permitted binding, and the `conflict_requires_human` refusal
were all exercised from the client side. The full transcript, including Chrome's
actual invocation contract, is in
[docs/verification/genuine-chrome-webmcp.md](docs/verification/genuine-chrome-webmcp.md).

**What has and has not been verified.** The registration path is proven
automatically in `tests/contract/webmcp-registration.test.ts` against a
spec-shaped `ModelContext` stand-in: all six tools register with one shared
abort signal, an inactive or deactivated bridge refuses to dispatch at all, and
a malformed tool argument never reaches the server. The server side is proven
against a real database in `tests/integration/minimum-client-spine.test.ts`.
What is *not* yet proven is a session in which an autonomous agent chooses the
calls itself: the Chrome verification above was driven by scripted calls to the
browser's WebMCP API. `tests/e2e/raw-genuine-client-chronology.spec.ts` exists to
validate full agent-client chronologies and skips until such traces are supplied.

## Verifying it

```bash
npm run typecheck
npm run lint
npm run test:contracts       # tool contract, projections, registration
npm run test:security        # safe-event and no-hardcoded-answer oracles
npm run test:integration     # database-backed client spine
npm run verify:production-imports
npm run verify:fixture-hashes
```

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
- The commercial framing in the planning documents is a hypothesis, not a
  measured result. There are no adoption or ROI claims.
- WebMCP is a Community Group draft, not a W3C standard, and support varies by
  browser build.

## Deploying and submitting

- [docs/DEPLOYING.md](docs/DEPLOYING.md) — environment, migrations, platform
  notes, and post-deploy checks.
- [docs/SUBMISSION.md](docs/SUBMISSION.md) — the hackathon submission draft,
  video script, and pre-submission checklist.

## License

MIT — see [LICENSE](LICENSE).
