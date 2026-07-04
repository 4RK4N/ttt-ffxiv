import type { ButtonInteraction, ThreadChannel } from 'discord.js';
import { replyEphemeral } from '../../../../shared/core/discordInteractions.js';
import { isModuleEnabled } from '../../../../shared/core/texts.js';
import { isClosedTicketThread } from './names.js';
import { NAMESPACE, resolveTicketType, texts } from '../../../../shared/modules/tickets/config-io.js';
import type { ResolvedTicketType } from '../../../../shared/modules/tickets/types.js';

export interface TicketThreadGuardOptions {
  /** When true, reject closed/locked ticket threads. */
  requireOpen?: boolean;
}

export interface TicketThreadContext {
  ticketType: ResolvedTicketType;
  thread: ThreadChannel;
  t: ReturnType<typeof texts>;
}

export type TicketThreadGuardResult =
  | { ok: true; ctx: TicketThreadContext }
  | { ok: false };

/** Shared preamble for ticket thread button actions (close/delete/role-action). */
export async function guardTicketThreadAction(
  interaction: ButtonInteraction,
  typeId: string,
  expectedThreadId: string,
  options?: TicketThreadGuardOptions
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

  if (options?.requireOpen && isClosedTicketThread(channel.name, channel.locked === true)) {
    await replyEphemeral(interaction, t.invalidInteraction);
    return { ok: false };
  }

  return { ok: true, ctx: { ticketType, thread: channel, t } };
}
