import { chromium, expect, test, type Browser, type Page } from "@playwright/test";

/**
 * D-1 regression: a successful assisted mutation must be visible in the form
 * without a reload, and the assisted-access banner must follow server truth.
 *
 * WebMCP only exists in real Chrome behind `--enable-features=WebMCPTesting`,
 * so this spec launches the installed Chrome channel itself instead of the
 * bundled Chromium. When that channel is absent, or the flag does not expose
 * `document.modelContext`, the spec skips with the reason stated.
 */

const ORIGIN = process.env["APP_ORIGIN"] ?? "http://localhost:3000";

type ToolCall = Readonly<{ name: string; input: unknown }>;

async function callTool(page: Page, call: ToolCall): Promise<unknown> {
  return page.evaluate(async ({ name, input }) => {
    // Chrome 152 exposes `executeTool(toolObject, jsonString)`, which the
    // published WebMCP typings do not describe yet.
    const context = document.modelContext as unknown as {
      getTools: () => Promise<readonly { name: string }[]>;
      executeTool: (tool: unknown, argumentsJson: string) => Promise<unknown>;
    };
    const tools = await context.getTools();
    const tool = tools.find((candidate) => candidate.name === name);
    if (tool === undefined) throw new Error(`Tool not registered: ${name}`);
    return context.executeTool(tool, JSON.stringify(input));
  }, call);
}

/** Chrome returns the callback result as a JSON string. */
function payloadOf(result: unknown): Record<string, unknown> {
  if (typeof result === "string") {
    return JSON.parse(result) as Record<string, unknown>;
  }
  return result as Record<string, unknown>;
}

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

test("@journey an assisted batch is visible in the form without a reload", async () => {
  test.slow();
  const browser = await openChrome();
  test.skip(
    browser === null,
    "Google Chrome is not installed on this machine, so WebMCP cannot be exercised.",
  );
  if (browser === null) return;

  const context = await browser.newContext({ baseURL: ORIGIN });
  const page = await context.newPage();

  try {
    await page.goto(`${ORIGIN}/`);
    await page.getByRole("button", { name: "Start supported packet" }).click();
    await expect(
      page.getByRole("heading", { name: "Application" }),
    ).toBeVisible();

    const hasWebMcp = await page.evaluate(
      () => typeof document.modelContext === "object",
    );
    test.skip(
      !hasWebMcp,
      "This Chrome build does not expose document.modelContext under --enable-features=WebMCPTesting.",
    );
    if (!hasWebMcp) return;

    await expect(page.getByText("six CiteApply tools registered")).toBeVisible();
    await expect(page.getByText("No assisted tool calls yet.")).toBeVisible();

    // The applicant allows assisted access in the visible UI. The agent is
    // never given a capability; it only calls the registered tools.
    await page
      .getByRole("button", { name: "Review and allow assisted access" })
      .click();
    await page.getByRole("button", { name: "Allow assisted access", exact: true }).click();
    await expect(
      page.getByText("Assisted access is allowed for this page and session."),
    ).toBeVisible();

    const state = payloadOf(
      await callTool(page, {
        name: "get_application_state",
        input: { mode: "protected" },
      }),
    );
    const versions = (state["data"] ?? {}) as {
      applicationRevision: number;
      requirementsVersion: number;
    };

    const evidence = payloadOf(
      await callTool(page, { name: "get_evidence_index", input: {} }),
    );
    const claims = (
      (evidence["data"] ?? {}) as {
        claims: readonly { kind: string; claimHandle: string }[];
      }
    ).claims;
    const handleFor = (kind: string): string => {
      const claim = claims.find((candidate) => candidate.kind === kind);
      if (claim === undefined) throw new Error(`No claim for ${kind}`);
      return claim.claimHandle;
    };

    const beforeCount = await page.getByText("Not linked yet").count();
    expect(beforeCount).toBeGreaterThan(0);
    const before = await page.screenshot({ fullPage: true });

    const applied = payloadOf(
      await callTool(page, {
        name: "apply_evidence_backed_answers",
        input: {
          requestId: crypto.randomUUID(),
          expectedApplicationRevision: versions.applicationRevision,
          expectedRequirementsVersion: versions.requirementsVersion,
          changes: [
            { kind: "bind_claim", field: "legal_name", claimHandle: handleFor("legal_name") },
            { kind: "bind_claim", field: "student_id", claimHandle: handleFor("student_id") },
            { kind: "bind_claim", field: "institution", claimHandle: handleFor("institution") },
            { kind: "bind_claim", field: "dependency", claimHandle: handleFor("dependency") },
          ],
        },
      }),
    );
    expect(applied["ok"]).toBe(true);

    // The activity list is the visible proof that the call happened at all.
    await expect(
      page.getByRole("listitem").filter({ hasText: "apply_evidence_backed_answers" }),
    ).toBeVisible();

    // The form itself moved: fewer unlinked rows, and the guardian branch is
    // now open, which is only reachable through the dependency binding.
    await expect
      .poll(async () => page.getByText("Not linked yet").count())
      .toBeLessThan(beforeCount);
    await expect(page.getByText("Guardian name")).toBeVisible();
    await expect(page.getByText(/of 8 required answers are ready\./)).toBeVisible();

    const after = await page.screenshot({ fullPage: true });
    expect(Buffer.compare(before, after)).not.toBe(0);
  } finally {
    await browser.close();
  }
});

