import assert from "node:assert/strict";
import test from "node:test";

import { createCiteApplyBridge } from "../../src/webmcp/bridge.ts";
import type { CiteApplyToolDispatch } from "../../src/webmcp/descriptors.ts";

type RegisteredTool = { name: string };

/** The smallest object shaped like `document.modelContext` that can register. */
function createStubModelContext() {
  const tools = new Map<string, RegisteredTool>();
  return {
    registerTool(tool: RegisteredTool) {
      tools.set(tool.name, tool);
      return { name: tool.name };
    },
    getTools() {
      return [...tools.values()];
    },
    tools,
  };
}

const dispatch = (async () => ({
  ok: false,
  error: {
    code: "consent_required",
    message: "Use the visible CiteApply application to continue.",
    safeActions: ["use_visible_application"],
  },
})) as unknown as CiteApplyToolDispatch;

test("a disposed bridge is evicted so a remount registers its tools again", async () => {
  const stub = createStubModelContext();

  const first = createCiteApplyBridge(dispatch, stub as never);
  assert.equal((await first.registerOnce()).registered, true);
  assert.equal(stub.tools.size, 6);
  first.dispose();
  assert.equal(first.snapshot().status, "disposed");

  // A remount asks for a bridge on the same ModelContext with the same
  // dispatcher. Before the eviction this returned the dead bridge, whose
  // registerOnce() can never register again.
  const second = createCiteApplyBridge(dispatch, stub as never);
  assert.notEqual(second, first);
  assert.equal(second.snapshot().status, "idle");
  assert.equal((await second.registerOnce()).registered, true);
  assert.equal(stub.tools.size, 6);
});

test("a disposed unavailable bridge is evicted from the dispatch cache", () => {
  const unavailableDispatch = (async () => ({
    ok: false,
    error: {
      code: "consent_required",
      message: "Use the visible CiteApply application to continue.",
      safeActions: ["use_visible_application"],
    },
  })) as unknown as CiteApplyToolDispatch;

  const first = createCiteApplyBridge(unavailableDispatch, undefined);
  assert.equal(first.snapshot().status, "unavailable");
  assert.equal(createCiteApplyBridge(unavailableDispatch, undefined), first);

  first.dispose();
  const second = createCiteApplyBridge(unavailableDispatch, undefined);
  assert.notEqual(second, first);
  assert.equal(second.snapshot().status, "unavailable");
  assert.equal(first.snapshot().status, "disposed");
});
