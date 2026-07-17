export const URL_REGEX = /https?:\/\/[^\s<>]+/gi;

const DISCORD_MEDIA_PATH =
  /^\/attachments\/\d+\/\d+\/[^/]+\.(?:avif|bmp|gif|jpe?g|png|webp|m4v|mov|mp4|webm)$/i;

/** Native X/Twitter hosts plus common Discord embed fixers (FxEmbed, BetterTwitFix). */
const TWITTER_STATUS_HOSTS = [
  "x.com",
  "twitter.com",
  "mobile.twitter.com",
  "fxtwitter.com",
  "fixupx.com",
  "twittpr.com",
  "xfixup.com",
  "vxtwitter.com",
  "fixvx.com",
] as const;

export function stripUrls(content: string): string {
  return content.replace(URL_REGEX, " ").replace(/\s+/g, " ").trim();
}

function normalizeHost(host: string): string {
  return host.replace(/^www\./i, "").toLowerCase();
}

function isTwitterStatusHost(host: string): boolean {
  return TWITTER_STATUS_HOSTS.some(
    (apex) => host === apex || host.endsWith(`.${apex}`),
  );
}

export function isSupportedAutoThreadUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = normalizeHost(url.hostname);
  const path = url.pathname.replace(/[).,]+$/, "");

  if (isTwitterStatusHost(host)) {
    return /\/status(?:es)?\/\d+/.test(path);
  }

  if (host === "bsky.app") {
    return /^\/profile\/[^/]+\/post\/[^/]+/.test(path);
  }

  if (host === "aethy.com") {
    return (
      /^\/@[^/]+\/\d+/.test(path) || /^\/users\/[^/]+\/statuses\/\d+/.test(path)
    );
  }

  if (host === "instagram.com") {
    return /^\/(?:p|reel|reels)\/[A-Za-z0-9_-]+\/?$/.test(path);
  }

  if (host === "cdn.discordapp.com" || host === "media.discordapp.net") {
    return DISCORD_MEDIA_PATH.test(path);
  }

  return false;
}

export function extractSupportedAutoThreadUrls(text: string): string[] {
  const matches = text.match(URL_REGEX) ?? [];
  return matches.filter(isSupportedAutoThreadUrl);
}
