# The CiteApply demo video

`citeapply-demo.mp4` — **2:46.0**, 1920×1080, H.264 / AAC. The shot list and
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
| 0:59–1:05 | 0:24.7–0:38.7 | 2.52× faster | `sped up 2.5× · waiting compressed` |
| 1:18–1:28 | 0:51.5–0:59.4 | 0.79× slower | `slowed 0.79× · nothing cut` |
| 1:50–2:05 | 1:19.5–1:35.7 | 1.08× faster | `sped up 1.1×` |
| 0:36–0:47 | 0:00–0:10.9 | 1.01× | — |
| 0:47–0:59 | 0:12.0–0:24.6 | 1.00× | — |
| 1:05–1:18 | 0:38.7–0:51.5 | 1.00× | — |
| 1:28–1:50 | 0:59.4–1:19.5 | 0.91× slower | — |
| 2:05–2:19 | 1:35.7–1:50.2 | 1.04× | — |
| 2:19–2:35 | 1:50.2–2:05.7 | 0.97× slower | — |

Every segment is timed to the sentences spoken over it, so a beat's footage
starts and ends with its narration. Only the three labelled shots depart from
real time by more than 10%.

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

**Real TTS, not a placeholder.** Kokoro-82M (`kokoro-onnx`), voice **`am_adam`**,
**speed 1.0** — no time-compression of the voice at all.

### Choosing the voice

Four male Kokoro voices read the same intro paragraph at speed 1.0; the samples
are kept in `audio/samples/`. Measured with an autocorrelation pitch track over
voiced frames:

| voice | median F0 | pitch variance | length |
|-------|-----------|----------------|--------|
| **am_adam** | **121.2 Hz** | **4.32 semitones** | 12.78 s |
| bm_lewis | 99.8 Hz | 4.59 semitones | 14.31 s |
| am_michael | 118.8 Hz | 3.78 semitones | 15.27 s |
| bm_george | 141.2 Hz | 3.47 semitones | 14.25 s |

Pitch variance is the measurable stand-in for "character" — a flat read has low
variance. `bm_lewis` scores highest but sits at 99.8 Hz, dark enough to muddy on
laptop speakers; `am_adam` is within 0.3 semitones of it with a 21 Hz higher
median, and reads the same text fastest at speed 1.0, which means it is not
dragging. **`am_adam` was chosen**; `bm_lewis` is the runner-up.

### Pacing

The script was cut by roughly a third — **355 words**, down from 520 — so it
fits under 3:00 at natural pace instead of being sped up. Anything that merely
restated what is on screen was dropped.

The narration is **not one continuous read**. Each sentence is synthesised
separately, trimmed of its leading and trailing near-silence, and reassembled
with real gaps:

- **0.75 s** between sentences inside a beat;
- **1.7–2.4 s** of digital silence between beats;
- **1.9 s** of silence immediately before the refusal beat, so it lands.

The gaps are true silence (measured at the noise floor in the encoded MP4, vs
−16.9 dBFS RMS for speech). One WAV per beat in `audio/` (`b0.wav`–`b8.wav`).

### The script, as spoken

**Opening (0:00–0:34)**

> Hi, I'm Amit. This is CiteApply, my entry for the WebMCP Challenge.
> Filling in a document-backed form is hard because of judgment, not typing.
> Which record proves each answer? What if two records disagree?
> Today an assistant guesses values into a form, and the website has no idea
> where they came from.
> CiteApply is a scholarship portal that publishes six WebMCP tools of its own.
> Every answer cites the record line it came from, and the site, not the model,
> decides what is allowed.
> Let me show you.

**Start (0:36)**

> These are synthetic records that disagree with each other.
> The page registers six tools when it loads, and everything the agent does goes
> through those six.

**Consent (0:47)**

> Consent is a real disclosure: what the tools may receive, what they never
> receive, what they cannot do.
> And the capability it creates is never handed to the agent. The page holds it.

**The atomic batch (1:06)**

> It reads the rules, then the evidence index, then binds four answers in a
> single atomic call.
> All of them, or none.

**The requirements flip (1:18)**

> Answering one question changed which questions apply.
> Guardian name and household size just became required, so the agent has to
> read the requirements again.

**The refusal (1:30)**

> Here's the moment.
> The agent asks to fill in income. Two accepted records disagree: five hundred
> and forty thousand, and four hundred and eighty thousand.
> The website answers conflict requires human, and writes nothing.
> The agent can read exactly why it is blocked. It cannot clear the block itself.

**The human decides (1:51)**

> So I decide, and I read both records first.
> The buttons stay dead until I say why: the site will not write a reason on my
> behalf.
> I choose a source, and I declare my own address. No tool can do either.

**The frozen review (2:06)**

> The agent can ask the site to freeze the application, but the review appears
> only here, and assisted access closes when it does.
> Every answer sits beside the exact text it came from.

**The receipt (2:19)**

> Same hash, same warning, the record I chose and the reason I gave.
> Synthetic records, a fictional program, and WebMCP is still a draft standard.
> But the contract is real, and the website is the one enforcing it.

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
