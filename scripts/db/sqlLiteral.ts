/** Escape a string as a single-quoted SQL literal (`''` for embedded quotes). */
export function sqlStringLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Parse one single-quoted SQL string literal starting at `start` (must be `'`).
 * Returns decoded string and index after the closing quote.
 */
export function parseSqlStringLiteral(
  input: string,
  start: number,
): { value: string; end: number } | null {
  if (input[start] !== "'") return null;

  let out = "";
  let i = start + 1;
  while (i < input.length) {
    const ch = input[i];
    if (ch === "'") {
      if (input[i + 1] === "'") {
        out += "'";
        i += 2;
        continue;
      }
      return { value: out, end: i + 1 };
    }
    out += ch;
    i++;
  }
  return null;
}
