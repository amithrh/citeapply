/**
 * The hero illustration: the demonstration's own sequence, drawn.
 *
 * An application sheet fills in beside a ledger of the tool calls that filled
 * it. Three answers arrive, each standing on a teal citation rule and tethered
 * down to the record it was read from. Then the income row: two accepted
 * records disagree, the tethers reach for both and neither arrives, the write
 * comes back `conflict_requires_human`, and the row is stamped **You decide**.
 *
 * It is inline SVG animated with CSS keyframes, because the content security
 * policy is `default-src 'self'` and there is nothing here worth an exception.
 *
 * Two properties matter more than the motion:
 *
 * 1. **The unanimated state is the finished state.** Every element's resting
 *    style is the end of the sequence; the keyframes only take things away and
 *    give them back. So `animation: none` — which is what
 *    `prefers-reduced-motion: reduce` produces — shows the whole diagram at
 *    once rather than an empty frame.
 * 2. **Every element shares one 18s linear timeline**, with no delays and no
 *    randomness, so the composition is identical on every frame of every loop
 *    and a screenshot at a given moment is reproducible.
 *
 * It is an illustration of a sequence this product really performs, and the
 * caption beneath it says so. It is not a live session and does not pretend to
 * be one.
 */

const SHEET_ROWS = [
  { y: 94, label: 44, answer: 122, beat: "a" },
  { y: 128, label: 58, answer: 92, beat: "b" },
  { y: 162, label: 50, answer: 136, beat: "c" },
] as const;

/**
 * The three calls are the real registered tool names, split across two lines
 * because they are long and the panel is narrow — never abbreviated, because a
 * shortened tool name is a wrong tool name.
 */
const LEDGER_LINES = [
  { head: "get_form_requirements", tail: "rules, not answers", beat: "a" },
  { head: "get_evidence_index", tail: "claims, as handles", beat: "b" },
  {
    head: "apply_evidence_backed",
    tail: "_answers · one atomic call",
    beat: "c",
  },
] as const;

function RecordCard({
  x,
  y,
  label,
  tone,
}: Readonly<{
  x: number;
  y: number;
  label: string;
  tone: "cited" | "disputed";
}>) {
  const cited = tone === "cited";
  const edge = cited ? "#0f6e6b" : "#8c4b05";
  const rule = cited ? "#d3dde2" : "#e7cfa8";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="122"
        height="98"
        rx="6"
        fill={cited ? "#ffffff" : "#fdf2e3"}
        stroke={edge}
      />
      <rect x={x} y={y} width="122" height="5" rx="2.5" fill={edge} />
      <text className="hs-label" x={x + 14} y={y + 30} fill={edge}>
        {label}
      </text>
      {[0, 13, 26].map((offset) => (
        <rect
          key={offset}
          x={x + 14}
          y={y + 46 + offset}
          width={offset === 26 ? 44 : 88}
          height="6"
          rx="3"
          fill={rule}
        />
      ))}
    </g>
  );
}

