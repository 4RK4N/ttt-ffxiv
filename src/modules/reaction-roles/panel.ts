import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { discordBotFetch } from '../../core/discordApi.js';
import type { ResolvedRolePanel, RoleOption } from './types.js';
import { resolvePanel } from './types.js';

export const BTN_PREFIX = 'reaction-roles:btn:';
export const SEL_PREFIX = 'reaction-roles:sel:';

export interface DiscordApiContext {
  botToken: string;
}

const MAX_OPTIONS = 25;
const MAX_BUTTONS_PER_ROW = 5;

function parseEmoji(emoji: string): { name: string } | undefined {
  const trimmed = emoji.trim();
  if (!trimmed) return undefined;
  const custom = trimmed.match(/^<a?:(\w+):\d+>$/);
  if (custom) return { name: custom[1] };
  return { name: trimmed };
}

function parseCustomEmojiId(emoji: string): string | undefined {
  const match = emoji.trim().match(/^<a?:(\w+):(\d+)>$/);
  return match?.[2];
}

/** URL path segment for Discord reaction API. */
export function encodeEmojiForReaction(emoji: string): string | undefined {
  const trimmed = emoji.trim();
  if (!trimmed) return undefined;
  const custom = trimmed.match(/^<a?:(\w+):(\d+)>$/);
  if (custom) return encodeURIComponent(`${custom[1]}:${custom[2]}`);
  return encodeURIComponent(trimmed);
}

function validatePanel(panel: ResolvedRolePanel): void {
  const count = panel.roleOptions.length;
  if (count < 1 || count > MAX_OPTIONS) {
    throw new Error(`Panel must have 1–${MAX_OPTIONS} role options (has ${count}).`);
  }
  if (panel.reactionType === 'emoji') {
    for (const opt of panel.roleOptions) {
      if (!opt.emoji.trim()) {
        throw new Error(`Emoji is required for option "${opt.label || opt.id}" in emoji mode.`);
      }
    }
  }
  if (panel.reactionType === 'button' || panel.reactionType === 'dropdown') {
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
    if (parsed) button.setEmoji(parsed);

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
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${SEL_PREFIX}${panel.id}`)
    .setPlaceholder('Select roles')
    .setMinValues(0)
    .setMaxValues(panel.roleOptions.length);

  for (const opt of panel.roleOptions) {
    const option: { label: string; value: string; emoji?: { name: string } } = {
      label: opt.label.slice(0, 100),
      value: opt.id,
    };
    const parsed = parseEmoji(opt.emoji);
    if (parsed) option.emoji = parsed;
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
  } else if (panel.reactionType === 'dropdown') {
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
  for (const opt of options) {
    const encoded = encodeEmojiForReaction(opt.emoji);
    if (!encoded) continue;
    const res = await discordBotFetch(
      ctx.botToken,
      `/channels/${channelId}/messages/${messageId}/reactions/${encoded}/@me`,
      { method: 'PUT' }
    );
    if (!res.ok && res.status !== 204) {
      console.warn(
        `[reaction-roles] Failed to add reaction ${opt.emoji} to message ${messageId} (HTTP ${res.status}).`
      );
    }
  }
}

export async function publishPanel(
  ctx: DiscordApiContext,
  panelId: string,
  channelId: string,
  existingMessageId?: string
): Promise<string> {
  const { panel, payload } = buildPanelPayload(panelId);

  if (existingMessageId) {
    const editRes = await discordBotFetch(
      ctx.botToken,
      `/channels/${channelId}/messages/${existingMessageId}`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    );
    if (editRes.ok) {
      if (panel.reactionType === 'emoji') {
        await syncEmojiReactions(ctx, channelId, existingMessageId, panel.roleOptions);
      }
      return existingMessageId;
    }
    if (editRes.status !== 404) {
      throw new Error(`Failed to edit panel message (HTTP ${editRes.status}).`);
    }
  }

  const createRes = await discordBotFetch(ctx.botToken, `/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!createRes.ok) {
    throw new Error(`Failed to post panel message (HTTP ${createRes.status}).`);
  }

  const body = (await createRes.json()) as { id?: string };
  if (!body.id) throw new Error('Discord did not return a message id.');

  if (panel.reactionType === 'emoji') {
    await syncEmojiReactions(ctx, channelId, body.id, panel.roleOptions);
  }

  return body.id;
}

/** Match a reaction emoji to a panel option. */
export function matchOptionByReaction(
  options: RoleOption[],
  emojiName: string | null,
  emojiId: string | null
): RoleOption | undefined {
  for (const opt of options) {
    const trimmed = opt.emoji.trim();
    if (!trimmed) continue;
    const customId = parseCustomEmojiId(trimmed);
    if (customId && emojiId === customId) return opt;
    if (!customId && emojiName && trimmed === emojiName) return opt;
  }
  return undefined;
}
