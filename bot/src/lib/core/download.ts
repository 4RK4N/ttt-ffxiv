import { fetchWithTimeout } from "../../../../shared/core/fetchWithTimeout.js";

/** Downloads a URL to a Buffer, or null on failure. */
export async function fetchBuffer(
  url: string,
  logPrefix?: string,
): Promise<Buffer | null> {
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
