import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ButtonInteraction,
  type GuildMember,
  type ThreadChannel,
} from 'discord.js';
import { replyEphemeral } from '../../core/discordInteractions.js';
import { isModuleEnabled } from '../../core/texts.js';
import { isClosedTicketThread } from './names.js';
import { DELETE_CONFIRM_PREFIX, DELETE_PREFIX } from './panel.js';
import { canStaffOrAdmin } from './permissions.js';
import { resolveTicketType, texts, NAMESPACE } from './types.js';

interface ParsedDeleteCustomId {
  threadId: string;
  typeId: string;
}

function parseDeleteCustomId(customId: string): ParsedDeleteCustomId | null {
  const confirm = customId.startsWith(DELETE_CONFIRM_PREFIX);
  const prefix = confirm ? DELETE_CONFIRM_PREFIX : DELETE_PREFIX;
  if (!customId.startsWith(prefix)) return null;

  const segments = customId.slice(prefix.length).split(':');
  if (segments.length < 2) return null;

  return { threadId: segments[0], typeId: segments.slice(1).join(':') };
}

function canDeleteTicket(interaction: ButtonInteraction, staffRoleIds: string[]): boolean {
  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  return canStaffOrAdmin(member, staffRoleIds);
}

export async function handleDeleteTicket(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseDeleteCustomId(interaction.customId);
  if (!parsed) return;

  const isConfirm = interaction.customId.startsWith(DELETE_CONFIRM_PREFIX);
  const ticketType = resolveTicketType(parsed.typeId);
  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    await replyEphemeral(interaction, t.disabled);
    return;
  }

  if (!ticketType) {
    await replyEphemeral(interaction, t.categoryUnpublished);
    return;
  }

  const thread = interaction.channel;
  if (!thread?.isThread()) {
    await replyEphemeral(interaction, t.threadContextRequired);
    return;
  }

  if (parsed.threadId !== thread.id) {
    await replyEphemeral(interaction, t.invalidInteraction);
    return;
  }

  if (!isClosedTicketThread(thread.name, thread.locked === true)) {
    await replyEphemeral(interaction, t.deleteNotClosed);
    return;
  }

  if (!canDeleteTicket(interaction, ticketType.staffRoleIds)) {
    await replyEphemeral(interaction, t.noDeletePermission);
    return;
  }

  const deletePayload = `${parsed.threadId}:${parsed.typeId}`;

  if (!isConfirm) {
    const yes = new ButtonBuilder()
      .setCustomId(`${DELETE_CONFIRM_PREFIX}${deletePayload}`)
      .setLabel(ticketType.confirmDeleteYes.slice(0, 80))
      .setStyle(ButtonStyle.Danger);

    const no = new ButtonBuilder()
      .setCustomId(`tickets:delete-cancel:${parsed.threadId}`)
      .setLabel(ticketType.confirmDeleteNo.slice(0, 80))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(yes, no);

    await replyEphemeral(interaction, {
      content: ticketType.confirmDeletePrompt,
      components: [row],
    });
    return;
  }

  if (!canDeleteTicket(interaction, ticketType.staffRoleIds)) {
    await replyEphemeral(interaction, t.noDeletePermission);
    return;
  }

  await interaction.update({ content: ticketType.ticketDeleted, components: [] });

  try {
    await (thread as ThreadChannel).delete();
  } catch (err) {
    console.error('[tickets] Failed to delete ticket thread:', err);
    await replyEphemeral(interaction, t.deleteError);
  }
}

export async function handleDeleteCancel(interaction: ButtonInteraction): Promise<void> {
  await interaction.update({
    content: texts().deleteCancelled,
    components: [],
  });
}
