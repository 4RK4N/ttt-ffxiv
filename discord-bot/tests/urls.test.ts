import { describe, expect, it } from "vitest";
import {
  extractSupportedAutoThreadUrls,
  isSupportedAutoThreadUrl,
  stripUrls,
} from "../bot/src/modules/links-pics-vids-autothread/urls.js";

describe("isSupportedAutoThreadUrl", () => {
  it("accepts x.com status links", () => {
    expect(
      isSupportedAutoThreadUrl("https://x.com/user/status/1234567890"),
    ).toBe(true);
  });

  it.each([
    "https://fxtwitter.com/user/status/1234567890",
    "https://fixupx.com/user/status/1234567890",
    "https://twittpr.com/user/status/1234567890",
    "https://xfixup.com/user/status/1234567890",
    "https://vxtwitter.com/user/status/1234567890",
    "https://fixvx.com/user/status/1234567890",
    "https://g.fxtwitter.com/user/status/1234567890",
  ])("accepts Twitter embed-fixer status links: %s", (url) => {
    expect(isSupportedAutoThreadUrl(url)).toBe(true);
  });

  it.each(["https://fxtwitter.com/user", "https://vxtwitter.com/home"])(
    "rejects non-status Twitter embed-fixer links: %s",
    (url) => {
      expect(isSupportedAutoThreadUrl(url)).toBe(false);
    },
  );

  it("accepts bsky.app post links", () => {
    expect(
      isSupportedAutoThreadUrl(
        "https://bsky.app/profile/user.bsky.social/post/abc",
      ),
    ).toBe(true);
  });

  it("accepts Aethy post links", () => {
    expect(isSupportedAutoThreadUrl("https://aethy.com/@user/1234567890")).toBe(
      true,
    );
  });

  it.each([
    "https://baraag.net/@user/1234567890",
    "https://baraag.net/users/user/statuses/1234567890",
  ])("accepts Baraag post links: %s", (url) => {
    expect(isSupportedAutoThreadUrl(url)).toBe(true);
  });

  it("rejects Baraag profile-only links", () => {
    expect(isSupportedAutoThreadUrl("https://baraag.net/@user")).toBe(false);
  });

  it.each([
    "https://www.instagram.com/p/ABC_123/",
    "https://instagram.com/reel/ABC-123/?igsh=example",
    "https://instagram.com/reels/ABC123/).",
  ])("accepts Instagram post and reel links: %s", (url) => {
    expect(isSupportedAutoThreadUrl(url)).toBe(true);
  });

  it.each([
    "https://instagram.com/tinytemptationtubs/",
    "https://instagram.com/stories/tinytemptationtubs/123/",
    "https://instagram.com/explore/",
  ])("rejects non-post Instagram links: %s", (url) => {
    expect(isSupportedAutoThreadUrl(url)).toBe(false);
  });

  it.each([
    "https://cdn.discordapp.com/attachments/123/456/photo.png",
    "https://media.discordapp.net/attachments/123/456/video.mp4?ex=abc",
  ])("accepts direct Discord image and video links: %s", (url) => {
    expect(isSupportedAutoThreadUrl(url)).toBe(true);
  });

  it.each([
    "https://discord.com/channels/123/456/789",
    "https://cdn.discordapp.com/attachments/123/456/document.pdf",
    "https://cdn.discordapp.com/not-an-attachment/photo.png",
  ])("rejects other Discord links: %s", (url) => {
    expect(isSupportedAutoThreadUrl(url)).toBe(false);
  });

  it("rejects unrelated hosts", () => {
    expect(isSupportedAutoThreadUrl("https://example.com/foo")).toBe(false);
  });

  it("rejects unsupported URL protocols", () => {
    expect(isSupportedAutoThreadUrl("ftp://instagram.com/p/ABC123/")).toBe(
      false,
    );
  });
});

describe("extractSupportedAutoThreadUrls", () => {
  it("extracts only supported post URLs from mixed text", () => {
    const urls = extractSupportedAutoThreadUrls(
      "See https://instagram.com/p/abc/ and https://example.com/foo",
    );
    expect(urls).toEqual(["https://instagram.com/p/abc/"]);
  });
});

describe("stripUrls", () => {
  it("removes http URLs from text", () => {
    expect(stripUrls("Check https://x.com/user/status/1 now")).toBe(
      "Check now",
    );
  });

  it("collapses whitespace after stripping", () => {
    expect(stripUrls("  hello   https://example.com   world  ")).toBe(
      "hello world",
    );
  });
});
