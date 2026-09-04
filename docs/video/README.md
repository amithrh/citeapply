# The CiteApply demo video

`citeapply-demo.mp4` — **2:55.5**, 1920×1080, H.264 / AAC. The shot list and
narration behind the recorded session are `docs/VIDEO-SCRIPT.md`; the recording
rules it obeys are `docs/hackathon-build/scope.md` → *Demo Path*, with the one
deliberate departure noted under **Opening** below.

## Opening (0:00–0:32)

The film now opens on a spoken title card: **CiteApply**, *The agent cites. You
decide.*, **Team: Amit Mishra (solo) · The WebMCP Challenge**, and the problem
statement — who, what and why before any footage.

**The cold-open excerpt was cut to make room for it.** `scope.md` asks for a
labelled same-session excerpt showing a genuine tool result by 0:10; that beat
and its narration ("That was a real WebMCP tool call…") were dropped so the
introduction could lead and the film could still finish under 3:00. The
excerpt's material is not lost — it is the same `apply_evidence_backed_answers`
mutation, seen in its true chronological place at 1:00. The narration paragraph
about the six tools and redacted reads ("CiteApply is a fictional aid portal…"
is kept; "The agent can see the tools before I've allowed anything…" and the
tool-name card were dropped) is now covered by the opening instead.

## The session

The recorded session is unchanged by the re-cut.

**Recorded 2026-09-03, 22:26–22:28 IST** (the raw take begins at
`2026-09-03T16:56:36Z`; the exact instant and every event timestamp are in
`raw/marks.json`). It is **one continuous session**, 125.8 seconds long, of the
**Conflict record set** — the records that disagree.

- Browser: **Google Chrome 152**, launched with `--enable-features=WebMCPTesting`,
  headed, driven by Playwright at `slowMo: 260ms` so a viewer can follow.
- Target: the local production build at `http://localhost:3100` — the same
  styled standalone build a deployment serves.
- Viewport 1440×900, recorded with Playwright `recordVideo`.
- The recording script is `record-session.mjs`, kept beside this file. Every
  click in the film is a real click; every tool call is the application's own
  scripted demonstration client going through `document.modelContext`.

The run really did reach the browser's tool host: `document.modelContext.getTools()`
returned the six registered CiteApply tools before any consent was given
(`raw/discovery.json`). The nine calls and the outcome the server returned for
each are in `raw/run-outcomes.json`:

| # | tool | outcome |
|---|------|---------|
| 1 | `get_application_state` | accepted |
| 2 | `get_form_requirements` | accepted |
| 3 | `get_evidence_index` | accepted |
| 4 | `apply_evidence_backed_answers` | accepted |
| 5 | `get_form_requirements` | accepted |
| 6 | `apply_evidence_backed_answers` | accepted |
| 7 | `apply_evidence_backed_answers` | **conflict requires human** |
| 8 | `apply_evidence_backed_answers` | accepted |
| 9 | `prepare_submission_review` | **not ready for review** |

Step 7 is the live refusal the film exists for. Nothing is precomputed and there
is no invocation animation: the badge, the counter, the Assisted activity ledger
and the form are all the running page.

`raw/receipt.json` is the JSON the **Download JSON** click on camera actually
produced.

## What was sped up or slowed, and where it says so

Every deviation from real time carries an on-screen label for its whole
duration.

| Film time | Session time | Rate | On-screen label |
|-----------|--------------|------|-----------------|
| 1:00–1:15 | 0:24.7–0:51.5 | 1.87× faster | `sped up 1.9× · waiting compressed` |
| 1:15–1:30 | 0:51.5–0:59.4 | 0.52× slower | `slowed 0.52× · nothing cut` |
| 0:32–0:46 | 0:00–0:10.9 | 0.76× slower | — (slower than real time; nothing is hidden) |
| 0:46–1:00 | 0:12.0–0:24.6 | 0.91× slower | — |
| 1:30–1:51 | 0:59.4–1:19.5 | 0.97× slower | — |
| 1:51–2:11 | 1:19.5–1:35.7 | 0.82× slower | — |
| 2:11–2:26 | 1:35.7–1:50.2 | 0.92× slower | — |
| 2:26–2:44 | 1:50.2–2:05.7 | 0.85× slower | — |

Every segment was re-timed when the narration changed voice, so each shot still
runs exactly as long as the sentence spoken over it.

One stretch of the session is not in the film
at all: **0:10.9–0:12.0**, a one-second gap between the shot that ends on the
loaded application page and the shot that opens on the consent disclosure.
Nothing happens in it. A discreet `Synthetic data only · fictional program`
label sits in the bottom band throughout.

## How it was composed

A HyperFrames project under `composition/` (`index.html`, assets in
`composition/assets/`), rendered with `hyperframes@0.8.27`:

```bash
cd docs/video/composition
npx hyperframes@0.8.27 check
npx hyperframes@0.8.27 render --output ../citeapply-demo.mp4
```

The session plays letterboxed at 1584×990 with an 84px band beneath it, so the
lower-third captions **never cover the page** — in particular never the honesty
label *"Scripted demonstration client. Every call is a real WebMCP tool call,
validated by the server; nothing is simulated."* Brand colours are the site's
teal `#0f6b6a` / `#084140` and ochre `#8c4b05`; type is Newsreader / Public Sans
/ IBM Plex Mono with local fallbacks.

## Narration

