import { describe, expect, it } from "vitest";
import { publishClientError } from "../bot/src/internal-api/server.js";

describe("publishClientError", () => {
  it("returns generic messages without internal detail", () => {
    expect(publishClientError(true)).toBe("Publish failed.");
    expect(publishClientError(false)).toBe("Unpublish failed.");
    expect(publishClientError(true)).not.toContain("HTTP");
    expect(publishClientError(true)).not.toContain("Discord");
  });
});
