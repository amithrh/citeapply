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
