// Records ONE continuous real Chrome session of the CiteApply Conflict record
// set for the demo video. Every click is a real click; every tool call is the
// application's own scripted demonstration client going through WebMCP.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:3100";
const OUT = process.env.OUT_DIR ?? "docs/video/raw";
mkdirSync(OUT, { recursive: true });

const marks = [];
let t0 = 0;
const mark = (name, extra) => {
  const at = (Date.now() - t0) / 1000;
  marks.push({ name, at: Number(at.toFixed(2)), ...(extra ? { extra } : {}) });
  console.log(`[${at.toFixed(2)}s] ${name}`);
};
const beat = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  channel: "chrome",
  headless: false,
  slowMo: 260,
  args: ["--enable-features=WebMCPTesting", "--window-size=1456,916", "--hide-scrollbars"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  locale: "en-IN",
  timezoneId: "Asia/Kolkata",
  deviceScaleFactor: 1,
});
const page = await context.newPage();

try {
  t0 = Date.now();
  mark("recording_start");

  // ---- Landing -----------------------------------------------------------
  await page.goto(`${ORIGIN}/`, { waitUntil: "networkidle" });
  mark("landing");
  await beat(2500);
  await page.mouse.wheel(0, 420);
  await beat(1800);
  mark("landing_record_sets");
  await beat(2200);

  await page.getByRole("button", { name: "Start with records that disagree" }).click();
  await page.getByRole("heading", { name: "Application" }).waitFor();
  mark("application_loaded");
  await beat(2500);

  // ---- Discovery before consent, through the browser's own tool host ------
  const discovery = await page.evaluate(async () => {
    const host = document.modelContext;
    if (!host?.getTools) return { hosted: false };
    const tools = await host.getTools();
    const names = tools.map((t) => t.name);
    const call = async (name, args) => {
      try {
        return await document.modelContext.executeTool(name, args);
      } catch (error) {
        return { threw: String(error) };
      }
    };
    return {
      hosted: true,
      names,
      redacted: await call("get_application_state", { detail: "redacted" }),
      protectedRead: await call("get_application_state", { detail: "protected" }),
    };
  });
  mark("discovery_pre_consent", discovery);
  writeFileSync(`${OUT}/discovery.json`, JSON.stringify(discovery, null, 2));
  await beat(1200);

  // ---- The coach strip and the explicit choice ---------------------------
  const choice = page.getByRole("heading", { name: "How do you want to fill this in?" });
  if (await choice.count()) {
    mark("fill_choice");
    await beat(2600);
    await page.getByRole("button", { name: "Let an assistant help" }).click();
    mark("consent_dialog_from_choice");
    await beat(3200);
    await page.mouse.wheel(0, 260);
    await beat(2600);
    await page.mouse.wheel(0, 260);
    await beat(2600);
    await page.getByRole("button", { name: "Allow assisted access", exact: true }).click();
    mark("consent_allowed");
    await beat(2600);
  }
  const gotIt = page.getByRole("button", { name: "Got it" });
  if (await gotIt.count()) {
    mark("coach_strip");
    await beat(2800);
    await gotIt.click();
    await beat(900);
  }

  // ---- Where the assistant stops ----------------------------------------
  const stops = page.getByRole("heading", { name: /Where the assistant stops/i }).first();
  if (await stops.count()) {
    await stops.scrollIntoViewIfNeeded();
    mark("where_the_assistant_stops");
    await beat(4000);
  }

  // ---- Frame the two rows that are about to become required --------------
  const guardian = page.getByText("Guardian name").first();
  if (await guardian.count()) {
    await guardian.scrollIntoViewIfNeeded();
    mark("branch_rows_before");
    await beat(3000);
  }

  // ---- Watch an assistant fill this in -----------------------------------
  await page.getByRole("button", { name: "Watch an assistant fill this in" }).scrollIntoViewIfNeeded();
  mark("watch_button");
  await beat(1500);
  await page.getByRole("button", { name: "Watch an assistant fill this in" }).click();
  mark("watch_clicked");
  const dialog = page.getByRole("heading", { name: /Allow assisted access\?/ });
  if (await dialog.count()) {
    mark("watch_disclosure");
    await beat(3000);
    await page.getByRole("button", { name: "Allow assisted access", exact: true }).click();
    mark("watch_allowed");
  }

  // ---- The nine real calls, at natural pace ------------------------------
  const seen = [];
  for (let attempt = 0; attempt < 900; attempt += 1) {
    const progress = await page.locator(".watch-progress").first().textContent().catch(() => null);
    const index = Number(/Step\s+(\d+)/.exec(progress ?? "")?.[1] ?? "0");
    const tool = await page.locator(".watch-call code").first().textContent().catch(() => null);
    const badge = await page.locator(".watch-badge").first().textContent().catch(() => null);
    if (index > 0 && tool && badge && badge !== "calling…" && seen.length === index - 1) {
      seen.push([tool, badge]);
      mark(`step_${index}`, { tool, badge });
    }
    if ((await page.locator(".handoff").count()) > 0 && seen.length === 9) break;
    await beat(400);
  }
  mark("run_complete", { seen });
  writeFileSync(`${OUT}/run-outcomes.json`, JSON.stringify(seen, null, 2));

  // ---- Hand-off, and Feel the difference ---------------------------------
  await page.locator(".handoff").first().scrollIntoViewIfNeeded();
  mark("handoff");
  await beat(4500);
  const feel = page.getByRole("heading", { name: "Feel the difference" });
  if (await feel.count()) {
    await feel.scrollIntoViewIfNeeded();
    mark("feel_the_difference");
    await beat(4500);
  }

  // ---- The human reads both income records -------------------------------
  const incomeRow = page.getByText("Two accepted sources disagree. You decide.").first();
  await incomeRow.scrollIntoViewIfNeeded();
  mark("income_conflict_row");
  await beat(5000);

  // Open one record briefly, in a second tab, then come back.
  const pdf = await context.newPage();
  await pdf.goto(`${ORIGIN}/api/demo?document=conflict/income.pdf`).catch(() => {});
  mark("income_pdf_open");
  await beat(4000);
  await pdf.close();
  await page.bringToFront();
  mark("back_to_application");
  await beat(1500);

  // ---- Choose a reason, then a source ------------------------------------
  await incomeRow.scrollIntoViewIfNeeded();
  await beat(1200);
  await page.getByLabel("Why you chose this source").selectOption("more_recent");
  mark("reason_chosen");
  await beat(2400);
  await page.getByRole("button", { name: "Use the Synthetic Income Statement" }).click();
  mark("source_chosen");
  await beat(3000);

  // ---- Declare the email --------------------------------------------------
  await page.getByRole("button", { name: "I declare this is my address" }).click();
  mark("email_declared");
  await beat(3000);

  // ---- Prepare review -----------------------------------------------------
  await page.getByRole("button", { name: "Prepare review" }).click();
  await page.getByRole("heading", { name: "Review before submitting" }).waitFor();
  mark("review_frozen");
  await beat(3000);
  await page.mouse.wheel(0, 380);
  await beat(3200);
  await page.mouse.wheel(0, 380);
  mark("review_excerpts");
  await beat(3600);

  // ---- Submit -------------------------------------------------------------
  await page.getByRole("button", { name: "Submit this application" }).scrollIntoViewIfNeeded();
  await beat(1200);
  await page.getByRole("button", { name: "Submit this application" }).click();
  await page.getByRole("heading", { name: "Submitted" }).waitFor({ timeout: 20_000 });
  mark("receipt");
  await beat(3500);
  await page.mouse.wheel(0, 400);
  await beat(3000);
  mark("receipt_detail");
  await beat(2500);

  const download = page.getByRole("button", { name: "Download JSON" });
  await download.scrollIntoViewIfNeeded();
  await beat(1000);
  const waitDownload = page.waitForEvent("download", { timeout: 15_000 }).catch(() => null);
  await download.click();
  mark("download_json");
  const file = await waitDownload;
  if (file) await file.saveAs(`${OUT}/receipt.json`).catch(() => {});
  await beat(3500);
  mark("recording_end");
} catch (error) {
  mark("ERROR", { message: String(error) });
  console.error(error);
} finally {
  writeFileSync(`${OUT}/marks.json`, JSON.stringify({ startedAt: new Date(t0).toISOString(), marks }, null, 2));
  const video = page.video();
  await context.close();
  if (video) console.log("VIDEO:", await video.path());
  await browser.close();
}
