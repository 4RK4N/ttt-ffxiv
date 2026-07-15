import { type Guild } from "discord.js";
export interface ModerationAuditEntry {
    executorId: string | null;
}
/**
 * Returns a recent MemberKick audit entry for the user, if any.
 * Requires the bot to have View Audit Log permission.
 */
export declare function findRecentKick(guild: Guild, userId: string): Promise<ModerationAuditEntry | null>;
/**
 * Returns a recent MemberBan audit entry for the user, if any.
 * Requires the bot to have View Audit Log permission.
 */
export declare function findRecentBan(guild: Guild, userId: string): Promise<ModerationAuditEntry | null>;
/**
 * Returns a recent MemberBanRemove audit entry for the user, if any.
 * Requires the bot to have View Audit Log permission.
 */
export declare function findRecentUnban(guild: Guild, userId: string): Promise<ModerationAuditEntry | null>;
//# sourceMappingURL=audit.d.ts.map