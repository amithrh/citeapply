import {
  chromium,
  expect,
  test,
  type Browser,
  type Page,
} from "@playwright/test";

/**
 * The scripted demonstration client, driven twice over.
 *
 * The first two runs launch the installed Chrome channel with WebMCP enabled,
 * so the client reaches the six tools through `document.modelContext` exactly
 * as an external agent would. The third runs in headless Chromium, which has
 * no `document.modelContext` at all, to prove the fallback route — the page's
 * own descriptors, the same dispatcher, the same server — still performs the
 * whole journey.
 *
 * The assertions that matter are the same in every run: a person had to press
 * Allow before anything was called; the nine outcomes arrive in order; the
 * income is refused only where the records disagree; the strip's counter and
 * the page's own ledger agree call for call; and the human can still finish
 * the application afterwards.
 */

const ORIGIN = process.env["APP_ORIGIN"] ?? "http://localhost:3100";

const EXPECTED_OUTCOMES = [
  ["get_application_state", "accepted"],
  ["get_form_requirements", "accepted"],
  ["get_evidence_index", "accepted"],
  ["apply_evidence_backed_answers", "accepted"],
  ["get_form_requirements", "accepted"],
  ["apply_evidence_backed_answers", "accepted"],
  ["apply_evidence_backed_answers", null],
  ["apply_evidence_backed_answers", "accepted"],
  ["prepare_submission_review", "not ready for review"],
] as const;

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

/** Starts a record set and gets as far as the rail's invitation. */
async function openDraft(
  page: Page,
  set: "supported" | "conflict",
): Promise<void> {
  await page.goto(`${ORIGIN}/`);
  await page
    .getByRole("button", {
      name:
        set === "supported"
          ? "Start with records that agree"
          : "Start with records that disagree",
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Application" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Watch an assistant fill this in" }),
  ).toBeEnabled();
}

/**
 * Runs the demonstration and collects the outcome badge for every step, in
 * order, by polling the strip between steps. "Skip ahead" is pressed each time
 * so the run does not spend its scripted pauses in a test.
 */
async function watch(
  page: Page,
): Promise<readonly (readonly [string, string])[]> {
  const seen: [string, string][] = [];
  for (let attempt = 0; attempt < 120; attempt += 1) {
    // The step number is the key, not the tool name: four of the nine steps
    // call the same tool and three of them succeed, so a run keyed on the
    // badge alone would silently collapse them into one.
    const progress = await page
      .locator(".watch-progress")
      .first()
      .textContent()
      .catch(() => null);
    const index = Number(/Step\s+(\d+)/.exec(progress ?? "")?.[1] ?? "0");
    const tool = await page
      .locator(".watch-call code")
      .first()
      .textContent()
      .catch(() => null);
    const badge = await page
      .locator(".watch-badge")
      .first()
      .textContent()
      .catch(() => null);
    if (
      index > 0 &&
      tool !== null &&
      badge !== null &&
      badge !== "calling…" &&
      seen.length === index - 1
    ) {
      seen.push([tool, badge]);
    }
    if ((await page.locator(".handoff").count()) > 0 && seen.length === 9) {
      break;
    }
    await page
      .getByRole("button", { name: "Skip ahead" })
      .click()
      .catch(() => undefined);
    await page.waitForTimeout(120);
  }
  return seen;
}

