"use client";

import { useId, useState } from "react";

/**
 * The by-hand path, as it actually is when nobody is helping.
 *
 * An evidence-backed form is not a form with a "fill this for me" button beside
 * every row. Every answer here has to be found in one of three PDFs, typed as
 * that record states it, and attached to the exact line it came from. This
 * component is that work, and nothing more: it holds no authority, calls no
 * service, and hands the page a claim handle only once the person has both
 * typed a value and chosen a line that says it. The bind itself is the same
 * `bind_evidence` action the page has always used, checked by the same server.
 *
 * The picker deliberately lists **every** parsed line of the chosen record, not
 * the ones that happen to fit this row. Filtering by field would do the reading
 * for the applicant, which is the thing this screen is about.
 */

export type ManualClaim = Readonly<{
  claimHandle: string;
  document: "enrollment" | "household" | "income";
  kind: string;
  normalizedValue: string | number | boolean;
}>;

export type ManualDocument = Readonly<{
  code: "enrollment" | "household" | "income";
  title: string;
}>;

/**
 * Does the typed text state the same thing as the chosen line? Deliberately
 * forgiving about presentation — spacing, letter case, a currency symbol, the
 * thousands separators a person copies along with a figure — and deliberately
 * strict about substance. Nothing here is stored: the value that is saved is
 * always the record's own parsed value, never the string somebody typed.
 */
export function statesTheSame(
  typed: string,
  value: string | number | boolean,
): boolean {
  const trimmed = typed.trim();
  if (trimmed === "") return false;
  if (typeof value === "boolean") {
    const word = trimmed.toLowerCase();
    return value
      ? word === "yes" || word === "true"
      : word === "no" || word === "false";
  }
  if (typeof value === "number") {
    const digits = trimmed.replace(/[^0-9.]/g, "");
    if (digits === "") return false;
    return Number(digits) === value;
  }
  const flatten = (candidate: string): string =>
    candidate.normalize("NFC").toLowerCase().replace(/\s+/gu, " ").trim();
  return flatten(trimmed) === flatten(value);
}

const LINE_NAMES: Readonly<Record<string, string>> = {
  legal_name: "Legal name",
  student_id: "Student ID",
  institution: "Institution",
  dependency: "Dependent on guardian",
  guardian_name: "Guardian name",
  household_size: "Household size",
  annual_household_income: "Annual household income",
};

/**
 * A line is offered by the name the record gives it, never by what it says.
 * Quoting the value here would hand over the answer and turn the picker into
 * the shortcut this screen exists to remove; the applicant has to open the
 * record to find out what that line reads.
 */
function lineName(kind: string): string {
  return LINE_NAMES[kind] ?? kind.replaceAll("_", " ");
}

const MISMATCH =
  "That line does not say that. Read the record again: the value you typed and the line you picked have to be the same statement.";
const NO_LINE = "Choose the line in that record that states this value.";
const NO_VALUE =
  "Type the value as the record states it before linking a line.";

export type EvidenceEntryProps = Readonly<{
  field: string;
  documents: readonly ManualDocument[];
  claims: readonly ManualClaim[];
  stale: boolean;
  onEntrySubmitted: () => void;
  onRefused: (reason: "mismatch") => void;
  /** Runs the page's own bind action. Resolves false when the server refused. */
  onLink: (claimHandle: string) => Promise<boolean>;
}>;

