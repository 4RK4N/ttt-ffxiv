export const URL_REGEX = /https?:\/\/[^\s<>]+/gi;
const DISCORD_MEDIA_PATH = /^\/attachments\/\d+\/\d+\/[^/]+\.(?:avif|bmp|gif|jpe?g|png|webp|m4v|mov|mp4|webm)$/i;
export function stripUrls(content) {
    return content.replace(URL_REGEX, " ").replace(/\s+/g, " ").trim();
}
function normalizeHost(host) {
    return host.replace(/^www\./i, "").toLowerCase();
}
export function isSupportedAutoThreadUrl(raw) {
    let url;
    try {
        url = new URL(raw);
    }
    catch {
        return false;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:")
        return false;
    const host = normalizeHost(url.hostname);
    const path = url.pathname.replace(/[).,]+$/, "");
    if (["x.com", "twitter.com", "mobile.twitter.com"].includes(host)) {
        return /\/status(?:es)?\/\d+/.test(path);
    }
    if (host === "bsky.app") {
        return /^\/profile\/[^/]+\/post\/[^/]+/.test(path);
    }
    if (host === "aethy.com") {
        return (/^\/@[^/]+\/\d+/.test(path) || /^\/users\/[^/]+\/statuses\/\d+/.test(path));
    }
    if (host === "instagram.com") {
        return /^\/(?:p|reel|reels)\/[A-Za-z0-9_-]+\/?$/.test(path);
    }
    if (host === "cdn.discordapp.com" || host === "media.discordapp.net") {
        return DISCORD_MEDIA_PATH.test(path);
    }
    return false;
}
export function extractSupportedAutoThreadUrls(text) {
    const matches = text.match(URL_REGEX) ?? [];
    return matches.filter(isSupportedAutoThreadUrl);
}
//# sourceMappingURL=urls.js.map