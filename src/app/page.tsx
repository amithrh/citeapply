"use client";

import { useState } from "react";

import type { PacketCode } from "../contracts/common.ts";

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
    <main>
      <header>
        <p>Horizon Education Aid — Need-Based Scholarship</p>
        <p>
          <strong>Fictional demo · Synthetic data only</strong>
        </p>
        <h1>The agent cites. You decide.</h1>
        <p>
          CiteApply is a scholarship application an assistant can help you fill
          in, but only from three source records and only up to the point where
          judgment starts. The page registers six WebMCP tools on itself, so an
          agent in your browser works against the portal&apos;s own rules,
          version checks and refusals instead of guessing at the form. It can
          read requirements, cite evidence and bind answers; it can never
          resolve a conflict between sources, declare your email, or submit —
          those stay in the visible interface, with you.
        </p>
      </header>

      <section aria-labelledby="demo-paths-heading">
        <h2 id="demo-paths-heading">Start a synthetic application</h2>
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
      </section>

      <section aria-labelledby="agent-heading">
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
      </section>

      <aside aria-labelledby="synthetic-data-warning">
        <h2 id="synthetic-data-warning">Everything here is synthetic</h2>
        <p>
          The records, the applicant and the scholarship are invented, no real
          application is submitted, and a session lasts 60 minutes — so please
          keep real personal and financial information out of it.
        </p>
      </aside>
    </main>
  );
}
