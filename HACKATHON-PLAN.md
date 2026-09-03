# CiteApply — Win Plan for The WebMCP Challenge

Status: ACTIVE. Orchestrator: Claude (Fable). Implementers: Opus 5 agents, one phase at a time.
Written: 2026-09-03 07:30 IST.

## Hard facts (verified, do not re-derive)

| Fact | Value |
|---|---|
| Submission deadline | **2026-09-03 13:00 PDT = 20:00 UTC = 2026-09-04 01:30 IST** |
| Time available at plan time | ~18 hours |
| Judging criteria (equal weight) | WebMCP Leverage · Execution · Potential Impact · Creativity & Ambition |
| Required deliverables | Live URL usable in Chrome (WebMCP flag) or ChatGPT in-app browser · <3 min public YouTube video with audio · public repo with OSS license file · text description (why WebMCP, UX gain, human+agent, implementation) |
| Working codebase | Git commit `508940b` ("verified against Chrome 151"). Branch `hackathon-final` is checked out at the worktree below. Everything after it (the "recovery" branch) deleted the routes, pages, CSS, README, LICENSE and is NOT usable. |
| Working tree for all agent work | `/private/tmp/claude-501/-Users-amitmishra-worksppace-central-webmcp/d60aa668-8108-46bd-97be-637561ecbb47/scratchpad/wt-508940b` |
| Node | Must be 24.20.0: `export PATH=/opt/homebrew/opt/node@24/bin:$PATH` (installed via Homebrew, keg-only) |
| Database | Local Postgres at `localhost:5432` per `.env.local`; all 5 migrations already applied |
| App origin (local) | `http://localhost:3100` (`APP_ORIGIN` in `.env.local`). **Export `APP_ORIGIN` into the shell before Playwright**, otherwise baseURL falls back to :3000 and every journey test fails with ERR_CONNECTION_REFUSED (this is exactly what happened on the first run). |
| Start the built app | `node .next/standalone/server.js` with `PORT=3100` (NOT `next start`; standalone output). Copy `.next/static` and `fixtures/` next to it if needed, or use `npm run dev -- -p 3100` for iteration. |
| Baseline evidence (Fable, 07:15 IST) | typecheck PASS, lint PASS, `test:all` 57/57 PASS, `next build` PASS, Playwright 12/17 pass — the 4 journey failures were the missing `APP_ORIGIN` export, 1 skipped (genuine-client trace). |
| Chrome on this Mac | Google Chrome 152.0.7977.66. Flag: `chrome://flags/#enable-webmcp-testing`. Chrome 151 contract: `getTools()` returns a Promise, `executeTool(toolObject, jsonString)`, callback gets parsed input and NO options object. |
| Rate limits are GLOBAL | `demo_start` = 6 starts per 10-minute window across all clients. Repeated test runs WILL hit `at_capacity`. Reset between runs with `psql "$DATABASE_URL" -c 'delete from rate_buckets where ...'` (inspect table first; sentinel rows must remain — see `db/migrations/0005_rate_buckets.sql`). Never disable the limiter in production code. |
| Vercel CLI | NOT logged in on this machine (no auth.json). User must run `vercel login`. GitHub CLI IS logged in as `amithrh`. No git remote exists yet. |

## Non-negotiable rules for every agent

1. **No assumptions.** Every claim in your report must be backed by a command you ran and its output, or a screenshot you took. "Should work" is not a result.
2. **Test end to end, in a real browser, every step of the 13-step journey** (below), for BOTH packets (Supported and Conflict), after every change that touches UI, routes, or services.
3. Do not weaken tests, delete tests, loosen schemas, or bypass the limiter/authority checks to make something pass. If a test is wrong, say so and explain why before changing it.
4. Keep the product's core promise intact: the agent can read/bind/prepare; it can NEVER declare email, resolve income conflict, confirm, submit, or export. Any change that gives the agent more authority is a P0 defect.
5. Commit on `hackathon-final` in small, described commits. Never commit `.env.local`.
6. Report format at the end of every phase: (a) what you did, (b) evidence table (command → result), (c) defects found with file:line, (d) what is NOT done. Screenshots go in `docs/evidence/<phase>/`.

## The 13-step journey (from scope.md; this is the acceptance test)

