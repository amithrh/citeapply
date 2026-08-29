import {
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const KEY_BYTES = 32;
const CAPABILITY_BYTES = 32;
const NONCE_BYTES = 16;
const BASE64URL_32_BYTES = /^[A-Za-z0-9_-]{43}$/;

export const KEY_PURPOSES = [
  "start",
  "session",
  "page",
  "consent",
  "rate",
  "operation",
] as const;

export type KeyPurpose = (typeof KEY_PURPOSES)[number];
export type Keyring = Readonly<Record<KeyPurpose, Buffer>>;

export class KeyConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeyConfigurationError";
  }
}

export function encodeBase64Url(value: Uint8Array): string {
  return Buffer.from(value).toString("base64url");
}

export function decodeBase64Url(
  value: string,
  expectedBytes?: number,
): Buffer | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  let decoded: Buffer;
  try {
    decoded = Buffer.from(value, "base64url");
  } catch {
    return null;
  }

  if (
    encodeBase64Url(decoded) !== value ||
    (expectedBytes !== undefined && decoded.byteLength !== expectedBytes)
  ) {
    return null;
  }

  return decoded;
}

function requireMasterKey(encoded: string | undefined): Buffer {
  if (encoded === undefined || !BASE64URL_32_BYTES.test(encoded)) {
    throw new KeyConfigurationError(
      "CITEAPPLY_MASTER_KEY must be an unpadded base64url 32-byte key.",
    );
  }

  const decoded = decodeBase64Url(encoded, KEY_BYTES);
  if (decoded === null) {
    throw new KeyConfigurationError(
      "CITEAPPLY_MASTER_KEY must be an unpadded base64url 32-byte key.",
    );
  }

  return decoded;
}

function requireCanonicalOrigin(value: string | undefined): string {
  if (value === undefined || value.length === 0 || value.length > 2_048) {
    throw new KeyConfigurationError(
      "APP_ORIGIN is required for key derivation.",
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new KeyConfigurationError(
      "APP_ORIGIN is invalid for key derivation.",
    );
  }

  if (
    url.origin !== value ||
    url.username.length !== 0 ||
    url.password.length !== 0 ||
    url.pathname !== "/" ||
    url.search.length !== 0 ||
    url.hash.length !== 0
  ) {
    throw new KeyConfigurationError("APP_ORIGIN must be one canonical origin.");
  }

  return url.origin;
}

export function deriveKeyring(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): Keyring {
  const master = requireMasterKey(environment["CITEAPPLY_MASTER_KEY"]);
  const origin = requireCanonicalOrigin(environment["APP_ORIGIN"]);
  const salt = Buffer.from(`citeapply-hkdf-salt-v1\u0000${origin}`, "utf8");

  const entries = KEY_PURPOSES.map((purpose) => {
    const info = Buffer.from(`citeapply/${purpose}/v1`, "utf8");
    const key = Buffer.from(hkdfSync("sha256", master, salt, info, KEY_BYTES));
    return [purpose, key] as const;
  });

  master.fill(0);
  return Object.fromEntries(entries) as Keyring;
}

export function frameParts(parts: readonly (string | Uint8Array)[]): Buffer {
  const framed: Buffer[] = [];

  for (const part of parts) {
    const bytes =
      typeof part === "string" ? Buffer.from(part, "utf8") : Buffer.from(part);
    if (bytes.byteLength > 65_535) {
      throw new Error("A capability coordinate exceeds its byte limit.");
    }
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(bytes.byteLength, 0);
    framed.push(length, bytes);
  }

  return Buffer.concat(framed);
}

export function hmacSha256(key: Uint8Array, data: Uint8Array): Buffer {
  if (key.byteLength !== KEY_BYTES) {
    throw new Error("An invalid derived key was supplied.");
  }
  return createHmac("sha256", key).update(data).digest();
}

export function sha256(data: string | Uint8Array): Buffer {
  return createHash("sha256").update(data).digest();
}

export function deriveOpaqueCapability(
  key: Uint8Array,
  purpose: string,
  coordinates: readonly (string | Uint8Array)[],
): string {
  if (!/^[a-z][a-z0-9_-]{0,31}$/.test(purpose)) {
    throw new Error("The capability purpose is invalid.");
  }

  return encodeBase64Url(
    hmacSha256(
      key,
      frameParts([`citeapply-capability-v1/${purpose}`, ...coordinates]),
    ),
  );
}

export function operationIntentDigest(
  keyring: Keyring,
  canonicalIntentBytes: Uint8Array,
): Buffer {
  return hmacSha256(keyring.operation, canonicalIntentBytes);
}

export function digestCredential(credential: string): Buffer {
  return sha256(Buffer.from(credential, "utf8"));
}

export function randomNonce(): string {
  return encodeBase64Url(randomBytes(NONCE_BYTES));
}

export function randomCapability(): string {
  return encodeBase64Url(randomBytes(CAPABILITY_BYTES));
}

export function constantTimeEqualBytes(
  left: Uint8Array,
  right: Uint8Array,
): boolean {
  if (left.byteLength !== right.byteLength) {
    return false;
  }

  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export function constantTimeEqualBase64Url(
  supplied: string,
  expected: string,
): boolean {
  const suppliedBytes = decodeBase64Url(supplied);
  const expectedBytes = decodeBase64Url(expected);

  if (suppliedBytes === null || expectedBytes === null) {
    return false;
  }

  return constantTimeEqualBytes(suppliedBytes, expectedBytes);
}
