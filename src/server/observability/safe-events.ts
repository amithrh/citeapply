import { isProxy } from "node:util/types";

import {
  Rfc3339InstantSchema,
  SupportReferenceSchema,
} from "../../contracts/common.ts";

export const SAFE_ROUTE_CODES = [
  "demo_get",
  "demo_start",
  "application",
  "actions",
  "webmcp",
  "submission",
  "receipt",
] as const;

export const SAFE_DURATION_BUCKETS = [
  "under_10ms",
  "10_to_49ms",
  "50_to_199ms",
  "200_to_999ms",
  "1_to_2s",
  "over_2s",
] as const;

export const SAFE_SIZE_BUCKETS = [
  "empty",
  "under_1kib",
  "1_to_4kib",
  "4_to_16kib",
  "16_to_64kib",
  "over_64kib",
] as const;

export type SafeRouteCode = (typeof SAFE_ROUTE_CODES)[number];
export type SafeDurationBucket = (typeof SAFE_DURATION_BUCKETS)[number];
export type SafeSizeBucket = (typeof SAFE_SIZE_BUCKETS)[number];

export const SAFE_REQUEST_ACTION = "request" as const;

export const SAFE_OUTCOME_CODES = [
  "completed",
  "temporarily_unavailable",
] as const;

export type SafeRequestAction = typeof SAFE_REQUEST_ACTION;
export type SafeOutcomeCode = (typeof SAFE_OUTCOME_CODES)[number];

type SafeEventCoordinateShape = readonly [
  SafeRouteCode,
  SafeRequestAction,
  SafeOutcomeCode,
];

export const SAFE_EVENT_COORDINATES = [
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
] as const satisfies readonly SafeEventCoordinateShape[];

export type SafeEventCoordinate = (typeof SAFE_EVENT_COORDINATES)[number];

type SafeEventBase = {
  timestamp: string;
  route: SafeRouteCode;
  action: SafeRequestAction;
  durationBucket: SafeDurationBucket;
  sizeBucket: SafeSizeBucket;
};

export type SafeEvent =
  | Readonly<
      SafeEventBase & {
        outcome: "completed";
        supportReference?: never;
      }
    >
  | Readonly<
      SafeEventBase & {
        outcome: "temporarily_unavailable";
        supportReference: string;
      }
    >;

export type SafeEventSink = (event: SafeEvent) => void;

type RouteValidatedFinalPublicResult =
  | Readonly<{ ok: true; data: unknown }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: string;
        supportReference?: unknown;
      }>;
    }>;

export type RecordFinalPublicResultInput<
  FinalResult extends RouteValidatedFinalPublicResult = RouteValidatedFinalPublicResult,
> = Readonly<{
  route: SafeRouteCode;
  finalResult: FinalResult;
  timestamp: string;
  durationBucket: SafeDurationBucket;
  sizeBucket: SafeSizeBucket;
  action?: never;
  outcome?: never;
  supportReference?: never;
}>;

const SAFE_EVENT_KEYS = new Set([
  "timestamp",
  "supportReference",
  "route",
  "action",
  "outcome",
  "durationBucket",
  "sizeBucket",
]);

const COMPLETED_SAFE_EVENT_KEYS = new Set([
  "timestamp",
  "route",
  "action",
  "outcome",
  "durationBucket",
  "sizeBucket",
]);

const UNAVAILABLE_SAFE_EVENT_KEYS = new Set([
  ...COMPLETED_SAFE_EVENT_KEYS,
  "supportReference",
]);

const RECORD_FINAL_PUBLIC_RESULT_KEYS = new Set([
  "route",
  "finalResult",
  "timestamp",
  "durationBucket",
  "sizeBucket",
]);

const FINAL_PUBLIC_RESULT_KEYS = new Set(["ok", "data", "error"]);
const FINAL_PUBLIC_SUCCESS_KEYS = new Set(["ok", "data"]);
const FINAL_PUBLIC_FAILURE_KEYS = new Set(["ok", "error"]);

const PUBLIC_ERROR_KEYS = new Set([
  "code",
  "message",
  "safeActions",
  "currentVersions",
  "blockers",
  "retryAfterSeconds",
  "document",
  "supportReference",
]);

type OwnDataSnapshot = Readonly<{
  keys: readonly string[];
  values: Readonly<Record<string, unknown>>;
}>;

