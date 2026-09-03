"use client";

import Link from "next/link";
import { useState } from "react";

import type { PacketCode } from "../contracts/common.ts";
import { HeroFigure } from "../ui/site/hero-figure.tsx";

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
      "Lists the claims parsed from this packet's records as opaque handles. No raw PDF, no storage path, no full excerpt.",
  },
  {
    name: "apply_evidence_backed_answers",
    writes: true,
    untrusted: true,
    summary:
      "Links handles to answers in one atomic, version-checked call. Every entry validates or nothing changes.",
  },
  {
    name: "get_validation_issues",
    writes: false,
    untrusted: false,
    summary:
      "Reads what is currently blocking review, in order. It changes nothing.",
  },
  {
    name: "prepare_submission_review",
    writes: true,
    untrusted: false,
    summary:
      "Freezes a ready draft into a review for you to inspect, then closes assisted access. It returns readiness, not the review.",
  },
] as const;

const FAQ = [
  {
    question: "Is this a real scholarship?",
    answer:
      "No. Horizon Education Aid does not exist, the award and the dates on this page are invented, and nothing you do here is sent to any program. The applicant, the three records and every figure in them are synthetic.",
  },
  {
    question: "What can the assistant never do?",
    answer:
      "Choose a packet, declare your email address, resolve a disagreement between two records, return from a review, confirm or submit the application, or load, print or export a receipt. The server refuses those calls; it is not a matter of the tool descriptions asking nicely.",
  },
  {
    question: "What is stored, and for how long?",
    answer:
      "Your answers, which record each one cites, and the review and receipt you produce — all against a session cookie that lasts 60 minutes. Because the packets are synthetic, none of it is anyone's real data, and there is nothing here worth keeping.",
  },
] as const;

