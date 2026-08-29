import type { PoolClient } from "pg";

import type { StoredApplication } from "../db/applications.ts";
import { readDatabaseClock } from "../db/transactions.ts";
import type { Keyring } from "./keys.ts";
import {
  constantTimeEqualBase64Url,
  deriveOpaqueCapability,
  randomNonce,
} from "./keys.ts";

const BOOTSTRAP_LIFETIME_MS = 5 * 60 * 1_000;
const BOOTSTRAP_TOKEN = /^b1\.([A-Za-z0-9_-]{22})\.([0-9]{1,13})\.([A-Za-z0-9_-]{43})$/;

export type AuthorityFailureCode =
  | "session_expired"
  | "stale_page"
  | "consent_required";

export type AuthorityFailure = Readonly<{
  ok: false;
  code: AuthorityFailureCode;
}>;

export type SessionClock = Readonly<{
  serverNow: string;
  expiresAt: string;
  remainingMinutes: number;
  warning: "none" | "ten_minutes";
}>;

export type AuthoritySuccess = Readonly<{
  ok: true;
  clock: SessionClock;
}>;

export type AuthorityResult = AuthoritySuccess | AuthorityFailure;

export type AuthorityMode = "session" | "page" | "protected";

export type AuthorityCredentials = Readonly<{
  pageCapability?: string | null;
  consentCapability?: string | null;
}>;

function toIso(date: Date): string {
  if (!Number.isFinite(date.getTime())) {
    throw new Error("An authority clock value is invalid.");
  }
  return date.toISOString();
}

function sessionClock(serverNow: Date, expiresAt: Date): SessionClock | null {
  const remainingMilliseconds = expiresAt.getTime() - serverNow.getTime();
  if (remainingMilliseconds <= 0) {
    return null;
  }

  const remainingMinutes = Math.ceil(remainingMilliseconds / 60_000);
  return {
    serverNow: toIso(serverNow),
    expiresAt: toIso(expiresAt),
    remainingMinutes,
    warning: remainingMilliseconds <= 10 * 60_000 ? "ten_minutes" : "none",
  };
}

function digestCoordinate(value: Uint8Array): string {
  return Buffer.from(value).toString("hex");
}

export function derivePageCapability(
  keyring: Keyring,
  application: StoredApplication,
): string {
  if (
    application.pageBootstrapRequestId === null ||
    application.pageBootstrapRequestDigest === null
  ) {
    throw new Error("The current page replay coordinate is incomplete.");
  }

  return deriveOpaqueCapability(keyring.page, "page", [
    application.id,
    digestCoordinate(application.sessionDigest),
    String(application.pageEpoch),
    application.pageBootstrapRequestId,
    digestCoordinate(application.pageBootstrapRequestDigest),
  ]);
}

export function deriveConsentCapability(
  keyring: Keyring,
  application: StoredApplication,
): string {
  if (application.stage !== "draft" || application.consentRequestId === null) {
    throw new Error("Assisted consent is not current.");
  }

  return deriveOpaqueCapability(keyring.consent, "consent", [
    application.id,
    digestCoordinate(application.sessionDigest),
    String(application.pageEpoch),
    application.consentRequestId,
  ]);
}

function pageCapabilityIsCurrent(
  keyring: Keyring,
  application: StoredApplication,
  supplied: string | null | undefined,
): boolean {
  if (
    supplied === null ||
    supplied === undefined ||
    application.pageBootstrapRequestId === null ||
    application.pageBootstrapRequestDigest === null
  ) {
    return false;
  }

  return constantTimeEqualBase64Url(
    supplied,
    derivePageCapability(keyring, application),
  );
}

function consentCapabilityIsCurrent(
  keyring: Keyring,
  application: StoredApplication,
  supplied: string | null | undefined,
): boolean {
  if (
    supplied === null ||
    supplied === undefined ||
    application.stage !== "draft" ||
    application.consentRequestId === null
  ) {
    return false;
  }

  return constantTimeEqualBase64Url(
    supplied,
    deriveConsentCapability(keyring, application),
  );
}

export function evaluateFinalAuthority(
  keyring: Keyring,
  application: StoredApplication | null,
  serverNow: Date,
  mode: AuthorityMode,
  credentials: AuthorityCredentials = {},
): AuthorityResult {
  if (application === null) {
    return { ok: false, code: "session_expired" };
  }

  const clock = sessionClock(serverNow, application.expiresAt);
  if (clock === null) {
    return { ok: false, code: "session_expired" };
  }

  if (mode === "session") {
    return { ok: true, clock };
  }

  if (!pageCapabilityIsCurrent(keyring, application, credentials.pageCapability)) {
    return { ok: false, code: "stale_page" };
  }

  if (mode === "protected") {
    if (
      !consentCapabilityIsCurrent(
        keyring,
        application,
        credentials.consentCapability,
      )
    ) {
      return { ok: false, code: "consent_required" };
    }
  }

  return { ok: true, clock };
}

