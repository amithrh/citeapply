# Judge testing guide

Live URL: `LIVE_URL`

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

> Last full verification was on Chrome 151.0.7922.175; re-verification against
> Chrome 152 is pending. On Chrome 151 the invocation contract is:
> `getTools()` returns a **Promise**; `executeTool(toolObject, argsJsonString)`
> takes the **registered tool object** (not its name) and a **JSON string**; the
> result comes back as a JSON string. See
> [verification/genuine-chrome-webmcp.md](verification/genuine-chrome-webmcp.md).

### A1. Start the Conflict packet

1. Open `LIVE_URL`.
2. **Expected:** header “Horizon Education Aid — Need-Based Scholarship”,
   “Fictional demo · Synthetic data only”, heading “Apply with synthetic
   records”, and two paths — **Supported packet** and **Conflict packet**.
3. Click **Start conflict packet**.
4. **Expected:** you land on the application page. Under the “Application”
   heading, a status line reads **“This page is current. Assisted access is
   off.”** and below it **“WebMCP: six CiteApply tools registered”**.
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
value. Either every entry applied or none did.

Retry the identical call with the **same** `requestId`: expect the recorded
effect replayed, not a second application. Reuse that `requestId` with different
content: expect `request_reuse_mismatch`.

### A7. The conditional branch opens

**Expected:** after the dependency field is bound, **guardian name** and
**household size** rows appear in the Answers list. Re-run
`get_form_requirements` with `mode: "active"` and confirm the active set is
larger than before. An attempt to work from the stale version returns
`stale_state` carrying the current versions.

### A8. The refusal (the point of the Conflict packet)

Attempt to bind `annual_household_income` from either income claim.

**Expected:**

```json
{"ok":false,"error":{"code":"conflict_requires_human",
 "message":"Income sources disagree. Resolve this in CiteApply.",
 "safeActions":["resolve_in_visible_application"]}}
```

and on the page, the income row still reads **“Two accepted sources disagree.
You decide.”** with the note “CiteApply will not choose between these. Pick the
source you stand behind.” Nothing was written.

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

1. In the income row, choose a reason under **Why this source**, then click
   **Use `<document>`: `<value>`** for one of the two sources.
2. In the email row, click **Save email**, then **I declare this is my address**.
3. **Expected:** the income row becomes ready; the email row loses “not yet
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
   id, the same content hash, and the conflict warning carried through.

At no point is there a tool that can confirm, submit, read the receipt, or
export it.

### A12. The manual path is complete (optional, 3 minutes)

Start the **Supported packet**, never open the consent dialog, and complete the
whole application with the visible buttons only (**Link `<document>` record**,
**Save email**, **I declare this is my address**, **Prepare review**, **Submit
this application**). **Expected:** you reach a receipt. Assistance is optional,
never required.

### A13. Revocation is immediate (optional)

With access allowed, click **Revoke access**, then call any tool.
**Expected:** status reads “Assisted access is off. Saved application work was
kept.”, and protected calls are refused. The page clears the capability from its
own memory *before* the network round trip, so no in-flight call can outlive the
revocation.

---

## B. ChatGPT in-app browser

1. Open `LIVE_URL` in the ChatGPT in-app browser.
2. **Expected:** the landing page renders identically; **Start conflict packet**
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