1. Landing: choose Supported or Conflict, start a 60-minute synthetic demo.
2. Server verifies and parses the packet PDFs at runtime; the visible manual form opens.
3. External client (Chrome `document.modelContext`) discovers all six tools. Protected calls before consent return `consent_required` and disclose nothing.
4. Applicant reads the disclosure and clicks **Allow assisted access**.
5. Agent reads state, requirements, evidence index; applies a version-checked batch of supported bindings.
6. Form updates visibly; guardian dependency reveals guardian name + household size; agent re-reads active requirements and binds those.
7. Conflict packet: income binding refused with `conflict_requires_human`; nothing changes.
8. Agent may propose the `.test` email; field stays "Needs your declaration".
9. Premature `prepare_submission_review` fails closed listing the conflict and declaration blockers.
10. Applicant inspects both income excerpts, picks one source with a reason, and declares the email (visible UI only).
11. Agent prepares the immutable review; assisted access closes; the full review appears only in the UI. Manual **Review application** reaches the same state and the same review hash.
12. Applicant inspects review; **Return to application** invalidates it; **Confirm and submit this review** commits.
13. One atomic submission; receipt screen, JSON download, and print view are semantically equal.

Also verify: session expiry warning at minute 50 (can be simulated only if a test hook exists — otherwise verify the copy exists), stale page after a second tab takeover, refresh mid-journey keeps saved state, retry of an apply with the same requestId replays instead of double-applying.

## Phases

### Phase 1 — Baseline and real-browser proof (Opus, ~2h)
Goal: an honest, evidence-backed statement of exactly what works today at `508940b`.
- Run: `verify:versions`, `verify:dependencies`, `verify:fixture-hashes`, `verify:production-imports`, `verify:built-anti-hardcode` (after build), `typecheck`, `lint`, `test:all`, build, then Playwright `test:e2e` + `test:a11y` with `APP_ORIGIN` exported. Expect 17/17 or explain each miss.
- Then drive REAL Chrome 152 with the WebMCP flag (use the Claude-in-Chrome tools or Playwright against the real Chrome channel) through all 13 steps for BOTH packets, calling tools via `document.modelContext.executeTool`. Screenshot every step. Record every tool request/response pair to `docs/evidence/phase1/tool-log.md`.
- Deliver: `docs/evidence/phase1/REPORT.md` with the evidence table and a ranked defect list (P0 blocks demo, P1 looks bad to a judge, P2 nice-to-have).

### Phase 2 — Fix P0/P1 and make it look and feel good (Opus, ~5h)
Goal: a product a judge enjoys in the first 60 seconds.
- Fix every P0/P1 from Phase 1.
- Visual polish (load `frontend-design` skill first): a distinctive but restrained identity, clear hierarchy, readable evidence excerpts, obvious "agent did this" vs "you must decide this" affordances, delightful-but-honest state transitions when an agent binding lands (no fake animations that misrepresent timing), empty/loading/error states, mobile width sanity, print stylesheet for the receipt.
- A visible **Assisted activity** panel showing each tool call as it happens (name, outcome, versions) so a judge watching the video can SEE WebMCP working. This is a projection of data the page already has; it must not add agent authority.
- Landing page must explain in three sentences what this is, why WebMCP, and how to try it with an agent (Chrome flag instructions + ChatGPT browser note). Include a "Judge quick start" box.
- Accessibility: `test:a11y` must report zero axe violations on landing, application, review, receipt.
- After EVERY fix: rerun the affected Playwright specs; before finishing the phase: rerun the full 13-step real-Chrome journey for both packets and refresh screenshots into `docs/evidence/phase2/`.

### Phase 3 — Deploy to a public HTTPS origin (Opus + user, ~2h, can start in parallel with Phase 2 once Phase 1 is green)
Blockers only the user can clear: `vercel login` on this machine; approve creating a public GitHub repo.
- Create public GitHub repo `citeapply` (gh CLI is authenticated), push `hackathon-final` as `main`. Ensure `LICENSE` (MIT) is present at root so Devpost sees it in the About section.
- On Vercel: import repo, provision Postgres via Marketplace (load the `vercel:marketplace` skill), set `DATABASE_URL`, `CITEAPPLY_MASTER_KEY` (fresh 32 random bytes base64url), `APP_ORIGIN` = the exact production domain (e.g. `https://citeapply.vercel.app`; never a preview URL). Apply the five migrations with psql against the hosted DB, in order, `-v ON_ERROR_STOP=1`.
- Confirm `next.config.ts` still traces `fixtures/packets/**/*.pdf` into `/api/demo` and that `pdfjs-dist`/`pg` are server-external. A deployment that drops the PDFs fails every start with `document_unavailable`.
- Post-deploy: run the full Playwright suite with `APP_ORIGIN=https://<prod>`; then the real-Chrome 13-step journey against the live URL; then the same in a fresh incognito window to prove no local state is needed. Save screenshots to `docs/evidence/phase3/`.
- Verify security headers, `__Host-` cookie set over HTTPS, rate-limit behaviour, and that a second demo start after six in ten minutes returns the friendly `at_capacity` copy rather than an error page. Decide with the user whether to raise `demo_start` for judging week (it is a global 6/10min; judges may collide). If raised, do it via the policy constant AND the SQL CHECK in `0005_rate_buckets.sql` together.

