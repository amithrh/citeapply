"use client";

import { TOOL_NAMES } from "../../contracts/webmcp.ts";
import type { DemoInvoke } from "./client.ts";

/**
 * How the scripted client reaches the six tools this page registered.
 *
 * There are two ways in, and the client cannot tell them apart because it is
 * never given either one — it is given a lookup over a fixed list of tool
 * objects and nothing else.
 *
 * **Through the browser.** In a Chrome build with WebMCP enabled, the tools
 * come back from `document.modelContext.getTools()` and are invoked with
 * `executeTool`, which is exactly the path an external agent takes. Nothing
 * here is privileged: the page hands the client the same objects any client of
 * this document would receive.
 *
 * **Through the page's own descriptors.** In a browser with no
 * `document.modelContext` there is no host to route through, so the page calls
 * the `execute` function the descriptor layer built — the same function the
 * bridge would have registered, over the same dispatcher, sending the same
 * request to the same endpoint with the same headers, and reaching the same
 * server validation. The only thing missing is Chrome's own plumbing.
 */
export type RegisteredTool = Readonly<{
  name: string;
  execute?: (
    input: Record<string, unknown>,
    options?: unknown,
  ) => Promise<unknown>;
}>;

type HostModelContext = Readonly<{
  getTools: () =>
    Promise<readonly RegisteredTool[]> | readonly RegisteredTool[];
  executeTool: (tool: unknown, argumentsJson: string) => Promise<unknown>;
}>;

function hostModelContext(): HostModelContext | null {
  if (typeof document === "undefined") return null;
  const candidate = (document as unknown as { modelContext?: unknown })
    .modelContext;
  if (typeof candidate !== "object" || candidate === null) return null;
  const host = candidate as Partial<HostModelContext>;
  return typeof host.getTools === "function" &&
    typeof host.executeTool === "function"
    ? (candidate as HostModelContext)
    : null;
}

const REGISTERED = new Set<string>(TOOL_NAMES);

/**
 * The tools the host is willing to hand back, narrowed to the ones this page
 * registered. Returns null when this browser has no WebMCP host at all.
 */
export async function hostRegisteredTools(): Promise<
  readonly RegisteredTool[] | null
> {
  const host = hostModelContext();
  if (host === null) return null;
  try {
    const tools = await host.getTools();
    return Object.freeze(tools.filter((tool) => REGISTERED.has(tool.name)));
  } catch {
    return null;
  }
}

/**
 * Builds the client's one channel. The returned function closes over `tools`
 * and looks a name up in it; a name that is not in that list has nowhere to
 * resolve and the call throws before anything is sent. The client therefore
 * cannot reach any surface of this application other than these tools.
 */
export function invokeOver(
  tools: readonly RegisteredTool[],
  through: "host" | "page",
): DemoInvoke {
  const frozen = Object.freeze([...tools]);
  return async (name, input) => {
    const tool = frozen.find((candidate) => candidate.name === name);
    if (tool === undefined) {
      throw new Error(`This client holds no tool named ${name}.`);
    }

    if (through === "host") {
      const host = hostModelContext();
      if (host === null) throw new Error("The WebMCP host went away.");
      const raw = await host.executeTool(tool, JSON.stringify(input));
      return typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
    }

    if (typeof tool.execute !== "function") {
      throw new Error(`The tool ${name} has no callback on this page.`);
    }
    return tool.execute(input);
  };
}

/**
 * The landing page leaves this behind when somebody asks to watch an assistant
 * work. It carries no authority: all it can do is open the same disclosure the
 * rail opens, and a person still has to press Allow assisted access.
 */
export const WATCH_REQUEST_KEY = "citeapply.watch-assistant";

/** Honours the reader's own motion setting: no pauses, no animated rows. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
