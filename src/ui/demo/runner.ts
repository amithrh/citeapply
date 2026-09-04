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

/** How long one host call may take before the page stops waiting on it. */
export const HOST_CALL_TIMEOUT_MS = 6000;
/** How long the host has to describe its tools before the page gives up. */
export const HOST_DISCOVERY_TIMEOUT_MS = 3000;

/**
 * A host that never answers is indistinguishable from a host that answers
 * slowly, right up until the demonstration has hung in front of a watcher.
 * Every await on a foreign object is therefore bounded: the page waits, says
 * plainly what it waited for, and goes on through its own descriptors.
 */
function withTimeout<T>(
  work: Promise<T>,
  milliseconds: number,
  what: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${what} did not answer within ${milliseconds}ms`));
    }, milliseconds);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/** What this browser's WebMCP host turned out to be, if it has one at all. */
export type HostDiscovery = Readonly<{
  /** Something answering to `document.modelContext` exists. */
  present: boolean;
  /** The six tools, or null when the host could not usefully describe them. */
  tools: readonly RegisteredTool[] | null;
  /** Why the host was set aside, in one phrase, when it was. */
  reason: string | null;
}>;

/**
 * Asks the browser's host for the tools this page registered.
 *
 * A host is only used when it answers in time and hands back all six of this
 * page's tools. Anything else — no host, a `getTools` that never settles, one
 * that throws, or one that returns a set this page does not recognise — is
 * reported as present-but-unusable, and the page says so on screen rather than
 * waiting on it.
 */
export async function discoverHostTools(): Promise<HostDiscovery> {
  const host = hostModelContext();
  if (host === null) return { present: false, tools: null, reason: null };
  let tools: readonly RegisteredTool[];
  try {
    tools = await withTimeout(
      Promise.resolve(host.getTools()),
      HOST_DISCOVERY_TIMEOUT_MS,
      "the browser's WebMCP host",
    );
  } catch (error) {
    return {
      present: true,
      tools: null,
      reason: error instanceof Error ? error.message : "getTools failed",
    };
  }
  const named = Array.isArray(tools)
    ? tools.filter(
        (tool) =>
          typeof tool === "object" &&
          tool !== null &&
          REGISTERED.has((tool as RegisteredTool).name),
      )
    : [];
  if (named.length !== REGISTERED.size) {
    return {
      present: true,
      tools: null,
      reason: `the host listed ${named.length} of this page's ${REGISTERED.size} tools`,
    };
  }
  return { present: true, tools: Object.freeze([...named]), reason: null };
}

/**
 * The tools the host is willing to hand back, narrowed to the ones this page
 * registered. Returns null when this browser has no usable WebMCP host.
 */
export async function hostRegisteredTools(): Promise<
  readonly RegisteredTool[] | null
> {
  return (await discoverHostTools()).tools;
}

function isTypeError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error && /type|argument|string/iu.test(error.message))
  );
}

type Envelope = Readonly<{ ok: boolean }>;

/**
 * The only shape this client can read. A host that hands back something else —
 * a bare string, a wrapper of its own, nothing at all — is not speaking this
 * page's protocol, and pretending otherwise would put an invented outcome in
 * front of a watcher.
 */
function asEnvelope(raw: unknown): Envelope {
  const parsed: unknown =
    typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { ok?: unknown }).ok !== "boolean"
  ) {
    throw new Error("the host returned something that is not a tool result");
  }
  return parsed as Envelope;
}

/**
 * Calls one tool through the browser's host, accepting either convention two
 * hosts in the wild use: the tool object with its arguments as JSON, and the
 * tool name with a plain object. The second is only tried when the first was
 * rejected for the shape of its arguments.
 */
async function callHost(
  host: HostModelContext,
  tool: RegisteredTool,
  input: Record<string, unknown>,
): Promise<unknown> {
  let pending: Promise<unknown>;
  try {
    pending = Promise.resolve(host.executeTool(tool, JSON.stringify(input)));
  } catch (error) {
    if (!isTypeError(error)) throw error;
    pending = Promise.resolve(
      (host.executeTool as unknown as (name: string, args: unknown) => unknown)(
        tool.name,
        input,
      ),
    );
  }
  let raw: unknown;
  try {
    raw = await withTimeout(
      pending,
      HOST_CALL_TIMEOUT_MS,
      `the browser's WebMCP host calling ${tool.name}`,
    );
  } catch (error) {
    if (!isTypeError(error)) throw error;
    raw = await withTimeout(
      Promise.resolve(
        (
          host.executeTool as unknown as (name: string, args: unknown) => unknown
        )(tool.name, input),
      ),
      HOST_CALL_TIMEOUT_MS,
      `the browser's WebMCP host calling ${tool.name}`,
    );
  }
  return asEnvelope(raw);
}

/** One host call the page gave up on, named for the strip and the ledger. */
export type HostFallback = Readonly<{ tool: string; reason: string }>;

export type ResilientInvokeOptions = Readonly<{
  /** The host's tools, or null when there is no usable host. */
  hostTools: readonly RegisteredTool[] | null;
  /** This page's own descriptors — always built, always ready. */
  pageTools: readonly RegisteredTool[];
  /** Told once, when the run leaves the host route for good. */
  onFallback: (event: HostFallback) => void;
}>;

/**
 * The channel the demonstration actually runs on.
 *
 * It starts on the browser's host when there is one, and the first host call
 * that times out, throws, or answers in a shape this page cannot read moves the
 * whole rest of the run onto the page's own descriptors — the same dispatcher,
 * the same endpoint, the same server validation. The step that failed is
 * retried there, so no call is lost and no outcome is invented. Authority is
 * unchanged either way: both routes hold the same six tools and nothing else.
 */
export function resilientInvoke(options: ResilientInvokeOptions): DemoInvoke {
  const { hostTools, pageTools, onFallback } = options;
  const overPage = invokeOver(pageTools, "page");
  const frozenHost =
    hostTools === null || hostTools.length === 0
      ? null
      : Object.freeze([...hostTools]);
  let route: "host" | "page" = frozenHost === null ? "page" : "host";

  return async (name, input) => {
    if (route === "host" && frozenHost !== null) {
      const host = hostModelContext();
      const tool = frozenHost.find((candidate) => candidate.name === name);
      if (tool === undefined) {
        throw new Error(`This client holds no tool named ${name}.`);
      }
      if (host !== null) {
        try {
          return await callHost(host, tool, input);
        } catch (error) {
          route = "page";
          onFallback({
            tool: name,
            reason: error instanceof Error ? error.message : "the host failed",
          });
        }
      } else {
        route = "page";
        onFallback({ tool: name, reason: "the WebMCP host went away" });
      }
    }
    return overPage(name, input);
  };
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
