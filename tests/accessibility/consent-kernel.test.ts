import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";
import ts from "typescript";

import {
  ASSISTED_ACCESS_CATALOG,
  ConsentDialog,
} from "../../src/ui/components/consent.tsx";

const EXPECTED_ASSISTED_ACCESS_CATALOG = {
  purpose:
    "Help with this synthetic application in this current page and this 60-minute session.",
  includedCategories: [
    "Saved form answers, including the preferred contact email",
    "Values extracted from the three synthetic records, including name, student ID, institution, household details, and income",
    "Document names and page numbers",
    "Questions that currently apply and their source rules",
    "Current validation blockers",
    "Limited review readiness status",
  ],
  permittedActions: [
    "Link policy-allowed sources to draft answers",
    "Propose the synthetic .test email for the applicant to review and declare",
    "Create a Review for the applicant to inspect, but only from a ready Draft with no unsaved changes",
  ],
  reviewPreparationEffect:
    "If Review creation succeeds, it keeps that exact saved content and CiteApply turns assisted access off.",
  excludedData: [
    "Raw PDFs and complete source excerpts",
    "The applicant declaration record",
    "The private income-conflict choice or reason",
    "The full Review and complete review diff",
    "Confirmation, submission, Receipt, and export data",
  ],
  excludedActions: [
    "Choose a packet",
    "Make the applicant declaration",
    "Resolve the income conflict",
    "Return from Review",
    "Confirm or submit the application",
    "Load, download, print, or export a Receipt",
  ],
  readinessLimit:
    "Because current blockers and limited readiness are included, the assistant may learn that a required human step is complete, but not the private conflict choice or reason.",
  separatePermissions:
    "This choice controls only CiteApply's six assisted tools. It does not change permissions you separately grant your browser, extension, or assistant.",
  revocationLimit:
    "Revoking blocks new access, but an action CiteApply already accepted may still finish, and information already returned cannot be recalled.",
  stoppedWaitingLimit:
    "If a request stops waiting after CiteApply received it, the page checks the saved application instead of promising that the action was cancelled.",
} as const;

const CATALOG_KEYS = [
  "purpose",
  "includedCategories",
  "permittedActions",
  "reviewPreparationEffect",
  "excludedData",
  "excludedActions",
  "readinessLimit",
  "separatePermissions",
  "revocationLimit",
  "stoppedWaitingLimit",
] as const;

const TECHNICAL_DETAILS =
  "Access is limited to the current application page and session. Refresh, a newer-page takeover, session expiry, or successful Review preparation clears it. A server-authorized in-flight result may arrive after Revoke; an authority loss that wins first returns no protected result.";

const VALUE_FREE_REFUSAL = Object.freeze({
  ok: false as const,
  error: Object.freeze({
    code: "consent_required" as const,
    message: "Use the visible CiteApply application to continue.",
    safeActions: Object.freeze(["use_visible_application"] as const),
  }),
});

const NOT_READY_FOR_REVIEW = Object.freeze({
  ok: false as const,
  code: "not_ready_for_review" as const,
});

const EXPECTED_SAVED_DRAFT = {
  applicationRevision: 7,
  answers: {
    applicantName: "SYNTHETIC APPLICANT",
    preferredContactEmail: "synthetic.applicant@example.test",
    householdIncome: "42000",
  },
} as const;

type AssistanceState = "off" | "allowed";
type ApplicationStage = "draft" | "review";
type ReviewPath = "assisted" | "manual";
type ProtectedOperation = "read" | "mutation";
type SavedDraft = Readonly<{
  applicationRevision: number;
  answers: Readonly<{
    applicantName: string;
    preferredContactEmail: string;
    householdIncome: string;
  }>;
}>;
type ReviewSnapshot = Readonly<{
  content: SavedDraft;
  origin: ReviewPath;
}>;
type ProtectedSuccess = Readonly<{
  ok: true;
  operation: ProtectedOperation;
  effect: "none" | "one_complete";
}>;
type ProtectedResult = ProtectedSuccess | typeof VALUE_FREE_REFUSAL;
type FinalizedProtectedOperation = Readonly<{
  result: ProtectedResult;
}>;

