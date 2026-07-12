import { Events, type Client } from "discord.js";
import { registerSafeHandler } from "../../lib/core/discordEvents.js";
import { isClosedTicketThread } from "./names.js";

const openTickets = new Map<string, string>();

function indexKey(channelId: string, userId: string): string {
  return `${channelId}:${userId}`;
}

export function registerOpenTicket(
  channelId: string,
  userId: string,
  threadId: string,
): void {
  openTickets.set(indexKey(channelId, userId), threadId);
}

export function clearOpenTicket(channelId: string, userId: string): void {
  openTickets.delete(indexKey(channelId, userId));
}

export function clearOpenTicketByThreadId(threadId: string): void {
  for (const [key, id] of openTickets) {
    if (id === threadId) openTickets.delete(key);
  }
}

export function lookupOpenTicketThreadId(
  channelId: string,
  userId: string,
): string | undefined {
  return openTickets.get(indexKey(channelId, userId));
}

export function registerOpenTicketIndexHandlers(client: Client): void {
  registerSafeHandler(
    client,
    Events.ThreadDelete,
    (thread) => {
      clearOpenTicketByThreadId(thread.id);
    },
    "[tickets]",
  );

  registerSafeHandler(
    client,
    Events.ThreadUpdate,
    (_oldThread, newThread) => {
      if (
        newThread.locked === true &&
        isClosedTicketThread(newThread.name, true)
      ) {
        clearOpenTicketByThreadId(newThread.id);
      }
    },
    "[tickets]",
  );
}

/** Test-only reset. */
export function resetOpenTicketIndexForTests(): void {
  openTickets.clear();
}
