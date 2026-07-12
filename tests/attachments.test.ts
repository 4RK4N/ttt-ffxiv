import { describe, expect, it } from "vitest";
import { isImageAttachment } from "../shared/core/attachments.js";

describe("isImageAttachment", () => {
  it("accepts image content types", () => {
    expect(isImageAttachment("image/png")).toBe(true);
    expect(isImageAttachment("image/gif")).toBe(true);
  });

  it("rejects non-images and missing types", () => {
    expect(isImageAttachment("application/pdf")).toBe(false);
    expect(isImageAttachment(null)).toBe(false);
    expect(isImageAttachment(undefined)).toBe(false);
  });
});
