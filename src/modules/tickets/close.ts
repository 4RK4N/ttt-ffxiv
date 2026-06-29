import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  type ButtonInteraction,
  type GuildMember,
  type ThreadChannel,
} from 'discord.js';
import { isModuleEnabled } from '../../core/texts.js';
import { buildClosedThreadName } from './names.js';
import { CLOSE_CONFIRM_PREFIX, CLOSE_PREFIX, DELETE_PREFIX } from './panel.js';
import { canStaffOrAdmin } from './permissions.js';
import { resolveTicketType, texts, NAMESPACE } from './types.js';

interface ParsedCloseCustomId {
  threadId: string;
  typeId: string;
  openerUserId?: string;
}

function parseCloseCustomId(customId: string): ParsedCloseCustomId | null {
  const confirm = customId.startsWith(CLOSE_CONFIRM_PREFIX);
  const prefix = confirm ? CLOSE_CONFIRM_PREFIX : CLOSE_PREFIX;
  if (!customId.startsWith(prefix)) return null;

  const segments = customId.slice(prefix.length).split(':');
  if (segments.length < 2) return null;

  const threadId = segments[0];
  if (segments.length >= 3) {
    return { threadId, typeId: segments[1], openerUserId: segments[2] };
  }
  return { threadId, typeId: segments.slice(1).join(':') };
}

/** Bot-created private threads have the bot as owner, not the opener. */
async function resolveOpenerUserId(
  thread: ThreadChannel,
  parsedOpenerUserId?: string
): Promise<string | null> {
  if (parsedOpenerUserId) return parsedOpenerUserId;

  try {
    const messages = await thread.messages.fetch({ limit: 10 });
    const welcome = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp)[0];
    const match = welcome?.content.match(/<@!?(\d+)>/);
    return match?.[1] ?? null;
  } catch (err) {
    console.warn(`[tickets] Could not resolve opener for thread ${thread.id}:`, err);
    return null;
  }
}

function canCloseTicket(
  interaction: ButtonInteraction,
  openerUserId: string | null,
  staffRoleIds: string[]
): boolean {
  if (openerUserId && interaction.user.id === openerUserId) return true;

  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  return canStaffOrAdmin(member, staffRoleIds);
}

export async function handleCloseTicket(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseCloseCustomId(interaction.customId);
  if (!parsed) return;

  const isConfirm = interaction.customId.startsWith(CLOSE_CONFIRM_PREFIX);
  const ticketType = resolveTicketType(parsed.typeId);
  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(t.disabled);
    } else {
      await interaction.reply({ content: t.disabled, flags: MessageFlags.Ephemeral });
    }
    return;
  }

  if (!ticketType) {
    await interaction.reply({
      content: t.categoryUnpublished,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const thread = interaction.channel;
  if (!thread?.isThread()) {
    await interaction.reply({
      content: t.threadContextRequired,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (parsed.threadId !== thread.id) {
    await interaction.reply({
      content: t.invalidInteraction,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const openerUserId = await resolveOpenerUserId(thread, parsed.openerUserId);

  if (!canCloseTicket(interaction, openerUserId, ticketType.staffRoleIds)) {
    await interaction.reply({
      content: t.noPermission,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const closePayload = parsed.openerUserId
    ? `${parsed.threadId}:${parsed.typeId}:${parsed.openerUserId}`
    : `${parsed.threadId}:${parsed.typeId}:${openerUserId ?? ''}`;

  if (!isConfirm) {
    const yes = new ButtonBuilder()
      .setCustomId(`${CLOSE_CONFIRM_PREFIX}${closePayload}`)
      .setLabel(ticketType.confirmCloseYes.slice(0, 80))
      .setStyle(ButtonStyle.Danger);

    const no = new ButtonBuilder()
      .setCustomId(`tickets:close-cancel:${parsed.threadId}`)
      .setLabel(ticketType.confirmCloseNo.slice(0, 80))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(yes, no);

    await interaction.reply({
      content: ticketType.confirmClosePrompt,
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!canCloseTicket(interaction, openerUserId, ticketType.staffRoleIds)) {
    await interaction.reply({
      content: t.noPermission,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferUpdate();

  try {
    const messages = await thread.messages.fetch({ limit: 10 });
    const welcome = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp)[0];
    if (welcome?.components.length) {
      await welcome.edit({ components: [] });
    }

    const deleteButton = new ButtonBuilder()
      .setCustomId(`${DELETE_PREFIX}${thread.id}:${parsed.typeId}`)
      .setLabel(ticketType.deleteButtonLabel.slice(0, 80))
      .setStyle(ButtonStyle.Danger);

    const deleteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton);

    await thread.send({
      content: ticketType.ticketClosed,
      components: [deleteRow],
    });
    await thread.setName(buildClosedThreadName(thread.name));
    await thread.setLocked(true);
  } catch (err) {
    console.error('[tickets] Failed to close ticket:', err);
    await interaction.followUp({
      content: t.closeError,
      flags: MessageFlags.Ephemeral,
    });
  }
}

export async function handleCloseCancel(interaction: ButtonInteraction): Promise<void> {
  await interaction.update({
    content: texts().closeCancelled,
    components: [],
  });
}