function createSavedDraft(): SavedDraft {
  return Object.freeze({
    applicationRevision: EXPECTED_SAVED_DRAFT.applicationRevision,
    answers: Object.freeze({ ...EXPECTED_SAVED_DRAFT.answers }),
  });
}

function cloneSavedDraft(savedDraft: SavedDraft): SavedDraft {
  return Object.freeze({
    applicationRevision: savedDraft.applicationRevision,
    answers: Object.freeze({ ...savedDraft.answers }),
  });
}

/**
 * A test-only consent transition model. It proves disclosure semantics and
 * ordering expectations; it does not claim to replace later server race or E2E
 * verification.
 */
class ConsentTransitionKernel {
  assistance: AssistanceState = "off";
  stage: ApplicationStage = "draft";
  ready = false;
  dirty = false;
  focus = "review-application-button";
  readonly savedDraft = createSavedDraft();
  reviewSnapshot: ReviewSnapshot | null = null;
  reviewCount = 0;
  assistedRequestCount = 0;
  protectedEffectCount = 0;
  readonly #committedResults = new Map<string, ProtectedSuccess>();

  allow() {
    if (this.stage !== "draft") {
      throw new Error("Assisted access can be allowed only in Draft.");
    }
    this.assistance = "allowed";
  }

  continueManually() {
    this.assistance = "off";
    this.focus = "review-application-button";
  }

  revoke() {
    this.assistance = "off";
  }

  setReviewConditions({
    ready,
    dirty,
  }: Readonly<{ ready: boolean; dirty: boolean }>) {
    this.ready = ready;
    this.dirty = dirty;
  }

  prepareReview(path: ReviewPath) {
    if (path === "assisted" && this.assistance !== "allowed") {
      return VALUE_FREE_REFUSAL;
    }

    if (this.stage !== "draft" || !this.ready || this.dirty) {
      if (path === "manual") {
        this.focus = "review-readiness-error";
      } else {
        this.assistedRequestCount += 1;
      }
      return NOT_READY_FOR_REVIEW;
    }

    if (path === "assisted") {
      this.assistedRequestCount += 1;
    }

    this.reviewCount += 1;
    this.reviewSnapshot = Object.freeze({
      content: cloneSavedDraft(this.savedDraft),
      origin: path,
    });
    this.stage = "review";
    this.assistance = "off";

    return Object.freeze({
      ok: true as const,
      reviewId: `opaque-review-${this.reviewCount}`,
      ready: true as const,
    });
  }

  returnToDraft() {
    if (this.stage !== "review") {
      throw new Error("Return is available only from Review.");
    }
    this.stage = "draft";
    this.assistance = "off";
    this.reviewSnapshot = null;
    this.focus = "review-application-button";
  }

  finalizeProtectedOperation(
    requestId: string,
    operation: ProtectedOperation,
  ): FinalizedProtectedOperation {
    // Current authority intentionally precedes committed replay lookup.
    if (this.stage !== "draft" || this.assistance !== "allowed") {
      return Object.freeze({ result: VALUE_FREE_REFUSAL });
    }

    const prior = this.#committedResults.get(requestId);
    if (prior !== undefined) {
      if (prior.operation !== operation) {
        throw new Error("A request identity cannot change operation kind.");
      }
      return Object.freeze({ result: prior });
    }

    const result = Object.freeze({
      ok: true as const,
      operation,
      effect:
        operation === "mutation" ? ("one_complete" as const) : ("none" as const),
    });
    this.#committedResults.set(requestId, result);
    if (operation === "mutation") {
      this.protectedEffectCount += 1;
    }
    return Object.freeze({ result });
  }

  deliver(finalized: FinalizedProtectedOperation): ProtectedResult {
    return finalized.result;
  }
}

type BrowserHarnessState = Readonly<{
  assistance: AssistanceState;
  allowCount: number;
  manualCount: number;
  savedDraft: typeof EXPECTED_SAVED_DRAFT;
}>;

let consentBrowserBundlePromise: Promise<string> | undefined;

