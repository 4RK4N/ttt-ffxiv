import { type ChatInputCommandInteraction, type GuildMember, type InteractionReplyOptions, type MessageComponentInteraction } from "discord.js";
/** Discord API: unknown message (already deleted). */
export declare function isDiscordUnknownMessage(err: unknown): boolean;
type EphemeralReply = string | (Omit<InteractionReplyOptions, "flags"> & {
    content: string;
});
/** Defers an ephemeral slash-command reply, then runs the handler. */
export declare function deferEphemeral(interaction: ChatInputCommandInteraction, handler: (interaction: ChatInputCommandInteraction) => Promise<void>): Promise<void>;
/** Ephemeral user feedback; uses followUp after deferUpdate/deferReply. */
export declare function replyEphemeral(interaction: MessageComponentInteraction, options: EphemeralReply): Promise<void>;
/** True when the member holds at least one of the given role IDs. */
export declare function memberHasAnyRole(member: GuildMember, roleIds: string[]): boolean;
/** Configured role ID or guild Administrator. */
export declare function canConfiguredRoleOrAdmin(member: GuildMember, roleId: string | undefined): boolean;
/** After deferReply: if module is disabled, editReply with message and return false. */
export declare function guardEnabledSlash(interaction: ChatInputCommandInteraction, namespace: string, disabledMessage: string): Promise<boolean>;
export {};
//# sourceMappingURL=discordInteractions.d.ts.map