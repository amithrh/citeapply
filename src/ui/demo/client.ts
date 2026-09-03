/**
 * A scripted demonstration client.
 *
 * Everything in this file is a *client*, not part of the page's authority. It
 * is handed a fixed list of tool objects — the six this page registered, and
 * nothing else — and a way to invoke one of them. It has no fetch, no
 * capability, no service, no knowledge of the session; the only thing it can
 * do to this application is call one of those six tools with arguments the
 * closed input schemas accept, exactly as an agent in the browser would. Every
 * refusal it meets is a real refusal from the server.
 *
 * It is scripted because a demonstration has to be the same every time it is
 * watched. It is not a model, it does not choose, and the page says so on
 * screen for as long as it is running.
 */

export const DEMO_TOOL_NAMES = Object.freeze([
  "get_application_state",
  "get_form_requirements",
  "get_evidence_index",
  "apply_evidence_backed_answers",
  "prepare_submission_review",
] as const);

/** One invocation, as the client observed it. */
export type DemoOutcome = Readonly<{
  ok: boolean;
  /** "ok", or the refusal code the server returned. */
  code: string;
}>;

/**
 * The only channel the client has. The page builds it over exactly the tools
 * the browser handed back, so a name outside that list cannot be called at
 * all — the caller has nowhere to look it up.
 */
export type DemoInvoke = (
  name: string,
  input: Record<string, unknown>,
) => Promise<unknown>;

export type DemoStepReport = Readonly<{
  index: number;
  total: number;
  /** One plain sentence, in the present tense, about what is being asked for. */
  narration: string;
  tool: string;
  outcome: DemoOutcome | null;
  /** What the result meant, once it arrived. Empty while the call is in flight. */
  detail: string;
}>;

export type DemoTally = Readonly<{
  toolCalls: number;
  answersCited: number;
  refusals: number;
}>;

export type DemoObserver = Readonly<{
  onStep: (report: DemoStepReport) => void;
  onTally: (tally: DemoTally) => void;
  /** Highlights rows the last call changed or newly required. */
  onHighlight: (fields: readonly string[]) => void;
  onFinished: (summary: DemoSummary) => void;
}>;

export type DemoSummary = Readonly<{
  tally: DemoTally;
  /** Every field the assistant bound to a record line, in order. */
  citedFields: readonly string[];
  /** What it asked for and was refused, named in words. */
  refusedFor: readonly string[];
  /** What it could reach but never decide. */
  leftToYou: readonly string[];
}>;

type Envelope = Readonly<{ ok?: unknown; error?: { code?: unknown } }>;

function outcomeOf(result: unknown): DemoOutcome {
  const body = (result ?? {}) as Envelope;
  if (body.ok === true) return { ok: true, code: "ok" };
  const code = body.error?.code;
  return { ok: false, code: typeof code === "string" ? code : "unknown" };
}

function dataOf(result: unknown): Record<string, unknown> {
  const body = (result ?? {}) as { data?: unknown };
  return typeof body.data === "object" && body.data !== null
    ? (body.data as Record<string, unknown>)
    : {};
}

function versionsOf(
  result: unknown,
): Readonly<{ applicationRevision: number; requirementsVersion: number }> {
  const data = dataOf(result);
  const revision = data["applicationRevision"];
  const requirements = data["requirementsVersion"];
  return {
    applicationRevision: typeof revision === "number" ? revision : 0,
    requirementsVersion: typeof requirements === "number" ? requirements : 1,
  };
}

function requirementFields(result: unknown): readonly string[] {
  const fields = dataOf(result)["fields"];
  if (!Array.isArray(fields)) return [];
  return fields
    .map((entry) => (entry as { field?: unknown }).field)
    .filter((field): field is string => typeof field === "string");
}

type IndexedClaim = Readonly<{
  claimHandle: string;
  kind: string;
  document: string;
}>;

