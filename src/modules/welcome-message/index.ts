import {
  AttachmentBuilder,
  DiscordAPIError,
  Events,
  type Client,
  type GuildMember,
} from 'discord.js';
import type { CommandModule } from '../../core/moduleLoader.js';
import { format, getConfig, getTexts, isModuleEnabled } from '../../core/texts.js';
import { renderWelcomeCard } from './card.js';

const NAMESPACE = 'welcome-message';

interface WelcomeTexts {
  rulesMessage: string;
  welcomeContent: string;
  rulesChannelFallback: string;
}

interface WelcomeConfig {
  // Channel where the welcome card is posted when a member joins. Empty disables it.
  channelId: string;
  // Channel linked from the rules message via the {rulesChannel} token.
  rulesChannelId: string;
}

const CONFIG_DEFAULTS: WelcomeConfig = {
  channelId: '',
  rulesChannelId: '',
};

function config(): WelcomeConfig {
  return getConfig(NAMESPACE, CONFIG_DEFAULTS);
}

function welcomeChannelId(): string | undefined {
  const id = config().channelId.trim();
  return id === '' ? undefined : id;
}

/**
 * Renders the {rulesChannel} token: a clickable Discord channel link built from
 * the guild and configured rules channel, or an empty string when unset.
 */
function rulesChannelLink(guildId: string): string {
  const id = config().rulesChannelId.trim();
  if (id === '') return '';
  return `https://discord.com/channels/${guildId}/${id}`;
}

// Code defaults; data/welcome-message/texts.json overrides these (editable source
// of truth). The discord.com channel link renders as a clickable channel mention.
const DEFAULTS: WelcomeTexts = {
  rulesMessage: [
    '🇬🇧 English',
    'Have a great time here in **Tiny Temptation Tubs**',
    'Please head over to {rulesChannel}',
    ' and accept them to completely unlock the server for you (except NSFW that is optional).',
    '',
    '🇩🇪 Deutsch',
    'Viel Spass im **Tiny Temptation Tubs**',
    'Bitte lies dir die Regeln in {rulesChannel}',
    ' durch und akzeptiere diese um den Server vollständig freizuschalten für dich (ausser NSFW dies ist optional).',
  ].join('\n'),
  welcomeContent: 'Welcome {mention}',
  rulesChannelFallback: '{mention}\n\n{rules}',
};

function texts(): WelcomeTexts {
  return getTexts(NAMESPACE, DEFAULTS);
}

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
  // Master switch (web editor toggle); disabled means do nothing.
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
  const t = texts();
  const rulesMessage = format(t.rulesMessage, { rulesChannel: rulesChannelLink(member.guild.id) });
  try {
    await sendRulesDM(member, rulesMessage, async () => {
      await channel.send({
        content: format(t.rulesChannelFallback, { mention, rules: rulesMessage }),
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
