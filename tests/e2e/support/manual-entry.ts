import { expect, type Page } from "@playwright/test";

/**
 * The by-hand path, as a person actually walks it.
 *
 * There is no "link this record" shortcut on the draft any more, because an
 * evidence-backed answer does not have one: the applicant opens the record,
 * types the value the way that record writes it, names the record, and names
 * the line. The site refuses the pairing when the two do not say the same
 * thing. These helpers drive exactly that, so every spec below reaches its
 * receipt through the same work a judge will do by hand.
 */

export type RecordCode = "enrollment" | "household" | "income";

const ENTRY = (field: string): string => `.entry[data-field="${field}"]`;

/** Types a value, names a record and a line, and links them. */
export async function linkByHand(
  page: Page,
  field: string,
  value: string,
  record: RecordCode,
  line: string,
): Promise<void> {
  const entry = page.locator(ENTRY(field));
  await expect(entry).toBeVisible();
  await entry.getByRole("textbox").fill(value);
  await entry
    .getByLabel("Which record did you read it in?")
    .selectOption(record);
  await entry
    .getByLabel("Which line in it says so?")
    .selectOption({ label: line });
  await entry.getByRole("button", { name: "Link this line" }).click();
  await expect(page.locator(ENTRY(field))).toHaveCount(0);
}

/**
 * The six answers both record sets share, plus the email the applicant saves
 * and declares. Linking the dependency line is what opens the guardian branch,
 * so the two conditional answers are entered after it.
 */
export async function completeSharedFields(page: Page): Promise<void> {
  await linkByHand(page, "legal_name", "Anaya Rao", "enrollment", "Legal name");
  await linkByHand(
    page,
    "student_id",
    "HZN-2026-0142",
    "enrollment",
    "Student ID",
  );
  await linkByHand(
    page,
    "institution",
    "Northstar Community College",
    "enrollment",
    "Institution",
  );
  await linkByHand(
    page,
    "dependency",
    "Yes",
    "household",
    "Dependent on guardian",
  );
  await linkByHand(
    page,
    "guardian_name",
    "Meera Rao",
    "household",
    "Guardian name",
  );
  await linkByHand(page, "household_size", "4", "household", "Household size");
  await page.getByRole("button", { name: "Save email" }).click();
  await page
    .getByRole("button", { name: "I declare this is my address" })
    .click();
}

/** The Supported set only: its two records agree, so one entry settles income. */
export async function linkSupportedIncome(page: Page): Promise<void> {
  await linkByHand(
    page,
    "annual_household_income",
    "INR 480,000",
    "income",
    "Annual household income",
  );
}
