import { Events, type Client } from "discord.js";
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
  client.on(Events.ThreadDelete, (thread) => {
    clearOpenTicketByThreadId(thread.id);
  });

  client.on(Events.ThreadUpdate, (_oldThread, newThread) => {
    if (
      newThread.locked &&
      isClosedTicketThread(newThread.name, newThread.locked)
    ) {
      clearOpenTicketByThreadId(newThread.id);
    }
  });
}

/** Test-only reset. */
export function resetOpenTicketIndexForTests(): void {
  openTickets.clear();
}
