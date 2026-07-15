import { EmbedBuilder } from "discord.js";
import { buildEmbed } from "../../core/embedBuilder.js";
import {
  publishDiscordMessage,
  type DiscordApiContext,
} from "../../core/panelPublish.js";
import { resolveEmbedPanel } from "./config-io.js";
import { validateEmbedPanel } from "@shared/modules/custom-embeds/validate.js";

export type { DiscordApiContext };

export function buildPanelPayload(panelId: string) {
  const panel = resolveEmbedPanel(panelId);
  if (!panel) throw new Error(`Unknown embed panel "${panelId}".`);
  validateEmbedPanel(panel);

  const authorName = panel.authorName.trim();
  const authorIconUrl = panel.authorIconUrl.trim();
  const footer = panel.footer.trim();

  const embed = buildEmbed({
    title: panel.panelTitle.trim() || undefined,
    description: panel.panelDescription,
    author: authorName
      ? { name: authorName, iconURL: authorIconUrl || undefined }
      : undefined,
    footer: footer || undefined,
    timestamp: panel.showTimestamp ? new Date() : undefined,
  });

  const payload: { embeds: ReturnType<EmbedBuilder["toJSON"]>[] } = {
    embeds: [embed.toJSON()],
  };

  return { panel, payload };
}

export async function publishPanel(
  ctx: DiscordApiContext,
  panelId: string,
  channelId: string,
  existingMessageId?: string,
): Promise<string> {
  const { payload } = buildPanelPayload(panelId);
  return publishDiscordMessage(ctx, channelId, payload, existingMessageId);
}
