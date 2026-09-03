"use client";

import { useEffect, useRef, useState } from "react";

type CopyButtonProps = Readonly<{
  /** The exact text placed on the clipboard. Never a paraphrase of it. */
  value: string;
  /** What is being copied, for the button's accessible name. */
  describedAs: string;
}>;

/**
 * Copies one exact string. The page shows the string in full beside this
 * control, so the button is a convenience and never the only way to get it —
 * which is what makes the fallback honest: where the Clipboard API is missing
 * or refused, the control says so and points at the text, rather than
 * pretending a copy happened.
 */
export function CopyButton({ value, describedAs }: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "unavailable">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const copy = () => {
    const clipboard = navigator.clipboard;
    if (clipboard === undefined || typeof clipboard.writeText !== "function") {
      setState("unavailable");
      return;
    }
    void clipboard.writeText(value).then(
      () => {
        setState("copied");
        if (timer.current !== null) clearTimeout(timer.current);
        timer.current = setTimeout(() => setState("idle"), 2400);
      },
      () => setState("unavailable"),
    );
  };

  return (
    <span className="copy">
      <button
        type="button"
        className="copy-button"
        onClick={copy}
        aria-label={`Copy ${describedAs}`}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <rect
            x="5.25"
            y="1.75"
            width="9"
            height="9"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M10.75 12.75v.5a1.5 1.5 0 0 1-1.5 1.5h-5.5a1.5 1.5 0 0 1-1.5-1.5v-5.5a1.5 1.5 0 0 1 1.5-1.5h.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        Copy
      </button>
      <span className="copy-status" role="status">
        {state === "copied" ? "Copied" : null}
        {state === "unavailable"
          ? "Clipboard unavailable — select the text above"
          : null}
      </span>
    </span>
  );
}
