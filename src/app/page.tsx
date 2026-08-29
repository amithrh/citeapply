"use client";

import { useState } from "react";

import type { PacketCode } from "../contracts/common.ts";

async function startSyntheticDemo(packet: PacketCode): Promise<string | null> {
  const issued = (await (
    await fetch("/api/demo", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    })
  ).json()) as { ok?: boolean; data?: { startToken: unknown } };
  if (issued.ok !== true || issued.data === undefined) {
    return "CiteApply could not prepare a synthetic start.";
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
  ).json()) as { ok?: boolean; data?: { destination: string } };

  if (started.ok !== true || started.data === undefined) {
    return "CiteApply could not start this synthetic demo.";
  }
  window.location.assign(started.data.destination);
  return null;
}

export default function LandingPage() {
  const [busy, setBusy] = useState<PacketCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = (packet: PacketCode) => {
    if (busy !== null) return;
    setBusy(packet);
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
        <h1>Apply with synthetic records</h1>
        <p>
          CiteApply demonstrates how a participating scholarship portal can link
          draft answers to source records, surface conflicts, and keep judgment
          and submission in the applicant&apos;s visible control.
        </p>
      </header>

      <aside aria-labelledby="synthetic-data-warning">
        <h2 id="synthetic-data-warning">
          Keep real information out of this demo
        </h2>
        <p>
          Do not enter real personal or financial information. This does not
          submit a real scholarship application.
        </p>
      </aside>

      <section aria-labelledby="demo-paths-heading">
        <h2 id="demo-paths-heading">Two bounded synthetic paths</h2>
        {error === null ? null : <p role="alert">{error}</p>}
        <article>
          <h3>Supported packet</h3>
          <p>
            Three synthetic records agree, so the portal can accept supported
            source links and show corroboration.
          </p>
          <button
            type="button"
            aria-busy={busy === "supported" || undefined}
            onClick={() => start("supported")}
          >
            {busy === "supported" ? "Starting…" : "Start supported packet"}
          </button>
        </article>
        <article>
          <h3>Conflict packet</h3>
          <p>
            Two accepted income sources disagree, so the portal refuses to pick
            a value and leaves the decision to the applicant.
          </p>
          <button
            type="button"
            aria-busy={busy === "conflict" || undefined}
            onClick={() => start("conflict")}
          >
            {busy === "conflict" ? "Starting…" : "Start conflict packet"}
          </button>
        </article>
      </section>

      <section aria-labelledby="session-boundary-heading">
        <h2 id="session-boundary-heading">
          A time-bounded local demonstration
        </h2>
        <p>
          A synthetic session lasts 60 minutes after it starts. Assisted access
          is optional, and the complete application remains available through
          visible manual controls.
        </p>
      </section>
    </main>
  );
}
