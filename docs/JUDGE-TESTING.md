# Judge testing guide

**Where to run it.** There is no public deployment yet, so this guide is written
against a local production build at `http://localhost:3100`. Build and start it
exactly as `README.md` → *Run the production build* prescribes — the
`HOSTNAME=localhost` prefix and the `set -a; . ./.env.local; set +a` line are
both required, and omitting either produces a page that cannot start a record set.
If a live URL is published, substitute it for `http://localhost:3100`
throughout; nothing below depends on the origin.

Everything below is synthetic. Nothing is submitted to any real program. Please
do not type real personal or financial information — the portal says so on the
landing page too.

Two routes are supported:

- **A. Google Chrome with the WebMCP testing flag** — the full experience,
  including calling the tools yourself.
- **B. The ChatGPT in-app browser** — the product and its manual path, with
  whatever tool access that client exposes.

If a demo start ever answers **“At capacity.”** with a retry delay, that is the
deployment-wide rate limiter (a fixed window shared by all visitors), not a
crash. Wait for the stated delay and start again.

---

## A. Chrome with WebMCP

### A0. Enable the flag

1. Open `chrome://flags/#enable-webmcp-testing`, set it to **Enabled**, relaunch
   Chrome.
2. **Expected:** after relaunch, on any page, DevTools console
   `'modelContext' in document` → `true`.

> Last full verification was on Chrome 152.0.7977.66. The invocation contract is:
> `getTools()` returns a **Promise**; `executeTool(toolObject, argsJsonString)`
> takes the **registered tool object** (not its name) and a **JSON string**; the
> result comes back as a JSON string. See
> [verification/genuine-chrome-webmcp.md](verification/genuine-chrome-webmcp.md).

### A1. Start the records that disagree

1. Open `http://localhost:3100`.
2. **Expected:** header “Horizon Education Aid — Need-Based Scholarship”,
   “Fictional demo · Synthetic data only”, heading “The agent cites. You
   decide.”, a three-sentence explanation, a **Try it with an agent** box, and
   under *The records you will be working from*, three cards — **Records that
   disagree**, **Records that agree** and **Upload your records**. Each set
   card links to its three PDFs and to a zip of the set.
3. Click **Start with records that disagree**.
4. **Expected:** you land on the application page. The heading and the browser
   tab both read **“Application”** — they name the stage you are on, and will
   change to **“Review before submitting”** and then **“Submitted”** as you
   cross each threshold. Under the heading, one status line reads **“This page
   is current. Assisted access is off. WebMCP: six CiteApply tools
   registered.”**
   - If it instead reads “WebMCP is unavailable in this browser”, the flag is not
     active — go back to A0. The application still works manually.

### A2. Discover the tools

In DevTools console:

```js
const tools = await document.modelContext.getTools();
tools.map(t => t.name).sort();
```

**Expected:** exactly

```
["apply_evidence_backed_answers","get_application_state","get_evidence_index",
 "get_form_requirements","get_validation_issues","prepare_submission_review"]
```

Inspect one descriptor's `annotations` — e.g. `get_evidence_index` has
`readOnlyHint: true, untrustedContentHint: true`;
`apply_evidence_backed_answers` has `readOnlyHint: false`.

### A3. Read before consent — disclosure is bounded

```js
const call = async (name, input) => JSON.parse(await document.modelContext.executeTool(
  tools.find(t => t.name === name), JSON.stringify(input)));

await call("get_application_state", { mode: "redacted" });
```

**Expected:** `{"ok":true,"data":{"access":"consent_required","safeActions":["use_visible_application"]}}`
— it discloses that an application exists and nothing about its contents.

```js
await call("get_application_state", { mode: "protected" });
await call("get_evidence_index", {});
```

**Expected (both):**

```json
{"ok":false,"error":{"code":"consent_required",
 "message":"Use the visible CiteApply application to continue.",
 "safeActions":["use_visible_application"]}}
```

**This is what a refusal looks like:** `ok:false`, a stable machine-readable
`code`, a human sentence, and a `safeActions` list telling the agent what it may
legitimately do instead. Nothing on the page changed.

### A4. Allow assisted access (visible, human-only)

1. Click **Review and allow assisted access**.
2. **Expected:** a dialog titled **“Allow assisted access?”** listing
   *Information the tools may receive*, *Actions the tools may request*,
   *Information the tools will not receive*, *Actions the tools cannot take*, and
   a **Technical details** disclosure.
3. Click **Allow assisted access**.
4. **Expected:** the dialog closes; status reads **“Assisted access is allowed
   for this page and session.”** and a **Revoke access** button replaces the
   trigger. No token was shown to you or to any agent — the page holds it.

