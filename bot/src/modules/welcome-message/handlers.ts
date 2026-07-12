import { AttachmentBuilder, type GuildMember } from "discord.js";
import { format } from "../../../../shared/core/texts.js";
import { trySendDm } from "../../lib/core/discordDm.js";
import { renderWelcomeCard } from "./card.js";
import {
  rulesChannelLink,
  texts,
  welcomeChannelId,
} from "../../lib/modules/welcome-message/config-io.js";

export async function handleMemberAdd(member: GuildMember): Promise<void> {
  const channelId = welcomeChannelId();
  if (!channelId) return;

  const channel = await member.client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased() || !channel.isSendable()) {
    console.warn(
      `[welcome-message] Welcome channel ${channelId} is missing or not sendable; skipping.`,
    );
    return;
  }

  const mention = `<@${member.id}>`;
  const t = texts();
  const welcomeContent = format(t.welcomeContent, { mention });

  let files: AttachmentBuilder[] | undefined;
  try {
    const avatarUrl = member.displayAvatarURL({ extension: "png", size: 256 });
    const card = await renderWelcomeCard({
      avatarUrl,
      displayName: member.displayName,
    });
    files = [new AttachmentBuilder(card, { name: "welcome.png" })];
  } catch (err) {
    console.warn(
      "[welcome-message] Welcome card render failed; sending text-only welcome:",
      err,
    );
  }

  await channel.send({
    content: welcomeContent,
    files,
    allowedMentions: { users: [member.id] },
  });

  const rulesChannel = rulesChannelLink(member.guild.id);
  const rulesMessage = format(t.rulesMessage, { rulesChannel });
  await trySendDm(member.user, rulesMessage, {
    logPrefix: "[welcome-message]",
    onOtherError: "throw",
    onDmClosed: async () => {
      await channel.send({
        content: format(t.rulesChannelFallback, { mention, rulesChannel }),
        allowedMentions: { users: [member.id] },
      });
    },
  });
}
