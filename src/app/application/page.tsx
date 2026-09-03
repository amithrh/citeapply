"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  HumanSnapshotV1Schema,
  type HumanDraftV1,
  type HumanReviewV1,
  type HumanSnapshotV1,
} from "../../contracts/http.ts";
import { ASSISTED_ACCESS_CATALOG } from "../../ui/components/consent.tsx";
import { ApplicationController } from "../../ui/controllers/application.tsx";
import { CoachStrip, FillChoice } from "../../ui/site/first-run.tsx";
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
 * The three stages of one application, in order, so the page can say which
 * ones are behind the applicant. Both crossings are one-way: preparing a
 * review freezes the draft, and submitting accepts the review.
 */
const STAGES = [
  { id: "draft", label: "Draft" },
  { id: "review", label: "Review" },
  { id: "receipt", label: "Submitted" },
] as const;

const STAGE_ORDER: readonly ("draft" | "review" | "receipt")[] = [
  "draft",
  "review",
  "receipt",
];

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
  schema?: string;
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

/**
 * Values are stored and hashed exactly as the sources produced them. These
 * helpers change only what a person reads: nothing here touches the canonical
 * content, the review hash, or anything the agent receives.
 */
const LABEL_ACRONYMS: Readonly<Record<string, string>> = { id: "ID" };

/** Sentence case, so a row reads as a question rather than a database column. */
function fieldLabel(field: string): string {
  const words = field.split("_").map((word) => LABEL_ACRONYMS[word] ?? word);
  const [first, ...rest] = words;
  if (first === undefined) return field;
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(" ");
}

const INSTANT = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "long",
  timeStyle: "short",
});

/** A submission time a person can read, from the instant that was stored. */
function instantLabel(instant: string): string {
  const parsed = new Date(instant);
  return Number.isNaN(parsed.getTime()) ? instant : INSTANT.format(parsed);
}

const RUPEES = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Money as money, yes/no as Yes/No, everything else as the source wrote it. */
function displayValue(field: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (field === "annual_household_income" && typeof value === "number") {
    return RUPEES.format(value);
  }
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return String(value);
}

/** The claim handles a saved answer rests on, in the order it cites them. */
function citedHandles(field: HumanDraftV1["fields"][number]): readonly string[] {
  if (field.status !== "ready") return [];
  if ("bindings" in field) {
    return field.bindings.map(({ claimHandle }) => claimHandle);
  }
  if ("resolution" in field && typeof field.resolution !== "string") {
    return [field.resolution.chosen.claimHandle];
  }
  return [];
}

/** The record's own title, so a candidate is named before it is chosen. */
function documentTitle(draft: HumanDraftV1, code: string): string {
  return draft.documents.find((document) => document.code === code)?.title ?? code;
}

/** Keeps the visible list bounded; a session cannot outgrow the panel. */
const MAX_ACTIVITY_ENTRIES = 40;

/**
 * A refusal carries as much meaning as an acceptance here, so both are named
 * in words rather than left as a bare code.
 */
function outcomeLabel(outcome: string): string {
  if (outcome === "ok") return "accepted";
  return outcome.replaceAll("_", " ");
}

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

const REASON_PROSE: Readonly<Record<string, string>> = {
  more_recent: "it is the more recent source",
  corrected_record: "it is the corrected record",
  confirmed_for_application: "you confirmed this figure for the application",
};

/**
 * One row of a frozen document. Where the applicant resolved a disagreement,
 * the row says so in their words: which record they stood behind, why, and
 * which record they set aside — both excerpts stay, so a reader can check the
 * decision rather than take the winning number on trust.
 */