export function EvidenceEntry({
  field,
  documents,
  claims,
  stale,
  onEntrySubmitted,
  onRefused,
  onLink,
}: EvidenceEntryProps) {
  const baseId = useId();
  const [typed, setTyped] = useState("");
  const [documentCode, setDocumentCode] = useState<string>("");
  const [claimHandle, setClaimHandle] = useState<string>("");
  const [refusal, setRefusal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lines = claims.filter((claim) => claim.document === documentCode);

  const attempt = async () => {
    if (busy || stale) return;
    if (typed.trim() === "") {
      setRefusal(NO_VALUE);
      return;
    }
    if (claimHandle === "") {
      setRefusal(NO_LINE);
      return;
    }
    const chosen = claims.find((claim) => claim.claimHandle === claimHandle);
    if (chosen === undefined) {
      setRefusal(NO_LINE);
      return;
    }

    onEntrySubmitted();
    if (!statesTheSame(typed, chosen.normalizedValue)) {
      setRefusal(MISMATCH);
      onRefused("mismatch");
      return;
    }

    setBusy(true);
    try {
      const linked = await onLink(chosen.claimHandle);
      setRefusal(
        linked
          ? null
          : "CiteApply would not accept that line for this answer. The message above says why.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="entry" data-field={field}>
      <ol className="entry-steps">
        <li>
          <label htmlFor={`${baseId}-value`} className="entry-step-label">
            The value, exactly as the record writes it
          </label>
          <input
            id={`${baseId}-value`}
            type="text"
            value={typed}
            disabled={stale}
            autoComplete="off"
            onChange={(event) => {
              setTyped(event.target.value);
              setRefusal(null);
            }}
          />
        </li>

        <li>
          <label htmlFor={`${baseId}-document`} className="entry-step-label">
            Which record did you read it in?
          </label>
          <select
            id={`${baseId}-document`}
            value={documentCode}
            disabled={stale}
            onChange={(event) => {
              setDocumentCode(event.target.value);
              setClaimHandle("");
              setRefusal(null);
            }}
          >
            <option value="">Choose a record…</option>
            {documents.map((document) => (
              <option key={document.code} value={document.code}>
                {document.title}
              </option>
            ))}
          </select>
        </li>

        <li>
          <label htmlFor={`${baseId}-line`} className="entry-step-label">
            Which line in it says so?
          </label>
          <select
            id={`${baseId}-line`}
            value={claimHandle}
            disabled={stale || documentCode === ""}
            onChange={(event) => {
              setClaimHandle(event.target.value);
              setRefusal(null);
            }}
          >
            <option value="">
              {documentCode === ""
                ? "Choose a record first…"
                : "Choose the line…"}
            </option>
            {lines.map((claim) => (
              <option key={claim.claimHandle} value={claim.claimHandle}>
                {lineName(claim.kind)}
              </option>
            ))}
          </select>
        </li>
      </ol>

      <button
        type="button"
        className="entry-link"
        disabled={stale || busy}
        aria-busy={busy || undefined}
        onClick={() => void attempt()}
      >
        {busy ? "Linking…" : "Link this line"}
      </button>

      {refusal === null ? null : (
        <p className="entry-refusal" role="alert">
          {refusal}
        </p>
      )}
    </div>
  );
}

export type RecordShelfProps = Readonly<{
  packet: string;
  documents: readonly ManualDocument[];
  onOpened: (code: string) => void;
}>;

/**
 * The three records, in one place, at the top of the answers. They are the
 * same three for every row, so repeating them under each answer would be
 * clutter — and they belong above the form anyway, because reading them is
 * the first thing this screen asks of anybody filling it in by hand.
 */
export function RecordShelf({ packet, documents, onOpened }: RecordShelfProps) {
  return (
    <div className="record-shelf">
      <p className="record-shelf-lead">
        Nothing below is filled in for you. Open a record, read it, and say
        which line answers each question.
      </p>
      <ul className="entry-records">
        {documents.map((document) => (
          <li key={document.code}>
            <a
              href={`/api/demo?document=${packet}/${document.code}.pdf`}
              target="_blank"
              rel="noreferrer"
              onClick={() => onOpened(document.code)}
            >
              {document.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type ByHandCounts = Readonly<{
  documentsOpened: number;
  entriesTyped: number;
  linesPicked: number;
  refusals: number;
  corrections: number;
}>;

export const NO_WORK_YET: ByHandCounts = Object.freeze({
  documentsOpened: 0,
  entriesTyped: 0,
  linesPicked: 0,
  refusals: 0,
  corrections: 0,
});

const TALLY_ROWS: readonly (readonly [keyof ByHandCounts, string])[] = [
  ["documentsOpened", "Records opened"],
  ["entriesTyped", "Entries typed"],
  ["linesPicked", "Lines linked"],
  ["refusals", "Refused"],
  ["corrections", "Corrections"],
];

/**
 * What this session has actually cost the person so far. Every number is
 * counted from something that happened on this page — a record opened, an
 * entry submitted, a line accepted, a refusal shown — and none of them is a
 * constant. The same numbers are what the comparison panel later sets against
 * the assistant's.
 */
export function ByHandTally({ counts }: Readonly<{ counts: ByHandCounts }>) {
  return (
    <section className="by-hand-tally" aria-labelledby="by-hand-tally-heading">
      <h2 id="by-hand-tally-heading">Your work so far</h2>
      <p>
        Counted from this session only. Filling an evidence-backed form by hand
        means reading the records yourself.
      </p>
      <dl>
        {TALLY_ROWS.map(([key, rowLabel]) => (
          <div key={key} data-zero={counts[key] === 0 || undefined}>
            <dt>{rowLabel}</dt>
            <dd>{counts[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
