import { USER_MENTION_REGEX } from "../../core/threads.js";
function resolveMentionedUserIds(message) {
    const fromApi = [...message.mentions.users.keys()];
    if (fromApi.length > 0)
        return fromApi;
    const content = message.content;
    if (!content)
        return [];
    const ids = [];
    for (const match of content.matchAll(USER_MENTION_REGEX)) {
        ids.push(match[1]);
    }
    return ids;
}
/** User mention used for delete auth; requires {mention} after {message} in attribution. */
export function resolvePicRepostAuthor(message, botUserId, useLastMention) {
    if (message.author?.id !== botUserId)
        return undefined;
    if (message.attachments.size === 0)
        return undefined;
    const mentionIds = resolveMentionedUserIds(message);
    if (mentionIds.length === 0)
        return undefined;
    return useLastMention ? mentionIds.at(-1) : mentionIds.at(0);
}
//# sourceMappingURL=resolve-author.js.map