async function assertRun(
  page: Page,
  set: "supported" | "conflict",
): Promise<void> {
  // Nothing may be called before a person allows it. The button opens the
  // disclosure and stops; no tool call has been made at this point.
  await page
    .getByRole("button", { name: "Watch an assistant fill this in" })
    .click();
  await expect(
    page.getByRole("heading", { name: /Allow assisted access\?/ }),
  ).toBeVisible();
  await expect(page.locator(".watch-strip")).toHaveCount(0);
  await expect(page.locator(".activity-panel li")).toHaveCount(0);

  await page
    .getByRole("button", { name: "Allow assisted access", exact: true })
    .click();

  const seen = await watch(page);
  expect(seen.map(([tool]) => tool)).toEqual(
    EXPECTED_OUTCOMES.map(([tool]) => tool),
  );
  for (const [index, [, expected]] of EXPECTED_OUTCOMES.entries()) {
    const actual = seen[index]?.[1];
    if (expected !== null) {
      expect(actual, `step ${index + 1}`).toBe(expected);
    } else {
      // The income is the one step the two record sets answer differently.
      expect(actual, `step ${index + 1}`).toBe(
        set === "conflict" ? "conflict requires human" : "accepted",
      );
    }
  }

  // The counter on the strip is the page's own ledger, counted twice.
  const counter = await page.locator(".watch-counter").innerText();
  const calls = Number(/(\d+)\s*tool calls/.exec(counter)?.[1] ?? "-1");
  expect(calls).toBeGreaterThan(0);
  await expect(page.locator(".activity-panel li")).toHaveCount(calls);

  // The hand-off, with the honesty label on it.
  await expect(page.locator(".handoff")).toBeVisible();
  await expect(
    page.getByText("Scripted demonstration client.").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Feel the difference" }),
  ).toBeVisible();

  // And the person can still finish the application themselves.
  if (set === "conflict") {
    await page
      .getByLabel("Why you chose this source")
      .selectOption("more_recent");
    await page
      .getByRole("button", { name: "Use the Synthetic Income Statement" })
      .click();
  }
  await page
    .getByRole("button", { name: "I declare this is my address" })
    .click();
  await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();
  await page.getByRole("button", { name: "Prepare review" }).click();
  await expect(
    page.getByRole("heading", { name: "Review before submitting" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit this application" }).click();
  await expect(page.getByRole("heading", { name: "Submitted" })).toBeVisible();
}

for (const set of ["conflict", "supported"] as const) {
  test(`@watch the scripted client runs the real tool surface in Chrome — ${set}`, async () => {
    test.slow();
    const browser = await openChrome();
    test.skip(
      browser === null,
      "Google Chrome is not installed on this machine, so WebMCP cannot be exercised.",
    );
    if (browser === null) return;
    const page = await (
      await browser.newContext({ baseURL: ORIGIN })
    ).newPage();
    try {
      await openDraft(page, set);
      // This run really is going through the browser's own tool host.
      const hosted = await page.evaluate(async () => {
        const host = (document as unknown as { modelContext?: unknown })
          .modelContext as { getTools?: () => Promise<readonly unknown[]> };
        return typeof host?.getTools === "function"
          ? (await host.getTools()).length
          : 0;
      });
      expect(hosted).toBeGreaterThan(0);
      await assertRun(page, set);
    } finally {
      await browser.close();
    }
  });
}

test("@watch the same journey runs where the browser has no WebMCP at all", async ({
  page,
}) => {
  test.slow();
  // Headless Chromium exposes no document.modelContext, so this run can only
  // be taking the page's own descriptor route.
  const hosted = await page.evaluate(
    () => "modelContext" in document && document.modelContext !== undefined,
  );
  expect(hosted).toBe(false);
  await openDraft(page, "conflict");
  await assertRun(page, "conflict");
});

test("@watch the demonstration client holds the six registered tools and nothing else", async ({
  page,
}) => {
  await openDraft(page, "supported");
  // The client is handed a fixed list and looks a name up in it. Nothing on
  // the page exposes a way to reach a service, a capability or an endpoint —
  // and a name that is not one of the six has nowhere to resolve. This checks
  // the page publishes no such escape hatch on the window.
  const escapes = await page.evaluate(() =>
    Object.keys(window).filter((key) =>
      key.toLowerCase().includes("citeapply"),
    ),
  );
  expect(escapes).toEqual([]);

  const { invokeOver } = await import("../../src/ui/demo/runner.ts");
  const held = ["get_application_state", "get_form_requirements"];
  const invoke = invokeOver(
    held.map((name) => ({ name })),
    "page",
  );
  await expect(invoke("submit_application", {})).rejects.toThrow(
    "This client holds no tool named submit_application",
  );
  await expect(invoke("fetch", {})).rejects.toThrow(
    "This client holds no tool named fetch",
  );
});
