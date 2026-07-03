/**
 * Panel publish stub (panel modules only — delete for simple modules).
 *
 * Publish flow:
 * 1. Web editor saves panel row to config.json + texts.json
 * 2. Admin clicks Publish in web UI → publishHandlers.ts → your publish fn
 * 3. publishPanel posts/edits Discord message
 * 4. updateExamplePanel (config-io.ts) patches published + panelMessageId + channelId
 *
 * Register publish/unpublish in src/web/publishHandlers.ts.
 */
import { publishDiscordMessage, type DiscordApiContext } from '../../core/panelPublish.js';

/** Uncomment when panel types are enabled in types.ts: */
// import type { ResolvedExamplePanel } from './types.js';

type ResolvedExamplePanel = {
  id: string;
  channelId: string;
  panelTitle: string;
  panelDescription: string;
};

export type { DiscordApiContext };

/** Prefix for button customIds routed in index.ts componentRoutes. */
export const EXAMPLE_BTN_PREFIX = 'example-module:btn:';

export function buildPanelPayload(panel: ResolvedExamplePanel) {
  return {
    content: panel.panelDescription,
    // embeds: [buildEmbed({ title: panel.panelTitle, description: panel.panelDescription })],
  };
}

export async function publishPanel(ctx: DiscordApiContext, panel: ResolvedExamplePanel) {
  return publishDiscordMessage(ctx, panel.channelId, buildPanelPayload(panel));
}
