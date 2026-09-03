# CiteApply demo video — shot list and narration

**Target length 2:50** (hard cap 3:00). Public YouTube, audio required.

## Recording rules (from `docs/hackathon-build/scope.md`, "Demo Path")

- **One continuously recorded Conflict-packet session** against the deployed,
  styled build at `LIVE_URL` in Chrome 152 with `chrome://flags/#enable-webmcp-testing`
  enabled. Do not stop recording until the receipt renders.
- The **cold open is an excerpt from later in that same recording** — a genuine
  external-client tool result and a visible form mutation on screen by 0:10 —
  and must carry an on-screen label saying so.
- After the cold open the video returns to the **start of that same session** and
  runs chronologically.
- The Supported packet and the manual / no-WebMCP flow are regression evidence
  and judge instructions, **not** competing narratives. Do not show them here.
- Waiting may be compressed **only** with a visible on-screen label
  (“waiting compressed”). No invocation animation, no precomputed result, no
  harness standing in for the external client, no causally disconnected edit.

Recommended capture order: record the full chronological session first, then cut
the 0:00–0:12 cold open out of the later part of that same take.

---

## Shot list

### 0:00–0:12 — Cold open: a genuine call, a visible change

**On screen:** the application page, Conflict packet, split so the DevTools
console showing a real `document.modelContext.executeTool(...)` call and its
JSON result sits beside the form. The result lands, the **Legal name** row flips
from “Not linked yet” to the bound value with its source excerpt beneath it, and
a new row appears in the page’s own **Assisted activity** panel with an
**accepted** badge. Persistent on-screen label, top-left: **“Excerpt from 1:35
of this same recording.”**

> "That was a real WebMCP tool call, from the browser's own API, into a
> scholarship portal that just changed in front of you. Nobody clicked anything.
> Now here is the whole session, from the start."

### 0:12–0:30 — Start the Conflict packet

**On screen:** the landing page. Header reads “Horizon Education Aid —
Need-Based Scholarship / Fictional demo · Synthetic data only”, headline **“The
agent cites. You decide.”** Click **Start conflict packet**. The application
page loads; point the cursor at the status line, which ends **“WebMCP: six
CiteApply tools registered.”**

> "CiteApply is a fictional aid portal running entirely on synthetic records. It
> registers six WebMCP tools when the application page loads. Everything you'll
> see the agent do goes through those six tools — and nothing else."

### 0:30–0:48 — Discovery, and a protected read before consent

**On screen:** console. `getTools()` resolves to the six names. Then a
`get_application_state` call in `redacted` mode returning
`{"ok":true,"data":{"access":"consent_required","safeActions":["use_visible_application"]}}`,
then the same tool in `protected` mode returning the `consent_required` refusal.

> "The agent can see the tools before I've allowed anything. Reading in redacted
> mode tells it there's an application here and nothing else. The moment it asks
> for protected data, the server refuses — consent required. The refusal is the
> server's, not the model's."

### 0:48–1:05 — Visible consent

**On screen:** click **Review and allow assisted access**. The dialog opens:
scroll it so “Information the tools may receive”, “Information the tools will
not receive”, and “Actions the tools cannot take” are all readable. Click
**Allow assisted access**. Status line becomes “Assisted access is allowed for
this page and session.” Pan down one beat to **Where the assistant stops**, the
two columns headed **What the assistant may do** and **What only you can do**.

> "Consent is a real disclosure. It lists what the tools may receive, what they
> will never receive, and what they can't do. And the capability it creates is
> never handed to the agent — the page holds it and injects it on every call."

### 1:05–1:35 — Reads, then one atomic mutation

**On screen:** console calls to `get_form_requirements` (active mode) and
`get_evidence_index` — the index shows two income claims that disagree,
`540000` and `480000`. Then one `apply_evidence_backed_answers` call binding the
supported fields. The form visibly updates as the result returns, and the
**Assisted activity** panel logs each call with its outcome badge. *(This is the
region the cold open was cut from.)*

> "It reads the rules, then the evidence index — and there are already two income
> claims that don't agree. It applies the bindings it's allowed to apply in a
> single atomic call. All of them, or none. And the form you're looking at is the
> thing that changed."

### 1:35–1:52 — The requirements change underneath the agent

**On screen:** the conditional branch appearing — **Guardian name** and
**Household size** rows are now present. Re-run `get_form_requirements` in
active mode; the active set is larger than before.

> "Answering one question changed which questions apply. Guardian name and
> household size just appeared. This isn't a static schema the agent memorised —
> it has to read the requirements again, because the site's rules are live."

### 1:52–2:12 — The refusal this product exists for

