import { expect, test, type Page } from "@playwright/test";

/**
 * Drives the complete visible journey in a real browser for both packets. The
 * point of the Conflict run is that the portal refuses to choose: the
 * application cannot reach Review until the applicant picks a source and says
 * why, and that decision must survive into the receipt.
 */

async function startPacket(page: Page, label: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: label }).click();
  await expect(page.getByRole("heading", { name: "Application" })).toBeVisible();
  await expect(page.getByText("This page is current.")).toBeVisible();
}

async function clickAll(page: Page, name: string, times: number): Promise<void> {
  for (let index = 0; index < times; index += 1) {
    await page.getByRole("button", { name }).first().click();
    await page.waitForTimeout(250);
  }
}

async function completeSharedFields(page: Page): Promise<void> {
  await clickAll(page, "Link enrollment record", 3);
  // The first household link opens the dependency branch, which activates the
  // two conditional answers.
  await clickAll(page, "Link household record", 3);
  await page.getByRole("button", { name: "Save email" }).click();
  await page.getByRole("button", { name: "I declare this is my address" }).click();
}

test("@journey the Supported packet reaches a receipt with no conflict warning", async ({
  page,
}) => {
  await startPacket(page, "Start supported packet");
  await completeSharedFields(page);
  await page.getByRole("button", { name: "Link income record" }).click();

  await expect(page.getByText("8 of 8 required answers are ready.")).toBeVisible();
  await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();

  await page.getByRole("button", { name: "Prepare review" }).click();
  await expect(
    page.getByRole("heading", { name: "Review before submitting" }),
  ).toBeVisible();
  await expect(
    page.getByText("Income evidence differed and was resolved by the applicant."),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Submit this application" }).click();
  await expect(page.getByRole("heading", { name: "Submitted" })).toBeVisible();
});

test("@journey the Conflict packet cannot reach Review until the applicant decides", async ({
  page,
}) => {
  await startPacket(page, "Start conflict packet");

  // Before anything else, the portal has already refused to pick a value.
  await expect(
    page.getByText("Two accepted sources disagree. You decide."),
  ).toBeVisible();
  await expect(
    page.getByText("Income sources disagree. Resolve this in CiteApply."),
  ).toBeVisible();

  await completeSharedFields(page);

  // Every other answer is ready, and the conflict alone still blocks Review.
  await expect(
    page.getByText("Income sources disagree. Resolve this in CiteApply."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Prepare review" }).click();
  await expect(
    page.getByRole("heading", { name: "Review before submitting" }),
  ).toHaveCount(0);

  // The applicant chooses a source and states a reason.
  await page.getByRole("button", { name: /^Use income:/ }).click();
  await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();

  await page.getByRole("button", { name: "Prepare review" }).click();
  await expect(
    page.getByRole("heading", { name: "Review before submitting" }),
  ).toBeVisible();

  // The frozen Review shows both disagreeing sources, not only the winner.
  await expect(page.getByText("INR 540,000")).toBeVisible();
  await expect(page.getByText("INR 480,000")).toBeVisible();
  await expect(
    page.getByText("Income evidence differed and was resolved by the applicant."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Submit this application" }).click();
  await expect(page.getByRole("heading", { name: "Submitted" })).toBeVisible();
  // The applicant's resolution is still disclosed on the accepted receipt.
  await expect(
    page.getByText("Income evidence differed and was resolved by the applicant."),
  ).toBeVisible();
});

test("@journey returning to draft withdraws the frozen review", async ({ page }) => {
  await startPacket(page, "Start supported packet");
  await completeSharedFields(page);
  await page.getByRole("button", { name: "Link income record" }).click();
  await page.getByRole("button", { name: "Prepare review" }).click();
  await expect(
    page.getByRole("heading", { name: "Review before submitting" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Return to draft" }).click();
  await expect(page.getByRole("heading", { name: "Readiness" })).toBeVisible();
  await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();
});

test("@journey assistance is optional and the manual path never depends on it", async ({
  page,
}) => {
  await startPacket(page, "Start supported packet");
  // This browser has no WebMCP, and the application is still fully completable.
  await expect(page.getByText("WebMCP is unavailable in this browser")).toBeVisible();
  await completeSharedFields(page);
  await page.getByRole("button", { name: "Link income record" }).click();
  await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();
});
