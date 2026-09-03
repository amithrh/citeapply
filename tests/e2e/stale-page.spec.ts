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
  await page
    .getByRole("button", { name: "Start with records that disagree" })
    .click();
  await expect(page.getByText("This page is current.")).toBeVisible();

  // Before the takeover, the first tab is current and can act. Saving the
  // email is the shortest mutating act the visible draft offers.
  const save = page.getByRole("button", { name: "Save email" });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByText("This page is current.")).toBeVisible();

  // A second tab on the same session takes the page epoch with it.
  const second = await context.newPage();
  await second.goto("/application");
  await expect(second.getByText("This page is current.")).toBeVisible();

  // The first tab does not know yet — it learns from its own next call.
  await expect(page.getByText("This page is current.")).toBeVisible();
  await page.getByRole("button", { name: "Save email" }).click();

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
    page.getByRole("button", { name: "Link this line" }).first(),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save email" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Prepare review" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Review and allow assisted access" }),
  ).toBeDisabled();
  await expect(page.getByLabel("Why you chose this source")).toBeDisabled();
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
  await expect(page.getByText("This page is no longer current.")).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Prepare review" }),
  ).toBeEnabled();
  // The second tab is now the stale one.
  await second.getByRole("button", { name: "Save email" }).click();
  await expect(
    second.getByText("This page is no longer current. Reload to continue."),
  ).toBeVisible();
});

/**
 * The deployment defect this test locks down. Every human action carries the
 * coordinate the page last adopted, and the server refuses one it has already
 * superseded. Reading that coordinate, awaiting the round trip and adopting
 * the answer is a critical section: two actions started inside one round trip
 * read the same revision, and the second is refused `stale_state`.
 *
 * On localhost the round trip is a millisecond and the window never opens. On
 * a real network it is hundreds, so an applicant who saves the email, declares
 * it and links the next line at ordinary speed is refused for no reason they
 * can see. Routing every action through one queue closes the window without
 * weakening the coordinate check — so this pins a *deployment* latency into a
 * local test, and asserts the third action is accepted.
 */
test("@journey actions started inside one slow round trip are not refused", async ({
  page,
}) => {
  // A deployment's latency, made deterministic and local.
  await page.route("**/api/application/actions", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.continue();
  });

  await page.goto("/");
  await page
    .getByRole("button", { name: "Start with records that agree" })
    .click();
  await expect(page.getByText("This page is current.")).toBeVisible();

  // Three ordinary interactions, at ordinary speed: no wait between them.
  await page.getByRole("button", { name: "Save email" }).click();
  await page
    .getByRole("button", { name: "I declare this is my address" })
    .click();
  const entry = page.locator('.entry[data-field="annual_household_income"]');
  await entry.getByRole("textbox").fill("INR 480,000");
  await entry
    .getByLabel("Which record did you read it in?")
    .selectOption("income");
  await entry
    .getByLabel("Which line in it says so?")
    .selectOption({ label: "Annual household income" });
  await entry.getByRole("button", { name: "Link this line" }).click();

  // The third action was accepted: the entry is gone and the answer is saved.
  await expect(
    page.locator('.entry[data-field="annual_household_income"]'),
  ).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText("The saved application changed.")).toHaveCount(0);
});
