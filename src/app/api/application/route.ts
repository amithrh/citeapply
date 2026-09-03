import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { ApplicationRequestSchema } from "../../../contracts/http.ts";
import { lockApplicationBySessionDigest } from "../../../server/db/applications.ts";
import { listOperations } from "../../../server/db/operations.ts";
import { findCurrentReview } from "../../../server/db/reviews.ts";
import { getDatabasePool } from "../../../server/db/pool.ts";
import { withReadCommittedTransaction } from "../../../server/db/transactions.ts";
import {
  finalizeAuthority,
  finalizeBootstrapChallenge,
  issueBootstrapChallenge,
} from "../../../server/security/capabilities.ts";
import {
  infrastructureUnavailable,
  privateJsonResponse,
} from "../../../server/security/headers.ts";
import { deriveKeyring, sha256 } from "../../../server/security/keys.ts";
import {
  RequestOriginError,
  assertAllowedMethod,
  assertJsonContentType,
  loadOriginPolicy,
  requireSameOriginMutation,
} from "../../../server/security/origin.ts";
import {
  readSessionCredential,
  sessionCredentialDigest,
} from "../../../server/security/session.ts";
import { runPublicTransportThrottle } from "../../../server/security/throttle.ts";
import { runPageTakeover } from "../../../server/services/actions.ts";
import {
  currentPageCapability,
  projectActivity,
  parsedPacketOf,
  projectEvidenceExcerpt,
  projectHumanSnapshot,
  projectTakeoverSnapshot,
} from "../../../server/services/application.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 4096;

