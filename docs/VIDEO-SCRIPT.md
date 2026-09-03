# CiteApply demo video — shot list and narration

**Target length 2:50** (hard cap 3:00). Public YouTube, audio required.

## Recording rules (from `docs/hackathon-build/scope.md`, "Demo Path")

- **One continuously recorded session on the records that disagree** in Chrome 152 with
  `chrome://flags/#enable-webmcp-testing` enabled. Do not stop recording until
  the receipt renders.
- **Recording target.** No public deployment exists yet, so record against the
  local production build at `http://localhost:3100`, started exactly as
  `README.md` → *Run the production build* prescribes (the `HOSTNAME=localhost`
  is required). That is the same styled standalone build a deployment would
  serve — nothing in the demo depends on the origin. If a live URL is published
  before recording, substitute it here and re-record; never narrate a URL that
  is not on screen.
- The **cold open is an excerpt from later in that same recording** — a genuine
  external-client tool result and a visible form mutation on screen by 0:10 —
  and must carry an on-screen label saying so.
- After the cold open the video returns to the **start of that same session** and
  runs chronologically.
- The records that agree and the manual / no-WebMCP flow are regression evidence
  and judge instructions, **not** competing narratives. Do not show them here.
- Waiting may be compressed **only** with a visible on-screen label
  (“waiting compressed”). No invocation animation, no precomputed result, no
  harness standing in for the external client, no causally disconnected edit.

**Use the built-in demonstration, not a DevTools console.** The application now
carries the whole assisted journey itself: **Watch an assistant fill this in**,
in the Assisted access rail. It opens the ordinary disclosure, waits for you to
press **Allow assisted access**, and then calls the real tools — through
`document.modelContext.executeTool` when the Chrome flag is on — while a strip
above the form narrates one step at a time with the outcome badge the server
returned and a live counter. It films far better than a split-screen console,
and every shot below assumes it.

**The honesty label must be legible in every shot that shows the strip or the
hand-off panel**: *“Scripted demonstration client. Every call is a real WebMCP
tool call, validated by the server; nothing is simulated.”* Do not crop it out,
do not cover it with a lower third, and do not shrink the browser so far that
it stops being readable at 1080p. If a shot cannot hold it, reframe the shot.

Press **Skip ahead** between steps to keep the pace; that control is on screen,
so nothing is being hidden. Do not cut between steps in a way that implies the
run was faster than it was.

Recommended capture order: record the full chronological session first, then cut
the 0:00–0:12 cold open out of the later part of that same take.

---

## Shot list

### 0:00–0:12 — Cold open: a genuine call, a visible change

**On screen:** the application page, records that disagree, mid-run. The
narration strip reads *“Binding legal name, student ID, institution and
dependency on a guardian from the enrollment and household records — one call,
every answer citing the line it came from”*, the badge flips to **accepted**,
and four rows fill in at once, each with the record line it cites beneath it. A
new entry lands in the page’s own **Assisted activity** panel. The strip’s
honesty label and its counter are both in frame. Persistent on-screen label,
top-left: **“Excerpt from 1:35 of this same recording.”**

> "That was a real WebMCP tool call, from the browser's own API, into a
> scholarship portal that just changed in front of you. Nobody typed into that
> form. Now here is the whole session, from the start."

### 0:12–0:30 — Start the records that disagree

**On screen:** the landing page. Header reads “Horizon Education Aid —
Need-Based Scholarship / Fictional demo · Synthetic data only”, headline **“The
agent cites. You decide.”** Click **Start with records that disagree**. The application
page loads; point the cursor at the status line, which ends **“WebMCP: six
CiteApply tools registered.”**

> "CiteApply is a fictional aid portal running entirely on synthetic records. It
> registers six WebMCP tools when the application page loads. Everything you'll
> see the agent do goes through those six tools — and nothing else."

### 0:30–0:48 — Discovery, and a protected read before consent

**On screen:** DevTools console, one short cut — this is the only console shot
in the film, and it is here because discovery *before* consent has no UI. `getTools()`
resolves to the six names. Then a
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

**On screen:** click **Watch an assistant fill this in** and, on the disclosure
that opens, **Allow assisted access** — show that the ledger is still empty at
the moment of the click, so the button plainly could not start itself. The strip
appears and narrates steps 1–4: reading the state, reading the rules, reading
the index of every line the three records hold, and then one
`apply_evidence_backed_answers` call binding four answers. The form updates as
each result returns, and the **Assisted activity** panel logs every call with
its badge. *(This is the region the cold open was cut from.)*

> "It reads the rules, then the evidence index — and there are already two income
> claims that don't agree. It applies the bindings it's allowed to apply in a
> single atomic call. All of them, or none. And the form you're looking at is the
> thing that changed."

### 1:35–1:52 — The requirements change underneath the agent

**On screen:** the **Guardian name** and **Household size** rows. They are on
the page from the first load, labelled **“Not required”**; the moment
`dependency` is bound they flip to **“Not linked yet”** and start counting
toward readiness, and the readiness line moves with them. Frame both rows
*before* the binding lands, so the label change is the beat. Then re-run
`get_form_requirements` in active mode — step 5 of the run — and the strip says
so in words: *“6 required answers became 8: guardian name and household size are
now asked for.”* Both rows highlight as it says it.

> "Answering one question changed which questions apply. Guardian name and
> household size just became required — watch the labels flip. This isn't a
> static schema the agent memorised — it has to read the requirements again,
> because the site's rules are live."

### 1:52–2:12 — The refusal this product exists for

