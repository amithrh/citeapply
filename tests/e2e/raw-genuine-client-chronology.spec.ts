import { isAbsolute } from "node:path";

import { expect, test } from "@playwright/test";

import {
  genuineClientFingerprint,
  readGenuineClientTrace,
} from "./support/genuine-client-trace.ts";

function readConfiguredTracePaths() {
  const encoded = process.env["CITEAPPLY_GENUINE_TRACE_FILES_JSON"];
  if (encoded === undefined) {
    return null;
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(encoded);
  } catch {
    throw new Error("CITEAPPLY_GENUINE_TRACE_FILES_JSON must be a JSON array.");
  }

  if (
    !Array.isArray(decoded) ||
    decoded.length !== 3 ||
    decoded.some((path) => typeof path !== "string" || !isAbsolute(path)) ||
    new Set(decoded).size !== 3
  ) {
    throw new Error(
      "CITEAPPLY_GENUINE_TRACE_FILES_JSON must name three distinct absolute trace files.",
    );
  }

  return decoded as [string, string, string];
}

test("@genuine-client validates three unedited primary-client chronologies", async () => {
  const tracePaths = readConfiguredTracePaths();
  if (tracePaths === null) {
    test.skip(
      true,
      "G5B-L remains unproven until three actual ChatGPT desktop trace files are supplied.",
    );
    return;
  }

  const traces = await Promise.all(tracePaths.map(readGenuineClientTrace));

  expect(new Set(traces.map((trace) => trace.run.runId)).size).toBe(3);
  expect(
    new Set(traces.map((trace) => trace.run.applicationCorrelationSha256)).size,
  ).toBe(3);
  expect(
    new Set(traces.map((trace) => trace.run.sessionCorrelationSha256)).size,
  ).toBe(3);
  expect(new Set(traces.map((trace) => trace.rawCaptureSha256)).size).toBe(3);
  expect(new Set(traces.map(genuineClientFingerprint)).size).toBe(1);

  for (const trace of traces) {
    expect(trace.provenance).toBe("unedited_external_primary_client");
    expect(trace.run.elapsedMs).toBeGreaterThan(0);
    expect(trace.run.elapsedMs).toBeLessThanOrEqual(120_000);
  }
});