**On screen:** an `apply_evidence_backed_answers` call attempting to bind
`annual_household_income`. The result:
`{"ok":false,"error":{"code":"conflict_requires_human","message":"Income sources disagree. Resolve this in CiteApply.","safeActions":["resolve_in_visible_application"]}}`.
Cut to the income row, still reading **“Two accepted sources disagree. You
decide.”**, and to the **conflict requires human** badge that just appeared in
the Assisted activity panel. Then `get_validation_issues` listing the conflict
and the undeclared email as blockers.

> "Here's the moment. The agent asks to fill in income. Two accepted sources
> disagree — five hundred and forty thousand on one, four hundred and eighty
> thousand on the other. The website answers `conflict_requires_human` and writes
> nothing. It also refuses to declare my email address for me. The agent can read
> exactly why it's blocked. It just can't clear the blockers itself."

### 2:12–2:30 — The human decides

**On screen:** the income row, showing both records side by side — **Synthetic
Household Statement** quoting “INR 480,000” and **Synthetic Income Statement**
quoting “INR 540,000”, each with what it reads as in rupees. Pick a reason from
**Why you chose this source**, click **Use the Synthetic Income Statement**,
then in the email row click **Save email** and **I declare this is my address**.

> "So I decide — and I get to read both records before I do. Here is what each
> one actually says. I pick the source I'm willing to stand behind, I say why,
> and I declare my own contact address. Those two acts are mine — there is no
> tool that can do either one."

### 2:30–2:42 — Frozen review, human-only submit

**On screen:** click **Prepare review**. The frozen review appears: each answer
beside the exact source excerpt, both conflicting income excerpts visible, the
conflict warning, the content hash. Note the copy: “Assisted access is closed
while you review it.” Click **Submit this application**.

> "The agent can ask the site to freeze the application — but the review only
> appears here, in the page, and assisted access closes when it does. Every
> answer sits beside the exact text it came from, including both figures that
> disagreed. Submitting is mine too."

### 2:42–2:50 — Receipt, and an honest close

**On screen:** the **Submitted** receipt: receipt id, review short id, the same
content hash, the conflict warning, every accepted answer beside its source
excerpt, and the line saying which record you chose and why. Hover the
**Download JSON** and **Print** buttons.

> "Same hash, same warning, and the record I chose still named on a receipt I
> could defend — on screen, as a file, or on paper. Synthetic records, a
> fictional program, and WebMCP is still a draft standard. But the contract is
> real — and the website is the one enforcing it."

---

## Word-for-word narration, continuous

> That was a real WebMCP tool call, from the browser's own API, into a
> scholarship portal that just changed in front of you. Nobody clicked anything.
> Now here is the whole session, from the start.
>
> CiteApply is a fictional aid portal running entirely on synthetic records. It
> registers six WebMCP tools when the application page loads. Everything you'll
> see the agent do goes through those six tools — and nothing else.
>
> The agent can see the tools before I've allowed anything. Reading in redacted
> mode tells it there's an application here and nothing else. The moment it asks
> for protected data, the server refuses — consent required. The refusal is the
> server's, not the model's.
>
> Consent is a real disclosure. It lists what the tools may receive, what they
> will never receive, and what they can't do. And the capability it creates is
> never handed to the agent — the page holds it and injects it on every call.
>
> It reads the rules, then the evidence index — and there are already two income
> claims that don't agree. It applies the bindings it's allowed to apply in a
> single atomic call. All of them, or none. And the form you're looking at is the
> thing that changed.
>
> Answering one question changed which questions apply. Guardian name and
> household size just appeared. This isn't a static schema the agent memorised —
> it has to read the requirements again, because the site's rules are live.
>
> Here's the moment. The agent asks to fill in income. Two accepted sources
> disagree — five hundred and forty thousand on one, four hundred and eighty
> thousand on the other. The website answers conflict-requires-human and writes
> nothing. It also refuses to declare my email address for me. The agent can read
> exactly why it's blocked. It just can't clear the blockers itself.
>
> So I decide — and I get to read both records before I do. Here is what each
> one actually says. I pick the source I'm willing to stand behind, I say why,
> and I declare my own contact address. Those two acts are mine — there is no
> tool that can do either one.
>
> The agent can ask the site to freeze the application — but the review only
> appears here, in the page, and assisted access closes when it does. Every
> answer sits beside the exact text it came from, including both figures that
> disagreed. Submitting is mine too.
>
> Same hash, same warning, and the record I chose still named on a receipt I
> could defend — on screen, as a file, or on paper. Synthetic records, a
> fictional program, and WebMCP is still a draft standard. But the contract is
> real — and the website is the one enforcing it.

## On-screen labels to prepare

- `Excerpt from 1:35 of this same recording` — 0:00–0:12, persistent.
- `waiting compressed` — anywhere a pause is cut.
- `Synthetic data only · fictional program` — a discreet corner label throughout.
