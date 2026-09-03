import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import type { PacketCode } from "../../contracts/common.ts";
import {
  REGISTERED_PACKET_DOCUMENTS,
  getRegisteredPacketDocuments,
  type RegisteredPacketDocument,
} from "../../evidence/packet-registry.server.ts";
import { sha256 } from "../security/keys.ts";

/**
 * The three record sets a person can look at, download and upload. Each entry
 * is one of the committed, hash-allowlisted PDFs; nothing outside this list is
 * ever read from disk or accepted from a browser.
 */
export const SAMPLE_RECORD_NAMES = Object.freeze([
  "enrollment.pdf",
  "household.pdf",
  "income.pdf",
] as const);

export type SampleRecordName = (typeof SAMPLE_RECORD_NAMES)[number];

/** A human label for each document, used by the page and the zip listing. */
export const SAMPLE_RECORD_LABELS: Readonly<
  Record<SampleRecordName, string>
> = Object.freeze({
  "enrollment.pdf": "Enrollment record",
  "household.pdf": "Household statement",
  "income.pdf": "Income statement",
});

export function isSampleRecordName(value: string): value is SampleRecordName {
  return (SAMPLE_RECORD_NAMES as readonly string[]).includes(value);
}

function registrationFor(
  packetCode: PacketCode,
  name: SampleRecordName,
): RegisteredPacketDocument | null {
  return (
    getRegisteredPacketDocuments(packetCode).find((document) =>
      document.filePath.endsWith(`/${name}`),
    ) ?? null
  );
}

/**
 * Reads one registered PDF, refusing anything that is not exactly the bytes the
 * registry allowlists. The path is re-derived from the registry and confined to
 * `fixtures/packets`, so no caller-supplied string reaches the filesystem.
 */
async function readRegisteredBytes(
  registration: RegisteredPacketDocument,
): Promise<Buffer | null> {
  const packetRoot = resolve(process.cwd(), "fixtures", "packets");
  const absolutePath = resolve(process.cwd(), registration.filePath);
  const relativePath = relative(packetRoot, absolutePath);
  if (
    relativePath.length === 0 ||
    isAbsolute(relativePath) ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`)
  ) {
    return null;
  }

  const capacity = registration.limits.maxBytes + 1;
  const buffer = Buffer.allocUnsafe(capacity);
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(absolutePath, constants.O_RDONLY | constants.O_NOFOLLOW);
    let offset = 0;
    while (offset < capacity) {
      const { bytesRead } = await handle.read(
        buffer,
        offset,
        capacity - offset,
        offset,
      );
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset > registration.limits.maxBytes) return null;
    const bytes = Buffer.from(buffer.subarray(0, offset));
    return sha256(bytes).toString("hex") === registration.expectedSha256
      ? bytes
      : null;
  } catch {
    return null;
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

export async function readSampleRecord(
  packetCode: PacketCode,
  name: SampleRecordName,
): Promise<Buffer | null> {
  const registration = registrationFor(packetCode, name);
  return registration === null ? null : readRegisteredBytes(registration);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xed_b8_83_20 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes: Buffer): number {
  let crc = 0xff_ff_ff_ff;
  for (const byte of bytes) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8);
  }
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

/**
 * A store-only ZIP written by hand, so downloading the sample records adds no
 * dependency. Every field is fixed — including the MS-DOS timestamp, pinned to
 * 1980-01-01 — so the same record set always produces byte-identical bytes.
 */
function buildStoredZip(
  entries: readonly Readonly<{ name: string; bytes: Buffer }>[],
): Buffer {
  const DOS_TIME = 0;
  const DOS_DATE = 0x00_21;
  const locals: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const crc = crc32(entry.bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04_03_4b_50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(entry.bytes.length, 18);
    local.writeUInt32LE(entry.bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, entry.bytes);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02_01_4b_50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(DOS_TIME, 12);
    header.writeUInt16LE(DOS_DATE, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(entry.bytes.length, 20);
    header.writeUInt32LE(entry.bytes.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(offset, 42);
    central.push(header, name);

    offset += local.length + name.length + entry.bytes.length;
  }

  const centralBytes = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06_05_4b_50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralBytes, end]);
}

/** The three records of one set, zipped, or null if any byte check fails. */
export async function buildSampleRecordSetZip(
  packetCode: PacketCode,
): Promise<Buffer | null> {
  const entries: { name: string; bytes: Buffer }[] = [];
  for (const name of SAMPLE_RECORD_NAMES) {
    const bytes = await readSampleRecord(packetCode, name);
    if (bytes === null) return null;
    entries.push({ name, bytes });
  }
  return buildStoredZip(entries);
}

/**
 * Matches three uploaded digests against the committed sets. A set matches only
 * when the uploaded files are exactly its three allowlisted documents — no
 * subset, no duplicate, no extra. Only digests are compared; the uploaded bytes
 * and their file names are never stored, logged or echoed.
 */
export function matchUploadedRecordSet(
  digests: readonly string[],
): PacketCode | null {
  if (digests.length !== SAMPLE_RECORD_NAMES.length) return null;
  const uploaded = [...digests].sort();
  for (const packetCode of ["supported", "conflict"] as const) {
    const expected = REGISTERED_PACKET_DOCUMENTS.filter(
      (document) => document.packetCode === packetCode,
    )
      .map((document) => document.expectedSha256)
      .sort();
    if (
      expected.length === uploaded.length &&
      expected.every((digest, index) => digest === uploaded[index])
    ) {
      return packetCode;
    }
  }
  return null;
}
