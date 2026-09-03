# Phase 3 — Deploy to a public HTTPS origin

**Live URL:** https://citeapply.vercel.app

**Status: deployed and serving, with one blocking live defect.** The database is
provisioned and migrated, starts work, security is right, and 31 of 42 Playwright
tests pass against the live origin — but linking the income statement's *Annual
household income* line is refused by the evidence policy on the deployment, so
neither record set reaches a receipt there. The same suite passes locally
(Phase 2G: 41 passed, 1 skipped), so this is deployment-specific and unfixed.

## Evidence

| # | Check | Result |
|---|---|---|
| 1 | `vercel link --yes --project citeapply` | **PASS** — Next.js auto-detected, no build overrides. `.vercel/` and `.env*` gitignored; no env file or secret is committed. |
| 2 | Connect the GitHub repo to the project | **FAIL (non-blocking)** — `Failed to connect amithrh/citeapply to project`; the Vercel GitHub app has no access to the repo. There are therefore **no automatic Git deploys**: every deploy in this phase was made with the CLI, and a push to `main` alone will not update the site. |
| 3 | Provision Postgres via the Marketplace | **PASS** — after the user accepted the Neon terms in the browser, `vercel integration add neon -n citeapply-db -e production` provisioned `citeapply-db` and connected it to the project, which set `DATABASE_URL` on Production. |
| 4 | Migrations `0001`–`0005`, in order, `-v ON_ERROR_STOP=1`, `sslmode=require` | **PASS** — all five applied clean. `\dt` shows `applications`, `operations`, `rate_buckets`, `reviews`, `submissions`; `rate_buckets` holds both sentinel rows (`rate_capacity_mutex`, `start_parser_mutex`). |
| 5 | Production env vars | **PASS** — `CITEAPPLY_MASTER_KEY` (fresh 32 random bytes, base64url, generated and piped straight into `vercel env add`) and `APP_ORIGIN` = `https://citeapply.vercel.app`, both Sensitive; `DATABASE_URL` set by the Neon connection. |
| 6 | `vercel deploy --prod --yes` | **PASS** — build completed and aliased to `https://citeapply.vercel.app`, which matches `APP_ORIGIN` exactly. |
| 7 | `output: "standalone"` / `HOSTNAME` | **No issue** — Vercel serves Next natively; the origin check reads the request URL and `Host`, which the alias satisfies. |
| 8 | Fixture PDFs and `pdfjs-dist` traced | **PASS after a fix.** The first production deploy returned **500** on every `GET /api/demo` with `ReferenceError: DOMMatrix is not defined`, preceded by `Cannot load "@napi-rs/canvas" package`. `@napi-rs/canvas` is an *optional* dependency of `pdfjs-dist` that nothing imports statically, so nothing traced it into the function. `next.config.ts` now traces `./node_modules/@napi-rs/canvas/**` and `./node_modules/@napi-rs/canvas-*/**` alongside the fixtures and the legacy build. |
| 9 | `GET /` | **PASS** — 200. |
| 10 | Security headers on `/` | **PASS** — CSP (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`), `Permissions-Policy` with camera/geolocation/microphone/payment/usb/browsing-topics all empty, HSTS `max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, COOP/COEP/CORP. |
| 11 | `GET /api/demo` with `Sec-Fetch-Site: same-origin` + `Origin` | **PASS** — 200, a signed start token with a ten-minute expiry. |
| 12 | Cross-origin `POST /api/webmcp` | **PASS** — **403**. |
| 13 | `GET /icon.svg` | **PASS** — 200. |
| 14 | Full Playwright suite, `APP_ORIGIN=https://citeapply.vercel.app` | **FAIL — 31 passed, 10 failed, 1 skipped (5.0 min).** See below. |
| 15 | Footer references are real links | **PASS** — `src/ui/site/shell.tsx` links LICENSE, README, `docs/JUDGE-TESTING.md` and the Chrome verification doc at `https://github.com/amithrh/citeapply`; lint and `tsc --noEmit` clean; live on the deployment. |
| 16 | `LIVE_URL` / `REPO_URL` substitution | **PASS** — README, `docs/JUDGE-TESTING.md`, `docs/VIDEO-SCRIPT.md` and `devpost-submission.md` now name `https://citeapply.vercel.app` and `https://github.com/amithrh/citeapply`. `VIDEO_URL` is left as a placeholder; only the user can supply it. README and the judge guide carry a short note about the defect below. |

## The blocking defect

Ten specs fail against the live origin, and they share one cause. In the
**Supported** set — where the two records agree — typing `INR 480,000`, choosing
*Synthetic Income Statement* and picking its *Annual household income* line is
refused: *"CiteApply would not accept that line for this answer."* That is the
server's `evaluateEvidencePolicy` refusal, not the value-vs-line check, so the
text extraction itself is fine (names, household size and the income figure all
parse and display correctly). One field therefore never binds, *"Nothing is
blocking Review."* never appears, and every spec that needs a receipt fails:

- `applicant-journey.spec.ts` — the Supported receipt, the withdraw-review path, the manual-path-without-assistance path
- `assisted-visibility.spec.ts` — preparing the Review through a tool
- `receipt-delivery.spec.ts` — both receipt specs
- `watch-assistant.spec.ts` — the scripted client, and the no-WebMCP run
- `webmcp-journey.spec.ts` — the 13-step journey, **conflict** set, fails at step 10
- `axe-scan.test.ts` — the scan that has to reach the review and receipt

The same suite passed locally at Phase 2G (41 passed, 1 skipped), so the
difference is the deployed runtime, not the branch. The next person should
compare the evidence class the server derives for the income statement's income
line locally versus on the deployment — most likely in the parser's
classification of that line, which is the only input to the refusal that the
runtime could plausibly change.

## Environment variables set on Production (names only)

- `DATABASE_URL` (and the Neon connection's own `DATABASE_URL_UNPOOLED`, `PG*`, `POSTGRES_*`, `NEON_*` variables)
- `CITEAPPLY_MASTER_KEY`
- `APP_ORIGIN`

No secret value appears in this repository or in this report.

## Not verified

- **The 13-step real-Chrome journey for either record set on the live URL** — both stop at step 10 on the defect above. `docs/evidence/phase3/` therefore holds **no screenshots**: there is no landing/manual-form/refusal/receipt set from the live origin, and the `CITEAPPLY_EVIDENCE_DIR` run was not made.
- A fresh-incognito repeat, the `__Host-citeapply_session` cookie over HTTPS, the samples zip download, and `at_capacity` / rate-limit behaviour on the live origin.
- Whether `demo_start` should be raised for judging week (still the global 120/10 min; not changed).
- Automatic Git deploys — the repo is not connected, so the live site only changes when someone runs `vercel deploy --prod`.
