"use client";

import { ReadUnavailableSchema } from "../contracts/outcomes.ts";
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

function unavailableResult(): unknown {
  return ReadUnavailableSchema.parse({
    ok: false,
    error: {
      code: "temporarily_unavailable",
      message: "CiteApply is temporarily unavailable.",
      supportReference: "CA-00000000",
      safeActions: ["use_visible_application"],
    },
  });
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
): CiteApplyToolDispatch {
  return (async <K extends ToolName, I extends ToolInputByName[K]>(
    name: K,
    input: I,
    options: Readonly<{ signal: AbortSignal }>,
  ): Promise<unknown> => {
    const body = JSON.stringify({ tool: name, input });
    if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
      return unavailableResult();
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
      return unavailableResult();
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("application/json")) {
      return unavailableResult();
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      return unavailableResult();
    }
  }) as CiteApplyToolDispatch;
}
