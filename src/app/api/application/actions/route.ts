import { HumanActionRequestSchema } from "../../../../contracts/http.ts";
import { lockApplicationBySessionDigest } from "../../../../server/db/applications.ts";
import { getDatabasePool } from "../../../../server/db/pool.ts";
import { withReadCommittedTransaction } from "../../../../server/db/transactions.ts";
import { finalizeAuthority } from "../../../../server/security/capabilities.ts";
import { privateJsonResponse } from "../../../../server/security/headers.ts";
import { deriveKeyring } from "../../../../server/security/keys.ts";
import {
  RequestOriginError,
  assertAllowedMethod,
  assertJsonContentType,
  loadOriginPolicy,
  requireSameOriginMutation,
} from "../../../../server/security/origin.ts";
import {
  readSessionCredential,
  sessionCredentialDigest,
} from "../../../../server/security/session.ts";
import { runPublicTransportThrottle } from "../../../../server/security/throttle.ts";
import { runHumanAction } from "../../../../server/services/actions.ts";
import { projectHumanSnapshot } from "../../../../server/services/application.ts";

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

function failure(
  status: number,
  code: string,
  message: string,
  safeAction: string,
) {
  return privateJsonResponse(
    { ok: false, error: { code, message, safeActions: [safeAction] } },
    { status },
  );
}

export async function POST(request: Request): Promise<Response> {
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
    "actions",
  );
  if (!throttle.ok) {
    const response = failure(
      429,
      "rate_limited",
      "Too many requests. Try again shortly.",
      "try_again_after_delay",
    );
    response.headers.set("Retry-After", String(throttle.retryAfterSeconds));
    return response;
  }

  const body_ = await readJsonBody(request);
  const parsed = HumanActionRequestSchema.safeParse(body_);
  if (body_ === null || !parsed.success) {
    return failure(
      400,
      "invalid_request",
      "That request was not valid for CiteApply.",
      "reread_state_and_requirements",
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

      const effect = await runHumanAction(
        client,
        keyring,
        application,
        parsed.data,
      );
      if (effect.kind !== "applied") return effect;

      return {
        kind: "applied",
        outcome: effect.outcome,
        consentCapability: effect.consentCapability,
        snapshot: projectHumanSnapshot(effect.application, authority.clock),
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
      return failure(
        403,
        "stale_page",
        "This page is no longer current.",
        "reload_current_application",
      );
    case "consent_required":
      return failure(
        403,
        "consent_required",
        "Use the visible CiteApply application to continue.",
        "use_visible_application",
      );
    case "stale_state":
      return failure(
        409,
        "stale_state",
        "The saved application changed.",
        "reread_state_and_requirements",
      );
    case "request_reuse_mismatch":
      return failure(
        409,
        "request_reuse_mismatch",
        "That request identity was already used differently.",
        "reread_state_and_requirements",
      );
    case "evidence_unavailable":
      return failure(
        409,
        "evidence_unavailable",
        "That evidence is not currently available for this field.",
        "reread_state_and_requirements",
      );
    case "conflict_requires_human":
      return failure(
        409,
        "conflict_requires_human",
        "Income sources disagree. Resolve this in CiteApply.",
        "resolve_in_visible_application",
      );
    case "replayed":
      return privateJsonResponse({
        ok: true,
        data: { kind: "action_replayed", original: result.operation.outcome },
      });
    case "unavailable_at_w0":
      return failure(
        503,
        "temporarily_unavailable",
        "CiteApply could not confirm this action. Checking the latest application.",
        "reconcile_current_state",
      );
    default:
      return privateJsonResponse({
        ok: true,
        data: {
          kind: result.outcome,
          action: parsed.data.action,
          ...(result.consentCapability === null
            ? {}
            : { consentCapability: result.consentCapability }),
          snapshot: result.snapshot,
        },
      });
  }
}
