import { describe, expect, it, vi, beforeEach } from "vitest";

const encode = vi.fn(() => Buffer.from("png-bytes"));
const getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  closePath: vi.fn(),
  clip: vi.fn(),
  lineWidth: 0,
  strokeStyle: "",
  stroke: vi.fn(),
  fillStyle: "",
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  font: "",
  textAlign: "center",
  textBaseline: "middle",
  shadowColor: "",
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
}));

vi.mock("@napi-rs/canvas", () => ({
  createCanvas: vi.fn(() => ({
    width: 800,
    height: 400,
    getContext,
    encode,
  })),
  GlobalFonts: { has: () => true, registerFromPath: vi.fn() },
  loadImage: vi.fn(async (src: string | Buffer) => ({
    width: typeof src === "string" ? 800 : 128,
    height: typeof src === "string" ? 400 : 128,
  })),
}));

vi.mock("@shared/core/texts.js", () => ({
  moduleDataPath: (...parts: string[]) => parts.join("/"),
}));

vi.mock("../bot/src/lib/core/download.js", () => ({
  fetchBuffer: vi.fn(async () => Buffer.from("avatar")),
}));

import { renderWelcomeCard } from "../bot/src/modules/welcome-message/card.js";

describe("renderWelcomeCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a PNG buffer from avatar and display name", async () => {
    const buffer = await renderWelcomeCard({
      avatarUrl: "https://cdn.discordapp.com/avatars/1.png",
      displayName: "Alice",
    });
    expect(buffer).toEqual(Buffer.from("png-bytes"));
    expect(encode).toHaveBeenCalledWith("png");
  });

  it("throws when avatar download fails", async () => {
    const { fetchBuffer } = await import("../bot/src/lib/core/download.js");
    vi.mocked(fetchBuffer).mockResolvedValueOnce(null);

    await expect(
      renderWelcomeCard({
        avatarUrl: "https://cdn.discordapp.com/avatars/1.png",
        displayName: "Alice",
      }),
    ).rejects.toThrow("Failed to fetch avatar.");
  });
});
