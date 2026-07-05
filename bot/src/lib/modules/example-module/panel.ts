/**
 * Panel publish stub (panel modules only — delete for simple modules).
 *
 * When enabling panel types in types.ts + config-io.ts, import resolveExamplePanel
 * from config-io and match the signature used by real modules (tickets/panel.ts).
 */
import {
  publishDiscordMessage,
  type DiscordApiContext,
} from "../../core/panelPublish.js";

type ResolvedExamplePanel = {
  id: string;
  channelId: string;
  panelTitle: string;
  panelDescription: string;
};

export type { DiscordApiContext };

export const EXAMPLE_BTN_PREFIX = "example-module:btn:";

export function buildPanelPayload(panel: ResolvedExamplePanel) {
  return {
    content: panel.panelDescription,
    // embeds: [buildEmbed({ title: panel.panelTitle, description: panel.panelDescription })],
  };
}

export async function publishPanel(
  ctx: DiscordApiContext,
  panel: ResolvedExamplePanel,
) {
  return publishDiscordMessage(ctx, panel.channelId, buildPanelPayload(panel));
}

// createPanelPublisher expects: publishPanel(ctx, resolvedPanel) — pass the merged
// resolve*() result. Register publish/unpublish in bot/src/internal-api/publishRegistry.ts.
