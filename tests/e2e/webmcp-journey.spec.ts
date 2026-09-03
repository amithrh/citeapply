import { chromium, expect, test, type Browser, type Page } from "@playwright/test";
import { appendFile, writeFile } from "node:fs/promises";

/**
 * The complete 13-step applicant journey driven through real Chrome's
 * `document.modelContext`, for both synthetic packets. WebMCP exists only in
 * the installed Chrome channel behind --enable-features=WebMCPTesting, so this
 * spec launches that channel itself and skips with a stated reason when it is
 * absent. Set CITEAPPLY_EVIDENCE_DIR to also write screenshots and a verbatim
 * tool log; the assertions run either way.
 */

const ORIGIN = process.env["APP_ORIGIN"] ?? "http://localhost:3100";
const DIR = process.env["CITEAPPLY_EVIDENCE_DIR"] ?? null;
const LOG = DIR === null ? null : `${DIR}/tool-log.md`;

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

async function call(page: Page, name: string, input: unknown): Promise<Record<string, unknown>> {
  const raw = (await page.evaluate(async ({ name, input }) => {
    const c = document.modelContext as unknown as {
      getTools: () => Promise<readonly { name: string }[]>;
      executeTool: (t: unknown, a: string) => Promise<unknown>;
    };
    const tools = await c.getTools();
    const tool = tools.find((t) => t.name === name);
    if (tool === undefined) throw new Error(`missing tool ${name}`);
    return c.executeTool(tool, JSON.stringify(input));
  }, { name, input })) as string;
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (LOG !== null) await appendFile(LOG, `\n**${name}**\n\nrequest\n\n\`\`\`json\n${JSON.stringify(input)}\n\`\`\`\n\nresponse\n\n\`\`\`json\n${JSON.stringify(parsed)}\n\`\`\`\n`);
  return parsed;
}

async function shot(page: Page, name: string): Promise<void> {
  if (DIR === null) return;
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
}

const uuid = (): string => crypto.randomUUID();

