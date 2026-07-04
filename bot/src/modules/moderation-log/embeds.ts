import type { EmbedBuilder } from 'discord.js';
import { buildEmbed } from '../../../../shared/core/embedBuilder.js';
import { format } from '../../../../shared/core/texts.js';
import type { ModLogTexts } from '../../../../shared/modules/moderation-log/types.js';

const MAX_CONTENT_LENGTH = 1_000;

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

export function resolveDeleteAuthor(
  texts: ModLogTexts,
  author: UserLike | null | undefined
): ResolvedDeleteAuthor {
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

export function buildMessageDeletedEmbed(
  texts: ModLogTexts,
  author: ResolvedDeleteAuthor,
  channelId: string,
  messageId: string,
  content: string | null,
  timestamp: Date
): EmbedBuilder {
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

export function buildMemberLeftEmbed(
  texts: ModLogTexts,
  user: UserLike,
  timestamp: Date
): EmbedBuilder {
  return buildMemberEmbed(texts.memberLeft, texts.footerUserId, texts, user, timestamp);
}

export function buildMemberKickedEmbed(
  texts: ModLogTexts,
  user: UserLike,
  timestamp: Date,
  executorId: string | null
): EmbedBuilder {
  return buildMemberEmbed(texts.memberKicked, texts.footerUserId, texts, user, timestamp, executorId);
}

export function buildMemberBannedEmbed(
  texts: ModLogTexts,
  user: UserLike,
  timestamp: Date,
  executorId: string | null
): EmbedBuilder {
  return buildMemberEmbed(texts.memberBanned, texts.footerUserId, texts, user, timestamp, executorId);
}

export function buildMemberUnbannedEmbed(
  texts: ModLogTexts,
  user: UserLike,
  timestamp: Date,
  executorId: string | null
): EmbedBuilder {
  return buildMemberEmbed(texts.memberUnbanned, texts.footerUserId, texts, user, timestamp, executorId);
}

function buildMemberEmbed(
  descriptionTemplate: string,
  footerTemplate: string,
  texts: ModLogTexts,
  user: UserLike,
  timestamp: Date,
  executorId: string | null = null
): EmbedBuilder {
  const vars: Record<string, string> = {
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

function truncateContent(content: string): string {
  if (content.length <= MAX_CONTENT_LENGTH) return content;
  return `${content.slice(0, MAX_CONTENT_LENGTH - 1)}…`;
}
