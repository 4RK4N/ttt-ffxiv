import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@shared/core/fetchWithTimeout.js", () => ({
  fetchWithTimeout: vi.fn(),
}));

import { fetchWithTimeout } from "@shared/core/fetchWithTimeout.js";
import { fetchBuffer } from "../bot/src/lib/core/download.js";

describe("fetchBuffer", () => {
  beforeEach(() => {
    vi.mocked(fetchWithTimeout).mockReset();
  });

  it("blocks non-Discord URLs", async () => {
    const result = await fetchBuffer("https://evil.example.com/image.png", "[test]");
    expect(result).toBeNull();
    expect(fetchWithTimeout).not.toHaveBeenCalled();
  });

  it("blocks non-https URLs", async () => {
    const result = await fetchBuffer("http://cdn.discordapp.com/x.png");
    expect(result).toBeNull();
  });

  it("allows discord CDN hosts", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    } as Response);

    const result = await fetchBuffer("https://cdn.discordapp.com/avatars/1.png");
    expect(result).toEqual(Buffer.from([1, 2, 3]));
  });

  it("allows discordapp.net subdomains", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([4]).buffer,
    } as Response);

    const result = await fetchBuffer(
      "https://images-ext-1.discordapp.net/external/abc.png",
    );
    expect(result).toEqual(Buffer.from([4]));
  });

  it("returns null when fetch fails", async () => {
    vi.mocked(fetchWithTimeout).mockRejectedValue(new Error("network"));
    const result = await fetchBuffer("https://media.discordapp.net/x.png", "[test]");
    expect(result).toBeNull();
  });
});
