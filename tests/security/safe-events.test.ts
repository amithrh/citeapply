import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { isProxy } from "node:util/types";

import ts from "typescript";

import {
  ActionBaseFailureSchema,
  DemoGetFailureSchema,
  DemoStartFailureSchema,
  ReceiptExportFailureSchema,
  SnapshotFailureSchema,
  SubmissionFailureSchema,
} from "../../src/contracts/http.ts";
import {
  AtCapacityFailureSchema,
  BridgeInactiveFailureSchema,
  ConnectionUnavailableSchema,
  ConflictRequiresHumanFailureSchema,
  ConsentRequiredFailureSchema,
  DemoChangeLimitFailureSchema,
  DemoTokenUnavailableSchema,
  DocumentUnavailableFailureSchema,
  EvidenceUnavailableFailureSchema,
  ExportUnavailableSchema,
  InvalidRequestFailureSchema,
  MutationUnavailableSchema,
  NotReadyForReviewFailureSchema,
  RateLimitedFailureSchema,
  ReadUnavailableSchema,
  ReceiptUnavailableSchema,
  RequestReuseMismatchFailureSchema,
  ReviewInvalidatedFailureSchema,
  SessionExpiredFailureSchema,
  StalePageFailureSchema,
  StaleStateFailureSchema,
  StartUnavailableFailureSchema,
} from "../../src/contracts/outcomes.ts";
import { GetApplicationStateRedactedServerResultSchema } from "../../src/contracts/webmcp.ts";
import * as safeEventModule from "../../src/server/observability/safe-events.ts";

const {
  SAFE_DURATION_BUCKETS,
  SAFE_EVENT_COORDINATES,
  SAFE_OUTCOME_CODES,
  SAFE_REQUEST_ACTION,
  SAFE_ROUTE_CODES,
  SAFE_SIZE_BUCKETS,
  assertSafeEvent,
  durationBucket,
  recordFinalPublicResult,
  sizeBucket,
} = safeEventModule;

type RecordFinalPublicResultInput = safeEventModule.RecordFinalPublicResultInput;
type SafeEvent = safeEventModule.SafeEvent;
type SafeEventSink = safeEventModule.SafeEventSink;

const EXPECTED_NODE = "v24.20.0";
const EXPECTED_TYPESCRIPT = "6.0.3";
const NOW = "2026-08-28T00:00:00Z";
const LATER = "2026-08-28T00:00:01Z";
const REFERENCE_A = "CA-01234567";
const REFERENCE_B = "CA-89ABCDEF";

const EXPECTED_RUNTIME_EXPORTS = [
  "SAFE_DURATION_BUCKETS",
  "SAFE_EVENT_COORDINATES",
  "SAFE_OUTCOME_CODES",
  "SAFE_REQUEST_ACTION",
  "SAFE_ROUTE_CODES",
  "SAFE_SIZE_BUCKETS",
  "assertSafeEvent",
  "durationBucket",
  "recordFinalPublicResult",
  "sizeBucket",
] as const;

const EXPECTED_ROUTES = [
  "demo_get",
  "demo_start",
  "application",
  "actions",
  "webmcp",
  "submission",
  "receipt",
] as const;

const EXPECTED_OUTCOMES = [
  "completed",
  "temporarily_unavailable",
] as const;

const EXPECTED_COORDINATES = [
  ["demo_get", "request", "completed"],
  ["demo_get", "request", "temporarily_unavailable"],
  ["demo_start", "request", "completed"],
  ["demo_start", "request", "temporarily_unavailable"],
  ["application", "request", "completed"],
  ["application", "request", "temporarily_unavailable"],
  ["actions", "request", "completed"],
  ["actions", "request", "temporarily_unavailable"],
  ["webmcp", "request", "completed"],
  ["webmcp", "request", "temporarily_unavailable"],
  ["submission", "request", "completed"],
  ["submission", "request", "temporarily_unavailable"],
  ["receipt", "request", "completed"],
  ["receipt", "request", "temporarily_unavailable"],
] as const;

const EXPECTED_DURATION_BUCKETS = [
  "under_10ms",
  "10_to_49ms",
  "50_to_199ms",
  "200_to_999ms",
  "1_to_2s",
  "over_2s",
] as const;

const EXPECTED_SIZE_BUCKETS = [
  "empty",
  "under_1kib",
  "1_to_4kib",
  "4_to_16kib",
  "16_to_64kib",
  "over_64kib",
] as const;

const SENSITIVE_ACTIONS = [
  "issue_start_token",
  "start",
  "snapshot",
  "prepare_review",
  "get_application_state",
  "submit",
  "load",
] as const;

const OTHER_TOOL_NAMES = [
  "get_form_requirements",
  "get_evidence_index",
  "apply_evidence_backed_answers",
  "get_validation_issues",
  "prepare_submission_review",
] as const;

const HUMAN_ACTIONS = [
  "bind_evidence",
  "clear_evidence",
  "clear_dependency",
  "save_email",
  "declare_email",
  "resolve_income",
  "clear_income_resolution",
  "allow_assisted_access",
  "revoke_assisted_access",
  "return_to_draft",
] as const;

const FIELD_NAMES = [
  "legal_name",
  "student_id",
  "institution",
  "preferred_contact_email",
  "dependency",
  "guardian_name",
  "household_size",
  "annual_household_income",
] as const;

const NON_TEMPORARY_PUBLIC_FAILURE_CODES = [
  "session_expired",
  "stale_page",
  "consent_required",
  "stale_state",
  "request_reuse_mismatch",
  "evidence_unavailable",
  "conflict_requires_human",
  "not_ready_for_review",
  "review_invalidated",
  "demo_change_limit",
  "invalid_request",
  "rate_limited",
  "at_capacity",
  "document_unavailable",
  "assistance_unavailable",
] as const;

const COMPLETED_KEYS = [
  "action",
  "durationBucket",
  "outcome",
  "route",
  "sizeBucket",
  "timestamp",
] as const;

const UNAVAILABLE_KEYS = [
  ...COMPLETED_KEYS,
  "supportReference",
] as const;

type ExpectedRoute = (typeof EXPECTED_ROUTES)[number];
type Boundary = "event" | "envelope" | "success" | "failure" | "error";

const labels = new Set<string>();
let runtimePositiveCount = 0;
let runtimeNegativeCount = 0;

function register(kind: "positive" | "negative", label: string): void {
  const identity = `${kind}:${label}`;
  assert.equal(labels.has(identity), false, `duplicate runtime label: ${identity}`);
  labels.add(identity);
  if (kind === "positive") runtimePositiveCount += 1;
  else runtimeNegativeCount += 1;
}

function positive(label: string, probe: () => void): void {
  register("positive", label);
  probe();
}

function negative(label: string, probe: () => void): void {
  register("negative", label);
  probe();
}

function completedEvent(route: ExpectedRoute = "application"): Record<string, unknown> {
  return {
    timestamp: NOW,
    route,
    action: "request",
    outcome: "completed",
    durationBucket: "under_10ms",
    sizeBucket: "under_1kib",
  };
}

function unavailableEvent(
  route: ExpectedRoute = "application",
  supportReference = REFERENCE_A,
): Record<string, unknown> {
  return {
    timestamp: NOW,
    route,
    action: "request",
    outcome: "temporarily_unavailable",
    supportReference,
    durationBucket: "under_10ms",
    sizeBucket: "under_1kib",
  };
}

function successResult(data: unknown = Object.freeze({ safe: true })): Record<string, unknown> {
  return { ok: true, data };
}

function invalidRequestResult(): ReturnType<typeof InvalidRequestFailureSchema.parse> {
  return InvalidRequestFailureSchema.parse({
    ok: false,
    error: {
      code: "invalid_request",
      message: "The request is not valid.",
      safeActions: ["use_visible_application"],
    },
  });
}

function readUnavailableResult(supportReference = REFERENCE_A) {
  return ReadUnavailableSchema.parse({
    ok: false,
    error: {
      code: "temporarily_unavailable",
      message: "CiteApply is temporarily unavailable.",
      supportReference,
      safeActions: ["use_visible_application"],
    },
  });
}

function recordingInput(
  route: ExpectedRoute = "application",
  finalResult: unknown = successResult(),
): Record<string, unknown> {
  return {
    route,
    finalResult,
    timestamp: NOW,
    durationBucket: "under_10ms",
    sizeBucket: "under_1kib",
  };
}

function recordUnknown(input: unknown, sink?: SafeEventSink): void {
  recordFinalPublicResult(input as RecordFinalPublicResultInput, sink);
}

function recordOne(input: unknown): SafeEvent {
  const events: SafeEvent[] = [];
  recordUnknown(input, (event) => events.push(event));
  assert.equal(events.length, 1);
  return events[0] as SafeEvent;
}

