import { createPanelPublisher } from "../../core/panelPublisher.js";
import {
  getTicketTypeConfig,
  resolveTicketType,
  updateTicketType,
} from "./config-io.js";
import { publishPanel, type DiscordApiContext } from "./panel.js";

const panelPublisher = createPanelPublisher({
  resolve: resolveTicketType,
  getConfig: getTicketTypeConfig,
  update: updateTicketType,
  publishPanel,
  entityLabel: "ticket type",
});

export async function publishTicketPanel(
  ctx: DiscordApiContext,
  typeId: string,
): Promise<void> {
  return panelPublisher.publish(ctx, typeId);
}

export async function unpublishTicketPanel(typeId: string): Promise<void> {
  return panelPublisher.unpublish(typeId);
}