### A5. Read the rules and the evidence

```js
await call("get_form_requirements", { mode: "active" });
await call("get_evidence_index", {});
```

**Expected:** requirements are field *policies*, not answers — there is no
field-to-value map anywhere in the payload. The evidence index returns bounded
normalized claims with **opaque handles**, no raw PDF text, no exact excerpts,
no file paths. Two of the claims are income claims with different values:
`540000` and `480000`.

### A6. Apply supported bindings — one atomic mutation

Call `apply_evidence_backed_answers` with the handles for the supported,
non-income fields (include the `requestId` and the revision / requirements
version you last read; the schema is closed, so unexpected keys are rejected).

**Expected:** `ok:true` with the list of `updatedFields`, **and the visible form
changes as the result returns** — rows move from “Not linked yet” to the bound
value with the record it came from and that record’s own words beneath it. The
**Assisted activity** panel at the foot of the page gains a row naming the tool,
an **accepted** badge, the revision and the time. Either every entry applied or
none did.

Retry the identical call with the **same** `requestId`: expect the recorded
effect replayed, not a second application. Reuse that `requestId` with different
content: expect `request_reuse_mismatch`.

### A7. The conditional branch opens

**Expected:** after the dependency field is bound, the **guardian name** and
**household size** rows *become required*. Both rows are on screen from the
first load, labelled **“Not required”**; binding `dependency` flips them to
**“Not linked yet”** and they start counting toward readiness. Re-run
`get_form_requirements` with `mode: "active"` and confirm the active set grew
from six to eight. An attempt to work from the stale version returns
`stale_state` carrying the current versions.

### A8. The refusal (the point of the records that disagree)

Attempt to bind `annual_household_income` from either income claim.

**Expected:**

```json
{"ok":false,"error":{"code":"conflict_requires_human",
 "message":"Income sources disagree. Resolve this in CiteApply.",
 "safeActions":["resolve_in_visible_application"]}}
```

and on the page, the income row still reads **“Two accepted sources disagree.
You decide.”** with the note “CiteApply will not choose between these. Read
both records and pick the source you stand behind.” Nothing was written.

Also try to have the agent declare the email. **Expected:** it cannot — the
`preferred_contact_email` row stays at *“… — not yet declared”*. The tool may at
most propose the fixed synthetic `.test` address.

```js
await call("get_validation_issues", {});
```

**Expected:** an ordered list of blockers naming the conflict and the undeclared
email. Reading blockers is allowed; clearing them is not.

### A9. Premature review preparation fails closed

```js
await call("prepare_submission_review", { /* requestId + versions */ });
```

**Expected:** a refusal (not a Review) while the conflict and the declaration are
outstanding, and nothing on the page changes stage.

### A10. The human decides

1. **Expected first:** the income row shows both disagreeing records side by
   side — **Synthetic Household Statement** and **Synthetic Income Statement** —
   each with its quoted excerpt and what that excerpt reads as in rupees, so you
   read the evidence before you choose.
2. **Expected before you choose:** the **Why you chose this source** selector
   sits on its placeholder, *“Choose a reason before you decide…”*, and **both**
   **Use the …** buttons are **disabled**, with the hint “Choose a reason to
   enable the two buttons below. The review and the receipt will quote it back
   as your reason, so CiteApply will not pick one for you.” Try clicking a
   source button now: nothing resolves, and the income row still disagrees. The
   reason on the receipt is yours or there is no resolution.
3. Choose a reason under **Why you chose this source** — the buttons enable —
   then click **Use the Synthetic Income Statement** (or **Use the Synthetic
   Household Statement**).
4. In the email row, click **I declare this is my address**. If the agent
   already called `propose_email`, **Save email** is unnecessary; re-saving
   withdraws a declaration you have already made.
5. **Expected:** the income row becomes ready; the email row loses “not yet
   declared”; the Readiness count rises and the blockers list empties.

Now confirm the agent still cannot read your private decision: re-run
`get_application_state` with `mode: "protected"`. **Expected:** no conflict
choice, no reason string, no declaration record in the payload.

### A11. Prepare and submit

1. Either let the agent call `prepare_submission_review` now, or click
   **Prepare review** in the page. Both reach the same frozen Review.
2. **Expected:** the tool result carries only opaque readiness metadata — **not**
   the Review contents and **not** the content hash. The full frozen review
   appears only in the page: “Review before submitting”, the note that assisted
   access is closed while you review it, a conflict warning, the content hash,
   and every answer beside the exact source excerpt — **including both
   disagreeing income excerpts**.
3. Click **Return to draft** and prepare again if you want to confirm the Review
   is invalidated and re-frozen.