function ordinaryDataObjectError(label: string): TypeError {
  return new TypeError(`${label} must be an ordinary own-data object.`);
}

function snapshotPlainOwnData(
  value: unknown,
  label: string,
  allowedKeys: ReadonlySet<string>,
): OwnDataSnapshot {
  if (typeof value !== "object" || value === null || isProxy(value)) {
    throw ordinaryDataObjectError(label);
  }

  let descriptors: PropertyDescriptorMap;
  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      throw ordinaryDataObjectError(label);
    }
    descriptors = Object.getOwnPropertyDescriptors(value);
  } catch {
    throw ordinaryDataObjectError(label);
  }

  const keys: string[] = [];
  const values = Object.create(null) as Record<string, unknown>;
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key !== "string") {
      throw ordinaryDataObjectError(label);
    }
    const descriptor = descriptors[key];
    if (
      descriptor === undefined ||
      !Object.hasOwn(descriptor, "value") ||
      descriptor.enumerable !== true ||
      !allowedKeys.has(key)
    ) {
      throw ordinaryDataObjectError(label);
    }
    keys.push(key);
    values[key] = descriptor.value;
  }

  return Object.freeze({
    keys: Object.freeze(keys),
    values: Object.freeze(values),
  });
}

function assertExactSnapshotKeys(
  snapshot: OwnDataSnapshot,
  expectedKeys: ReadonlySet<string>,
  label: string,
): void {
  if (
    snapshot.keys.length !== expectedKeys.size ||
    snapshot.keys.some((key) => !expectedKeys.has(key))
  ) {
    throw ordinaryDataObjectError(label);
  }
}

function assertSnapshotHasKey(
  snapshot: OwnDataSnapshot,
  key: string,
  label: string,
): void {
  if (!Object.hasOwn(snapshot.values, key)) {
    throw ordinaryDataObjectError(label);
  }
}

export function durationBucket(milliseconds: number): SafeDurationBucket {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "over_2s";
  if (milliseconds < 10) return "under_10ms";
  if (milliseconds < 50) return "10_to_49ms";
  if (milliseconds < 200) return "50_to_199ms";
  if (milliseconds < 1000) return "200_to_999ms";
  if (milliseconds <= 2000) return "1_to_2s";
  return "over_2s";
}

export function sizeBucket(bytes: number): SafeSizeBucket {
  if (!Number.isSafeInteger(bytes) || bytes < 0) return "over_64kib";
  if (bytes === 0) return "empty";
  if (bytes < 1024) return "under_1kib";
  if (bytes < 4096) return "1_to_4kib";
  if (bytes < 16 * 1024) return "4_to_16kib";
  if (bytes <= 64 * 1024) return "16_to_64kib";
  return "over_64kib";
}

export function assertSafeEvent(event: unknown): SafeEvent {
  const candidate = snapshotPlainOwnData(event, "Safe event", SAFE_EVENT_KEYS);
  const timestamp = candidate.values["timestamp"];
  const route = candidate.values["route"];
  const action = candidate.values["action"];
  const outcome = candidate.values["outcome"];
  const candidateDurationBucket = candidate.values["durationBucket"];
  const candidateSizeBucket = candidate.values["sizeBucket"];

  if (outcome === "completed") {
    assertExactSnapshotKeys(
      candidate,
      COMPLETED_SAFE_EVENT_KEYS,
      "Completed safe event",
    );
  } else if (outcome === "temporarily_unavailable") {
    assertExactSnapshotKeys(
      candidate,
      UNAVAILABLE_SAFE_EVENT_KEYS,
      "Temporarily unavailable safe event",
    );
  }

  if (
    typeof timestamp !== "string" ||
    !timestamp.endsWith("Z") ||
    !Rfc3339InstantSchema.safeParse(timestamp).success
  ) {
    throw new TypeError("Safe event timestamp must be an RFC 3339 UTC instant.");
  }
  if (
    !SAFE_EVENT_COORDINATES.some(
      ([allowedRoute, allowedAction, allowedOutcome]) =>
        route === allowedRoute &&
        action === allowedAction &&
        outcome === allowedOutcome,
    )
  ) {
    throw new TypeError("Safe event coordinate is not allowlisted.");
  }
  if (
    !(SAFE_DURATION_BUCKETS as readonly unknown[]).includes(
      candidateDurationBucket,
    )
  ) {
    throw new TypeError("Safe event duration bucket is invalid.");
  }
  if (
    !(SAFE_SIZE_BUCKETS as readonly unknown[]).includes(candidateSizeBucket)
  ) {
    throw new TypeError("Safe event size bucket is invalid.");
  }

  const common = {
    timestamp,
    route: route as SafeRouteCode,
    action: SAFE_REQUEST_ACTION,
    durationBucket: candidateDurationBucket as SafeDurationBucket,
    sizeBucket: candidateSizeBucket as SafeSizeBucket,
  } as const;

  if (outcome === "completed") {
    return Object.freeze({
      ...common,
      outcome: "completed",
    });
  }

  const supportReference = SupportReferenceSchema.safeParse(
    candidate.values["supportReference"],
  );
  if (!supportReference.success) {
    throw new TypeError("Safe event support reference is invalid.");
  }

  return Object.freeze({
    ...common,
    outcome: "temporarily_unavailable",
    supportReference: supportReference.data,
  });
}