export function HeroScene() {
  return (
    <figure className="hero-scene">
      <svg
        viewBox="0 0 560 428"
        role="img"
        aria-label="An illustration of the demonstration. An application sheet fills in one answer at a time beside a ledger of the tool calls doing it: get_form_requirements, get_evidence_index, then apply_evidence_backed_answers. Each answer stands on a teal citation rule tethered down to the enrollment or household record it was read from. The last row is the income question, where two accepted records disagree: both tethers are broken, the write is refused with conflict_requires_human, and the row is stamped You decide in ochre."
        focusable="false"
      >
        {/* ---- The application sheet ---------------------------------- */}
        <rect
          x="26"
          y="8"
          width="306"
          height="282"
          rx="9"
          fill="#ffffff"
          stroke="#cfdbe1"
        />
        <path
          d="M26 17 a9 9 0 0 1 9-9 h288 a9 9 0 0 1 9 9 v25 h-306 z"
          fill="#0a2f33"
        />
        <rect x="42" y="21" width="84" height="8" rx="4" fill="#5f9f9c" />
        <circle cx="314" cy="25" r="3.5" fill="#7fd4cc" />
        <circle cx="302" cy="25" r="3.5" fill="#1d4d51" />

        {/* Answers, each standing on a citation rule */}
        {SHEET_ROWS.map((row) => (
          <g key={row.y}>
            <rect
              x="44"
              y={row.y - 9}
              width="98"
              height="6"
              rx="3"
              fill="#b7c4cd"
            />
            <g className={`hs-beat hs-beat-${row.beat}`}>
              <rect
                x="44"
                y={row.y + 2}
                width="3"
                height="17"
                rx="1.5"
                fill="#0f6e6b"
              />
              <rect
                x="56"
                y={row.y + 3}
                width={row.answer}
                height="10"
                rx="5"
                fill="#12212e"
              />
              <rect
                x={62 + row.answer}
                y={row.y + 5}
                width={row.label}
                height="6"
                rx="3"
                fill="#9fcdc9"
              />
            </g>
          </g>
        ))}

        {/* The row no record can settle */}
        <rect x="44" y="196" width="74" height="6" rx="3" fill="#b7c4cd" />
        <g className="hs-beat hs-beat-d">
          <rect x="44" y="210" width="3" height="54" rx="1.5" fill="#8c4b05" />
          <rect
            x="56"
            y="210"
            width="256"
            height="54"
            rx="6"
            fill="#fdf2e3"
            stroke="#8c4b05"
            strokeDasharray="6 5"
          />
        </g>
        <g className="hs-beat hs-beat-f">
          <text className="hs-stamp" x="72" y="234" fill="#8c4b05">
            You decide
          </text>
          <text className="hs-note" x="72" y="252" fill="#7a4a12">
            Two accepted records disagree
          </text>
        </g>

        {/* Tethers: an answer and its record are one object */}
        <g fill="none" stroke="#0f6e6b" strokeWidth="2" strokeLinecap="round">
          <path
            className="hs-draw hs-draw-a"
            pathLength="1"
            d="M45 105 C 10 118, 8 286, 88 318"
          />
          <path
            className="hs-draw hs-draw-b"
            pathLength="1"
            d="M45 139 C 18 154, 16 292, 214 318"
          />
          <path
            className="hs-draw hs-draw-c"
            pathLength="1"
            d="M45 173 C 26 190, 24 300, 200 322"
          />
        </g>

        {/* Two tethers that reach for a record and arrive at neither */}
        <g
          fill="none"
          stroke="#8c4b05"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="5 6"
        >
          <path
            className="hs-reach hs-reach-a"
            d="M228 266 C 248 288, 300 292, 352 306"
          />
          <path
            className="hs-reach hs-reach-b"
            d="M292 266 C 344 296, 432 298, 484 306"
          />
        </g>

        {/* ---- The ledger of what the assistant asked for -------------- */}
        <rect
          x="348"
          y="8"
          width="204"
          height="282"
          rx="9"
          fill="#062229"
          stroke="#17565a"
        />
        <text className="hs-ledger-title" x="366" y="34" fill="#7fd4cc">
          document.modelContext
        </text>
        <rect x="366" y="44" width="168" height="1" fill="#17565a" />

        {LEDGER_LINES.map((line, index) => (
          <g
            key={line.head}
            className={`hs-beat hs-beat-${line.beat}`}
            transform={`translate(0 ${index * 34})`}
          >
            <rect
              x="366"
              y="60"
              width="3"
              height="24"
              rx="1.5"
              fill="#3f9b93"
            />
            <text className="hs-mono" x="377" y="70" fill="#d4ece8">
              {line.head}
            </text>
            <text className="hs-mono" x="377" y="82" fill="#79b3ad">
              {line.tail}
            </text>
          </g>
        ))}

        {/* The refusal: the product working, not failing */}
        <g className="hs-beat hs-beat-e">
          <rect
            x="366"
            y="170"
            width="168"
            height="96"
            rx="6"
            fill="#2c1704"
            stroke="#a75f10"
          />
          <rect x="366" y="170" width="168" height="3" rx="1.5" fill="#e8a94e" />
          <text className="hs-chip" x="378" y="196" fill="#f0b866">
            conflict_requires_human
          </text>
          <text className="hs-mono" x="378" y="216" fill="#d0b48c">
            nothing was written
          </text>
          <text className="hs-mono" x="378" y="234" fill="#d0b48c">
            the saved application did
          </text>
          <text className="hs-mono" x="378" y="248" fill="#d0b48c">
            not move
          </text>
        </g>

        {/* ---- The records themselves --------------------------------- */}
        <RecordCard x={26} y={318} label="Enrollment" tone="cited" />
        <RecordCard x={158} y={318} label="Household" tone="cited" />
        <RecordCard x={298} y={318} label="Income A" tone="disputed" />
        <RecordCard x={430} y={318} label="Income B" tone="disputed" />
      </svg>
      <figcaption>
        An illustration of the sequence this demonstration performs. It is a
        drawing, not a live session.
      </figcaption>
    </figure>
  );
}
