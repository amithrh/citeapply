"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import type { PacketCode } from "../contracts/common.ts";
import { CopyButton } from "../ui/site/copy-button.tsx";
import {
  AtomicMark,
  CommitmentFigure,
  EvidenceFigure,
  NoSubmitMark,
  RequirementsFigure,
  SameHashMark,
  ToolsMark,
} from "../ui/site/figures.tsx";
import { HeroScene } from "../ui/site/hero-scene.tsx";
import { LandingMotion } from "../ui/site/motion.tsx";
import { WATCH_REQUEST_KEY } from "../ui/demo/runner.ts";
import { UploadRecords } from "../ui/site/upload-records.tsx";

type FailureBody = Readonly<{
  ok?: boolean;
  error?: { code?: string; message?: string };
}>;

/**
 * Shows the server's own words when it managed to say something, so an outage
 * reads as a temporary condition with a retry rather than a dead end.
 */
function refusalMessage(body: FailureBody, fallback: string): string {
  const message = body.error?.message;
  if (typeof message !== "string" || message.length === 0) return fallback;
  return body.error?.code === "temporarily_unavailable"
    ? `${message} This is a temporary problem. Try again in a moment.`
    : message;
}

async function startSyntheticDemo(packet: PacketCode): Promise<string | null> {
  const issued = (await (
    await fetch("/api/demo", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    })
  ).json()) as { ok?: boolean; data?: { startToken: unknown } } & FailureBody;
  if (issued.ok !== true || issued.data === undefined) {
    return refusalMessage(
      issued,
      "CiteApply could not prepare a synthetic start.",
    );
  }

  const started = (await (
    await fetch("/api/demo", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "start",
        packet,
        startToken: issued.data.startToken,
        requestId: crypto.randomUUID(),
      }),
    })
  ).json()) as { ok?: boolean; data?: { destination: string } } & FailureBody;

  if (started.ok !== true || started.data === undefined) {
    return refusalMessage(
      started,
      "CiteApply could not start this synthetic demo.",
    );
  }
  window.location.assign(started.data.destination);
  return null;
}

/**
 * The two sample record sets. Each is three one-page PDFs — the same documents
 * a real applicant would have to hand — and every one of them is served
 * straight from the committed, hash-allowlisted fixture it comes from.
 */
const RECORD_SETS = [
  {
    code: "conflict",
    title: "Records that disagree",
    lead: "The income statement and the household statement give different household incomes. Nobody but you can settle which one to stand behind.",
    tone: "decide",
    button: "Start with records that disagree",
  },
  {
    code: "supported",
    title: "Records that agree",
    lead: "All three records line up, so every answer can be read straight out of them and the application runs end to end.",
    tone: "seal",
    button: "Start with records that agree",
  },
] as const satisfies readonly {
  code: PacketCode;
  title: string;
  lead: string;
  tone: string;
  button: string;
}[];

/** The three documents in every set, in the order they are read. */
const RECORD_DOCUMENTS = [
  { file: "enrollment.pdf", label: "Enrollment record" },
  { file: "household.pdf", label: "Household statement" },
  { file: "income.pdf", label: "Income statement" },
] as const;

/**
 * Four facts about this build, each one checkable in the repository rather
 * than asserted here: the tool count the surface manifest freezes, the number
 * of paths by which an agent can submit, the number of calls a whole batch of
 * bound answers takes, and the fact that the manual and assisted walks end on
 * the same frozen content hash. No adoption figure, no benchmark, no logo.
 */
const PROOF = [
  {
    figure: "6",
    label: "WebMCP tools registered",
    detail:
      "Declared on document.modelContext when the application page loads. Four read; two can move the draft.",
    mark: <ToolsMark />,
    tone: "seal",
  },
  {
    figure: "0",
    label: "ways an agent can submit",
    detail:
      "No tool submits, confirms, resolves a conflict or loads a receipt. The server refuses those calls; it does not merely omit them.",
    mark: <NoSubmitMark />,
    tone: "decide",
  },
  {
    figure: "1",
    label: "call to bind a whole batch",
    detail:
      "apply_evidence_backed_answers is atomic and version-checked. Every entry validates, or nothing changes.",
    mark: <AtomicMark />,
    tone: "seal",
  },
  {
    figure: "=",
    label: "same review, either way",
    detail:
      "By hand or assisted, the walk ends on the same frozen review and the same content hash on the receipt.",
    mark: <SameHashMark />,
    tone: "ink",
  },
] as const;

