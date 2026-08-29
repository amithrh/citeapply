"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { HumanDraftV1, HumanSnapshotV1 } from "../../contracts/http.ts";
import { ApplicationController } from "../../ui/controllers/application.tsx";
import { createCiteApplyBridge } from "../../webmcp/bridge.ts";
import { createCiteApplyDispatch } from "../../webmcp/invoke.ts";

type Authority = Readonly<{
  pageCapability: string | null;
  consentCapability: string | null;
  expectedPageEpoch: number;
  expectedApplicationRevision: number;
  expectedRequirementsVersion: number;
}>;

const INITIAL_AUTHORITY: Authority = {
  pageCapability: null,
  consentCapability: null,
  expectedPageEpoch: 0,
  expectedApplicationRevision: 0,
  expectedRequirementsVersion: 1,
};

async function postJson(
  path: string,
  body: unknown,
  pageCapability: string | null,
): Promise<unknown> {
  const headers = new Headers({ "content-type": "application/json" });
  if (pageCapability !== null) headers.set("x-citeapply-page", pageCapability);
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers,
    body: JSON.stringify(body),
  });
  return (await response.json()) as unknown;
}

function draftOfSnapshot(snapshot: HumanSnapshotV1): HumanDraftV1 | null {
  return snapshot.stage === "draft" ? snapshot.view : null;
}

