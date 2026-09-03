import { createHash } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

import { REGISTERED_PACKET_DOCUMENTS } from "../../src/evidence/packet-registry.server.ts";

/**
 * The record sets a person can see, take away and bring back. Every assertion
 * here is about the product's central promise: the demonstration reads only its
 * own committed synthetic records, and it can prove which ones they are.
 */

const SET_TITLES = {
  supported: "Records that agree",
  conflict: "Records that disagree",
} as const;

const DOCUMENT_NAMES = ["enrollment.pdf", "household.pdf", "income.pdf"] as const;

function expectedDigests(setCode: "supported" | "conflict"): string[] {
  return REGISTERED_PACKET_DOCUMENTS.filter(
    (document) => document.packetCode === setCode,
  )
    .map((document) => document.expectedSha256)
    .sort();
}

/**
 * Walks the local file headers of a store-only zip. The route writes them
 * itself, so the test reads them itself rather than trusting a library to agree
 * about what was written.
 */
function readStoredZip(bytes: Buffer): { name: string; digest: string }[] {
  const entries: { name: string; digest: string }[] = [];
  let offset = 0;
  while (offset + 30 <= bytes.length && bytes.readUInt32LE(offset) === 0x04_03_4b_50) {
    const compressedSize = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const name = bytes.subarray(offset + 30, offset + 30 + nameLength).toString("utf8");
    const start = offset + 30 + nameLength + extraLength;
    const content = bytes.subarray(start, start + compressedSize);
    entries.push({
      name,
      digest: createHash("sha256").update(content).digest("hex"),
    });
    offset = start + compressedSize;
  }
  return entries;
}

async function downloadSet(
  page: Page,
  setCode: "supported" | "conflict",
): Promise<Buffer> {
  const response = await page.request.get(`/api/demo?records=${setCode}`, {
    headers: { "Sec-Fetch-Site": "same-origin" },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/zip");
  return Buffer.from(await response.body());
}

for (const setCode of ["supported", "conflict"] as const) {
  test(`@records every record in the ${setCode} set is served as its committed PDF`, async ({
    page,
  }) => {
    await page.goto("/");
    for (const name of DOCUMENT_NAMES) {
      const response = await page.request.get(
        `/api/demo?document=${setCode}/${name}`,
        { headers: { "Sec-Fetch-Site": "same-origin" } },
      );
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toBe("application/pdf");
      const digest = createHash("sha256")
        .update(await response.body())
        .digest("hex");
      expect(expectedDigests(setCode)).toContain(digest);
    }
  });

  test(`@records the ${setCode} zip holds exactly the three committed records`, async ({
    page,
  }) => {
    await page.goto("/");
    const entries = readStoredZip(await downloadSet(page, setCode));
    expect(entries.map((entry) => entry.name)).toEqual([...DOCUMENT_NAMES]);
    expect(entries.map((entry) => entry.digest).sort()).toEqual(
      expectedDigests(setCode),
    );
  });

  test(`@records the preview links for the ${setCode} set open its own records`, async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.locator(".record-set", {
      has: page.getByRole("heading", { name: SET_TITLES[setCode] }),
    });
    const links = card.locator(".record-list a");
    await expect(links).toHaveCount(3);
    for (const name of DOCUMENT_NAMES) {
      await expect(
        card.locator(`a[href="/api/demo?document=${setCode}/${name}"]`),
      ).toHaveCount(1);
    }
    await expect(
      card.locator(`a[href="/api/demo?records=${setCode}"]`),
    ).toHaveCount(1);
  });
}

test("@records uploading a downloaded set starts that application", async ({
  page,
}) => {
  await page.goto("/");
  const zip = await downloadSet(page, "conflict");
  const entries = readStoredZip(zip);
  const offsets = new Map<string, Buffer>();
  // Re-extract the payloads so the upload carries the exact downloaded bytes.
  let cursor = 0;
  while (cursor + 30 <= zip.length && zip.readUInt32LE(cursor) === 0x04_03_4b_50) {
    const size = zip.readUInt32LE(cursor + 18);
    const nameLength = zip.readUInt16LE(cursor + 26);
    const extraLength = zip.readUInt16LE(cursor + 28);
    const name = zip.subarray(cursor + 30, cursor + 30 + nameLength).toString("utf8");
    const start = cursor + 30 + nameLength + extraLength;
    offsets.set(name, Buffer.from(zip.subarray(start, start + size)));
    cursor = start + size;
  }
  expect([...offsets.keys()]).toEqual(entries.map((entry) => entry.name));

  await page
    .locator("#upload input[type=file]")
    .setInputFiles(
      [...offsets].map(([name, buffer]) => ({
        name,
        mimeType: "application/pdf",
        buffer,
      })),
    );
  await page.getByRole("button", { name: "Start with these records" }).click();

  await expect(page.getByRole("heading", { name: "Application" })).toBeVisible();
  await expect(page.getByText("This page is current.")).toBeVisible();
  // The conflict set is the one that was uploaded, so its refusal is present.
  await expect(
    page.getByText("Two accepted sources disagree. You decide."),
  ).toBeVisible();
});

test("@records a PDF this demonstration did not commit is refused and starts nothing", async ({
  page,
}) => {
  const document = await PDFDocument.create();
  document.addPage().drawText("A document CiteApply never committed to.");
  const bytes = Buffer.from(await document.save());

  await page.goto("/");
  await page.locator("#upload input[type=file]").setInputFiles({
    name: "something-else.pdf",
    mimeType: "application/pdf",
    buffer: bytes,
  });
  await page.getByRole("button", { name: "Start with these records" }).click();

  const refusal = page.locator(".upload-refusal");
  await expect(refusal).toContainText(
    "This demonstration reads only its own synthetic records",
  );
  // No file name is ever echoed back, and no application was created.
  await expect(refusal).not.toContainText("something-else");
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "The records you will be working from" }),
  ).toBeVisible();
});

test("@records the two-way choice is offered and both paths work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start with records that agree" }).click();
  await expect(
    page.getByRole("heading", { name: "How do you want to fill this in?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "How this works" }),
  ).toBeVisible();

  // Assisted: the same disclosure the rail opens, with no extra authority.
  await page.getByRole("button", { name: "Let an assistant help" }).click();
  await expect(
    page.getByRole("heading", { name: "Allow assisted access?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue manually" }).click();

  // By hand: the choice steps aside and the form is untouched underneath.
  await page.getByRole("button", { name: "Fill it in by hand" }).click();
  await expect(
    page.getByRole("heading", { name: "How do you want to fill this in?" }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Answers" })).toBeVisible();
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(
    page.getByRole("heading", { name: "How this works" }),
  ).toHaveCount(0);

  // Both choices are remembered for this browser.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "How do you want to fill this in?" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "How this works" }),
  ).toHaveCount(0);
});
