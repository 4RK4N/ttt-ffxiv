import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Message,
  type ThreadChannel,
} from "discord.js";
import { buildClosedThreadName } from "./names.js";
import { clearOpenTicket } from "./open-index.js";
import { DELETE_PREFIX } from "../../lib/modules/tickets/panel.js";
import type { ResolvedTicketType } from "../../../../shared/modules/tickets/types.js";

async function fetchOldestThreadMessage(
  thread: ThreadChannel,
): Promise<Message | undefined> {
  try {
    const messages = await thread.messages.fetch({ limit: 10 });
    return [...messages.values()].sort(
      (a, b) => a.createdTimestamp - b.createdTimestamp,
    )[0];
  } catch (err) {
    console.warn(
      `[tickets] Could not fetch messages for thread ${thread.id}:`,
      err,
    );
    return undefined;
  }
}

export interface OpenerResolution {
  openerUserId: string | null;
  welcomeMessage?: Message;
}

async function openerIsThreadMember(
  thread: ThreadChannel,
  userId: string,
): Promise<boolean> {
  if (thread.members.cache.has(userId)) return true;
  try {
    const members = await thread.members.fetch();
    return members.has(userId);
  } catch {
    return false;
  }
}

/** Bot-created private threads have the bot as owner, not the opener. */
export async function resolveOpenerUserId(
  thread: ThreadChannel,
  parsedOpenerUserId?: string,
): Promise<OpenerResolution> {
  const welcome = parsedOpenerUserId
    ? await fetchOldestThreadMessage(thread)
    : undefined;
  const welcomeOpener = welcome?.content.match(/<@!?(\d+)>/)?.[1] ?? null;

  if (parsedOpenerUserId) {
    if (welcomeOpener && welcomeOpener !== parsedOpenerUserId) {
      return { openerUserId: welcomeOpener, welcomeMessage: welcome };
    }
    if (
      welcomeOpener === parsedOpenerUserId ||
      (await openerIsThreadMember(thread, parsedOpenerUserId))
    ) {
      return { openerUserId: parsedOpenerUserId, welcomeMessage: welcome };
    }
    if (welcomeOpener) {
      return { openerUserId: welcomeOpener, welcomeMessage: welcome };
    }
    return { openerUserId: null, welcomeMessage: welcome };
  }

  const oldest = welcome ?? (await fetchOldestThreadMessage(thread));
  const match = oldest?.content.match(/<@!?(\d+)>/);
  return { openerUserId: match?.[1] ?? null, welcomeMessage: oldest };
}

export async function finalizeTicketClose(
  thread: ThreadChannel,
  typeId: string,
  ticketType: ResolvedTicketType,
  closedContent: string,
  welcomeMessage?: Message,
  openerUserId?: string | null,
): Promise<void> {
  const welcome = welcomeMessage ?? (await fetchOldestThreadMessage(thread));
  if (welcome?.components.length) {
    await welcome.edit({ components: [] });
  }

  const deleteButton = new ButtonBuilder()
    .setCustomId(`${DELETE_PREFIX}${thread.id}:${typeId}`)
    .setLabel(ticketType.deleteButtonLabel.slice(0, 80))
    .setStyle(ButtonStyle.Danger);

  const deleteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    deleteButton,
  );

  await thread.send({
    content: closedContent,
    components: [deleteRow],
  });
  await thread.setName(buildClosedThreadName(thread.name));
  await thread.setLocked(true);

  const parentId = thread.parentId;
  const opener =
    openerUserId ?? welcome?.content.match(/<@!?(\d+)>/)?.[1] ?? null;
  if (parentId && opener) {
    clearOpenTicket(parentId, opener);
  }
}
