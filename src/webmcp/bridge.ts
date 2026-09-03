"use client";

import {
  BridgeInactiveFailureSchema,
  type BridgeInactiveFailure,
} from "../contracts/outcomes.ts";
import { TOOL_NAMES, type ToolName } from "../contracts/webmcp.ts";
import {
  materializeModelContextTools,
  type BridgeInvocation,
  type CallbackLifecycle,
  type CiteApplyToolDispatch,
} from "./descriptors.ts";

export type BridgeStatus =
  "idle" | "registering" | "registered" | "unavailable" | "disposed";

export type BridgeSnapshot = Readonly<{
  generation: number;
  registered: boolean;
  active: boolean;
  status: BridgeStatus;
}>;

const activationTokenBrand: unique symbol = Symbol(
  "citeapply.bridge.activation-token",
);

export type BridgeActivationToken = Readonly<{
  generation: number;
  readonly [activationTokenBrand]: true;
}>;

export type CiteApplyBridge = Readonly<{
  registerOnce(): Promise<BridgeSnapshot>;
  beginActivation(): BridgeActivationToken | null;
  activate(token: BridgeActivationToken): BridgeSnapshot;
  deactivate(): BridgeSnapshot;
  dispose(): void;
  snapshot(): BridgeSnapshot;
}>;

type BridgeCacheEntry = Readonly<{
  dispatch: CiteApplyToolDispatch;
  bridge: CiteApplyBridge;
}>;

const bridgeByModelContext = new WeakMap<
  WebMCP.ModelContext,
  BridgeCacheEntry
>();
const unavailableBridgeByDispatch = new WeakMap<
  CiteApplyToolDispatch,
  CiteApplyBridge
>();

function inactiveResult(): BridgeInactiveFailure {
  return BridgeInactiveFailureSchema.parse({
    ok: false,
    error: {
      code: "assistance_unavailable",
      message: "Assisted access is not active on this page.",
      safeActions: ["use_visible_application"],
    },
  });
}

function defaultModelContext(): WebMCP.ModelContext | undefined {
  return typeof document === "undefined" ? undefined : document.modelContext;
}