function assertOrdinaryFrozenEvent(
  event: SafeEvent,
  expectedRoute: ExpectedRoute,
  expectedOutcome: "completed" | "temporarily_unavailable",
  expectedReference?: string,
): void {
  assert.equal(isProxy(event), false);
  assert.equal(Object.getPrototypeOf(event), Object.prototype);
  assert.equal(Object.isFrozen(event), true);
  assert.equal(event.timestamp, NOW);
  assert.equal(event.route, expectedRoute);
  assert.equal(event.action, "request");
  assert.equal(event.outcome, expectedOutcome);
  assert.equal(event.durationBucket, "under_10ms");
  assert.equal(event.sizeBucket, "under_1kib");
  const expectedKeys = expectedOutcome === "completed"
    ? [...COMPLETED_KEYS]
    : [...UNAVAILABLE_KEYS].sort();
  const ownKeys = Reflect.ownKeys(event);
  assert.equal(ownKeys.every((key) => typeof key === "string"), true);
  assert.deepEqual(
    ownKeys.map(String).sort(),
    expectedKeys,
  );
  const descriptors = Object.getOwnPropertyDescriptors(event);
  assert.deepEqual(Object.keys(descriptors).sort(), expectedKeys);
  for (const key of expectedKeys) {
    const descriptor = descriptors[key];
    assert.notEqual(descriptor, undefined);
    assert.equal(Object.hasOwn(descriptor as PropertyDescriptor, "value"), true);
    assert.equal(descriptor?.enumerable, true);
    assert.equal(descriptor?.writable, false);
    assert.equal(descriptor?.configurable, false);
    assert.equal(descriptor?.get, undefined);
    assert.equal(descriptor?.set, undefined);
  }
  if (expectedOutcome === "completed") {
    assert.equal(Object.hasOwn(event, "supportReference"), false);
  } else {
    assert.equal(event.supportReference, expectedReference);
  }
}

function assertTypeError(probe: () => void): void {
  assert.throws(probe, TypeError);
}

function rejectDirect(label: string, event: unknown): void {
  negative(label, () => assertTypeError(() => assertSafeEvent(event)));
}

function rejectRecording(label: string, input: unknown): void {
  negative(label, () => {
    let sinkCalls = 0;
    assertTypeError(() => recordUnknown(input, () => {
      sinkCalls += 1;
    }));
    assert.equal(sinkCalls, 0);
  });
}

function reference(index: number): string {
  return `CA-${index.toString(16).toUpperCase().padStart(8, "0")}`;
}

function parseWith(
  schema: Readonly<{ parse(value: unknown): unknown }>,
  raw: unknown,
): unknown {
  return schema.parse(raw);
}

function unavailableRaw(
  message: string,
  safeAction: string,
  supportReference: string,
): Record<string, unknown> {
  return {
    ok: false,
    error: {
      code: "temporarily_unavailable",
      message,
      supportReference,
      safeActions: [safeAction],
    },
  };
}

function fullAllowedError(): Record<string, unknown> {
  return {
    code: "invalid_request",
    message: "opaque-message",
    safeActions: Object.freeze(["opaque-action"]),
    currentVersions: Object.freeze({ opaque: "versions" }),
    blockers: Object.freeze([{ opaque: "blocker" }]),
    retryAfterSeconds: Object.freeze({ opaque: "retry" }),
    document: Object.freeze({ opaque: "document" }),
    supportReference: REFERENCE_A,
  };
}

function cloneWithPrototype(
  source: Record<string, unknown>,
  prototype: object | null,
): Record<string, unknown> {
  const clone = Object.create(prototype) as Record<string, unknown>;
  Object.defineProperties(clone, Object.getOwnPropertyDescriptors(source));
  return clone;
}

function baseBoundary(boundary: Boundary): Record<string, unknown> {
  switch (boundary) {
    case "event":
      return unavailableEvent();
    case "envelope":
      return recordingInput("application", readUnavailableResult());
    case "success":
      return successResult();
    case "failure":
      return invalidRequestResult();
    case "error":
      return fullAllowedError();
  }
}

function invokeBoundary(
  boundary: Boundary,
  subject: unknown,
  sink: SafeEventSink,
): void {
  switch (boundary) {
    case "event": {
      const checked = assertSafeEvent(subject);
      sink(checked);
      return;
    }
    case "envelope":
      recordUnknown(subject, sink);
      return;
    case "success":
    case "failure":
      recordUnknown(recordingInput("application", subject), sink);
      return;
    case "error":
      recordUnknown(recordingInput("application", { ok: false, error: subject }), sink);
  }
}

function rejectBoundary(label: string, boundary: Boundary, subject: unknown): void {
  negative(label, () => {
    let sinkCalls = 0;
    assertTypeError(() => invokeBoundary(boundary, subject, () => {
      sinkCalls += 1;
    }));
    assert.equal(sinkCalls, 0);
  });
}

type DescriptorInstrumentation = Readonly<{
  original: typeof Object.getOwnPropertyDescriptors;
  restore: () => void;
  countFor: (target: object) => number;
  total: () => number;
}>;

function instrumentOwnDescriptorReads(
  afterCapture?: (
    target: object,
    descriptors: PropertyDescriptorMap,
    call: number,
  ) => void,
): DescriptorInstrumentation {
  const property = Object.getOwnPropertyDescriptor(
    Object,
    "getOwnPropertyDescriptors",
  );
  assert.notEqual(property, undefined);
  const original = Object.getOwnPropertyDescriptors;
  const counts = new WeakMap<object, number>();
  let calls = 0;
  Object.defineProperty(Object, "getOwnPropertyDescriptors", {
    ...(property as PropertyDescriptor),
    value(target: object): PropertyDescriptorMap {
      calls += 1;
      counts.set(target, (counts.get(target) ?? 0) + 1);
      const descriptors = Reflect.apply(original, Object, [target]) as PropertyDescriptorMap;
      afterCapture?.(target, descriptors, calls);
      return descriptors;
    },
  });
  return {
    original,
    restore(): void {
      Object.defineProperty(Object, "getOwnPropertyDescriptors", property as PropertyDescriptor);
    },
    countFor(target: object): number {
      return counts.get(target) ?? 0;
    },
    total(): number {
      return calls;
    },
  };
}

function compileVirtual(source: string, suffix: string): readonly ts.Diagnostic[] {
  const configPath = resolve("tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    process.cwd(),
    { noEmit: true, incremental: false },
    configPath,
  );
  assert.deepEqual(parsed.errors, []);
  const virtualPath = resolve(`tests/security/__g4e10_safe_events_${suffix}.ts`);
  const originalHost = ts.createCompilerHost(parsed.options);
  const originalFileExists = originalHost.fileExists.bind(originalHost);
  const originalReadFile = originalHost.readFile.bind(originalHost);
  const originalGetSourceFile = originalHost.getSourceFile.bind(originalHost);
  originalHost.fileExists = (fileName) =>
    resolve(fileName) === virtualPath || originalFileExists(fileName);
  originalHost.readFile = (fileName) =>
    resolve(fileName) === virtualPath ? source : originalReadFile(fileName);
  originalHost.getSourceFile = (
    fileName,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) =>
    resolve(fileName) === virtualPath
      ? ts.createSourceFile(fileName, source, languageVersion, true)
      : originalGetSourceFile(
          fileName,
          languageVersion,
          onError,
          shouldCreateNewSourceFile,
        );
  const program = ts.createProgram({
    rootNames: [virtualPath],
    options: parsed.options,
    host: originalHost,
  });
  return ts.getPreEmitDiagnostics(program);
}

function diagnosticText(diagnostics: readonly ts.Diagnostic[]): string {
  return diagnostics
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      if (diagnostic.file === undefined || diagnostic.start === undefined) {
        return `TS${diagnostic.code}: ${message}`;
      }
      const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      return `${position.line + 1}:${position.character + 1} TS${diagnostic.code}: ${message}`;
    })
    .join("\n");
}