async function buildConsentBrowserBundle(): Promise<string> {
  const workspace = process.cwd();
  const consentSource = await readFile(
    resolve(workspace, "src/ui/components/consent.tsx"),
    "utf8",
  );
  const transformed = ts.transpileModule(consentSource, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2023,
    },
    fileName: "consent.tsx",
    reportDiagnostics: true,
  });
  const diagnostics = transformed.diagnostics ?? [];
  if (diagnostics.length !== 0) {
    throw new Error(
      diagnostics
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        )
        .join("\n"),
    );
  }

  const moduleSources: Record<string, string> = {
    react: await readFile(
      resolve(workspace, "node_modules/react/cjs/react.production.js"),
      "utf8",
    ),
    "react/jsx-runtime": await readFile(
      resolve(
        workspace,
        "node_modules/react/cjs/react-jsx-runtime.production.js",
      ),
      "utf8",
    ),
    "react-dom": await readFile(
      resolve(workspace, "node_modules/react-dom/cjs/react-dom.production.js"),
      "utf8",
    ),
    "react-dom/client": await readFile(
      resolve(
        workspace,
        "node_modules/react-dom/cjs/react-dom-client.production.js",
      ),
      "utf8",
    ),
    scheduler: await readFile(
      resolve(workspace, "node_modules/scheduler/cjs/scheduler.production.js"),
      "utf8",
    ),
    "citeapply-consent": transformed.outputText,
  };

  return `(() => {
    "use strict";
    const sources = ${JSON.stringify(moduleSources)};
    const cache = Object.create(null);
    const processShim = Object.freeze({ env: Object.freeze({ NODE_ENV: "production" }) });
    function load(id) {
      if (!Object.hasOwn(sources, id)) {
        throw new Error("Unknown browser-test module: " + id);
      }
      if (Object.hasOwn(cache, id)) {
        return cache[id].exports;
      }
      const module = { exports: {} };
      cache[id] = module;
      const execute = new Function("module", "exports", "require", "process", sources[id]);
      execute(module, module.exports, load, processShim);
      return module.exports;
    }

    const React = load("react");
    const ReactDOMClient = load("react-dom/client");
    const { ConsentDialog } = load("citeapply-consent");
    const savedDraft = Object.freeze({
      applicationRevision: 7,
      answers: Object.freeze({
        applicantName: "SYNTHETIC APPLICANT",
        preferredContactEmail: "synthetic.applicant@example.test",
        householdIncome: "42000"
      })
    });
    const harness = {
      state: {
        assistance: "off",
        allowCount: 0,
        manualCount: 0,
        savedDraft
      }
    };

    function Host() {
      const [open, setOpen] = React.useState(false);
      const [assistance, setAssistance] = React.useState("off");
      harness.state.assistance = assistance;

      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "button",
          {
            id: "allow-assisted-access-trigger",
            type: "button",
            onClick: () => setOpen(true)
          },
          "Review and allow assisted access"
        ),
        React.createElement(ConsentDialog, {
          open,
          busy: false,
          onAllow: () => {
            harness.state.allowCount += 1;
            setAssistance("allowed");
            setOpen(false);
          },
          onContinueManually: () => {
            harness.state.manualCount += 1;
            setAssistance("off");
            setOpen(false);
          }
        })
      );
    }

    window.__citeapplyConsentHarness = harness;
    ReactDOMClient.createRoot(document.getElementById("consent-test-root")).render(
      React.createElement(Host)
    );
  })();`;
}

function getConsentBrowserBundle(): Promise<string> {
  consentBrowserBundlePromise ??= buildConsentBrowserBundle();
  return consentBrowserBundlePromise;
}

async function mountInteractiveConsent(page: Page) {
  await page.setContent(
    '<!doctype html><html lang="en"><body><main id="consent-test-root"></main></body></html>',
  );
  await page.addScriptTag({ content: await getConsentBrowserBundle() });
  const trigger = page.getByRole("button", {
    name: "Review and allow assisted access",
    exact: true,
  });
  await expect(trigger).toBeVisible();
  return trigger;
}

async function readBrowserHarnessState(page: Page): Promise<BrowserHarnessState> {
  return page.evaluate(() => {
    const testWindow = window as typeof window & {
      __citeapplyConsentHarness?: { state: BrowserHarnessState };
    };
    const harness = testWindow.__citeapplyConsentHarness;
    if (harness === undefined) {
      throw new Error("Consent browser harness was not mounted.");
    }
    return harness.state;
  });
}

