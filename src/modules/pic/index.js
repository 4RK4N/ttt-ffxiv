import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';

const MAX_IMAGES = 10; // Discord allows up to 10 attachments per message.

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

  const content = `${message}\n\nby <@${interaction.user.id}>`;

  try {
    await interaction.channel.send({
      content,
      files,
      // Render the mention as the username without sending a ping.
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

  await interaction.editReply(
    `Posted ${files.length} image${files.length === 1 ? '' : 's'} to this channel.`
  );
}

export default {
  name: 'pic',
  commands: [
    { data: buildCommand('pic'), execute },
    { data: buildCommand('post'), execute }, // alias of /pic
  ],
};