test("@journey preparing the Review through a tool closes the visible banner", async () => {
  test.slow();
  const browser = await openChrome();
  test.skip(
    browser === null,
    "Google Chrome is not installed on this machine, so WebMCP cannot be exercised.",
  );
  if (browser === null) return;

  const context = await browser.newContext({ baseURL: ORIGIN });
  const page = await context.newPage();

  try {
    await page.goto(`${ORIGIN}/`);
    await page.getByRole("button", { name: "Start supported packet" }).click();
    await expect(
      page.getByRole("heading", { name: "Application" }),
    ).toBeVisible();

    const hasWebMcp = await page.evaluate(
      () => typeof document.modelContext === "object",
    );
    test.skip(
      !hasWebMcp,
      "This Chrome build does not expose document.modelContext under --enable-features=WebMCPTesting.",
    );
    if (!hasWebMcp) return;

    // Complete the whole Draft with the visible manual controls only.
    for (const label of ["Link enrollment record", "Link household record"]) {
      for (let index = 0; index < 3; index += 1) {
        await page.getByRole("button", { name: label }).first().click();
        await page.waitForTimeout(250);
      }
    }
    await page.getByRole("button", { name: "Link income record" }).click();
    await page.getByRole("button", { name: "Save email" }).click();
    await page
      .getByRole("button", { name: "I declare this is my address" })
      .click();
    await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();

    await page
      .getByRole("button", { name: "Review and allow assisted access" })
      .click();
    await page.getByRole("button", { name: "Allow assisted access", exact: true }).click();
    await expect(
      page.getByText("Assisted access is allowed for this page and session."),
    ).toBeVisible();

    const state = payloadOf(
      await callTool(page, {
        name: "get_application_state",
        input: { mode: "protected" },
      }),
    );
    const versions = (state["data"] ?? {}) as {
      applicationRevision: number;
      requirementsVersion: number;
    };

    const prepared = payloadOf(
      await callTool(page, {
        name: "prepare_submission_review",
        input: {
          requestId: crypto.randomUUID(),
          expectedApplicationRevision: versions.applicationRevision,
          expectedRequirementsVersion: versions.requirementsVersion,
        },
      }),
    );
    expect(prepared["ok"]).toBe(true);

    // The server closed assistance when it froze the Review, and the page now
    // says so without a reload.
    await expect(
      page.getByRole("heading", { name: "Review before submitting" }),
    ).toBeVisible();
    await expect(
      page.getByText("Assisted access is allowed for this page and session."),
    ).toHaveCount(0);
    await expect(
      page.getByText("Assisted access is closed while you review it."),
    ).toBeVisible();
    await expect(page.getByText("Assisted access is off.")).toBeVisible();
    await expect(
      page.getByRole("listitem").filter({ hasText: "prepare_submission_review" }),
    ).toBeVisible();
  } finally {
    await browser.close();
  }
});
