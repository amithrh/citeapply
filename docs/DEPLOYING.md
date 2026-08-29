# Deploying CiteApply

The app is a standard Next.js App Router application on the Node runtime with a
single PostgreSQL database. It needs three environment variables and the five
migrations applied in order.

## Environment

| Variable | What it is |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Must include a username. |
| `CITEAPPLY_MASTER_KEY` | Base64url-encoded 32 random bytes. All session, page, consent, rate, and operation keys are derived from it. |
| `APP_ORIGIN` | The exact public origin, scheme included, with no trailing path — for example `https://citeapply.example.com`. |

Generate a master key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

`APP_ORIGIN` is not cosmetic. Same-origin enforcement compares the request URL,
`Host`, `Origin`, and `Sec-Fetch-Site` against it, and the key derivation is
salted with it. If it does not match the origin the browser actually used, every
request is refused as `stale_page`, and changing it later invalidates all live
sessions.

## Migrations

Apply once, in filename order, before the first request:

```bash
for f in db/migrations/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

`0005_rate_buckets.sql` seeds two sentinel rows that the Start path locks
against. Without them, starting a demo fails.

## Cookies require HTTPS

The session cookie is `__Host-citeapply_session` with `Secure`, `HttpOnly`,
`SameSite=Strict`, and `Path=/`. Browsers accept `Secure` cookies on
`http://localhost`, but any other origin must be served over HTTPS or no session
will ever be established.

## Vercel

1. Import the repository. The framework preset is Next.js; no build overrides.
2. Provision a PostgreSQL database through the Marketplace and let it set
   `DATABASE_URL`, or set it manually.
3. Add `CITEAPPLY_MASTER_KEY` and `APP_ORIGIN` for Production. Set `APP_ORIGIN`
   to the domain you will actually demo from — a stable custom domain or the
   production alias, **not** a per-deployment preview URL, since it must match
   the origin in the browser's address bar.
4. Apply the migrations against the provisioned database from your machine.
5. Deploy, then confirm the checks below.

`next.config.ts` sets `output: "standalone"` and declares `pdfjs-dist` and `pg`
as server-external packages; both are required and neither should be removed.
`outputFileTracingIncludes` keeps the six fixture PDFs in the deployed bundle —
the parser reads them at runtime on every start, so a deployment that drops them
will fail every start with `document_unavailable`.

## Netlify

Use the official Next.js runtime, set the same three variables, and apply the
migrations the same way. The standalone output and Node runtime are compatible;
nothing in the app uses an edge-only or platform-specific API.

## Docker

`compose.yaml` starts only a local database for development. For a container
image, build with `npm ci && npm run build` and run `.next/standalone/server.js`
with `PORT` set, copying `.next/static`, `public` (if present), and `fixtures/`
alongside it.

## Post-deploy checks

Run these against the deployed origin before demoing.

```bash
# 1. A start token is issued.
curl -s "$APP_ORIGIN/api/demo" -H 'sec-fetch-site: same-origin'

# 2. Security headers and the WebMCP permission are present.
curl -sI "$APP_ORIGIN/" | grep -iE 'content-security-policy|permissions-policy'

# 3. Cross-origin calls are refused.
curl -s -o /dev/null -w '%{http_code}\n' "$APP_ORIGIN/api/webmcp" \
  -X POST -H 'content-type: application/json' \
  -H 'origin: https://example.com' -H 'sec-fetch-site: cross-site' \
  -d '{"tool":"get_evidence_index","input":{}}'   # expect 403
```

Then, in a browser: start the Conflict packet, confirm the application page says
the page is current, and confirm the income row reads “Two accepted sources
disagree. You decide.” If it does, parsing, persistence, capability derivation,
and evidence policy are all working.

## Operational notes

- Sessions last 60 minutes. Expired applications are cleaned up opportunistically
  as new demos start.
- Concurrent applications are capped at 512; beyond that, Start returns
  `at_capacity` rather than degrading.
- Rate limits are deployment-wide counters, not per-visitor. The current budgets
  suit a public demo with many simultaneous visitors; lowering them will lock out
  real users, not just abusive ones.
- Nothing stored is real. There is no personal data to protect, no email is ever
  sent, and no external service is called at runtime.
