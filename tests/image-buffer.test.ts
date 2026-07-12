import { describe, expect, it } from "vitest";
import {
  detectImageType,
  isSupportedEmojiImageBuffer,
} from "../shared/core/imageBuffer.js";

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
]);
const GIF_BUFFER = Buffer.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0,
]);
const JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0,
]);
const WEBP_BUFFER = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
]);

describe("detectImageType", () => {
  it("detects PNG, GIF, JPEG, and WebP signatures", () => {
    expect(detectImageType(PNG_BUFFER)).toBe("png");
    expect(detectImageType(GIF_BUFFER)).toBe("gif");
    expect(detectImageType(JPEG_BUFFER)).toBe("jpeg");
    expect(detectImageType(WEBP_BUFFER)).toBe("webp");
  });

  it("rejects unknown or too-short buffers", () => {
    expect(detectImageType(Buffer.from([0, 1, 2]))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});

describe("isSupportedEmojiImageBuffer", () => {
  it("accepts supported formats", () => {
    expect(isSupportedEmojiImageBuffer(PNG_BUFFER)).toEqual({
      ok: true,
      animated: false,
    });
    expect(isSupportedEmojiImageBuffer(GIF_BUFFER)).toEqual({
      ok: true,
      animated: true,
    });
  });

  it("rejects non-image data", () => {
    expect(isSupportedEmojiImageBuffer(Buffer.from("not an image"))).toEqual({
      ok: false,
    });
  });
});
