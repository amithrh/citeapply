"use client";

import { useEffect, useState } from "react";

const COACH_KEY = "citeapply.coach.dismissed";
const CHOICE_KEY = "citeapply.fill-choice.made";

/**
 * Reads and writes one page-preference flag. Storage is unavailable in a
 * private window and throws outright in some configurations, so every access
 * is guarded and a failure simply means the strip is shown again.
 */
function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "yes";
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    window.localStorage.setItem(key, "yes");
  } catch {
    // A reader who cannot store a preference still gets a working page.
  }
}

const STEPS = [
  {
    title: "Your three records are already read",
    detail:
      "CiteApply parsed the enrollment record, the household statement and the income statement on the server when this application opened.",
  },
  {
    title: "Every answer names the record it came from",
    detail:
      "An answer here is a link to a sentence in one of those records, shown beside it — not free text somebody typed.",
  },
  {
    title: "The decisions stay yours",
    detail:
      "Declaring your email, settling a disagreement between two records, and submitting are yours alone. Nothing else can do them.",
  },
] as const;

export type CoachStripProps = Readonly<{ assisted: boolean }>;

/**
 * The three-sentence explanation of what this screen is, shown once. It is
 * rendered only after mount, because whether it belongs on screen is a fact
 * about this browser rather than about the application.
 */
export function CoachStrip({ assisted }: CoachStripProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!readFlag(COACH_KEY));
  }, []);

  if (!show) return null;

  return (
    <aside className="coach" aria-labelledby="coach-heading">
      <h2 id="coach-heading">How this works</h2>
      <ol className="coach-steps">
        {STEPS.map((step) => (
          <li key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.detail}</p>
          </li>
        ))}
      </ol>
      {assisted ? (
        <p className="coach-pointer">
          Assisted access is on. Watch each tool call land in the Assisted
          activity panel beside the form.
        </p>
      ) : null}
      <button
        type="button"
        className="coach-dismiss"
        onClick={() => {
          writeFlag(COACH_KEY);
          setShow(false);
        }}
      >
        Got it
      </button>
    </aside>
  );
}

export type FillChoiceProps = Readonly<{
  assisted: boolean;
  stale: boolean;
  onAskForHelp: () => void;
}>;

/**
 * The two-way choice a person meets on arrival. Neither branch changes what the
 * page can do: by hand is the product as it already stands with assisted access
 * off, and asking for help opens the same disclosure as the panel beside the
 * form. This only makes the fork explicit instead of leaving it implied.
 */
export function FillChoice({ assisted, stale, onAskForHelp }: FillChoiceProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!readFlag(CHOICE_KEY));
  }, []);

  if (!show || assisted) return null;

  return (
    <section className="fill-choice" aria-labelledby="fill-choice-heading">
      <h2 id="fill-choice-heading">How do you want to fill this in?</h2>
      <div className="fill-choice-options">
        <article aria-labelledby="fill-choice-manual">
          <h3 id="fill-choice-manual">By hand</h3>
          <p>
            Read each record, link it to the answer it supports, and decide
            everything yourself. Assisted access stays off, and no control is
            hidden.
          </p>
          <button
            type="button"
            onClick={() => {
              writeFlag(CHOICE_KEY);
              setShow(false);
            }}
          >
            Fill it in by hand
          </button>
        </article>
        <article aria-labelledby="fill-choice-assisted">
          <h3 id="fill-choice-assisted">With an assistant</h3>
          <p>
            An assistant in your browser can read the records and bind the
            answers they support. It can never declare your email, settle a
            disagreement, or submit.
          </p>
          <button
            type="button"
            disabled={stale}
            onClick={() => {
              writeFlag(CHOICE_KEY);
              onAskForHelp();
            }}
          >
            Let an assistant help
          </button>
        </article>
      </div>
    </section>
  );
}
