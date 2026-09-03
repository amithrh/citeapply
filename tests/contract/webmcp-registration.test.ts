import assert from "node:assert/strict";
import test from "node:test";

import { InvalidRequestFailureSchema } from "../../src/contracts/outcomes.ts";
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
    options?: { signal: AbortSignal },
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

test("a malformed tool argument is a structured refusal, not a thrown error", async () => {
  // D-P2-5. The closed input schema must keep a malformed argument away from
  // the server — that part always worked. What it must ALSO do is tell the
  // agent why, in the same shape as every other refusal in the system. It used
  // to throw the raw ZodError at the host, which Chrome surfaced as
  // "UnknownError: Tool was executed but the invocation failed": no code, no
  // safeActions, nothing to act on. This was the one failure in CiteApply that
  // was not a structured refusal.
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

  // Every kind of malformation an agent can produce against a closed schema:
  // an unknown enum value, an unknown key, a missing required key, a wrong
  // type, and a non-object payload.
  const malformed: readonly [string, unknown][] = [
    ["get_application_state", { mode: "everything" }],
    ["get_application_state", { detail: "full" }],
    ["get_application_state", {}],
    ["get_application_state", { mode: 7 }],
    ["get_application_state", { mode: "redacted", extra: true }],
    ["get_evidence_index", { unexpected: 1 }],
    ["apply_evidence_backed_answers", { bindings: [] }],
    ["prepare_submission_review", { contentHash: "nope" }],
  ];

  for (const [name, input] of malformed) {
    const tool = stub.tools.get(name);
    assert.ok(tool !== undefined, name);
    const result = (await tool.execute(
      input as Record<string, unknown>,
      { signal: new AbortController().signal },
    )) as unknown;

    // The refusal is exactly the shape the contracts define for
    // invalid_request, and it round-trips through that schema.
    assert.deepEqual(
      result,
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: "The request is not valid.",
          safeActions: ["use_visible_application"],
        },
      },
      `${name} ${JSON.stringify(input)}`,
    );
    assert.equal(InvalidRequestFailureSchema.safeParse(result).success, true);
    // It survives the JSON round trip a host performs to hand the result
    // back to the agent, so nothing about it is lossy.
    assert.deepEqual(JSON.parse(JSON.stringify(result)) as unknown, result);
  }

  // And none of them reached the server.
  assert.equal(recorder.calls.length, 0);
});

test("a well-formed tool argument still reaches dispatch", async () => {
  // The guard above must refuse only what the schema refuses.
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
  await tool.execute(
    { mode: "redacted" },
    { signal: new AbortController().signal },
  );
  assert.equal(recorder.calls.length, 1);
});

test("a client that passes no options object can still invoke a tool", async () => {
  // Chrome 151 invokes the callback with the parsed arguments only. A bridge
  // that assumes `options.signal` exists registers fine and then fails every
  // call, so the no-options path is exercised explicitly.
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
  const result = (await tool.execute({ mode: "redacted" })) as {
    ok: boolean;
    data?: { access: string };
  };

  assert.equal(result.ok, true);
  assert.equal(result.data?.access, "consent_required");
  assert.equal(recorder.calls.length, 1);
});
