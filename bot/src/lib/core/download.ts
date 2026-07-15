import { fetchWithTimeout } from "@shared/core/fetchWithTimeout.js";

const ALLOWED_FETCH_HOSTS = new Set([
  "cdn.discordapp.com",
  "media.discordapp.net",
]);

function isAllowedFetchUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (ALLOWED_FETCH_HOSTS.has(parsed.hostname)) return true;
    return (
      parsed.hostname.endsWith(".discordapp.com") ||
      parsed.hostname.endsWith(".discordapp.net")
    );
  } catch {
    return false;
  }
}

/** Downloads an allowlisted URL to a Buffer, or null on failure. */
export async function fetchBuffer(
  url: string,
  logPrefix?: string,
): Promise<Buffer | null> {
  if (!isAllowedFetchUrl(url)) {
    if (logPrefix) {
      console.error(`${logPrefix} Blocked download from disallowed URL.`);
    }
    return null;
  }

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    if (logPrefix) {
      console.error(`${logPrefix} Failed to download:`, err);
    }
    return null;
  }
}