/** Reads a bounded JSON body; a malformed or oversized body is never thrown. */
async function readJsonBody(request: Request): Promise<unknown | null> {
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function failure(status: number, body: unknown): Response {
  return privateJsonResponse(body, { status });
}

function sessionExpired(): Response {
  return failure(403, {
    ok: false,
    error: {
      code: "session_expired",
      message: "This synthetic session has expired.",
      safeActions: ["start_new_synthetic_demo"],
    },
  });
}

function stalePage(): Response {
  return failure(403, {
    ok: false,
    error: {
      code: "stale_page",
      message: "This page is no longer current.",
      safeActions: ["reload_current_application"],
    },
  });
}

function invalidRequest(): Response {
  return failure(400, {
    ok: false,
    error: {
      code: "invalid_request",
      message: "That request was not valid for CiteApply.",
      safeActions: ["reread_state_and_requirements"],
    },
  });
}

async function currentReviewSnapshot(
  client: PoolClient,
  application: Readonly<{ id: string; stage: string }>,
): Promise<unknown> {
  if (application.stage === "draft") return null;
  return (
    (await findCurrentReview(client, application.id))?.reviewSnapshot ?? null
  );
}

async function handlePost(request: Request): Promise<Response> {
  const policy = loadOriginPolicy();
  try {
    assertAllowedMethod(request.method, ["POST"]);
    requireSameOriginMutation(request.url, request.headers, policy);
    assertJsonContentType(request.headers);
  } catch (error) {
    if (error instanceof RequestOriginError) return stalePage();
    throw error;
  }

  const throttle = await runPublicTransportThrottle(
    getDatabasePool(),
    "application",
  );
  if (!throttle.ok) {
    const response = failure(429, {
      ok: false,
      error: {
        code: "rate_limited",
        message: "Too many requests. Try again shortly.",
        safeActions: ["try_again_after_delay"],
      },
    });
    response.headers.set("Retry-After", String(throttle.retryAfterSeconds));
    return response;
  }

  const body_ = await readJsonBody(request);
  if (body_ === null) return invalidRequest();
  const parsed = ApplicationRequestSchema.safeParse(body_);
  if (!parsed.success) return invalidRequest();
  const body = parsed.data;

  const credential = readSessionCredential(request.headers.get("cookie"));
  if (credential === null) return sessionExpired();
  const sessionDigest = sessionCredentialDigest(credential);
  if (sessionDigest === null) return sessionExpired();

  const keyring = deriveKeyring();
  const pageCapability = request.headers.get("x-citeapply-page");

  const result = await withReadCommittedTransaction(
    getDatabasePool(),
    async (client) => {
      const application = await lockApplicationBySessionDigest(
        client,
        sessionDigest,
      );

      if (body.mode === "bootstrap_challenge") {
        const challenge = await issueBootstrapChallenge(
          client,
          keyring,
          application,
        );
        if (!challenge.ok) return { status: "session_expired" } as const;
        return { status: "challenge", data: challenge.data } as const;
      }

      if (body.mode === "takeover") {
        const verified = await finalizeBootstrapChallenge(
          client,
          keyring,
          application,
          body.challenge,
        );
        if (!verified.ok) {
          return verified.code === "session_expired"
            ? ({ status: "session_expired" } as const)
            : ({ status: "stale_page" } as const);
        }
        if (application === null) return { status: "session_expired" } as const;
        if (
          application.pageEpoch !== body.expectedPageEpoch ||
          application.revision !== body.expectedApplicationRevision
        ) {
          return { status: "stale_page" } as const;
        }

        const taken = await runPageTakeover(
          client,
          application,
          body.requestId,
          sha256(`${body.requestId} ${randomUUID()}`),
        );
        const authority = await finalizeAuthority(
          client,
          keyring,
          taken,
          "session",
        );
        if (!authority.ok) return { status: "session_expired" } as const;
        return {
          status: "takeover",
          data: {
            kind: "takeover",
            pageCapability: currentPageCapability(keyring, taken),
            snapshot: projectTakeoverSnapshot(
              taken,
              authority.clock,
              projectActivity(await listOperations(client, taken.id)),
              await currentReviewSnapshot(client, taken),
            ),
          },
        } as const;
      }

      const authority = await finalizeAuthority(
        client,
        keyring,
        application,
        "page",
        {
          pageCapability,
        },
      );
      if (!authority.ok) {
        return authority.code === "session_expired"
          ? ({ status: "session_expired" } as const)
          : ({ status: "stale_page" } as const);
      }
      if (application === null) return { status: "session_expired" } as const;

      if (body.mode === "snapshot") {
        return {
          status: "snapshot",
          data: {
            kind: "snapshot",
            snapshot: projectHumanSnapshot(
              application,
              authority.clock,
              projectActivity(await listOperations(client, application.id)),
              await currentReviewSnapshot(client, application),
            ),
          },
        } as const;
      }

      const excerpt = projectEvidenceExcerpt(
        parsedPacketOf(application),
        body.claimHandle,
      );
      if (excerpt === null) return { status: "evidence_unavailable" } as const;
      return {
        status: "evidence_excerpt",
        data: {
          kind: "evidence_excerpt",
          meta: {
            applicationRevision: application.revision,
            requirementsVersion: application.requirementsVersion,
            pageEpoch: application.pageEpoch,
            projectionSequence: Math.min(application.revision, 128),
            expiresAt: authority.clock.expiresAt,
            serverNow: authority.clock.serverNow,
          },
          evidence: excerpt,
        },
      } as const;
    },
  );

  if (result.status === "session_expired") return sessionExpired();
  if (result.status === "stale_page") return stalePage();
  if (result.status === "evidence_unavailable") {
    return failure(409, {
      ok: false,
      error: {
        code: "evidence_unavailable",
        message: "That evidence is not currently available for this field.",
        safeActions: ["reread_state_and_requirements"],
      },
    });
  }
  if (result.status === "challenge") {
    return privateJsonResponse({
      ok: true,
      data: { kind: "challenge", ...result.data },
    });
  }
  return privateJsonResponse({ ok: true, data: result.data });
}

/**
 * Infrastructure failure boundary: an unreachable database must answer with a
 * readable outcome, not a bare 500 with an empty body.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    return await handlePost(request);
  } catch {
    return infrastructureUnavailable(
      "CiteApply could not establish the latest state.",
      "reload_current_application",
    );
  }
}
