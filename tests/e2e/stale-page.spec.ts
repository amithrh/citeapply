import { expect, test } from "@playwright/test";

/**
 * D-P1-2. Only one page may own a synthetic session. Opening /application in a
 * second tab takes the page epoch, and the server then answers every call from
 * the first tab `stale_page`. The server was always right about this; the
 * first tab was the one telling the lie — it went on displaying "This page is
 * current. Assisted access is allowed." indefinitely, with every mutating
 * control still enabled, *including after it had received the refusal*.
 *
 * Opening a second tab is a normal reflex, so this asserts the superseded tab
 * corrects itself the moment it learns: the status line flips, an explanation
 * and a Reload control appear, and nothing mutating is left clickable.
 */
test("@journey a superseded tab stops claiming to be current", async ({
  context,
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start with records that disagree" }).click();
  await expect(page.getByText("This page is current.")).toBeVisible();

  // Before the takeover, the first tab is current and can act.
  const link = page.getByRole("button", { name: "Link enrollment record" }).first();
  await expect(link).toBeEnabled();
  await link.click();
  await expect(page.getByText("This page is current.")).toBeVisible();

  // A second tab on the same session takes the page epoch with it.
  const second = await context.newPage();
  await second.goto("/application");
  await expect(second.getByText("This page is current.")).toBeVisible();

  // The first tab does not know yet — it learns from its own next call.
  await expect(page.getByText("This page is current.")).toBeVisible();
  await page.getByRole("button", { name: "Link enrollment record" }).first().click();

  // ...and having learned, it says so.
  await expect(
    page.getByText("This page is no longer current. Reload to continue."),
  ).toBeVisible();
  await expect(page.getByText("This page is current.")).toHaveCount(0);
  await expect(
    page.getByText("Assisted access is allowed for this page and session."),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Reload this page" }),
  ).toBeVisible();

  // Every mutating control on the superseded tab is disabled, so the page
  // never offers an action the server would only refuse.
  await expect(
    page.getByRole("button", { name: "Link enrollment record" }).first(),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save email" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Prepare review" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Review and allow assisted access" }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Why you chose this source"),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Use the Synthetic Income Statement" }),
  ).toBeDisabled();

  // The stale state latches: a later render cannot talk the page back into
  // claiming it is current.
  await page.waitForTimeout(500);
  await expect(
    page.getByText("This page is no longer current. Reload to continue."),
  ).toBeVisible();

  // Reloading wins the session back, and nothing saved was lost.
  await page.getByRole("button", { name: "Reload this page" }).click();
  await expect(page.getByText("This page is current.")).toBeVisible();
  await expect(
    page.getByText("This page is no longer current."),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Prepare review" }),
  ).toBeEnabled();
  // The second tab is now the stale one.
  await second.getByRole("button", { name: "Link household record" }).first().click();
  await expect(
    second.getByText("This page is no longer current. Reload to continue."),
  ).toBeVisible();
});