export default function ApplicationPage() {
  const authorityRef = useRef<Authority>(INITIAL_AUTHORITY);
  const [draft, setDraft] = useState<HumanDraftV1 | null>(null);
  const [assistance, setAssistance] = useState<"off" | "allowed" | "unavailable">(
    "off",
  );
  const [notice, setNotice] = useState("Establishing this application page…");
  const [bridgeStatus, setBridgeStatus] = useState("not registered");

  const adoptSnapshot = useCallback((snapshot: HumanSnapshotV1) => {
    authorityRef.current = {
      ...authorityRef.current,
      expectedPageEpoch: snapshot.pageEpoch,
      expectedApplicationRevision: snapshot.applicationRevision,
      expectedRequirementsVersion: snapshot.requirementsVersion,
    };
    setDraft(draftOfSnapshot(snapshot));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const establish = async () => {
      const challenge = (await postJson(
        "/api/application",
        { mode: "bootstrap_challenge" },
        null,
      )) as {
        ok?: boolean;
        data?: {
          challenge: string;
          pageEpoch: number;
          applicationRevision: number;
        };
      };
      if (challenge.ok !== true || challenge.data === undefined) {
        if (!cancelled) setNotice("This synthetic session is not available.");
        return;
      }

      const takeover = (await postJson(
        "/api/application",
        {
          mode: "takeover",
          requestId: crypto.randomUUID(),
          expectedPageEpoch: challenge.data.pageEpoch,
          expectedApplicationRevision: challenge.data.applicationRevision,
          challenge: challenge.data.challenge,
        },
        null,
      )) as {
        ok?: boolean;
        data?: { pageCapability: string; snapshot: HumanSnapshotV1 };
      };
      if (takeover.ok !== true || takeover.data === undefined) {
        if (!cancelled) setNotice("This page is no longer current. Reload it.");
        return;
      }
      if (cancelled) return;

      authorityRef.current = {
        ...authorityRef.current,
        pageCapability: takeover.data.pageCapability,
        consentCapability: null,
      };
      adoptSnapshot(takeover.data.snapshot);
      setNotice("This page is current. Assisted access is off.");

      const bridge = createCiteApplyBridge(
        createCiteApplyDispatch(() => ({
          pageCapability: authorityRef.current.pageCapability,
          consentCapability: authorityRef.current.consentCapability,
          localDirty: false,
        })),
      );
      const registered = await bridge.registerOnce();
      if (cancelled) return;
      if (registered.registered) {
        const token = bridge.beginActivation();
        if (token !== null) bridge.activate(token);
        setBridgeStatus("six CiteApply tools registered");
      } else {
        setBridgeStatus("WebMCP is unavailable in this browser");
        setAssistance("unavailable");
      }
    };

    void establish();
    return () => {
      cancelled = true;
    };
  }, [adoptSnapshot]);

  const runAction = useCallback(
    async (action: Record<string, unknown>) => {
      const current = authorityRef.current;
      const result = (await postJson(
        "/api/application/actions",
        {
          requestId: crypto.randomUUID(),
          expectedPageEpoch: current.expectedPageEpoch,
          expectedApplicationRevision: current.expectedApplicationRevision,
          expectedRequirementsVersion: current.expectedRequirementsVersion,
          ...action,
        },
        current.pageCapability,
      )) as {
        ok?: boolean;
        data?: { consentCapability?: string; snapshot?: HumanSnapshotV1 };
        error?: { code: string; message: string };
      };

      if (result.ok === true && result.data?.snapshot !== undefined) {
        if (result.data.consentCapability !== undefined) {
          authorityRef.current = {
            ...authorityRef.current,
            consentCapability: result.data.consentCapability,
          };
        }
        adoptSnapshot(result.data.snapshot);
      }
      return result;
    },
    [adoptSnapshot],
  );

  const consentPort = {
    allowAssistedAccess: async () => {
      const result = await runAction({ action: "allow_assisted_access" });
      if (result.ok === true) {
        setAssistance("allowed");
        return { ok: true as const, assistance: "allowed" as const };
      }
      return {
        ok: false as const,
        assistance: "off" as const,
        code: "temporarily_unavailable" as const,
      };
    },
    revokeAssistedAccess: async () => {
      authorityRef.current = {
        ...authorityRef.current,
        consentCapability: null,
      };
      setAssistance("off");
      const result = await runAction({ action: "revoke_assisted_access" });
      return result.ok === true
        ? { ok: true as const, assistance: "off" as const }
        : {
            ok: false as const,
            assistance: "off" as const,
            code: "temporarily_unavailable" as const,
          };
    },
  };

  const bindEvidence = (field: string, claimHandle: string) => {
    void runAction({ action: "bind_evidence", field, claimHandle });
  };

  return (
    <main>
      <header>
        <p>Horizon Education Aid — Need-Based Scholarship</p>
        <p>
          <strong>Fictional demo · Synthetic data only</strong>
        </p>
        <h1>Your synthetic application</h1>
        <p role="status" aria-live="polite">
          {notice}
        </p>
        <p>WebMCP: {bridgeStatus}</p>
      </header>

      <ApplicationController
        consent={consentPort}
        initialAssistance={assistance}
      />

      {draft === null ? (
        <p>Loading the saved application…</p>
      ) : (
        <>
          <section aria-labelledby="progress-heading">
            <h2 id="progress-heading">Readiness</h2>
            <p>
              {draft.progress.ready} of {draft.progress.total} required answers
              are ready.
            </p>
            {draft.blockers.length === 0 ? (
              <p>Nothing is blocking Review.</p>
            ) : (
              <ul>
                {draft.blockers.map((blocker) => (
                  <li key={`${blocker.code}-${blocker.field}`}>
                    {blocker.message}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="fields-heading">
            <h2 id="fields-heading">Answers</h2>
            <dl>
              {draft.fields.map((field) => (
                <div key={field.field}>
                  <dt>{field.field.replaceAll("_", " ")}</dt>
                  <dd>
                    {field.status === "ready"
                      ? String(
                          "value" in field ? field.value : "linked",
                        )
                      : field.status === "conflict"
                        ? "Two accepted sources disagree. You decide."
                        : field.status === "not_required"
                          ? "Not required"
                          : "Not linked yet"}
                    {field.active &&
                    field.status === "missing" &&
                    field.field !== "preferred_contact_email" ? (
                      <>
                        {" "}
                        {draft.claims
                          .filter((claim) => claim.kind === field.field)
                          .map((claim) => (
                            <button
                              key={claim.claimHandle}
                              type="button"
                              onClick={() =>
                                bindEvidence(field.field, claim.claimHandle)
                              }
                            >
                              Link {claim.document} record
                            </button>
                          ))}
                      </>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="sources-heading">
            <h2 id="sources-heading">Synthetic sources</h2>
            <ul>
              {draft.documents.map((document) => (
                <li key={document.code}>{document.title}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
