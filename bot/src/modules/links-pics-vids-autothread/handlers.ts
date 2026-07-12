import { GuildMember, PermissionFlagsBits, type Message } from "discord.js";
import { channelUrl } from "../../../../shared/core/limits.js";
import { format, isModuleEnabled } from "../../../../shared/core/texts.js";
import { buildTextOrEmbedPayload } from "../../lib/core/embedBuilder.js";
import { trySendDm } from "../../lib/core/discordDm.js";
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

function resolveChannelLink(message: Message): string {
  const guildId = message.guild?.id;
  if (guildId) {
    return channelUrl(guildId, message.channelId);
  }
  return "";
}

function formatNonQualifyingDm(
  channelLink: string,
  messageContent: string,
): string {
  return format(texts().nonQualifyingDm, {
    channel: channelLink,
    message: messageContent,
  });
}

async function sendNonQualifyingDm(
  message: Message,
  channelLink: string,
  messageContent: string,
): Promise<void> {
  const dmText = formatNonQualifyingDm(channelLink, messageContent);
  await trySendDm(message.author, buildTextOrEmbedPayload(dmText), {
    logPrefix: `[${NAMESPACE}]`,
  });
}

async function deleteNonQualifyingMessage(message: Message): Promise<void> {
  if (!message.guild) return;
  const me = message.guild.members.me;
  if (
    !message.channel.isTextBased() ||
    message.channel.isDMBased() ||
    !me?.permissionsIn(message.channel).has(PermissionFlagsBits.ManageMessages)
  ) {
    return;
  }

  const messageContent = message.content ?? "";
  const channelLink = resolveChannelLink(message);

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

  await sendNonQualifyingDm(message, channelLink, messageContent);
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
