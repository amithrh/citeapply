import { expect, test, type Page } from "@playwright/test";

import {
  completeSharedFields,
  linkSupportedIncome,
} from "./support/manual-entry.ts";

/**
 * Drives the complete visible journey in a real browser for both packets. The
 * point of the Conflict run is that the portal refuses to choose: the
 * application cannot reach Review until the applicant picks a source and says
 * why, and that decision must survive into the receipt.
 */

async function startPacket(page: Page, label: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: label }).click();
  await expect(
    page.getByRole("heading", { name: "Application" }),
  ).toBeVisible();
  await expect(page.getByText("This page is current.")).toBeVisible();
}

test("@journey the Supported packet reaches a receipt with no conflict warning", async ({
  page,
}) => {
  await startPacket(page, "Start with records that agree");
  await completeSharedFields(page);
  await linkSupportedIncome(page);

  await expect(
    page.getByText("8 of 8 required answers are ready."),
  ).toBeVisible();
  await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();

  await page.getByRole("button", { name: "Prepare review" }).click();
  await expect(
    page.getByRole("heading", { name: "Review before submitting" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Income evidence differed and was resolved by the applicant.",
    ),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Submit this application" }).click();
  await expect(page.getByRole("heading", { name: "Submitted" })).toBeVisible();
});

test("@journey the Conflict packet cannot reach Review until the applicant decides", async ({
  page,
}) => {
  await startPacket(page, "Start with records that disagree");

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

  // Both disagreeing records are quoted at the moment of choice, so the
  // applicant reads the evidence before picking a source (D-5).
  await expect(page.getByText("INR 540,000")).toBeVisible();
  await expect(page.getByText("INR 480,000")).toBeVisible();

  // D-P1-1. The reason is the applicant's, so the portal will not supply one.
  // The selector starts on its placeholder and both source buttons are
  // genuinely unavailable until a reason is chosen — resolving without one is
  // refused, and the conflict still blocks Review.
  const reasonSelect = page.getByLabel("Why you chose this source");
  await expect(reasonSelect).toHaveValue("");
  const useStatement = page.getByRole("button", {
    name: "Use the Synthetic Income Statement",
  });
  const useHousehold = page.getByRole("button", {
    name: "Use the Synthetic Household Statement",
  });
  await expect(useStatement).toBeDisabled();
  await expect(useHousehold).toBeDisabled();
  await expect(
    page.getByText("Choose a reason to enable the two buttons below."),
  ).toBeVisible();

  // Attempting the resolution anyway changes nothing: the income row still
  // disagrees and Review is still blocked.
  await useStatement.click({ force: true });
  await expect(
    page.getByText("Income sources disagree. Resolve this in CiteApply."),
  ).toBeVisible();
  await expect(page.getByText("Nothing is blocking Review.")).toHaveCount(0);
  await page.getByRole("button", { name: "Prepare review" }).click();
  await expect(
    page.getByRole("heading", { name: "Review before submitting" }),
  ).toHaveCount(0);

  // The applicant chooses a source and states a reason — in that order.
  await reasonSelect.selectOption("more_recent");
  await expect(useStatement).toBeEnabled();
  await useStatement.click();
  await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();

  await page.getByRole("button", { name: "Prepare review" }).click();
  await expect(
    page.getByRole("heading", { name: "Review before submitting" }),
  ).toBeVisible();

  // The frozen Review shows both disagreeing sources, not only the winner.
  await expect(page.getByText("INR 540,000")).toBeVisible();
  await expect(page.getByText("INR 480,000")).toBeVisible();
  await expect(
    page.getByText(
      "Income evidence differed and was resolved by the applicant.",
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Submit this application" }).click();
  await expect(page.getByRole("heading", { name: "Submitted" })).toBeVisible();
  // The applicant's resolution is still disclosed on the accepted receipt.
  await expect(
    page.getByText(
      "Income evidence differed and was resolved by the applicant.",
    ),
  ).toBeVisible();
});

test("@journey returning to draft withdraws the frozen review", async ({
  page,
}) => {
  await startPacket(page, "Start with records that agree");
  await completeSharedFields(page);
  await linkSupportedIncome(page);
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
  await startPacket(page, "Start with records that agree");
  // This browser has no WebMCP, and the application is still fully completable.
  await expect(
    page.getByText("WebMCP is unavailable in this browser"),
  ).toBeVisible();
  await completeSharedFields(page);
  await linkSupportedIncome(page);
  await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();
});
