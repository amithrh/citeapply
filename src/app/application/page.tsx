"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  HumanSnapshotV1Schema,
  type HumanDraftV1,
  type HumanReviewV1,
  type HumanSnapshotV1,
} from "../../contracts/http.ts";
import { ApplicationController } from "../../ui/controllers/application.tsx";
import { createCiteApplyBridge } from "../../webmcp/bridge.ts";
import {
  createCiteApplyDispatch,
  type AssistedActivityEntry,
} from "../../webmcp/invoke.ts";

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

/**
 * One candidate source behind a disputed answer, as the applicant sees it:
 * the record it came from and the words that record actually uses. Fetched
 * through the page's own human read channel (`mode: "evidence_excerpt"`), so
 * nothing here is added to, or reachable from, the assisted tool surface.
 */
type SourceExcerpt = Readonly<{
  claimHandle: string;
  title: string;
  excerpt: string;
  normalizedValue: string | number | boolean;
}>;

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

/** The record's own title, so a candidate is named before it is chosen. */
function documentTitle(draft: HumanDraftV1, code: string): string {
  return draft.documents.find((document) => document.code === code)?.title ?? code;
}

/** Keeps the visible list bounded; a session cannot outgrow the panel. */
const MAX_ACTIVITY_ENTRIES = 40;

function activityTime(instant: string): string {
  const parsed = new Date(instant);
  return Number.isNaN(parsed.getTime())
    ? instant
    : parsed.toISOString().slice(11, 19);
}

/**
 * The banner is server truth: a Draft reports its own assistance mode, and any
 * other stage means the server has already closed assisted access.
 */
function assistanceOf(snapshot: HumanSnapshotV1 | null): "off" | "allowed" {
  if (snapshot === null || snapshot.stage !== "draft") return "off";
  return snapshot.view.assistance === "allowed" ? "allowed" : "off";
}

