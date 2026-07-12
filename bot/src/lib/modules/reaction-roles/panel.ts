import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { buildEmbed } from "../../core/embedBuilder.js";
import {
  parseEmoji,
  reactionsMatch,
} from "../../../../../shared/core/discordEmoji.js";
import { syncBotMessageReactions } from "../../core/discordReactions.js";
import {
  publishDiscordMessage,
  type DiscordApiContext,
} from "../../core/panelPublish.js";
import type {
  ResolvedRolePanel,
  RoleOption,
} from "../../../../../shared/modules/reaction-roles/types.js";
import { resolvePanel } from "./config-io.js";
import { validateRolePanel } from "../../../../../shared/modules/reaction-roles/validate.js";

export type { DiscordApiContext };

export const BTN_PREFIX = "reaction-roles:btn:";
export const SEL_PREFIX = "reaction-roles:sel:";

const MAX_BUTTONS_PER_ROW = 5;

function buildButtonRows(
  panel: ResolvedRolePanel,
): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let current = new ActionRowBuilder<ButtonBuilder>();

  for (const opt of panel.roleOptions) {
    const button = new ButtonBuilder()
      .setCustomId(`${BTN_PREFIX}${panel.id}:${opt.id}`)
      .setLabel(opt.label.slice(0, 80))
      .setStyle(ButtonStyle.Primary);

    const parsed = parseEmoji(opt.emoji);
    if (parsed)
      button.setEmoji(
        parsed.id ? { id: parsed.id, name: parsed.name } : parsed,
      );

    current.addComponents(button);
    if (current.components.length >= MAX_BUTTONS_PER_ROW) {
      rows.push(current);
      current = new ActionRowBuilder<ButtonBuilder>();
    }
  }

  if (current.components.length > 0) rows.push(current);
  return rows;
}

function buildSelectRow(
  panel: ResolvedRolePanel,
): ActionRowBuilder<StringSelectMenuBuilder> {
  const single = panel.reactionType === "dropdown-single";
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${SEL_PREFIX}${panel.id}`)
    .setPlaceholder(single ? "Select a role" : "Select roles")
    .setMinValues(0)
    .setMaxValues(single ? 1 : panel.roleOptions.length);

  for (const opt of panel.roleOptions) {
    const option: {
      label: string;
      value: string;
      emoji?: { name: string; id?: string };
    } = {
      label: opt.label.slice(0, 100),
      value: opt.id,
    };
    const parsed = parseEmoji(opt.emoji);
    if (parsed)
      option.emoji = parsed.id ? { id: parsed.id, name: parsed.name } : parsed;
    menu.addOptions(option);
  }

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export function buildPanelPayload(panelId: string) {
  const panel = resolvePanel(panelId);
  if (!panel) throw new Error(`Unknown panel "${panelId}".`);
  validateRolePanel(panel);

  const embed = buildEmbed({
    title: panel.panelTitle,
    description: panel.panelDescription,
  });

  const payload: {
    embeds: ReturnType<EmbedBuilder["toJSON"]>[];
    components?: unknown[];
  } = {
    embeds: [embed.toJSON()],
  };

  if (panel.reactionType === "button") {
    payload.components = buildButtonRows(panel).map((r) => r.toJSON());
  } else if (
    panel.reactionType === "dropdown" ||
    panel.reactionType === "dropdown-single"
  ) {
    payload.components = [buildSelectRow(panel).toJSON()];
  }

  return { panel, payload };
}

async function syncEmojiReactions(
  ctx: DiscordApiContext,
  channelId: string,
  messageId: string,
  options: RoleOption[],
): Promise<void> {
  const emojis = options.map((opt) => opt.emoji);
  await syncBotMessageReactions(ctx.botToken, channelId, messageId, emojis);
}

export async function publishPanel(
  ctx: DiscordApiContext,
  panelId: string,
  channelId: string,
  existingMessageId?: string,
): Promise<string> {
  const { panel, payload } = buildPanelPayload(panelId);
  const afterPublish =
    panel.reactionType === "emoji"
      ? (messageId: string) =>
          syncEmojiReactions(ctx, channelId, messageId, panel.roleOptions)
      : undefined;

  return publishDiscordMessage(
    ctx,
    channelId,
    payload,
    existingMessageId,
    afterPublish,
  );
}

/** Match a reaction emoji to a panel option. */
export function matchOptionByReaction(
  options: RoleOption[],
  emojiName: string | null,
  emojiId: string | null,
): RoleOption | undefined {
  for (const opt of options) {
    if (reactionsMatch(opt.emoji, emojiName, emojiId)) return opt;
  }
  return undefined;
}
