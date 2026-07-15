import type { EmbedBuilder } from "discord.js";
import type { ModLogTexts } from "../../lib/modules/moderation-log/config-io.js";
/** Resolved author for a deleted message — works with full or partial API payloads. */
export interface ResolvedDeleteAuthor {
    mention: string;
    displayName: string;
    iconURL?: string;
}
interface UserLike {
    id: string;
    username: string;
    displayAvatarURL: () => string;
}
export declare function resolveDeleteAuthor(texts: ModLogTexts, author: UserLike | null | undefined): ResolvedDeleteAuthor;
export declare function buildMessageDeletedEmbed(texts: ModLogTexts, author: ResolvedDeleteAuthor, channelId: string, messageId: string, content: string | null, timestamp: Date): EmbedBuilder;
export declare function buildMemberLeftEmbed(texts: ModLogTexts, user: UserLike, timestamp: Date): EmbedBuilder;
export declare function buildMemberKickedEmbed(texts: ModLogTexts, user: UserLike, timestamp: Date, executorId: string | null): EmbedBuilder;
export declare function buildMemberBannedEmbed(texts: ModLogTexts, user: UserLike, timestamp: Date, executorId: string | null): EmbedBuilder;
export declare function buildMemberUnbannedEmbed(texts: ModLogTexts, user: UserLike, timestamp: Date, executorId: string | null): EmbedBuilder;
export {};
//# sourceMappingURL=embeds.d.ts.map