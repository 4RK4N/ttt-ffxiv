import { type Guild, type ThreadChannel } from "discord.js";
/**
 * Fetches all guild members once per session into the tickets member map.
 * Gateway listeners in member-cache.ts keep it updated afterward.
 */
export declare function warmGuildMemberCache(guild: Guild): Promise<void>;
/** Non-bot guild admins plus all members of the configured staff role (deduped). */
export declare function collectStaffUserIds(guild: Guild, staffRoleId: string): Promise<string[]>;
export declare function addMembersToThread(thread: ThreadChannel, userIds: string[]): Promise<void>;
//# sourceMappingURL=thread-members.d.ts.map