function recordSafeEvent(event: SafeEvent, sink?: SafeEventSink): void {
  const checked = assertSafeEvent(event);
  // Telemetry is off by default. Tests and an explicitly configured local sink
  // may consume only this closed projection.
  sink?.(checked);
}

export function recordFinalPublicResult<
  const FinalResult extends RouteValidatedFinalPublicResult,
>(
  input: RecordFinalPublicResultInput<FinalResult>,
  sink?: SafeEventSink,
): void {
  const envelope = snapshotPlainOwnData(
    input,
    "Final public result recording input",
    RECORD_FINAL_PUBLIC_RESULT_KEYS,
  );
  assertExactSnapshotKeys(
    envelope,
    RECORD_FINAL_PUBLIC_RESULT_KEYS,
    "Final public result recording input",
  );

  const route = envelope.values["route"] as SafeRouteCode;
  const timestamp = envelope.values["timestamp"] as string;
  const durationBucket = envelope.values[
    "durationBucket"
  ] as SafeDurationBucket;
  const sizeBucket = envelope.values["sizeBucket"] as SafeSizeBucket;
  const finalResult = snapshotPlainOwnData(
    envelope.values["finalResult"],
    "Final public result",
    FINAL_PUBLIC_RESULT_KEYS,
  );

  if (finalResult.values["ok"] === true) {
    assertExactSnapshotKeys(
      finalResult,
      FINAL_PUBLIC_SUCCESS_KEYS,
      "Successful final public result",
    );
  } else if (finalResult.values["ok"] === false) {
    assertExactSnapshotKeys(
      finalResult,
      FINAL_PUBLIC_FAILURE_KEYS,
      "Failed final public result",
    );
    const error = snapshotPlainOwnData(
      finalResult.values["error"],
      "Final public error",
      PUBLIC_ERROR_KEYS,
    );
    assertSnapshotHasKey(error, "code", "Final public error");
    const code = error.values["code"];
    if (typeof code !== "string") {
      throw ordinaryDataObjectError("Final public error");
    }

    if (code !== "temporarily_unavailable") {
      recordSafeEvent(
        {
          timestamp,
          route,
          action: SAFE_REQUEST_ACTION,
          outcome: "completed",
          durationBucket,
          sizeBucket,
        },
        sink,
      );
      return;
    }

    assertSnapshotHasKey(
      error,
      "supportReference",
      "Temporarily unavailable final public error",
    );
    const supportReference = SupportReferenceSchema.safeParse(
      error.values["supportReference"],
    );
    if (!supportReference.success) {
      throw new TypeError(
        "A temporarily unavailable public result requires a valid support reference.",
      );
    }
    recordSafeEvent(
      {
        timestamp,
        route,
        action: SAFE_REQUEST_ACTION,
        outcome: "temporarily_unavailable",
        supportReference: supportReference.data,
        durationBucket,
        sizeBucket,
      },
      sink,
    );
    return;
  } else {
    throw ordinaryDataObjectError("Final public result");
  }

  recordSafeEvent(
    {
      timestamp,
      route,
      action: SAFE_REQUEST_ACTION,
      outcome: "completed",
      durationBucket,
      sizeBucket,
    },
    sink,
  );
}