const COMPILE_BASE = `
import * as SafeEventExports from "../../src/server/observability/safe-events.ts";
import {
  SAFE_EVENT_COORDINATES,
  SAFE_REQUEST_ACTION,
  recordFinalPublicResult,
  type RecordFinalPublicResultInput,
  type SafeDurationBucket,
  type SafeEvent,
  type SafeEventCoordinate,
  type SafeEventSink,
  type SafeOutcomeCode,
  type SafeRequestAction,
  type SafeRouteCode,
  type SafeSizeBucket,
} from "../../src/server/observability/safe-events.ts";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type ExpectedDurationBucket = "under_10ms" | "10_to_49ms" | "50_to_199ms" | "200_to_999ms" | "1_to_2s" | "over_2s";
type ExpectedSizeBucket = "empty" | "under_1kib" | "1_to_4kib" | "4_to_16kib" | "16_to_64kib" | "over_64kib";

type ExpectedSafeEventBase = {
  timestamp: string;
  route: SafeRouteCode;
  action: "request";
  durationBucket: ExpectedDurationBucket;
  sizeBucket: ExpectedSizeBucket;
};
type ExpectedSafeEvent =
  | Readonly<ExpectedSafeEventBase & { outcome: "completed"; supportReference?: never }>
  | Readonly<ExpectedSafeEventBase & { outcome: "temporarily_unavailable"; supportReference: string }>;
type ExpectedFinalPublicResult =
  | Readonly<{ ok: true; data: unknown }>
  | Readonly<{ ok: false; error: Readonly<{ code: string; supportReference?: unknown }> }>;
type ExpectedRecorderInput = Readonly<{
  route: SafeRouteCode;
  finalResult: ExpectedFinalPublicResult;
  timestamp: string;
  durationBucket: ExpectedDurationBucket;
  sizeBucket: ExpectedSizeBucket;
  action?: never;
  outcome?: never;
  supportReference?: never;
}>;
type ExpectedSink = (event: ExpectedSafeEvent) => void;
type SpecificFinalResult = Readonly<{
  ok: true;
  data: Readonly<{ marker: "specific" }>;
}>;
type ExpectedSpecificRecorderInput = Readonly<{
  route: SafeRouteCode;
  finalResult: SpecificFinalResult;
  timestamp: string;
  durationBucket: ExpectedDurationBucket;
  sizeBucket: ExpectedSizeBucket;
  action?: never;
  outcome?: never;
  supportReference?: never;
}>;
type ExpectedRecorderInputFor<FinalResult extends ExpectedFinalPublicResult> = Readonly<{
  route: SafeRouteCode;
  finalResult: FinalResult;
  timestamp: string;
  durationBucket: ExpectedDurationBucket;
  sizeBucket: ExpectedSizeBucket;
  action?: never;
  outcome?: never;
  supportReference?: never;
}>;
type ExpectedRecorderFunction = <const FinalResult extends ExpectedFinalPublicResult>(
  input: ExpectedRecorderInputFor<FinalResult>,
  sink?: ExpectedSink,
) => void;
type ExpectedRuntimeExport =
  | "SAFE_DURATION_BUCKETS"
  | "SAFE_EVENT_COORDINATES"
  | "SAFE_OUTCOME_CODES"
  | "SAFE_REQUEST_ACTION"
  | "SAFE_ROUTE_CODES"
  | "SAFE_SIZE_BUCKETS"
  | "assertSafeEvent"
  | "durationBucket"
  | "recordFinalPublicResult"
  | "sizeBucket";

type POS_01 = Expect<Equal<SafeRouteCode, "demo_get" | "demo_start" | "application" | "actions" | "webmcp" | "submission" | "receipt">>; // POS_01
type POS_02 = Expect<Equal<SafeRequestAction, "request">>; // POS_02
type POS_03 = Expect<Equal<SafeOutcomeCode, "completed" | "temporarily_unavailable">>; // POS_03
type POS_04 = Expect<Equal<SafeEventCoordinate, (typeof SAFE_EVENT_COORDINATES)[number]>>; // POS_04
const POS_05: SafeRouteCode = "demo_get"; // POS_05
const POS_06: SafeRouteCode = "demo_start"; // POS_06
const POS_07: SafeRouteCode = "application"; // POS_07
const POS_08: SafeRouteCode = "actions"; // POS_08
const POS_09: SafeRouteCode = "webmcp"; // POS_09
const POS_10: SafeRouteCode = "submission"; // POS_10
const POS_11: SafeRouteCode = "receipt"; // POS_11
const POS_12: SafeRequestAction = SAFE_REQUEST_ACTION; // POS_12
const POS_13: SafeOutcomeCode = "completed"; // POS_13
const POS_14: SafeOutcomeCode = "temporarily_unavailable"; // POS_14
const POS_15: SafeEvent = { timestamp: "2026-08-28T00:00:00Z", route: "application", action: "request", outcome: "completed", durationBucket: "under_10ms", sizeBucket: "under_1kib" }; // POS_15
const POS_16: SafeEvent = { timestamp: "2026-08-28T00:00:00Z", route: "application", action: "request", outcome: "temporarily_unavailable", supportReference: "CA-01234567", durationBucket: "under_10ms", sizeBucket: "under_1kib" }; // POS_16
const POS_17: RecordFinalPublicResultInput = { route: "application", finalResult: { ok: true, data: {} }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib" }; // POS_17
const POS_18: RecordFinalPublicResultInput = { route: "application", finalResult: { ok: false, error: { code: "temporarily_unavailable", supportReference: "CA-01234567" } }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib" }; // POS_18
type POS_19 = Expect<Equal<SafeEvent, ExpectedSafeEvent>>; // POS_19
type POS_20 = Expect<Equal<RecordFinalPublicResultInput, ExpectedRecorderInput>>; // POS_20
type POS_21 = Expect<Equal<ReturnType<typeof recordFinalPublicResult>, void>>; // POS_21
type POS_22 = Expect<Equal<Parameters<typeof recordFinalPublicResult>[0], RecordFinalPublicResultInput>>; // POS_22
type POS_23 = Expect<Equal<Parameters<typeof recordFinalPublicResult>[1], ExpectedSink | undefined>>; // POS_23
const POS_24: void = recordFinalPublicResult(POS_17); // POS_24
type POS_25 = Expect<Equal<SafeDurationBucket, ExpectedDurationBucket>>; // POS_25
type POS_26 = Expect<Equal<SafeSizeBucket, ExpectedSizeBucket>>; // POS_26
type POS_27 = Expect<Equal<SafeEventSink, ExpectedSink>>; // POS_27
type POS_28 = Expect<Equal<RecordFinalPublicResultInput<SpecificFinalResult>, ExpectedSpecificRecorderInput>>; // POS_28
type POS_29 = Expect<Equal<keyof typeof SafeEventExports, ExpectedRuntimeExport>>; // POS_29
const POS_30: void = recordFinalPublicResult<SpecificFinalResult>({ route: "application", finalResult: { ok: true, data: { marker: "specific" } }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib" }); // POS_30
type POS_31 = Expect<Equal<typeof recordFinalPublicResult, ExpectedRecorderFunction>>; // POS_31
void [POS_05, POS_06, POS_07, POS_08, POS_09, POS_10, POS_11, POS_12, POS_13, POS_14, POS_15, POS_16, POS_17, POS_18, POS_24, POS_30];
`;

