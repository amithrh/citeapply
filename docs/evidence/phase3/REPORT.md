# Phase 3 — Deploy to a public HTTPS origin

**Live URL:** https://citeapply.vercel.app

**Status: deployed, serving, and green.** The full Playwright suite now passes
against the live origin — **42 passed, 1 skipped** — and both record sets reach
a receipt there. The blocking defect recorded in the previous revision of this
report is fixed, and its cause was not the one that revision guessed.

## The defect, and what it actually was

The previous revision reported that linking the Synthetic Income Statement's
_Annual household income_ line was refused on the deployment, in both record
sets, and guessed that the deployed runtime derived a different **evidence
class** for that line — a pdfjs, font, locale or ICU difference on Linux.

That was wrong, and the first measurement said so. Driving the by-hand path
against the live origin and capturing the request and response bodies, the
refused call is:

```
POST /api/application/actions
  {"expectedApplicationRevision":8, … ,"action":"bind_evidence",
   "field":"annual_household_income","claimHandle":"…"}
→ 409 {"ok":false,"error":{"code":"stale_state",
       "message":"The saved application changed.", …}}
```

`stale_state`, not `evidence_unavailable`. The evidence policy never ran. The
immediately preceding action, `declare_email`, had also been sent with
`expectedApplicationRevision: 8` and had already moved the application to
revision 9 — so the bind arrived carrying a coordinate the server had
superseded, and was refused exactly as it should be. Nothing was wrong with the
parser, the claims, the anchors or the policy; the page was telling the server
where it thought it was, and it was one revision behind.

### Root cause

`runAction` in `src/app/application/page.tsx` read `authorityRef.current`,
awaited the round trip, and adopted the answer — with nothing serializing that
critical section. Two actions started inside one round trip therefore read the
same revision, and the second was refused.

On `localhost` the round trip is about a millisecond, so the window never opens
and the suite passes. On the deployment it is two to four hundred milliseconds,
so **any two ordinary interactions collide**: saving the email, declaring it,
and then linking the next line is enough. Every failing spec shared that
shape, which is why they all failed and why they all failed at the income line
— it is simply the answer the by-hand path reaches immediately after the two
email actions.

This was a real defect for a real applicant on the live site, not only for the
suite: a person who declares their address and links the next line at ordinary
speed was told _"The saved application changed."_ for no reason they could see.

### The fix

`src/app/application/page.tsx:570-597` — a one-action-at-a-time queue
(`actionQueueRef` / `serializeAction`), through which `runAction`
(`page.tsx:600`) and `submit` (`page.tsx:741`) both run. Each action still
sends the coordinate the server last confirmed; it is now guaranteed to be the
current one. **No policy, value check, contract, schema or fixture was
touched** — `verify:surfaces` reports the same manifest digest
`42f69d1d…2905a6` it has reported since Phase 1.

A second, smaller defect surfaced once the first was fixed: the three `@watch`
specs sampled the narration strip on a 120 ms timer, which cannot see every
step when each step is a WAN round trip apart. `tests/e2e/watch-assistant.spec.ts`
now records steps with a `MutationObserver` installed before the run, so no
step can be missed. **Every assertion is unchanged** — still nine steps, in
order, with the outcome the server returned, and the counter still equal to the
ledger.

### The regression test

`tests/e2e/stale-page.spec.ts` — _"actions started inside one slow round trip
are not refused"_. It pins a deployment's latency into a local test by delaying
`**/api/application/actions` by 400 ms with `page.route`, then performs the
three ordinary interactions with no wait between them. Against the un-fixed
page it fails with the exact live symptom (`The saved application changed.`
visible, the income entry still on screen); against the fixed page it passes.
That is why the suite is 42 rather than 41.

## Evidence

Every row below was run against the deployment at
`https://citeapply.vercel.app` unless it says otherwise.

