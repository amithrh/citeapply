"use client";

import { useEffect, useId, useRef, type SyntheticEvent } from "react";

export const ASSISTED_ACCESS_CATALOG = {
  purpose:
    "Help with this synthetic application in this current page and this 60-minute session.",
  includedCategories: [
    "Saved form answers, including the preferred contact email",
    "Values extracted from the three synthetic records, including name, student ID, institution, household details, and income",
    "Document names and page numbers",
    "Questions that currently apply and their source rules",
    "Current validation blockers",
    "Limited review readiness status",
  ],
  permittedActions: [
    "Link policy-allowed sources to draft answers",
    "Propose the synthetic .test email for the applicant to review and declare",
    "Create a Review for the applicant to inspect, but only from a ready Draft with no unsaved changes",
  ],
  reviewPreparationEffect:
    "If Review creation succeeds, it keeps that exact saved content and CiteApply turns assisted access off.",
  excludedData: [
    "Raw PDFs and complete source excerpts",
    "The applicant declaration record",
    "The private income-conflict choice or reason",
    "The full Review and complete review diff",
    "Confirmation, submission, Receipt, and export data",
  ],
  excludedActions: [
    "Choose a packet",
    "Make the applicant declaration",
    "Resolve the income conflict",
    "Return from Review",
    "Confirm or submit the application",
    "Load, download, print, or export a Receipt",
  ],
  readinessLimit:
    "Because current blockers and limited readiness are included, the assistant may learn that a required human step is complete, but not the private conflict choice or reason.",
  separatePermissions:
    "This choice controls only CiteApply's six assisted tools. It does not change permissions you separately grant your browser, extension, or assistant.",
  revocationLimit:
    "Revoking blocks new access, but an action CiteApply already accepted may still finish, and information already returned cannot be recalled.",
  stoppedWaitingLimit:
    "If a request stops waiting after CiteApply received it, the page checks the saved application instead of promising that the action was cancelled.",
} as const;

export type AssistedAccessCatalog = typeof ASSISTED_ACCESS_CATALOG;

export type ConsentDialogProps = Readonly<{
  open: boolean;
  busy: boolean;
  onAllow: () => void | Promise<void>;
  onContinueManually: () => void;
}>;

export function ConsentDialog({
  open,
  busy,
  onAllow,
  onContinueManually,
}: ConsentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const allowButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const headingId = useId();
  const descriptionId = useId();
  const scopeId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }

    if (open && !dialog.open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
      allowButtonRef.current?.focus();
    }

    if (!open && dialog.open) {
      dialog.close();
    }

    if (!open && wasOpenRef.current) {
      queueMicrotask(() => openerRef.current?.focus());
    }

    wasOpenRef.current = open;

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [open]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (!busy) {
      onContinueManually();
    }
  };

  const handleAllow = () => {
    if (!busy) {
      void onAllow();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      aria-describedby={`${descriptionId} ${scopeId}`}
      onCancel={handleCancel}
    >
      <h2 id={headingId}>Allow assisted access?</h2>
      <p id={descriptionId}>
        CiteApply can let an assistant help link synthetic source records to this
        draft. Assistance is optional; every application control remains
        available manually.
      </p>
      <p id={scopeId}>{ASSISTED_ACCESS_CATALOG.purpose}</p>

      <section aria-labelledby={`${headingId}-included`}>
        <h3 id={`${headingId}-included`}>Information the tools may receive</h3>
        <ul>
          {ASSISTED_ACCESS_CATALOG.includedCategories.map((category) => (
            <li key={category}>{category}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${headingId}-actions`}>
        <h3 id={`${headingId}-actions`}>Actions the tools may request</h3>
        <ul>
          {ASSISTED_ACCESS_CATALOG.permittedActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
        <p>{ASSISTED_ACCESS_CATALOG.reviewPreparationEffect}</p>
      </section>

      <section aria-labelledby={`${headingId}-excluded-data`}>
        <h3 id={`${headingId}-excluded-data`}>Information the tools will not receive</h3>
        <ul>
          {ASSISTED_ACCESS_CATALOG.excludedData.map((category) => (
            <li key={category}>{category}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${headingId}-excluded-actions`}>
        <h3 id={`${headingId}-excluded-actions`}>Actions the tools cannot take</h3>
        <ul>
          {ASSISTED_ACCESS_CATALOG.excludedActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </section>

      <p>{ASSISTED_ACCESS_CATALOG.readinessLimit}</p>
      <p>{ASSISTED_ACCESS_CATALOG.separatePermissions}</p>
      <p>{ASSISTED_ACCESS_CATALOG.revocationLimit}</p>
      <p>{ASSISTED_ACCESS_CATALOG.stoppedWaitingLimit}</p>

      <details>
        <summary>Technical details</summary>
        <p>
          Access is limited to the current application page and session. Refresh,
          a newer-page takeover, session expiry, or successful Review preparation
          clears it. A server-authorized in-flight result may arrive after Revoke;
          an authority loss that wins first returns no protected result.
        </p>
      </details>

      <div>
        <button
          id="allow-assisted-access-button"
          ref={allowButtonRef}
          type="button"
          aria-busy={busy || undefined}
          aria-disabled={busy}
          onClick={handleAllow}
        >
          {busy ? "Allowing assisted access…" : "Allow assisted access"}
        </button>
        <button
          type="button"
          aria-disabled={busy}
          onClick={() => {
            if (!busy) {
              onContinueManually();
            }
          }}
        >
          Continue manually
        </button>
      </div>
    </dialog>
  );
}
