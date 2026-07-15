import { type APIGuildMember, type Client, type GuildMember } from "discord.js";
export interface CachedMember {
    roleIds: string[];
    isBot: boolean;
    displayName: string;
}
export declare function upsertApiMember(guildId: string, data: APIGuildMember): void;
export declare function upsertGuildMember(member: GuildMember): void;
export declare function removeMember(guildId: string, userId: string): void;
export declare function getMembersForGuild(guildId: string): Map<string, CachedMember>;
export declare function registerMemberCacheWarm(client: Client): void;
//# sourceMappingURL=member-cache.d.ts.map