import {
  SlashCommandBuilder,
  AttachmentBuilder,
  GuildMember,
  type ChatInputCommandInteraction,
  type Attachment,
  type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import type { CommandModule } from '../../core/moduleLoader.js';
import {
  buildThreadName,
  DEFAULT_THREAD_FIRST_MESSAGE,
  THREAD_AUTO_ARCHIVE_MINUTES,
} from '../../core/threads.js';
import { format, getTexts } from '../../core/texts.js';

const MAX_IMAGES = 10; // Discord allows up to 10 attachments per message.

interface PicTexts {
  noImages: string;
  notImages: string;
  downloadFailed: string;
  cannotPost: string;
  postFailed: string;
  attribution: string;
  postedSuccess: string;
  threadNote: string;
  threadFirstMessage: string;
}

// Code defaults; data/pic-repost-commands/texts.json overrides these.
const DEFAULTS: PicTexts = {
  noImages: 'You need to attach at least one image.',
  notImages: 'These attachments are not images: {names}. Please attach image files only.',
  downloadFailed:
    'Could not download one of your images. Please try again with a smaller or different file.',
  cannotPost: 'I cannot post in this channel.',
  postFailed:
    'I could not post in this channel. This is usually a file size limit or missing ' +
    '"Send Messages"/"Attach Files" permission.',
  attribution: '{message}\n\nby {mention}',
  postedSuccess: 'Posted {count} {images} to this channel.',
  threadNote:
    '\n\nNote: I could not create the comments thread. I may be missing the ' +
    '"Create Public Threads" / "Send Messages in Threads" permission in this channel.',
  threadFirstMessage: DEFAULT_THREAD_FIRST_MESSAGE,
};

function texts(): PicTexts {
  return getTexts('pic-repost-commands', DEFAULTS);
}

/**
 * Builds a slash command with a required `message` and image1..image10 options.
 * Used to create both `/pic` and its `/post` alias from one definition.
 */
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

/**
 * Shared handler for `/pic` and `/post`. Downloads the provided image attachments
 * and re-uploads them as the bot in the same channel, attributed to the author.
 */
async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const t = texts();
  const message = interaction.options.getString('message', true);

  // Prefer the user's server nickname, then their global display name, then the
  // raw username only as a last resort.
  const displayName =
    (interaction.member instanceof GuildMember ? interaction.member.displayName : undefined) ??
    interaction.user.displayName ??
    interaction.user.username;

  // Collect provided attachments in order (image1..image10).
  const attachments: Attachment[] = [];
  for (let i = 1; i <= MAX_IMAGES; i++) {
    const attachment = interaction.options.getAttachment(`image${i}`);
    if (attachment) attachments.push(attachment);
  }

  if (attachments.length === 0) {
    await interaction.editReply(t.noImages);
    return;
  }

  // Validate everything is an image before uploading anything.
  const nonImages = attachments.filter(
    (a) => !(a.contentType && a.contentType.startsWith('image/'))
  );
  if (nonImages.length > 0) {
    await interaction.editReply(
      format(t.notImages, { names: nonImages.map((a) => a.name).join(', ') })
    );
    return;
  }

  // Re-upload the bytes. Original attachment URLs are signed and expire, so we
  // must download and send fresh files rather than linking the originals.
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

  // The mention renders as the author's server display name (nickname) and is
  // clickable; allowedMentions suppresses the ping.
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

  // Start a comments thread on the post. Non-fatal: the images are already
  // posted, so a thread failure (e.g. missing thread permissions) shouldn't
  // fail the whole command.
  let threadFailed = false;
  try {
    const thread = await sent.startThread({
      name: buildThreadName(displayName, message),
      autoArchiveDuration: THREAD_AUTO_ARCHIVE_MINUTES,
    });

    // Add the command author to the thread first so they follow the discussion.
    // Isolated so a failure here doesn't flag the (already created) thread as failed.
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
  name: 'pic-repost-commands',
  commands: [
    { data: buildCommand('pic'), execute },
    { data: buildCommand('post'), execute }, // alias of /pic
  ],
};

export default picRepostModule;
