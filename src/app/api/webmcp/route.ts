import { ToolNameSchema } from "../../../contracts/webmcp.ts";
import { getDatabasePool } from "../../../server/db/pool.ts";
import { privateJsonResponse } from "../../../server/security/headers.ts";
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
import { runToolCall } from "../../../server/services/webmcp.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1_024;

function toolFailure(
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
 * The only WebMCP entry point. Tool arguments never carry authority: the page
 * injects its current capabilities as headers, and the server re-validates the
 * tool input against the same Zod schema the descriptor was generated from.
 */
export async function POST(request: Request): Promise<Response> {
  const policy = loadOriginPolicy();
  try {
    assertAllowedMethod(request.method, ["POST"]);
    requireSameOriginMutation(request.url, request.headers, policy);
    assertJsonContentType(request.headers);
  } catch (error) {
    if (error instanceof RequestOriginError) {
      return toolFailure(
        403,
        "stale_page",
        "This page is no longer current.",
        "reload_current_application",
      );
    }
    throw error;
  }

  const throttle = await runPublicTransportThrottle(getDatabasePool(), "webmcp");
  if (!throttle.ok) {
    const response = toolFailure(
      429,
      "rate_limited",
      "Too many requests. Try again shortly.",
      "try_again_after_delay",
    );
    response.headers.set("Retry-After", String(throttle.retryAfterSeconds));
    return response;
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return toolFailure(
      400,
      "invalid_request",
      "That request was not valid for CiteApply.",
      "reread_state_and_requirements",
    );
  }

  let envelope: unknown;
  try {
    envelope = JSON.parse(raw) as unknown;
  } catch {
    return toolFailure(
      400,
      "invalid_request",
      "That request was not valid for CiteApply.",
      "reread_state_and_requirements",
    );
  }

  const tool = ToolNameSchema.safeParse(
    (envelope as { tool?: unknown } | null)?.tool,
  );
  if (!tool.success) {
    return toolFailure(
      400,
      "invalid_request",
      "That request was not valid for CiteApply.",
      "reread_state_and_requirements",
    );
  }

  const credential = readSessionCredential(request.headers.get("cookie"));
  const sessionDigest =
    credential === null ? null : sessionCredentialDigest(credential);

  const result = await runToolCall(
    getDatabasePool(),
    deriveKeyring(),
    { tool: tool.data, input: (envelope as { input?: unknown }).input },
    {
      sessionDigest,
      pageCapability: request.headers.get("x-citeapply-page"),
      consentCapability: request.headers.get("x-citeapply-consent"),
      localDirty: request.headers.get("x-citeapply-local-dirty") === "1",
    },
  );

  const failed = (result as { ok?: unknown }).ok === false;
  return privateJsonResponse(result, { status: failed ? 409 : 200 });
}
