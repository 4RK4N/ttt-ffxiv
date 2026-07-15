import { EmbedBuilder } from "discord.js";
import { DISCORD_MESSAGE_CONTENT_MAX } from "#shared/core/limits.js";
const MAX_TITLE = 256;
const MAX_DESCRIPTION = 4096;
const MAX_FOOTER = 2048;
/**
 * Builds a project-standard embed: description required; title, author, footer,
 * and timestamp optional. Never sets color, thumbnail, or image.
 */
export function buildEmbed(options) {
    const embed = new EmbedBuilder().setDescription(options.description.slice(0, MAX_DESCRIPTION));
    if (options.title) {
        embed.setTitle(options.title.slice(0, MAX_TITLE));
    }
    if (options.author) {
        embed.setAuthor({
            name: options.author.name.slice(0, MAX_TITLE),
            iconURL: options.author.iconURL,
        });
    }
    if (options.footer) {
        embed.setFooter({ text: options.footer.slice(0, MAX_FOOTER) });
    }
    if (options.timestamp !== undefined) {
        embed.setTimestamp(options.timestamp);
    }
    return embed;
}
/** Plain content when short enough; otherwise a single description embed. */
export function buildTextOrEmbedPayload(text) {
    if (text.length <= DISCORD_MESSAGE_CONTENT_MAX) {
        return { content: text };
    }
    return { embeds: [buildEmbed({ description: text })] };
}
//# sourceMappingURL=embedBuilder.js.map