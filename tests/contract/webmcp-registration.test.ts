import assert from "node:assert/strict";
import test from "node:test";

import { TOOL_NAMES } from "../../src/contracts/webmcp.ts";
import { createCiteApplyBridge } from "../../src/webmcp/bridge.ts";
import type { CiteApplyToolDispatch } from "../../src/webmcp/descriptors.ts";

type RegisteredTool = {
  name: string;
  description: string;
  inputSchema: { additionalProperties?: unknown };
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (
    input: Record<string, unknown>,
    options: { signal: AbortSignal },
  ) => Promise<unknown>;
};

/**
 * A minimal stand-in for the browser's `document.modelContext`, shaped like the
 * WebMCP imperative API: tools are registered with a shared abort signal and
 * listed back through getTools().
 */
function createStubModelContext() {
  const tools = new Map<string, RegisteredTool>();
  const signals: AbortSignal[] = [];
  return {
    context: {
      registerTool(tool: RegisteredTool, options?: { signal?: AbortSignal }) {
        if (options?.signal !== undefined) {
          if (options.signal.aborted) throw new Error("already aborted");
          signals.push(options.signal);
        }
        tools.set(tool.name, tool);
        return { name: tool.name };
      },
      getTools() {
        return [...tools.values()];
      },
    },
    tools,
    signals,
  };
}

function stubDispatch(recorder: { calls: unknown[] }): CiteApplyToolDispatch {
  return (async (name: string, input: unknown) => {
    recorder.calls.push({ name, input });
    if (name === "get_application_state") {
      return {
        ok: true,
        data: {
          access: "consent_required",
          safeActions: ["use_visible_application"],
        },
      };
    }
    return {
      ok: false,
      error: {
        code: "consent_required",
        message: "Use the visible CiteApply application to continue.",
        safeActions: ["use_visible_application"],
      },
    };
  }) as unknown as CiteApplyToolDispatch;
}

test("all six tools register against a ModelContext with one shared signal", async () => {
  const stub = createStubModelContext();
  const bridge = createCiteApplyBridge(
    stubDispatch({ calls: [] }),
    stub.context as never,
  );

  const snapshot = await bridge.registerOnce();
  assert.equal(snapshot.registered, true);
  assert.equal(stub.tools.size, 6);
  assert.deepEqual([...stub.tools.keys()].sort(), [...TOOL_NAMES].sort());

  // The spec requires one registration lifetime for the document, so every
  // call must carry the identical signal object.
  assert.equal(stub.signals.length, 6);
  assert.equal(new Set(stub.signals).size, 1);
});

test("registered descriptors expose closed schemas and honest annotations", async () => {
  const stub = createStubModelContext();
  const bridge = createCiteApplyBridge(
    stubDispatch({ calls: [] }),
    stub.context as never,
  );
  await bridge.registerOnce();

  for (const tool of stub.tools.values()) {
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.ok(tool.description.length > 0 && tool.description.length < 500);
    assert.equal(typeof tool.annotations.readOnlyHint, "boolean");
  }
  assert.equal(
    stub.tools.get("get_evidence_index")?.annotations.untrustedContentHint,
    true,
  );
  assert.equal(
    stub.tools.get("apply_evidence_backed_answers")?.annotations.readOnlyHint,
    false,
  );
});

test("an inactive bridge refuses to dispatch at all", async () => {
  const recorder = { calls: [] as unknown[] };
  const stub = createStubModelContext();
  const bridge = createCiteApplyBridge(
    stubDispatch(recorder),
    stub.context as never,
  );
  await bridge.registerOnce();

  const tool = stub.tools.get("get_application_state");
  assert.ok(tool !== undefined);
  const result = (await tool.execute(
    { mode: "redacted" },
    { signal: new AbortController().signal },
  )) as { ok: boolean; error?: { code: string } };

  assert.equal(result.ok, false);
  assert.equal(result.error?.code, "assistance_unavailable");
  assert.equal(recorder.calls.length, 0);
});

test("an activated bridge dispatches and returns the contract result", async () => {
  const recorder = { calls: [] as unknown[] };
  const stub = createStubModelContext();
  const bridge = createCiteApplyBridge(
    stubDispatch(recorder),
    stub.context as never,
  );
  await bridge.registerOnce();
  const token = bridge.beginActivation();
  assert.ok(token !== null);
  bridge.activate(token);

  const tool = stub.tools.get("get_application_state");
  assert.ok(tool !== undefined);
  const result = (await tool.execute(
    { mode: "redacted" },
    { signal: new AbortController().signal },
  )) as { ok: boolean; data?: { access: string } };

  assert.equal(result.ok, true);
  assert.equal(result.data?.access, "consent_required");
  assert.equal(recorder.calls.length, 1);
});

test("a deactivated bridge stops dispatching without unregistering", async () => {
  const recorder = { calls: [] as unknown[] };
  const stub = createStubModelContext();
  const bridge = createCiteApplyBridge(
    stubDispatch(recorder),
    stub.context as never,
  );
  await bridge.registerOnce();
  const token = bridge.beginActivation();
  assert.ok(token !== null);
  bridge.activate(token);
  bridge.deactivate();

  const tool = stub.tools.get("get_application_state");
  assert.ok(tool !== undefined);
  const result = (await tool.execute(
    { mode: "redacted" },
    { signal: new AbortController().signal },
  )) as { ok: boolean; error?: { code: string } };

  assert.equal(result.ok, false);
  assert.equal(result.error?.code, "assistance_unavailable");
  assert.equal(recorder.calls.length, 0);
  assert.equal(stub.tools.size, 6);
});

test("a malformed tool argument never reaches dispatch", async () => {
  const recorder = { calls: [] as unknown[] };
  const stub = createStubModelContext();
  const bridge = createCiteApplyBridge(
    stubDispatch(recorder),
    stub.context as never,
  );
  await bridge.registerOnce();
  const token = bridge.beginActivation();
  assert.ok(token !== null);
  bridge.activate(token);

  const tool = stub.tools.get("get_application_state");
  assert.ok(tool !== undefined);
  await assert.rejects(
    tool.execute(
      { mode: "everything" },
      { signal: new AbortController().signal },
    ),
  );
  assert.equal(recorder.calls.length, 0);
});
