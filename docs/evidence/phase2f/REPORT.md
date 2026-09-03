# Phase 2F — record sets, previews, downloads, uploads, and the two-way choice

Branch `hackathon-final`, main tree `/Users/amitmishra/worksppace-central/webmcp`.
This report covers five commits that had already landed when Phase 2G began and
had no report of their own:

| Commit | What |
|---|---|
| `1a5c7c6` | serve the committed sample records, and accept them back as an upload |
| `4fe62e1` | landing: records, not packets — preview, download and upload a record set |
| `c753bb9` | application: a one-time coach strip, and an explicit by-hand or assisted choice |
| `f5ffbc1` | docs: rename the two starts to record sets; document preview, download and upload |
| `20262bf`, `2430b44` | e2e cover for previews, downloads, uploads and the fill choice; axe over the upload card and the coach strip |

## What landed

**The word "packet" is gone.** A person arriving at the landing page was asked
to choose between a "Supported packet" and a "Conflict packet", which are the
product's internal names for two fixture directories. They are now **Records
that agree** and **Records that disagree**, and each is a card that says what
is in it.

**The three records are real files you can open before you start.** Each set
card links to its three one-page PDFs, served inline from
`/api/demo?document=<set>/<name>.pdf`. The path is re-derived from the
hash-allowlisted packet registry and confined to `fixtures/packets`; no
caller-supplied string reaches the filesystem, and a name outside the registry
is refused.

**A set can be downloaded and uploaded back.**
`/api/demo?records=<set>` returns a zip of the three committed records.
`POST /api/demo` with those files hashes each one and starts the set they
match. Nothing else is accepted, the bytes are never stored, and a PDF this
demonstration did not commit is refused with copy that says so — which is the
honest way to have an upload box on a synthetic-only demonstration.

**A coach strip and an explicit fork.** The application opens with a
three-sentence explanation of what an evidence-backed answer is, dismissible
and remembered in browser storage, and then asks the question the product had
previously left implied: *How do you want to fill this in?* — by hand, or with
an assistant. Choosing an assistant opens the same disclosure the rail opens.
Neither branch changes what the page can do or hides any control.

## Verification run for these commits

Node v24.20.0, npm 11.19.0. Database: the throwaway cluster on
`127.0.0.1:5433`. Browser for the journey and axe runs: the installed **Google
Chrome** channel with `--enable-features=WebMCPTesting`.

| Command | Result |
|---|---|
| `npm run test:all` | **61 tests, 61 pass, 0 fail** |
| `npx playwright test tests/e2e tests/accessibility` (`APP_ORIGIN` exported) | **36 passed, 1 skipped, 0 failed** |

The single skip is `tests/e2e/raw-genuine-client-chronology.spec.ts:37`, which
needs three real unedited ChatGPT-desktop capture files that only the user can
produce. It has been skipped for the same stated reason since Phase 1.

## What this report does not claim

It is written after the fact, from the commits and from re-running the two
suites above at Phase 2G's starting commit. It is not a contemporaneous record:
no screenshots were taken at the time, no separate axe evidence was archived
for the upload card beyond the passing spec, and the upload path was never
exercised against a real deployment, a real file picker, or a browser other
than Chrome.
