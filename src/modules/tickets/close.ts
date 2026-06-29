import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  type ButtonInteraction,
  type GuildMember,
} from 'discord.js';
import { isModuleEnabled } from '../../core/texts.js';
import { buildClosedThreadName } from './names.js';
import { CLOSE_CONFIRM_PREFIX, CLOSE_PREFIX } from './panel.js';
import { resolveTicketType, texts, NAMESPACE } from './types.js';

function parseCloseCustomId(customId: string): { threadId: string; typeId: string } | null {
  const confirm = customId.startsWith(CLOSE_CONFIRM_PREFIX);
  const prefix = confirm ? CLOSE_CONFIRM_PREFIX : CLOSE_PREFIX;
  if (!customId.startsWith(prefix)) return null;

  const rest = customId.slice(prefix.length);
  const colon = rest.indexOf(':');
  if (colon === -1) return null;

  return { threadId: rest.slice(0, colon), typeId: rest.slice(colon + 1) };
}

function canCloseTicket(
  interaction: ButtonInteraction,
  threadOwnerId: string | null,
  staffRoleIds: string[]
): boolean {
  if (interaction.user.id === threadOwnerId) return true;

  const member = interaction.member as GuildMember | null;
  if (!member) return false;

  if (staffRoleIds.some((roleId) => member.roles.cache.has(roleId))) return true;
  return member.permissions.has('ManageThreads') || member.permissions.has('Administrator');
}

export async function handleCloseTicket(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseCloseCustomId(interaction.customId);
  if (!parsed) return;

  const isConfirm = interaction.customId.startsWith(CLOSE_CONFIRM_PREFIX);
  const ticketType = resolveTicketType(parsed.typeId);

  if (!isModuleEnabled(NAMESPACE)) {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(texts().disabled);
    } else {
      await interaction.reply({ content: texts().disabled, flags: MessageFlags.Ephemeral });
    }
    return;
  }

  if (!ticketType) {
    await interaction.reply({
      content: texts().categoryUnpublished,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const thread = interaction.channel;
  if (!thread?.isThread()) {
    await interaction.reply({
      content: 'This action must be used inside a ticket thread.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!canCloseTicket(interaction, thread.ownerId, ticketType.staffRoleIds)) {
    await interaction.reply({
      content: texts().noPermission,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!isConfirm) {
    const yes = new ButtonBuilder()
      .setCustomId(`${CLOSE_CONFIRM_PREFIX}${parsed.threadId}:${parsed.typeId}`)
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

  await interaction.deferUpdate();

  try {
    await thread.send(ticketType.ticketClosed);
    await thread.setName(buildClosedThreadName(thread.name));
    await thread.setLocked(true);
  } catch (err) {
    console.error('[tickets] Failed to close ticket:', err);
    await interaction.followUp({
      content: 'Something went wrong while closing this ticket.',
      flags: MessageFlags.Ephemeral,
    });
  }
}

export async function handleCloseCancel(interaction: ButtonInteraction): Promise<void> {
  await interaction.update({
    content: 'Close cancelled.',
    components: [],
  });
}