test("G4E.10 durable safe-event oracle", { concurrency: 1 }, async (suite) => {
  await suite.test("literal vocabulary, all coordinates, buckets, and forbidden semantic axes", () => {
    positive("runtime and harness sentinel", () => {
      assert.equal(process.version, EXPECTED_NODE);
      assert.equal(ts.version, EXPECTED_TYPESCRIPT);
      const source = readFileSync(resolve("tests/security/safe-events.test.ts"), "utf8");
      for (const forbidden of [
        ".sk" + "ip(",
        ".to" + "do(",
        ".on" + "ly(",
        "@ts-" + "expect-error",
      ]) {
        assert.equal(source.includes(forbidden), false, `forbidden test escape: ${forbidden}`);
      }
      assert.deepEqual(Object.keys(safeEventModule).sort(), EXPECTED_RUNTIME_EXPORTS);
    });
    positive("route vocabulary exact", () => {
      assert.deepEqual(SAFE_ROUTE_CODES, EXPECTED_ROUTES);
      assert.equal(EXPECTED_ROUTES.length, 7);
      assert.equal(new Set(EXPECTED_ROUTES).size, 7);
    });
    positive("action vocabulary exact", () => {
      assert.equal(SAFE_REQUEST_ACTION, "request");
    });
    positive("outcome vocabulary exact", () => {
      assert.deepEqual(SAFE_OUTCOME_CODES, EXPECTED_OUTCOMES);
      assert.equal(EXPECTED_OUTCOMES.length, 2);
      assert.equal(new Set(EXPECTED_OUTCOMES).size, 2);
    });
    positive("coordinate table exact ordered equality", () => {
      assert.deepEqual(SAFE_EVENT_COORDINATES, EXPECTED_COORDINATES);
    });
    positive("coordinate table exact cardinality and uniqueness", () => {
      assert.equal(EXPECTED_COORDINATES.length, 14);
      assert.equal(
        new Set(EXPECTED_COORDINATES.map((coordinate) => coordinate.join("\u0000"))).size,
        14,
      );
      assert.deepEqual(SAFE_DURATION_BUCKETS, EXPECTED_DURATION_BUCKETS);
      assert.deepEqual(SAFE_SIZE_BUCKETS, EXPECTED_SIZE_BUCKETS);
    });

    for (const [route, action, outcome] of EXPECTED_COORDINATES) {
      positive(`direct coordinate ${route}/${outcome}`, () => {
        const source = outcome === "completed"
          ? completedEvent(route)
          : unavailableEvent(route, REFERENCE_A);
        const checked = assertSafeEvent(source);
        assert.equal(checked.action, action);
        assertOrdinaryFrozenEvent(checked, route, outcome, REFERENCE_A);
      });
    }

    const durationCases = [
      [-1, "over_2s"],
      [Number.NaN, "over_2s"],
      [Number.POSITIVE_INFINITY, "over_2s"],
      [0, "under_10ms"],
      [9.999, "under_10ms"],
      [10, "10_to_49ms"],
      [49.999, "10_to_49ms"],
      [50, "50_to_199ms"],
      [199.999, "50_to_199ms"],
      [200, "200_to_999ms"],
      [999.999, "200_to_999ms"],
      [1000, "1_to_2s"],
      [2000, "1_to_2s"],
      [2000.001, "over_2s"],
    ] as const;
    assert.equal(durationCases.length, 14);
    for (const [milliseconds, expected] of durationCases) {
      positive(`duration bucket ${String(milliseconds)}/${expected}`, () => {
        assert.equal(durationBucket(milliseconds), expected);
      });
    }

    const sizeCases = [
      [Number.NaN, "over_64kib"],
      [-1, "over_64kib"],
      [0, "empty"],
      [1, "under_1kib"],
      [1023, "under_1kib"],
      [1024, "1_to_4kib"],
      [4095, "1_to_4kib"],
      [4096, "4_to_16kib"],
      [16383, "4_to_16kib"],
      [16384, "16_to_64kib"],
      [65535, "16_to_64kib"],
      [65536, "16_to_64kib"],
      [65537, "over_64kib"],
      [1.5, "over_64kib"],
      [Number.MAX_SAFE_INTEGER + 1, "over_64kib"],
    ] as const;
    assert.equal(sizeCases.length, 15);
    for (const [bytes, expected] of sizeCases) {
      positive(`size bucket ${String(bytes)}/${expected}`, () => {
        assert.equal(sizeBucket(bytes), expected);
      });
    }

    const completedReferenceCases = [
      ["valid", REFERENCE_A],
      ["malformed", "CA-invalid"],
      ["own undefined", undefined],
    ] as const;
    for (const [name, supportReference] of completedReferenceCases) {
      rejectDirect(`completed rejects ${name} reference`, {
        ...completedEvent(),
        supportReference,
      });
    }
    rejectDirect("unavailable rejects missing reference", {
      ...completedEvent(),
      outcome: "temporarily_unavailable",
    });
    rejectDirect("unavailable rejects own undefined reference", {
      ...completedEvent(),
      outcome: "temporarily_unavailable",
      supportReference: undefined,
    });
    rejectDirect("unavailable rejects malformed reference", {
      ...completedEvent(),
      outcome: "temporarily_unavailable",
      supportReference: "CA-INVALID",
    });
    rejectDirect("unknown route", { ...completedEvent(), route: "unknown_route" });
    rejectDirect("unknown outcome", { ...completedEvent(), outcome: "unknown_outcome" });

    assert.equal(NON_TEMPORARY_PUBLIC_FAILURE_CODES.length, 15);
    for (const code of NON_TEMPORARY_PUBLIC_FAILURE_CODES) {
      rejectDirect(`public result code cannot be outcome ${code}`, {
        ...completedEvent(),
        outcome: code,
      });
    }
    for (const action of ["requests", "REQUEST", "submit", ""] as const) {
      rejectDirect(`wrong request sentinel ${JSON.stringify(action)}`, {
        ...completedEvent(),
        action,
      });
    }

    assert.equal(EXPECTED_ROUTES.length * SENSITIVE_ACTIONS.length, 49);
    for (const route of EXPECTED_ROUTES) {
      for (const action of SENSITIVE_ACTIONS) {
        rejectDirect(`sensitive action ${route}/${action}`, {
          ...completedEvent(route),
          action,
        });
      }
    }
    for (const routeLiteral of EXPECTED_ROUTES) {
      rejectDirect(`route literal in action ${routeLiteral}`, {
        ...completedEvent(),
        action: routeLiteral,
      });
      rejectDirect(`route literal in outcome ${routeLiteral}`, {
        ...completedEvent(),
        outcome: routeLiteral,
      });
    }
    for (const toolName of OTHER_TOOL_NAMES) {
      rejectDirect(`tool name in action ${toolName}`, {
        ...completedEvent(),
        action: toolName,
      });
    }
    for (const humanAction of HUMAN_ACTIONS) {
      rejectDirect(`human action in action ${humanAction}`, {
        ...completedEvent(),
        action: humanAction,
      });
    }
    for (const packet of ["supported", "conflict"] as const) {
      rejectDirect(`packet in action ${packet}`, { ...completedEvent(), action: packet });
    }
    for (const field of FIELD_NAMES) {
      rejectDirect(`field in action ${field}`, { ...completedEvent(), action: field });
    }
    for (const position of ["draft", "review", "submitted"] as const) {
      rejectDirect(`workflow position in outcome ${position}`, {
        ...completedEvent(),
        outcome: position,
      });
    }
    for (const [name, patch] of [
      ["timestamp lacks UTC", { timestamp: "2026-08-28T00:00:00+05:30" }],
      ["timestamp not instant", { timestamp: "not-an-instant" }],
      ["timestamp not string", { timestamp: 1 }],
      ["duration bucket", { durationBucket: "fast" }],
      ["size bucket", { sizeBucket: "small" }],
    ] as const) {
      rejectDirect(`invalid ${name}`, { ...completedEvent(), ...patch });
    }
  });

  await suite.test("result-bound classification, aliases, replacements, and sink behavior", () => {
    const invalid = invalidRequestResult();
    const unavailable = readUnavailableResult(REFERENCE_A);
    for (const route of EXPECTED_ROUTES) {
      positive(`success projects completed ${route}`, () => {
        const event = recordOne(recordingInput(route, successResult()));
        assertOrdinaryFrozenEvent(event, route, "completed");
      });
      positive(`ordinary failure projects completed ${route}`, () => {
        const event = recordOne(recordingInput(route, invalid));
        assertOrdinaryFrozenEvent(event, route, "completed");
      });
      positive(`temporary failure projects temporary ${route}`, () => {
        const event = recordOne(recordingInput(route, unavailable));
        assertOrdinaryFrozenEvent(
          event,
          route,
          "temporarily_unavailable",
          REFERENCE_A,
        );
        assert.notEqual(event.outcome, "completed");
        assert.equal(event.supportReference, REFERENCE_A);
        assert.notEqual(event.supportReference, REFERENCE_B);
      });
    }

    const nonTemporaryRows = [
      {
        code: "session_expired",
        schema: SessionExpiredFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "session_expired",
            message: "This synthetic session has expired.",
            safeActions: ["start_new_synthetic_demo"],
          },
        },
      },
      {
        code: "stale_page",
        schema: StalePageFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "stale_page",
            message: "This page is no longer current.",
            safeActions: ["reload_current_application"],
          },
        },
      },
      {
        code: "consent_required",
        schema: ConsentRequiredFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "consent_required",
            message: "Use the visible CiteApply application to continue.",
            safeActions: ["use_visible_application"],
          },
        },
      },
      {
        code: "stale_state",
        schema: StaleStateFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "stale_state",
            message: "The saved application changed.",
            safeActions: ["reread_state_and_requirements"],
            currentVersions: { applicationRevision: 2, requirementsVersion: 3 },
          },
        },
      },
      {
        code: "request_reuse_mismatch",
        schema: RequestReuseMismatchFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "request_reuse_mismatch",
            message: "That request identity was already used differently.",
            safeActions: ["reread_state_and_requirements"],
          },
        },
      },
      {
        code: "evidence_unavailable",
        schema: EvidenceUnavailableFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "evidence_unavailable",
            message: "That evidence is not currently available for this field.",
            safeActions: ["reread_state_and_requirements"],
          },
        },
      },
      {
        code: "conflict_requires_human",
        schema: ConflictRequiresHumanFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "conflict_requires_human",
            message: "Income sources disagree. Resolve this in CiteApply.",
            safeActions: ["resolve_in_visible_application"],
          },
        },
      },
      {
        code: "not_ready_for_review",
        schema: NotReadyForReviewFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "not_ready_for_review",
            message: "The application is not ready for Review.",
            safeActions: ["use_visible_application"],
            blockers: [{
              code: "unsaved_changes",
              message: "Save or discard visible changes before Review.",
              action: "use_visible_application",
            }],
          },
        },
      },
      {
        code: "review_invalidated",
        schema: ReviewInvalidatedFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "review_invalidated",
            message: "That Review is no longer current.",
            safeActions: ["reread_state_and_requirements"],
          },
        },
      },
      {
        code: "demo_change_limit",
        schema: DemoChangeLimitFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "demo_change_limit",
            message: "That change was not saved. Continue the remaining application steps or start a new synthetic demo.",
            safeActions: ["use_visible_application", "start_new_synthetic_demo"],
          },
        },
      },
      {
        code: "invalid_request",
        schema: InvalidRequestFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "invalid_request",
            message: "The request is not valid.",
            safeActions: ["use_visible_application"],
          },
        },
      },
      {
        code: "rate_limited",
        schema: RateLimitedFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "rate_limited",
            message: "Please wait before trying again.",
            safeActions: ["try_again_after_delay"],
            retryAfterSeconds: 3,
          },
        },
      },
      {
        code: "at_capacity",
        schema: AtCapacityFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "at_capacity",
            message: "At capacity.",
            safeActions: ["try_again_after_delay"],
            retryAfterSeconds: 3,
          },
        },
      },
      {
        code: "document_unavailable",
        schema: DocumentUnavailableFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "document_unavailable",
            message: "A synthetic document could not be accepted.",
            document: "income",
            safeActions: ["return_to_packet_selection"],
          },
        },
      },
      {
        code: "assistance_unavailable",
        schema: BridgeInactiveFailureSchema,
        raw: {
          ok: false,
          error: {
            code: "assistance_unavailable",
            message: "Assisted access is not active on this page.",
            safeActions: ["use_visible_application"],
          },
        },
      },
    ] as const;
    assert.deepEqual(
      nonTemporaryRows.map((row) => row.code),
      NON_TEMPORARY_PUBLIC_FAILURE_CODES,
    );
    for (const [index, row] of nonTemporaryRows.entries()) {
      positive(`parsed non-temporary result projects completed ${row.code}`, () => {
        const parsed = parseWith(row.schema, row.raw);
        const route = EXPECTED_ROUTES[index % EXPECTED_ROUTES.length] as ExpectedRoute;
        const event = recordOne(recordingInput(route, parsed));
        assertOrdinaryFrozenEvent(event, route, "completed");
        assert.equal(Object.hasOwn(event, "supportReference"), false);
      });
    }

    const aliasRows = [
      {
        name: "StartUnavailable",
        route: "demo_start",
        schema: StartUnavailableFailureSchema,
        message: "CiteApply could not start this synthetic application.",
        action: "return_to_packet_selection",
      },
      {
        name: "MutationUnavailable",
        route: "actions",
        schema: MutationUnavailableSchema,
        message: "CiteApply could not confirm this action. Checking the latest application.",
        action: "reconcile_current_state",
      },
      {
        name: "ReadUnavailable",
        route: "application",
        schema: ReadUnavailableSchema,
        message: "CiteApply is temporarily unavailable.",
        action: "use_visible_application",
      },
      {
        name: "ConnectionUnavailable",
        route: "webmcp",
        schema: ConnectionUnavailableSchema,
        message: "CiteApply could not establish the latest state.",
        action: "reload_current_application",
      },
      {
        name: "DemoTokenUnavailable",
        route: "demo_get",
        schema: DemoTokenUnavailableSchema,
        message: "CiteApply could not prepare a synthetic start.",
        action: "return_to_packet_selection",
      },
      {
        name: "ReceiptUnavailable",
        route: "receipt",
        schema: ReceiptUnavailableSchema,
        message: "Your submission remains accepted, but the receipt could not be loaded.",
        action: "load_receipt_again",
      },
      {
        name: "ExportUnavailable",
        route: "receipt",
        schema: ExportUnavailableSchema,
        message: "Your submission remains accepted, but the receipt export could not be prepared.",
        action: "retry_export",
      },
    ] as const;
    assert.equal(aliasRows.length, 7);
    for (const [index, row] of aliasRows.entries()) {
      positive(`parsed alias ${row.name}`, () => {
        const expectedReference = reference(index + 1);
        const parsed = parseWith(
          row.schema,
          unavailableRaw(row.message, row.action, expectedReference),
        );
        const event = recordOne(recordingInput(row.route, parsed));
        assertOrdinaryFrozenEvent(
          event,
          row.route,
          "temporarily_unavailable",
          expectedReference,
        );
      });
    }

    const replacementRows = [
      {
        route: "demo_get",
        schema: DemoGetFailureSchema,
        message: "CiteApply could not prepare a synthetic start.",
        action: "return_to_packet_selection",
      },
      {
        route: "demo_start",
        schema: DemoStartFailureSchema,
        message: "CiteApply could not start this synthetic application.",
        action: "return_to_packet_selection",
      },
      {
        route: "application",
        schema: SnapshotFailureSchema,
        message: "CiteApply is temporarily unavailable.",
        action: "use_visible_application",
      },
      {
        route: "actions",
        schema: ActionBaseFailureSchema,
        message: "CiteApply could not confirm this action. Checking the latest application.",
        action: "reconcile_current_state",
      },
      {
        route: "webmcp",
        schema: GetApplicationStateRedactedServerResultSchema,
        message: "CiteApply is temporarily unavailable.",
        action: "use_visible_application",
      },
      {
        route: "submission",
        schema: SubmissionFailureSchema,
        message: "CiteApply could not confirm this action. Checking the latest application.",
        action: "reconcile_current_state",
      },
      {
        route: "receipt",
        schema: ReceiptExportFailureSchema,
        message: "Your submission remains accepted, but the receipt export could not be prepared.",
        action: "retry_export",
      },
    ] as const;
    assert.equal(replacementRows.length, 7);
    for (const [routeIndex, row] of replacementRows.entries()) {
      for (const [replacementIndex, replacement] of [
        "oversize",
        "unclassified",
      ].entries()) {
        positive(`${row.route} ${replacement} replacement`, () => {
          const expectedReference = reference(0x100 + routeIndex * 2 + replacementIndex);
          const parsed = parseWith(
            row.schema,
            unavailableRaw(row.message, row.action, expectedReference),
          );
          const event = recordOne(recordingInput(row.route, parsed));
          assertOrdinaryFrozenEvent(
            event,
            row.route,
            "temporarily_unavailable",
            expectedReference,
          );
        });
      }
    }

    positive("sink may be omitted", () => {
      assert.doesNotThrow(() => recordUnknown(recordingInput()));
    });
    positive("throwing sink called once without retry", () => {
      const sentinel = new Error("sink sentinel");
      let calls = 0;
      let caught: unknown;
      try {
        recordUnknown(recordingInput(), () => {
          calls += 1;
          throw sentinel;
        });
      } catch (error) {
        caught = error;
      }
      assert.equal(calls, 1);
      assert.equal(caught, sentinel);
    });
    positive("opaque sensitive success data cannot enter event", () => {
      const canaries = {
        tool: "apply_evidence_backed_answers",
        humanAction: "confirm_and_submit_this_review",
        packet: "conflict",
        field: "annual_household_income",
        claimHandle: "AAAAAAAAAAAAAAAAAAAAAA",
        contentHash: "f".repeat(64),
        reviewId: "00000000-0000-4000-8000-000000000000",
        syntheticValue: "Synthetic Applicant Value",
      };
      const event = recordOne(recordingInput("application", successResult(canaries)));
      assertOrdinaryFrozenEvent(event, "application", "completed");
      const serialized = JSON.stringify(event);
      for (const value of Object.values(canaries)) {
        assert.equal(serialized.includes(value), false);
      }
    });

    const callerFields = ["action", "outcome", "supportReference"] as const;
    for (let mask = 1; mask < 1 << callerFields.length; mask += 1) {
      const patch: Record<string, unknown> = {};
      const names: string[] = [];
      callerFields.forEach((field, index) => {
        if ((mask & (1 << index)) !== 0) {
          names.push(field);
          patch[field] = field === "action"
            ? "request"
            : field === "outcome"
              ? "completed"
              : REFERENCE_B;
        }
      });
      rejectRecording(`caller classification fields ${names.join("+")}`, {
        ...recordingInput(),
        ...patch,
      });
    }

    for (const [name, error] of [
      ["missing reference", { code: "temporarily_unavailable" }],
      ["own undefined reference", { code: "temporarily_unavailable", supportReference: undefined }],
      ["malformed reference", { code: "temporarily_unavailable", supportReference: "CA-invalid" }],
    ] as const) {
      rejectRecording(`temporary result ${name}`, recordingInput("application", {
        ok: false,
        error,
      }));
    }

    const shapeCases = [
      ["neither branch", {}],
      ["success missing data", { ok: true }],
      ["success both branches", { ok: true, data: {}, error: invalid.error }],
      ["failure missing error", { ok: false }],
      ["failure both branches", { ok: false, error: invalid.error, data: {} }],
      ["string boolean", { ok: "true", data: {} }],
      ["null boolean", { ok: null, data: {} }],
      ["success wrong branch", { ok: true, error: invalid.error }],
      ["failure wrong branch", { ok: false, data: {} }],
    ] as const;
    assert.equal(shapeCases.length, 9);
    for (const [name, finalResult] of shapeCases) {
      rejectRecording(`final result shape ${name}`, recordingInput("application", finalResult));
    }

    const validEnvelope = recordingInput("application", successResult());
    for (const key of [
      "route",
      "finalResult",
      "timestamp",
      "durationBucket",
      "sizeBucket",
    ] as const) {
      const missing = { ...validEnvelope };
      delete missing[key];
      rejectRecording(`recording envelope missing ${key}`, missing);
    }
    rejectRecording("recording envelope extra field", {
      ...validEnvelope,
      packet: "supported",
    });
    rejectRecording("recording envelope unknown route", {
      ...validEnvelope,
      route: "unknown_route",
    });
    rejectRecording("recording envelope invalid timestamp", {
      ...validEnvelope,
      timestamp: "not-an-instant",
    });
    rejectRecording("recording envelope invalid duration", {
      ...validEnvelope,
      durationBucket: "fast",
    });
    rejectRecording("recording envelope invalid size", {
      ...validEnvelope,
      sizeBucket: "small",
    });
  });

  await suite.test("descriptor snapshots, prototypes, proxies, opacity, and reread resistance", () => {
    const descriptorCases = [
      ["direct", completedEvent(), 1, "event"],
      ["success", recordingInput("application", successResult()), 3, "recording"],
      ["ordinary failure", recordingInput("application", invalidRequestResult()), 4, "recording"],
      ["temporary failure", recordingInput("application", readUnavailableResult()), 4, "recording"],
    ] as const;
    for (const [name, input, expectedCalls, mode] of descriptorCases) {
      positive(`single descriptor read ${name}`, () => {
        const instrumentation = instrumentOwnDescriptorReads();
        let event: SafeEvent | undefined;
        let thrown: unknown;
        try {
          event = mode === "event"
            ? assertSafeEvent(input)
            : recordOne(input);
        } catch (error) {
          thrown = error;
        } finally {
          instrumentation.restore();
        }
        assert.equal(thrown, undefined);
        assert.notEqual(event, undefined);
        assert.equal(instrumentation.total(), expectedCalls);
        assert.equal(instrumentation.countFor(input), 1);
        assert.equal(Object.getOwnPropertyDescriptors, instrumentation.original);
      });
    }

    const directMutations = [
      ["timestamp", (source: Record<string, unknown>) => { source["timestamp"] = LATER; }],
      ["route", (source: Record<string, unknown>) => { source["route"] = "receipt"; }],
      ["action", (source: Record<string, unknown>) => { source["action"] = "submit"; }],
      ["outcome", (source: Record<string, unknown>) => { source["outcome"] = "completed"; }],
      ["durationBucket", (source: Record<string, unknown>) => { source["durationBucket"] = "over_2s"; }],
      ["sizeBucket", (source: Record<string, unknown>) => { source["sizeBucket"] = "over_64kib"; }],
      ["supportReference", (source: Record<string, unknown>) => { source["supportReference"] = REFERENCE_B; }],
    ] as const;
    assert.equal(directMutations.length, 7);
    for (const [key, mutate] of directMutations) {
      positive(`direct event captured ${key} resists source reread`, () => {
        const source = unavailableEvent("application", REFERENCE_A);
        const instrumentation = instrumentOwnDescriptorReads((target) => {
          if (target === source) mutate(source);
        });
        let event: SafeEvent | undefined;
        let thrown: unknown;
        try {
          event = assertSafeEvent(source);
        } catch (error) {
          thrown = error;
        } finally {
          instrumentation.restore();
        }
        assert.equal(thrown, undefined);
        assert.notEqual(event, undefined);
        assertOrdinaryFrozenEvent(
          event as SafeEvent,
          "application",
          "temporarily_unavailable",
          REFERENCE_A,
        );
        assert.equal(instrumentation.total(), 1);
        assert.equal(instrumentation.countFor(source), 1);
      });
    }

    const envelopeMutations = [
      ["route", (value: Record<string, unknown>) => { value["route"] = "receipt"; }],
      ["finalResult", (value: Record<string, unknown>) => { value["finalResult"] = successResult(); }],
      ["timestamp", (value: Record<string, unknown>) => { value["timestamp"] = LATER; }],
      ["durationBucket", (value: Record<string, unknown>) => { value["durationBucket"] = "over_2s"; }],
      ["sizeBucket", (value: Record<string, unknown>) => { value["sizeBucket"] = "over_64kib"; }],
    ] as const;
    assert.equal(envelopeMutations.length, 5);
    for (const [key, mutate] of envelopeMutations) {
      positive(`recorder envelope captured ${key} resists source reread`, () => {
        const error = { code: "temporarily_unavailable", supportReference: REFERENCE_A };
        const finalResult = { ok: false, error };
        const envelope = recordingInput("application", finalResult);
        const instrumentation = instrumentOwnDescriptorReads((target) => {
          if (target === envelope) mutate(envelope);
        });
        let event: SafeEvent | undefined;
        let thrown: unknown;
        try {
          event = recordOne(envelope);
        } catch (caught) {
          thrown = caught;
        } finally {
          instrumentation.restore();
        }
        assert.equal(thrown, undefined);
        assert.notEqual(event, undefined);
        assertOrdinaryFrozenEvent(
          event as SafeEvent,
          "application",
          "temporarily_unavailable",
          REFERENCE_A,
        );
        assert.equal(instrumentation.total(), 4);
        assert.equal(instrumentation.countFor(envelope), 1);
      });
    }

    const successResultMutations = [
      ["ok", (value: Record<string, unknown>) => { value["ok"] = false; }],
      ["data", (value: Record<string, unknown>) => { value["data"] = { leaked: "replacement" }; }],
    ] as const;
    for (const [key, mutate] of successResultMutations) {
      positive(`successful result captured ${key} resists source reread`, () => {
        const finalResult = successResult({ original: true });
        const envelope = recordingInput("application", finalResult);
        const instrumentation = instrumentOwnDescriptorReads((target) => {
          if (target === finalResult) mutate(finalResult);
        });
        let event: SafeEvent | undefined;
        let thrown: unknown;
        try {
          event = recordOne(envelope);
        } catch (caught) {
          thrown = caught;
        } finally {
          instrumentation.restore();
        }
        assert.equal(thrown, undefined);
        assert.notEqual(event, undefined);
        assertOrdinaryFrozenEvent(event as SafeEvent, "application", "completed");
        assert.equal(instrumentation.total(), 3);
        assert.equal(instrumentation.countFor(finalResult), 1);
      });
    }

    const failureResultMutations = [
      ["ok", (value: Record<string, unknown>) => { value["ok"] = true; }],
      ["error", (value: Record<string, unknown>) => {
        value["error"] = { code: "invalid_request", supportReference: REFERENCE_B };
      }],
    ] as const;
    for (const [key, mutate] of failureResultMutations) {
      positive(`failed result captured ${key} resists source reread`, () => {
        const error = { code: "temporarily_unavailable", supportReference: REFERENCE_A };
        const finalResult: Record<string, unknown> = { ok: false, error };
        const envelope = recordingInput("application", finalResult);
        const instrumentation = instrumentOwnDescriptorReads((target) => {
          if (target === finalResult) mutate(finalResult);
        });
        let event: SafeEvent | undefined;
        let thrown: unknown;
        try {
          event = recordOne(envelope);
        } catch (caught) {
          thrown = caught;
        } finally {
          instrumentation.restore();
        }
        assert.equal(thrown, undefined);
        assert.notEqual(event, undefined);
        assertOrdinaryFrozenEvent(
          event as SafeEvent,
          "application",
          "temporarily_unavailable",
          REFERENCE_A,
        );
        assert.equal(instrumentation.total(), 4);
        assert.equal(instrumentation.countFor(finalResult), 1);
      });
    }

    const errorMutations = [
      ["code", (value: Record<string, unknown>) => { value["code"] = "invalid_request"; }],
      ["supportReference", (value: Record<string, unknown>) => { value["supportReference"] = REFERENCE_B; }],
    ] as const;
    for (const [key, mutate] of errorMutations) {
      positive(`public error captured ${key} resists source reread`, () => {
        const error: Record<string, unknown> = {
          code: "temporarily_unavailable",
          supportReference: REFERENCE_A,
        };
        const finalResult = { ok: false, error };
        const envelope = recordingInput("application", finalResult);
        const instrumentation = instrumentOwnDescriptorReads((target) => {
          if (target === error) mutate(error);
        });
        let event: SafeEvent | undefined;
        let thrown: unknown;
        try {
          event = recordOne(envelope);
        } catch (caught) {
          thrown = caught;
        } finally {
          instrumentation.restore();
        }
        assert.equal(thrown, undefined);
        assert.notEqual(event, undefined);
        assertOrdinaryFrozenEvent(
          event as SafeEvent,
          "application",
          "temporarily_unavailable",
          REFERENCE_A,
        );
        assert.equal(instrumentation.total(), 4);
        assert.equal(instrumentation.countFor(error), 1);
      });
    }

    positive("frozen direct source remains accepted and projected", () => {
      const source = Object.freeze(unavailableEvent());
      const event = assertSafeEvent(source);
      assertOrdinaryFrozenEvent(
        event,
        "application",
        "temporarily_unavailable",
        REFERENCE_A,
      );
    });
    positive("sealed envelope and frozen result/error remain accepted", () => {
      const error = Object.freeze({
        code: "temporarily_unavailable",
        supportReference: REFERENCE_A,
      });
      const result = Object.freeze({ ok: false, error });
      const envelope = Object.seal(recordingInput("application", result));
      const event = recordOne(envelope);
      assertOrdinaryFrozenEvent(
        event,
        "application",
        "temporarily_unavailable",
        REFERENCE_A,
      );
    });
    positive("opaque success data is not traversed", () => {
      const traps = { get: 0, ownKeys: 0, getPrototypeOf: 0, descriptor: 0 };
      const data = new Proxy({ secret: "must-not-be-read" }, {
        get(target, key, receiver) {
          traps.get += 1;
          return Reflect.get(target, key, receiver);
        },
        ownKeys(target) {
          traps.ownKeys += 1;
          return Reflect.ownKeys(target);
        },
        getPrototypeOf(target) {
          traps.getPrototypeOf += 1;
          return Reflect.getPrototypeOf(target);
        },
        getOwnPropertyDescriptor(target, key) {
          traps.descriptor += 1;
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      });
      const event = recordOne(recordingInput("application", successResult(data)));
      assertOrdinaryFrozenEvent(event, "application", "completed");
      assert.deepEqual(traps, { get: 0, ownKeys: 0, getPrototypeOf: 0, descriptor: 0 });
    });
    positive("opaque public-error children and all eight allowed keys are not traversed", () => {
      const trapCounts = new Map<string, number>();
      const opaque = (label: string): object => new Proxy({ secret: label }, {
        get() {
          trapCounts.set(label, (trapCounts.get(label) ?? 0) + 1);
          throw new Error(`opaque get ${label}`);
        },
        ownKeys() {
          trapCounts.set(label, (trapCounts.get(label) ?? 0) + 1);
          throw new Error(`opaque ownKeys ${label}`);
        },
        getPrototypeOf() {
          trapCounts.set(label, (trapCounts.get(label) ?? 0) + 1);
          throw new Error(`opaque getPrototypeOf ${label}`);
        },
        getOwnPropertyDescriptor() {
          trapCounts.set(label, (trapCounts.get(label) ?? 0) + 1);
          throw new Error(`opaque descriptor ${label}`);
        },
      });
      const error = {
        code: "invalid_request",
        message: opaque("message"),
        safeActions: opaque("safeActions"),
        currentVersions: opaque("currentVersions"),
        blockers: opaque("blockers"),
        retryAfterSeconds: opaque("retryAfterSeconds"),
        document: opaque("document"),
        supportReference: REFERENCE_A,
      };
      assert.deepEqual(Object.keys(error).sort(), [
        "blockers",
        "code",
        "currentVersions",
        "document",
        "message",
        "retryAfterSeconds",
        "safeActions",
        "supportReference",
      ]);
      const event = recordOne(recordingInput("application", { ok: false, error }));
      assertOrdinaryFrozenEvent(event, "application", "completed");
      assert.equal(trapCounts.size, 0);
      const serialized = JSON.stringify(event);
      for (const label of [
        "message",
        "safeActions",
        "currentVersions",
        "blockers",
        "retryAfterSeconds",
        "document",
      ]) {
        assert.equal(serialized.includes(label), false);
      }
    });

    const accessorModes = ["getter", "setter", "getter-setter"] as const;
    const boundaries: readonly Boundary[] = [
      "event",
      "envelope",
      "success",
      "failure",
      "error",
    ];
    let accessorCases = 0;
    for (const boundary of boundaries) {
      const base = baseBoundary(boundary);
      for (const key of Object.keys(base)) {
        for (const mode of accessorModes) {
          accessorCases += 1;
          let getterCalls = 0;
          let setterCalls = 0;
          const subject = { ...base };
          const descriptor: PropertyDescriptor = {
            configurable: true,
            enumerable: true,
          };
          if (mode !== "setter") {
            descriptor.get = () => {
              getterCalls += 1;
              return base[key];
            };
          }
          if (mode !== "getter") {
            descriptor.set = () => {
              setterCalls += 1;
            };
          }
          Object.defineProperty(subject, key, descriptor);
          rejectBoundary(`accessor ${boundary}/${key}/${mode}`, boundary, subject);
          assert.equal(getterCalls, 0);
          assert.equal(setterCalls, 0);
        }
      }
    }
    assert.equal(accessorCases, 72);

    class CustomPrototype {}
    let structuralCases = 0;
    for (const boundary of boundaries) {
      const base = baseBoundary(boundary);
      const enumerableExtra = { ...base, unexpected: "extra" };
      structuralCases += 1;
      rejectBoundary(`enumerable extra ${boundary}`, boundary, enumerableExtra);

      const nonEnumerableExtra = { ...base };
      Object.defineProperty(nonEnumerableExtra, "unexpected", {
        value: "extra",
        enumerable: false,
      });
      structuralCases += 1;
      rejectBoundary(`non-enumerable extra ${boundary}`, boundary, nonEnumerableExtra);

      for (const enumerable of [true, false] as const) {
        const symbolExtra = { ...base };
        Object.defineProperty(symbolExtra, Symbol(`extra-${boundary}-${enumerable}`), {
          value: "extra",
          enumerable,
        });
        structuralCases += 1;
        rejectBoundary(
          `${enumerable ? "enumerable" : "non-enumerable"} symbol extra ${boundary}`,
          boundary,
          symbolExtra,
        );
      }

      for (const requiredKey of Object.keys(base)) {
        const hiddenRequired = { ...base };
        Object.defineProperty(hiddenRequired, requiredKey, {
          value: base[requiredKey],
          configurable: true,
          enumerable: false,
          writable: true,
        });
        structuralCases += 1;
        rejectBoundary(
          `hidden required ${boundary}/${requiredKey}`,
          boundary,
          hiddenRequired,
        );
      }

      structuralCases += 1;
      rejectBoundary(
        `null prototype ${boundary}`,
        boundary,
        cloneWithPrototype(base, null),
      );
      structuralCases += 1;
      rejectBoundary(
        `custom object prototype ${boundary}`,
        boundary,
        cloneWithPrototype(base, { marker: boundary }),
      );
      structuralCases += 1;
      rejectBoundary(
        `class prototype ${boundary}`,
        boundary,
        cloneWithPrototype(base, CustomPrototype.prototype),
      );
      structuralCases += 1;
      rejectBoundary(
        `array prototype ${boundary}`,
        boundary,
        cloneWithPrototype(base, Array.prototype),
      );

      const traps = {
        get: 0,
        has: 0,
        ownKeys: 0,
        getPrototypeOf: 0,
        descriptor: 0,
      };
      const transparent = new Proxy(base, {
        get(target, key, receiver) {
          traps.get += 1;
          return Reflect.get(target, key, receiver);
        },
        has(target, key) {
          traps.has += 1;
          return Reflect.has(target, key);
        },
        ownKeys(target) {
          traps.ownKeys += 1;
          return Reflect.ownKeys(target);
        },
        getPrototypeOf(target) {
          traps.getPrototypeOf += 1;
          return Reflect.getPrototypeOf(target);
        },
        getOwnPropertyDescriptor(target, key) {
          traps.descriptor += 1;
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      });
      structuralCases += 1;
      rejectBoundary(`transparent proxy ${boundary}`, boundary, transparent);
      assert.deepEqual(traps, {
        get: 0,
        has: 0,
        ownKeys: 0,
        getPrototypeOf: 0,
        descriptor: 0,
      });

      const revokedTraps = {
        get: 0,
        has: 0,
        ownKeys: 0,
        getPrototypeOf: 0,
        descriptor: 0,
      };
      const revocable = Proxy.revocable(base, {
        get() {
          revokedTraps.get += 1;
          throw new Error("revoked proxy get trap");
        },
        has() {
          revokedTraps.has += 1;
          throw new Error("revoked proxy has trap");
        },
        ownKeys() {
          revokedTraps.ownKeys += 1;
          throw new Error("revoked proxy ownKeys trap");
        },
        getPrototypeOf() {
          revokedTraps.getPrototypeOf += 1;
          throw new Error("revoked proxy prototype trap");
        },
        getOwnPropertyDescriptor() {
          revokedTraps.descriptor += 1;
          throw new Error("revoked proxy descriptor trap");
        },
      });
      revocable.revoke();
      structuralCases += 1;
      rejectBoundary(`revoked proxy ${boundary}`, boundary, revocable.proxy);
      assert.deepEqual(revokedTraps, {
        get: 0,
        has: 0,
        ownKeys: 0,
        getPrototypeOf: 0,
        descriptor: 0,
      });
    }
    assert.equal(structuralCases, 74);

    rejectBoundary("unknown public error key", "error", {
      ...fullAllowedError(),
      claimHandle: "AAAAAAAAAAAAAAAAAAAAAA",
    });
  });

  await suite.test("compile-time closed unions and private recorder boundary", () => {
    const sentinel = compileVirtual(
      `${COMPILE_BASE}\nconst SENTINEL: string = 1; // SENTINEL`,
      "sentinel",
    );
    assert.equal(sentinel.length, 1, diagnosticText(sentinel));
    assert.equal(sentinel[0]?.code, 2322, diagnosticText(sentinel));

    const positives = compileVirtual(COMPILE_BASE, "positive");
    assert.deepEqual(positives, [], diagnosticText(positives));
    const positiveMarkers = [...COMPILE_BASE.matchAll(/\bPOS_(\d{2})\b/g)].map(
      (match) => match[1],
    );
    assert.equal(new Set(positiveMarkers).size, 31);

    const negativeLines = [
      `const NEG_01: SafeRouteCode = "unknown_route"; // NEG_01`,
      `const NEG_02: SafeRequestAction = "requests"; // NEG_02`,
      `const NEG_03: SafeOutcomeCode = "invalid_request"; // NEG_03`,
      `const NEG_04: SafeRequestAction = "application"; // NEG_04`,
      `const NEG_05: SafeOutcomeCode = "receipt"; // NEG_05`,
      `const NEG_06: SafeEvent = { timestamp: "2026-08-28T00:00:00Z", route: "application", action: "request", outcome: "temporarily_unavailable", durationBucket: "under_10ms", sizeBucket: "under_1kib" }; // NEG_06`,
      `const NEG_07: SafeEvent = { timestamp: "2026-08-28T00:00:00Z", route: "application", action: "request", outcome: "temporarily_unavailable", supportReference: undefined, durationBucket: "under_10ms", sizeBucket: "under_1kib" }; // NEG_07`,
      `const NEG_08: SafeEvent = { timestamp: "2026-08-28T00:00:00Z", route: "application", action: "request", outcome: "completed", supportReference: "CA-01234567", durationBucket: "under_10ms", sizeBucket: "under_1kib" }; // NEG_08`,
      `const NEG_09: SafeEvent = { timestamp: "2026-08-28T00:00:00Z", route: "application", action: "request", outcome: "completed", supportReference: undefined, durationBucket: "under_10ms", sizeBucket: "under_1kib" }; // NEG_09`,
      `const NEG_10: RecordFinalPublicResultInput = { route: "unknown_route", finalResult: { ok: true, data: {} }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib" }; // NEG_10`,
      `const NEG_11: RecordFinalPublicResultInput = { route: "application", finalResult: { ok: true, data: {} }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib", action: "request" }; // NEG_11`,
      `const NEG_12: RecordFinalPublicResultInput = { route: "application", finalResult: { ok: true, data: {} }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib", outcome: "completed" }; // NEG_12`,
      `const NEG_13: RecordFinalPublicResultInput = { route: "application", finalResult: { ok: true, data: {} }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib", supportReference: "CA-01234567" }; // NEG_13`,
      `import { recordSafeEvent as NEG_14 } from "../../src/server/observability/safe-events.ts"; // NEG_14`,
      `recordFinalPublicResult({ route: "unknown_route", finalResult: { ok: true, data: {} }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib" }); // NEG_15`,
      `recordFinalPublicResult({ route: "application", finalResult: { ok: true, data: {} }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib", action: "request" }); // NEG_16`,
      `recordFinalPublicResult({ route: "application", finalResult: { ok: true, data: {} }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib", outcome: "completed" }); // NEG_17`,
      `recordFinalPublicResult({ route: "application", finalResult: { ok: true, data: {} }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib", supportReference: "CA-01234567" }); // NEG_18`,
      `const NEG_19: SafeEvent = { timestamp: "2026-08-28T00:00:00Z", route: "application", action: "request", outcome: "completed", durationBucket: "under_10ms", sizeBucket: "under_1kib", packet: "supported" }; // NEG_19`,
      `const NEG_20: SafeEvent = { timestamp: "2026-08-28T00:00:00Z", route: "application", action: "request", outcome: "completed", durationBucket: "under_10ms", sizeBucket: "under_1kib", tool: "get_application_state" }; // NEG_20`,
      `const NEG_21: SafeEvent = { timestamp: "2026-08-28T00:00:00Z", route: "application", action: "request", outcome: "completed", durationBucket: "under_10ms", sizeBucket: "under_1kib", field: "annual_household_income" }; // NEG_21`,
      `const NEG_22: SafeEvent = { timestamp: "2026-08-28T00:00:00Z", route: "application", action: "request", outcome: "completed", durationBucket: "under_10ms", sizeBucket: "under_1kib", humanAction: "confirm_and_submit_this_review" }; // NEG_22`,
      `const NEG_23: SafeEvent = { timestamp: "2026-08-28T00:00:00Z", route: "application", action: "request", outcome: "completed", durationBucket: "under_10ms", sizeBucket: "under_1kib", workflowPosition: "review" }; // NEG_23`,
      `const NEG_24: SafeDurationBucket = "fast"; // NEG_24`,
      `const NEG_25: SafeSizeBucket = "small"; // NEG_25`,
      `const NEG_26: RecordFinalPublicResultInput<SpecificFinalResult> = { route: "application", finalResult: { ok: true, data: { marker: "other" } }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib" }; // NEG_26`,
      `recordFinalPublicResult<SpecificFinalResult>({ route: "application", finalResult: { ok: true, data: { marker: "other" } }, timestamp: "2026-08-28T00:00:00Z", durationBucket: "under_10ms", sizeBucket: "under_1kib" }); // NEG_27`,
      `type NEG_28 = RecordFinalPublicResultInput<{ bogus: true }>; // NEG_28`,
    ] as const;
    assert.equal(negativeLines.length, 28);
    for (const [index, line] of negativeLines.entries()) {
      const marker = `NEG_${String(index + 1).padStart(2, "0")}`;
      const diagnostics = compileVirtual(`${COMPILE_BASE}\n${line}`, marker.toLowerCase());
      assert.equal(diagnostics.length, 1, `${marker}:\n${diagnosticText(diagnostics)}`);
      const diagnostic = diagnostics[0] as ts.Diagnostic;
      assert.notEqual(diagnostic.file, undefined, `${marker}: missing diagnostic file`);
      assert.notEqual(diagnostic.start, undefined, `${marker}: missing diagnostic start`);
      const position = diagnostic.file?.getLineAndCharacterOfPosition(
        diagnostic.start as number,
      );
      const sourceLine = diagnostic.file?.text.split("\n")[position?.line ?? -1];
      assert.equal(sourceLine?.includes(marker), true, `${marker}:\n${diagnosticText(diagnostics)}`);
      if (marker === "NEG_14") assert.equal(diagnostic.code, 2459);
      else if (marker === "NEG_07" || marker === "NEG_09") {
        assert.equal(
          diagnostic.code,
          2375,
          `${marker}: exactOptionalPropertyTypes:\n${diagnosticText(diagnostics)}`,
        );
      } else if (["NEG_19", "NEG_20", "NEG_21", "NEG_22", "NEG_23"].includes(marker)) {
        assert.equal(diagnostic.code, 2353, `${marker}:\n${diagnosticText(diagnostics)}`);
      } else if (marker === "NEG_28") {
        assert.equal(diagnostic.code, 2344, `${marker}:\n${diagnosticText(diagnostics)}`);
      } else {
        assert.equal(diagnostic.code, 2322, `${marker}:\n${diagnosticText(diagnostics)}`);
      }
    }
  });

  await suite.test("fixed non-vacuous runtime ledger closure", () => {
    assert.equal(runtimePositiveCount, 135);
    assert.equal(runtimeNegativeCount, 299);
    assert.equal(labels.size, 434);
  });
});
