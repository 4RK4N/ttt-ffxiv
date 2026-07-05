import type { Message, PartialMessage } from "discord.js";

const USER_MENTION_REGEX = /<@!?(\d{17,20})>/g;

function resolveMentionedUserIds(message: Message | PartialMessage): string[] {
  const fromApi = [...message.mentions.users.keys()];
  if (fromApi.length > 0) return fromApi;

  const content = message.content;
  if (!content) return [];

  const ids: string[] = [];
  for (const match of content.matchAll(USER_MENTION_REGEX)) {
    ids.push(match[1]);
  }
  return ids;
}

/** User mention used for delete auth; requires {mention} after {message} in attribution. */
export function resolvePicRepostAuthor(
  message: Message | PartialMessage,
  botUserId: string,
  useLastMention: boolean,
): string | undefined {
  if (message.author?.id !== botUserId) return undefined;
  if (message.attachments.size === 0) return undefined;

  const mentionIds = resolveMentionedUserIds(message);
  if (mentionIds.length === 0) return undefined;

  return useLastMention
    ? mentionIds.at(-1)
    : mentionIds.at(0);
}
