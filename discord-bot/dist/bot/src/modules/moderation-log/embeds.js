import { buildEmbed } from "../../lib/core/embedBuilder.js";
import { format } from "#shared/core/texts.js";
const MAX_CONTENT_LENGTH = 1_000;
export function resolveDeleteAuthor(texts, author) {
    if (author) {
        return {
            mention: `<@${author.id}>`,
            displayName: author.username,
            iconURL: author.displayAvatarURL(),
        };
    }
    return {
        mention: texts.authorUnknown,
        displayName: texts.authorUnknown,
    };
}
export function buildMessageDeletedEmbed(texts, author, channelId, messageId, content, timestamp) {
    const header = format(texts.messageDeleted, {
        author: author.mention,
        channel: `<#${channelId}>`,
    });
    const body = content?.trim()
        ? `${header}\n${truncateContent(content)}`
        : `${header}\n${texts.messageDeletedEmpty}`;
    return buildEmbed({
        description: body,
        author: author.iconURL
            ? { name: author.displayName, iconURL: author.iconURL }
            : { name: author.displayName },
        footer: format(texts.footerMessageId, { messageId }),
        timestamp,
    });
}
export function buildMemberLeftEmbed(texts, user, timestamp) {
    return buildMemberEmbed(texts.memberLeft, texts.footerUserId, texts, user, timestamp);
}
export function buildMemberKickedEmbed(texts, user, timestamp, executorId) {
    return buildMemberEmbed(texts.memberKicked, texts.footerUserId, texts, user, timestamp, executorId);
}
export function buildMemberBannedEmbed(texts, user, timestamp, executorId) {
    return buildMemberEmbed(texts.memberBanned, texts.footerUserId, texts, user, timestamp, executorId);
}
export function buildMemberUnbannedEmbed(texts, user, timestamp, executorId) {
    return buildMemberEmbed(texts.memberUnbanned, texts.footerUserId, texts, user, timestamp, executorId);
}
function buildMemberEmbed(descriptionTemplate, footerTemplate, texts, user, timestamp, executorId = null) {
    const vars = {
        mention: `<@${user.id}>`,
        executorId: executorId ? `<@${executorId}>` : texts.executorUnknown,
    };
    return buildEmbed({
        description: format(descriptionTemplate, vars),
        author: { name: user.username, iconURL: user.displayAvatarURL() },
        footer: format(footerTemplate, { userId: user.id }),
        timestamp,
    });
}
function truncateContent(content) {
    if (content.length <= MAX_CONTENT_LENGTH)
        return content;
    return `${content.slice(0, MAX_CONTENT_LENGTH - 1)}…`;
}
//# sourceMappingURL=embeds.js.map