| #   | Check                                                                                                     | Result                                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Reproduce on the live origin, request and response captured                                               | **PASS** — the refusal is `409 stale_state` on `bind_evidence`, sent with `expectedApplicationRevision: 8` while the server was at 9. The evidence policy was never reached                                          |
| 2   | Same run with a 3 s settle before the income entry                                                        | **PASS** — the line links, which isolates the cause to timing, not classification                                                                                                                                    |
| 3   | Failing assertion written first: `tests/e2e/stale-page.spec.ts`, 400 ms injected latency, un-fixed page   | **RED** — `The saved application changed.` visible; income entry still present                                                                                                                                       |
| 4   | Same test, fixed page, local standalone build                                                             | **PASS**                                                                                                                                                                                                             |
| 5   | `npm run test:security`                                                                                   | **PASS** — 61 tests, 61 pass (`test:all`), security suite clean                                                                                                                                                      |
| 6   | `npm run verify:fixture-hashes`                                                                           | **PASS** — `Verified 6 deterministic synthetic one-page PDFs.`                                                                                                                                                       |
| 7   | `npm run verify:surfaces`                                                                                 | **PASS** — `gate=W0-C0 manifest=42f69d1d0ac8ca8b0eebefe229cd42f36e12cfd078cb8663ea0a52db2b2905a6 paths=76`, unchanged                                                                                                |
| 8   | `npm run verify:production-imports`                                                                       | **PASS** — 64 source files, no new file added                                                                                                                                                                        |
| 9   | `npm run typecheck`                                                                                       | **PASS** — no output                                                                                                                                                                                                 |
| 10  | `npm run lint`                                                                                            | **3 pre-existing errors**, all `no-console` in `docs/video/record-session.mjs`, present on `HEAD` before this change and untouched by it. Nothing in `src/` or `tests/` reports                                      |
| 11  | `npm run test:all`                                                                                        | **PASS** — 61 tests, 61 pass, 0 fail, 0 skipped                                                                                                                                                                      |
| 12  | `rm -rf .next && npm run build`                                                                           | **PASS** — 11 routes, standalone output, `/application` 16.7 kB                                                                                                                                                      |
| 13  | `npm run verify:built-anti-hardcode`                                                                      | **PASS** — 166 production text artifacts                                                                                                                                                                             |
| 14  | Full Playwright, README-verbatim local standalone on `:3100`                                              | **PASS — 42 passed, 1 skipped** (34.9 s)                                                                                                                                                                             |
| 15  | `vercel deploy --prod --yes`                                                                              | **PASS** — `citeapply-17yx1qoue…` Ready, aliased to `https://citeapply.vercel.app`                                                                                                                                   |
| 16  | **Full Playwright, `APP_ORIGIN=https://citeapply.vercel.app`**                                            | **PASS — 42 passed, 1 skipped** (3.4 min). Was 31 passed / 10 failed / 1 skipped                                                                                                                                     |
| 17  | 13-step real-Chrome journey, **both record sets**, live, `CITEAPPLY_EVIDENCE_DIR=docs/evidence/phase3`    | **PASS — 2 passed** (33.2 s). **30 screenshots** and a verbatim `tool-log.md` written, all from the live origin                                                                                                      |
| 18  | Screenshots of landing, the by-hand form, the live refusal, the hand-off and the receipt, on the live URL | **PASS** — `*-step01-landing.png`, `*-step02-form-open.png`, `*-step03-pre-consent-refusals.png` and `*-step09-premature-prepare-refused.png`, `*-step10-human-decisions.png`, `*-step13-receipt.png`, for both sets |
| 19  | `GET /api/demo?records=supported` (samples zip)                                                           | **PASS** — `200`, `application/zip`, 7 761 bytes                                                                                                                                                                     |
| 20  | `__Host-` session cookie over HTTPS                                                                       | **PASS** — `__Host-citeapply_session`, `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, domain `citeapply.vercel.app`                                                                                              |
| 21  | Fresh incognito start (empty browser profile, live origin)                                                | **PASS** — the record set starts and `/application` opens; `docs/evidence/phase3/live-incognito-application.png`                                                                                                     |
| 22  | `GET /` and the security headers                                                                          | **PASS** — 200; CSP, `Permissions-Policy`, HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, COOP/COEP/CORP, as recorded in the previous revision                                            |
| 23  | Cross-origin `POST /api/webmcp`                                                                           | **PASS** — 403                                                                                                                                                                                                       |

## The 42/1 breakdown

41 specs as at Phase 2G, plus the one new regression test in row 3. The single
skip is still `tests/e2e/raw-genuine-client-chronology.spec.ts:37`, which needs
three real unedited ChatGPT-desktop capture files that only the user can
produce.

## Environment variables set on Production (names only)

- `DATABASE_URL` (and the Neon connection's own `DATABASE_URL_UNPOOLED`, `PG*`, `POSTGRES_*`, `NEON_*` variables)
- `CITEAPPLY_MASTER_KEY`
- `APP_ORIGIN`

No secret value appears in this repository or in this report.

## Still not verified

- **Automatic Git deploys.** The Vercel GitHub app has no access to the repo, so
  the connection could not be made. The live site only changes when someone runs
  `vercel deploy --prod`; a push to `main` alone will not update it.
- `at_capacity` and rate-limit behaviour on the live origin.
- Whether `demo_start` should be raised for judging week (still the global
  120 / 10 min; not changed).
- The three `no-console` lint errors in `docs/video/record-session.mjs`, which
  predate this work and are left as they were found.
