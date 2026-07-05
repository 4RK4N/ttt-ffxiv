import { createPanelPublisher } from "../../core/panelPublisher.js";
import {
  getEmbedPanelConfig,
  resolveEmbedPanel,
  updateEmbedPanel,
} from "./config-io.js";
import { publishPanel, type DiscordApiContext } from "./panel.js";

const panelPublisher = createPanelPublisher({
  resolve: resolveEmbedPanel,
  getConfig: getEmbedPanelConfig,
  update: updateEmbedPanel,
  publishPanel,
  entityLabel: "embed panel",
});

export async function publishEmbedPanel(
  ctx: DiscordApiContext,
  panelId: string,
): Promise<void> {
  return panelPublisher.publish(ctx, panelId);
}

export async function unpublishEmbedPanel(panelId: string): Promise<void> {
  return panelPublisher.unpublish(panelId);
}
