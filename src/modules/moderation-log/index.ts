import {
  Events,
  type Client,
  type EmbedBuilder,
  type GuildBan,
  type GuildMember,
  type Message,
  type PartialGuildMember,
  type PartialMessage,
  type TextBasedChannel,
  type TextChannel,
} from 'discord.js';
import type { CommandModule } from '../../core/moduleLoader.js';
import { getConfig, getTexts, isModuleEnabled } from '../../core/texts.js';
import { findRecentBan, findRecentKick, findRecentUnban } from './audit.js';
import {
  TEXT_DEFAULTS,
  buildMemberBannedEmbed,
  buildMemberKickedEmbed,
  buildMemberLeftEmbed,
  buildMemberUnbannedEmbed,
  buildMessageDeletedEmbed,
  resolveDeleteAuthor,
  type ModLogTexts,
} from './embeds.js';

const NAMESPACE = 'moderation-log';

interface ModLogConfig {
  channelId: string;
  logMessageDeleted: boolean;
  logMemberLeft: boolean;
  logMemberKicked: boolean;
  logMemberBanned: boolean;
  logMemberUnbanned: boolean;
}

const CONFIG_DEFAULTS: ModLogConfig = {
  channelId: '',
  logMessageDeleted: true,
  logMemberLeft: true,
  logMemberKicked: true,
  logMemberBanned: true,
  logMemberUnbanned: true,
};

/** User IDs recently banned — suppresses duplicate leave/kick logs. */
const recentBans = new Set<string>();
const BAN_DEDUPE_MS = 10_000;

function config(): ModLogConfig {
  return getConfig(NAMESPACE, CONFIG_DEFAULTS);
}

function texts(): ModLogTexts {
  return getTexts(NAMESPACE, TEXT_DEFAULTS);
}

function logChannelId(): string | undefined {
  const id = config().channelId.trim();
  return id === '' ? undefined : id;
}

function markRecentBan(userId: string): void {
  recentBans.add(userId);
  setTimeout(() => recentBans.delete(userId), BAN_DEDUPE_MS).unref();
}

function wasRecentBan(userId: string): boolean {
  return recentBans.has(userId);
}

async function postLog(client: Client, embed: EmbedBuilder): Promise<void> {
  const channelId = logChannelId();
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased() || channel.isDMBased()) {
    console.warn(`[moderation-log] Log channel "${channelId}" is not a guild text channel.`);
    return;
  }

  await (channel as TextChannel).send({ embeds: [embed] });
}

function isGuildTextChannel(channel: TextBasedChannel): boolean {
  return !channel.isDMBased() && 'guild' in channel && channel.guild !== null;
}

async function handleMessageDelete(
  message: Message | PartialMessage,
  bulkChannel?: TextBasedChannel
): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!config().logMessageDeleted) return;

  const logChannel = logChannelId();
  if (!logChannel) return;

  const sourceChannel = bulkChannel ?? message.channel;
  if (!sourceChannel?.isTextBased() || !isGuildTextChannel(sourceChannel)) return;
  if (sourceChannel.id === logChannel) return;

  const t = texts();
  const resolvedAuthor = resolveDeleteAuthor(t, message.author ?? null);
  const content = message.content ?? null;
  const timestamp = message.createdAt ?? new Date();

  const embed = buildMessageDeletedEmbed(
    t,
    resolvedAuthor,
    sourceChannel.id,
    message.id,
    content,
    timestamp
  );

  await postLog(message.client, embed);
}

async function handleMessageDeleteBulk(
  messages: ReadonlyMap<string, Message | PartialMessage>,
  channel: TextBasedChannel
): Promise<void> {
  for (const message of messages.values()) {
    await handleMessageDelete(message, channel);
  }
}

async function handleGuildBanAdd(ban: GuildBan): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!config().logMemberBanned) return;
  if (!logChannelId()) return;

  markRecentBan(ban.user.id);

  const audit = await findRecentBan(ban.guild, ban.user.id);
  const embed = buildMemberBannedEmbed(texts(), ban.user, new Date(), audit?.executorId ?? null);
  await postLog(ban.client, embed);
}

async function handleGuildBanRemove(ban: GuildBan): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!config().logMemberUnbanned) return;
  if (!logChannelId()) return;

  const audit = await findRecentUnban(ban.guild, ban.user.id);
  const embed = buildMemberUnbannedEmbed(texts(), ban.user, new Date(), audit?.executorId ?? null);
  await postLog(ban.client, embed);
}

async function handleGuildMemberRemove(member: GuildMember | PartialGuildMember): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!logChannelId()) return;
  if (wasRecentBan(member.id)) return;

  const user = member.user;
  if (!user) return;

  const cfg = config();
  const t = texts();
  const timestamp = new Date();

  const kickEntry =
    cfg.logMemberKicked || cfg.logMemberLeft
      ? await findRecentKick(member.guild, member.id)
      : null;

  if (kickEntry) {
    if (cfg.logMemberKicked) {
      await postLog(
        member.client,
        buildMemberKickedEmbed(t, user, timestamp, kickEntry.executorId)
      );
    }
    return;
  }

  if (!cfg.logMemberLeft) return;

  await postLog(member.client, buildMemberLeftEmbed(t, user, timestamp));
}

const moderationLogModule: CommandModule = {
  name: NAMESPACE,
  init(client: Client): void {
    if (!logChannelId()) {
      console.warn(
        '[moderation-log] No channelId configured in ' +
        'data/moderation-log/config.json; moderation logging is disabled.'
      );
    }

    client.on(Events.MessageDelete, (message) => {
      void handleMessageDelete(message).catch((err) => {
        console.error('[moderation-log] MessageDelete handler error:', err);
      });
    });

    client.on(Events.MessageBulkDelete, (messages, channel) => {
      void handleMessageDeleteBulk(messages, channel).catch((err) => {
        console.error('[moderation-log] MessageBulkDelete handler error:', err);
      });
    });

    client.on(Events.GuildBanAdd, (ban) => {
      void handleGuildBanAdd(ban).catch((err) => {
        console.error('[moderation-log] GuildBanAdd handler error:', err);
      });
    });

    client.on(Events.GuildBanRemove, (ban) => {
      void handleGuildBanRemove(ban).catch((err) => {
        console.error('[moderation-log] GuildBanRemove handler error:', err);
      });
    });

    client.on(Events.GuildMemberRemove, (member) => {
      void handleGuildMemberRemove(member).catch((err) => {
        console.error('[moderation-log] GuildMemberRemove handler error:', err);
      });
    });
  },
};

export default moderationLogModule;
