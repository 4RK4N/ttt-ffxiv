import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ThreadChannel,
} from 'discord.js';
import { buildClosedThreadName } from './names.js';
import { DELETE_PREFIX } from '../../../../shared/modules/tickets/panel.js';
import type { ResolvedTicketType } from '../../../../shared/modules/tickets/types.js';

/** Bot-created private threads have the bot as owner, not the opener. */
export async function resolveOpenerUserId(
  thread: ThreadChannel,
  parsedOpenerUserId?: string
): Promise<string | null> {
  if (parsedOpenerUserId) return parsedOpenerUserId;

  try {
    const messages = await thread.messages.fetch({ limit: 10 });
    const welcome = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp)[0];
    const match = welcome?.content.match(/<@!?(\d+)>/);
    return match?.[1] ?? null;
  } catch (err) {
    console.warn(`[tickets] Could not resolve opener for thread ${thread.id}:`, err);
    return null;
  }
}

export async function finalizeTicketClose(
  thread: ThreadChannel,
  typeId: string,
  ticketType: ResolvedTicketType,
  closedContent: string
): Promise<void> {
  const messages = await thread.messages.fetch({ limit: 10 });
  const welcome = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp)[0];
  if (welcome?.components.length) {
    await welcome.edit({ components: [] });
  }

  const deleteButton = new ButtonBuilder()
    .setCustomId(`${DELETE_PREFIX}${thread.id}:${typeId}`)
    .setLabel(ticketType.deleteButtonLabel.slice(0, 80))
    .setStyle(ButtonStyle.Danger);

  const deleteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton);

  await thread.send({
    content: closedContent,
    components: [deleteRow],
  });
  await thread.setName(buildClosedThreadName(thread.name));
  await thread.setLocked(true);
}
