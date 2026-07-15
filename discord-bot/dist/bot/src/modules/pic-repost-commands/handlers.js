import { AttachmentBuilder, GuildMember, MessageFlags, } from "discord.js";
import { buildThreadName, startAndPopulateCommentsThread, } from "../../lib/core/threads.js";
import { format } from "#shared/core/texts.js";
import { guardEnabledSlash } from "../../lib/core/discordInteractions.js";
import { resolveDisplayName } from "../../lib/core/memberDisplayNames.js";
import { fetchBuffer } from "../../lib/core/download.js";
import { isImageAttachment } from "#shared/core/attachments.js";
import { DISCORD_MESSAGE_CONTENT_MAX, DISCORD_REQUEST_ENTITY_TOO_LARGE, guildUploadLimitBytes, } from "#shared/core/limits.js";
import { NAMESPACE, data, resolveDeleteEmoji, } from "../../lib/modules/pic-repost-commands/config-io.js";
const MAX_IMAGES = 10;
/** True when a channel.send rejection is Discord's payload-too-large error. */
function isTooLargeError(err) {
    if (!err || typeof err !== "object")
        return false;
    const { code, status } = err;
    return code === DISCORD_REQUEST_ENTITY_TOO_LARGE || status === 413;
}
export async function executePicRepost(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const t = data();
    if (!(await guardEnabledSlash(interaction, NAMESPACE, t.disabled)))
        return;
    const message = interaction.options.getString("message", true);
    if (message.length > DISCORD_MESSAGE_CONTENT_MAX) {
        await interaction.editReply(t.messageTooLong);
        return;
    }
    const displayName = resolveDisplayName(interaction.member instanceof GuildMember ? interaction.member : null, interaction.user);
    const attachments = [];
    for (let i = 1; i <= MAX_IMAGES; i++) {
        const attachment = interaction.options.getAttachment(`image${i}`);
        if (attachment)
            attachments.push(attachment);
    }
    if (attachments.length === 0) {
        await interaction.editReply(t.noImages);
        return;
    }
    const nonImages = attachments.filter((a) => !isImageAttachment(a.contentType));
    if (nonImages.length > 0) {
        await interaction.editReply(format(t.notImages, { names: nonImages.map((a) => a.name).join(", ") }));
        return;
    }
    const maxBytes = guildUploadLimitBytes(interaction.guild?.premiumTier);
    const limitLabel = `${Math.floor(maxBytes / (1024 * 1024))} MB`;
    const oversized = attachments.filter((a) => a.size > maxBytes);
    if (oversized.length > 0) {
        await interaction.editReply(format(t.attachmentTooLarge, {
            names: oversized.map((a) => a.name).join(", "),
            limit: limitLabel,
        }));
        return;
    }
    let files;
    try {
        files = await Promise.all(attachments.map(async (attachment) => {
            const buffer = await fetchBuffer(attachment.url, `[${NAMESPACE}]`);
            if (!buffer) {
                throw new Error(`Failed to download "${attachment.name}".`);
            }
            return new AttachmentBuilder(buffer, { name: attachment.name });
        }));
    }
    catch (err) {
        console.error(`[${NAMESPACE}] Failed to download attachment(s):`, err);
        await interaction.editReply(t.downloadFailed);
        return;
    }
    const content = format(t.attribution, {
        message,
        mention: `<@${interaction.user.id}>`,
        deleteEmoji: resolveDeleteEmoji(data()),
    });
    if (!interaction.channel || !interaction.channel.isSendable()) {
        await interaction.editReply(t.cannotPost);
        return;
    }
    let sent;
    try {
        sent = await interaction.channel.send({
            content,
            files,
            allowedMentions: { users: [] },
        });
    }
    catch (err) {
        console.error(`[${NAMESPACE}] Failed to post images to channel:`, err);
        if (isTooLargeError(err)) {
            await interaction.editReply(format(t.attachmentTooLarge, {
                names: attachments.map((a) => a.name).join(", "),
                limit: limitLabel,
            }));
        }
        else {
            await interaction.editReply(t.postFailed);
        }
        return;
    }
    const threadOk = await startAndPopulateCommentsThread(sent, {
        name: buildThreadName(displayName, message, {
            guild: interaction.guild,
            client: interaction.client,
        }),
        logPrefix: `[${NAMESPACE}]`,
        authorUserId: interaction.user.id,
        firstMessage: t.threadFirstMessage,
    });
    const threadFailed = !threadOk;
    const success = format(t.postedSuccess, {
        count: files.length,
        images: files.length === 1 ? "image" : "images",
    });
    await interaction.editReply(success + (threadFailed ? t.threadNote : ""));
}
//# sourceMappingURL=handlers.js.map