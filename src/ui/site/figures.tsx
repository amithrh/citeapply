/**
 * The small drawings each feature section is built around, plus the four marks
 * on the proof strip.
 *
 * All inline SVG on a fixed `viewBox`, so they scale with their column, cost
 * no request under `default-src 'self'`, and reserve their own height before
 * paint — nothing here can shift the layout as it loads.
 *
 * None of them carries a figure caption or an `aria-label`: each sits beside
 * prose that already says the same thing, so they are marked `aria-hidden` and
 * a screen reader is not made to hear the drawing twice.
 */

const TEAL = "#0f6e6b";
const OCHRE = "#8c4b05";
const RULE = "#cfdbe1";
const INK = "#12212e";

/* ---- Proof-strip marks ------------------------------------------------- */

export function ToolsMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {[0, 1].map((row) =>
        [0, 1, 2].map((column) => (
          <rect
            key={`${row}-${column}`}
            x={2 + column * 7.5}
            y={4 + row * 9}
            width="6"
            height="6"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        )),
      )}
    </svg>
  );
}

export function NoSubmitMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M6.5 17.5 17.5 6.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AtomicMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 8h11l-2.6-2.6M20 16H9l2.6 2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SameHashMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 10h16M4 15h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M10 4.5 8.5 20M16 4.5 14.5 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---- Section drawings -------------------------------------------------- */

/**
 * An answer is not free text: it is a link to a sentence in a record, and the
 * page shows both halves joined.
 */
export function EvidenceFigure() {
  return (
    <svg
      className="feature-figure"
      viewBox="0 0 420 260"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="10"
        y="14"
        width="400"
        height="94"
        rx="8"
        fill="#ffffff"
        stroke={RULE}
      />
      <rect x="10" y="14" width="4" height="94" rx="2" fill={TEAL} />
      <text className="fig-label" x="32" y="42" fill="#66798a">
        Household size
      </text>
      <text className="fig-value" x="32" y="72" fill={INK}>
        5
      </text>
      <rect x="32" y="84" width="150" height="6" rx="3" fill="#dde5ea" />
      <g className="fig-pill">
        <rect
          x="272"
          y="30"
          width="122"
          height="24"
          rx="12"
          fill="#e4f0ef"
          stroke={TEAL}
        />
        <text className="fig-chip" x="286" y="46" fill={TEAL}>
          cited · corroborated
        </text>
      </g>

      <path
        d="M22 108 V 150 a8 8 0 0 0 8 8 h10"
        fill="none"
        stroke={TEAL}
        strokeWidth="2"
      />

      <rect
        x="40"
        y="130"
        width="370"
        height="112"
        rx="8"
        fill="#f6fafa"
        stroke={TEAL}
      />
      <rect x="40" y="130" width="370" height="4" rx="2" fill={TEAL} />
      <text className="fig-label" x="60" y="158" fill={TEAL}>
        Synthetic Household Statement
      </text>
      <text className="fig-quote" x="60" y="184" fill={INK}>
        &#8220;Members of the household at this
      </text>
      <text className="fig-quote" x="60" y="202" fill={INK}>
        address: five.&#8221;
      </text>
      <text className="fig-meta" x="60" y="226" fill="#66798a">
        page 1 · claim handle, not a storage path
      </text>
    </svg>
  );
}

/** Answering one question makes two more apply: six become eight. */
export function RequirementsFigure() {
  const before = [0, 1, 2, 3, 4, 5];
  const after = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <svg
      className="feature-figure"
      viewBox="0 0 420 250"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="8"
        y="26"
        width="168"
        height="200"
        rx="8"
        fill="#ffffff"
        stroke={RULE}
      />
      <text className="fig-label" x="28" y="54" fill="#66798a">
        Before
      </text>
      <text className="fig-count" x="126" y="58" fill={INK}>
        6
      </text>
      {before.map((row) => (
        <g key={row}>
          <rect
            x="28"
            y={74 + row * 24}
            width="3"
            height="12"
            rx="1.5"
            fill={TEAL}
          />
          <rect
            x="40"
            y={77 + row * 24}
            width={row % 2 === 0 ? 108 : 84}
            height="7"
            rx="3.5"
            fill="#c9d5dd"
          />
        </g>
      ))}

      <path
        d="M188 126h44l-9-9M232 126l-9 9"
        fill="none"
        stroke={OCHRE}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="244"
        y="8"
        width="168"
        height="236"
        rx="8"
        fill="#ffffff"
        stroke={OCHRE}
      />
      <text className="fig-label" x="264" y="36" fill="#66798a">
        After
      </text>
      <text className="fig-count" x="362" y="40" fill={INK}>
        8
      </text>
      {after.map((row) => {
        const fresh = row >= 6;
        return (
          <g key={row}>
            <rect
              x="264"
              y={56 + row * 24}
              width="3"
              height="12"
              rx="1.5"
              fill={fresh ? OCHRE : TEAL}
            />
            <rect
              x="276"
              y={59 + row * 24}
              width={row % 2 === 0 ? 108 : 84}
              height="7"
              rx="3.5"
              fill={fresh ? "#e6b877" : "#c9d5dd"}
            />
          </g>
        );
      })}
    </svg>
  );
}

/** One frozen review, one receipt, and the same content hash across both. */
export function CommitmentFigure() {
  return (
    <svg
      className="feature-figure"
      viewBox="0 0 420 250"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="12"
        y="16"
        width="176"
        height="176"
        rx="8"
        fill="#ffffff"
        stroke={RULE}
      />
      <rect x="12" y="16" width="176" height="4" rx="2" fill={TEAL} />
      <text className="fig-label" x="32" y="46" fill={TEAL}>
        Frozen review
      </text>
      {[0, 1, 2, 3].map((row) => (
        <rect
          key={row}
          x="32"
          y={66 + row * 20}
          width={row === 3 ? 74 : 130}
          height="7"
          rx="3.5"
          fill="#d5dee4"
        />
      ))}
      <rect
        x="32"
        y="150"
        width="112"
        height="24"
        rx="12"
        fill="#e4f0ef"
        stroke={TEAL}
      />
      <text className="fig-chip" x="46" y="166" fill={TEAL}>
        you approved
      </text>

      <path
        d="M196 104h32l-8-8M228 104l-8 8"
        fill="none"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="238"
        y="16"
        width="172"
        height="176"
        rx="8"
        fill="#ffffff"
        stroke={RULE}
      />
      <rect x="238" y="16" width="172" height="4" rx="2" fill={OCHRE} />
      <text className="fig-label" x="258" y="46" fill={OCHRE}>
        Receipt
      </text>
      {[0, 1, 2].map((row) => (
        <rect
          key={row}
          x="258"
          y={66 + row * 20}
          width={row === 2 ? 68 : 124}
          height="7"
          rx="3.5"
          fill="#d5dee4"
        />
      ))}
      <rect
        x="258"
        y="140"
        width="132"
        height="34"
        rx="5"
        fill="#0a2f33"
      />
      <text className="fig-hash" x="270" y="154" fill="#7fd4cc">
        content hash
      </text>
      <rect x="270" y="160" width="108" height="6" rx="3" fill="#3f7f81" />

      <path
        d="M100 200 V 216 h224 V 200"
        fill="none"
        stroke={INK}
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <text className="fig-meta" x="212" y="240" fill="#66798a" textAnchor="middle">
        the same hash on both, by hand or assisted
      </text>
    </svg>
  );
}
