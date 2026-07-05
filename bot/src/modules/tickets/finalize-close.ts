import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Message,
  type ThreadChannel,
} from "discord.js";
import { buildClosedThreadName } from "./names.js";
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

/** Bot-created private threads have the bot as owner, not the opener. */
export async function resolveOpenerUserId(
  thread: ThreadChannel,
  parsedOpenerUserId?: string,
): Promise<OpenerResolution> {
  if (parsedOpenerUserId) {
    return { openerUserId: parsedOpenerUserId };
  }

  const welcome = await fetchOldestThreadMessage(thread);
  const match = welcome?.content.match(/<@!?(\d+)>/);
  return { openerUserId: match?.[1] ?? null, welcomeMessage: welcome };
}

export async function finalizeTicketClose(
  thread: ThreadChannel,
  typeId: string,
  ticketType: ResolvedTicketType,
  closedContent: string,
  welcomeMessage?: Message,
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
}
