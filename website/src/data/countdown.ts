const COUNTDOWN_UNITS_MS = [86_400_000, 3_600_000, 60_000, 1000] as const;

/** Splits remaining milliseconds into zero-padded day/hour/minute/second strings. */
export function splitRemainingMs(remainingMs: number): string[] {
  let remaining = Math.max(0, remainingMs);
  return COUNTDOWN_UNITS_MS.map((unit) => {
    const value = Math.floor(remaining / unit);
    remaining -= value * unit;
    return String(value).padStart(2, '0');
  });
}