async function showInteractiveProductionDialog(page: Page) {
  const trigger = await mountInteractiveConsent(page);
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Allow assisted access?" });
  await expect(dialog).toBeVisible();
  return dialog;
}

function expectValueFree(result: ProtectedResult) {
  expect(result).toEqual(VALUE_FREE_REFUSAL);
  const serialized = JSON.stringify(result);
  for (const forbidden of [
    "applicationId",
    "packet",
    "revision",
    "requirementsVersion",
    "claim",
    "handle",
    "blocker",
    "email",
    "income",
    "reviewId",
  ]) {
    expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
  }
}

test("@consent-kernel production catalog is the exact three-action authorization contract", () => {
  expect(typeof ConsentDialog).toBe("function");
  expect(Object.keys(ASSISTED_ACCESS_CATALOG)).toEqual(CATALOG_KEYS);
  expect(ASSISTED_ACCESS_CATALOG).toEqual(EXPECTED_ASSISTED_ACCESS_CATALOG);
  expect(ASSISTED_ACCESS_CATALOG.permittedActions).toHaveLength(3);
  expect(new Set(ASSISTED_ACCESS_CATALOG.permittedActions).size).toBe(3);
  expect(ASSISTED_ACCESS_CATALOG.excludedActions).toContain("Return from Review");
  expect(ASSISTED_ACCESS_CATALOG.excludedActions).toContain(
    "Confirm or submit the application",
  );
  expect(ASSISTED_ACCESS_CATALOG.excludedActions).toContain(
    "Load, download, print, or export a Receipt",
  );
});

test("@consent-kernel rendered production dialog exactly projects the catalog and limits", async ({
  page,
}) => {
  const dialog = await showInteractiveProductionDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName("Allow assisted access?");
  await expect(dialog).toHaveAccessibleDescription(
    "CiteApply can let an assistant help link synthetic source records to this draft. Assistance is optional; every application control remains available manually. Help with this synthetic application in this current page and this 60-minute session.",
  );

  const accessibleWiring = await dialog.evaluate((node) => {
    const heading = node.querySelector("h2");
    const describedBy = node.getAttribute("aria-describedby")?.split(/\s+/u) ?? [];
    return {
      labelledBy: node.getAttribute("aria-labelledby"),
      headingId: heading?.id ?? null,
      describedBy,
      describedParagraphIds: Array.from(
        node.querySelectorAll("p[id]"),
        (item) => item.id,
      ),
    };
  });
  expect(accessibleWiring.labelledBy).toBe(accessibleWiring.headingId);
  expect(accessibleWiring.describedBy).toEqual(
    accessibleWiring.describedParagraphIds.slice(0, 2),
  );

  const included = dialog.getByRole("region", {
    name: "Information the tools may receive",
    exact: true,
  });
  const actions = dialog.getByRole("region", {
    name: "Actions the tools may request",
    exact: true,
  });
  const excludedData = dialog.getByRole("region", {
    name: "Information the tools will not receive",
    exact: true,
  });
  const excludedActions = dialog.getByRole("region", {
    name: "Actions the tools cannot take",
    exact: true,
  });

  expect(await included.getByRole("listitem").allTextContents()).toEqual(
    ASSISTED_ACCESS_CATALOG.includedCategories,
  );
  expect(await actions.getByRole("listitem").allTextContents()).toEqual(
    ASSISTED_ACCESS_CATALOG.permittedActions,
  );
  expect(await excludedData.getByRole("listitem").allTextContents()).toEqual(
    ASSISTED_ACCESS_CATALOG.excludedData,
  );
  expect(await excludedActions.getByRole("listitem").allTextContents()).toEqual(
    ASSISTED_ACCESS_CATALOG.excludedActions,
  );

  const visibleEffect = actions.locator("ul + p");
  await expect(visibleEffect).toHaveText(
    ASSISTED_ACCESS_CATALOG.reviewPreparationEffect,
  );
  await expect(visibleEffect).toBeVisible();
  expect(
    await visibleEffect.evaluate((node) => node.closest("details") === null),
  ).toBe(true);

  for (const visibleLimit of [
    ASSISTED_ACCESS_CATALOG.purpose,
    ASSISTED_ACCESS_CATALOG.readinessLimit,
    ASSISTED_ACCESS_CATALOG.separatePermissions,
    ASSISTED_ACCESS_CATALOG.revocationLimit,
    ASSISTED_ACCESS_CATALOG.stoppedWaitingLimit,
  ]) {
    await expect(dialog.getByText(visibleLimit, { exact: true })).toBeVisible();
  }

  const allow = dialog.getByRole("button", {
    name: "Allow assisted access",
    exact: true,
  });
  const manual = dialog.getByRole("button", {
    name: "Continue manually",
    exact: true,
  });
  await expect(allow).toBeVisible();
  await expect(manual).toBeVisible();
  expect(await allow.getAttribute("aria-pressed")).toBeNull();
  expect(await manual.getAttribute("aria-pressed")).toBeNull();

  const details = dialog.locator("details");
  await expect(details).not.toHaveAttribute("open", "");
  await details.getByText("Technical details", { exact: true }).click();
  await expect(details.locator("p")).toHaveText(TECHNICAL_DETAILS);
  await expect(details.locator("p")).toBeVisible();
});

