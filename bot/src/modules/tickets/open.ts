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
  type ThreadChannel,
} from "discord.js";
import { format, isModuleEnabled } from "../../../../shared/core/texts.js";
import { THREAD_AUTO_ARCHIVE_MINUTES } from "../../lib/core/threads.js";
import { buildTicketThreadName, isClosedTicketThread } from "./names.js";
import {
  CLOSE_PREFIX,
  ROLE_ACTION_PREFIX,
} from "../../lib/modules/tickets/panel.js";
import { memberHasAnyRole } from "../../lib/core/discordInteractions.js";
import { buildEmbed } from "../../lib/core/embedBuilder.js";
import { addMembersToThread, collectStaffUserIds } from "./thread-members.js";
import {
  resolveTicketType,
  texts,
  NAMESPACE,
} from "../../lib/modules/tickets/config-io.js";

const openInFlight = new Set<string>();

/** Discord plain message content limit; longer welcomes use an embed description. */
const DISCORD_MESSAGE_CONTENT_MAX = 2000;

function buildWelcomePayload(welcomeText: string) {
  if (welcomeText.length <= DISCORD_MESSAGE_CONTENT_MAX) {
    return { content: welcomeText };
  }
  return { embeds: [buildEmbed({ description: welcomeText })] };
}

function openLockKey(channelId: string, userId: string): string {
  return `${channelId}:${userId}`;
}

function threadLink(guildId: string, threadId: string): string {
  return `https://discord.com/channels/${guildId}/${threadId}`;
}

/** Returns an open ticket thread id for this user in the channel, if any. */
async function findOpenTicketThreadId(
  channel: TextChannel,
  userId: string,
): Promise<string | null> {
  const active = await channel.threads.fetchActive();
  for (const thread of active.threads.values()) {
    if (
      thread.locked ||
      isClosedTicketThread(thread.name, thread.locked ?? false)
    )
      continue;
    const members = await thread.members.fetch();
    if (members.has(userId)) return thread.id;
  }
  return null;
}

export async function handleOpenTicket(
  interaction: ButtonInteraction,
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    await interaction.editReply(t.disabled);
    return;
  }

  const typeId = interaction.customId.slice("tickets:open:".length);
  const ticketType = resolveTicketType(typeId);

  if (!ticketType || !ticketType.published) {
    await interaction.editReply(t.categoryUnpublished);
    return;
  }

  if (!ticketType.channelId) {
    await interaction.editReply(t.channelNotConfigured);
    return;
  }

  const member = interaction.member as GuildMember | null;
  if (!member) {
    await interaction.editReply(t.openError);
    return;
  }

  if (
    ticketType.deniedRoleIds.length > 0 &&
    memberHasAnyRole(member, ticketType.deniedRoleIds)
  ) {
    await interaction.editReply(ticketType.roleDenied);
    return;
  }

  const channel = await interaction.client.channels.fetch(ticketType.channelId);
  if (!channel?.isTextBased() || channel.isDMBased() || channel.isThread()) {
    await interaction.editReply(t.invalidChannel);
    return;
  }

  const textChannel = channel as TextChannel;
  const lockKey = openLockKey(textChannel.id, interaction.user.id);

  if (openInFlight.has(lockKey)) {
    await interaction.editReply(t.openInProgress);
    return;
  }

  openInFlight.add(lockKey);

  let thread: ThreadChannel | undefined;

  try {
    const existingThreadId = await findOpenTicketThreadId(
      textChannel,
      interaction.user.id,
    );
    if (existingThreadId && interaction.guildId) {
      const link = threadLink(interaction.guildId, existingThreadId);
      await interaction.editReply(
        format(ticketType.alreadyOpen, { thread: link }),
      );
      return;
    }

    const displayName = member.displayName || interaction.user.username;
    const threadName = buildTicketThreadName(displayName, new Date());

    thread = await textChannel.threads.create({
      name: threadName,
      type: ChannelType.PrivateThread,
      invitable: false,
      autoArchiveDuration:
        THREAD_AUTO_ARCHIVE_MINUTES as ThreadAutoArchiveDuration,
    });

    const guild = interaction.guild;
    if (guild) {
      const staffUserIds = await collectStaffUserIds(
        guild,
        ticketType.staffRoleIds,
      );
      const staffFirst = staffUserIds.filter(
        (id) => id !== interaction.user.id,
      );
      await addMembersToThread(thread, staffFirst);
    }

    await addMembersToThread(thread, [interaction.user.id]);

    const closeButton = new ButtonBuilder()
      .setCustomId(
        `${CLOSE_PREFIX}${thread.id}:${typeId}:${interaction.user.id}`,
      )
      .setLabel(ticketType.closeButtonLabel.slice(0, 80))
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>();
    if (ticketType.roleActionRoleId) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(
            `${ROLE_ACTION_PREFIX}${thread.id}:${typeId}:${interaction.user.id}`,
          )
          .setLabel(ticketType.roleActionButtonLabel.slice(0, 80))
          .setStyle(ButtonStyle.Success),
      );
    }
    row.addComponents(closeButton);

    const welcomeText = format(ticketType.ticketWelcome, {
      mention: `<@${interaction.user.id}>`,
    });
    await thread.send({
      ...buildWelcomePayload(welcomeText),
      components: [row],
    });

    const link = threadLink(interaction.guildId!, thread.id);
    await interaction.editReply(
      format(ticketType.openSuccess, { thread: link }),
    );
  } catch (err) {
    console.error("[tickets] Failed to open ticket:", err);
    if (thread) {
      try {
        await thread.delete();
      } catch (cleanupErr) {
        console.warn(
          `[tickets] Failed to clean up thread ${thread.id} after open error:`,
          cleanupErr,
        );
      }
    }
    await interaction.editReply(t.openError);
  } finally {
    openInFlight.delete(lockKey);
  }
}