for (const packet of ["supported", "conflict"] as const) {
  test(`@journey the full 13-step WebMCP journey in real Chrome — ${packet}`, async () => {
    test.slow();
    const browser = await openChrome();
    test.skip(
      browser === null,
      "Google Chrome is not installed on this machine, so WebMCP cannot be exercised.",
    );
    if (browser === null) return;
    const page = await (await browser.newContext({ baseURL: ORIGIN })).newPage();
    const consoleErrors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    if (LOG !== null) await appendFile(LOG, `\n\n## ${packet} packet\n`);

    try {
      // 1 landing
      await page.goto(`${ORIGIN}/`);
      await shot(page, `${packet}-step01-landing`);

      // 2 start; server parses the packet PDFs at runtime and the form opens
      const label = packet === "supported" ? "Start supported packet" : "Start conflict packet";
      await page.getByRole("button", { name: label }).click();
      await expect(page.getByRole("heading", { name: "Application" })).toBeVisible();
      await expect(page.getByText("six CiteApply tools registered")).toBeVisible();
      await shot(page, `${packet}-step02-form-open`);

      // 3 discovery + refusal before consent
      const toolNames = await page.evaluate(async () => {
        const c = document.modelContext as unknown as { getTools: () => Promise<readonly { name: string }[]> };
        return (await c.getTools()).map((t) => t.name);
      });
      expect(toolNames.sort()).toEqual([
        "apply_evidence_backed_answers", "get_application_state", "get_evidence_index",
        "get_form_requirements", "get_validation_issues", "prepare_submission_review",
      ]);
      const redacted = await call(page, "get_application_state", { mode: "redacted" });
      expect(JSON.stringify(redacted)).not.toContain("legal_name");
      for (const [n, i] of [
        ["get_application_state", { mode: "protected" }],
        ["get_form_requirements", { mode: "active" }],
        ["get_evidence_index", {}],
        ["get_validation_issues", {}],
      ] as const) {
        const refused = await call(page, n, i);
        expect((refused["error"] as { code: string }).code).toBe("consent_required");
      }
      await shot(page, `${packet}-step03-pre-consent-refusals`);

      // 4 disclosure + allow
      await page.getByRole("button", { name: "Review and allow assisted access" }).click();
      await shot(page, `${packet}-step04a-consent-dialog`);
      await page.getByRole("button", { name: "Allow assisted access", exact: true }).click();
      await expect(page.getByText("Assisted access is allowed for this page and session.")).toBeVisible();
      await shot(page, `${packet}-step04b-access-allowed`);

      // 5 read, then a version-checked batch
      const v = (s: Record<string, unknown>) => s["data"] as { applicationRevision: number; requirementsVersion: number };
      let state = v(await call(page, "get_application_state", { mode: "protected" }));
      await call(page, "get_form_requirements", { mode: "active" });
      const evidence = await call(page, "get_evidence_index", {});
      const claims = (evidence["data"] as { claims: { kind: string; document: string; claimHandle: string }[] }).claims;
      const handle = (kind: string, doc?: string) => {
        const c = claims.find((x) => x.kind === kind && (doc === undefined || x.document === doc));
        if (c === undefined) throw new Error(`no claim ${kind}`);
        return c.claimHandle;
      };

      const unlinkedBefore = await page.getByText("Not linked yet").count();
      const beforeShot = await page.screenshot({ fullPage: true });

      const applied = await call(page, "apply_evidence_backed_answers", {
        requestId: uuid(),
        expectedApplicationRevision: state.applicationRevision,
        expectedRequirementsVersion: state.requirementsVersion,
        changes: [
          { kind: "bind_claim", field: "legal_name", claimHandle: handle("legal_name") },
          { kind: "bind_claim", field: "student_id", claimHandle: handle("student_id") },
          { kind: "bind_claim", field: "institution", claimHandle: handle("institution") },
          { kind: "bind_claim", field: "dependency", claimHandle: handle("dependency") },
        ],
      });
      expect(applied["ok"]).toBe(true);

      // 6 the form moved, with no reload, and the guardian branch opened
      await expect(page.getByText(/of 8 required answers are ready\./)).toBeVisible();
      await expect(page.getByText("Guardian name")).toBeVisible();
      await expect.poll(() => page.getByText("Not linked yet").count()).toBeLessThan(unlinkedBefore);
      const afterShot = await page.screenshot({ fullPage: true });
      expect(Buffer.compare(beforeShot, afterShot)).not.toBe(0);
      await shot(page, `${packet}-step06-after-assisted-batch-VISIBLE`);

      state = v(await call(page, "get_application_state", { mode: "protected" }));
      await call(page, "get_form_requirements", { mode: "active" });
      const branch = await call(page, "apply_evidence_backed_answers", {
        requestId: uuid(),
        expectedApplicationRevision: state.applicationRevision,
        expectedRequirementsVersion: state.requirementsVersion,
        changes: [
          { kind: "bind_claim", field: "guardian_name", claimHandle: handle("guardian_name") },
          { kind: "bind_claim", field: "household_size", claimHandle: handle("household_size") },
        ],
      });
      expect(branch["ok"]).toBe(true);
      await shot(page, `${packet}-step06b-branch-bound`);

      // 7 income
      state = v(await call(page, "get_application_state", { mode: "protected" }));
      const incomeAttempt = await call(page, "apply_evidence_backed_answers", {
        requestId: uuid(),
        expectedApplicationRevision: state.applicationRevision,
        expectedRequirementsVersion: state.requirementsVersion,
        changes: [{ kind: "bind_claim", field: "annual_household_income", claimHandle: handle("annual_household_income", "income") }],
      });
      if (packet === "conflict") {
        expect((incomeAttempt["error"] as { code: string }).code).toBe("conflict_requires_human");
        const held = v(await call(page, "get_application_state", { mode: "protected" }));
        expect(held.applicationRevision).toBe(state.applicationRevision);
        await expect(page.getByText("Two accepted sources disagree. You decide.")).toBeVisible();
      } else {
        expect(incomeAttempt["ok"]).toBe(true);
      }
      await shot(page, `${packet}-step07-income`);

      // 8 the agent may propose the email; the field still needs a declaration
      state = v(await call(page, "get_application_state", { mode: "protected" }));
      const proposed = await call(page, "apply_evidence_backed_answers", {
        requestId: uuid(),
        expectedApplicationRevision: state.applicationRevision,
        expectedRequirementsVersion: state.requirementsVersion,
        changes: [{ kind: "propose_email", field: "preferred_contact_email", value: "anaya.rao@example.test" }],
      });
      expect(proposed["ok"]).toBe(true);
      await expect(page.getByText("not yet declared")).toBeVisible();
      await shot(page, `${packet}-step08-email-proposed-not-declared`);

      // 9 premature prepare fails closed and lists the blockers
      state = v(await call(page, "get_application_state", { mode: "protected" }));
      const premature = await call(page, "prepare_submission_review", {
        requestId: uuid(),
        expectedApplicationRevision: state.applicationRevision,
        expectedRequirementsVersion: state.requirementsVersion,
      });
      const prematureError = premature["error"] as { code: string; blockers: { code: string }[] };
      expect(prematureError.code).toBe("not_ready_for_review");
      const codes = prematureError.blockers.map((b) => b.code);
      expect(codes).toContain("declaration_required");
      if (packet === "conflict") expect(codes).toContain("conflict_requires_human");
      await shot(page, `${packet}-step09-premature-prepare-refused`);

      // 10 the applicant decides, in the visible UI only
      if (packet === "conflict") {
        // The applicant states the reason first; until they do, both source
        // buttons are unavailable and the resolution cannot be made (D-P1-1).
        await expect(
          page.getByRole("button", { name: "Use the Synthetic Income Statement" }),
        ).toBeDisabled();
        await page
          .getByLabel("Why you chose this source")
          .selectOption("more_recent");
        await page.getByRole("button", { name: "Use the Synthetic Income Statement" }).click();
      }
      await page.getByRole("button", { name: "I declare this is my address" }).click();
      await expect(page.getByText("Nothing is blocking Review.")).toBeVisible();
      await shot(page, `${packet}-step10-human-decisions`);

      // 11 the agent prepares; assistance closes; the Review appears only in the UI
      state = v(await call(page, "get_application_state", { mode: "protected" }));
      const prepared = await call(page, "prepare_submission_review", {
        requestId: uuid(),
        expectedApplicationRevision: state.applicationRevision,
        expectedRequirementsVersion: state.requirementsVersion,
      });
      expect(prepared["ok"]).toBe(true);
      expect(JSON.stringify(prepared)).not.toContain("contentHash");
      await expect(page.getByRole("heading", { name: "Review before submitting" })).toBeVisible();
      await expect(page.getByText("Assisted access is allowed for this page and session.")).toHaveCount(0);
      await expect(page.getByText("Assisted access is closed while you review it.")).toBeVisible();
      const closed = await call(page, "get_application_state", { mode: "protected" });
      expect((closed["error"] as { code: string }).code).toBe("consent_required");
      await shot(page, `${packet}-step11-review-assistance-closed`);

      // 12 Return invalidates, then prepare again manually and submit
      await page.getByRole("button", { name: "Return to draft" }).click();
      await expect(page.getByRole("heading", { name: "Readiness" })).toBeVisible();
      await shot(page, `${packet}-step12a-returned-to-draft`);
      await page.getByRole("button", { name: "Prepare review" }).click();
      await expect(page.getByRole("heading", { name: "Review before submitting" })).toBeVisible();
      if (packet === "conflict") {
        await expect(page.getByText("INR 540,000")).toBeVisible();
        await expect(page.getByText("INR 480,000")).toBeVisible();
      }
      await shot(page, `${packet}-step12b-manual-review`);

      // 13 one atomic submission and the receipt
      await page.getByRole("button", { name: "Submit this application" }).click();
      await expect(page.getByRole("heading", { name: "Submitted" })).toBeVisible();
      if (packet === "conflict") {
        await expect(page.getByText("Income evidence differed and was resolved by the applicant.")).toBeVisible();
      }
      await shot(page, `${packet}-step13-receipt`);

      if (DIR !== null) {
        await writeFile(
          `${DIR}/${packet}-console-errors.txt`,
          consoleErrors.join("\n"),
        );
      }
    } finally {
      await browser.close();
    }
  });
}
