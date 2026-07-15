import { GuildMember, type User } from "discord.js";
export declare function setMemberDisplayName(guildId: string, userId: string, displayName: string): void;
export declare function getMemberDisplayName(guildId: string, userId: string): string | undefined;
export declare function removeMemberDisplayName(guildId: string, userId: string): void;
/** Resolves a guild member's display name, falling back to user display name or username. */
export declare function resolveDisplayName(member: GuildMember | null | undefined, user: Pick<User, "displayName" | "username">): string;
//# sourceMappingURL=memberDisplayNames.d.ts.map