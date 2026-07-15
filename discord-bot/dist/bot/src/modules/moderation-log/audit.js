import { AuditLogEvent } from "discord.js";
/** How far back to match an audit entry to a gateway event. */
const AUDIT_WINDOW_MS = 5_000;
/**
 * Returns a recent MemberKick audit entry for the user, if any.
 * Requires the bot to have View Audit Log permission.
 */
export async function findRecentKick(guild, userId) {
    return findRecentAuditEntry(guild, userId, AuditLogEvent.MemberKick, "kick");
}
/**
 * Returns a recent MemberBan audit entry for the user, if any.
 * Requires the bot to have View Audit Log permission.
 */
export async function findRecentBan(guild, userId) {
    return findRecentAuditEntry(guild, userId, AuditLogEvent.MemberBanAdd, "ban");
}
/**
 * Returns a recent MemberBanRemove audit entry for the user, if any.
 * Requires the bot to have View Audit Log permission.
 */
export async function findRecentUnban(guild, userId) {
    return findRecentAuditEntry(guild, userId, AuditLogEvent.MemberBanRemove, "unban");
}
async function findRecentAuditEntry(guild, userId, type, label) {
    try {
        const logs = await guild.fetchAuditLogs({ type, limit: 5 });
        const cutoff = Date.now() - AUDIT_WINDOW_MS;
        for (const entry of logs.entries.values()) {
            if (entry.targetId !== userId)
                continue;
            if (entry.createdTimestamp < cutoff)
                continue;
            return { executorId: entry.executorId };
        }
    }
    catch (err) {
        console.warn(`[moderation-log] Failed to fetch ${label} audit log.`, err);
    }
    return null;
}
//# sourceMappingURL=audit.js.map