/**
 * The six tools the page registers on `document.modelContext`, with the two
 * hints that matter to anyone deciding how far to trust one: whether it can
 * change the saved application, and whether what it returns came out of an
 * untrusted synthetic PDF. Both are read from the descriptors the page
 * actually registers; this table restates them for a reader.
 */
const TOOLS = [
  {
    name: "get_application_state",
    writes: false,
    untrusted: true,
    summary:
      "Reads the saved application. The redacted mode is safe before access is allowed; the protected mode is not offered until you allow it.",
  },
  {
    name: "get_form_requirements",
    writes: false,
    untrusted: false,
    summary:
      "Reads which questions apply and the rule behind each one. Rules, never a field-to-answer map.",
  },
  {
    name: "get_evidence_index",
    writes: false,
    untrusted: true,
    summary:
      "Lists the claims parsed from this set's records as opaque handles. No raw PDF, no storage path, no full excerpt.",
  },
  {
    name: "get_validation_issues",
    writes: false,
    untrusted: false,
    summary:
      "Reads what is currently blocking review, in order. It changes nothing.",
  },
  {
    name: "apply_evidence_backed_answers",
    writes: true,
    untrusted: true,
    summary:
      "Links handles to answers in one atomic, version-checked call. Every entry validates or nothing changes.",
  },
  {
    name: "prepare_submission_review",
    writes: true,
    untrusted: false,
    summary:
      "Freezes a ready draft into a review for you to inspect, then closes assisted access. It returns readiness, not the review.",
  },
] as const;

const READ_TOOLS = TOOLS.filter((tool) => !tool.writes);
const WRITE_TOOLS = TOOLS.filter((tool) => tool.writes);

/** The two facing walks, beat for beat, with the beats only you can take. */
const MANUAL_BEATS = [
  { text: "Open each of the three records and read them.", human: false },
  {
    text: "Find the sentence that answers a question, then link that record to the answer.",
    human: false,
  },
  {
    text: "Notice when answering one question makes two more apply, and go back for those.",
    human: false,
  },
  { text: "Type and save your email, then declare it is yours.", human: true },
  {
    text: "Read both income records, choose a reason, and stand behind one of them.",
    human: true,
  },
  { text: "Prepare the review, read it, and submit.", human: true },
] as const;

const ASSISTED_BEATS = [
  {
    text: "It reads the active requirements and the evidence index through the page's own tools.",
    human: false,
  },
  {
    text: "It binds every supported answer in one atomic call — all of them or none, checked against the version it read.",
    human: false,
  },
  {
    text: "Two questions become required; it re-reads and binds those too.",
    human: false,
  },
  {
    text: "It can propose the synthetic email, but the field still reads “not yet declared” until you say so.",
    human: true,
  },
  {
    text: "It asks for the income answer and is refused. Nothing is written.",
    human: true,
  },
  {
    text: "It prepares the review, then loses access. You read it and you submit.",
    human: true,
  },
] as const;

/**
 * The three things to say to an assistant, in order. These strings are the
 * product's own instructions and are copied to the clipboard verbatim; they
 * are not reworded for the page.
 */
const PROMPTS = [
  "Read this application's requirements and evidence index, then fill in every answer you can support from the records.",
  "More questions just appeared. Re-read the active requirements and bind those too.",
  "Now prepare the submission review.",
] as const;

const CHROME_FLAG = "chrome://flags/#enable-webmcp-testing";
const CHROME_SWITCH = "--enable-features=WebMCPTesting";

/** The refusal, exactly as the server sends it. */
const REFUSAL_PAYLOAD = `{
  "ok": false,
  "error": {
    "code": "conflict_requires_human",
    "message": "Income sources disagree. Resolve this in CiteApply.",
    "safeActions": ["resolve_in_visible_application"]
  }
}`;

