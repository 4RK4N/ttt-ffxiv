import {
  SlashCommandBuilder,
  AttachmentBuilder,
  GuildMember,
  MessageFlags,
  type ChatInputCommandInteraction,
  type Attachment,
  type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import type { CommandModule } from '../../core/moduleLoader.js';
import {
  buildThreadName,
  THREAD_AUTO_ARCHIVE_MINUTES,
} from '../../core/threads.js';
import { format, isModuleEnabled } from '../../core/texts.js';
import { NAMESPACE, texts } from './types.js';

const MAX_IMAGES = 10;

function buildCommand(name: string): SlashCommandOptionsOnlyBuilder {
  const builder = new SlashCommandBuilder()
    .setName(name)
    .setDescription('Re-post your images to this channel with attribution (avoids false auto-mod bans).')
    .addStringOption((opt) =>
      opt.setName('message').setDescription('Text to include with your images.').setRequired(true)
    );

  for (let i = 1; i <= MAX_IMAGES; i++) {
    builder.addAttachmentOption((opt) =>
      opt
        .setName(`image${i}`)
        .setDescription(i === 1 ? 'Image to post (required).' : `Additional image ${i} (optional).`)
        .setRequired(i === 1)
    );
  }

  return builder;
}

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    await interaction.editReply(t.disabled);
    return;
  }

  const message = interaction.options.getString('message', true);

  const displayName =
    (interaction.member instanceof GuildMember ? interaction.member.displayName : undefined) ??
    interaction.user.displayName ??
    interaction.user.username;

  const attachments: Attachment[] = [];
  for (let i = 1; i <= MAX_IMAGES; i++) {
    const attachment = interaction.options.getAttachment(`image${i}`);
    if (attachment) attachments.push(attachment);
  }

  if (attachments.length === 0) {
    await interaction.editReply(t.noImages);
    return;
  }

  const nonImages = attachments.filter(
    (a) => !(a.contentType && a.contentType.startsWith('image/'))
  );
  if (nonImages.length > 0) {
    await interaction.editReply(
      format(t.notImages, { names: nonImages.map((a) => a.name).join(', ') })
    );
    return;
  }

  let files: AttachmentBuilder[];
  try {
    files = await Promise.all(
      attachments.map(async (attachment) => {
        const res = await fetch(attachment.url);
        if (!res.ok) {
          throw new Error(`Failed to download "${attachment.name}" (HTTP ${res.status}).`);
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        return new AttachmentBuilder(buffer, { name: attachment.name });
      })
    );
  } catch (err) {
    console.error('Failed to download attachment(s):', err);
    await interaction.editReply(t.downloadFailed);
    return;
  }

  const content = format(t.attribution, { message, mention: `<@${interaction.user.id}>` });

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
  } catch (err) {
    console.error('Failed to post images to channel:', err);
    await interaction.editReply(t.postFailed);
    return;
  }

  let threadFailed = false;
  try {
    const thread = await sent.startThread({
      name: buildThreadName(displayName, message, {
        guild: interaction.guild,
        client: interaction.client,
      }),
      autoArchiveDuration: THREAD_AUTO_ARCHIVE_MINUTES,
    });

    try {
      await thread.members.add(interaction.user.id);
    } catch (err) {
      console.error('Failed to add author to comments thread:', err);
    }

    await thread.send(t.threadFirstMessage);
  } catch (err) {
    threadFailed = true;
    console.error('Failed to create comments thread:', err);
  }

  const success = format(t.postedSuccess, {
    count: files.length,
    images: files.length === 1 ? 'image' : 'images',
  });
  await interaction.editReply(success + (threadFailed ? t.threadNote : ''));
}

const picRepostModule: CommandModule = {
  name: NAMESPACE,
  commands: [
    { data: buildCommand('pic'), execute },
    { data: buildCommand('post'), execute },
  ],
};

export default picRepostModule;