### Phase 4 — Submission assets (Opus, ~2h, parallel with Phase 3)
- `README.md`: what it is, 90-second judge quick start (flag, URL, which packet, what to ask the agent), architecture in one diagram, the six tools table with annotations, safety boundary, how to run locally, tests. Restore and update the deleted `docs/DEPLOYING.md` and `docs/verification/genuine-chrome-webmcp.md` (re-verify against Chrome 152 and update the version).
- `devpost-submission.md`: tagline, description hitting the four judging criteria explicitly, the four required text sections, tech list, links placeholders. Restore from `git show 508940b:docs/SUBMISSION.md` and sharpen.
- `docs/VIDEO-SCRIPT.md`: a <3:00 shot list with timestamps and narration, following scope.md's Demo Path: cold-open genuine tool result + visible mutation by 0:10, then the chronological Conflict-packet session, ending on the receipt. Label any time compression on screen. The user records; the script must be word-for-word readable.
- `docs/JUDGE-TESTING.md`: exact steps a judge follows in Chrome and in the ChatGPT in-app browser, expected outputs at each step, and what a refusal looks like.

### Phase 5 — Independent final gate (fresh Opus reviewer, ~1h)
- Fresh clone from GitHub into a new directory; follow README only; get to a receipt locally with Node 24 and Docker Postgres (`compose.yaml`). Every friction point is a README defect.
- Against the live URL: full 13-step journey both packets in real Chrome; a11y; check the video script against what the product actually does line by line.
- Output: GO / NO-GO with the exact list of remaining defects. NO-GO items go back to a Phase 2 agent immediately.

### User-only tasks (cannot be delegated)
- `vercel login` (Phase 3 blocker).
- Record and upload the YouTube video from `docs/VIDEO-SCRIPT.md` (public, <3 min, with audio).
- Test once in the ChatGPT in-app browser against the live URL (agents cannot drive it).
- Fill the Devpost form from `devpost-submission.md` and submit before 01:30 IST Sept 4. Submit a draft EARLY (by 22:00 IST) and update it; a late perfect submission scores zero.

## Timeline (IST)

| When | What |
|---|---|
| 07:30–09:30 | Phase 1 |
| 09:30–14:30 | Phase 2 (Phase 3 and 4 start ~10:30 in parallel once Phase 1 is green and the user has run `vercel login`) |
| 14:30–16:30 | Phase 3 live verification; Phase 4 docs done |
| 16:30–17:30 | Phase 5 gate |
| 17:30–21:00 | Fix NO-GO items; user records video |
| 21:00–22:00 | Video upload; Devpost draft submitted |
| 22:00–01:00 | Buffer; final re-verification of live URL; final Devpost update |
| 01:30 | Deadline. Nothing changes on the live URL after 00:30. |

## Known defects carried from Fable's review of `508940b` lineage (verify against this commit before fixing)
- Bridge cache never evicts a disposed bridge (`src/webmcp/bridge.ts` dispose) → React StrictMode remount can leave tools unregistered.
- Descriptor `execute` parses input outside try/catch → raw ZodError to the host instead of `invalid_request`.
- `installMutationProjection` runs before abort checks in `src/webmcp/invoke.ts` → UI mutated then `temporarily_unavailable` reported.
- `apply_evidence_backed_answers` does not send the dirty-state header.
- CSP has `script-src 'unsafe-inline'`; `Permissions-Policy: tools=(self)` is not a real feature.
- Session cookie is always `__Host-` + `Secure`; fine on Chrome localhost and HTTPS, breaks Safari localhost (document, don't fix).
- Global rate limiting (see facts table).

## Actual UI labels (verified by Phase 4 against src/app and src/ui — use these, not the scope.md names)
- Consent: **Review and allow assisted access** → dialog **Allow assisted access?** → **Allow assisted access**
- Review: **Prepare review**; back: **Return to draft**
- Submit: **Submit this application**; receipt heading **Submitted**
- Conflict row copy: "Two accepted sources disagree. You decide."
- Email: **Save email** then **I declare this is my address**
- Phase 2 must add the Assisted activity panel; the video script currently assumes DevTools console beside the form until it exists.

## Decision 2026-09-03 08:10 IST
User: deployment deferred. Local (http://localhost:3100, real Chrome) must be excellent first. Phase 3 is on hold until the user reopens it; Phase 5 gate runs against local.
