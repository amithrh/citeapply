# Devpost submission materials

Drafts for the entrant to review, edit, and submit. Nothing here has been
published; the live URL, repository URL, and video link still need filling in.

---

## Tagline

A scholarship portal where the website — not the model — owns the evidence rules.

---

## Description

### What it is

CiteApply is a WebMCP-enabled aid application portal. An agent can read the
form's policy, list the applicant's parsed source records, and propose
evidence-backed answers. It cannot declare the applicant's email, resolve a
contradiction between two sources, confirm, or submit. Those decisions stay with
the visible applicant, and the portal enforces that boundary on the server rather
than trusting the model to observe it.

It runs on entirely synthetic records. Nothing is submitted to any real program.

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

### Why WebMCP is essential

CiteApply is a *participating website*. Browser support alone does not add WebMCP
to a site that did not implement it, and CiteApply never claims otherwise.

What WebMCP makes possible is a site-owned evidence contract. Six small semantic
operations — state, requirements, evidence, source-backed mutation, validation,
and review preparation — let an external agent collaborate with the actual
visible application. Conditional requirements change after a mutation.
Contradictions come back as structured refusals. Readiness is the server's
answer, never the model's.

A chatbot beside the form could generate suggestions, and click automation could
manipulate controls, but neither demonstrates a contract the receiving site
actually enforces.

### What humans and agents can now do together

The agent does the tedious part: reading the parsed records and proposing which
source supports which answer, atomically, with the portal validating every
binding.

The applicant keeps the judgement: declaring their own contact address, choosing
between two accepted sources that disagree and saying why, inspecting the frozen
review beside the exact source text, and submitting.

The interesting moment is the refusal. Two accepted income sources disagree —
₹540,000 on the income statement, ₹480,000 on the household statement. The agent
asks to bind income. The portal answers `conflict_requires_human` and changes
nothing. The field stays unresolved until a person picks a source in the visible
portal and states a reason. That choice is then carried as a warning into the
frozen review and into the receipt, so the applicant can defend what they
submitted.

### How WebMCP was implemented

- **Descriptors are derived, not hand-written.** The six tools are generated from
  the same Zod schemas the server re-validates against, with a build-time
  assertion that every input schema is closed (`additionalProperties: false`),
  every description fits the length bounds, and no tool name reads as a
  human-only action. Descriptor drift is structurally impossible.
- **Authority never travels in tool arguments.** A tool call carries only its
  arguments. The page injects its current page and consent capabilities as
  request headers from page memory. An agent holding a valid session cookie but
  no live page capability gets `stale_page` from all six tools.
- **One registration lifetime.** All six tools register with a single shared
  `AbortController` signal. A deactivated bridge stops dispatching without
  unregistering, so revoking assistance is immediate and does not require
  tearing down the tool set.
- **Refusal is a first-class result.** `conflict_requires_human`,
  `evidence_unavailable`, `not_ready_for_review`, `stale_state` carrying the
  current versions, `request_reuse_mismatch`. Reads and mutations get different
  recovery advice, because an uncertain mutation may already have committed.
- **Retries are safe.** Every mutation carries a request identity and the
  versions the agent last read; idempotency is keyed on an HMAC of the
  canonicalized change set, so a semantically identical retry replays its
  recorded effect instead of applying twice.
- **Evidence is real and anchored.** Selecting a packet reads committed PDF bytes
  at runtime, verifies an allowlisted SHA-256, parses with a pinned parser, and
  stores page/span anchors. Every excerpt shown is reconstructed by slicing
  stored page text at those offsets, so the interface cannot display a quote the
  source does not contain. A verifier asserts no answer is hardcoded anywhere in
  the production source.

### Honest limits

Everything is synthetic; nothing here verifies a real document or a real
applicant. The parser handles exactly the six committed fixtures and is not a
general document parser. The commercial framing is a hypothesis, not a measured
result. WebMCP is a Community Group draft, not a W3C standard, and support varies
by browser build.

---

## Video script — 3:00

Record against the deployed, styled build, in one clean session, and do not stop
recording until the receipt renders.

**0:00–0:20 — Open on the refusal.**
Screen: the agent asking to fill in annual household income. The portal answers
`conflict_requires_human`.
> "Watch what happens when an agent tries to fill in this field. The website said
> no. Not the model — the website."

**0:20–1:10 — Show it is real.**
Split screen: the tool call on one side, the server's structured refusal JSON on
the other. Then the two source PDFs, showing ₹540,000 and ₹480,000.
> "These are two accepted sources that disagree. The portal parsed both, and it
> refuses to pick one. This is a scholarship application — the applicant is the
> one who has to stand behind the number, so the decision goes back to them."
Then: the applicant chooses a source in the visible portal and states a reason.

**1:10–1:40 — Prove enforcement rather than asserting it.**
Terminal: hold a valid session and call all six tools *without* the page
capability. All six return `stale_page`. Then forge a consent header; refused.
> "Nothing here depends on the model behaving. Authority never travels in tool
> arguments — the page injects it, and the server checks it."

**1:40–2:15 — The live contract.**
Bind dependency. The required field count moves 6 → 8; guardian name and
household size appear; the agent is told to re-read requirements.
> "The requirements are not a static schema. Answering one question changed which
> questions apply, and the agent is told to read them again."

**2:15–2:50 — The review and the receipt.**
The frozen review: every answer beside the exact source text, both conflicting
income figures visible, the conflict warning, the content hash. Then submit and
show the receipt carrying the same hash and the same warning.
> "Every answer sits beside the source it came from — including both figures that
> disagreed. The applicant submits something they can actually defend."

**2:50–3:00 — Close honestly.**
> "Synthetic records, a fictional program, and WebMCP is still a draft. But the
> contract is real, and the website enforces it."

---

## Submission form answers

- **App status:** Working, deployed, publicly reachable.
- **Tested agent/client:** _(fill in the exact browser build or client used —
  and if a genuine external WebMCP client could not be obtained, say so plainly
  and point at the registration tests instead. Do not imply verification that
  did not happen.)_
- **AI tools used:** Claude Code (Claude Opus 5) for implementation, review, and
  documentation, under the entrant's direction. Codex was used earlier during
  planning.
- **What was learned:** _(entrant's own words — the honest version is likely
  about the difference between designing a contract and proving a website
  enforces it, and about how much of the work was deciding what an agent must
  not be allowed to do.)_

---

## Pre-submission checklist

- [ ] Public repository pushed, with the MIT `LICENSE` at the root
- [ ] Live URL reachable, HTTPS, `APP_ORIGIN` matching it exactly
- [ ] Migrations applied against the production database
- [ ] Both packets completed end to end on the deployed URL
- [ ] YouTube video public, under three minutes, with audio
- [ ] Description covers WebMCP fit, UX improvement, and implementation
- [ ] Devpost entry **submitted**, not left as a draft
