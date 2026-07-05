import { EmbedBuilder } from "discord.js";

const MAX_TITLE = 256;
const MAX_DESCRIPTION = 4096;
const MAX_FOOTER = 2048;

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
export function buildEmbed(options: BuildEmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder().setDescription(
    options.description.slice(0, MAX_DESCRIPTION),
  );

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
