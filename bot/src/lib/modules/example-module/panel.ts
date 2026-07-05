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

export type { DiscordApiContext };

export const EXAMPLE_BTN_PREFIX = "example-module:btn:";

// import { resolveExamplePanel } from './config-io.js';

export function buildPanelPayload(_panelId: string): DiscordMessagePayload {
  /*
  const panel = resolveExamplePanel(_panelId);
  if (!panel) throw new Error(`Unknown example panel "${_panelId}".`);

  return {
    content: panel.panelDescription,
    // embeds: [buildEmbed({ title: panel.panelTitle, description: panel.panelDescription })],
  };
  */
  throw new Error(
    "Example panel stub — enable panel types and implement buildPanelPayload (see panel-types.ts).",
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
