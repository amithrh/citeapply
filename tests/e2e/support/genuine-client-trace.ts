import { readFile } from "node:fs/promises";

export const PRIMARY_CLIENT_APPLICATION = "ChatGPT desktop" as const;
export const PRIMARY_CLIENT_SURFACE = "built-in browser" as const;

export const REQUIRED_TOOL_NAMES = [
  "get_application_state",
  "get_form_requirements",
  "get_evidence_index",
  "apply_evidence_backed_answers",
  "get_validation_issues",
  "prepare_submission_review",
] as const;

export type RequiredToolName = (typeof REQUIRED_TOOL_NAMES)[number];

export const REQUIRED_CHRONOLOGY_STEPS = [
  "registry",
  "pre_consent_refusal",
  "visible_allow",
  "protected_state",
  "protected_requirements",
  "protected_evidence",
  "first_apply",
  "first_apply_ui",
  "first_apply_postgres",
  "branch_state_reread",
  "branch_requirements_reread",
  "second_apply",
  "second_apply_ui",
  "second_apply_postgres",
  "income_refusal",
  "income_refusal_ui",
  "validation_issues",
  "blocked_prepare",
] as const;

export type RequiredChronologyStep =
  (typeof REQUIRED_CHRONOLOGY_STEPS)[number];

const TOOL_BY_STEP: Partial<Record<RequiredChronologyStep, RequiredToolName>> = {
  pre_consent_refusal: "get_application_state",
  protected_state: "get_application_state",
  protected_requirements: "get_form_requirements",
  protected_evidence: "get_evidence_index",
  first_apply: "apply_evidence_backed_answers",
  branch_state_reread: "get_application_state",
  branch_requirements_reread: "get_form_requirements",
  second_apply: "apply_evidence_backed_answers",
  income_refusal: "apply_evidence_backed_answers",
  validation_issues: "get_validation_issues",
  blocked_prepare: "prepare_submission_review",
};

const OUTCOME_BY_STEP: Record<RequiredChronologyStep, string> = {
  registry: "six_tools_discovered",
  pre_consent_refusal: "consent_required",
  visible_allow: "assistance_allowed",
  protected_state: "success",
  protected_requirements: "success",
  protected_evidence: "success",
  first_apply: "applied",
  first_apply_ui: "visible_persisted",
  first_apply_postgres: "persisted",
  branch_state_reread: "success",
  branch_requirements_reread: "success",
  second_apply: "applied",
  second_apply_ui: "visible_persisted",
  second_apply_postgres: "persisted",
  income_refusal: "conflict_requires_human",
  income_refusal_ui: "visible_no_change",
  validation_issues: "two_blockers",
  blocked_prepare: "not_ready_for_review",
};

const VALUE_FREE_CONSENT_REFUSAL = {
  ok: false,
  error: {
    code: "consent_required",
    message: "Use the visible CiteApply application to continue.",
    safeActions: ["use_visible_application"],
  },
} as const;

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256 = /^[0-9a-f]{64}$/;

export type GenuineClientTraceStep = Readonly<{
  sequence: number;
  atMs: number;
  step: RequiredChronologyStep;
  outcome: string;
  rawEventSha256: string;
  tool?: RequiredToolName;
  discoveredTools?: readonly RequiredToolName[];
  callbackResult?: unknown;
  requestId?: string;
  causedByRequestId?: string;
  applicationRevision?: number;
  requirementsVersion?: number;
}>;

export type GenuineClientTrace = Readonly<{
  schema: "citeapply-genuine-client-trace-v1";
  provenance: "unedited_external_primary_client";
  rawCaptureSha256: string;
  client: Readonly<{
    application: typeof PRIMARY_CLIENT_APPLICATION;
    surface: typeof PRIMARY_CLIENT_SURFACE;
    build: string;
    model: string;
    accountAvailability: "site_tools_available";
    settings: readonly string[];
    localRoute: string;
    observedAt: string;
    isSecureContext: true;
    secureHostCookieAccepted: true;
  }>;
  run: Readonly<{
    runId: string;
    applicationCorrelationSha256: string;
    sessionCorrelationSha256: string;
    startedAt: string;
    finishedAt: string;
    elapsedMs: number;
  }>;
  steps: readonly GenuineClientTraceStep[];
}>;

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
) {
  const allowedKeys = new Set(allowed);
  const unknown = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (unknown.length > 0) {
    throw new Error(`${label} contains unknown keys: ${unknown.join(", ")}.`);
  }
}

function requireString(value: unknown, label: string, maximum = 256) {
  if (typeof value !== "string" || value.length === 0 || value.length > maximum) {
    throw new Error(`${label} must be a non-empty string of at most ${maximum} characters.`);
  }
  return value;
}

