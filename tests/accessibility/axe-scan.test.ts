import AxeBuilder from "@axe-core/playwright";
import {
  chromium,
  expect,
  test,
  type Browser,
  type Page,
} from "@playwright/test";

/**
 * D-6: a real axe scan, not a claim of one. Every screen an applicant or a
 * judge actually reaches is scanned against the WCAG 2.1 A and AA rule sets,
 * and any violation fails the run with the rule and the offending nodes named.
 *
 * The application walk runs in the installed Chrome channel with WebMCP
 * enabled, because the assisted-access disclosure is only offered when the
 * browser can actually register the tools — scanning it in a browser without
 * WebMCP would silently skip the dialog.
 */

const ORIGIN = process.env["APP_ORIGIN"] ?? "http://localhost:3000";

async function openChrome(): Promise<Browser | null> {
  try {
    return await chromium.launch({
      channel: "chrome",
      args: ["--enable-features=WebMCPTesting"],
    });
  } catch {
    return null;
  }
}

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

type Violation = Readonly<{
  id: string;
  impact?: string | null;
  help: string;
  nodes: readonly { target: unknown }[];
}>;

/** Names the rule and the exact nodes, so a failure is actionable as printed. */
function describe(violations: readonly Violation[]): string {
  return violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}\n` +
        violation.nodes
          .map((node) => `    ${JSON.stringify(node.target)}`)
          .join("\n"),
    )
    .join("\n");
}

async function scan(page: Page, screen: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  const violations = results.violations as unknown as readonly Violation[];
  expect(
    violations,
    `${screen} has axe WCAG 2.1 AA violations:\n${describe(violations)}`,
  ).toEqual([]);
}

async function completeDraft(page: Page): Promise<void> {
  for (const link of ["Link enrollment record", "Link household record"]) {
    for (let index = 0; index < 3; index += 1) {
      await page.getByRole("button", { name: link }).first().click();
      await page.waitForTimeout(250);
    }
  }
  await page.getByRole("button", { name: "Save email" }).click();
  await page
    .getByRole("button", { name: "I declare this is my address" })
    .click();
}

test("@a11y the landing page has no WCAG 2.1 AA violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "The agent cites. You decide." }),
  ).toBeVisible();
  await scan(page, "landing");
});

/**
 * Phase 2D added the site shell (masthead and footer on every route) and the
 * "For agents" route. The shell is scanned implicitly by every case here; this
 * case covers the one page that is nothing but the shell and static content.
 */
test("@a11y the For agents page has no WCAG 2.1 AA violations", async ({
  page,
}) => {
  await page.goto("/agents");
  await expect(
    page.getByRole("heading", { name: "For agents", level: 1 }),
  ).toBeVisible();
  await scan(page, "for agents");
});

test("@a11y the application, its consent dialog, the review and the receipt have no WCAG 2.1 AA violations", async () => {
  test.slow();
  const browser = await openChrome();
  test.skip(
    browser === null,
    "Google Chrome is not installed on this machine, so the assisted-access disclosure cannot be reached.",
  );
  if (browser === null) return;
  const page = await (await browser.newContext({ baseURL: ORIGIN })).newPage();

  try {
    // The Conflict packet is the richest screen: it carries the disputed source
    // cards, the reason control, and the refusal copy.
    await page.goto(`${ORIGIN}/`);
    await page.getByRole("button", { name: "Start conflict packet" }).click();
    await expect(
      page.getByRole("heading", { name: "Application" }),
    ).toBeVisible();
    await expect(
      page.getByText("Two accepted sources disagree. You decide."),
    ).toBeVisible();
    await scan(page, "application (conflict draft)");

    // The disclosure the applicant reads before granting assisted access.
    await page
      .getByRole("button", { name: "Review and allow assisted access" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Allow assisted access?" }),
    ).toBeVisible();
    await scan(page, "assisted access disclosure dialog");
    await page.getByRole("button", { name: "Continue manually" }).click();

    await completeDraft(page);
    await page
      .getByLabel("Why you chose this source")
      .selectOption("more_recent");
    await page
      .getByRole("button", { name: "Use the Synthetic Income Statement" })
      .click();
    await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();
    await scan(page, "application (ready draft)");

    await page.getByRole("button", { name: "Prepare review" }).click();
    await expect(
      page.getByRole("heading", { name: "Review before submitting" }),
    ).toBeVisible();
    await scan(page, "frozen review");

    await page.getByRole("button", { name: "Submit this application" }).click();
    await expect(
      page.getByRole("heading", { name: "Submitted" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download JSON" }),
    ).toBeVisible();
    await scan(page, "receipt");
  } finally {
    await browser.close();
  }
});
