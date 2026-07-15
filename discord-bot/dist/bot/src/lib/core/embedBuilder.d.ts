import { EmbedBuilder } from "discord.js";
export interface EmbedAuthorOptions {
    name: string;
    iconURL?: string;
}
export interface BuildEmbedOptions {
    /** Required embed body. */
    description: string;
    title?: string;
    author?: EmbedAuthorOptions;
    footer?: string;
    timestamp?: Date | number;
}
/**
 * Builds a project-standard embed: description required; title, author, footer,
 * and timestamp optional. Never sets color, thumbnail, or image.
 */
export declare function buildEmbed(options: BuildEmbedOptions): EmbedBuilder;
/** Plain content when short enough; otherwise a single description embed. */
export declare function buildTextOrEmbedPayload(text: string): {
    content: string;
} | {
    embeds: EmbedBuilder[];
};
//# sourceMappingURL=embedBuilder.d.ts.map