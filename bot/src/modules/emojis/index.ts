import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { CommandModule } from "../../moduleLoader.js";
import { deferEphemeral } from "../../lib/core/discordInteractions.js";
import { NAMESPACE } from "../../lib/modules/emojis/config-io.js";
import { executeEmojiAdd, executeEmojiCopy } from "./handlers.js";

const emojiAddCommand = {
  data: new SlashCommandBuilder()
    .setName("emoji-add")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
    .setDescription("Add a custom emoji to this server from an image.")
    .addAttachmentOption((opt) =>
      opt
        .setName("image")
        .setDescription("Image file (PNG, JPEG, GIF, or WebP; max 256 KiB).")
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("name")
        .setDescription("Emoji name (2–32 letters, numbers, underscores).")
        .setRequired(true),
    ),
  execute: (interaction: ChatInputCommandInteraction) =>
    deferEphemeral(interaction, executeEmojiAdd),
};

const emojiCopyCommand = {
  data: new SlashCommandBuilder()
    .setName("emoji-copy")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
    .setDescription("Copy a custom emoji from another server into this server.")
    .addStringOption((opt) =>
      opt
        .setName("emoji")
        .setDescription("Custom emoji to copy (paste or pick from emoji menu).")
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("name")
        .setDescription(
          "Emoji name on this server (2–32 letters, numbers, underscores).",
        )
        .setRequired(true),
    ),
  execute: (interaction: ChatInputCommandInteraction) =>
    deferEphemeral(interaction, executeEmojiCopy),
};

const emojisModule: CommandModule = {
  name: NAMESPACE,
  commands: [emojiAddCommand, emojiCopyCommand],
};

export default emojisModule;
