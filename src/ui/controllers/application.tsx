"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { ConsentDialog } from "../components/consent.tsx";

export type AssistanceMode = "off" | "allowed" | "unavailable";

export type AssistanceCommandResult =
  | { ok: true; assistance: "allowed" | "off" }
  | {
      ok: false;
      assistance: "off";
      code: "refused" | "temporarily_unavailable";
    };

export type ApplicationConsentPort = Readonly<{
  allowAssistedAccess: () => Promise<AssistanceCommandResult>;
  /** Clears the page-memory capability before awaiting the server response. */
  revokeAssistedAccess: () => Promise<AssistanceCommandResult>;
}>;

export type ApplicationControllerProps = Readonly<{
  consent: ApplicationConsentPort;
  initialAssistance?: AssistanceMode;
  /**
   * Set when the page has been superseded by another tab. The server answers
   * every call from this tab `stale_page`, so offering to change assisted
   * access here would only produce a refusal; the controls are disabled and
   * the status says why. Assistance itself is unaffected — this only stops the
   * page from offering an action it no longer has the authority to take.
   */
  stale?: boolean;
  /**
   * Lets the page open this controller's own disclosure from somewhere else on
   * the screen — the two-way choice at the top of the draft. It hands out no
   * authority: the only thing exposed is the request to show the dialog, and
   * allowing access still happens here, behind the same disclosure and the
   * same button.
   */
  onReady?: (api: Readonly<{ openDisclosure: () => void }>) => void;
  children?: ReactNode;
}>;

const INITIAL_STATUS: Record<AssistanceMode, string> = {
  off: "Assisted access is off.",
  allowed: "Assisted access is allowed for this page and session.",
  unavailable:
    "Assisted access is unavailable in this browser. Continue with the visible manual controls.",
};

export function ApplicationController({
  consent,
  initialAssistance = "off",
  stale = false,
  onReady,
  children,
}: ApplicationControllerProps) {
  const [assistance, setAssistance] =
    useState<AssistanceMode>(initialAssistance);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<"allow" | "revoke" | null>(null);
  const [status, setStatus] = useState(INITIAL_STATUS[initialAssistance]);
  const busyRef = useRef(false);
  const operationSequenceRef = useRef(0);

  useEffect(() => {
    onReady?.({
      openDisclosure: () => {
        if (!busyRef.current) setDisclosureOpen(true);
      },
    });
  }, [onReady]);

  const handleAllow = async () => {
    if (busyRef.current || assistance === "unavailable") {
      return;
    }

    busyRef.current = true;
    const operationSequence = ++operationSequenceRef.current;
    setBusyAction("allow");

    try {
      const result = await consent.allowAssistedAccess();
      if (operationSequence !== operationSequenceRef.current) {
        return;
      }

      if (result.ok && result.assistance === "allowed") {
        setAssistance("allowed");
        setStatus("Assisted access is allowed for this page and session.");
      } else {
        setAssistance("off");
        setStatus(
          "Assisted access was not enabled. Continue with the visible application.",
        );
      }
      setDisclosureOpen(false);
    } catch {
      if (operationSequence === operationSequenceRef.current) {
        setAssistance("off");
        setDisclosureOpen(false);
        setStatus(
          "Assisted access was not enabled. Continue with the visible application.",
        );
      }
    } finally {
      if (operationSequence === operationSequenceRef.current) {
        busyRef.current = false;
        setBusyAction(null);
      }
    }
  };

  const handleContinueManually = () => {
    if (busyRef.current) {
      return;
    }
    setDisclosureOpen(false);
    setAssistance("off");
    setStatus("Assisted access is off. Continue with the manual application.");
  };

  const handleRevoke = async () => {
    if (busyRef.current || assistance !== "allowed") {
      return;
    }

    busyRef.current = true;
    const operationSequence = ++operationSequenceRef.current;
    setBusyAction("revoke");
    // Revoke is fail-closed in this controller: the injected port clears its
    // page-memory capability before waiting, so no later tool call can use it.
    setAssistance("off");

    try {
      const result = await consent.revokeAssistedAccess();
      if (operationSequence !== operationSequenceRef.current) {
        return;
      }

      setStatus(
        result.ok
          ? "Assisted access is off. Saved application work was kept."
          : "Assisted access is off in this page. Reload the current application before allowing it again.",
      );
    } catch {
      if (operationSequence === operationSequenceRef.current) {
        setStatus(
          "Assisted access is off in this page. Reload the current application before allowing it again.",
        );
      }
    } finally {
      if (operationSequence === operationSequenceRef.current) {
        busyRef.current = false;
        setBusyAction(null);
      }
    }
  };

  return (
    <>
      <section aria-labelledby="assisted-access-heading">
        <h2 id="assisted-access-heading">Assisted access</h2>
        <p role="status" aria-live="polite">
          {stale
            ? "Assisted access ended when another tab took over this session."
            : status}
        </p>

        {assistance === "off" ? (
          <button
            id="allow-assisted-access-trigger"
            type="button"
            disabled={stale}
            onClick={() => setDisclosureOpen(true)}
          >
            Review and allow assisted access
          </button>
        ) : assistance === "allowed" ? (
          <button
            type="button"
            disabled={stale}
            aria-busy={busyAction === "revoke" || undefined}
            aria-disabled={busyAction === "revoke"}
            onClick={() => void handleRevoke()}
          >
            {busyAction === "revoke" ? "Revoking access…" : "Revoke access"}
          </button>
        ) : null}
      </section>

      <ConsentDialog
        open={disclosureOpen}
        busy={busyAction === "allow"}
        onAllow={handleAllow}
        onContinueManually={handleContinueManually}
      />

      {children}
    </>
  );
}