function FrozenRow({
  diff,
}: Readonly<{ diff: HumanReviewV1["diffs"][number] }>) {
  const final = diff.final;
  const resolution =
    "resolution" in final && typeof final.resolution !== "string"
      ? final.resolution
      : null;
  return (
    <div>
      <dt>{fieldLabel(diff.field)}</dt>
      <dd>
        <span className="answer">
          {"value" in final ? displayValue(diff.field, final.value) : ""}
        </span>
        {resolution === null ? null : (
          <p className="resolved">
            You chose the {expectedTitleOf(resolution.chosen.document)} because{" "}
            {REASON_PROSE[resolution.reason] ?? resolution.reason}.
          </p>
        )}
        {diff.excerpts.length === 0 ? null : (
          <ul data-resolved={resolution === null ? undefined : true}>
            {diff.excerpts.map((excerpt) => (
              <li
                key={excerpt.claimHandle}
                data-chosen={
                  resolution === null
                    ? undefined
                    : excerpt.claimHandle === resolution.chosen.claimHandle ||
                      undefined
                }
              >
                {excerpt.title}: “{excerpt.excerpt}”
              </li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}

/** The record title a binding's document code stands for. */
function expectedTitleOf(document: string): string {
  switch (document) {
    case "enrollment":
      return "Synthetic Enrollment Record";
    case "household":
      return "Synthetic Household Statement";
    default:
      return "Synthetic Income Statement";
  }
}

export default function ApplicationPage() {
  const authorityRef = useRef<Authority>(INITIAL_AUTHORITY);
  const [snapshot, setSnapshot] = useState<HumanSnapshotV1 | null>(null);
  const [webmcpUnavailable, setWebmcpUnavailable] = useState(false);
  const [established, setEstablished] = useState(false);
  const [notice, setNotice] = useState("Checking latest state…");
  const [bridgeStatus, setBridgeStatus] = useState("not registered");
  const [emailDraft, setEmailDraft] = useState("anaya.rao@example.test");
  // Deliberately empty. The frozen Review and the receipt both quote this back
  // as the applicant's own words — "You chose the Synthetic Income Statement
  // because it is the more recent source." — so the product must never pick it
  // for them. An unselected placeholder is the only honest default.
  const [reason, setReason] = useState<string>("");
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
  const [deliveryBusy, setDeliveryBusy] = useState<"json" | "print" | null>(
    null,
  );
  const [deliveryProblem, setDeliveryProblem] = useState<string | null>(null);
  /**
   * The server, not this page, decides which tab owns the session: opening
   * /application in a second tab takes the page epoch with it, and every call
   * from the superseded tab is then answered `stale_page`. A tab that has been
   * told that must stop claiming to be current — it has no authority left, its
   * assisted access is gone, and every mutating control it still shows would
   * only be refused. This latches on the first such refusal and is cleared
   * only by a reload, because a reload is the only thing that can win the
   * session back.
   */
  const [stale, setStale] = useState(false);

  const noteOutcome = useCallback((code: unknown) => {
    if (code === "stale_page") setStale(true);
  }, []);

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
    )) as {
      ok?: boolean;
      data?: { snapshot?: unknown };
      error?: { code?: string };
    };
    if (result.ok !== true) {
      noteOutcome(result.error?.code);
      return;
    }
    const parsed = HumanSnapshotV1Schema.safeParse(result.data?.snapshot);
    if (parsed.success) adoptSnapshot(parsed.data);
  }, [adoptSnapshot, noteOutcome]);

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

  const recordActivity = useCallback(
    (entry: AssistedActivityEntry) => {
      // A tool call is the other route by which this tab learns it is stale.
      noteOutcome(entry.outcome);
      setActivity((entries) => [...entries, entry].slice(-MAX_ACTIVITY_ENTRIES));
    },
    [noteOutcome],
  );

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
        noteOutcome(result.error.code);
        setProblem(result.error.message);
      }
      return result;
    },
    [adoptSnapshot, noteOutcome],
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

  /**
   * Screen, file, and print are three presentations of one stored record.
   * Both delivery controls re-read `/api/receipt`, so the file a judge saves
   * and the page they saved it from are the same accepted submission — the
   * export modes write nothing and cannot alter what was accepted.
   */
  const loadDelivery = useCallback(
    async (mode: "export_json" | "prepare_print"): Promise<unknown | null> => {
      const result = (await postJson(
        "/api/receipt",
        { mode },
        authorityRef.current.pageCapability,
      )) as {
        ok?: boolean;
        data?: { delivery?: { receipt?: unknown } };
        error?: { message?: string };
      };
      if (result.ok === true && result.data?.delivery?.receipt !== undefined) {
        return result.data.delivery.receipt;
      }
      setDeliveryProblem(
        result.error?.message ??
          "CiteApply could not read this receipt. Try again in a moment.",
      );
      return null;
    },
    [],
  );

  const downloadReceiptJson = useCallback(
    async (receiptId: string) => {
      setDeliveryBusy("json");
      setDeliveryProblem(null);
      try {
        const record = await loadDelivery("export_json");
        if (record === null) return;
        const url = URL.createObjectURL(
          new Blob([`${JSON.stringify(record, null, 2)}\n`], {
            type: "application/json",
          }),
        );
        const anchorElement = document.createElement("a");
        anchorElement.href = url;
        anchorElement.download = `citeapply-receipt-${receiptId}.json`;
        document.body.append(anchorElement);
        anchorElement.click();
        anchorElement.remove();
        URL.revokeObjectURL(url);
      } finally {
        setDeliveryBusy(null);
      }
    },
    [loadDelivery],
  );

  const printReceipt = useCallback(async () => {
    setDeliveryBusy("print");
    setDeliveryProblem(null);
    try {
      const record = await loadDelivery("prepare_print");
      if (record === null) return;
      window.print();
    } finally {
      setDeliveryBusy(null);
    }
  }, [loadDelivery]);

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
  // A superseded tab has none, whatever it was last told, so `stale` wins.
  const openDisclosureRef = useRef<(() => void) | null>(null);
  const handleControllerReady = useCallback(
    (api: Readonly<{ openDisclosure: () => void }>) => {
      openDisclosureRef.current = api.openDisclosure;
    },
    [],
  );

  const assistance: "off" | "allowed" | "unavailable" = stale
    ? "off"
    : webmcpUnavailable
      ? "unavailable"
      : assistanceOf(snapshot);
  /**
   * The applicant moves through three stages on one URL, and until now the
   * page's own heading and tab title said "Application" at every one of them —
   * so a screen-reader user, a tab-strip scan and a recorded demo all lost the
   * single most important piece of orientation the page has. The stage names
   * are the ones already on screen, so the heading, the title and the
   * product's own vocabulary stay one thing.
   */
  const stage: "draft" | "review" | "receipt" =
    receipt !== null ? "receipt" : review !== null ? "review" : "draft";
  const stageHeading =
    stage === "receipt"
      ? "Submitted"
      : stage === "review"
        ? "Review before submitting"
        : "Application";

  useEffect(() => {
    document.title = `${stageHeading} — CiteApply`;
  }, [stageHeading]);

  const statusLine = stale
    ? "This page is no longer current. Reload to continue."
    : established
      ? assistance === "allowed"
        ? "This page is current. Assisted access is allowed."
        : "This page is current. Assisted access is off."
      : notice;

  /**
   * The tool-call ledger — refusals rendered exactly like acceptances, with the
   * outcome badge and the versions the server returned. It is the most
   * persuasive thing on the page and it used to sit at the very bottom, below
   * the fold, so the moment an agent acted there was nothing on screen to see.
   * On the draft it is now handed to ApplicationController as children, which
   * places it directly beneath "Assisted access" and above the answers: the
   * claim and its evidence, adjacent. On the frozen Review and the receipt —
   * where there is no Assisted access section — it stays at the foot of the
   * page, so the transcript still survives the whole journey.
   */
  const activityPanel = (
    <section
      className="activity-panel"
      aria-labelledby="assisted-activity-heading"
      data-print="hide"
    >
      <h2 id="assisted-activity-heading">Assisted activity</h2>
      <p>
        Every tool call this page answered, with the outcome the server
        returned. A refusal is listed exactly like an acceptance.
      </p>
      {activity.length === 0 ? (
        <p className="empty">
          No assisted tool calls yet. Allow assisted access, then ask your
          assistant to read this application.
        </p>
      ) : (
        <ol className="activity">
          {[...activity].reverse().map((entry) => (
            <li key={entry.sequence} data-outcome={entry.outcome}>
              <span className="line">
                <code>{entry.tool}</code>
                <strong className="badge">
                  {outcomeLabel(entry.outcome)}
                </strong>
              </span>
              <span className="meta">
                <time dateTime={entry.at}>{activityTime(entry.at)}</time>
                {entry.applicationRevision === null
                  ? null
                  : ` · revision ${entry.applicationRevision}`}
                {entry.requirementsVersion === null
                  ? null
                  : ` · requirements v${entry.requirementsVersion}`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );

  return (
    /* The draft is a workspace and needs the width; the frozen review and the
       receipt are documents and keep the reading measure. */
    <main className={stage === "draft" ? "portal portal-wide" : "portal"}>
      <header>
        <p>Horizon Education Aid — Need-Based Scholarship</p>
        <p>
          <strong>Fictional demo · Synthetic data only</strong>
        </p>
        <h1 id="stage-heading" data-stage={stage}>
          {stageHeading}
        </h1>
        {/*
          Three stages on one URL, two of them one-way. The heading says where
          you are; this says where that is in the whole thing, and which steps
          are already behind you.
        */}
        <ol className="stages" aria-label="Application stages" data-print="hide">
          {STAGES.map((entry) => (
            <li
              key={entry.id}
              data-state={
                entry.id === stage
                  ? "current"
                  : STAGE_ORDER.indexOf(entry.id) < STAGE_ORDER.indexOf(stage)
                    ? "done"
                    : "todo"
              }
              aria-current={entry.id === stage ? "step" : undefined}
            >
              {entry.label}
            </li>
          ))}
        </ol>
        <p role="status" aria-live="polite" data-stale={stale || undefined}>
          {statusLine} WebMCP: {bridgeStatus}.
        </p>
        {stale ? (
          <p className="stale-recovery" data-print="hide">
            Another tab took over this synthetic session, so this page can no
            longer act on it. Nothing you have saved is lost.{" "}
            <button
              type="button"
              className="primary"
              onClick={() => window.location.reload()}
            >
              Reload this page
            </button>
          </p>
        ) : null}
        {problem === null ? null : <p role="alert">{problem}</p>}
      </header>


      {receipt !== null ? (
        <section className="receipt" aria-labelledby="stage-heading">
          <p>
            Horizon Education Aid accepted this synthetic application on{" "}
            {instantLabel(receipt.submittedAt)}.
          </p>
          {receipt.acceptedReview.warnings.map((warning) => (
            <p key={warning.code} role="note">
              {warning.message}
            </p>
          ))}

          <dl className="identifiers">
            <div>
              <dt>Receipt</dt>
              <dd>
                <code>{receipt.receiptId}</code>
              </dd>
            </div>
            <div>
              <dt>Accepted review</dt>
              <dd>
                <code>{receipt.acceptedReview.shortId}</code>
              </dd>
            </div>
            <div>
              <dt>Content hash</dt>
              <dd>
                <code>{receipt.acceptedReview.contentHash}</code>
              </dd>
            </div>
          </dl>

          <h3>Accepted answers</h3>
          <dl>
            {receipt.acceptedReview.diffs.map((diff) => (
              <FrozenRow key={diff.field} diff={diff} />
            ))}
          </dl>

          <div className="delivery" data-print="hide">
            {deliveryProblem === null ? null : (
              <p role="alert">{deliveryProblem}</p>
            )}
            <button
              type="button"
              aria-busy={deliveryBusy === "json" || undefined}
              onClick={() => void downloadReceiptJson(receipt.receiptId)}
            >
              {deliveryBusy === "json" ? "Preparing JSON…" : "Download JSON"}
            </button>
            <button
              type="button"
              aria-busy={deliveryBusy === "print" || undefined}
              onClick={() => void printReceipt()}
            >
              {deliveryBusy === "print" ? "Preparing print…" : "Print"}
            </button>
            <Link href="/">Start a new synthetic demo</Link>
          </div>
        </section>
      ) : review !== null ? (
        <section className="frozen" aria-labelledby="stage-heading">
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
              <FrozenRow key={diff.field} diff={diff} />
            ))}
          </dl>
          <button
            type="button"
            className="primary"
            disabled={stale}
            onClick={() => void submit(review)}
          >
            Submit this application
          </button>
          <button
            type="button"
            disabled={stale}
            onClick={() => void runAction({ action: "return_to_draft" })}
          >
            Return to draft
          </button>
        </section>
      ) : submitted !== null ? (
        <p className="waiting" role="status" aria-live="polite">
          <strong>Fetching your receipt</strong>
          The application is submitted. CiteApply is reading back the accepted
          record so you can download or print it.
        </p>
      ) : draft === null ? (
        <p className="waiting" role="status" aria-live="polite">
          <strong>Opening your application</strong>
          CiteApply is parsing this packet&apos;s three synthetic records and
          loading whatever you have already saved. This takes a moment on the
          first view.
        </p>
      ) : (
        <>
        <CoachStrip assisted={assistance === "allowed"} />
        <FillChoice
          assisted={assistance === "allowed"}
          stale={stale}
          onAskForHelp={() => openDisclosureRef.current?.()}
        />
        <div className="workspace">
          <div className="workspace-rail">
          <ApplicationController
            consent={consentPort}
            key={assistance}
            initialAssistance={assistance}
            stale={stale}
            onReady={handleControllerReady}
          >
            {activityPanel}
          </ApplicationController>

          <section className="boundary" aria-labelledby="boundary-heading">
            <h2 id="boundary-heading">Where the assistant stops</h2>
            <div className="boundary-columns">
              <div className="may">
                <h3>What the assistant may do</h3>
                <ul>
                  {ASSISTED_ACCESS_CATALOG.permittedActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
              <div className="only-you">
                <h3>What only you can do</h3>
                <ul>
                  {ASSISTED_ACCESS_CATALOG.excludedActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
          </div>

          <div className="workspace-main">
          <section aria-labelledby="progress-heading">
            <h2 id="progress-heading">Readiness</h2>
            <p className="progress">
              {draft.progress.ready} of {draft.progress.total} required answers
              are ready.
            </p>
            <div
              className="gauge"
              aria-hidden="true"
              data-complete={
                draft.progress.ready === draft.progress.total || undefined
              }
            >
              <span
                style={{
                  width: `${Math.round(
                    (draft.progress.ready / draft.progress.total) * 100,
                  )}%`,
                }}
              />
            </div>
            {draft.blockers.length === 0 ? (
              <p className="clear">Nothing is blocking Review.</p>
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
              disabled={stale}
              onClick={() => void runAction({ action: "prepare_review" })}
            >
              Prepare review
            </button>
          </section>

          <section aria-labelledby="fields-heading">
            <h2 id="fields-heading">Answers</h2>
            <p className="section-lead">
              Every control below is yours, with or without an assistant. Nothing
              here is hidden while assisted access is off — that is simply the
              application, filled in by hand.
            </p>
            <dl>
              {draft.fields.map((field) => (
                <div key={field.field}>
                  <dt>{fieldLabel(field.field)}</dt>
                  <dd>
                    {field.status === "ready"
                      ? "value" in field
                        ? displayValue(field.field, field.value)
                        : "Linked"
                      : field.status === "needs_declaration"
                        ? `${field.value} — not yet declared`
                        : field.status === "conflict"
                          ? "Two accepted sources disagree. You decide."
                          : field.status === "not_required"
                            ? "Not required"
                            : "Not linked yet"}

                    {citedHandles(field).length === 0 ? null : (
                      <ul>
                        {citedHandles(field).map((claimHandle) => {
                          const source = excerpts[claimHandle];
                          return (
                            <li key={claimHandle}>
                              {source === undefined
                                ? "Loading the source record…"
                                : `${source.title}: “${source.excerpt}”`}
                            </li>
                          );
                        })}
                      </ul>
                    )}

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
                              disabled={stale}
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
                          <span>Synthetic .test email address</span>
                          <input
                            type="email"
                            disabled={stale}
                            value={emailDraft}
                            onChange={(event) =>
                              setEmailDraft(event.target.value)
                            }
                          />
                        </label>
                        <button
                          type="button"
                          disabled={stale}
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
                            disabled={stale}
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
                        <label className="reason-choice">
                          <span>Why you chose this source</span>
                          <select
                            value={reason}
                            required
                            disabled={stale}
                            aria-describedby="reason-hint"
                            onChange={(event) => setReason(event.target.value)}
                          >
                            <option value="">
                              Choose a reason before you decide…
                            </option>
                            {CONFLICT_REASONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <p id="reason-hint" className="reason-hint">
                          {reason === ""
                            ? "Choose a reason to enable the two buttons below. The review and the receipt will quote it back as your reason, so CiteApply will not pick one for you."
                            : "This reason is recorded on the review and the receipt as yours."}
                        </p>
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
                                    Reads as{" "}
                                    {displayValue(
                                      claim.kind,
                                      claim.normalizedValue,
                                    )}
                                  </p>
                                  <button
                                    type="button"
                                    disabled={stale || reason === ""}
                                    aria-describedby="reason-hint"
                                    onClick={() => {
                                      if (reason === "") return;
                                      void runAction({
                                        action: "resolve_income",
                                        claimHandle: claim.claimHandle,
                                        reason,
                                      });
                                    }}
                                  >
                                    Use the {title}
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
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
          </div>
        </div>
        </>
      )}

      {stage === "draft" ? null : activityPanel}
    </main>
  );
}
