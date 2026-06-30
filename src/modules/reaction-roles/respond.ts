import { MessageFlags, type MessageComponentInteraction } from 'discord.js';
import { format } from '../../core/texts.js';
import type { ResolvedRolePanel } from './types.js';

export interface EphemeralContext {
  mention: string;
  role: string;
}

export function formatEphemeralMessage(
  panel: ResolvedRolePanel,
  context: EphemeralContext
): string | undefined {
  const template = panel.ephemeralMessage?.trim();
  if (!template) return undefined;
  return format(template, { mention: context.mention, role: context.role });
}

/** Ephemeral user feedback; uses followUp after deferUpdate/deferReply. */
export async function replyEphemeral(
  interaction: MessageComponentInteraction,
  content: string
): Promise<void> {
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp({ flags: MessageFlags.Ephemeral, content });
    return;
  }
  await interaction.reply({ flags: MessageFlags.Ephemeral, content });
}
