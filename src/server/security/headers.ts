import { randomBytes } from "node:crypto";

const PRIVATE_NO_STORE = "private, no-store, max-age=0";

export const API_SECURITY_HEADERS = Object.freeze({
  "Cache-Control": PRIVATE_NO_STORE,
  "Content-Type": "application/json; charset=utf-8",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Origin-Agent-Cluster": "?1",
  // `tools` is not a registered Permissions-Policy feature; declaring it only
  // produces a console error in Chrome.
  "Permissions-Policy":
    "camera=(), geolocation=(), microphone=(), payment=(), usb=(), browsing-topics=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const);

export const PAGE_NO_STORE_HEADERS = Object.freeze({
  "Cache-Control": PRIVATE_NO_STORE,
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
} as const);

export const HSTS_HEADER = "max-age=63072000; includeSubDomains; preload";

export function withApiSecurityHeaders(
  response: Response,
  options: Readonly<{ productionHttps?: boolean }> = {},
): Response {
  for (const [name, value] of Object.entries(API_SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  if (options.productionHttps === true) {
    response.headers.set("Strict-Transport-Security", HSTS_HEADER);
  }
  return response;
}

export function privateJsonResponse(
  body: unknown,
  init: ResponseInit & Readonly<{ productionHttps?: boolean }> = {},
): Response {
  const { productionHttps, ...responseInit } = init;
  const response = Response.json(body, responseInit);
  return withApiSecurityHeaders(
    response,
    productionHttps === undefined ? {} : { productionHttps },
  );
}

/**
 * A read-only file answer for the committed synthetic records. It carries the
 * same privacy and sniffing protections as the JSON API, minus the two headers
 * that would stop Chrome's own PDF viewer from rendering a same-origin document
 * opened in a new tab.
 */
export function privateFileResponse(
  bytes: Uint8Array,
  init: Readonly<{ contentType: string; disposition: string }>,
): Response {
  const body = new Uint8Array(bytes);
  return new Response(body, {
    status: 200,
    headers: {
      "Cache-Control": PRIVATE_NO_STORE,
      "Content-Type": init.contentType,
      "Content-Disposition": init.disposition,
      "Content-Length": String(body.byteLength),
      "Cross-Origin-Resource-Policy": "same-origin",
      "Origin-Agent-Cluster": "?1",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}

const SUPPORT_ALPHABET ="0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** A fresh, value-free reference so two failures are never conflated. */
export function supportReference(): string {
  const bytes = randomBytes(8);
  let reference = "CA-";
  for (const byte of bytes) {
    reference += SUPPORT_ALPHABET[byte % SUPPORT_ALPHABET.length];
  }
  return reference;
}

/**
 * The answer to an infrastructure failure — an unreachable database, a broken
 * pool — which is otherwise a bare HTTP 500 with an empty body that no client
 * can read. It carries the same `temporarily_unavailable` shape the rest of
 * the product already uses, so the page can say something true and offer the
 * one safe next step. It never reports an uncertain mutation as retry-safe.
 */
export function infrastructureUnavailable(
  message: string,
  safeAction: string,
): Response {
  return privateJsonResponse(
    {
      ok: false,
      error: {
        code: "temporarily_unavailable",
        message,
        supportReference: supportReference(),
        safeActions: [safeAction],
      },
    },
    { status: 503 },
  );
}
