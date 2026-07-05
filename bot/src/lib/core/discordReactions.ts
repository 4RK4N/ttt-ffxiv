import { discordBotFetch } from "../../../../shared/core/discordApi.js";
import { encodeEmojiForReaction } from "../../../../shared/core/discordEmoji.js";

const MAX_ATTEMPTS = 5;
const DEFAULT_DELAY_MS = 350;
/** Pause after message create/edit — shares rate-limit bucket with reaction routes. */
const POST_MESSAGE_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseRetryAfterMs(res: Response): Promise<number> {
  try {
    const body = (await res.json()) as { retry_after?: number };
    if (typeof body.retry_after === "number" && body.retry_after > 0) {
      return Math.ceil(body.retry_after * 1000) + 50;
    }
  } catch {
    // ignore
  }
  const header = res.headers.get("Retry-After");
  if (header) {
    const seconds = Number(header);
    if (!Number.isNaN(seconds) && seconds > 0)
      return Math.ceil(seconds * 1000) + 50;
  }
  return 1000;
}

/** Adds a single bot reaction to a message; retries on HTTP 429. */
export async function addBotMessageReaction(
  botToken: string,
  channelId: string,
  messageId: string,
  emoji: string,
): Promise<void> {
  const encoded = encodeEmojiForReaction(emoji);
  if (!encoded)
    throw new Error(`Invalid emoji "${emoji.trim() || "(empty)"}".`);

  const path = `/channels/${channelId}/messages/${messageId}/reactions/${encoded}/@me`;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const res = await discordBotFetch(botToken, path, { method: "PUT" });
    if (res.ok || res.status === 204) return;

    if (res.status === 429 && attempt < MAX_ATTEMPTS - 1) {
      await sleep(await parseRetryAfterMs(res));
      continue;
    }

    const detail = await res.text().catch(() => "");
    throw new Error(
      `Failed to add reaction "${emoji.trim()}" (HTTP ${res.status})${detail ? `: ${detail}` : ""}.`,
    );
  }
}

/**
 * Adds bot reactions one at a time with spacing to avoid Discord rate limits.
 * Waits briefly before the first reaction when syncing after a message edit/create.
 */
export async function syncBotMessageReactions(
  botToken: string,
  channelId: string,
  messageId: string,
  emojis: string[],
  options?: { delayMs?: number; afterMessageEdit?: boolean },
): Promise<void> {
  const trimmed = emojis.map((e) => e.trim()).filter(Boolean);
  if (!trimmed.length) return;

  const delayMs = options?.delayMs ?? DEFAULT_DELAY_MS;
  if (options?.afterMessageEdit !== false) {
    await sleep(POST_MESSAGE_DELAY_MS);
  }

  for (let i = 0; i < trimmed.length; i++) {
    if (i > 0) await sleep(delayMs);
    await addBotMessageReaction(botToken, channelId, messageId, trimmed[i]);
  }
}