for (const key of ["Enter", "Space"] as const) {
  test(`@consent-kernel real dialog keyboard ${key} allows once and restores opener focus`, async ({
    page,
  }) => {
    const trigger = await mountInteractiveConsent(page);
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Allow assisted access?" });
    const allow = dialog.getByRole("button", {
      name: "Allow assisted access",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(allow).toBeFocused();

    await page.keyboard.press(key);

    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await readBrowserHarnessState(page)).toEqual({
      assistance: "allowed",
      allowCount: 1,
      manualCount: 0,
      savedDraft: EXPECTED_SAVED_DRAFT,
    });
  });
}

test("@consent-kernel real Continue manually preserves work, refuses access, and restores focus", async ({
  page,
}) => {
  const trigger = await mountInteractiveConsent(page);
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Allow assisted access?" });
  await dialog
    .getByRole("button", { name: "Continue manually", exact: true })
    .click();

  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await readBrowserHarnessState(page)).toEqual({
    assistance: "off",
    allowCount: 0,
    manualCount: 1,
    savedDraft: EXPECTED_SAVED_DRAFT,
  });
  expectValueFree(
    new ConsentTransitionKernel().finalizeProtectedOperation("manual", "read")
      .result,
  );
});

test("@consent-kernel real Escape chooses manual continuation without authorizing", async ({
  page,
}) => {
  const trigger = await mountInteractiveConsent(page);
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Allow assisted access?" });
  await expect(
    dialog.getByRole("button", { name: "Allow assisted access", exact: true }),
  ).toBeFocused();

  await page.keyboard.press("Escape");

  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await readBrowserHarnessState(page)).toEqual({
    assistance: "off",
    allowCount: 0,
    manualCount: 1,
    savedDraft: EXPECTED_SAVED_DRAFT,
  });
});

test("@consent-kernel pre-Allow protected result is exact and value-free", () => {
  const kernel = new ConsentTransitionKernel();
  expectValueFree(kernel.finalizeProtectedOperation("pre-allow", "read").result);
  expect(kernel.protectedEffectCount).toBe(0);
});

test("@consent-kernel dirty or not-ready Review fails without closing access or changing saved work", () => {
  for (const reviewCondition of [
    { ready: false, dirty: false },
    { ready: true, dirty: true },
  ] as const) {
    const kernel = new ConsentTransitionKernel();
    kernel.allow();
    kernel.setReviewConditions(reviewCondition);
    const before = JSON.stringify(kernel.savedDraft);

    expect(kernel.prepareReview("assisted")).toEqual(NOT_READY_FOR_REVIEW);
    expect(kernel.stage).toBe("draft");
    expect(kernel.assistance).toBe("allowed");
    expect(kernel.reviewCount).toBe(0);
    expect(kernel.reviewSnapshot).toBeNull();
    expect(JSON.stringify(kernel.savedDraft)).toBe(before);
  }

  for (const reviewCondition of [
    { ready: false, dirty: false },
    { ready: true, dirty: true },
  ] as const) {
    const manual = new ConsentTransitionKernel();
    manual.allow();
    manual.setReviewConditions(reviewCondition);
    const before = JSON.stringify(manual.savedDraft);

    expect(manual.prepareReview("manual")).toEqual(NOT_READY_FOR_REVIEW);
    expect(manual.stage).toBe("draft");
    expect(manual.assistance).toBe("allowed");
    expect(manual.reviewCount).toBe(0);
    expect(manual.reviewSnapshot).toBeNull();
    expect(manual.assistedRequestCount).toBe(0);
    expect(manual.focus).toBe("review-readiness-error");
    expect(JSON.stringify(manual.savedDraft)).toBe(before);
  }
});