function claimsOf(result: unknown): readonly IndexedClaim[] {
  const claims = dataOf(result)["claims"];
  if (!Array.isArray(claims)) return [];
  return claims.filter(
    (claim): claim is IndexedClaim =>
      typeof claim === "object" &&
      claim !== null &&
      typeof (claim as IndexedClaim).claimHandle === "string",
  );
}

/** The words the strip uses for each field, so no row is named by its column. */
const FIELD_WORDS: Readonly<Record<string, string>> = {
  legal_name: "legal name",
  student_id: "student ID",
  institution: "institution",
  dependency: "dependency on a guardian",
  guardian_name: "guardian name",
  household_size: "household size",
  annual_household_income: "annual household income",
  preferred_contact_email: "contact email",
};

function listWords(fields: readonly string[]): string {
  const words = fields.map((field) => FIELD_WORDS[field] ?? field);
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}

export type RunDemoOptions = Readonly<{
  invoke: DemoInvoke;
  observer: DemoObserver;
  /** Milliseconds to hold each step on screen. Zero for reduced motion. */
  pause: number;
  /** Resolves when the watcher asked to skip the remaining pause. */
  waitFor: (milliseconds: number) => Promise<void>;
  /** Aborts the run when the page moves on. */
  signal: AbortSignal;
  newRequestId: () => string;
}>;

/**
 * The one address the tool schema accepts here. `.test` is reserved by RFC
 * 2606 and can never route anywhere, and the schema pins this single literal
 * so a proposal cannot smuggle in an address of the caller's choosing. It is
 * still only a proposal until a person declares it.
 */
const PROPOSED_EMAIL = "anaya.rao@example.test";

const TOTAL_STEPS = 9;

/**
 * Runs the nine-call journey. Each step names what it is about to ask for
 * before it asks, so a watcher reads the intention and then sees the answer —
 * including when the answer is a refusal, which is the point of two of these
 * steps.
 */
