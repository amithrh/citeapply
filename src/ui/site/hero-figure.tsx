/**
 * The hero illustration: the product's own artifact, drawn rather than
 * described. An application sheet whose answers each stand on a teal citation
 * rule, two of them tethered down to the record they were read from — and, at
 * the foot of the sheet, one row that no record can settle: blank, stamped in
 * judgment ochre, with a broken tether to the two income statements that
 * disagree.
 *
 * It is inline SVG because the content security policy is `default-src 'self'`
 * and because the tether is the argument: an answer and its source are one
 * object, and the unanswerable row is visibly a different kind of thing.
 */

const ANSWERED = [
  { y: 66, width: 138 },
  { y: 96, width: 104 },
  { y: 126, width: 152 },
  { y: 156, width: 92 },
];

function Record({
  x,
  y,
  label,
  tone,
}: Readonly<{ x: number; y: number; label: string; tone: "seal" | "decide" }>) {
  const stroke = tone === "seal" ? "#0f6e6b" : "#8c4b05";
  const fill = tone === "seal" ? "#ffffff" : "#fdf2e3";
  const rule = tone === "seal" ? "#d3dde2" : "#e7cfa8";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="112"
        height="104"
        rx="4"
        fill={fill}
        stroke={stroke}
      />
      <rect x={x} y={y} width="112" height="5" fill={stroke} />
      <text className="figure-label" x={x + 14} y={y + 30} fill={stroke}>
        {label}
      </text>
      {[0, 13, 26].map((offset) => (
        <rect
          key={offset}
          x={x + 14}
          y={y + 48 + offset}
          width={offset === 26 ? 46 : 82}
          height="6"
          rx="3"
          fill={rule}
        />
      ))}
    </g>
  );
}

export function HeroFigure() {
  return (
    <svg
      className="hero-figure"
      viewBox="0 0 476 424"
      role="img"
      aria-label="An application sheet. Its answers stand on teal citation rules, two of them joined by lines to the enrollment and household records below. The last row is blank and stamped You decide, with a broken line running to two income statements that disagree."
      focusable="false"
    >
      {/* The sheet */}
      <rect
        x="18"
        y="8"
        width="304"
        height="238"
        rx="4"
        fill="#ffffff"
        stroke="#d7e0e6"
      />
      <path
        d="M18 12 a4 4 0 0 1 4-4 h296 a4 4 0 0 1 4 4 v26 h-304 z"
        fill="#0a2f33"
      />
      <rect x="34" y="19" width="96" height="8" rx="4" fill="#7fb3b1" />

      {/* Answers, each standing on a citation rule */}
      {ANSWERED.map((row) => (
        <g key={row.y}>
          <rect x="34" y={row.y - 7} width="3" height="25" fill="#0f6e6b" />
          <rect
            x="46"
            y={row.y - 7}
            width="58"
            height="6"
            rx="3"
            fill="#a6b5c0"
          />
          <rect
            x="46"
            y={row.y + 5}
            width={row.width}
            height="9"
            rx="4.5"
            fill="#12212e"
          />
        </g>
      ))}

      {/* The row no record can settle */}
      <rect x="34" y="190" width="3" height="42" fill="#8c4b05" />
      <rect x="46" y="190" width="66" height="6" rx="3" fill="#a6b5c0" />
      <rect
        x="46"
        y="203"
        width="196"
        height="29"
        rx="3"
        fill="#fdf2e3"
        stroke="#8c4b05"
        strokeDasharray="5 4"
      />
      <text className="figure-stamp" x="58" y="222" fill="#8c4b05">
        You decide
      </text>

      {/* Two tethers, drawn from the citation rule down to the record itself */}
      <g fill="none" stroke="#0f6e6b" strokeWidth="1.75">
        <path d="M35 79 C 6 79, 6 300, 62 300" />
        <path d="M35 139 C 16 139, 16 316, 180 316" />
      </g>

      {/* A tether that does not reach: two records, neither decisive */}
      <g
        fill="none"
        stroke="#8c4b05"
        strokeWidth="1.75"
        strokeDasharray="4 5"
      >
        <path d="M244 218 C 300 218, 300 250, 344 268" />
        <path d="M244 218 C 316 218, 340 276, 380 300" />
      </g>

      <Record x={18} y={300} label="Enrollment" tone="seal" />
      <Record x={150} y={316} label="Household" tone="seal" />
      <Record x={288} y={268} label="Income" tone="decide" />
      <Record x={336} y={300} label="Income" tone="decide" />
    </svg>
  );
}
