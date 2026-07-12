const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

/** Outbound fetch with an AbortSignal timeout (default 30s). */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
}
