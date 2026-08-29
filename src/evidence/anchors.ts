export const MAX_EXCERPT_CHARACTERS = 320;

export type CharacterRange = Readonly<{
  start: number;
  end: number;
}>;

export type LabelledValueAnchor = Readonly<{
  label: string;
  value: string;
  range: CharacterRange;
}>;

const LABEL_GRAMMAR = /^[\p{L}\p{N}][\p{L}\p{N} ()/\-]{0,79}$/u;

export function normalizeLabelledPageText(pageText: string): string {
  return pageText
    .normalize("NFC")
    .replace(/\r\n?/gu, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/gu, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

export function assertCharacterRange(
  pageText: string,
  range: CharacterRange,
  maxCharacters = MAX_EXCERPT_CHARACTERS,
): CharacterRange {
  if (!Number.isInteger(maxCharacters) || maxCharacters < 1) {
    throw new Error("Evidence excerpt limit must be a positive integer.");
  }
  if (!Number.isInteger(range.start) || !Number.isInteger(range.end)) {
    throw new Error("Evidence anchor offsets must be integers.");
  }
  if (range.start < 0 || range.end <= range.start || range.end > pageText.length) {
    throw new Error("Evidence anchor is outside the normalized page text.");
  }
  if (range.end - range.start > maxCharacters) {
    throw new Error("Evidence anchor exceeds the configured excerpt limit.");
  }
  return Object.freeze({ start: range.start, end: range.end });
}

export function findUniqueLabelledValue(
  pageText: string,
  label: string,
  maxCharacters = MAX_EXCERPT_CHARACTERS,
): LabelledValueAnchor {
  if (!LABEL_GRAMMAR.test(label)) {
    throw new Error("Evidence label does not match the closed labelled-line grammar.");
  }

  const normalizedText = normalizeLabelledPageText(pageText);
  const prefix = `${label}:`;
  const matches: LabelledValueAnchor[] = [];
  let lineStart = 0;

  for (const line of normalizedText.split("\n")) {
    if (line.startsWith(prefix)) {
      const rawValue = line.slice(prefix.length);
      const leadingWhitespace = rawValue.length - rawValue.trimStart().length;
      const value = rawValue.trim();
      if (value.length === 0) {
        throw new Error("Evidence labelled line has no value.");
      }
      const start = lineStart + prefix.length + leadingWhitespace;
      const range = assertCharacterRange(
        normalizedText,
        { start, end: start + value.length },
        maxCharacters,
      );
      matches.push(Object.freeze({ label, value, range }));
    }
    lineStart += line.length + 1;
  }

  if (matches.length !== 1) {
    throw new Error("Evidence label must occur exactly once in normalized page text.");
  }
  return matches[0]!;
}

export function sliceCharacterRange(pageText: string, range: CharacterRange): string {
  const normalizedText = normalizeLabelledPageText(pageText);
  const checkedRange = assertCharacterRange(normalizedText, range);
  return normalizedText.slice(checkedRange.start, checkedRange.end);
}
