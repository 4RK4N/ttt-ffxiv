import { MessageFlags, type GuildMember, type InteractionReplyOptions, type MessageComponentInteraction } from 'discord.js';

type EphemeralReply = string | (Omit<InteractionReplyOptions, 'flags'> & { content: string });

/** Ephemeral user feedback; uses followUp after deferUpdate/deferReply. */
export async function replyEphemeral(
  interaction: MessageComponentInteraction,
  options: EphemeralReply
): Promise<void> {
  const payload: InteractionReplyOptions =
    typeof options === 'string'
      ? { content: options, flags: MessageFlags.Ephemeral }
      : { ...options, flags: MessageFlags.Ephemeral };

  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(payload);
    return;
  }
  await interaction.reply(payload);
}

/** True when the member holds at least one of the given role IDs. */
export function memberHasAnyRole(member: GuildMember, roleIds: string[]): boolean {
  return roleIds.some((id) => member.roles.cache.has(id));
}
