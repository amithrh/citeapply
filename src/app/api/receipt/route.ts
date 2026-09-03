import { ReceiptRequestSchema } from "../../../contracts/http.ts";
import { lockApplicationBySessionDigest } from "../../../server/db/applications.ts";
import { getDatabasePool } from "../../../server/db/pool.ts";
import { withReadCommittedTransaction } from "../../../server/db/transactions.ts";
import { finalizeAuthority } from "../../../server/security/capabilities.ts";
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
} from "../../../server/security/origin.ts";
import {
  readSessionCredential,
  sessionCredentialDigest,
} from "../../../server/security/session.ts";
import { runPublicTransportThrottle } from "../../../server/security/throttle.ts";
import { loadReceipt } from "../../../server/services/submission.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 4096;

async function readJsonBody(request: Request): Promise<unknown | null> {
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function failure(
  status: number,
  code: string,
  message: string,
  safeAction: string,
): Response {
  return privateJsonResponse(
    { ok: false, error: { code, message, safeActions: [safeAction] } },
    { status },
  );
}

/**
 * Reads the accepted submission's receipt. Every mode returns the same stored
 * record and writes nothing, so exporting cannot alter what was accepted.
 */
async function handlePost(request: Request): Promise<Response> {
  const policy = loadOriginPolicy();
  try {
    assertAllowedMethod(request.method, ["POST"]);
    requireSameOriginMutation(request.url, request.headers, policy);
    assertJsonContentType(request.headers);
  } catch (error) {
    if (error instanceof RequestOriginError) {
      return failure(
        403,
        "stale_page",
        "This page is no longer current.",
        "reload_current_application",
      );
    }
    throw error;
  }

  const throttle = await runPublicTransportThrottle(
    getDatabasePool(),
    "receipt",
  );
  if (!throttle.ok) {
    const response = failure(
      429,
      "rate_limited",
      "Please wait before trying again.",
      "try_again_after_delay",
    );
    response.headers.set("Retry-After", String(throttle.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request);
  const parsed = ReceiptRequestSchema.safeParse(body);
  if (body === null || !parsed.success) {
    return failure(
      400,
      "invalid_request",
      "The request is not valid.",
      "use_visible_application",
    );
  }

  const credential = readSessionCredential(request.headers.get("cookie"));
  const sessionDigest =
    credential === null ? null : sessionCredentialDigest(credential);
  if (sessionDigest === null) {
    return failure(
      403,
      "session_expired",
      "This synthetic session has expired.",
      "start_new_synthetic_demo",
    );
  }

  const keyring = deriveKeyring();
  const pageCapability = request.headers.get("x-citeapply-page");

  const result = await withReadCommittedTransaction(
    getDatabasePool(),
    async (client) => {
      const application = await lockApplicationBySessionDigest(
        client,
        sessionDigest,
      );
      const authority = await finalizeAuthority(
        client,
        keyring,
        application,
        "page",
        { pageCapability },
      );
      if (!authority.ok) return { kind: authority.code } as const;
      if (application === null) return { kind: "session_expired" } as const;

      const receipt = await loadReceipt(client, application);
      if (receipt === null) return { kind: "unavailable" } as const;
      return {
        kind: "receipt",
        receipt,
        expiresAt: authority.clock.expiresAt,
        serverNow: authority.clock.serverNow,
      } as const;
    },
  );

  switch (result.kind) {
    case "session_expired":
      return failure(
        403,
        "session_expired",
        "This synthetic session has expired.",
        "start_new_synthetic_demo",
      );
    case "stale_page":
    case "consent_required":
      return failure(
        403,
        "stale_page",
        "This page is no longer current.",
        "reload_current_application",
      );
    case "unavailable":
      return failure(
        409,
        "stale_state",
        "The saved application changed.",
        "reread_state_and_requirements",
      );
    default:
      return privateJsonResponse({
        ok: true,
        data: {
          kind: "receipt",
          mode: parsed.data.mode,
          delivery: {
            receipt: result.receipt,
            expiresAt: result.expiresAt,
            serverNow: result.serverNow,
          },
        },
      });
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
      "Your submission remains accepted, but the receipt could not be loaded.",
      "load_receipt_again",
    );
  }
}
