const DEFAULT_FETCH_TIMEOUT_MS = 30_000;
/** Outbound fetch with an AbortSignal timeout (default 30s). */
export async function fetchWithTimeout(url, init, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS) {
    return fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
    });
}
//# sourceMappingURL=fetchWithTimeout.js.map