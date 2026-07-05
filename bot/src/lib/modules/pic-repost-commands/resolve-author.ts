import type { Message, PartialMessage } from "discord.js";

/** User mention used for delete auth; requires {mention} after {message} in attribution. */
export function resolvePicRepostAuthor(
  message: Message | PartialMessage,
  botUserId: string,
  useLastMention: boolean,
): string | undefined {
  if (message.author?.id !== botUserId) return undefined;
  if (
    !message.attachments.some((attachment) =>
      attachment.contentType?.startsWith("image/"),
    )
  ) {
    return undefined;
  }
  const mentions = message.mentions.users;
  if (mentions.size === 0) return undefined;
  return useLastMention ? mentions.last()?.id : mentions.first()?.id;
}
