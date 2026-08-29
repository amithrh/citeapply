import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import type {
  RegisteredDocumentClass,
  RegisteredPacketDocument,
} from "./packet-registry.server.ts";

const HARD_MAX_PDF_BYTES = 65_536;
const HARD_MAX_PDF_PAGES = 1;
const HARD_MAX_TEXT_CHARACTERS = 4_096;
const MAX_RAW_TEXT_MULTIPLIER = 4;
// The application bundler rewrites `import.meta.resolve`, so the standard-font
// directory is addressed from the installed package root instead.
const STANDARD_FONT_DATA_PATH = `${resolve(
  process.cwd(),
  "node_modules/pdfjs-dist/standard_fonts",
)}${sep}`;

export const PDF_ADAPTER_ERROR_CODES = [
  "invalid_registration",
  "unreadable_document",
  "document_too_large",
  "document_hash_mismatch",
  "malformed_document",
  "unexpected_page_count",
  "document_text_too_large",
] as const;

export type PdfAdapterErrorCode = (typeof PDF_ADAPTER_ERROR_CODES)[number];

export class PdfAdapterError extends Error {
  readonly code: PdfAdapterErrorCode;
  readonly documentClass: RegisteredDocumentClass;

  constructor(
    code: PdfAdapterErrorCode,
    documentClass: RegisteredDocumentClass,
  ) {
    super("Registered PDF could not be parsed.");
    this.name = "PdfAdapterError";
    this.code = code;
    this.documentClass = documentClass;
  }
}

export type ParsedRegisteredPdf = Readonly<{
  documentClass: RegisteredDocumentClass;
  documentHash: string;
  byteLength: number;
  page: 1;
  pageText: string;
}>;

function fail(
  code: PdfAdapterErrorCode,
  registration: RegisteredPacketDocument,
): never {
  throw new PdfAdapterError(code, registration.documentClass);
}

function validateRegistration(registration: RegisteredPacketDocument): void {
  const { limits } = registration;
  if (
    !/^[0-9a-f]{64}$/u.test(registration.expectedSha256) ||
    !Number.isSafeInteger(limits.maxBytes) ||
    limits.maxBytes < 1 ||
    limits.maxBytes > HARD_MAX_PDF_BYTES ||
    limits.exactPages !== HARD_MAX_PDF_PAGES ||
    !Number.isSafeInteger(limits.maxTextCharacters) ||
    limits.maxTextCharacters < 1 ||
    limits.maxTextCharacters > HARD_MAX_TEXT_CHARACTERS
  ) {
    fail("invalid_registration", registration);
  }
}

function resolveRegisteredPath(registration: RegisteredPacketDocument): string {
  const packetRoot = resolve(process.cwd(), "fixtures", "packets");
  const absolutePath = resolve(process.cwd(), registration.filePath);
  const relativePath = relative(packetRoot, absolutePath);
  if (
    relativePath.length === 0 ||
    isAbsolute(relativePath) ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`)
  ) {
    fail("invalid_registration", registration);
  }
  return absolutePath;
}

async function readBoundedBytes(
  path: string,
  registration: RegisteredPacketDocument,
): Promise<Buffer> {
  const capacity = registration.limits.maxBytes + 1;
  const buffer = Buffer.allocUnsafe(capacity);
  let handle: Awaited<ReturnType<typeof open>> | undefined;

  try {
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    let offset = 0;
    while (offset < capacity) {
      const { bytesRead } = await handle.read(
        buffer,
        offset,
        capacity - offset,
        offset,
      );
      if (bytesRead === 0) {
        break;
      }
      offset += bytesRead;
    }
    if (offset > registration.limits.maxBytes) {
      fail("document_too_large", registration);
    }
    return buffer.subarray(0, offset);
  } catch (error) {
    if (error instanceof PdfAdapterError) {
      throw error;
    }
    return fail("unreadable_document", registration);
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

function normalizedPageText(
  items: readonly unknown[],
  registration: RegisteredPacketDocument,
): string {
  const parts: string[] = [];
  let rawCharacters = 0;
  const maxRawCharacters =
    registration.limits.maxTextCharacters * MAX_RAW_TEXT_MULTIPLIER;

  for (const item of items) {
    if (typeof item !== "object" || item === null || !("str" in item)) {
      continue;
    }
    const textItem = item as { str: unknown; hasEOL?: unknown };
    if (
      typeof textItem.str !== "string" ||
      typeof textItem.hasEOL !== "boolean"
    ) {
      fail("malformed_document", registration);
    }
    rawCharacters += textItem.str.length + (textItem.hasEOL ? 1 : 0);
    if (rawCharacters > maxRawCharacters) {
      fail("document_text_too_large", registration);
    }
    parts.push(textItem.str);
    if (textItem.hasEOL) {
      parts.push("\n");
    }
  }

  const normalized = parts
    .join("")
    .normalize("NFC")
    .replace(/\r\n?/gu, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/gu, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");

  if (normalized.length > registration.limits.maxTextCharacters) {
    fail("document_text_too_large", registration);
  }
  return normalized;
}

export async function parseRegisteredPdf(
  registration: RegisteredPacketDocument,
): Promise<ParsedRegisteredPdf> {
  validateRegistration(registration);
  const path = resolveRegisteredPath(registration);
  const bytes = await readBoundedBytes(path, registration);
  const documentHash = createHash("sha256").update(bytes).digest("hex");
  if (documentHash !== registration.expectedSha256) {
    fail("document_hash_mismatch", registration);
  }

  let loadingTask: ReturnType<typeof getDocument> | undefined;
  try {
    loadingTask = getDocument({
      data: Uint8Array.from(bytes),
      stopAtErrors: true,
      verbosity: 0,
      useSystemFonts: false,
      disableFontFace: true,
      enableXfa: false,
      standardFontDataUrl: STANDARD_FONT_DATA_PATH,
    });
    const document = await loadingTask.promise;
    if (document.numPages !== registration.limits.exactPages) {
      fail("unexpected_page_count", registration);
    }
    const page = await document.getPage(1);
    const content = await page.getTextContent({
      disableNormalization: false,
      includeMarkedContent: false,
    });
    const pageText = normalizedPageText(content.items, registration);

    return Object.freeze({
      documentClass: registration.documentClass,
      documentHash,
      byteLength: bytes.length,
      page: 1,
      pageText,
    });
  } catch (error) {
    if (error instanceof PdfAdapterError) {
      throw error;
    }
    return fail("malformed_document", registration);
  } finally {
    await loadingTask?.destroy().catch(() => undefined);
  }
}