test("@consent-kernel ready clean manual and assisted Reviews preserve identical authoritative content", () => {
  const assisted = new ConsentTransitionKernel();
  assisted.allow();
  assisted.setReviewConditions({ ready: true, dirty: false });
  const assistedResult = assisted.prepareReview("assisted");

  const manualFromAllowed = new ConsentTransitionKernel();
  manualFromAllowed.allow();
  manualFromAllowed.setReviewConditions({ ready: true, dirty: false });
  const manualFromAllowedResult = manualFromAllowed.prepareReview("manual");

  const manualAfterDecline = new ConsentTransitionKernel();
  manualAfterDecline.continueManually();
  manualAfterDecline.setReviewConditions({ ready: true, dirty: false });
  const manualAfterDeclineResult = manualAfterDecline.prepareReview("manual");

  expect(assistedResult).toEqual({
    ok: true,
    reviewId: "opaque-review-1",
    ready: true,
  });
  expect(manualFromAllowedResult).toEqual(assistedResult);
  expect(manualAfterDeclineResult).toEqual(assistedResult);
  expect(assisted.reviewSnapshot?.content).toEqual(
    manualFromAllowed.reviewSnapshot?.content,
  );
  expect(assisted.reviewSnapshot?.content).toEqual(
    manualAfterDecline.reviewSnapshot?.content,
  );
  expect(assisted.reviewSnapshot?.content).toEqual(EXPECTED_SAVED_DRAFT);
  expect(assisted.reviewSnapshot?.origin).toBe("assisted");
  expect(manualFromAllowed.reviewSnapshot?.origin).toBe("manual");
  expect(manualAfterDecline.reviewSnapshot?.origin).toBe("manual");
  expect(assisted.assistedRequestCount).toBe(1);
  expect(manualFromAllowed.assistedRequestCount).toBe(0);
  expect(manualAfterDecline.assistedRequestCount).toBe(0);
  expect(manualFromAllowed.stage).toBe("review");
  expect(manualFromAllowed.assistance).toBe("off");
  expectValueFree(
    manualFromAllowed.finalizeProtectedOperation("manual-after-review", "read")
      .result,
  );
  manualFromAllowed.returnToDraft();
  expect(manualFromAllowed.stage).toBe("draft");
  expect(manualFromAllowed.assistance).toBe("off");
  expectValueFree(
    manualFromAllowed.finalizeProtectedOperation("manual-after-return", "read")
      .result,
  );
  expect(JSON.stringify(assistedResult)).not.toContain("SYNTHETIC APPLICANT");
  expect(Object.isFrozen(assisted.reviewSnapshot)).toBe(true);
  expect(Object.isFrozen(assisted.reviewSnapshot?.content)).toBe(true);
});

test("@consent-kernel successful Review closes assistance and Return never reauthorizes", () => {
  const kernel = new ConsentTransitionKernel();
  kernel.allow();
  kernel.setReviewConditions({ ready: true, dirty: false });
  const savedBefore = JSON.stringify(kernel.savedDraft);

  expect(kernel.prepareReview("assisted")).toEqual({
    ok: true,
    reviewId: "opaque-review-1",
    ready: true,
  });
  expect(kernel.stage).toBe("review");
  expect(kernel.assistance).toBe("off");
  expect(kernel.reviewCount).toBe(1);
  expect(JSON.stringify(kernel.savedDraft)).toBe(savedBefore);
  expectValueFree(kernel.finalizeProtectedOperation("after-review", "read").result);

  kernel.returnToDraft();
  expect(kernel.stage).toBe("draft");
  expect(kernel.assistance).toBe("off");
  expect(kernel.reviewSnapshot).toBeNull();
  expect(JSON.stringify(kernel.savedDraft)).toBe(savedBefore);
  expectValueFree(
    kernel.finalizeProtectedOperation("after-return", "mutation").result,
  );

  kernel.allow();
  expect(kernel.assistance).toBe("allowed");
});

