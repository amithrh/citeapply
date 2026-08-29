import type { Pool } from "pg";

import {
  runRatePreflight,
  type RateBucket,
  type RatePreflightResult,
} from "../db/rate-buckets.ts";

export type TransportThrottleResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      code: "at_capacity" | "rate_limited";
      retryAfterSeconds: number;
    }>;

function refusalCode(route: RateBucket): "at_capacity" | "rate_limited" {
  return route === "demo_start" ? "at_capacity" : "rate_limited";
}

function projectTransportResult(
  route: RateBucket,
  result: RatePreflightResult,
): TransportThrottleResult {
  if (result.admitted) {
    return { ok: true };
  }

  return {
    ok: false,
    code: refusalCode(route),
    retryAfterSeconds: result.retryAfterSeconds,
  };
}

export async function runPublicTransportThrottle(
  pool: Pool,
  route: RateBucket,
): Promise<TransportThrottleResult> {
  return projectTransportResult(route, await runRatePreflight(pool, route));
}

export function retryAfterHeader(result: TransportThrottleResult): string | null {
  return result.ok ? null : String(result.retryAfterSeconds);
}