Real synthesised speech — **Kokoro-82M** (`kokoro-onnx`), voice `bf_emma`, speed
It is driven through the HyperFrames TTS model files. It is not a human read and
not a placeholder. One WAV per paragraph in `audio/` (`n00.wav`–`n10.wav`), with
the exact text spoken in the matching `.txt`. Total speech in the current cut
2:23. The speed is 1.16 rather than the 1.04 used for the earlier female read
because `bm_george` speaks noticeably slower; at 1.16 he lands at a normal
speaking pace and the film stays under 3:00. `n01.wav` (the cold open) and `n03.wav` (the redacted-read beat) were
generated and are kept in `audio/`, but are **not** in the film.

`n00.wav` is the opening, written for this cut:

> Hi, I'm Amit, and this is CiteApply, my entry for the WebMCP Challenge. The
> problem: filling in a document-backed form like a scholarship application is
> hard, not because of typing, but because of judgment. Which record proves each
> answer? What if two records disagree? Today an AI assistant can guess values
> into a form, and the website has no idea where they came from. CiteApply is a
> scholarship portal that publishes six WebMCP tools of its own, so an agent can
> cite answers from the applicant's records, and the site, not the model, decides
> what is allowed. Let me show you.

The rest is the script's narration.

The narration is the word-for-word text from `docs/VIDEO-SCRIPT.md`, with only
the changes a speech synthesiser needs (code identifiers spoken as words,
semicolons and em-dashes resolved into sentences):

> That was a real WebMCP tool call, from the browser's own API, into a
> scholarship portal that just changed in front of you. Nobody typed into that
> form. Now here is the whole session, from the start.
>
> CiteApply is a fictional aid portal running entirely on synthetic records. It
> registers six WebMCP tools when the application page loads. Everything you'll
> see the agent do goes through those six tools, and nothing else.
>
> The agent can see the tools before I've allowed anything. Reading in redacted
> mode tells it there's an application here and nothing else. The moment it asks
> for protected data, the server refuses. Consent required. The refusal is the
> server's, not the model's.
>
> Consent is a real disclosure. It lists what the tools may receive, what they
> will never receive, and what they can't do. And the capability it creates is
> never handed to the agent. The page holds it and injects it on every call.
>
> It reads the rules, then the evidence index, and there are already two income
> claims that don't agree. It applies the bindings it's allowed to apply in a
> single atomic call. All of them, or none. And the form you're looking at is
> the thing that changed.
>
> Answering one question changed which questions apply. Guardian name and
> household size just became required. Watch the labels flip. This isn't a
> static schema the agent memorised. It has to read the requirements again,
> because the site's rules are live.
>
> Here's the moment. The agent asks to fill in income. Two accepted sources
> disagree. Five hundred and forty thousand on one, four hundred and eighty
> thousand on the other. The website answers conflict requires human, and writes
> nothing. It also refuses to declare my email address for me. The agent can
> read exactly why it's blocked. It just can't clear the blockers itself.
>
> So I decide, and I get to read both records before I do. Here is what each one
> actually says. Notice the buttons are dead until I say why: the site will not
> write a reason on my behalf. I pick the source I'm willing to stand behind, I
> say why, and I declare my own contact address. Those two acts are mine. There
> is no tool that can do either one.
>
> The agent can ask the site to freeze the application, but the review only
> appears here, in the page, and assisted access closes when it does. Every
> answer sits beside the exact text it came from, including both figures that
> disagreed. Submitting is mine too.
>
> Same hash, same warning, and the record I chose, with the reason I gave for
> choosing it, still named on a receipt I could defend. On screen, as a file, or
> on paper. Synthetic records, a fictional program, and WebMCP is still a draft
> standard. But the contract is real, and the website is the one enforcing it.

## Where the film departs from the shot list

- **The DevTools console shot (script 0:30–0:48) is not in the film.** The
  attempt to make those two pre-consent calls from the recording script failed —
  Chrome's `modelContext.executeTool` wants the registered tool object, not its
  name — so no genuine `redacted` / `consent_required` payload was captured in
  this session. Rather than show a payload from a different session or a typed
  reconstruction, that beat is a full-frame card listing the **six tool names
  this session's `getTools()` really returned**, labelled as captured from the
  browser's own tool host during this recording. The narration over it is
  unchanged.
- The film runs the "Let an assistant help" choice and the consent disclosure
  before the coach strip, in the order the application itself presents them.
- `landing-hero-10s.mp4` is the requested clean 10-second landing clip, cut from
  the head of the same take.

## Files

- `citeapply-demo.mp4` — the deliverable.
- `landing-hero-10s.mp4` — 10s clean landing-hero clip.
- `record-session.mjs` — the recording script.
- `composition/` — the HyperFrames project.
- `audio/` — narration WAVs and their exact texts.
- `raw/marks.json`, `raw/discovery.json`, `raw/run-outcomes.json`,
  `raw/receipt.json` — the session's own evidence. The raw `.webm` take stays on
  disk but is git-ignored (9.5 MB VP8); `composition/assets/session.mp4` is the
  transcoded copy the film is cut from.

## Links on the end card

The end card also names the team: **CiteApply — Team: Amit Mishra**.

- `https://citeapply.vercel.app` — **provisional.** `README.md` still carries the
  `LIVE_URL` placeholder at the time of this render, so this is the expected
  deployment URL rather than one that has been confirmed live. If the deployment
  lands on a different host, re-render after fixing `#end-url-1` in
  `composition/index.html`.
- `github.com/amithrh/citeapply`
