"use client";

import type { DemoStepReport, DemoSummary, DemoTally } from "./client.ts";

export const HONESTY_LABEL =
  "Scripted demonstration client. Every call is a real WebMCP tool call, validated by the server; nothing is simulated.";

function outcomeWord(code: string): string {
  return code === "ok" ? "accepted" : code.replaceAll("_", " ");
}

export type NarrationStripProps = Readonly<{
  step: DemoStepReport | null;
  tally: DemoTally;
  finished: boolean;
  onSkip: () => void;
  onStop: () => void;
}>;

/**
 * The strip that runs above the form while the scripted client works. One
 * sentence at a time, the outcome the server actually returned, and a counter
 * that is the same count the Assisted activity ledger below is keeping — a
 * refusal is counted, named and shown exactly like an acceptance, because two
 * of the nine steps are refusals and they are the point.
 */
export function NarrationStrip({
  step,
  tally,
  finished,
  onSkip,
  onStop,
}: NarrationStripProps) {
  return (
    <section
      className="watch-strip"
      aria-labelledby="watch-strip-heading"
      data-finished={finished || undefined}
      data-print="hide"
    >
      <div className="watch-strip-head">
        <h2 id="watch-strip-heading">
          {finished
            ? "The assistant has stopped"
            : "An assistant is filling this in"}
        </h2>
        {step === null ? null : (
          <p className="watch-progress">
            Step {step.index} of {step.total}
          </p>
        )}
      </div>

      <p className="watch-narration" role="status" aria-live="polite">
        {step === null ? "Starting." : step.narration}
        {step !== null && step.detail !== "" ? ` ${step.detail}` : ""}
      </p>

      <p className="watch-call">
        {step === null ? null : (
          <>
            <code>{step.tool}</code>
            <strong
              className="watch-badge"
              data-outcome={step.outcome?.code ?? "pending"}
            >
              {step.outcome === null
                ? "calling…"
                : outcomeWord(step.outcome.code)}
            </strong>
          </>
        )}
      </p>

      <p className="watch-counter">
        <span>
          <b>{tally.toolCalls}</b> tool calls
        </span>
        <span>
          <b>{tally.answersCited}</b> answers cited
        </span>
        <span>
          <b>{tally.refusals}</b> refusals
        </span>
      </p>

      {finished ? null : (
        <div className="watch-controls">
          <button type="button" onClick={onSkip}>
            Skip ahead
          </button>
          <button type="button" onClick={onStop}>
            Stop
          </button>
        </div>
      )}

      <p className="watch-honesty">{HONESTY_LABEL}</p>
    </section>
  );
}

export type SessionShape = Readonly<{
  /** Records this application was opened from. */
  records: number;
  /** Answers this form requires, as the server currently states it. */
  requiredAnswers: number;
  /** Acts on this application that no tool can perform, for this record set. */
  decisions: readonly string[];
}>;

export type ByHandColumn = Readonly<{
  documentsOpened: number;
  entriesTyped: number;
  linesPicked: number;
  refusals: number;
  corrections: number;
}>;

export type HandoffPanelProps = Readonly<{
  summary: DemoSummary;
  shape: SessionShape;
  byHand: ByHandColumn;
}>;

/**
 * What is left, and what just happened, set against each other. Every figure
 * on both sides came from this session: the left column counts what this
 * person did on this page, the right counts what the scripted client did
 * through the six registered tools. Nothing here is an average, a benchmark,
 * or a claim about time.
 */
export function HandoffPanel({ summary, shape, byHand }: HandoffPanelProps) {
  return (
    <section
      className="handoff"
      aria-labelledby="handoff-heading"
      data-print="hide"
    >
      <h2 id="handoff-heading">The rest is yours</h2>
      <p className="handoff-lead">
        The assistant went as far as this application lets anything but you go.
        What is left are the decisions, and they were never available to it.
      </p>
      <ul className="handoff-left">
        {summary.leftToYou.map((task) => (
          <li key={task}>{task}</li>
        ))}
      </ul>
      {summary.refusedFor.length === 0 ? null : (
        <p className="handoff-refused">
          It asked to{" "}
          {summary.refusedFor.map((reason, index) => (
            <span key={reason}>
              {index === 0 ? "" : "; and to "}
              {reason}
            </span>
          ))}
          .
        </p>
      )}

      <h3 id="difference-heading">Feel the difference</h3>
      <p className="handoff-shape">
        This application is backed by {shape.records} records and asks for{" "}
        {shape.requiredAnswers} answers. {shape.decisions.length} of the things
        it needs are the decisions listed above, and no tool on this page can
        make any of them.
      </p>
      <div className="difference" aria-labelledby="difference-heading">
        <div className="difference-column" data-side="hand">
          <h4>By hand, this session</h4>
          {byHand.entriesTyped === 0 && byHand.documentsOpened === 0 ? (
            <p className="difference-empty">
              Nothing on this application was filled in by hand in this session.
            </p>
          ) : null}
          <dl>
            <div>
              <dt>Records you opened</dt>
              <dd>{byHand.documentsOpened}</dd>
            </div>
            <div>
              <dt>Entries you typed</dt>
              <dd>{byHand.entriesTyped}</dd>
            </div>
            <div>
              <dt>Lines you linked</dt>
              <dd>{byHand.linesPicked}</dd>
            </div>
            <div>
              <dt>Refused</dt>
              <dd>{byHand.refusals}</dd>
            </div>
            <div>
              <dt>Corrections</dt>
              <dd>{byHand.corrections}</dd>
            </div>
          </dl>
        </div>
        <div className="difference-column" data-side="assisted">
          <h4>With the assistant, this session</h4>
          <dl>
            <div>
              <dt>Tool calls</dt>
              <dd>{summary.tally.toolCalls}</dd>
            </div>
            <div>
              <dt>Answers cited</dt>
              <dd>{summary.tally.answersCited}</dd>
            </div>
            <div>
              <dt>Refused</dt>
              <dd>{summary.tally.refusals}</dd>
            </div>
            <div>
              <dt>Decisions still yours</dt>
              <dd>{shape.decisions.length}</dd>
            </div>
          </dl>
        </div>
      </div>
      <p className="watch-honesty">{HONESTY_LABEL}</p>
    </section>
  );
}
