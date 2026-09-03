import { expect, test, type Page } from "@playwright/test";

/**
 * D-4: the receipt is a document a person can keep, and the three ways to keep
 * it are the same record. The downloaded JSON is the canonical
 * `citeapply-receipt-v1` served by `/api/receipt`; every accepted value inside
 * it must already be legible on screen, and the print stylesheet must keep
 * that same content while dropping the page's controls.
 */

type ReceiptRecord = Readonly<{
  schema: string;
  receiptId: string;
  acceptedReview: {
    shortId: string;
    contentHash: string;
    diffs: readonly {
      field: string;
      final: { value?: unknown };
      excerpts: readonly { excerpt: string }[];
    }[];
  };
}>;

async function reachReceipt(page: Page, label: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: label }).click();
  await expect(page.getByRole("heading", { name: "Application" })).toBeVisible();

  for (const link of ["Link enrollment record", "Link household record"]) {
    for (let index = 0; index < 3; index += 1) {
      await page.getByRole("button", { name: link }).first().click();
      await page.waitForTimeout(250);
    }
  }
  await page.getByRole("button", { name: "Link income record" }).click();
  await page.getByRole("button", { name: "Save email" }).click();
  await page.getByRole("button", { name: "I declare this is my address" }).click();
  await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();

  await page.getByRole("button", { name: "Prepare review" }).click();
  await expect(
    page.getByRole("heading", { name: "Review before submitting" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit this application" }).click();
  await expect(page.getByRole("heading", { name: "Submitted" })).toBeVisible();
}

/** Formats a value the way the receipt does, so screen and file can be compared. */
function onScreenForm(field: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (field === "annual_household_income" && typeof value === "number") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return String(value);
}

test("@journey the receipt's JSON, screen, and print view are the same record", async ({
  page,
}) => {
  await reachReceipt(page, "Start with records that agree");

  // The three affordances the receipt must offer.
  await expect(page.getByRole("button", { name: "Download JSON" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Start a new synthetic demo" }),
  ).toBeVisible();

  // Download JSON serves the canonical record straight from /api/receipt.
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const saved = await download;
  expect(saved.suggestedFilename()).toMatch(/^citeapply-receipt-.+\.json$/);
  const stream = await saved.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const record = JSON.parse(Buffer.concat(chunks).toString("utf8")) as ReceiptRecord;

  expect(record.schema).toBe("citeapply-receipt-v1");

  // Every accepted value in the file is legible on screen, and so is every
  // source excerpt the file cites.
  const receiptSection = page.locator("section.receipt");
  for (const diff of record.acceptedReview.diffs) {
    if ("value" in diff.final && diff.final.value !== undefined) {
      await expect(
        receiptSection.getByText(onScreenForm(diff.field, diff.final.value), {
          exact: false,
        }).first(),
      ).toBeVisible();
    }
    for (const excerpt of diff.excerpts) {
      await expect(
        receiptSection.getByText(excerpt.excerpt, { exact: false }).first(),
      ).toBeVisible();
    }
  }
  await expect(receiptSection.getByText(record.receiptId)).toBeVisible();
  await expect(
    receiptSection.getByText(record.acceptedReview.contentHash),
  ).toBeVisible();

  // The print view keeps the record and drops the page's controls.
  await page.emulateMedia({ media: "print" });
  await expect(
    receiptSection.getByText(record.acceptedReview.contentHash),
  ).toBeVisible();
  for (const diff of record.acceptedReview.diffs) {
    for (const excerpt of diff.excerpts) {
      await expect(
        receiptSection.getByText(excerpt.excerpt, { exact: false }).first(),
      ).toBeVisible();
    }
  }
  await expect(page.getByRole("button", { name: "Download JSON" })).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Assisted activity" }),
  ).toBeHidden();
  await page.emulateMedia({ media: "screen" });
});

test("@journey the conflict receipt keeps both disagreeing excerpts in the file and on screen", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start with records that disagree" }).click();
  await expect(page.getByRole("heading", { name: "Application" })).toBeVisible();
  for (const link of ["Link enrollment record", "Link household record"]) {
    for (let index = 0; index < 3; index += 1) {
      await page.getByRole("button", { name: link }).first().click();
      await page.waitForTimeout(250);
    }
  }
  await page.getByRole("button", { name: "Save email" }).click();
  await page.getByRole("button", { name: "I declare this is my address" }).click();
  // The reason is the applicant's own; the source buttons stay disabled until
  // one is chosen (D-P1-1).
  await page
    .getByLabel("Why you chose this source")
    .selectOption("more_recent");
  await page
    .getByRole("button", { name: "Use the Synthetic Income Statement" })
    .click();
  await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();
  await page.getByRole("button", { name: "Prepare review" }).click();
  await expect(
    page.getByRole("heading", { name: "Review before submitting" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit this application" }).click();
  await expect(page.getByRole("heading", { name: "Submitted" })).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const stream = await (await download).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const record = JSON.parse(Buffer.concat(chunks).toString("utf8")) as ReceiptRecord;

  const incomeDiff = record.acceptedReview.diffs.find(
    ({ field }) => field === "annual_household_income",
  );
  expect(incomeDiff?.excerpts).toHaveLength(2);
  const receiptSection = page.locator("section.receipt");
  for (const excerpt of incomeDiff?.excerpts ?? []) {
    await expect(
      receiptSection.getByText(excerpt.excerpt, { exact: false }).first(),
    ).toBeVisible();
  }
  await expect(
    receiptSection.getByText(
      "Income evidence differed and was resolved by the applicant.",
    ),
  ).toBeVisible();
});
