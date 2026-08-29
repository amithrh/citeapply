import type { Keyring } from "./keys.ts";
import {
  constantTimeEqualBytes,
  decodeBase64Url,
  deriveOpaqueCapability,
  digestCredential,
} from "./keys.ts";

export const SESSION_COOKIE_NAME = "__Host-citeapply_session";
export const SESSION_DURATION_MS = 60 * 60 * 1_000;

const MAX_COOKIE_HEADER_BYTES = 4_096;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const START_NONCE = /^[A-Za-z0-9_-]{22}$/;

export type SessionCoordinate = Readonly<{
  packetCode: "supported" | "conflict";
  startNonce: string;
  startRequestId: string;
  startTokenExpiresAt: string;
}>;

function requireInstant(value: string, label: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${label} must be a canonical RFC 3339 instant.`);
  }
  return value;
}

function validateCoordinate(coordinate: SessionCoordinate): void {
  if (coordinate.packetCode !== "supported" && coordinate.packetCode !== "conflict") {
    throw new Error("The session packet coordinate is invalid.");
  }
  if (
    !START_NONCE.test(coordinate.startNonce) ||
    decodeBase64Url(coordinate.startNonce, 16) === null
  ) {
    throw new Error("The session Start nonce is invalid.");
  }
  if (!UUID_V4.test(coordinate.startRequestId)) {
    throw new Error("The session Start request ID is invalid.");
  }
  requireInstant(coordinate.startTokenExpiresAt, "startTokenExpiresAt");
}

export function deriveSessionCredential(
  keyring: Keyring,
  coordinate: SessionCoordinate,
): string {
  validateCoordinate(coordinate);
  return deriveOpaqueCapability(keyring.session, "session", [
    coordinate.packetCode,
    coordinate.startNonce,
    coordinate.startRequestId,
    coordinate.startTokenExpiresAt,
  ]);
}

export function sessionCredentialDigest(credential: string): Buffer | null {
  if (decodeBase64Url(credential, 32) === null) {
    return null;
  }
  return digestCredential(credential);
}

export function sessionCredentialMatchesDigest(
  credential: string,
  storedDigest: Uint8Array,
): boolean {
  const candidate = sessionCredentialDigest(credential);
  return candidate !== null && constantTimeEqualBytes(candidate, storedDigest);
}

export function readSessionCredential(cookieHeader: string | null): string | null {
  if (
    cookieHeader === null ||
    Buffer.byteLength(cookieHeader, "utf8") > MAX_COOKIE_HEADER_BYTES
  ) {
    return null;
  }

  let found: string | null = null;
  for (const segment of cookieHeader.split(";")) {
    const separator = segment.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const name = segment.slice(0, separator).trim();
    if (name !== SESSION_COOKIE_NAME) {
      continue;
    }
    const value = segment.slice(separator + 1).trim();
    if (found !== null || decodeBase64Url(value, 32) === null) {
      return null;
    }
    found = value;
  }

  return found;
}

export function serializeSessionCookie(
  credential: string,
  createdAt: Date,
  expiresAt: Date,
): string {
  if (decodeBase64Url(credential, 32) === null) {
    throw new Error("The session credential is invalid.");
  }
  if (
    !Number.isFinite(createdAt.getTime()) ||
    !Number.isFinite(expiresAt.getTime()) ||
    expiresAt.getTime() - createdAt.getTime() !== SESSION_DURATION_MS
  ) {
    throw new Error("The session expiry is invalid.");
  }

  return `${SESSION_COOKIE_NAME}=${credential}; Path=/; Expires=${expiresAt.toUTCString()}; HttpOnly; Secure; SameSite=Strict`;
}

export function serializeExpiredSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`;
}
