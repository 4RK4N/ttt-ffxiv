import { ActionRowBuilder, ButtonBuilder, ButtonStyle, } from "discord.js";
import { buildClosedThreadName } from "./names.js";
import { clearOpenTicket } from "./open-index.js";
import { DELETE_PREFIX } from "../../lib/modules/tickets/panel.js";
import { isThreadMember, extractFirstMentionId, } from "../../lib/core/threads.js";
async function fetchOldestThreadMessage(thread) {
    try {
        const messages = await thread.messages.fetch({ limit: 10 });
        return [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp)[0];
    }
    catch (err) {
        console.warn(`[tickets] Could not fetch messages for thread ${thread.id}:`, err);
        return undefined;
    }
}
async function openerIsThreadMember(thread, userId) {
    return isThreadMember(thread, userId);
}
/** Bot-created private threads have the bot as owner, not the opener. */
export async function resolveOpenerUserId(thread, parsedOpenerUserId) {
    const welcome = parsedOpenerUserId
        ? await fetchOldestThreadMessage(thread)
        : undefined;
    const welcomeOpener = welcome?.content
        ? extractFirstMentionId(welcome.content)
        : null;
    if (parsedOpenerUserId) {
        if (welcomeOpener && welcomeOpener !== parsedOpenerUserId) {
            return { openerUserId: welcomeOpener, welcomeMessage: welcome };
        }
        if (welcomeOpener === parsedOpenerUserId ||
            (await openerIsThreadMember(thread, parsedOpenerUserId))) {
            return { openerUserId: parsedOpenerUserId, welcomeMessage: welcome };
        }
        if (welcomeOpener) {
            return { openerUserId: welcomeOpener, welcomeMessage: welcome };
        }
        return { openerUserId: null, welcomeMessage: welcome };
    }
    const oldest = welcome ?? (await fetchOldestThreadMessage(thread));
    return {
        openerUserId: oldest?.content
            ? extractFirstMentionId(oldest.content)
            : null,
        welcomeMessage: oldest,
    };
}
export async function finalizeTicketClose(thread, typeId, ticketType, closedContent, welcomeMessage, openerUserId) {
    const welcome = welcomeMessage ?? (await fetchOldestThreadMessage(thread));
    if (welcome?.components.length) {
        await welcome.edit({ components: [] });
    }
    const deleteButton = new ButtonBuilder()
        .setCustomId(`${DELETE_PREFIX}${thread.id}:${typeId}`)
        .setLabel(ticketType.deleteButtonLabel.slice(0, 80))
        .setStyle(ButtonStyle.Danger);
    const deleteRow = new ActionRowBuilder().addComponents(deleteButton);
    await thread.send({
        content: closedContent,
        components: [deleteRow],
    });
    await thread.setName(buildClosedThreadName(thread.name));
    await thread.setLocked(true);
    const parentId = thread.parentId;
    const opener = openerUserId ??
        (welcome?.content ? extractFirstMentionId(welcome.content) : null);
    if (parentId && opener) {
        clearOpenTicket(parentId, opener);
    }
}
//# sourceMappingURL=finalize-close.js.map