import {
  AttachmentBuilder,
  DiscordAPIError,
  Events,
  type Client,
  type GuildMember,
} from 'discord.js';
import { config } from '../../config.js';
import type { CommandModule } from '../../core/moduleLoader.js';
import { format, getTexts } from '../../core/texts.js';
import { renderWelcomeCard } from './card.js';

interface WelcomeTexts {
  rulesMessage: string;
  welcomeContent: string;
  rulesChannelFallback: string;
}

// Code defaults; data/welcome-message/texts.json overrides these (editable source
// of truth). The discord.com channel link renders as a clickable channel mention.
const DEFAULTS: WelcomeTexts = {
  rulesMessage: [
    '🇬🇧 English',
    'Have a great time here in **Tiny Temptation Tubs**',
    'Please head over to https://discord.com/channels/1463307473552146434/1463322047039144009',
    ' and accept them to completely unlock the server for you (except NSFW that is optional).',
    '',
    '🇩🇪 Deutsch',
    'Viel Spass im **Tiny Temptation Tubs**',
    'Bitte lies dir die Regeln in https://discord.com/channels/1463307473552146434/1463322047039144009',
    ' durch und akzeptiere diese um den Server vollständig freizuschalten für dich (ausser NSFW dies ist optional).',
  ].join('\n'),
  welcomeContent: 'Welcome {mention}',
  rulesChannelFallback: '{mention}\n\n{rules}',
};

function texts(): WelcomeTexts {
  return getTexts('welcome-message', DEFAULTS);
}

// Discord error code returned when a user's DMs are closed to the bot.
const CANNOT_SEND_DM = 50007;

async function sendRulesDM(member: GuildMember, fallbackToChannel: () => Promise<void>): Promise<void> {
  try {
    await member.send(texts().rulesMessage);
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
  const channelId = config.welcomeChannelId;
  if (!channelId) return;

  const channel = await member.client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased() || !channel.isSendable()) {
    console.warn(
      `[welcome-message] Welcome channel ${channelId} is missing or not sendable; skipping.`
    );
    return;
  }

  const avatarUrl = member.displayAvatarURL({ extension: 'png', size: 256 });
  const card = await renderWelcomeCard({ avatarUrl, displayName: member.displayName });
  const attachment = new AttachmentBuilder(card, { name: 'welcome.png' });

  const mention = `<@${member.id}>`;

  await channel.send({
    content: format(texts().welcomeContent, { mention }),
    files: [attachment],
    allowedMentions: { users: [member.id] },
  });

  // Rules message: DM first, fall back to a normal channel message if DMs are closed.
  // Isolated so a DM failure never affects the welcome image post above.
  try {
    await sendRulesDM(member, async () => {
      const t = texts();
      await channel.send({
        content: format(t.rulesChannelFallback, { mention, rules: t.rulesMessage }),
        allowedMentions: { users: [member.id] },
      });
    });
  } catch (err) {
    console.error('[welcome-message] Failed to deliver rules message:', err);
  }
}

const welcomeMessageModule: CommandModule = {
  name: 'welcome-message',
  init(client: Client): void {
    if (!config.welcomeChannelId) {
      console.warn(
        '[welcome-message] No WELCOME_CHANNEL_ID configured; welcome messages are disabled.'
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
