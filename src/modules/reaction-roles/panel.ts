import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { emojiMatchKey, parseEmoji, reactionMatchKey } from '../../core/discordEmoji.js';
import { MAX_PANEL_OPTIONS } from '../../core/limits.js';
import { syncBotMessageReactions } from '../../core/discordReactions.js';
import { publishDiscordMessage, type DiscordApiContext } from '../../core/panelPublish.js';
import type { ResolvedRolePanel, RoleOption } from './types.js';
import { resolvePanel } from './types.js';

export type { DiscordApiContext };

export const BTN_PREFIX = 'reaction-roles:btn:';
export const SEL_PREFIX = 'reaction-roles:sel:';

const MAX_OPTIONS = MAX_PANEL_OPTIONS;
const MAX_BUTTONS_PER_ROW = 5;

function validatePanel(panel: ResolvedRolePanel): void {
  const count = panel.roleOptions.length;
  if (count < 1 || count > MAX_OPTIONS) {
    throw new Error(`Panel must have 1–${MAX_OPTIONS} role options (has ${count}).`);
  }
  if (panel.reactionType === 'emoji') {
    const seenEmoji = new Set<string>();
    for (const opt of panel.roleOptions) {
      if (!opt.emoji.trim()) {
        throw new Error(`Emoji is required for option "${opt.label || opt.id}" in emoji mode.`);
      }
      if (!opt.roleId.trim()) {
        throw new Error(`Role is required for option "${opt.label || opt.id}" in emoji mode.`);
      }
      const key = emojiMatchKey(opt.emoji);
      if (key && seenEmoji.has(key)) {
        throw new Error(
          `Duplicate emoji "${opt.emoji.trim()}" — each option must use a different emoji in emoji reaction mode.`
        );
      }
      if (key) seenEmoji.add(key);
    }
  }
  if (
    panel.reactionType === 'button' ||
    panel.reactionType === 'dropdown' ||
    panel.reactionType === 'dropdown-single'
  ) {
    for (const opt of panel.roleOptions) {
      if (!opt.label.trim()) {
        throw new Error(`Label is required for option "${opt.id}" in ${panel.reactionType} mode.`);
      }
      if (!opt.roleId.trim()) {
        throw new Error(`Role is required for option "${opt.id}".`);
      }
    }
  }
}

function buildButtonRows(panel: ResolvedRolePanel): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let current = new ActionRowBuilder<ButtonBuilder>();

  for (const opt of panel.roleOptions) {
    const button = new ButtonBuilder()
      .setCustomId(`${BTN_PREFIX}${panel.id}:${opt.id}`)
      .setLabel(opt.label.slice(0, 80))
      .setStyle(ButtonStyle.Secondary);

    const parsed = parseEmoji(opt.emoji);
    if (parsed) button.setEmoji(parsed.id ? { id: parsed.id, name: parsed.name } : parsed);

    current.addComponents(button);
    if (current.components.length >= MAX_BUTTONS_PER_ROW) {
      rows.push(current);
      current = new ActionRowBuilder<ButtonBuilder>();
    }
  }

  if (current.components.length > 0) rows.push(current);
  return rows;
}

function buildSelectRow(panel: ResolvedRolePanel): ActionRowBuilder<StringSelectMenuBuilder> {
  const single = panel.reactionType === 'dropdown-single';
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${SEL_PREFIX}${panel.id}`)
    .setPlaceholder(single ? 'Select a role' : 'Select roles')
    .setMinValues(0)
    .setMaxValues(single ? 1 : panel.roleOptions.length);

  for (const opt of panel.roleOptions) {
    const option: { label: string; value: string; emoji?: { name: string; id?: string } } = {
      label: opt.label.slice(0, 100),
      value: opt.id,
    };
    const parsed = parseEmoji(opt.emoji);
    if (parsed) option.emoji = parsed.id ? { id: parsed.id, name: parsed.name } : parsed;
    menu.addOptions(option);
  }

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export function buildPanelPayload(panelId: string) {
  const panel = resolvePanel(panelId);
  if (!panel) throw new Error(`Unknown panel "${panelId}".`);
  validatePanel(panel);

  const embed = new EmbedBuilder()
    .setTitle(panel.panelTitle.slice(0, 256))
    .setDescription(panel.panelDescription.slice(0, 4096));

  const payload: { embeds: ReturnType<EmbedBuilder['toJSON']>[]; components?: unknown[] } = {
    embeds: [embed.toJSON()],
  };

  if (panel.reactionType === 'button') {
    payload.components = buildButtonRows(panel).map((r) => r.toJSON());
  } else if (panel.reactionType === 'dropdown' || panel.reactionType === 'dropdown-single') {
    payload.components = [buildSelectRow(panel).toJSON()];
  }

  return { panel, payload };
}

async function syncEmojiReactions(
  ctx: DiscordApiContext,
  channelId: string,
  messageId: string,
  options: RoleOption[]
): Promise<void> {
  const emojis = options.map((opt) => opt.emoji);
  await syncBotMessageReactions(ctx.botToken, channelId, messageId, emojis);
}

export async function publishPanel(
  ctx: DiscordApiContext,
  panelId: string,
  channelId: string,
  existingMessageId?: string
): Promise<string> {
  const { panel, payload } = buildPanelPayload(panelId);
  const afterPublish =
    panel.reactionType === 'emoji'
      ? (messageId: string) => syncEmojiReactions(ctx, channelId, messageId, panel.roleOptions)
      : undefined;

  return publishDiscordMessage(ctx, channelId, payload, existingMessageId, afterPublish);
}

/** Match a reaction emoji to a panel option. */
export function matchOptionByReaction(
  options: RoleOption[],
  emojiName: string | null,
  emojiId: string | null
): RoleOption | undefined {
  const key = reactionMatchKey(emojiName, emojiId);
  if (!key) return undefined;

  for (const opt of options) {
    if (emojiMatchKey(opt.emoji) === key) return opt;
  }
  return undefined;
}
