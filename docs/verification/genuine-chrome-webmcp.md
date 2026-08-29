# Genuine WebMCP client verification — Chrome 151

Captured 2026-08-29 against a locally running build, driven from the browser's
own `document.modelContext` API rather than from CiteApply's internals.

- **Client:** Google Chrome 151.0.7922.175 (stable), with
  `chrome://flags/#enable-webmcp-testing` set to Enabled.
- **Origin under test:** `http://localhost:3100`
- **Packet:** Conflict

## What the browser exposes

```js
'modelContext' in document                                   // true
Object.getOwnPropertyNames(Object.getPrototypeOf(document.modelContext))
// ["ontoolchange", "executeTool", "getTools", "registerTool", "constructor"]
```

## Chrome's actual invocation contract

This differs from both the Community Group draft and CiteApply's original
assumption, and was established by registering a probe tool that recorded
exactly what the browser passed it:

| Aspect | Chrome 151 behaviour |
|---|---|
| `getTools()` | returns a **Promise** resolving to an array |
| `executeTool(tool, args)` | first argument must be the **registered tool object**, not its name |
| `args` | must be a **JSON string**; passing an object fails with `Failed to parse input arguments` |
| callback `input` | receives the **parsed object** |
| callback `options` | **not passed at all** — there is no `options.signal` |
| return value | serialized to a **JSON string** |

The missing options object was a genuine defect on CiteApply's side: the
descriptor callback began with `throwIfAborted(options.signal)`, which threw a
`TypeError` before any work. All six tools registered, but every invocation
failed with *"Tool was executed but the invocation failed."* The callback now
reads the signal defensively, so a client that omits it can still invoke tools,
and cancellation is honoured wherever a client does supply one.

## Verified sequence

All calls below were made through `document.modelContext.executeTool`.

1. **Registration.** `getTools()` resolves to exactly the six CiteApply names:
   `apply_evidence_backed_answers`, `get_application_state`,
   `get_evidence_index`, `get_form_requirements`, `get_validation_issues`,
   `prepare_submission_review`. The page reports
   *"WebMCP: six CiteApply tools registered."*

2. **Redacted read before consent** — permitted, and value-free:

   ```json
   {"ok":true,"data":{"access":"consent_required",
    "safeActions":["use_visible_application"]}}
   ```

3. **Protected read before consent** — refused:

   ```json
   {"ok":false,"error":{"code":"consent_required",
    "message":"Use the visible CiteApply application to continue.",
    "safeActions":["use_visible_application"]}}
   ```

   `get_evidence_index` returned the same refusal.

4. **The applicant allows assisted access** through the visible dialog. The
   capability is never handed to the agent; the page holds it.

5. **Evidence index** returns two income claims that disagree:
   `household = 480000`, `income = 540000`.

6. **A permitted binding succeeds** — the agent links the legal name:

   ```json
   {"ok":true,"data":{"updatedFields":["legal_name"], ...}}
   ```

7. **The contradicting binding is refused** — the result this product exists to
   demonstrate:

   ```json
   {"ok":false,"error":{"code":"conflict_requires_human",
    "message":"Income sources disagree. Resolve this in CiteApply.",
    "safeActions":["resolve_in_visible_application"]}}
   ```

   Nothing was written. The field stays unresolved until a person chooses a
   source and states a reason in the visible portal.

8. **Structured blockers** are readable by the agent, with the conflict named:
   `missing_evidence ×3`, `conflict_requires_human`, `invalid_email`.

## Scope of this evidence

This confirms registration, the consent boundary, a permitted mutation, and the
conflict refusal against a real browser implementation. It was driven by scripted
calls to Chrome's WebMCP API, not by a model choosing the calls; an end-to-end
session with an autonomous agent client remains unproven.