export default function ApplicationPage() {
  const authorityRef = useRef<Authority>(INITIAL_AUTHORITY);
  const [snapshot, setSnapshot] = useState<HumanSnapshotV1 | null>(null);
  const [webmcpUnavailable, setWebmcpUnavailable] = useState(false);
  const [established, setEstablished] = useState(false);
  const [notice, setNotice] = useState("Checking latest state…");
  const [bridgeStatus, setBridgeStatus] = useState("not registered");
  const [emailDraft, setEmailDraft] = useState("anaya.rao@example.test");
  const [reason, setReason] = useState<string>("more_recent");
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [activity, setActivity] = useState<readonly AssistedActivityEntry[]>(
    [],
  );
  const [excerpts, setExcerpts] = useState<
    Readonly<Record<string, SourceExcerpt>>
  >({});
  const [excerptsPending, setExcerptsPending] = useState(false);
  const [excerptsFailed, setExcerptsFailed] = useState(false);

  const adoptSnapshot = useCallback((next: HumanSnapshotV1) => {
    authorityRef.current = {
      ...authorityRef.current,
      expectedPageEpoch: next.pageEpoch,
      expectedApplicationRevision: next.applicationRevision,
      expectedRequirementsVersion: next.requirementsVersion,
      // Assisted access lives on the server. When the server no longer reports
      // an allowed Draft, the page drops its consent capability at once rather
      // than continuing to assert an authority it does not have.
      consentCapability:
        next.stage === "draft" && next.view.assistance === "allowed"
          ? authorityRef.current.consentCapability
          : null,
    };
    setSnapshot(next);
  }, []);

  /**
   * Re-reads the same snapshot the page reads on load. Used whenever a tool
   * call changed server state without returning a projection the page could
   * adopt, so the visible form never lags behind the server.
   */
  const reconcile = useCallback(async () => {
    const result = (await postJson(
      "/api/application",
      { mode: "snapshot" },
      authorityRef.current.pageCapability,
    )) as { ok?: boolean; data?: { snapshot?: unknown } };
    if (result.ok !== true) return;
    const parsed = HumanSnapshotV1Schema.safeParse(result.data?.snapshot);
    if (parsed.success) adoptSnapshot(parsed.data);
  }, [adoptSnapshot]);

  /**
   * Adopts the `uiSnapshot` the server already returned alongside a mutating
   * tool result. It is parsed before it is trusted; an unparsable projection
   * falls back to the plain snapshot re-read.
   */
  const adoptProjection = useCallback(
    (uiSnapshot: unknown) => {
      const parsed = HumanSnapshotV1Schema.safeParse(uiSnapshot);
      if (parsed.success) adoptSnapshot(parsed.data);
      else void reconcile();
    },
    [adoptSnapshot, reconcile],
  );

  const recordActivity = useCallback((entry: AssistedActivityEntry) => {
    setActivity((entries) =>
      [...entries, entry].slice(-MAX_ACTIVITY_ENTRIES),
    );
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
      setEstablished(true);

      const bridge = createCiteApplyBridge(
        createCiteApplyDispatch(
          () => ({
            pageCapability: authorityRef.current.pageCapability,
            consentCapability: authorityRef.current.consentCapability,
            localDirty: false,
          }),
          fetch,
          {
            onActivity: recordActivity,
            onMutationProjection: adoptProjection,
            onMutationUnprojected: () => void reconcile(),
          },
        ),
      );
      const registered = await bridge.registerOnce();
      if (cancelled) return;
      if (registered.registered) {
        const token = bridge.beginActivation();
        if (token !== null) bridge.activate(token);
        setBridgeStatus("six CiteApply tools registered");
      } else {
        setBridgeStatus("WebMCP is unavailable in this browser");
        setWebmcpUnavailable(true);
      }
    };

    void establish();
    return () => {
      cancelled = true;
    };
  }, [adoptSnapshot, adoptProjection, recordActivity, reconcile]);

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
    } else if (result.error !== undefined) {
      setProblem(result.error.message);
    }
  };

  const submitted =
    snapshot !== null && snapshot.stage === "submitted" ? snapshot : null;

  useEffect(() => {
    if (submitted === null || receipt !== null) return;
    let cancelled = false;
    void (async () => {
      const loaded = (await postJson(
        "/api/receipt",
        { mode: "load" },
        authorityRef.current.pageCapability,
      )) as { ok?: boolean; data?: { delivery: { receipt: ReceiptRecord } } };
      if (!cancelled && loaded.ok === true && loaded.data !== undefined) {
        setReceipt(loaded.data.delivery.receipt);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submitted, receipt]);

  /**
   * The evidence an answer rests on belongs beside the answer, and the two
   * disagreeing income excerpts belong at the moment the applicant chooses
   * between them — not afterwards, in the frozen Review. These are read on the
   * page's own capability through the existing human `evidence_excerpt` mode;
   * no tool is added and the assisted surface is unchanged.
   */
  const wantedHandles =
    snapshot === null || snapshot.stage !== "draft"
      ? []
      : snapshot.view.fields.flatMap((field) => {
          if (field.status === "conflict") return [...field.claims];
          if (field.status === "ready" && "bindings" in field) {
            return field.bindings.map(({ claimHandle }) => claimHandle);
          }
          if (
            field.status === "ready" &&
            "resolution" in field &&
            typeof field.resolution !== "string"
          ) {
            return [field.resolution.chosen.claimHandle];
          }
          return [];
        });
  const missingHandles = wantedHandles.filter(
    (handle) => excerpts[handle] === undefined,
  );
  const missingKey = [...new Set(missingHandles)].sort().join(",");

  useEffect(() => {
    if (missingKey === "") {
      setExcerptsPending(false);
      return;
    }
    let cancelled = false;
    setExcerptsPending(true);
    void (async () => {
      const loaded: Record<string, SourceExcerpt> = {};
      let failed = false;
      for (const claimHandle of missingKey.split(",")) {
        const result = (await postJson(
          "/api/application",
          { mode: "evidence_excerpt", claimHandle },
          authorityRef.current.pageCapability,
        )) as { ok?: boolean; data?: { evidence?: SourceExcerpt } };
        const evidence = result.data?.evidence;
        if (result.ok === true && evidence !== undefined) {
          loaded[claimHandle] = evidence;
        } else {
          failed = true;
        }
      }
      if (cancelled) return;
      setExcerpts((current) => ({ ...current, ...loaded }));
      setExcerptsFailed(failed);
      setExcerptsPending(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [missingKey]);

  const draft: HumanDraftV1 | null =
    snapshot !== null && snapshot.stage === "draft" ? snapshot.view : null;
  const review: HumanReviewV1 | null =
    snapshot !== null && snapshot.stage === "review" ? snapshot.review : null;

  // Assisted access is reported by the server, never remembered by this page.
  const assistance: "off" | "allowed" | "unavailable" = webmcpUnavailable
    ? "unavailable"
    : assistanceOf(snapshot);
  const statusLine = established
    ? assistance === "allowed"
      ? "This page is current. Assisted access is allowed."
      : "This page is current. Assisted access is off."
    : notice;

  return (
    <main>
      <header>
        <p>Horizon Education Aid — Need-Based Scholarship</p>
        <p>
          <strong>Fictional demo · Synthetic data only</strong>
        </p>
        <h1>Application</h1>
        <p role="status" aria-live="polite">
          {statusLine}
        </p>
        <p>WebMCP: {bridgeStatus}</p>
        {problem === null ? null : <p role="alert">{problem}</p>}
      </header>

      <section aria-labelledby="assisted-activity-heading">
        <h2 id="assisted-activity-heading">Assisted activity</h2>
        {activity.length === 0 ? (
          <p>No assisted tool calls yet.</p>
        ) : (
          <ol className="activity">
            {activity.map((entry) => (
              <li key={entry.sequence} data-outcome={entry.outcome}>
                <code>{entry.tool}</code> → <strong>{entry.outcome}</strong>{" "}
                <span className="meta">
                  revision{" "}
                  {entry.applicationRevision === null
                    ? "—"
                    : entry.applicationRevision}{" "}
                  · requirements{" "}
                  {entry.requirementsVersion === null
                    ? "—"
                    : entry.requirementsVersion}{" "}
                  · {activityTime(entry.at)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {receipt !== null ? (
        <section className="receipt" aria-labelledby="receipt-heading">
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
        <section className="frozen" aria-labelledby="review-heading">
          <h2 id="review-heading">Review before submitting</h2>
          <p>
            This frozen review is exactly what will be submitted. Assisted
            access is closed while you review it.
          </p>
          <p className="meta">
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
          <button
            type="button"
            className="primary"
            onClick={() => void submit(review)}
          >
            Submit this application
          </button>
          <button
            type="button"
            onClick={() => void runAction({ action: "return_to_draft" })}
          >
            Return to draft
          </button>
        </section>
      ) : submitted !== null ? (
        <p>Loading your receipt…</p>
      ) : draft === null ? (
        <p>Loading the saved application…</p>
      ) : (
        <>
          <ApplicationController
            consent={consentPort}
            key={assistance}
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
              <ul className="blockers">
                {draft.blockers.map((blocker) => (
                  <li key={`${blocker.code}-${blocker.field}`}>
                    {blocker.message}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="primary"
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
                      <div className="decide">
                        <p>
                          CiteApply will not choose between these. Read both
                          records and pick the source you stand behind.
                        </p>
                        {excerptsPending ? (
                          <p role="status" aria-live="polite">
                            Loading both source excerpts…
                          </p>
                        ) : null}
                        {excerptsFailed ? (
                          <p role="alert">
                            Some source excerpts could not be loaded. Reload the
                            page to read them before choosing.
                          </p>
                        ) : null}
                        <ul className="candidates">
                          {draft.claims
                            .filter(
                              (claim) =>
                                claim.kind === "annual_household_income",
                            )
                            .map((claim) => {
                              const source = excerpts[claim.claimHandle];
                              const title =
                                source?.title ??
                                documentTitle(draft, claim.document);
                              return (
                                <li key={claim.claimHandle}>
                                  <p className="candidate-source">{title}</p>
                                  <p className="candidate-excerpt">
                                    {source === undefined
                                      ? "Loading this record’s words…"
                                      : `“${source.excerpt}”`}
                                  </p>
                                  <p className="candidate-value">
                                    Reads as {String(claim.normalizedValue)}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void runAction({
                                        action: "resolve_income",
                                        claimHandle: claim.claimHandle,
                                        reason,
                                      })
                                    }
                                  >
                                    Use the {title}
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
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