function requireSafeInteger(value: unknown, label: string) {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a nonnegative safe integer.`);
  }
  return value as number;
}

function requireInstant(value: unknown, label: string) {
  const instant = requireString(value, label, 64);
  if (!Number.isFinite(Date.parse(instant))) {
    throw new Error(`${label} must be an RFC 3339 timestamp.`);
  }
  return instant;
}

function requireSha256(value: unknown, label: string) {
  const digest = requireString(value, label, 64);
  if (!SHA256.test(digest)) {
    throw new Error(`${label} must be a lowercase SHA-256 digest.`);
  }
  return digest;
}

function requireUuid(value: unknown, label: string) {
  const identifier = requireString(value, label, 36);
  if (!UUID_V4.test(identifier)) {
    throw new Error(`${label} must be a lowercase UUID v4.`);
  }
  return identifier;
}

function parseStep(value: unknown, index: number): GenuineClientTraceStep {
  const record = requireRecord(value, `steps[${index}]`);
  requireExactKeys(
    record,
    [
      "sequence",
      "atMs",
      "step",
      "outcome",
      "rawEventSha256",
      "tool",
      "discoveredTools",
      "callbackResult",
      "requestId",
      "causedByRequestId",
      "applicationRevision",
      "requirementsVersion",
    ],
    `steps[${index}]`,
  );

  const expectedStep = REQUIRED_CHRONOLOGY_STEPS[index];
  if (expectedStep === undefined) {
    throw new Error(`steps[${index}] is outside the locked chronology.`);
  }
  if (record["step"] !== expectedStep) {
    throw new Error(`steps[${index}].step must be ${expectedStep}.`);
  }

  const sequence = requireSafeInteger(record["sequence"], `steps[${index}].sequence`);
  if (sequence !== index + 1) {
    throw new Error(`steps[${index}].sequence must be ${index + 1}.`);
  }

  const atMs = requireSafeInteger(record["atMs"], `steps[${index}].atMs`);
  const outcome = requireString(record["outcome"], `steps[${index}].outcome`, 64);
  if (outcome !== OUTCOME_BY_STEP[expectedStep]) {
    throw new Error(`steps[${index}].outcome is not valid for ${expectedStep}.`);
  }

  const expectedTool = TOOL_BY_STEP[expectedStep];
  if (
    expectedTool === undefined
      ? record["tool"] !== undefined
      : record["tool"] !== expectedTool
  ) {
    throw new Error(`steps[${index}].tool is not valid for ${expectedStep}.`);
  }

  let discoveredTools: readonly RequiredToolName[] | undefined;
  if (expectedStep === "registry") {
    if (!Array.isArray(record["discoveredTools"])) {
      throw new Error("The registry step must contain discoveredTools.");
    }
    if (
      JSON.stringify(record["discoveredTools"]) !==
      JSON.stringify(REQUIRED_TOOL_NAMES)
    ) {
      throw new Error("The registry must contain exactly the six locked tools in order.");
    }
    discoveredTools = record["discoveredTools"] as RequiredToolName[];
  } else if (record["discoveredTools"] !== undefined) {
    throw new Error(`Only the registry step may contain discoveredTools.`);
  }

  let callbackResult: unknown;
  if (expectedStep === "pre_consent_refusal") {
    if (
      JSON.stringify(record["callbackResult"]) !==
      JSON.stringify(VALUE_FREE_CONSENT_REFUSAL)
    ) {
      throw new Error("The pre-consent result must be the exact value-free refusal.");
    }
    callbackResult = record["callbackResult"];
  } else if (record["callbackResult"] !== undefined) {
    throw new Error(`Only the pre-consent step may contain callbackResult.`);
  }

  const result: GenuineClientTraceStep = {
    sequence,
    atMs,
    step: expectedStep,
    outcome,
    rawEventSha256: requireSha256(
      record["rawEventSha256"],
      `steps[${index}].rawEventSha256`,
    ),
    ...(expectedTool === undefined ? {} : { tool: expectedTool }),
    ...(discoveredTools === undefined ? {} : { discoveredTools }),
    ...(callbackResult === undefined ? {} : { callbackResult }),
    ...(record["requestId"] === undefined
      ? {}
      : {
          requestId: requireUuid(
            record["requestId"],
            `steps[${index}].requestId`,
          ),
        }),
    ...(record["causedByRequestId"] === undefined
      ? {}
      : {
          causedByRequestId: requireUuid(
            record["causedByRequestId"],
            `steps[${index}].causedByRequestId`,
          ),
        }),
    ...(record["applicationRevision"] === undefined
      ? {}
      : {
          applicationRevision: requireSafeInteger(
            record["applicationRevision"],
            `steps[${index}].applicationRevision`,
          ),
        }),
    ...(record["requirementsVersion"] === undefined
      ? {}
      : {
          requirementsVersion: requireSafeInteger(
            record["requirementsVersion"],
            `steps[${index}].requirementsVersion`,
          ),
        }),
  };

  return result;
}

function assertMutationCorrelation(steps: readonly GenuineClientTraceStep[]) {
  for (const [callName, uiName, databaseName] of [
    ["first_apply", "first_apply_ui", "first_apply_postgres"],
    ["second_apply", "second_apply_ui", "second_apply_postgres"],
  ] as const) {
    const call = steps.find((step) => step.step === callName);
    const ui = steps.find((step) => step.step === uiName);
    const database = steps.find((step) => step.step === databaseName);
    if (
      call?.requestId === undefined ||
      ui?.causedByRequestId !== call.requestId ||
      database?.causedByRequestId !== call.requestId ||
      call.applicationRevision === undefined ||
      ui.applicationRevision !== call.applicationRevision ||
      database.applicationRevision !== call.applicationRevision
    ) {
      throw new Error(`${callName} lacks exact tool/UI/PostgreSQL causal correlation.`);
    }
  }

  const secondApply = steps.find((step) => step.step === "second_apply");
  const refusal = steps.find((step) => step.step === "income_refusal");
  const refusalUi = steps.find((step) => step.step === "income_refusal_ui");
  if (
    refusal?.requestId === undefined ||
    refusalUi?.causedByRequestId !== refusal.requestId ||
    secondApply?.applicationRevision === undefined ||
    refusal.applicationRevision !== secondApply.applicationRevision ||
    refusalUi.applicationRevision !== secondApply.applicationRevision
  ) {
    throw new Error("The income refusal must preserve the prior revision and visible value.");
  }
}

function assertVersionChronology(steps: readonly GenuineClientTraceStep[]) {
  const state = steps.find((step) => step.step === "protected_state");
  const requirements = steps.find(
    (step) => step.step === "protected_requirements",
  );
  const firstApply = steps.find((step) => step.step === "first_apply");
  const branchState = steps.find((step) => step.step === "branch_state_reread");
  const branchRequirements = steps.find(
    (step) => step.step === "branch_requirements_reread",
  );
  const secondApply = steps.find((step) => step.step === "second_apply");

  if (
    state?.applicationRevision === undefined ||
    state.requirementsVersion === undefined ||
    requirements?.applicationRevision !== state.applicationRevision ||
    requirements.requirementsVersion !== state.requirementsVersion ||
    firstApply?.applicationRevision === undefined ||
    firstApply.requirementsVersion === undefined ||
    firstApply.applicationRevision <= state.applicationRevision ||
    firstApply.requirementsVersion <= state.requirementsVersion ||
    branchState?.applicationRevision !== firstApply.applicationRevision ||
    branchState.requirementsVersion !== firstApply.requirementsVersion ||
    branchRequirements?.applicationRevision !== firstApply.applicationRevision ||
    branchRequirements.requirementsVersion !== firstApply.requirementsVersion ||
    secondApply?.applicationRevision === undefined ||
    secondApply.requirementsVersion !== firstApply.requirementsVersion ||
    secondApply.applicationRevision <= firstApply.applicationRevision
  ) {
    throw new Error("The trace does not prove branch reveal, reread, and second apply order.");
  }
}

export function validateGenuineClientTrace(value: unknown): GenuineClientTrace {
  const record = requireRecord(value, "trace");
  requireExactKeys(
    record,
    ["schema", "provenance", "rawCaptureSha256", "client", "run", "steps"],
    "trace",
  );
  if (record["schema"] !== "citeapply-genuine-client-trace-v1") {
    throw new Error("Unsupported genuine-client trace schema.");
  }
  if (record["provenance"] !== "unedited_external_primary_client") {
    throw new Error("Only an unedited external primary-client trace is accepted.");
  }

  const client = requireRecord(record["client"], "trace.client");
  requireExactKeys(
    client,
    [
      "application",
      "surface",
      "build",
      "model",
      "accountAvailability",
      "settings",
      "localRoute",
      "observedAt",
      "isSecureContext",
      "secureHostCookieAccepted",
    ],
    "trace.client",
  );
  if (
    client["application"] !== PRIMARY_CLIENT_APPLICATION ||
    client["surface"] !== PRIMARY_CLIENT_SURFACE ||
    client["accountAvailability"] !== "site_tools_available" ||
    client["isSecureContext"] !== true ||
    client["secureHostCookieAccepted"] !== true
  ) {
    throw new Error("The trace is not from the required secure ChatGPT desktop client.");
  }
  if (
    !Array.isArray(client["settings"]) ||
    client["settings"].length === 0 ||
    client["settings"].length > 16 ||
    client["settings"].some(
      (setting) => typeof setting !== "string" || setting.length === 0 || setting.length > 128,
    )
  ) {
    throw new Error("trace.client.settings must contain 1–16 bounded strings.");
  }

  const localRoute = requireString(
    client["localRoute"],
    "trace.client.localRoute",
    256,
  );
  const route = new URL(localRoute);
  if (
    (route.protocol !== "http:" && route.protocol !== "https:") ||
    route.hostname !== "localhost" ||
    route.pathname !== "/application" ||
    route.username !== "" ||
    route.password !== "" ||
    route.search !== "" ||
    route.hash !== ""
  ) {
    throw new Error("The primary-client trace must use the exact local /application route.");
  }

  const run = requireRecord(record["run"], "trace.run");
  requireExactKeys(
    run,
    [
      "runId",
      "applicationCorrelationSha256",
      "sessionCorrelationSha256",
      "startedAt",
      "finishedAt",
      "elapsedMs",
    ],
    "trace.run",
  );
  const startedAt = requireInstant(run["startedAt"], "trace.run.startedAt");
  const finishedAt = requireInstant(run["finishedAt"], "trace.run.finishedAt");
  const elapsedMs = requireSafeInteger(run["elapsedMs"], "trace.run.elapsedMs");
  if (elapsedMs === 0 || elapsedMs > 120_000) {
    throw new Error("Each genuine-client chronology must finish within 120 seconds.");
  }
  if (Math.abs(Date.parse(finishedAt) - Date.parse(startedAt) - elapsedMs) > 1_000) {
    throw new Error("The wall and monotonic trace durations do not agree.");
  }

  if (
    !Array.isArray(record["steps"]) ||
    record["steps"].length !== REQUIRED_CHRONOLOGY_STEPS.length
  ) {
    throw new Error("The trace must contain exactly the locked chronology steps.");
  }
  const steps = record["steps"].map(parseStep);
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const previous = steps[index - 1];
    if (step === undefined || step.atMs > elapsedMs) {
      throw new Error(`steps[${index}].atMs is outside the run.`);
    }
    if (previous !== undefined && step.atMs < previous.atMs) {
      throw new Error("Trace step times must be monotonic.");
    }
  }
  const eventDigests = new Set(steps.map((step) => step.rawEventSha256));
  if (eventDigests.size !== steps.length) {
    throw new Error("Every chronology step must bind a distinct raw event.");
  }

  assertVersionChronology(steps);
  assertMutationCorrelation(steps);

  return {
    schema: "citeapply-genuine-client-trace-v1",
    provenance: "unedited_external_primary_client",
    rawCaptureSha256: requireSha256(
      record["rawCaptureSha256"],
      "trace.rawCaptureSha256",
    ),
    client: {
      application: PRIMARY_CLIENT_APPLICATION,
      surface: PRIMARY_CLIENT_SURFACE,
      build: requireString(client["build"], "trace.client.build", 128),
      model: requireString(client["model"], "trace.client.model", 128),
      accountAvailability: "site_tools_available",
      settings: client["settings"] as string[],
      localRoute,
      observedAt: requireInstant(
        client["observedAt"],
        "trace.client.observedAt",
      ),
      isSecureContext: true,
      secureHostCookieAccepted: true,
    },
    run: {
      runId: requireUuid(run["runId"], "trace.run.runId"),
      applicationCorrelationSha256: requireSha256(
        run["applicationCorrelationSha256"],
        "trace.run.applicationCorrelationSha256",
      ),
      sessionCorrelationSha256: requireSha256(
        run["sessionCorrelationSha256"],
        "trace.run.sessionCorrelationSha256",
      ),
      startedAt,
      finishedAt,
      elapsedMs,
    },
    steps,
  };
}

export async function readGenuineClientTrace(
  filePath: string,
): Promise<GenuineClientTrace> {
  const bytes = await readFile(filePath);
  if (bytes.byteLength === 0 || bytes.byteLength > 256 * 1024) {
    throw new Error("A genuine-client trace must be 1–262,144 bytes.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error("The genuine-client trace is not valid UTF-8 JSON.");
  }
  return validateGenuineClientTrace(decoded);
}

export function genuineClientFingerprint(trace: GenuineClientTrace) {
  return JSON.stringify({
    application: trace.client.application,
    surface: trace.client.surface,
    build: trace.client.build,
    model: trace.client.model,
    accountAvailability: trace.client.accountAvailability,
    settings: trace.client.settings,
    localRoute: trace.client.localRoute,
    isSecureContext: trace.client.isSecureContext,
    secureHostCookieAccepted: trace.client.secureHostCookieAccepted,
  });
}
