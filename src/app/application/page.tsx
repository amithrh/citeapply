"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  HumanDraftV1,
  HumanReviewV1,
  HumanSnapshotV1,
} from "../../contracts/http.ts";
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

const CONFLICT_REASONS = [
  { value: "more_recent", label: "This source is more recent" },
  { value: "corrected_record", label: "This source is the corrected record" },
  {
    value: "confirmed_for_application",
    label: "I confirm this figure for the application",
  },
] as const;

type ReceiptRecord = Readonly<{
  receiptId: string;
  submittedAt: string;
  acceptedApplicationRevision: number;
  acceptedReview: HumanReviewV1;
}>;

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

function fieldLabel(field: string): string {
  return field.replaceAll("_", " ");
}

export default function ApplicationPage() {
  const authorityRef = useRef<Authority>(INITIAL_AUTHORITY);
  const [snapshot, setSnapshot] = useState<HumanSnapshotV1 | null>(null);
  const [assistance, setAssistance] = useState<
    "off" | "allowed" | "unavailable"
  >("off");
  const [notice, setNotice] = useState("Checking latest state…");
  const [bridgeStatus, setBridgeStatus] = useState("not registered");
  const [emailDraft, setEmailDraft] = useState("anaya.rao@example.test");
  const [reason, setReason] = useState<string>("more_recent");
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const adoptSnapshot = useCallback((next: HumanSnapshotV1) => {
    authorityRef.current = {
      ...authorityRef.current,
      expectedPageEpoch: next.pageEpoch,
      expectedApplicationRevision: next.applicationRevision,
      expectedRequirementsVersion: next.requirementsVersion,
    };
    setSnapshot(next);
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
        setProblem(null);
      } else if (result.error !== undefined) {
        setProblem(result.error.message);
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

  const submit = async (review: HumanReviewV1) => {
    const current = authorityRef.current;
    const result = (await postJson(
      "/api/submission",
      {
        mode: "submit",
        intent: {
          requestId: crypto.randomUUID(),
          expectedPageEpoch: current.expectedPageEpoch,
          expectedApplicationRevision: current.expectedApplicationRevision,
          reviewId: review.reviewId,
          reviewSourceRevision: review.sourceVersions.applicationRevision,
          contentHash: review.contentHash,
        },
      },
      current.pageCapability,
    )) as {
      ok?: boolean;
      data?: { receipt: ReceiptRecord };
      error?: { message: string };
    };

    if (result.ok === true && result.data !== undefined) {
      setReceipt(result.data.receipt);
      setProblem(null);
      setAssistance("off");
    } else if (result.error !== undefined) {
      setProblem(result.error.message);
    }
  };

  const draft: HumanDraftV1 | null =
    snapshot !== null && snapshot.stage === "draft" ? snapshot.view : null;
  const review: HumanReviewV1 | null =
    snapshot !== null && snapshot.stage === "review" ? snapshot.review : null;

  return (
    <main>
      <header>
        <p>Horizon Education Aid — Need-Based Scholarship</p>
        <p>
          <strong>Fictional demo · Synthetic data only</strong>
        </p>
        <h1>Application</h1>
        <p role="status" aria-live="polite">
          {notice}
        </p>
        <p>WebMCP: {bridgeStatus}</p>
        {problem === null ? null : <p role="alert">{problem}</p>}
      </header>

      {receipt !== null ? (
        <section aria-labelledby="receipt-heading">
          <h2 id="receipt-heading">Submitted</h2>
          <p>
            Your synthetic application was accepted at {receipt.submittedAt}.
          </p>
          <dl>
            <div>
              <dt>Receipt</dt>
              <dd>{receipt.receiptId}</dd>
            </div>
            <div>
              <dt>Review</dt>
              <dd>{receipt.acceptedReview.shortId}</dd>
            </div>
            <div>
              <dt>Content hash</dt>
              <dd>
                <code>{receipt.acceptedReview.contentHash}</code>
              </dd>
            </div>
          </dl>
          {receipt.acceptedReview.warnings.map((warning) => (
            <p key={warning.code}>{warning.message}</p>
          ))}
        </section>
      ) : review !== null ? (
        <section aria-labelledby="review-heading">
          <h2 id="review-heading">Review before submitting</h2>
          <p>
            This frozen review is exactly what will be submitted. Assisted
            access is closed while you review it.
          </p>
          <p>
            Review {review.shortId} · content hash{" "}
            <code>{review.contentHash.slice(0, 16)}…</code>
          </p>
          {review.warnings.map((warning) => (
            <p key={warning.code} role="note">
              {warning.message}
            </p>
          ))}
          <dl>
            {review.diffs.map((diff) => (
              <div key={diff.field}>
                <dt>{fieldLabel(diff.field)}</dt>
                <dd>
                  {String("value" in diff.final ? diff.final.value : "")}
                  {diff.excerpts.length === 0 ? null : (
                    <ul>
                      {diff.excerpts.map((excerpt) => (
                        <li key={excerpt.claimHandle}>
                          {excerpt.title}: “{excerpt.excerpt}”
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <button type="button" onClick={() => void submit(review)}>
            Submit this application
          </button>
          <button
            type="button"
            onClick={() => void runAction({ action: "return_to_draft" })}
          >
            Return to draft
          </button>
        </section>
      ) : draft === null ? (
        <p>Loading the saved application…</p>
      ) : (
        <>
          <ApplicationController
            consent={consentPort}
            initialAssistance={assistance}
          />

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
            <button
              type="button"
              onClick={() => void runAction({ action: "prepare_review" })}
            >
              Prepare review
            </button>
          </section>

          <section aria-labelledby="fields-heading">
            <h2 id="fields-heading">Answers</h2>
            <dl>
              {draft.fields.map((field) => (
                <div key={field.field}>
                  <dt>{fieldLabel(field.field)}</dt>
                  <dd>
                    {field.status === "ready"
                      ? String("value" in field ? field.value : "linked")
                      : field.status === "needs_declaration"
                        ? `${field.value} — not yet declared`
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
                                void runAction({
                                  action: "bind_evidence",
                                  field: field.field,
                                  claimHandle: claim.claimHandle,
                                })
                              }
                            >
                              Link {claim.document} record
                            </button>
                          ))}
                      </>
                    ) : null}

                    {field.field === "preferred_contact_email" ? (
                      <>
                        {" "}
                        <label>
                          <span>Synthetic .test email</span>
                          <input
                            type="email"
                            value={emailDraft}
                            onChange={(event) =>
                              setEmailDraft(event.target.value)
                            }
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction({
                              action: "save_email",
                              value: emailDraft,
                            })
                          }
                        >
                          Save email
                        </button>
                        {field.status === "needs_declaration" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void runAction({ action: "declare_email" })
                            }
                          >
                            I declare this is my address
                          </button>
                        ) : null}
                      </>
                    ) : null}

                    {field.field === "annual_household_income" &&
                    field.status === "conflict" ? (
                      <div>
                        <p>
                          CiteApply will not choose between these. Pick the
                          source you stand behind.
                        </p>
                        <label>
                          <span>Why this source</span>
                          <select
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                          >
                            {CONFLICT_REASONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        {draft.claims
                          .filter(
                            (claim) => claim.kind === "annual_household_income",
                          )
                          .map((claim) => (
                            <button
                              key={claim.claimHandle}
                              type="button"
                              onClick={() =>
                                void runAction({
                                  action: "resolve_income",
                                  claimHandle: claim.claimHandle,
                                  reason,
                                })
                              }
                            >
                              Use {claim.document}:{" "}
                              {String(claim.normalizedValue)}
                            </button>
                          ))}
                      </div>
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