export default function LandingPage() {
  const [busy, setBusy] = useState<PacketCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPacket, setLastPacket] = useState<PacketCode | null>(null);

  const start = (packet: PacketCode) => {
    if (busy !== null) return;
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
      <header className="hero" id="apply">
        <div className="hero-text">
          <p className="hero-cycle">
            Applications for the 2026–27 cycle are open until 30 June 2026.
          </p>
          <h1>The agent cites. You decide.</h1>
          <p className="stamp">Fictional demo · Synthetic data only</p>
          <p className="hero-lead">
            CiteApply is a scholarship application an assistant can help you fill
            in, but only from three source records and only up to the point where
            judgment starts. The page registers six WebMCP tools on itself, so an
            agent in your browser works against the portal&apos;s own rules,
            version checks and refusals instead of guessing at the form. It can
            read requirements, cite evidence and bind answers; it can never
            resolve a conflict between sources, declare your email, or submit —
            those stay in the visible interface, with you.
          </p>
        </div>
        <HeroFigure />

        <div className="apply" aria-labelledby="demo-paths-heading" role="group">
        <h2 id="demo-paths-heading">Start a synthetic application</h2>
        <p className="section-lead">
          Both packets carry the same eight questions and the same three
          records. They differ in one thing: whether the records agree.
        </p>
        {error === null ? null : (
          <div role="alert">
            <p>{error}</p>
            {lastPacket === null ? null : (
              <button type="button" onClick={() => start(lastPacket)}>
                Try again
              </button>
            )}
          </div>
        )}
        <div className="packets">
          <article>
            <h3>Supported packet</h3>
            <p>
              All three records agree, so every answer can be linked to a source
              and corroborated.
            </p>
            <button
              type="button"
              aria-busy={busy === "supported" || undefined}
              onClick={() => start("supported")}
            >
              {busy === "supported" ? "Starting…" : "Start supported packet"}
            </button>
          </article>
          <article className="interesting">
            <h3>Conflict packet</h3>
            <p>
              Two accepted records disagree about income. This is the
              interesting one: the portal refuses to choose, and so does the
              agent.
            </p>
            <button
              type="button"
              aria-busy={busy === "conflict" || undefined}
              onClick={() => start("conflict")}
            >
              {busy === "conflict" ? "Starting…" : "Start conflict packet"}
            </button>
          </article>
        </div>
        <p className="apply-secondary">
          <Link href="/agents">See how agents help</Link>
        </p>
        </div>
      </header>

      <section id="scholarship" aria-labelledby="scholarship-heading">
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
      </section>

      <section id="how-it-works" aria-labelledby="how-heading">
        <h2 id="how-heading">How it works</h2>
        <ol className="steps">
          <li>
            <h3>Your records are read for you</h3>
            <p>
              Choosing a packet parses its three PDFs on the server and turns
              them into a short index of claims. Nothing is typed in, and no
              record is treated as more than a claim until it is cited.
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
              When two accepted records disagree, or when a declaration is
              yours to make, the portal stops and hands you the decision. Then
              it freezes exactly what you approved and submits that.
            </p>
          </li>
        </ol>
      </section>

      <section id="comparison" aria-labelledby="comparison-heading">
        <h2 id="comparison-heading">With and without an assistant</h2>
        <p className="section-lead">
          The manual path is the whole product; the assisted path is the same
          product with a second pair of hands. Both are real here, and you can
          walk either one.
        </p>
        <div className="compare">
          <article className="compare-col manual">
            <h3>Filling it in yourself</h3>
            <ol>
              <li>Open each of the three records and read them.</li>
              <li>
                Find the sentence that answers a question, then link that record
                to the answer.
              </li>
              <li>
                Notice when answering one question makes two more apply, and go
                back for those.
              </li>
              <li>Type and save your email, then declare it is yours.</li>
              <li>
                Read both income records, choose a reason, and stand behind one
                of them.
              </li>
              <li>Prepare the review, read it, and submit.</li>
            </ol>
          </article>
          <article className="compare-col assisted">
            <h3>Asking an assistant</h3>
            <ol>
              <li>
                It reads the active requirements and the evidence index through
                the page&apos;s own tools.
              </li>
              <li>
                It binds every supported answer in one atomic call — all of them
                or none, checked against the version it read.
              </li>
              <li>
                Two questions become required; it re-reads and binds those too.
              </li>
              <li>
                It can propose the synthetic email, but the field still reads
                &ldquo;not yet declared&rdquo; until you say so.
              </li>
              <li>
                It asks for the income answer and is refused:{" "}
                <code>conflict_requires_human</code>. Nothing is written.
              </li>
              <li>It prepares the review for you, and then loses access.</li>
            </ol>
          </article>
        </div>
        <p className="converge">
          Both paths reach the same three decisions that are only yours, and the
          same frozen review — the same content hash on the same receipt. The
          assistant removes the reading and the retyping. It does not remove
          you.
        </p>
      </section>

      <section id="tools" aria-labelledby="tools-heading">
        <h2 id="tools-heading">The six tools this page registers</h2>
        <p className="section-lead">
          Every tool is declared on <code>document.modelContext</code> with the
          hints below. Four only read. The two that can change something are
          version-checked and refuse rather than guess.
        </p>
        <ul className="tools">
          {TOOLS.map((tool) => (
            <li key={tool.name} data-writes={tool.writes || undefined}>
              <p className="tool-name">
                <code>{tool.name}</code>
              </p>
              <p className="tool-hints">
                <span className={tool.writes ? "hint-write" : "hint-read"}>
                  {tool.writes ? "can change the draft" : "readOnly"}
                </span>
                <span className={tool.untrusted ? "hint-untrusted" : "hint-own"}>
                  {tool.untrusted
                    ? "untrusted content"
                    : "the portal's own rules"}
                </span>
              </p>
              <p className="tool-summary">{tool.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="quick-start"
        className="quick-start"
        aria-labelledby="agent-heading"
      >
        <h2 id="agent-heading">Try it with an agent</h2>
        <p>
          Enable WebMCP in Chrome at{" "}
          <code>chrome://flags/#enable-webmcp-testing</code>. If you launch
          Chrome yourself, the same switch is{" "}
          <code>--enable-features=WebMCPTesting</code>. Then start the Conflict
          packet, allow assisted access on the application page, and ask your
          assistant:
        </p>
        <ol className="prompts">
          <li>
            Read this application&apos;s requirements and evidence index, then
            fill in every answer you can support from the records.
          </li>
          <li>
            More questions just appeared. Re-read the active requirements and
            bind those too.
          </li>
          <li>Now prepare the submission review.</li>
        </ol>
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
      </section>

      <section id="faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading">Common questions</h2>
        <dl className="faq">
          {FAQ.map((item) => (
            <div key={item.question}>
              <dt>{item.question}</dt>
              <dd>{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