export async function runDemo(options: RunDemoOptions): Promise<DemoSummary> {
  const { invoke, observer, pause, waitFor, signal, newRequestId } = options;

  let toolCalls = 0;
  let answersCited = 0;
  let refusals = 0;
  const citedFields: string[] = [];
  const refusedFor: string[] = [];
  const leftToYou: string[] = [];

  const tally = (): DemoTally => ({ toolCalls, answersCited, refusals });

  /**
   * Every call the client makes goes through here, including the version reads
   * between writes. That is what keeps the counter on the strip equal to the
   * page's own Assisted activity ledger: neither one has a call the other
   * cannot see.
   */
  const call = async (
    tool: string,
    input: Record<string, unknown>,
  ): Promise<unknown> => {
    if (signal.aborted) throw new DOMException("stopped", "AbortError");
    const result = await invoke(tool, input);
    toolCalls += 1;
    if (!outcomeOf(result).ok) refusals += 1;
    observer.onTally(tally());
    return result;
  };

  const step = async (
    index: number,
    narration: string,
    tool: string,
    input: Record<string, unknown>,
    describe: (result: unknown, outcome: DemoOutcome) => string,
    highlight: (result: unknown, outcome: DemoOutcome) => readonly string[],
  ): Promise<unknown> => {
    if (signal.aborted) throw new DOMException("stopped", "AbortError");
    observer.onStep({
      index,
      total: TOTAL_STEPS,
      narration,
      tool,
      outcome: null,
      detail: "",
    });

    const result = await call(tool, input);
    const outcome = outcomeOf(result);

    observer.onStep({
      index,
      total: TOTAL_STEPS,
      narration,
      tool,
      outcome,
      detail: describe(result, outcome),
    });
    observer.onTally(tally());
    observer.onHighlight(highlight(result, outcome));

    if (index < TOTAL_STEPS) await waitFor(pause);
    return result;
  };

  const nothing = (): readonly string[] => [];

  // 1 — what the application already holds.
  let state = await step(
    1,
    "Reading what this application already holds.",
    "get_application_state",
    { mode: "protected" },
    (result) => {
      const versions = versionsOf(result);
      return `Revision ${versions.applicationRevision}, requirements v${versions.requirementsVersion}.`;
    },
    nothing,
  );

  // 2 — the rules, as the site states them right now.
  const firstRequirements = await step(
    2,
    "Reading the rules: which answers this form requires right now.",
    "get_form_requirements",
    { mode: "active" },
    (result) => `${requirementFields(result).length} answers are required.`,
    nothing,
  );
  const requiredBefore = requirementFields(firstRequirements);

  // 3 — every line the three records contain.
  const evidence = await step(
    3,
    "Reading the index of every line these three records contain.",
    "get_evidence_index",
    {},
    (result) => `${claimsOf(result).length} lines across three records.`,
    nothing,
  );
  const claims = claimsOf(evidence);
  const handleFor = (kind: string, document?: string): string | null =>
    claims.find(
      (claim) =>
        claim.kind === kind &&
        (document === undefined || claim.document === document),
    )?.claimHandle ?? null;

  const bindChange = (
    field: string,
    kind: string,
    document?: string,
  ): Record<string, unknown> | null => {
    const claimHandle = handleFor(kind, document);
    return claimHandle === null
      ? null
      : { kind: "bind_claim", field, claimHandle };
  };

  // 4 — every supported answer this form asks for so far, in one call.
  const firstBatch = [
    bindChange("legal_name", "legal_name"),
    bindChange("student_id", "student_id"),
    bindChange("institution", "institution"),
    bindChange("dependency", "dependency"),
  ].filter((change): change is Record<string, unknown> => change !== null);
  const firstBatchFields = firstBatch.map(
    (change) => change["field"] as string,
  );

  const applied = await step(
    4,
    `Binding ${listWords(firstBatchFields)} from the enrollment and household records — one call, every answer citing the line it came from.`,
    "apply_evidence_backed_answers",
    {
      requestId: newRequestId(),
      expectedApplicationRevision: versionsOf(state).applicationRevision,
      expectedRequirementsVersion: versionsOf(state).requirementsVersion,
      changes: firstBatch,
    },
    (_result, outcome) =>
      outcome.ok
        ? `${firstBatch.length} answers now cite a record line.`
        : "Nothing was written.",
    (_result, outcome) => (outcome.ok ? firstBatchFields : []),
  );
  if (outcomeOf(applied).ok) {
    answersCited += firstBatch.length;
    citedFields.push(...firstBatchFields);
    observer.onTally(tally());
  }

  // 5 — the rules moved, because saying yes to a guardian added two rows.
  const secondRequirements = await step(
    5,
    "Reading the rules again: answering the dependency question changed what this form requires.",
    "get_form_requirements",
    { mode: "active" },
    (result) => {
      const now = requirementFields(result);
      const added = now.filter((field) => !requiredBefore.includes(field));
      return added.length === 0
        ? `${now.length} answers are required.`
        : `${requiredBefore.length} required answers became ${now.length}: ${listWords(added)} are now asked for.`;
    },
    (result) =>
      requirementFields(result).filter(
        (field) => !requiredBefore.includes(field),
      ),
  );
  const newlyRequired = requirementFields(secondRequirements).filter(
    (field) => !requiredBefore.includes(field),
  );

  state = await call("get_application_state", { mode: "protected" });

  // 6 — the two answers that only just became required.
  const branch = [
    bindChange("guardian_name", "guardian_name"),
    bindChange("household_size", "household_size"),
  ].filter((change): change is Record<string, unknown> => change !== null);
  const branchFields = branch.map((change) => change["field"] as string);

  const branched = await step(
    6,
    `Binding ${listWords(branchFields.length > 0 ? branchFields : newlyRequired)} from the household statement.`,
    "apply_evidence_backed_answers",
    {
      requestId: newRequestId(),
      expectedApplicationRevision: versionsOf(state).applicationRevision,
      expectedRequirementsVersion: versionsOf(state).requirementsVersion,
      changes: branch,
    },
    (_result, outcome) =>
      outcome.ok
        ? `${branch.length} more answers cite a record line.`
        : "Nothing was written.",
    (_result, outcome) => (outcome.ok ? branchFields : []),
  );
  if (outcomeOf(branched).ok) {
    answersCited += branch.length;
    citedFields.push(...branchFields);
    observer.onTally(tally());
  }

  state = await call("get_application_state", { mode: "protected" });

  // 7 — the income. This is where the two record sets part company.
  const incomeChange = bindChange(
    "annual_household_income",
    "annual_household_income",
    "income",
  );
  const income = await step(
    7,
    "Asking for the annual household income.",
    "apply_evidence_backed_answers",
    {
      requestId: newRequestId(),
      expectedApplicationRevision: versionsOf(state).applicationRevision,
      expectedRequirementsVersion: versionsOf(state).requirementsVersion,
      changes: incomeChange === null ? [] : [incomeChange],
    },
    (_result, outcome) =>
      outcome.code === "conflict_requires_human"
        ? "Refused: the two records disagree about this figure, and nothing was written. Only you can settle it."
        : outcome.ok
          ? "The two records agree, so the answer cites both of them."
          : "Nothing was written.",
    () => ["annual_household_income"],
  );
  const incomeOutcome = outcomeOf(income);
  if (incomeOutcome.ok) {
    answersCited += 1;
    citedFields.push("annual_household_income");
    observer.onTally(tally());
  } else if (incomeOutcome.code === "conflict_requires_human") {
    refusedFor.push(
      "settle which record states your household income — it was refused, because two accepted records disagree",
    );
    leftToYou.push(
      "Read both income records and choose the one you stand behind.",
    );
  }

  state = await call("get_application_state", { mode: "protected" });

  // 8 — it may propose an email. It can never declare one.
  await step(
    8,
    "Proposing a synthetic contact address. It cannot declare one as yours.",
    "apply_evidence_backed_answers",
    {
      requestId: newRequestId(),
      expectedApplicationRevision: versionsOf(state).applicationRevision,
      expectedRequirementsVersion: versionsOf(state).requirementsVersion,
      changes: [
        {
          kind: "propose_email",
          field: "preferred_contact_email",
          value: PROPOSED_EMAIL,
        },
      ],
    },
    (_result, outcome) =>
      outcome.ok
        ? "Accepted as a proposal only. The row reads “not yet declared”."
        : "Nothing was written.",
    () => ["preferred_contact_email"],
  );
  leftToYou.push("Declare that the contact address is yours.");

  state = await call("get_application_state", { mode: "protected" });

  // 9 — and it stops, because the form is not ready and it may not decide.
  const prepared = await step(
    9,
    "Trying to freeze a review for you to submit.",
    "prepare_submission_review",
    {
      requestId: newRequestId(),
      expectedApplicationRevision: versionsOf(state).applicationRevision,
      expectedRequirementsVersion: versionsOf(state).requirementsVersion,
    },
    (result, outcome) => {
      if (outcome.ok) return "The review is frozen and ready for you to read.";
      const blockers = (result as { error?: { blockers?: unknown } }).error
        ?.blockers;
      const codes = Array.isArray(blockers)
        ? blockers
            .map((blocker) => (blocker as { message?: unknown }).message)
            .filter((message): message is string => typeof message === "string")
        : [];
      return codes.length === 0
        ? "Refused. The application is not ready."
        : `Refused: ${codes.join(" ")}`;
    },
    nothing,
  );
  if (!outcomeOf(prepared).ok) {
    refusedFor.push(
      "freeze a review — it was refused, because decisions only you can make are still open",
    );
  }
  leftToYou.push("Prepare the review, read it, and submit it.");

  const summary: DemoSummary = Object.freeze({
    tally: tally(),
    citedFields: Object.freeze([...citedFields]),
    refusedFor: Object.freeze([...refusedFor]),
    leftToYou: Object.freeze([...leftToYou]),
  });
  observer.onFinished(summary);
  return summary;
}
