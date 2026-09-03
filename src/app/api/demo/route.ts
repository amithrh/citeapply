import {
  DemoStartRequestSchema,
  StartTokenSchema,
} from "../../../contracts/http.ts";
import { getDatabasePool } from "../../../server/db/pool.ts";
import {
  infrastructureUnavailable,
  privateJsonResponse,
} from "../../../server/security/headers.ts";
import { deriveKeyring } from "../../../server/security/keys.ts";
import {
  RequestOriginError,
  assertAllowedMethod,
  assertJsonContentType,
  loadOriginPolicy,
  requireSameOriginMutation,
  requireSameOriginRead,
} from "../../../server/security/origin.ts";
import {
  SESSION_DURATION_MS,
  serializeSessionCookie,
} from "../../../server/security/session.ts";
import { runPublicTransportThrottle } from "../../../server/security/throttle.ts";
import {
  issueStartToken,
  startSyntheticDemo,
} from "../../../server/services/demo.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 8192;

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

function refused(status: number, body: unknown): Response {
  return privateJsonResponse(body, { status });
}

function originRefusal(): Response {
  return refused(403, {
    ok: false,
    error: {
      code: "invalid_request",
      message: "CiteApply could not prepare a synthetic start.",
      safeActions: ["return_to_packet_selection"],
    },
  });
}

function throttled(retryAfterSeconds: number, atCapacity: boolean): Response {
  const response = refused(
    429,
    atCapacity
      ? {
          ok: false,
          error: {
            code: "at_capacity",
            message: "CiteApply is at its synthetic demo capacity.",
            safeActions: ["try_again_after_delay"],
          },
        }
      : {
          ok: false,
          error: {
            code: "rate_limited",
            message: "Too many requests. Try again shortly.",
            safeActions: ["try_again_after_delay"],
          },
        },
  );
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}

async function handleGet(request: Request): Promise<Response> {
  const policy = loadOriginPolicy();
  try {
    assertAllowedMethod(request.method, ["GET"]);
    requireSameOriginRead(request.url, request.headers, policy);
  } catch (error) {
    if (error instanceof RequestOriginError) return originRefusal();
    throw error;
  }

  const throttle = await runPublicTransportThrottle(
    getDatabasePool(),
    "demo_get",
  );
  if (!throttle.ok) {
    return throttled(throttle.retryAfterSeconds, false);
  }

  return privateJsonResponse({
    ok: true,
    data: {
      kind: "start_token",
      startToken: issueStartToken(deriveKeyring(), new Date()),
    },
  });
}

async function handlePost(request: Request): Promise<Response> {
  const policy = loadOriginPolicy();
  try {
    assertAllowedMethod(request.method, ["POST"]);
    requireSameOriginMutation(request.url, request.headers, policy);
    assertJsonContentType(request.headers);
  } catch (error) {
    if (error instanceof RequestOriginError) return originRefusal();
    throw error;
  }

  const throttle = await runPublicTransportThrottle(
    getDatabasePool(),
    "demo_start",
  );
  if (!throttle.ok) {
    return throttled(throttle.retryAfterSeconds, true);
  }

  const body_ = await readJsonBody(request);
  const parsed = DemoStartRequestSchema.safeParse(body_);
  if (body_ === null || !parsed.success) {
    return refused(400, {
      ok: false,
      error: {
        code: "invalid_request",
        message: "CiteApply could not start this synthetic demo.",
        safeActions: ["return_to_packet_selection"],
      },
    });
  }

  const outcome = await startSyntheticDemo(
    getDatabasePool(),
    deriveKeyring(),
    parsed.data.packet,
    StartTokenSchema.parse(parsed.data.startToken),
    parsed.data.requestId,
  );

  if (outcome.kind === "at_capacity") {
    return throttled(60, true);
  }
  if (outcome.kind === "document_unavailable") {
    return refused(503, {
      ok: false,
      error: {
        code: "document_unavailable",
        message: "CiteApply could not read its synthetic records.",
        safeActions: ["return_to_packet_selection"],
      },
    });
  }
  if (outcome.kind !== "started") {
    return refused(409, {
      ok: false,
      error: {
        code:
          outcome.kind === "request_reuse_mismatch"
            ? "request_reuse_mismatch"
            : "invalid_request",
        message: "CiteApply could not start this synthetic demo.",
        safeActions: ["return_to_packet_selection"],
      },
    });
  }

  const response = privateJsonResponse({
    ok: true,
    data: {
      kind: "started",
      destination: "/application",
      expiresAt: outcome.expiresAt,
    },
  });
  response.headers.append(
    "Set-Cookie",
    serializeSessionCookie(
      outcome.sessionCredential,
      outcome.application.createdAt,
      new Date(outcome.application.createdAt.getTime() + SESSION_DURATION_MS),
    ),
  );
  return response;
}

/**
 * Infrastructure failure boundary: an unreachable database must answer with a
 * readable outcome, not a bare 500 with an empty body.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    return await handleGet(request);
  } catch {
    return infrastructureUnavailable(
      "CiteApply could not prepare a synthetic start.",
      "return_to_packet_selection",
    );
  }
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
      "CiteApply could not start this synthetic application.",
      "return_to_packet_selection",
    );
  }
}
