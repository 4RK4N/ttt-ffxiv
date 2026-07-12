import {
  DiscordAPIError,
  GuildMember,
  TextChannel,
  type Message,
  type User,
} from "discord.js";
import {
  DISCORD_CANNOT_SEND_DM,
  DISCORD_MESSAGE_CONTENT_MAX,
} from "../../../../shared/core/limits.js";
import { format, isModuleEnabled } from "../../../../shared/core/texts.js";
import {
  buildThreadName,
  startAndPopulateCommentsThread,
} from "../../lib/core/threads.js";
import { resolveDisplayName } from "../../lib/core/memberDisplayNames.js";
import {
  NAMESPACE,
  channelIds,
  deleteNonQualifyingMessagesEnabled,
  texts,
} from "../../lib/modules/links-pics-vids-autothread/config-io.js";
import { extractSupportedAutoThreadUrls, stripUrls } from "./urls.js";

function hasImageOrVideoAttachment(message: Message): boolean {
  return message.attachments.some((attachment) => {
    const type = attachment.contentType ?? "";
    return type.startsWith("image/") || type.startsWith("video/");
  });
}

export function messageQualifiesForAutoThread(message: Message): boolean {
  const content = message.content ?? "";
  const hasSupportedLink = extractSupportedAutoThreadUrls(content).length > 0;
  const hasMedia = hasImageOrVideoAttachment(message);
  return hasSupportedLink || hasMedia;
}

function resolveChannelDisplayName(message: Message): string {
  if (message.channel instanceof TextChannel) {
    return `#${message.channel.name}`;
  }
  return "#unknown";
}

function buildNonQualifyingDm(channelName: string, messageContent: string): string {
  const template = texts().nonQualifyingDm;
  const suffix = "…";

  let dmText = format(template, { channel: channelName, message: messageContent });
  if (dmText.length <= DISCORD_MESSAGE_CONTENT_MAX) {
    return dmText;
  }

  const withoutMessage = format(template, { channel: channelName, message: "" });
  const maxMessageChars =
    DISCORD_MESSAGE_CONTENT_MAX - withoutMessage.length - suffix.length;

  if (maxMessageChars <= 0) {
    return dmText.slice(0, DISCORD_MESSAGE_CONTENT_MAX - 1) + suffix;
  }

  const truncatedMessage = messageContent.slice(0, maxMessageChars) + suffix;
  dmText = format(template, {
    channel: channelName,
    message: truncatedMessage,
  });

  if (dmText.length <= DISCORD_MESSAGE_CONTENT_MAX) {
    return dmText;
  }

  return dmText.slice(0, DISCORD_MESSAGE_CONTENT_MAX - 1) + suffix;
}

async function sendNonQualifyingDm(
  author: User,
  channelName: string,
  messageContent: string,
): Promise<void> {
  const dmText = buildNonQualifyingDm(channelName, messageContent);
  try {
    await author.send(dmText);
  } catch (err) {
    if (err instanceof DiscordAPIError && err.code === DISCORD_CANNOT_SEND_DM) {
      console.warn(
        `[${NAMESPACE}] Could not DM ${author.tag} (DMs closed) after deleting non-qualifying post.`,
      );
      return;
    }
    console.error(
      `[${NAMESPACE}] Failed to send non-qualifying DM to ${author.tag}:`,
      err,
    );
  }
}

async function deleteNonQualifyingMessage(message: Message): Promise<void> {
  const messageContent = message.content ?? "";
  const channelName = resolveChannelDisplayName(message);

  try {
    await message.delete();
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 10008) return;
    console.error(
      `[${NAMESPACE}] Failed to delete non-qualifying message=${message.id}:`,
      err,
    );
    return;
  }

  await sendNonQualifyingDm(message.author, channelName, messageContent);
}

export async function handleMessage(message: Message): Promise<void> {
  if (message.author.bot || message.system) return;
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!channelIds().includes(message.channelId)) return;
  if (message.channel.isThread() || message.hasThread) return;

  if (!messageQualifiesForAutoThread(message)) {
    if (deleteNonQualifyingMessagesEnabled()) {
      await deleteNonQualifyingMessage(message);
    }
    return;
  }

  const content = message.content ?? "";
  const name = buildThreadName(
    resolveDisplayName(
      message.member instanceof GuildMember ? message.member : null,
      message.author,
    ),
    stripUrls(content),
    {
      guild: message.guild,
      client: message.client,
      message,
    },
  );

  await startAndPopulateCommentsThread(message, {
    name,
    logPrefix: `[${NAMESPACE}]`,
    authorUserId: message.author.id,
    firstMessage: texts().threadFirstMessage,
  });
}
