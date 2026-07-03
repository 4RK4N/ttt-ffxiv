import type { ButtonInteraction, ThreadChannel } from 'discord.js';
import { replyEphemeral } from '../../core/discordInteractions.js';
import { isModuleEnabled } from '../../core/texts.js';
import { NAMESPACE, resolveTicketType, texts } from './config-io.js';
import type { ResolvedTicketType } from './types.js';

export interface TicketThreadContext {
  ticketType: ResolvedTicketType;
  thread: ThreadChannel;
  t: ReturnType<typeof texts>;
}

export type TicketThreadGuardResult =
  | { ok: true; ctx: TicketThreadContext }
  | { ok: false };

/** Shared preamble for close/delete actions inside a ticket thread. */
export async function guardTicketThreadAction(
  interaction: ButtonInteraction,
  typeId: string,
  expectedThreadId: string
): Promise<TicketThreadGuardResult> {
  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(t.disabled);
    } else {
      await replyEphemeral(interaction, t.disabled);
    }
    return { ok: false };
  }

  const ticketType = resolveTicketType(typeId);
  if (!ticketType) {
    await replyEphemeral(interaction, t.categoryUnpublished);
    return { ok: false };
  }

  const channel = interaction.channel;
  if (!channel?.isThread()) {
    await replyEphemeral(interaction, t.threadContextRequired);
    return { ok: false };
  }

  if (expectedThreadId !== channel.id) {
    await replyEphemeral(interaction, t.invalidInteraction);
    return { ok: false };
  }

  return { ok: true, ctx: { ticketType, thread: channel, t } };
}
