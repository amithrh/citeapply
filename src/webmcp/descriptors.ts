import {
  InvalidRequestFailureSchema,
  type BridgeInactiveFailure,
  type SharedOnly,
} from "../contracts/outcomes.ts";
import {
  TOOL_ANNOTATIONS,
  TOOL_DESCRIPTIONS,
  TOOL_INPUT_SCHEMAS,
  TOOL_NAMES,
  closedJsonSchema,
  parseCallbackToolResult,
  parseServerToolResult,
  type ToolInputByName,
  type ToolName,
  type ToolServerResultForInput,
} from "../contracts/webmcp.ts";

export type BridgeInvocation = Readonly<{
  generation: number;
}>;

export type CiteApplyToolDispatch = <
  K extends ToolName,
  I extends ToolInputByName[K],
>(
  name: K,
  input: I,
  options: Readonly<{ signal: AbortSignal }>,
  invocation: BridgeInvocation,
) => Promise<ToolServerResultForInput<K, I>>;

export type CallbackLifecycle = Readonly<{
  captureInvocation(): BridgeInvocation | null;
  isInvocationCurrent(invocation: BridgeInvocation): boolean;
  inactiveResult(): BridgeInactiveFailure;
}>;

export type CiteApplyDescriptor = Readonly<{
  name: ToolName;
  description: string;
  inputSchema: object;
  annotations: Readonly<{
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  }>;
}>;

function assertDescriptor(descriptor: CiteApplyDescriptor): void {
  if (descriptor.description.length >= 500) {
    throw new Error(`WebMCP description is too long: ${descriptor.name}`);
  }
  const schema = descriptor.inputSchema as {
    additionalProperties?: unknown;
    properties?: Record<string, { description?: unknown }>;
  };
  if (schema.additionalProperties !== false) {
    throw new Error(`WebMCP input schema is not closed: ${descriptor.name}`);
  }
  for (const [parameter, value] of Object.entries(schema.properties ?? {})) {
    if (
      typeof value.description !== "string" ||
      value.description.length >= 150
    ) {
      throw new Error(
        `WebMCP parameter description is missing or too long: ${descriptor.name}.${parameter}`,
      );
    }
  }
}

function deepFreezeJson<const T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) deepFreezeJson(child);
  return Object.freeze(value);
}

/**
 * The one refusal in the system that was not a refusal. A tool argument the
 * closed input schema rejects — a wrong key name, say — never reaches the
 * server, which is right; but `.parse` threw the raw ZodError straight at the
 * host, and Chrome surfaced that to the agent as
 * `UnknownError: Tool was executed but the invocation failed`: no code, no
 * safeActions, nothing an agent could act on. Every other failure in CiteApply
 * is a structured refusal that names what to do instead, and a malformed
 * argument is now one too.
 *
 * This is the shape the contracts already define for invalid_request
 * (`InvalidRequestFailureSchema`), built through the schema so it cannot
 * drift, and it is already a member of every tool's callback result union — so
 * nothing about the agent surface is widened. The ZodError itself is
 * deliberately not forwarded: it would echo the caller's own input back to it,
 * and the message is a fixed literal in the contract.
 */
const INVALID_REQUEST_RESULT: SharedOnly<"invalid_request"> = Object.freeze(
  InvalidRequestFailureSchema.parse({
    ok: false,
    error: {
      code: "invalid_request",
      message: "The request is not valid.",
      safeActions: ["use_visible_application"],
    },
  }),
);

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted === true) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }
}

/**
 * Chrome 151 invokes the callback with the parsed arguments only; it passes no
 * options object, so cancellation is unavailable there. Later builds and the
 * current draft supply `{ signal }`. Read it defensively and fall back to a
 * signal that never aborts, so a client that omits it can still call the tool.
 */
function executionSignal(
  options: WebMCP.ToolExecuteCallbackOptions | undefined,
): AbortSignal | undefined {
  return options?.signal;
}

export const CITEAPPLY_DESCRIPTORS: readonly CiteApplyDescriptor[] =
  Object.freeze(
    TOOL_NAMES.map((name) => {
      const descriptor: CiteApplyDescriptor = Object.freeze({
        name,
        description: TOOL_DESCRIPTIONS[name],
        inputSchema: deepFreezeJson(closedJsonSchema(TOOL_INPUT_SCHEMAS[name])),
        annotations: Object.freeze({ ...TOOL_ANNOTATIONS[name] }),
      });
      assertDescriptor(descriptor);
      return descriptor;
    }),
  );

export function materializeModelContextTools(
  dispatch: CiteApplyToolDispatch,
  lifecycle: CallbackLifecycle,
): readonly WebMCP.ModelContextTool[] {
  return Object.freeze(
    CITEAPPLY_DESCRIPTORS.map((descriptor) =>
      Object.freeze({
        ...descriptor,
        execute: async (
          rawInput: Record<string, unknown>,
          options?: WebMCP.ToolExecuteCallbackOptions,
        ) => {
          const signal = executionSignal(options);
          throwIfAborted(signal);

          const invocation = lifecycle.captureInvocation();
          if (invocation === null) return lifecycle.inactiveResult();

          const parsed = TOOL_INPUT_SCHEMAS[descriptor.name].safeParse(
            rawInput,
          );
          if (!parsed.success) return INVALID_REQUEST_RESULT;
          const parsedInput = parsed.data as never;

          throwIfAborted(signal);
          if (!lifecycle.isInvocationCurrent(invocation)) {
            return lifecycle.inactiveResult();
          }

          const rawServerResult = await dispatch(
            descriptor.name,
            parsedInput,
            { signal: signal ?? new AbortController().signal },
            invocation,
          );

          throwIfAborted(signal);
          const serverProjection = parseServerToolResult(
            descriptor.name,
            parsedInput,
            rawServerResult,
          );
          return parseCallbackToolResult(
            descriptor.name,
            parsedInput,
            serverProjection,
          );
        },
      }),
    ),
  );
}
