"use client";

import {
  MutationUnavailableSchema,
  ReadUnavailableSchema,
} from "../contracts/outcomes.ts";
import type { ToolInputByName, ToolName } from "../contracts/webmcp.ts";
import type { CiteApplyToolDispatch } from "./descriptors.ts";

const WEBMCP_ENDPOINT = "/api/webmcp";
const MAX_REQUEST_BYTES = 16 * 1_024;

/**
 * Authority never travels inside tool arguments. The page injects its current
 * capabilities per invocation, so an agent cannot forge, replay, or widen them
 * by shaping the tool input.
 */
export type InvocationAuthority = Readonly<{
  pageCapability: string | null;
  consentCapability: string | null;
  localDirty: boolean;
}>;

export type AuthorityReader = () => InvocationAuthority;

/**
 * Outcome of one bridge invocation, as the page observed it. This is a
 * projection of the response the page already received; it carries no
 * capability and grants the agent nothing.
 */
export type AssistedActivityEntry = Readonly<{
  sequence: number;
  tool: ToolName;
  outcome: string;
  at: string;
  applicationRevision: number | null;
  requirementsVersion: number | null;
}>;

/**
 * The page's reconciliation sink. `onMutationProjection` receives the raw
 * `uiSnapshot` from a `mutation_projection` envelope so the visible form can
 * follow server truth without a reload; `onMutationUnprojected` fires when a
 * mutating call returned no projection, so the page can re-read the snapshot
 * the same way it does on load. Both are read-only observers.
 */
export type DispatchObserver = Readonly<{
  onActivity?: (entry: AssistedActivityEntry) => void;
  onMutationProjection?: (uiSnapshot: unknown) => void;
  onMutationUnprojected?: () => void;
}>;

const MUTATING_TOOLS = [
  "apply_evidence_backed_answers",
  "prepare_submission_review",
] as const;

function supportReference(): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let reference = "CA-";
  for (const byte of bytes) reference += alphabet[byte % alphabet.length];
  return reference;
}

/**
 * An uncertain mutation must never be reported as a retry-safe read failure:
 * the effect may already have committed, so the page reconciles instead.
 */
function unavailableResult(tool: ToolName): unknown {
  if ((MUTATING_TOOLS as readonly string[]).includes(tool)) {
    return MutationUnavailableSchema.parse({
      ok: false,
      error: {
        code: "temporarily_unavailable",
        message:
          "CiteApply could not confirm this action. Checking the latest application.",
        supportReference: supportReference(),
        safeActions: ["reconcile_current_state"],
      },
    });
  }
  return ReadUnavailableSchema.parse({
    ok: false,
    error: {
      code: "temporarily_unavailable",
      message: "CiteApply is temporarily unavailable.",
      supportReference: supportReference(),
      safeActions: ["use_visible_application"],
    },
  });
}

type Envelope = Readonly<{
  kind?: unknown;
  uiSnapshot?: unknown;
  callbackResult?: unknown;
}>;

function asEnvelope(value: unknown): Envelope | null {
  return typeof value === "object" && value !== null
    ? (value as Envelope)
    : null;
}

/** Names the outcome a judge sees in the activity list: "ok" or the code. */
function outcomeOf(payload: unknown): string {
  const envelope = asEnvelope(payload);
  const result = asEnvelope(envelope?.callbackResult) ?? asEnvelope(payload);
  if (result === null) return "unknown";
  const candidate = result as { ok?: unknown; error?: { code?: unknown } };
  if (candidate.ok === true) return "ok";
  const code = candidate.error?.code;
  return typeof code === "string" ? code : "unknown";
}

function versionsOf(
  payload: unknown,
): Readonly<{ applicationRevision: number | null; requirementsVersion: number | null }> {
  const snapshot = asEnvelope(asEnvelope(payload)?.uiSnapshot) as {
    applicationRevision?: unknown;
    requirementsVersion?: unknown;
  } | null;
  const applicationRevision = snapshot?.applicationRevision;
  const requirementsVersion = snapshot?.requirementsVersion;
  return {
    applicationRevision:
      typeof applicationRevision === "number" ? applicationRevision : null,
    requirementsVersion:
      typeof requirementsVersion === "number" ? requirementsVersion : null,
  };
}

function requestHeaders(authority: InvocationAuthority): Headers {
  const headers = new Headers({
    "content-type": "application/json",
    "x-citeapply-local-dirty": authority.localDirty ? "1" : "0",
  });
  if (authority.pageCapability !== null) {
    headers.set("x-citeapply-page", authority.pageCapability);
  }
  if (authority.consentCapability !== null) {
    headers.set("x-citeapply-consent", authority.consentCapability);
  }
  return headers;
}

/**
 * Builds the bridge dispatcher. Every result is returned to the caller for
 * contract parsing; this layer never invents a success and never retries, so a
 * mutation is attempted at most once per tool call.
 */
export function createCiteApplyDispatch(
  readAuthority: AuthorityReader,
  fetchImplementation: typeof fetch = fetch,
  observer: DispatchObserver = {},
): CiteApplyToolDispatch {
  let sequence = 0;

  /**
   * Records the call for the visible Assisted activity list and, for a
   * mutating call, hands the page whatever server truth came back so the
   * visible form can reconcile before the tool result reaches the agent.
   */
  const report = (tool: ToolName, payload: unknown): unknown => {
    sequence += 1;
    const versions = versionsOf(payload);
    observer.onActivity?.({
      sequence,
      tool,
      outcome: outcomeOf(payload),
      at: new Date().toISOString(),
      ...versions,
    });
    if ((MUTATING_TOOLS as readonly string[]).includes(tool)) {
      const envelope = asEnvelope(payload);
      if (
        envelope?.kind === "mutation_projection" &&
        envelope.uiSnapshot !== undefined
      ) {
        observer.onMutationProjection?.(envelope.uiSnapshot);
      } else {
        observer.onMutationUnprojected?.();
      }
    }
    return payload;
  };

  return (async <K extends ToolName, I extends ToolInputByName[K]>(
    name: K,
    input: I,
    options: Readonly<{ signal: AbortSignal }>,
  ): Promise<unknown> => {
    const body = JSON.stringify({ tool: name, input });
    if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
      return report(name, unavailableResult(name));
    }

    let response: Response;
    try {
      response = await fetchImplementation(WEBMCP_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        headers: requestHeaders(readAuthority()),
        body,
        signal: options.signal,
      });
    } catch (error) {
      if (options.signal.aborted) throw error;
      return report(name, unavailableResult(name));
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("application/json")) {
      return report(name, unavailableResult(name));
    }

    try {
      return report(name, (await response.json()) as unknown);
    } catch {
      return report(name, unavailableResult(name));
    }
  }) as CiteApplyToolDispatch;
}
