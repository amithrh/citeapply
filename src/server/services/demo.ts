import { randomUUID } from "node:crypto";

import type { Pool } from "pg";

import type { PacketCode } from "../../contracts/common.ts";
import { StartTokenSchema, type StartToken } from "../../contracts/http.ts";
import { createInitialDraft } from "../../domain/draft.ts";
import {
  PacketExtractionError,
  parseRegisteredPacket,
} from "../../evidence/extract-claims.server.ts";
import {
  acquireStartParserLease,
  findStartCoordinateMatches,
  insertApplication,
  prepareNewApplicationStart,
  type StoredApplication,
} from "../db/applications.ts";
import { withReadCommittedTransaction } from "../db/transactions.ts";
import {
  constantTimeEqualBase64Url,
  decodeBase64Url,
  deriveOpaqueCapability,
  randomNonce,
  sha256,
  type Keyring,
} from "../security/keys.ts";
import {
  SESSION_DURATION_MS,
  deriveSessionCredential,
  sessionCredentialDigest,
} from "../security/session.ts";

const START_TOKEN_LIFETIME_MS = 10 * 60 * 1_000;

export type StartOutcome =
  | Readonly<{
      kind: "started";
      application: StoredApplication;
      sessionCredential: string;
      expiresAt: string;
    }>
  | Readonly<{ kind: "at_capacity" }>
  | Readonly<{ kind: "document_unavailable" }>
  | Readonly<{ kind: "invalid_request" }>
  | Readonly<{ kind: "request_reuse_mismatch" }>;

function startSignature(
  keyring: Keyring,
  nonce: string,
  issuedAt: string,
  expiresAt: string,
): string {
  return deriveOpaqueCapability(keyring.start, "start", [
    nonce,
    issuedAt,
    expiresAt,
  ]);
}

export function issueStartToken(keyring: Keyring, now: Date): StartToken {
  const nonce = randomNonce();
  const issuedAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + START_TOKEN_LIFETIME_MS,
  ).toISOString();
  return StartTokenSchema.parse({
    nonce,
    issuedAt,
    expiresAt,
    signature: startSignature(keyring, nonce, issuedAt, expiresAt),
  });
}

export function startTokenIsCurrent(
  keyring: Keyring,
  token: StartToken,
  now: Date,
): boolean {
  const expiresAt = Date.parse(token.expiresAt);
  const issuedAt = Date.parse(token.issuedAt);
  if (
    !Number.isSafeInteger(expiresAt) ||
    !Number.isSafeInteger(issuedAt) ||
    expiresAt <= now.getTime() ||
    expiresAt - issuedAt > START_TOKEN_LIFETIME_MS ||
    decodeBase64Url(token.nonce, 16) === null
  ) {
    return false;
  }
  return constantTimeEqualBase64Url(
    token.signature,
    startSignature(keyring, token.nonce, token.issuedAt, token.expiresAt),
  );
}

/**
 * Starts one synthetic demo. The packet is parsed from its committed bytes on
 * every start; a parse failure creates no application at all, so the applicant
 * never lands on a partially populated draft.
 */
export async function startSyntheticDemo(
  pool: Pool,
  keyring: Keyring,
  packetCode: PacketCode,
  token: StartToken,
  requestId: string,
): Promise<StartOutcome> {
  const now = new Date();
  if (!startTokenIsCurrent(keyring, token, now)) {
    return { kind: "invalid_request" };
  }

  const sessionCredential = deriveSessionCredential(keyring, {
    packetCode,
    startNonce: token.nonce,
    startRequestId: requestId,
    startTokenExpiresAt: token.expiresAt,
  });
  const sessionDigest = sessionCredentialDigest(sessionCredential);
  if (sessionDigest === null) {
    return { kind: "invalid_request" };
  }

  const startNonceHash = sha256(token.nonce);
  const startRequestDigest = sha256(`${requestId} ${packetCode} ${token.nonce}`);

  let parsedPacket;
  try {
    parsedPacket = await parseRegisteredPacket(packetCode);
  } catch (error) {
    if (error instanceof PacketExtractionError) {
      return { kind: "document_unavailable" };
    }
    throw error;
  }

  return withReadCommittedTransaction(pool, async (client) => {
    const lease = await acquireStartParserLease(client);
    const matches = await findStartCoordinateMatches(
      client,
      lease,
      startNonceHash,
      requestId,
    );

    for (const existing of matches) {
      const sameIdentity =
        existing.startRequestId === requestId &&
        existing.startRequestDigest.equals(Buffer.from(startRequestDigest));
      if (sameIdentity) {
        return {
          kind: "started",
          application: existing,
          sessionCredential,
          expiresAt: existing.expiresAt.toISOString(),
        } as const;
      }
      return { kind: "request_reuse_mismatch" } as const;
    }

    const capacity = await prepareNewApplicationStart(client, lease);
    if (!capacity.admitted) {
      return { kind: "at_capacity" } as const;
    }

    const application = await insertApplication(client, lease, {
      id: randomUUID(),
      startNonceHash,
      startRequestId: requestId,
      startRequestDigest,
      sessionDigest,
      packetCode,
      parsedPacket,
      draft: createInitialDraft(parsedPacket),
    });

    return {
      kind: "started",
      application,
      sessionCredential,
      expiresAt: application.expiresAt.toISOString(),
    } as const;
  });
}

export const SYNTHETIC_SESSION_DURATION_MS = SESSION_DURATION_MS;
