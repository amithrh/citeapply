export type HeaderReader = Readonly<{
  get(name: string): string | null;
}>;

export type OriginPolicy = Readonly<{
  origin: string;
  host: string;
  protocol: "http:" | "https:";
  localHttp: boolean;
}>;

export class RequestOriginError extends Error {
  readonly code = "invalid_request";

  constructor() {
    super("The request origin is not permitted.");
    this.name = "RequestOriginError";
  }
}

/**
 * The response body for an origin refusal is deliberately opaque: it discloses
 * nothing about the configured origin to a caller that failed the check. That
 * leaves an operator whose own server is misconfigured — the standalone server
 * bound to `0.0.0.0` while `APP_ORIGIN` says `localhost`, say — with a demo
 * that refuses everything and a completely silent log. This writes exactly one
 * line per refusal naming which comparison failed, so that failure is
 * self-diagnosing.
 *
 * Only host-shaped identifiers are ever printed, and only after
 * `printableHost` has accepted them, so no request body, cookie, token,
 * capability, field value or arbitrary caller-supplied string can reach the
 * log through this path.
 */
const HOST_SHAPED = /^[A-Za-z0-9._:/[\]-]{1,255}$/;

function printableHost(value: string | null): string {
  if (value === null) return "<absent>";
  if (!HOST_SHAPED.test(value)) return "<unprintable>";
  return value;
}

function refuse(detail: string): never {
  // The one place in the codebase that writes to the operator's log on
  // purpose; see the comment above RequestOriginError for why.
  // eslint-disable-next-line no-console
  console.error(`origin check refused: ${detail}`);
  throw new RequestOriginError();
}

function parseConfiguredOrigin(value: string | undefined): URL {
  if (value === undefined || value.length === 0 || value.length > 2_048) {
    throw new Error("APP_ORIGIN is required.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("APP_ORIGIN is invalid.");
  }

  if (
    url.origin !== value ||
    url.username.length !== 0 ||
    url.password.length !== 0 ||
    url.pathname !== "/" ||
    url.search.length !== 0 ||
    url.hash.length !== 0
  ) {
    throw new Error("APP_ORIGIN must be one canonical origin.");
  }

  const localHttp = url.protocol === "http:" && url.hostname === "localhost";
  if (url.protocol !== "https:" && !localHttp) {
    throw new Error("APP_ORIGIN must use HTTPS or exact localhost HTTP.");
  }
  if (localHttp && url.port.length === 0) {
    throw new Error("Local APP_ORIGIN must include its fixed port.");
  }

  return url;
}

export function loadOriginPolicy(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): OriginPolicy {
  const url = parseConfiguredOrigin(environment["APP_ORIGIN"]);
  return {
    origin: url.origin,
    host: url.host,
    protocol: url.protocol as "http:" | "https:",
    localHttp: url.protocol === "http:",
  };
}

function requireExactRequestUrl(
  requestUrl: string,
  policy: OriginPolicy,
): void {
  let url: URL;
  try {
    url = new URL(requestUrl);
  } catch {
    refuse("the request URL could not be parsed");
  }

  if (url.protocol !== policy.protocol) {
    refuse(
      `request scheme ${url.protocol}// does not match APP_ORIGIN scheme ${policy.protocol}//`,
    );
  }
  if (url.host !== policy.host) {
    refuse(
      `request host ${printableHost(url.host)} does not match APP_ORIGIN host ${policy.host}` +
        ` (if this server bound 0.0.0.0, set HOSTNAME to the APP_ORIGIN hostname)`,
    );
  }
}

function requireHost(headers: HeaderReader, policy: OriginPolicy): void {
  const host = headers.get("host");
  if (host === null || host !== policy.host || host.includes(",")) {
    refuse(
      `Host header ${printableHost(host)} does not match APP_ORIGIN host ${policy.host}`,
    );
  }
}

function requireSameOriginFetch(headers: HeaderReader): void {
  if (headers.get("sec-fetch-site") !== "same-origin") {
    refuse("the request did not carry Sec-Fetch-Site: same-origin");
  }
}

export function requireSameOriginRead(
  requestUrl: string,
  headers: HeaderReader,
  policy: OriginPolicy,
): void {
  requireExactRequestUrl(requestUrl, policy);
  requireHost(headers, policy);
  requireSameOriginFetch(headers);
}

export function requireSameOriginMutation(
  requestUrl: string,
  headers: HeaderReader,
  policy: OriginPolicy,
): void {
  requireSameOriginRead(requestUrl, headers, policy);
  const origin = headers.get("origin");
  if (origin !== policy.origin) {
    refuse(
      `Origin header ${printableHost(origin)} does not match APP_ORIGIN ${policy.origin}`,
    );
  }
}

export function assertAllowedMethod(
  actualMethod: string,
  allowedMethods: readonly string[],
): void {
  if (
    allowedMethods.length === 0 ||
    allowedMethods.length > 4 ||
    !allowedMethods.includes(actualMethod)
  ) {
    throw new RequestOriginError();
  }
}

export function assertJsonContentType(headers: HeaderReader): void {
  const contentType = headers.get("content-type");
  if (contentType !== "application/json") {
    throw new RequestOriginError();
  }
}
