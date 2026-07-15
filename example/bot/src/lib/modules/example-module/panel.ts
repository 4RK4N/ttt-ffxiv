/**
 * Panel Discord payload — panel modules only (delete for simple modules).
 *
 * Match the signature used by tickets/custom-embeds. Uncomment resolve import when
 * panel types are in shared/modules/<name>/types.ts and config-io.ts is wired.
 */
import {
  publishDiscordMessage,
  type DiscordApiContext,
  type DiscordMessagePayload,
} from "../../core/panelPublish.js";
// import { applyEmojiToButton } from "../../core/buttonEmoji.js"; // use for panel buttons

export type { DiscordApiContext };

export const EXAMPLE_BTN_PREFIX = "example-module:btn:";

// import { resolveExamplePanel } from './config-io.js';

export function buildPanelPayload(panelId: string): DiscordMessagePayload {
  /*
  const panel = resolveExamplePanel(panelId);
  if (!panel) throw new Error(`Unknown example panel "${panelId}".`);

  return {
    content: panel.panelDescription,
    // embeds: [buildEmbed({ title: panel.panelTitle, description: panel.panelDescription })],
  };
  */
  throw new Error(
    `Example panel stub for "${panelId}" — enable panel types and implement buildPanelPayload (see shared/modules/<name>/types.ts).`,
  );
}

export async function publishPanel(
  ctx: DiscordApiContext,
  panelId: string,
  channelId: string,
  existingMessageId?: string,
): Promise<string> {
  const payload = buildPanelPayload(panelId);
  return publishDiscordMessage(ctx, channelId, payload, existingMessageId);
}