export async function finalizeAuthority(
  client: PoolClient,
  keyring: Keyring,
  lockedApplication: StoredApplication | null,
  mode: AuthorityMode,
  credentials: AuthorityCredentials = {},
): Promise<AuthorityResult> {
  const serverNow = await readDatabaseClock(client);
  return evaluateFinalAuthority(
    keyring,
    lockedApplication,
    serverNow,
    mode,
    credentials,
  );
}

function bootstrapSignature(
  keyring: Keyring,
  application: StoredApplication,
  nonce: string,
  expiresAtMilliseconds: number,
): string {
  return deriveOpaqueCapability(keyring.page, "bootstrap", [
    application.id,
    digestCoordinate(application.sessionDigest),
    String(application.pageEpoch),
    String(application.revision),
    nonce,
    String(expiresAtMilliseconds),
  ]);
}

export type BootstrapChallenge = Readonly<{
  challenge: string;
  challengeExpiresAt: string;
  pageEpoch: number;
  applicationRevision: number;
}>;

export type BootstrapChallengeResult =
  | Readonly<{ ok: true; data: BootstrapChallenge }>
  | AuthorityFailure;

export async function issueBootstrapChallenge(
  client: PoolClient,
  keyring: Keyring,
  lockedApplication: StoredApplication | null,
): Promise<BootstrapChallengeResult> {
  const serverNow = await readDatabaseClock(client);
  if (lockedApplication === null) {
    return { ok: false, code: "session_expired" };
  }

  const clock = sessionClock(serverNow, lockedApplication.expiresAt);
  if (clock === null) {
    return { ok: false, code: "session_expired" };
  }

  const nonce = randomNonce();
  const expiresAtMilliseconds = Math.min(
    serverNow.getTime() + BOOTSTRAP_LIFETIME_MS,
    lockedApplication.expiresAt.getTime(),
  );
  const signature = bootstrapSignature(
    keyring,
    lockedApplication,
    nonce,
    expiresAtMilliseconds,
  );

  return {
    ok: true,
    data: {
      challenge: `b1.${nonce}.${expiresAtMilliseconds}.${signature}`,
      challengeExpiresAt: new Date(expiresAtMilliseconds).toISOString(),
      pageEpoch: lockedApplication.pageEpoch,
      applicationRevision: lockedApplication.revision,
    },
  };
}

export function verifyBootstrapChallenge(
  keyring: Keyring,
  application: StoredApplication,
  challenge: string,
  serverNow: Date,
): boolean {
  if (challenge.length > 128) {
    return false;
  }

  const match = BOOTSTRAP_TOKEN.exec(challenge);
  if (match === null) {
    return false;
  }

  const nonce = match[1];
  const expiryText = match[2];
  const suppliedSignature = match[3];
  if (
    nonce === undefined ||
    expiryText === undefined ||
    suppliedSignature === undefined
  ) {
    return false;
  }
  const expiryMilliseconds = Number(expiryText);
  if (
    !Number.isSafeInteger(expiryMilliseconds) ||
    expiryMilliseconds <= serverNow.getTime() ||
    expiryMilliseconds > application.expiresAt.getTime() ||
    expiryMilliseconds - serverNow.getTime() > BOOTSTRAP_LIFETIME_MS
  ) {
    return false;
  }

  const expectedSignature = bootstrapSignature(
    keyring,
    application,
    nonce,
    expiryMilliseconds,
  );
  return constantTimeEqualBase64Url(suppliedSignature, expectedSignature);
}

export type BootstrapVerificationResult =
  | Readonly<{ ok: true; clock: SessionClock }>
  | AuthorityFailure
  | Readonly<{ ok: false; code: "invalid_challenge" }>;

export async function finalizeBootstrapChallenge(
  client: PoolClient,
  keyring: Keyring,
  lockedApplication: StoredApplication | null,
  challenge: string,
): Promise<BootstrapVerificationResult> {
  const serverNow = await readDatabaseClock(client);
  if (lockedApplication === null) {
    return { ok: false, code: "session_expired" };
  }

  const clock = sessionClock(serverNow, lockedApplication.expiresAt);
  if (clock === null) {
    return { ok: false, code: "session_expired" };
  }

  if (!verifyBootstrapChallenge(keyring, lockedApplication, challenge, serverNow)) {
    return { ok: false, code: "invalid_challenge" };
  }

  return { ok: true, clock };
}
