import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags, } from "discord.js";
import { channelThreadUrl } from "#shared/core/limits.js";
import { format, isModuleEnabled } from "#shared/core/texts.js";
import { sleep } from "../../lib/core/sleep.js";
import { buildTextOrEmbedPayload } from "../../lib/core/embedBuilder.js";
import { THREAD_AUTO_ARCHIVE_MINUTES, isThreadMember, } from "../../lib/core/threads.js";
import { buildTicketThreadName, isClosedTicketThread } from "./names.js";
import { CLOSE_PREFIX, OPEN_PREFIX, ROLE_ACTION_PREFIX, } from "../../lib/modules/tickets/panel.js";
import { memberHasAnyRole } from "../../lib/core/discordInteractions.js";
import { addMembersToThread, collectStaffUserIds } from "./thread-members.js";
import { lookupOpenTicketThreadId, registerOpenTicket } from "./open-index.js";
import { resolveTicketType, data, NAMESPACE, } from "../../lib/modules/tickets/config-io.js";
const openInFlight = new Set();
const THREAD_MEMBER_FETCH_DELAY_MS = 250;
function openLockKey(channelId, userId) {
    return `${channelId}:${userId}`;
}
async function verifyOpenThreadMembership(channel, threadId, userId) {
    const thread = channel.threads.cache.get(threadId);
    if (thread) {
        const locked = thread.locked === true;
        if (locked || isClosedTicketThread(thread.name, locked)) {
            return false;
        }
        if (thread.members.cache.has(userId))
            return true;
        return isThreadMember(thread, userId);
    }
    try {
        const fetched = await channel.client.channels.fetch(threadId);
        if (!fetched?.isThread())
            return false;
        const locked = fetched.locked === true;
        if (locked || isClosedTicketThread(fetched.name, locked)) {
            return false;
        }
        return isThreadMember(fetched, userId);
    }
    catch {
        return false;
    }
}
async function scanForOpenTicketThreadId(channel, userId) {
    const active = await channel.threads.fetchActive();
    for (const thread of active.threads.values()) {
        const locked = thread.locked === true;
        if (locked || isClosedTicketThread(thread.name, locked)) {
            continue;
        }
        if (thread.members.cache.has(userId))
            return thread.id;
        try {
            const members = await thread.members.fetch();
            if (members.has(userId))
                return thread.id;
        }
        catch {
            // skip thread on fetch failure
        }
        await sleep(THREAD_MEMBER_FETCH_DELAY_MS);
    }
    return null;
}
/** Returns an open ticket thread id for this user in the channel, if any. */
async function findOpenTicketThreadId(channel, userId) {
    const indexed = lookupOpenTicketThreadId(channel.id, userId);
    if (indexed) {
        const valid = await verifyOpenThreadMembership(channel, indexed, userId);
        if (valid)
            return indexed;
    }
    return scanForOpenTicketThreadId(channel, userId);
}
export async function handleOpenTicket(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const t = data();
    if (!isModuleEnabled(NAMESPACE)) {
        await interaction.editReply(t.disabled);
        return;
    }
    const typeId = interaction.customId.slice(OPEN_PREFIX.length);
    const ticketType = resolveTicketType(typeId);
    if (!ticketType || !ticketType.published) {
        await interaction.editReply(t.categoryUnpublished);
        return;
    }
    if (!ticketType.channelId) {
        await interaction.editReply(t.channelNotConfigured);
        return;
    }
    const member = interaction.member;
    if (!member) {
        await interaction.editReply(t.openError);
        return;
    }
    if (ticketType.deniedRoleIds.length > 0 &&
        memberHasAnyRole(member, ticketType.deniedRoleIds)) {
        await interaction.editReply(ticketType.roleDenied);
        return;
    }
    const channel = await interaction.client.channels.fetch(ticketType.channelId);
    if (!channel?.isTextBased() || channel.isDMBased() || channel.isThread()) {
        await interaction.editReply(t.invalidChannel);
        return;
    }
    const textChannel = channel;
    const lockKey = openLockKey(textChannel.id, interaction.user.id);
    if (openInFlight.has(lockKey)) {
        await interaction.editReply(t.openInProgress);
        return;
    }
    openInFlight.add(lockKey);
    let thread;
    try {
        const existingThreadId = await findOpenTicketThreadId(textChannel, interaction.user.id);
        if (existingThreadId && interaction.guildId) {
            const link = channelThreadUrl(interaction.guildId, existingThreadId);
            await interaction.editReply(format(ticketType.alreadyOpen, { thread: link }));
            return;
        }
        const displayName = member.displayName || interaction.user.username;
        const threadName = buildTicketThreadName(displayName, new Date());
        thread = await textChannel.threads.create({
            name: threadName,
            type: ChannelType.PrivateThread,
            invitable: false,
            autoArchiveDuration: THREAD_AUTO_ARCHIVE_MINUTES,
        });
        const guild = interaction.guild;
        if (guild) {
            const staffUserIds = await collectStaffUserIds(guild, ticketType.staffRoleId);
            const staffFirst = staffUserIds.filter((id) => id !== interaction.user.id);
            await addMembersToThread(thread, staffFirst);
        }
        await addMembersToThread(thread, [interaction.user.id]);
        const closeButton = new ButtonBuilder()
            .setCustomId(`${CLOSE_PREFIX}${thread.id}:${typeId}:${interaction.user.id}`)
            .setLabel(ticketType.closeButtonLabel.slice(0, 80))
            .setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder();
        if (ticketType.roleActionRoleId) {
            row.addComponents(new ButtonBuilder()
                .setCustomId(`${ROLE_ACTION_PREFIX}${thread.id}:${typeId}:${interaction.user.id}`)
                .setLabel(ticketType.roleActionButtonLabel.slice(0, 80))
                .setStyle(ButtonStyle.Success));
        }
        row.addComponents(closeButton);
        const welcomeText = format(ticketType.ticketWelcome, {
            mention: `<@${interaction.user.id}>`,
        });
        await thread.send({
            ...buildTextOrEmbedPayload(welcomeText),
            components: [row],
        });
        registerOpenTicket(textChannel.id, interaction.user.id, thread.id);
        const link = channelThreadUrl(interaction.guildId, thread.id);
        await interaction.editReply(format(ticketType.openSuccess, { thread: link }));
    }
    catch (err) {
        console.error("[tickets] Failed to open ticket:", err);
        if (thread) {
            try {
                await thread.delete();
            }
            catch (cleanupErr) {
                console.warn(`[tickets] Failed to clean up thread ${thread.id} after open error:`, cleanupErr);
            }
        }
        await interaction.editReply(t.openError);
    }
    finally {
        openInFlight.delete(lockKey);
    }
}
//# sourceMappingURL=open.js.map