**On screen:** step 7. The strip reads *“Asking for the annual household
income”*, the badge turns ochre and reads **conflict requires human**, and the
sentence completes: *“Refused: the two records disagree about this figure, and
nothing was written. Only you can settle it.”* The counter ticks its first
refusal. The server’s own payload, for the lower third or an inset:
`{"ok":false,"error":{"code":"conflict_requires_human","message":"Income sources disagree. Resolve this in CiteApply.","safeActions":["resolve_in_visible_application"]}}`.
Cut to the income row, still reading **“Two accepted sources disagree. You
decide.”**, and to the **conflict requires human** badge that just appeared in
the Assisted activity panel. Then `get_validation_issues` listing the conflict
and the undeclared email as blockers. Then step 9 —
`prepare_submission_review` — refused **not ready for review**, and the run
stops on **The rest is yours** and **Feel the difference**: what the client did,
what you did, and the decisions that were never available to it. Hold the
hand-off panel long enough to read the honesty label on it.

> "Here's the moment. The agent asks to fill in income. Two accepted sources
> disagree — five hundred and forty thousand on one, four hundred and eighty
> thousand on the other. The website answers `conflict_requires_human` and writes
> nothing. It also refuses to declare my email address for me. The agent can read
> exactly why it's blocked. It just can't clear the blockers itself."

### 2:12–2:30 — The human decides

**On screen:** the income row, showing both records side by side — **Synthetic
Household Statement** quoting “INR 480,000” and **Synthetic Income Statement**
quoting “INR 540,000”, each with what it reads as in rupees. Show that both
**Use the …** buttons are **disabled** and the hint reads “Choose a reason to
enable the two buttons below” — the site will not supply the reason. Pick a
reason from **Why you chose this source**; the buttons enable. Click **Use the
Synthetic Income Statement**. Then, in the email row, click **I declare this is
my address** — and *only* that. The agent already proposed the address with
`propose_email`, so **Save email** is unnecessary, and re-saving would withdraw
a declaration already made.

> "So I decide — and I get to read both records before I do. Here is what each
> one actually says. Notice the buttons are dead until I say why: the site will
> not write a reason on my behalf. I pick the source I'm willing to stand
> behind, I say why, and I declare my own contact address. Those two acts are
> mine — there is no tool that can do either one."

### 2:30–2:42 — Frozen review, human-only submit

**On screen:** the scripted run already tried `prepare_submission_review` and
was refused; now that the decisions are made, click **Prepare review** by hand.
If you want the tool path on camera instead, call it from the console and show
its result first — it returns only
`{"readiness":"ready"}` and an opaque `reviewRef`: no contents, no hash, nothing
the agent could reconstruct the review from. *Then* cut to the page, where the
frozen review has appeared: each answer beside the exact source excerpt, both
conflicting income excerpts visible, the conflict warning, the content hash, and
the copy “Assisted access is closed while you review it.” (Confirm a follow-up
tool call now returns `consent_required`.) Click **Submit this application**.

> Do not narrate the tool path over a shot of a button being clicked. If you
> click **Prepare review**, say so: “I can ask the site to freeze the
> application — or the agent can, and it gets back nothing but ‘ready’.”

> "The agent can ask the site to freeze the application — but the review only
> appears here, in the page, and assisted access closes when it does. Every
> answer sits beside the exact text it came from, including both figures that
> disagreed. Submitting is mine too."

### 2:42–2:50 — Receipt, and an honest close

**On screen:** the **Submitted** receipt: receipt id, review short id, the same
content hash, the conflict warning, every accepted answer beside its source
excerpt, and the line saying which record you chose and why — the reason being
the one *you* selected two shots earlier. Hover the **Download JSON** and
**Print** buttons. If the shot cuts to the browser's print preview, note that
those two buttons and **Start a new synthetic demo** are correctly absent from
it: the printed page is the record without the interface.

> "Same hash, same warning, and the record I chose — with the reason I gave for
> choosing it — still named on a receipt I could defend — on screen, as a file, or on paper. Synthetic records, a
> fictional program, and WebMCP is still a draft standard. But the contract is
> real — and the website is the one enforcing it."

---

## Word-for-word narration, continuous

> That was a real WebMCP tool call, from the browser's own API, into a
> scholarship portal that just changed in front of you. Nobody typed into that
> form. Now here is the whole session, from the start.
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
> household size just became required — watch the labels flip. This isn't a
> static schema the agent memorised — it has to read the requirements again,
> because the site's rules are live.
>
> Here's the moment. The agent asks to fill in income. Two accepted sources
> disagree — five hundred and forty thousand on one, four hundred and eighty
> thousand on the other. The website answers conflict-requires-human and writes
> nothing. It also refuses to declare my email address for me. The agent can read
> exactly why it's blocked. It just can't clear the blockers itself.
>
> So I decide — and I get to read both records before I do. Here is what each
> one actually says. Notice the buttons are dead until I say why: the site will
> not write a reason on my behalf. I pick the source I'm willing to stand
> behind, I say why, and I declare my own contact address. Those two acts are
> mine — there is no tool that can do either one.
>
> The agent can ask the site to freeze the application — but the review only
> appears here, in the page, and assisted access closes when it does. Every
> answer sits beside the exact text it came from, including both figures that
> disagreed. Submitting is mine too.
>
> Same hash, same warning, and the record I chose — with the reason I gave for
> choosing it — still named on a receipt I could defend — on screen, as a file, or on paper. Synthetic records, a
> fictional program, and WebMCP is still a draft standard. But the contract is
> real — and the website is the one enforcing it.

## On-screen labels to prepare

- `Excerpt from 1:35 of this same recording` — 0:00–0:12, persistent.
- `waiting compressed` — anywhere a pause is cut.
- `Synthetic data only · fictional program` — a discreet corner label throughout.
