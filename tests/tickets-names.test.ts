import { describe, expect, it } from "vitest";
import {
  buildClosedThreadName,
  buildTicketThreadName,
  formatTicketTimestamp,
  isClosedTicketThread,
} from "../bot/src/modules/tickets/names.js";

describe("ticket thread names", () => {
  const date = new Date(2026, 6, 12, 15, 30);

  it("formats timestamps as YYYY.MM.DD HH:mm", () => {
    expect(formatTicketTimestamp(date)).toBe("2026.07.12 15:30");
  });

  it("builds open thread names with display name and timestamp", () => {
    const name = buildTicketThreadName("Alice", date);
    expect(name).toContain("Alice");
    expect(name).toContain("2026.07.12 15:30");
    expect(name.length).toBeLessThanOrEqual(100);
  });

  it("truncates long display names", () => {
    const longName = "x".repeat(120);
    const name = buildTicketThreadName(longName, date);
    expect(name.length).toBeLessThanOrEqual(100);
    expect(name.endsWith("2026.07.12 15:30")).toBe(true);
  });

  it("prefixes closed thread names", () => {
    expect(buildClosedThreadName("Alice - 2026.07.12 15:30")).toBe(
      "[CLOSED] Alice - 2026.07.12 15:30",
    );
  });

  it("detects closed locked threads", () => {
    expect(isClosedTicketThread("[CLOSED] Alice", true)).toBe(true);
    expect(isClosedTicketThread("[CLOSED] Alice", false)).toBe(false);
    expect(isClosedTicketThread("Alice", true)).toBe(false);
  });
});
