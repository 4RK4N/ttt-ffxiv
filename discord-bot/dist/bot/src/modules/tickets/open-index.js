import { Events } from "discord.js";
import { registerSafeHandler } from "../../lib/core/discordEvents.js";
import { isClosedTicketThread } from "./names.js";
const openTickets = new Map();
function indexKey(channelId, userId) {
    return `${channelId}:${userId}`;
}
export function registerOpenTicket(channelId, userId, threadId) {
    openTickets.set(indexKey(channelId, userId), threadId);
}
export function clearOpenTicket(channelId, userId) {
    openTickets.delete(indexKey(channelId, userId));
}
export function clearOpenTicketByThreadId(threadId) {
    for (const [key, id] of openTickets) {
        if (id === threadId)
            openTickets.delete(key);
    }
}
export function lookupOpenTicketThreadId(channelId, userId) {
    return openTickets.get(indexKey(channelId, userId));
}
export function registerOpenTicketIndexHandlers(client) {
    registerSafeHandler(client, Events.ThreadDelete, (thread) => {
        clearOpenTicketByThreadId(thread.id);
    }, "[tickets]");
    registerSafeHandler(client, Events.ThreadUpdate, (_oldThread, newThread) => {
        if (newThread.locked === true &&
            isClosedTicketThread(newThread.name, true)) {
            clearOpenTicketByThreadId(newThread.id);
        }
    }, "[tickets]");
}
/** Test-only reset. */
export function resetOpenTicketIndexForTests() {
    openTickets.clear();
}
//# sourceMappingURL=open-index.js.map