test("@consent-kernel a finalized result may arrive after Revoke while authority-loss-first is value-free", () => {
  for (const operation of ["read", "mutation"] as const) {
    const authorizedFirst = new ConsentTransitionKernel();
    authorizedFirst.allow();
    const requestId = `revoke-authorized-${operation}`;
    const finalized = authorizedFirst.finalizeProtectedOperation(requestId, operation);
    const exactRetry = authorizedFirst.finalizeProtectedOperation(requestId, operation);
    expect(exactRetry.result).toBe(finalized.result);
    expect(authorizedFirst.protectedEffectCount).toBe(
      operation === "mutation" ? 1 : 0,
    );

    authorizedFirst.revoke();
    expect(authorizedFirst.deliver(finalized)).toEqual({
      ok: true,
      operation,
      effect: operation === "mutation" ? "one_complete" : "none",
    });
    expect(authorizedFirst.deliver(finalized)).toBe(finalized.result);
    expect(authorizedFirst.protectedEffectCount).toBe(
      operation === "mutation" ? 1 : 0,
    );
    expectValueFree(
      authorizedFirst.finalizeProtectedOperation(requestId, operation).result,
    );

    const authorityLostFirst = new ConsentTransitionKernel();
    authorityLostFirst.allow();
    authorityLostFirst.revoke();
    expectValueFree(
      authorityLostFirst.finalizeProtectedOperation(
        `revoke-first-${operation}`,
        operation,
      ).result,
    );
    expect(authorityLostFirst.protectedEffectCount).toBe(0);
    expect(authorityLostFirst.savedDraft).toEqual(EXPECTED_SAVED_DRAFT);
  }
});

test("@consent-kernel a finalized result may arrive after Review closure while closure-first is value-free", () => {
  for (const reviewPath of ["assisted", "manual"] as const) {
    for (const operation of ["read", "mutation"] as const) {
      const authorizedFirst = new ConsentTransitionKernel();
      authorizedFirst.allow();
      authorizedFirst.setReviewConditions({ ready: true, dirty: false });
      const requestId = `review-authorized-${reviewPath}-${operation}`;
      const finalized = authorizedFirst.finalizeProtectedOperation(
        requestId,
        operation,
      );

      expect(authorizedFirst.prepareReview(reviewPath)).toEqual({
        ok: true,
        reviewId: "opaque-review-1",
        ready: true,
      });
      expect(authorizedFirst.assistance).toBe("off");
      expect(authorizedFirst.deliver(finalized)).toEqual({
        ok: true,
        operation,
        effect: operation === "mutation" ? "one_complete" : "none",
      });
      expect(authorizedFirst.protectedEffectCount).toBe(
        operation === "mutation" ? 1 : 0,
      );
      expectValueFree(
        authorizedFirst.finalizeProtectedOperation(requestId, operation).result,
      );

      const authorityLostFirst = new ConsentTransitionKernel();
      authorityLostFirst.allow();
      authorityLostFirst.setReviewConditions({ ready: true, dirty: false });
      expect(authorityLostFirst.prepareReview(reviewPath)).toEqual({
        ok: true,
        reviewId: "opaque-review-1",
        ready: true,
      });
      expectValueFree(
        authorityLostFirst.finalizeProtectedOperation(
          `review-first-${reviewPath}-${operation}`,
          operation,
        ).result,
      );
      expect(authorityLostFirst.protectedEffectCount).toBe(0);
      expect(authorityLostFirst.reviewSnapshot?.content).toEqual(
        EXPECTED_SAVED_DRAFT,
      );
      expect(authorityLostFirst.reviewSnapshot?.origin).toBe(reviewPath);
      expect(authorityLostFirst.assistedRequestCount).toBe(
        reviewPath === "assisted" ? 1 : 0,
      );
    }
  }
});
