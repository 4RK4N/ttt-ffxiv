import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';

const MAX_IMAGES = 10; // Discord allows up to 10 attachments per message.

const THREAD_NAME_MAX = 100; // Discord's hard limit for thread names.
const THREAD_FIRST_MESSAGE =
  'Please comment here in the thread to not clutter the channel.\n\n' +
  'Bitte hier im Thread kommentieren um nicht den Channel zu überlasten.';
const THREAD_AUTO_ARCHIVE_MINUTES = 10080; // 7 days

// Custom (server) emoji are sent as "<:name:id>" or "<a:name:id>". They render as
// literal text in thread names, so we strip them. Standard unicode emoji are kept.
const CUSTOM_EMOJI_REGEX = /<a?:\w+:\d+>/g;

/**
 * Derives a thread name in the form "@name - message": strips custom emoji,
 * collapses whitespace to a single line, and truncates to Discord's limit,
 * appending "..." when truncated.
 * Note: thread names are plain text, so "@name" is literal (not a real mention).
 */
function buildThreadName(authorName, message) {
  const oneLine = `@${authorName} - ${message}`
    .replace(CUSTOM_EMOJI_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (oneLine.length <= THREAD_NAME_MAX) return oneLine;
  return oneLine.slice(0, THREAD_NAME_MAX - 3) + '...';
}

/**
 * Builds a slash command with a required `message` and image1..image10 options.
 * Used to create both `/pic` and its `/post` alias from one definition.
 */
function buildCommand(name) {
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
async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const message = interaction.options.getString('message', true);

  // Prefer the user's server nickname, then their global display name, then the
  // raw username only as a last resort.
  const displayName =
    interaction.member?.displayName ??
    interaction.user.displayName ??
    interaction.user.username;

  // Collect provided attachments in order (image1..image10).
  const attachments = [];
  for (let i = 1; i <= MAX_IMAGES; i++) {
    const attachment = interaction.options.getAttachment(`image${i}`);
    if (attachment) attachments.push(attachment);
  }

  if (attachments.length === 0) {
    await interaction.editReply('You need to attach at least one image.');
    return;
  }

  // Validate everything is an image before uploading anything.
  const nonImages = attachments.filter(
    (a) => !(a.contentType && a.contentType.startsWith('image/'))
  );
  if (nonImages.length > 0) {
    await interaction.editReply(
      `These attachments are not images: ${nonImages.map((a) => a.name).join(', ')}. ` +
      'Please attach image files only.'
    );
    return;
  }

  // Re-upload the bytes. Original attachment URLs are signed and expire, so we
  // must download and send fresh files rather than linking the originals.
  let files;
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
    await interaction.editReply(
      'Could not download one of your images. Please try again with a smaller or different file.'
    );
    return;
  }

  // The mention renders as the author's server display name (nickname) and is
  // clickable; allowedMentions suppresses the ping.
  const content = `${message}\n\nby <@${interaction.user.id}>`;

  let sent;
  try {
    sent = await interaction.channel.send({
      content,
      files,
      allowedMentions: { users: [] },
    });
  } catch (err) {
    console.error('Failed to post images to channel:', err);
    await interaction.editReply(
      'I could not post in this channel. This is usually a file size limit or missing ' +
      '"Send Messages"/"Attach Files" permission.'
    );
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

    await thread.send(THREAD_FIRST_MESSAGE);
  } catch (err) {
    threadFailed = true;
    console.error('Failed to create comments thread:', err);
  }

  await interaction.editReply(
    `Posted ${files.length} image${files.length === 1 ? '' : 's'} to this channel.` +
    (threadFailed
      ? '\n\nNote: I could not create the comments thread. I may be missing the ' +
      '"Create Public Threads" / "Send Messages in Threads" permission in this channel.'
      : '')
  );
}

export default {
  name: 'pic',
  commands: [
    { data: buildCommand('pic'), execute },
    { data: buildCommand('post'), execute }, // alias of /pic
  ],
};
