import type { Client } from "discord.js";

/**
 * Publish-only module — embed panels are configured in web-admin and posted via
 * `bot/src/lib/modules/custom-embeds/publisher.ts`. No slash commands, events,
 * or component handlers.
 */
export function initPublishOnly(_client: Client): void {
  void _client;
}
