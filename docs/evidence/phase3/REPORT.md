# Phase 3 — Deploy to a public HTTPS origin

**Status: BLOCKED on one human browser step.** The app is deployed and the
production alias is live, but it has no database, so every start returns 500.

**Live URL:** https://citeapply.vercel.app

## What the user must do (one step, ~30 seconds)

Open this URL in a browser signed in as `amithrh` and accept the Vercel
Marketplace terms for Neon:

    https://vercel.com/amit-mishras-projects-eca17d16/~/integrations/accept-terms/neon?source=cli

The CLI cannot do this: `vercel integration add neon` returns
`action_required` / `integration_terms_acceptance_required` in non-interactive
mode, and accepting third-party terms is a human decision. Policy links the
install shows: Vercel marketplace addendum, Neon privacy policy, Neon terms of
service.

After acceptance, the remaining work is scripted and takes about ten minutes:

    vercel integration add neon -n citeapply-db -e production
    vercel env pull .env.production.local
    for f in db/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
    vercel deploy --prod --yes

(Neon requires `sslmode=require` in the connection string.)

## Evidence

| # | Check | Result |
|---|---|---|
| 1 | `vercel link --yes --project citeapply` | **PASS** — project `citeapply` created under `amit-mishras-projects-eca17d16`, framework auto-detected as Next.js, no build overrides. `.vercel/` and `.env*` are gitignored. |
| 2 | Connect the GitHub repo during link | **FAIL (non-blocking)** — `Failed to connect amithrh/citeapply to project`. The repo exists and is public; the Vercel GitHub app has no access to it. Deploys are done with the CLI instead, so this only means no automatic Git deploys. |
| 3 | Provision Postgres via the Marketplace | **BLOCKED** — see above. No resources exist on the project (`vercel integration list` → none). |
| 4 | Migrations `0001`–`0005` | **NOT RUN** — no database. |
| 5 | Production env vars | **PASS** — `CITEAPPLY_MASTER_KEY` (fresh 32 random bytes, base64url) and `APP_ORIGIN` set for Production, both marked Sensitive. `DATABASE_URL` is **missing**. |
| 6 | `vercel deploy --prod --yes` | **PASS** — build completed, all serverless functions created, aliased to `https://citeapply.vercel.app` — which matches `APP_ORIGIN` exactly. Deployment `dpl_2UPZFqxnbTirmbkPCrhrp6mXymmj`. |
| 7 | `output: "standalone"` / `HOSTNAME` | **No issue** — Vercel serves Next natively; the build did not complain, and the origin check reads the request URL and `Host`, which the alias satisfies. |
| 8 | `GET /` | **PASS** — 200. |
| 9 | Security headers on `/` | **PASS** — CSP (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`), `Permissions-Policy` (camera/geolocation/microphone/payment/usb/browsing-topics all empty), HSTS `max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, COOP/COEP/CORP. |
| 10 | `GET /icon.svg` | **PASS** — 200. |
| 11 | `GET /api/demo` with `Sec-Fetch-Site: same-origin` + `Origin` | **FAIL — 500**, because `DATABASE_URL` is unset. Expected to pass once the database is provisioned. |
| 12 | Footer references are real links | **PASS** — `src/ui/site/shell.tsx` now links LICENSE, README, `docs/JUDGE-TESTING.md` and the Chrome verification doc at `https://github.com/amithrh/citeapply`. Lint and `tsc --noEmit` clean. Deployed only after the next production deploy. |

## Environment variables set on Production (names only)

- `CITEAPPLY_MASTER_KEY`
- `APP_ORIGIN`

`DATABASE_URL` is **not** set. No secret value appears in this repository; the
key was generated on the fly and piped straight into `vercel env add`.

## Not verified

Everything downstream of the database:

- the five migrations, and the `0005` sentinel rows the Start path locks against;
- fixture-PDF and `pdfjs-dist` runtime tracing (the build succeeded, but only a
  successful start proves the PDFs are readable at runtime);
- starting either record set, the `__Host-citeapply_session` cookie, the samples
  zip download, `at_capacity` and rate-limit behaviour;
- the full Playwright suite against the live URL;
- the 13-step real-Chrome journey for both record sets, and its screenshots
  (`docs/evidence/phase3/` holds no screenshots);
- README / JUDGE-TESTING / VIDEO-SCRIPT / devpost-submission still point at
  `http://localhost:3100`, and `devpost-submission.md` still carries the
  `LIVE_URL`, `REPO_URL` and `VIDEO_URL` placeholders. They were deliberately
  **not** rewritten to the live URL, because sending a judge to a site whose
  every start returns 500 is worse than sending them to the local instructions.