const FAQ = [
  {
    question: "Is this a real scholarship?",
    answer:
      "No. Horizon Education Aid does not exist, the award and the dates on this page are invented, and nothing you do here is sent to any program. The applicant, the three records and every figure in them are synthetic.",
  },
  {
    question: "What can the assistant never do?",
    answer:
      "Choose which records to start from, declare your email address, resolve a disagreement between two records, return from a review, confirm or submit the application, or load, print or export a receipt. The server refuses those calls; it is not a matter of the tool descriptions asking nicely.",
  },
  {
    question: "What if I bring no assistant at all?",
    answer:
      "Then you have the whole product. Every control is on the page with or without assisted access, and nothing is hidden while it is off. In a browser without WebMCP the application page says so plainly and stays completely usable.",
  },
  {
    question: "What is stored, and for how long?",
    answer:
      "Your answers, which record each one cites, and the review and receipt you produce — all against a session cookie that lasts 60 minutes. Because the records are synthetic, none of it is anyone's real data, and there is nothing here worth keeping.",
  },
] as const;

/** A titled band with its own reading column. */
function Band({
  id,
  className,
  labelledBy,
  children,
}: Readonly<{
  id?: string;
  className: string;
  labelledBy: string;
  children: ReactNode;
}>) {
  return (
    <section
      id={id}
      className={className}
      aria-labelledby={labelledBy}
      data-reveal=""
    >
      <div className="wrap">{children}</div>
    </section>
  );
}

