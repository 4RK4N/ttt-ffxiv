import {
  DiscordAPIError,
  GuildMember,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type Guild,
  type GuildEmoji,
} from "discord.js";
import {
  customEmojiCdnUrl,
  isAnimatedCustomEmojiMarkup,
  isCustomEmojiMarkup,
  isValidGuildEmojiName,
  parseEmoji,
} from "../../../../shared/core/discordEmoji.js";
import { isSupportedEmojiImageBuffer } from "../../../../shared/core/imageBuffer.js";
import { isImageAttachment } from "../../../../shared/core/attachments.js";
import { DISCORD_EMOJI_MAX_BYTES } from "../../../../shared/core/limits.js";
import { format, isModuleEnabled } from "../../../../shared/core/texts.js";
import { fetchBuffer } from "../../lib/core/download.js";
import {
  NAMESPACE,
  emojiRoleId,
  texts,
} from "../../lib/modules/emojis/config-io.js";
import type { EmojisTexts } from "../../lib/modules/emojis/types.js";
import { canEmojiOrAdmin } from "./permissions.js";

type CreateErrorKey = keyof Pick<
  EmojisTexts,
  | "nameTaken"
  | "fileTooLarge"
  | "botMissingPermission"
  | "slotsFull"
  | "createFailed"
>;

async function downloadImage(url: string): Promise<Buffer | null> {
  return fetchBuffer(url, `[${NAMESPACE}]`);
}

function attachmentPayload(buffer: Buffer, animated: boolean): Buffer | string {
  if (!animated) return buffer;
  return `data:image/gif;base64,${buffer.toString("base64")}`;
}

export function mapCreateError(err: unknown): CreateErrorKey {
  if (err instanceof DiscordAPIError) {
    if (err.code === 50013) return "botMissingPermission";
    if (err.code === 30008 || err.code === 30018) return "slotsFull";
    const message = err.message.toLowerCase();
    if (
      message.includes("already exists") ||
      message.includes("name is already taken")
    ) {
      return "nameTaken";
    }
    if (message.includes("too large") || message.includes("256")) {
      return "fileTooLarge";
    }
  }
  return "createFailed";
}

async function createGuildEmoji(
  guild: Guild,
  buffer: Buffer,
  name: string,
  animated: boolean,
): Promise<{ emoji?: GuildEmoji; error?: CreateErrorKey }> {
  const me = guild.members.me;
  if (!me?.permissions.has(PermissionFlagsBits.ManageGuildExpressions)) {
    return { error: "botMissingPermission" };
  }

  try {
    const emoji = await guild.emojis.create({
      attachment: attachmentPayload(buffer, animated),
      name,
    });
    return { emoji };
  } catch (err) {
    console.error(`[${NAMESPACE}] Failed to create emoji "${name}":`, err);
    return { error: mapCreateError(err) };
  }
}

function resolveMember(
  interaction: ChatInputCommandInteraction,
): GuildMember | null {
  return interaction.member instanceof GuildMember ? interaction.member : null;
}

async function guardInteraction(
  interaction: ChatInputCommandInteraction,
): Promise<EmojisTexts | null> {
  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    await interaction.editReply(t.disabled);
    return null;
  }

  if (!interaction.guild) {
    await interaction.editReply(t.createFailed);
    return null;
  }

  const member = resolveMember(interaction);
  if (!member) {
    await interaction.editReply(t.createFailed);
    return null;
  }

  const roleId = emojiRoleId();
  if (!canEmojiOrAdmin(member, roleId)) {
    await interaction.editReply(t.noPermission);
    return null;
  }

  return t;
}

export async function validateName(
  interaction: ChatInputCommandInteraction,
  t: EmojisTexts,
  name: string,
): Promise<boolean> {
  if (!isValidGuildEmojiName(name)) {
    await interaction.editReply(t.invalidName);
    return false;
  }

  if (interaction.guild!.emojis.cache.some((emoji) => emoji.name === name)) {
    await interaction.editReply(t.nameTaken);
    return false;
  }

  return true;
}

async function createFromBuffer(
  interaction: ChatInputCommandInteraction,
  t: EmojisTexts,
  buffer: Buffer,
  name: string,
  animated: boolean,
): Promise<void> {
  const imageCheck = isSupportedEmojiImageBuffer(buffer);
  if (!imageCheck.ok) {
    await interaction.editReply(t.notImage);
    return;
  }

  if (buffer.byteLength > DISCORD_EMOJI_MAX_BYTES) {
    await interaction.editReply(t.fileTooLarge);
    return;
  }

  const result = await createGuildEmoji(
    interaction.guild!,
    buffer,
    name,
    imageCheck.animated || animated,
  );
  if (result.error) {
    await interaction.editReply(t[result.error]);
    return;
  }

  await interaction.editReply(
    format(t.addedSuccess, { emoji: result.emoji!.toString() }),
  );
}

export async function executeEmojiAdd(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const t = await guardInteraction(interaction);
  if (!t) return;

  const name = interaction.options.getString("name", true);
  if (!(await validateName(interaction, t, name))) return;

  const attachment = interaction.options.getAttachment("image", true);
  if (!isImageAttachment(attachment.contentType)) {
    await interaction.editReply(t.notImage);
    return;
  }

  if (attachment.size > DISCORD_EMOJI_MAX_BYTES) {
    await interaction.editReply(t.fileTooLarge);
    return;
  }

  const animated = attachment.contentType === "image/gif";
  const buffer = await downloadImage(attachment.url);
  if (!buffer) {
    await interaction.editReply(t.downloadFailed);
    return;
  }

  await createFromBuffer(interaction, t, buffer, name, animated);
}

export async function executeEmojiCopy(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const t = await guardInteraction(interaction);
  if (!t) return;

  const name = interaction.options.getString("name", true);
  if (!(await validateName(interaction, t, name))) return;

  const emojiInput = interaction.options.getString("emoji", true);
  if (!isCustomEmojiMarkup(emojiInput)) {
    await interaction.editReply(t.notCustomEmoji);
    return;
  }

  const parsed = parseEmoji(emojiInput);
  if (!parsed?.id) {
    await interaction.editReply(t.notCustomEmoji);
    return;
  }

  const animated = isAnimatedCustomEmojiMarkup(emojiInput);
  const buffer = await downloadImage(customEmojiCdnUrl(parsed.id, animated));
  if (!buffer) {
    await interaction.editReply(t.downloadFailed);
    return;
  }

  await createFromBuffer(interaction, t, buffer, name, animated);
}
