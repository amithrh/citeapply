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
    throw new RequestOriginError();
  }

  if (url.protocol !== policy.protocol || url.host !== policy.host) {
    throw new RequestOriginError();
  }
}

function requireHost(headers: HeaderReader, policy: OriginPolicy): void {
  const host = headers.get("host");
  if (host === null || host !== policy.host || host.includes(",")) {
    throw new RequestOriginError();
  }
}

function requireSameOriginFetch(headers: HeaderReader): void {
  if (headers.get("sec-fetch-site") !== "same-origin") {
    throw new RequestOriginError();
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
  if (headers.get("origin") !== policy.origin) {
    throw new RequestOriginError();
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
