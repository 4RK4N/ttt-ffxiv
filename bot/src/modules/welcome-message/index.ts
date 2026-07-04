import {
  AttachmentBuilder,
  DiscordAPIError,
  Events,
  type Client,
  type GuildMember,
} from 'discord.js';
import type { CommandModule } from '../../moduleLoader.js';
import { format, isModuleEnabled } from '../../../../shared/core/texts.js';
import { renderWelcomeCard } from './card.js';
import {
  NAMESPACE,
  rulesChannelLink,
  texts,
  welcomeChannelId,
} from '../../../../shared/modules/welcome-message/config-io.js';

// Discord error code returned when a user's DMs are closed to the bot.
const CANNOT_SEND_DM = 50007;

async function sendRulesDM(
  member: GuildMember,
  rulesMessage: string,
  fallbackToChannel: () => Promise<void>
): Promise<void> {
  try {
    await member.send(rulesMessage);
  } catch (err) {
    if (err instanceof DiscordAPIError && err.code === CANNOT_SEND_DM) {
      console.warn(
        `[welcome-message] Could not DM ${member.user.tag} (DMs closed); falling back to channel.`
      );
      await fallbackToChannel();
      return;
    }
    throw err;
  }
}

async function handleMemberAdd(member: GuildMember): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;

  const channelId = welcomeChannelId();
  if (!channelId) return;

  const channel = await member.client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased() || !channel.isSendable()) {
    console.warn(
      `[welcome-message] Welcome channel ${channelId} is missing or not sendable; skipping.`
    );
    return;
  }

  const mention = `<@${member.id}>`;
  const t = texts();
  const welcomeContent = format(t.welcomeContent, { mention });

  let files: AttachmentBuilder[] | undefined;
  try {
    const avatarUrl = member.displayAvatarURL({ extension: 'png', size: 256 });
    const card = await renderWelcomeCard({ avatarUrl, displayName: member.displayName });
    files = [new AttachmentBuilder(card, { name: 'welcome.png' })];
  } catch (err) {
    console.warn('[welcome-message] Welcome card render failed; sending text-only welcome:', err);
  }

  await channel.send({
    content: welcomeContent,
    files,
    allowedMentions: { users: [member.id] },
  });

  const rulesChannel = rulesChannelLink(member.guild.id);
  const rulesMessage = format(t.rulesMessage, { rulesChannel });
  try {
    await sendRulesDM(member, rulesMessage, async () => {
      await channel.send({
        content: format(t.rulesChannelFallback, { mention, rulesChannel }),
        allowedMentions: { users: [member.id] },
      });
    });
  } catch (err) {
    console.error('[welcome-message] Failed to deliver rules message:', err);
  }
}

const welcomeMessageModule: CommandModule = {
  name: NAMESPACE,
  init(client: Client): void {
    if (!welcomeChannelId()) {
      console.warn(
        '[welcome-message] No channelId configured in ' +
        'data/welcome-message/config.json; welcome messages are disabled.'
      );
      return;
    }

    client.on(Events.GuildMemberAdd, (member) => {
      void handleMemberAdd(member).catch((err) => {
        console.error('[welcome-message] Unhandled error:', err);
      });
    });
  },
};

export default welcomeMessageModule;
