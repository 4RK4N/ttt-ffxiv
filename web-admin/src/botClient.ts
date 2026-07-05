import type { WebConfig } from "./config.js";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 500;

export const BOT_HEALTH_ERROR =
  "Cannot reach the bot internal API. Is the Discord bot running? Panel publish and unpublish will not work until it is.";

function internalApiBase(cfg: WebConfig): string {
  return cfg.botInternalApiUrl.replace(/\/$/, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isConnectionError(message: string): boolean {
  return message.includes("fetch failed") || message.includes("ECONNREFUSED");
}

/** GET /internal/health — no auth required. */
export async function checkBotHealth(cfg: WebConfig): Promise<boolean> {
  try {
    const res = await fetch(`${internalApiBase(cfg)}/internal/health`, {
      method: "GET",
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { ok?: boolean };
    return body.ok === true;
  } catch {
    return false;
  }
}

async function postInternal(cfg: WebConfig, path: string): Promise<void> {
  const url = `${internalApiBase(cfg)}${path}`;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "X-Internal-Token": cfg.internalApiSecret,
        },
      });

      if (res.ok) return;

      let message = `Bot internal API returned HTTP ${res.status}.`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    } catch (err) {
      lastError =
        err instanceof Error ? err : new Error("Bot internal API request failed.");
      if (!isConnectionError(lastError.message) || attempt >= MAX_ATTEMPTS - 1) {
        throw lastError;
      }
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError ?? new Error("Could not reach bot internal API.");
}

export async function publishPanel(
  cfg: WebConfig,
  namespace: string,
  itemId: string,
): Promise<void> {
  await postInternal(
    cfg,
    `/internal/publish/${encodeURIComponent(namespace)}/${encodeURIComponent(itemId)}`,
  );
}

export async function unpublishPanel(
  cfg: WebConfig,
  namespace: string,
  itemId: string,
): Promise<void> {
  await postInternal(
    cfg,
    `/internal/unpublish/${encodeURIComponent(namespace)}/${encodeURIComponent(itemId)}`,
  );
}

/** Prefer bot health message when publish/unpublish fails and the bot is unreachable. */
export function resolveBotActionError(
  ctx: { botHealthError: string | null },
  err: unknown,
  fallback: string,
): string {
  if (ctx.botHealthError) return ctx.botHealthError;
  return err instanceof Error ? err.message : fallback;
}
