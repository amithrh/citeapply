import type { PacketCode } from "../../../contracts/common.ts";
import { UuidV4Schema } from "../../../contracts/common.ts";
import {
  DemoStartRequestSchema,
  StartTokenSchema,
} from "../../../contracts/http.ts";
import { getDatabasePool } from "../../../server/db/pool.ts";
import {
  infrastructureUnavailable,
  privateFileResponse,
  privateJsonResponse,
} from "../../../server/security/headers.ts";
import { deriveKeyring, sha256 } from "../../../server/security/keys.ts";
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
import {
  buildSampleRecordSetZip,
  isSampleRecordName,
  matchUploadedRecordSet,
  readSampleRecord,
} from "../../../server/services/sample-records.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 8192;
/**
 * The upload mode carries three one-page PDFs, each capped at 64 KiB by the
 * packet registry. A megabyte is generous for that and still small enough that
 * an oversized post is rejected before anything is read.
 */
const MAX_UPLOAD_BYTES = 1_048_576;
const MAX_UPLOAD_FILES = 3;

function isRecordSetCode(value: string): value is PacketCode {
  return value === "supported" || value === "conflict";
}

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

function sampleRecordRefusal(): Response {
  return refused(400, {
    ok: false,
    error: {
      code: "invalid_request",
      message: "CiteApply could not find that sample record.",
      safeActions: ["return_to_packet_selection"],
    },
  });
}

function sampleRecordUnavailable(): Response {
  return refused(503, {
    ok: false,
    error: {
      code: "document_unavailable",
      message: "CiteApply could not read its synthetic records.",
      safeActions: ["return_to_packet_selection"],
    },
  });
}

/**
 * The one refusal an uploaded file gets. It names no file, echoes no name and
 * keeps no bytes: only the three committed digests were ever compared.
 */
function syntheticOnlyRefusal(): Response {
  return refused(422, {
    ok: false,
    error: {
      code: "invalid_request",
      message:
        "This demonstration reads only its own synthetic records, so nothing real can be submitted by mistake. Download a sample set above and upload it to see the flow.",
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

  // Read-only views of the committed synthetic records, so a person can see
  // what a record set is before starting one, and can download a set to upload
  // it back. Both are addressed by the registry, never by a caller path.
  const query = new URL(request.url).searchParams;
  const documentParam = query.get("document");
  if (documentParam !== null) {
    const [setCode, name] = documentParam.split("/");
    if (
      setCode === undefined ||
      name === undefined ||
      !isRecordSetCode(setCode) ||
      !isSampleRecordName(name)
    ) {
      return sampleRecordRefusal();
    }
    const bytes = await readSampleRecord(setCode, name);
    if (bytes === null) return sampleRecordUnavailable();
    return privateFileResponse(bytes, {
      contentType: "application/pdf",
      disposition: `inline; filename="citeapply-${setCode}-${name}"`,
    });
  }

  const recordsParam = query.get("records");
  if (recordsParam !== null) {
    if (!isRecordSetCode(recordsParam)) return sampleRecordRefusal();
    const zip = await buildSampleRecordSetZip(recordsParam);
    if (zip === null) return sampleRecordUnavailable();
    return privateFileResponse(zip, {
      contentType: "application/zip",
      disposition: `attachment; filename="citeapply-sample-records-${recordsParam}.zip"`,
    });
  }

  return privateJsonResponse({
    ok: true,
    data: {
      kind: "start_token",
      startToken: issueStartToken(deriveKeyring(), new Date()),
    },
  });
}

/**
 * Reads a bounded multipart upload. The whole body is capped before any part is
 * examined, and only the digest of each file is kept — never the bytes, never
 * the file name.
 */
async function readUploadedDigests(
  request: Request,
): Promise<
  | Readonly<{ ok: true; digests: string[]; startToken: unknown; requestId: string }>
  | Readonly<{ ok: false }>
> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES) {
    return { ok: false };
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { ok: false };
  }

  const files = form.getAll("records").filter((part) => part instanceof File);
  if (files.length === 0 || files.length > MAX_UPLOAD_FILES) return { ok: false };

  let total = 0;
  const digests: string[] = [];
  for (const file of files) {
    total += file.size;
    if (total > MAX_UPLOAD_BYTES) return { ok: false };
    digests.push(sha256(new Uint8Array(await file.arrayBuffer())).toString("hex"));
  }

  const rawToken = form.get("startToken");
  const requestId = form.get("requestId");
  if (typeof rawToken !== "string" || typeof requestId !== "string") {
    return { ok: false };
  }
  if (rawToken.length > MAX_BODY_BYTES) return { ok: false };
  let startToken: unknown;
  try {
    startToken = JSON.parse(rawToken) as unknown;
  } catch {
    return { ok: false };
  }
  return { ok: true, digests, startToken, requestId };
}

async function handlePost(request: Request): Promise<Response> {
  const policy = loadOriginPolicy();
  const upload = (request.headers.get("content-type") ?? "").startsWith(
    "multipart/form-data",
  );
  try {
    assertAllowedMethod(request.method, ["POST"]);
    requireSameOriginMutation(request.url, request.headers, policy);
    if (!upload) assertJsonContentType(request.headers);
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

  let packet: PacketCode;
  let startTokenValue: unknown;
  let requestId: string;

  if (upload) {
    const read = await readUploadedDigests(request);
    if (!read.ok) return syntheticOnlyRefusal();
    const matched = matchUploadedRecordSet(read.digests);
    if (matched === null) return syntheticOnlyRefusal();
    packet = matched;
    startTokenValue = read.startToken;
    requestId = read.requestId;
  } else {
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
    packet = parsed.data.packet;
    startTokenValue = parsed.data.startToken;
    requestId = parsed.data.requestId;
  }

  const startToken = StartTokenSchema.safeParse(startTokenValue);
  const identifier = UuidV4Schema.safeParse(requestId);
  if (!startToken.success || !identifier.success) {
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
    packet,
    startToken.data,
    identifier.data,
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