export default function LandingPage() {
  const [busy, setBusy] = useState<PacketCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPacket, setLastPacket] = useState<PacketCode | null>(null);

  /**
   * Starts a record set, optionally asking the application page to run its
   * scripted demonstration on arrival. The request is a browser preference and
   * carries no authority whatever: all it can do is open the same disclosure
   * the rail opens, and a person still has to press Allow assisted access
   * before a single tool call is made.
   */
  const start = (packet: PacketCode, watch = false) => {
    if (busy !== null) return;
    try {
      if (watch) window.sessionStorage.setItem(WATCH_REQUEST_KEY, "yes");
      else window.sessionStorage.removeItem(WATCH_REQUEST_KEY);
    } catch {
      // A browser that refuses storage simply opens the application instead.
    }
    setBusy(packet);
    setLastPacket(packet);
    setError(null);
    void startSyntheticDemo(packet)
      .then((message) => {
        if (message !== null) {
          setError(message);
          setBusy(null);
        }
      })
      .catch(() => {
        setError("CiteApply could not start this synthetic demo.");
        setBusy(null);
      });
  };

  return (
    <main className="landing">
      <LandingMotion />

      {/* ---- Hero ------------------------------------------------------ */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-ground" aria-hidden="true">
          <span className="glow glow-seal" />
          <span className="glow glow-decide" />
        </div>
        <div className="wrap hero-grid">
          <div className="hero-text">
            <p className="hero-cycle">
              <span className="pip" aria-hidden="true" />
              Applications for the 2026–27 cycle are open until 30 June 2026
            </p>
            <h1 id="hero-heading">
              The agent cites.
              <br />
              You decide.
            </h1>
            <p className="hero-lead">
              CiteApply is a scholarship application an assistant can help you
              fill in — but only from three source records, and only up to the
              point where judgment starts. The page registers six WebMCP tools
              on itself, so an agent in your browser works against the
              portal&apos;s own rules, version checks and refusals instead of
              guessing at the form.
            </p>

            <div
              className="hero-cta"
              id="apply"
              role="group"
              aria-labelledby="apply-heading"
            >
              <h2 id="apply-heading">Start with a set of records</h2>
              <p className="cta-lead">
                Every application here begins from three documents — an
                enrollment record, a household statement and an income
                statement. Take one of the two sample sets, or upload a set you
                downloaded from this page.
              </p>
              <div className="cta-row">
                <Link className="cta cta-decide" href="#records">
                  Try the sample records
                </Link>
                <button
                  type="button"
                  className="cta cta-seal"
                  aria-busy={busy === "conflict" || undefined}
                  onClick={() => start("conflict", true)}
                >
                  {busy === "conflict"
                    ? "Starting…"
                    : "Watch an assistant fill it in"}
                </button>
              </div>
              <p className="cta-note">
                Read the records before you start: each one opens as the PDF the
                server parses. The interesting set is the one that disagrees —
                two accepted records give different incomes, the portal refuses
                to choose, and so does the agent. Watching it happen takes about
                half a minute: you allow access, and a scripted client calls the
                real tools while the form fills in front of you.
              </p>
              <ul className="cta-secondary">
                <li>
                  <Link href="#upload">Upload your records</Link>
                </li>
                <li>
                  <Link href="#by-hand">Fill it in by hand</Link>
                </li>
                <li>
                  <Link href="/agents">See how agents help</Link>
                </li>
              </ul>
            </div>

            <p className="stamp">Fictional demo · Synthetic data only</p>
          </div>

          <div className="hero-art">
            <HeroScene />
          </div>
        </div>
      </section>

      {/* ---- The records ------------------------------------------------ */}
      <Band
        id="records"
        className="section records-band"
        labelledBy="records-heading"
      >
        <h2 id="records-heading">The records you will be working from</h2>
        <p className="section-lead">
          These are the actual files the server reads. Open any of them, or
          download a whole set and upload it back — the application that opens
          is built from the sentences inside them, never from anything typed in
          here.
        </p>

        {error === null ? null : (
          <div className="records-error" role="alert">
            <p>{error}</p>
            {lastPacket === null ? null : (
              <button type="button" onClick={() => start(lastPacket)}>
                Try again
              </button>
            )}
          </div>
        )}

        <div className="record-sets">
          {RECORD_SETS.map((set) => (
            <article
              key={set.code}
              className="record-set"
              data-tone={set.tone}
              aria-labelledby={`set-${set.code}`}
            >
              <h3 id={`set-${set.code}`}>{set.title}</h3>
              <p className="record-set-lead">{set.lead}</p>
              <ul className="record-list">
                {RECORD_DOCUMENTS.map((document) => (
                  <li key={document.file}>
                    <a
                      href={`/api/demo?document=${set.code}/${document.file}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Preview the ${document.label.toLowerCase()} from the ${set.title.toLowerCase()}`}
                    >
                      {document.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="record-download">
                <a
                  href={`/api/demo?records=${set.code}`}
                  aria-label={`Download the ${set.title.toLowerCase()} as a zip`}
                >
                  Download these records (.zip)
                </a>
              </p>
              <button
                type="button"
                className={`cta cta-${set.tone}`}
                aria-busy={busy === set.code || undefined}
                onClick={() => start(set.code)}
              >
                {busy === set.code ? "Starting…" : set.button}
              </button>
            </article>
          ))}

          <article
            id="upload"
            className="record-set record-upload"
            aria-labelledby="upload-heading"
          >
            <h3 id="upload-heading">Upload your records</h3>
            <p className="record-set-lead">
              Download one of the sets above and upload its three PDFs here. The
              server checks each file against the records it committed to and
              opens that application.
            </p>
            <UploadRecords />
            <p className="record-note">
              Nothing real is accepted, and nothing you choose is kept: each
              file is hashed, compared, and dropped. Anything that is not one of
              this demonstration&apos;s own records is refused, by name-free
              message, before an application exists.
            </p>
          </article>
        </div>
      </Band>

      {/* ---- Proof strip ----------------------------------------------- */}
      <section className="proof" aria-labelledby="proof-heading" data-reveal="">
        <div className="wrap">
          <h2 id="proof-heading">What this build actually guarantees</h2>
          <ul className="proof-tiles">
            {PROOF.map((item) => (
              <li key={item.label} data-tone={item.tone}>
                <span className="proof-mark" aria-hidden="true">
                  {item.mark}
                </span>
                <p className="proof-figure">
                  <strong>{item.figure}</strong> {item.label}
                </p>
                <p className="proof-detail">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- The program ----------------------------------------------- */}
      <Band
        id="scholarship"
        className="section facts-band"
        labelledBy="scholarship-heading"
      >
        <h2 id="scholarship-heading">What the scholarship is</h2>
        <p className="section-lead">
          Horizon Education Aid is a need-based award for students already
          enrolled in an undergraduate program. Every figure below is invented
          for this demonstration.
        </p>
        <dl className="facts">
          <div>
            <dt>Award</dt>
            <dd>
              INR 120,000 for the academic year, paid in two instalments and
              renewable once on the same evidence.
            </dd>
          </div>
          <div>
            <dt>Who can apply</dt>
            <dd>
              Full-time undergraduates at a recognised institution whose
              household income falls under the published threshold. Applicants
              under 21 also give a guardian&apos;s name and the household size.
            </dd>
          </div>
          <div>
            <dt>Cycle dates</dt>
            <dd>
              Opens 1 March 2026, closes 30 June 2026, decisions posted by 15
              August 2026.
            </dd>
          </div>
          <div>
            <dt>What you send</dt>
            <dd>
              Three records — an enrollment letter, a household statement and an
              income statement. The office reads the records; it does not ask
              you to retype them.
            </dd>
          </div>
        </dl>
      </Band>

      {/* ---- Features -------------------------------------------------- */}
      <div className="features">
        <Band className="section feature" labelledBy="evidence-heading">
          <div className="feature-grid">
            <div className="feature-text">
              <p className="feature-kicker">Evidence, not guesses</p>
              <h2 id="evidence-heading">Every answer names its source</h2>
              <p>
                An answer here is a link to a record, not a string an assistant
                thought was plausible. The application shows what the answer is,
                which document it came from, and the sentence in that document
                it rests on — and the tools hand out opaque claim handles rather
                than raw PDFs or storage paths.
              </p>
              <p>
                Where a second record says the same thing, the answer is marked
                corroborated. Where nothing supports it, the answer is not
                written at all.
              </p>
            </div>
            <div className="feature-art">
              <EvidenceFigure />
            </div>
          </div>
        </Band>

        <Band
          className="section feature feature-dark"
          labelledBy="refusal-heading"
        >
          <div className="feature-grid">
            <div className="feature-text">
              <p className="feature-kicker">The refusal</p>
              <h2 id="refusal-heading">
                The most important thing this agent does is stop
              </h2>
              <p>
                When two accepted records disagree about income, the write is
                refused. Not deferred, not guessed at with a confidence score —
                refused, with the reason and the one safe thing to do instead.
                The saved application does not move, and the choice stays on the
                page in front of you.
              </p>
              <p>
                This is the server&apos;s own response, sent verbatim to the
                calling agent:
              </p>
            </div>
            <div className="feature-art">
              <div className="payload">
                <p className="payload-head">
                  <span className="payload-dot" aria-hidden="true" />
                  <code>apply_evidence_backed_answers</code>
                  <span className="payload-status">409</span>
                </p>
                <pre>
                  <code>{REFUSAL_PAYLOAD}</code>
                </pre>
              </div>
            </div>
          </div>
        </Band>

        <Band className="section feature" labelledBy="requirements-heading">
          <div className="feature-grid">
            <div className="feature-text">
              <p className="feature-kicker">A form that moves</p>
              <h2 id="requirements-heading">
                Requirements that change underneath the agent
              </h2>
              <p>
                Six questions apply when the application opens. Answer the
                household one and two more become required — the guardian&apos;s
                name and the household size — so the form the agent read a
                moment ago is no longer the form in front of it.
              </p>
              <p>
                That is why <code>get_form_requirements</code> returns rules
                rather than a field-to-answer map, and why every write carries
                the version it was based on. An agent working from a stale
                picture is refused rather than allowed to overwrite.
              </p>
            </div>
            <div className="feature-art">
              <RequirementsFigure />
            </div>
          </div>
        </Band>

        <Band className="section feature" labelledBy="commitment-heading">
          <div className="feature-grid">
            <div className="feature-text">
              <p className="feature-kicker">One human commitment</p>
              <h2 id="commitment-heading">
                You read the frozen review, and only you submit
              </h2>
              <p>
                Preparing a review freezes exactly what you approved and closes
                assisted access in the same movement. From there the assistant
                has nothing left to do: it cannot return from the review, cannot
                confirm, and cannot load, print or export the receipt.
              </p>
              <p>
                Both walks end in the same place — the same frozen review, and
                the same content hash printed on the same receipt.
              </p>
            </div>
            <div className="feature-art">
              <CommitmentFigure />
            </div>
          </div>
        </Band>
      </div>

      {/* ---- Two walks -------------------------------------------------- */}
      <Band
        id="comparison"
        className="section compare-band"
        labelledBy="comparison-heading"
      >
        <h2 id="comparison-heading">With and without an assistant</h2>
        <p className="section-lead">
          The manual path is the whole product; the assisted path is the same
          product with a second pair of hands. Both are real here, and you can
          walk either one. The beats in ochre are the ones that are yours in
          both.
        </p>
        <div className="compare">
          <article className="lane lane-manual">
            <h3>Filling it in yourself</h3>
            <ol>
              {MANUAL_BEATS.map((beat) => (
                <li key={beat.text} data-human={beat.human || undefined}>
                  <span className="beat-text">{beat.text}</span>
                  {beat.human ? <span className="beat-tag">yours</span> : null}
                </li>
              ))}
            </ol>
          </article>
          <article className="lane lane-assisted">
            <h3>Asking an assistant</h3>
            <ol>
              {ASSISTED_BEATS.map((beat, index) => (
                <li key={beat.text} data-human={beat.human || undefined}>
                  <span className="beat-text">
                    {beat.text}
                    {index === 4 ? (
                      <>
                        {" "}
                        <code>conflict_requires_human</code>
                      </>
                    ) : null}
                  </span>
                  {beat.human ? <span className="beat-tag">yours</span> : null}
                </li>
              ))}
            </ol>
          </article>
        </div>
        <p className="converge">
          Both paths reach the same three decisions that are only yours, and the
          same frozen review — the same content hash on the same receipt. The
          assistant removes the reading and the retyping. It does not remove
          you.
        </p>
        <div className="compare-watch">
          <p>
            You do not need an agent to see the difference. Start the set that
            disagrees, allow assisted access, and a scripted client on the page
            calls the same six tools against the same server — every acceptance
            and both refusals land in the ledger while you watch. The
            application then counts what it did against what you did by hand,
            from this session only.
          </p>
          <button
            type="button"
            className="cta cta-seal"
            aria-busy={busy === "conflict" || undefined}
            onClick={() => start("conflict", true)}
          >
            {busy === "conflict"
              ? "Starting…"
              : "Watch an assistant fill it in"}
          </button>
        </div>
      </Band>

      {/* ---- How it works ----------------------------------------------- */}
      <Band
        id="how-it-works"
        className="section how-band"
        labelledBy="how-heading"
      >
        <h2 id="how-heading">How it works</h2>
        <ol className="steps">
          <li>
            <h3>Your records are read for you</h3>
            <p>
              Starting a set parses its three PDFs on the server and turns them
              into a short index of claims. Nothing is typed in, and no record
              is treated as more than a claim until it is cited.
            </p>
          </li>
          <li>
            <h3>Every answer names its source</h3>
            <p>
              An answer is a link to a record, not free text. The application
              shows what each answer is, which document it came from, and the
              sentence in that document it rests on.
            </p>
          </li>
          <li>
            <h3>You settle what the records cannot</h3>
            <p>
              When two accepted records disagree, or when a declaration is yours
              to make, the portal stops and hands you the decision. Then it
              freezes exactly what you approved and submits that.
            </p>
          </li>
        </ol>
        <div id="by-hand" className="by-hand">
          <h3>Or fill it in by hand</h3>
          <p>
            An assistant is optional and off until you turn it on. Once an
            application is open, CiteApply asks you which way you want to work —
            by hand, or with an assistant helping — and every control is on the
            page either way. Nothing is hidden while assisted access is off, and
            the two paths end on the same frozen review.
          </p>
        </div>
      </Band>

      {/* ---- The six tools ---------------------------------------------- */}
      <Band
        id="tools"
        className="section tools-band"
        labelledBy="tools-heading"
      >
        <h2 id="tools-heading">The six tools this page registers</h2>
        <p className="section-lead">
          Every tool is declared on <code>document.modelContext</code> with the
          hints below. Four only read. The two that can change something are
          version-checked and refuse rather than guess.
        </p>

        <h3 className="tool-group">Four that only read</h3>
        <ul className="tools">
          {READ_TOOLS.map((tool) => (
            <li key={tool.name}>
              <p className="tool-name">
                <code>{tool.name}</code>
              </p>
              <p className="tool-hints">
                <span className="hint-read">readOnly</span>
                <span
                  className={tool.untrusted ? "hint-untrusted" : "hint-own"}
                >
                  {tool.untrusted
                    ? "untrusted content"
                    : "the portal's own rules"}
                </span>
              </p>
              <p className="tool-summary">{tool.summary}</p>
            </li>
          ))}
        </ul>

        <h3 className="tool-group tool-group-write">
          Two that can change the draft
        </h3>
        <ul className="tools">
          {WRITE_TOOLS.map((tool) => (
            <li key={tool.name} data-writes="">
              <p className="tool-name">
                <code>{tool.name}</code>
              </p>
              <p className="tool-hints">
                <span className="hint-write">can change the draft</span>
                <span
                  className={tool.untrusted ? "hint-untrusted" : "hint-own"}
                >
                  {tool.untrusted
                    ? "untrusted content"
                    : "the portal's own rules"}
                </span>
              </p>
              <p className="tool-summary">{tool.summary}</p>
            </li>
          ))}
        </ul>
      </Band>

      {/* ---- Try it ------------------------------------------------------ */}
      <Band
        id="quick-start"
        className="section quick-start"
        labelledBy="agent-heading"
      >
        <h2 id="agent-heading">Try it with an agent</h2>
        <p className="section-lead">
          Turn WebMCP on in Chrome, start the records that disagree, allow
          assisted access on the application page, and say these three things in
          order.
        </p>

        <div className="console">
          <div className="console-head">
            <span className="console-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="console-title">Turn WebMCP on</span>
          </div>
          <div className="console-body">
            <div className="console-row">
              <p className="console-label">Chrome flag</p>
              <code className="console-value">{CHROME_FLAG}</code>
              <CopyButton value={CHROME_FLAG} describedAs="the Chrome flag" />
            </div>
            <div className="console-row">
              <p className="console-label">Launch switch</p>
              <code className="console-value">{CHROME_SWITCH}</code>
              <CopyButton
                value={CHROME_SWITCH}
                describedAs="the launch switch"
              />
            </div>
          </div>
        </div>

        <div className="console">
          <div className="console-head">
            <span className="console-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="console-title">Then say this, in order</span>
          </div>
          <ol className="prompts">
            {PROMPTS.map((prompt, index) => (
              <li key={prompt}>
                <span className="prompt-text">{prompt}</span>
                <CopyButton
                  value={prompt}
                  describedAs={`prompt ${index + 1}`}
                />
              </li>
            ))}
          </ol>
        </div>

        <p>
          Now ask it to pick an income figure. It comes back{" "}
          <code>conflict_requires_human</code>, the saved application does not
          move, and the choice stays on the page in front of you. That refusal
          is the product working, not a failure.
        </p>
        <p>
          <Link href="/agents">
            Full instructions, including the ChatGPT in-app browser
          </Link>
        </p>
      </Band>

      {/* ---- Questions --------------------------------------------------- */}
      <Band id="faq" className="section faq-band" labelledBy="faq-heading">
        <h2 id="faq-heading">Common questions</h2>
        <div className="faq">
          {FAQ.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </Band>

      {/* ---- Closing band ------------------------------------------------ */}
      <section
        className="closing"
        aria-labelledby="closing-heading"
        data-reveal=""
      >
        <div className="hero-ground" aria-hidden="true">
          <span className="glow glow-seal" />
        </div>
        <div className="wrap">
          <h2 id="closing-heading">Walk it yourself — it takes two minutes</h2>
          <p>
            Nothing you enter is submitted anywhere, the records are invented,
            and the session lasts an hour. Take the records that disagree if you
            only have time for one.
          </p>
          <p className="closing-links">
            <Link className="closing-primary" href="#records">
              Choose a set of records
            </Link>
            <Link className="closing-secondary" href="/agents">
              Read the agent instructions
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
