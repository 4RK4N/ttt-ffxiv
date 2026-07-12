import {
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import type { CommandModule } from "../../moduleLoader.js";
import { NAMESPACE } from "../../lib/modules/pic-repost-commands/config-io.js";
import { registerDeleteReactionHandler } from "./handle-reaction.js";
import { executePicRepost } from "./handlers.js";

const MAX_IMAGES = 10;

function buildCommand(name: string): SlashCommandOptionsOnlyBuilder {
  const builder = new SlashCommandBuilder()
    .setName(name)
    .setDMPermission(false)
    .setDescription(
      "Re-post your images to this channel with attribution (avoids false auto-mod bans).",
    )
    .addStringOption((opt) =>
      opt
        .setName("message")
        .setDescription("Text to include with your images.")
        .setRequired(true),
    );

  for (let i = 1; i <= MAX_IMAGES; i++) {
    builder.addAttachmentOption((opt) =>
      opt
        .setName(`image${i}`)
        .setDescription(
          i === 1
            ? "Image to post (required)."
            : `Additional image ${i} (optional).`,
        )
        .setRequired(i === 1),
    );
  }

  return builder;
}

async function execute(
  interaction: Parameters<typeof executePicRepost>[0],
): Promise<void> {
  await executePicRepost(interaction);
}

const picRepostModule: CommandModule = {
  name: NAMESPACE,
  commands: [
    { data: buildCommand("pic"), execute },
    { data: buildCommand("post"), execute },
  ],
  init: registerDeleteReactionHandler,
};

export default picRepostModule;
