import { GuildMember, PermissionFlagsBits } from "discord.js";
import { channelUrl } from "#shared/core/limits.js";
import { format, isModuleEnabled } from "#shared/core/texts.js";
import { buildTextOrEmbedPayload } from "../../lib/core/embedBuilder.js";
import { isDiscordUnknownMessage } from "../../lib/core/discordInteractions.js";
import { trySendDm } from "../../lib/core/discordDm.js";
import { buildThreadName, startAndPopulateCommentsThread, } from "../../lib/core/threads.js";
import { resolveDisplayName } from "../../lib/core/memberDisplayNames.js";
import { NAMESPACE, channelIds, deleteNonQualifyingMessagesEnabled, data, } from "../../lib/modules/links-pics-vids-autothread/config-io.js";
import { extractSupportedAutoThreadUrls, stripUrls } from "./urls.js";
function hasImageOrVideoAttachment(message) {
    return message.attachments.some((attachment) => {
        const type = attachment.contentType ?? "";
        return type.startsWith("image/") || type.startsWith("video/");
    });
}
export function messageQualifiesForAutoThread(message) {
    const content = message.content ?? "";
    const hasSupportedLink = extractSupportedAutoThreadUrls(content).length > 0;
    const hasMedia = hasImageOrVideoAttachment(message);
    return hasSupportedLink || hasMedia;
}
function resolveChannelLink(message) {
    const guildId = message.guild?.id;
    if (guildId) {
        return channelUrl(guildId, message.channelId);
    }
    return "";
}
function formatNonQualifyingDm(channelLink, messageContent) {
    return format(data().nonQualifyingDm, {
        channel: channelLink,
        message: messageContent,
    });
}
async function sendNonQualifyingDm(message, channelLink, messageContent) {
    const dmText = formatNonQualifyingDm(channelLink, messageContent);
    await trySendDm(message.author, buildTextOrEmbedPayload(dmText), {
        logPrefix: `[${NAMESPACE}]`,
    });
}
async function deleteNonQualifyingMessage(message) {
    if (!message.guild)
        return;
    const me = message.guild.members.me;
    if (!message.channel.isTextBased() ||
        message.channel.isDMBased() ||
        !me?.permissionsIn(message.channel).has(PermissionFlagsBits.ManageMessages)) {
        return;
    }
    const messageContent = message.content ?? "";
    const channelLink = resolveChannelLink(message);
    try {
        await message.delete();
    }
    catch (err) {
        if (isDiscordUnknownMessage(err))
            return;
        console.error(`[${NAMESPACE}] Failed to delete non-qualifying message=${message.id}:`, err);
        return;
    }
    await sendNonQualifyingDm(message, channelLink, messageContent);
}
export async function handleMessage(message) {
    if (message.author.bot || message.system)
        return;
    if (!isModuleEnabled(NAMESPACE))
        return;
    if (!channelIds().includes(message.channelId))
        return;
    if (message.channel.isThread() || message.hasThread)
        return;
    if (!messageQualifiesForAutoThread(message)) {
        if (deleteNonQualifyingMessagesEnabled()) {
            await deleteNonQualifyingMessage(message);
        }
        return;
    }
    const content = message.content ?? "";
    const name = buildThreadName(resolveDisplayName(message.member instanceof GuildMember ? message.member : null, message.author), stripUrls(content), {
        guild: message.guild,
        client: message.client,
        message,
    });
    await startAndPopulateCommentsThread(message, {
        name,
        logPrefix: `[${NAMESPACE}]`,
        authorUserId: message.author.id,
        firstMessage: data().threadFirstMessage,
    });
}
//# sourceMappingURL=handlers.js.map