4. Click **Submit this application**.
5. **Expected:** the **Submitted** section with a receipt id, the review short
   id, the same content hash, the conflict warning carried through, and every
   accepted answer beside the excerpt it rests on.
6. Click **Download JSON**. **Expected:** a file named
   `citeapply-receipt-<id>.json` whose top-level `schema` is
   `citeapply-receipt-v1`, and whose accepted values are the ones on screen.
7. Click **Print**. **Expected:** the print preview keeps the receipt, its
   identifiers and every source excerpt, and drops the WebMCP status line, the
   Assisted activity panel, and the receipt's own **Download JSON**, **Print**
   and **Start a new synthetic demo** controls. The printed page is the record
   without the interface.
8. **Start a new synthetic demo** returns you to the landing page.

At no point is there a tool that can confirm, submit, read the receipt, or
export it. Download JSON and Print are visible human controls on the receipt;
the agent has no tool that reaches either one.

### A12. The manual path is complete (optional, 3 minutes)

Start the **records that agree**, never open the consent dialog, and complete the
whole application with the visible buttons only (**Link `<document>` record**,
**Save email**, **I declare this is my address**, **Prepare review**, **Submit
this application**). **Expected:** you reach a receipt. Assistance is optional,
never required.

### A13. A second tab supersedes the first (optional, 1 minute)

Only one page may own a session, and the page is now honest about which one
that is.

1. With the application open and assisted access allowed, open
   `http://localhost:3100/application` in a **second tab**.
2. **Expected:** the second tab lands with assisted access **off** — it fails
   closed, it does not inherit consent.
3. Go back to the first tab. It still says it is current, because nothing has
   told it otherwise yet. Now make **any** call from it — click a **Link
   `<document>` record** button, or run a tool from the console.
4. **Expected:** the call is refused with
   `{"ok":false,"error":{"code":"stale_page","message":"This page is no longer
   current.","safeActions":["reload_current_application"]}}`, and the first tab
   corrects itself: the status line flips to **“This page is no longer current.
   Reload to continue.”**, the “Assisted access is allowed” claim disappears, a
   **Reload this page** control appears, and every mutating control on that tab
   is disabled. The page never asserts an authority it does not have.
5. Click **Reload this page**. **Expected:** the first tab is current again,
   assisted access is off (fail-closed), and no saved work was lost. The second
   tab is now the stale one.

### A14. A malformed tool argument is still a structured refusal (optional)

```js
await call("apply_evidence_backed_answers", { bindings: [] });   // wrong key
```

**Expected:** not a thrown `UnknownError`, but

```json
{"ok":false,"error":{"code":"invalid_request",
 "message":"The request is not valid.",
 "safeActions":["use_visible_application"]}}
```

The closed input schema rejects it in the page, before the network — and still
tells the agent what to do instead. Every failure in this product is a
structured refusal; there are no opaque ones.

### A15. Revocation is immediate (optional)

With access allowed, click **Revoke access**, then call any tool.
**Expected:** status reads “Assisted access is off. Saved application work was
kept.”, and protected calls are refused. The page clears the capability from its
own memory *before* the network round trip, so no in-flight call can outlive the
revocation.

---

## B. ChatGPT in-app browser

1. Open the running CiteApply origin in the ChatGPT in-app browser.
2. **Expected:** the landing page renders identically; **Start with records that disagree**
   works; the application page loads and shows the readiness, answers, and
   sources sections.
3. Check the WebMCP status line under the “Application” heading.
   - **If it reads “WebMCP: six CiteApply tools registered”:** ask the assistant,
     in this order —
     1. “What tools does this page offer? Read the application state in redacted
        mode.” → expect the six names and the `consent_required` disclosure.
     2. Click **Review and allow assisted access** → **Allow assisted access**
        yourself, then: “Read the evidence index and the active requirements,
        then apply every supported binding in one call.” → expect `ok:true` and
        the form visibly updating.
     3. “Now fill in annual household income.” → **expect the refusal**:
        `conflict_requires_human`, and the income row unchanged.
   - **If it reads “WebMCP is unavailable in this browser”:** that is the honest
     fallback state, not a failure. **Expected:** the entire application remains
     completable with the visible controls — follow A10 and A11 by hand and reach
     the receipt.
4. **Expected either way:** no step ever lets the assistant declare the email,
   resolve the income conflict, submit, or read the receipt.

---

## What "working correctly" looks like in one line

The agent reads, proposes, and is told what is blocking it; the person declares,
resolves, and submits; and every refusal comes back as a structured server
answer with a safe next action rather than as a model's opinion.
