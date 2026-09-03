"use client";

import { useId, useRef, useState } from "react";

const SYNTHETIC_ONLY =
  "This demonstration reads only its own synthetic records, so nothing real can be submitted by mistake. Download a sample set above and upload it to see the flow.";

type FailureBody = Readonly<{
  ok?: boolean;
  error?: { code?: string; message?: string };
}>;

/**
 * Posts the chosen files to the demo route. The server hashes each one and
 * starts the committed set they match; nothing else is accepted, and the bytes
 * are never stored. This function keeps no copy of them either — the File
 * objects go straight into the form body.
 */
async function uploadRecords(files: readonly File[]): Promise<string> {
  const issued = (await (
    await fetch("/api/demo", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    })
  ).json()) as { ok?: boolean; data?: { startToken: unknown } } & FailureBody;
  if (issued.ok !== true || issued.data === undefined) {
    return (
      issued.error?.message ?? "CiteApply could not prepare a synthetic start."
    );
  }

  const body = new FormData();
  for (const file of files) body.append("records", file);
  body.append("startToken", JSON.stringify(issued.data.startToken));
  body.append("requestId", crypto.randomUUID());

  const started = (await (
    await fetch("/api/demo", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      body,
    })
  ).json()) as { ok?: boolean; data?: { destination: string } } & FailureBody;

  if (started.ok !== true || started.data === undefined) {
    return started.error?.message ?? SYNTHETIC_ONLY;
  }
  window.location.assign(started.data.destination);
  return "";
}

export function UploadRecords() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState(0);
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const files = [...(inputRef.current?.files ?? [])];
    if (files.length === 0) {
      setRefusal("Choose the three PDFs from a sample set, then upload them.");
      return;
    }
    setBusy(true);
    setRefusal(null);
    void uploadRecords(files)
      .then((message) => {
        if (message.length > 0) {
          setRefusal(message);
          setBusy(false);
        }
      })
      .catch(() => {
        setRefusal(SYNTHETIC_ONLY);
        setBusy(false);
      });
  };

  return (
    <form className="upload-form" onSubmit={submit}>
      <label htmlFor={inputId}>Your records, as PDFs</label>
      <input
        ref={inputRef}
        id={inputId}
        name="records"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        onChange={(event) => {
          setChosen(event.currentTarget.files?.length ?? 0);
          setRefusal(null);
        }}
      />
      <p className="upload-count" role="status" aria-live="polite">
        {chosen === 0
          ? "No files chosen yet."
          : chosen === 1
            ? "1 file chosen."
            : `${chosen} files chosen.`}
      </p>
      {refusal === null ? null : (
        <p className="upload-refusal" role="alert">
          {refusal}
        </p>
      )}
      <button type="submit" className="cta cta-seal" aria-busy={busy || undefined}>
        {busy ? "Checking your records…" : "Start with these records"}
      </button>
    </form>
  );
}
