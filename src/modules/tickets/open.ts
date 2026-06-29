import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  ThreadAutoArchiveDuration,
  type ButtonInteraction,
  type GuildMember,
  type TextChannel,
} from 'discord.js';
import { format, isModuleEnabled } from '../../core/texts.js';
import { THREAD_AUTO_ARCHIVE_MINUTES } from '../../core/threads.js';
import { buildTicketThreadName } from './names.js';
import { CLOSE_PREFIX } from './panel.js';
import { addMembersToThread, collectStaffUserIds } from './thread-members.js';
import { resolveTicketType, texts, NAMESPACE } from './types.js';

function threadLink(guildId: string, threadId: string): string {
  return `https://discord.com/channels/${guildId}/${threadId}`;
}

async function userHasOpenTicket(channel: TextChannel, userId: string): Promise<boolean> {
  const active = await channel.threads.fetchActive();
  return active.threads.some(
    (thread) => thread.ownerId === userId && !thread.locked && !thread.name.startsWith('[CLOSED]')
  );
}

export async function handleOpenTicket(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!isModuleEnabled(NAMESPACE)) {
    await interaction.editReply(texts().disabled);
    return;
  }

  const typeId = interaction.customId.slice('tickets:open:'.length);
  const ticketType = resolveTicketType(typeId);

  if (!ticketType || !ticketType.published) {
    await interaction.editReply(texts().categoryUnpublished);
    return;
  }

  if (!ticketType.channelId) {
    await interaction.editReply('This ticket category is not configured yet.');
    return;
  }

  const channel = await interaction.client.channels.fetch(ticketType.channelId);
  if (!channel?.isTextBased() || channel.isDMBased() || channel.isThread()) {
    await interaction.editReply('The configured ticket channel is invalid.');
    return;
  }

  const textChannel = channel as TextChannel;

  try {
    if (await userHasOpenTicket(textChannel, interaction.user.id)) {
      await interaction.editReply(ticketType.alreadyOpen);
      return;
    }

    const member = interaction.member as GuildMember;
    const displayName = member.displayName || interaction.user.username;
    const threadName = buildTicketThreadName(displayName, new Date());

    const thread = await textChannel.threads.create({
      name: threadName,
      type: ChannelType.PrivateThread,
      invitable: false,
      autoArchiveDuration: THREAD_AUTO_ARCHIVE_MINUTES as ThreadAutoArchiveDuration,
    });

    const guild = interaction.guild;
    if (guild) {
      const staffUserIds = await collectStaffUserIds(guild, ticketType.staffRoleIds);
      const staffFirst = staffUserIds.filter((id) => id !== interaction.user.id);
      await addMembersToThread(thread, staffFirst);
    }

    await addMembersToThread(thread, [interaction.user.id]);

    const closeButton = new ButtonBuilder()
      .setCustomId(`${CLOSE_PREFIX}${thread.id}:${typeId}:${interaction.user.id}`)
      .setLabel(ticketType.closeButtonLabel.slice(0, 80))
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

    await thread.send({
      content: format(ticketType.ticketWelcome, { mention: `<@${interaction.user.id}>` }),
      components: [row],
    });

    const link = threadLink(interaction.guildId!, thread.id);
    await interaction.editReply(format(ticketType.openSuccess, { thread: link }));
  } catch (err) {
    console.error('[tickets] Failed to open ticket:', err);
    await interaction.editReply('Something went wrong while opening your ticket. Please try again.');
  }
}