export function createCiteApplyBridge(
  dispatch: CiteApplyToolDispatch,
  modelContext: WebMCP.ModelContext | undefined = defaultModelContext(),
): CiteApplyBridge {
  if (modelContext !== undefined) {
    const cached = bridgeByModelContext.get(modelContext);
    if (cached !== undefined) {
      if (cached.dispatch !== dispatch) {
        throw new TypeError(
          "This document ModelContext is already bound to another CiteApply dispatcher.",
        );
      }
      return cached.bridge;
    }
  } else {
    const cached = unavailableBridgeByDispatch.get(dispatch);
    if (cached !== undefined) return cached;
  }

  const registrationLifetime = new AbortController();
  let generation = 0;
  let registered = false;
  let active = false;
  let activeGeneration: number | undefined;
  let currentActivationToken: BridgeActivationToken | undefined;
  let status: BridgeStatus =
    modelContext === undefined ? "unavailable" : "idle";
  let registration: Promise<BridgeSnapshot> | undefined;

  const snapshot = (): BridgeSnapshot =>
    Object.freeze({ generation, registered, active, status });
  const hasBeenDisposed = (): boolean => status === "disposed";

  const lifecycle: CallbackLifecycle = Object.freeze({
    captureInvocation(): BridgeInvocation | null {
      return registered &&
        active &&
        status === "registered" &&
        activeGeneration === generation
        ? Object.freeze({ generation })
        : null;
    },
    isInvocationCurrent(invocation: BridgeInvocation): boolean {
      return (
        registered &&
        active &&
        status === "registered" &&
        activeGeneration === generation &&
        invocation.generation === generation
      );
    },
    inactiveResult,
  });

  const tools = materializeModelContextTools(dispatch, lifecycle);

  const registerOnce = (): Promise<BridgeSnapshot> => {
    if (registration !== undefined) return registration;
    if (status === "disposed" || status === "unavailable") {
      registration = Promise.resolve(snapshot());
      return registration;
    }

    status = "registering";
    active = false;
    activeGeneration = undefined;

    registration = (async () => {
      if (modelContext === undefined || registrationLifetime.signal.aborted) {
        if (!hasBeenDisposed()) status = "unavailable";
        currentActivationToken = undefined;
        return snapshot();
      }

      const settlements = tools.map((tool) => {
        try {
          return Promise.resolve(
            modelContext.registerTool(tool, {
              signal: registrationLifetime.signal,
            }),
          );
        } catch (error) {
          return Promise.reject(error);
        }
      });
      const watchedSettlements = settlements.map((settlement) =>
        settlement.catch((error: unknown) => {
          // Every registration call was attempted before promise reactions run.
          // The first observed rejection closes the shared registration lifetime.
          registrationLifetime.abort();
          throw error;
        }),
      );
      const results = await Promise.allSettled(watchedSettlements);

      if (results.some((result) => result.status === "rejected")) {
        registrationLifetime.abort();
        await Promise.allSettled(watchedSettlements);
        try {
          const remaining = await Promise.resolve(modelContext.getTools());
          const citeApplyNames = new Set<string>(TOOL_NAMES);
          // Reading the remaining set is a rollback proof only. Any registration
          // rejection permanently leaves this document bridge unavailable.
          remaining.some((tool) => citeApplyNames.has(tool.name));
        } catch {
          // Failure to inspect rollback also remains unavailable.
        }
        if (!hasBeenDisposed()) {
          status = "unavailable";
          registered = false;
          active = false;
          activeGeneration = undefined;
          currentActivationToken = undefined;
        }
        return snapshot();
      }

      if (hasBeenDisposed() || registrationLifetime.signal.aborted) {
        registered = false;
        return snapshot();
      }

      registered = true;
      status = "registered";
      return snapshot();
    })();
    return registration;
  };

  const bridge: CiteApplyBridge = Object.freeze({
    registerOnce,
    beginActivation() {
      if (status === "unavailable" || status === "disposed") return null;
      generation += 1;
      active = false;
      activeGeneration = undefined;
      const token: BridgeActivationToken = Object.freeze({
        generation,
        [activationTokenBrand]: true as const,
      });
      currentActivationToken = token;
      return token;
    },
    activate(token: BridgeActivationToken) {
      if (
        registered &&
        status === "registered" &&
        currentActivationToken === token &&
        token.generation === generation
      ) {
        currentActivationToken = undefined;
        active = true;
        activeGeneration = generation;
      }
      return snapshot();
    },
    deactivate() {
      generation += 1;
      active = false;
      activeGeneration = undefined;
      currentActivationToken = undefined;
      return snapshot();
    },
    dispose() {
      if (status === "disposed") return;
      generation += 1;
      active = false;
      activeGeneration = undefined;
      currentActivationToken = undefined;
      registered = false;
      status = "disposed";
      registrationLifetime.abort();
      // A disposed bridge must not be handed back to a later mount. React
      // StrictMode remounts the page component, and without this eviction the
      // second mount received this dead bridge and registered no tools.
      if (modelContext === undefined) {
        if (unavailableBridgeByDispatch.get(dispatch) === bridge) {
          unavailableBridgeByDispatch.delete(dispatch);
        }
      } else if (bridgeByModelContext.get(modelContext)?.bridge === bridge) {
        bridgeByModelContext.delete(modelContext);
      }
    },
    snapshot,
  });

  if (modelContext === undefined) {
    unavailableBridgeByDispatch.set(dispatch, bridge);
  } else {
    bridgeByModelContext.set(modelContext, Object.freeze({ dispatch, bridge }));
  }
  return bridge;
}

export function isCiteApplyToolName(name: string): name is ToolName {
  return (TOOL_NAMES as readonly string[]).includes(name);
}
