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
} from "discord.js";
import { isModuleEnabled } from "../../../../shared/core/texts.js";
import { findRecentBan, findRecentKick, findRecentUnban } from "./audit.js";
import {
  buildMemberBannedEmbed,
  buildMemberKickedEmbed,
  buildMemberLeftEmbed,
  buildMemberUnbannedEmbed,
  buildMessageDeletedEmbed,
  resolveDeleteAuthor,
} from "./embeds.js";
import {
  NAMESPACE,
  config,
  logChannelId,
  texts,
} from "../../lib/modules/moderation-log/config-io.js";
import { registerSafeHandler } from "../../lib/core/discordEvents.js";
import { sleep } from "../../lib/core/sleep.js";

const recentBans = new Set<string>();
const BAN_DEDUPE_MS = 10_000;
const BULK_DELETE_BATCH = 5;
const BULK_DELETE_DELAY_MS = 1_000;

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
    console.warn(
      `[moderation-log] Log channel "${channelId}" is not a guild text channel.`,
    );
    return;
  }

  await (channel as TextChannel).send({ embeds: [embed] });
}

function isGuildTextChannel(channel: TextBasedChannel): boolean {
  return !channel.isDMBased() && "guild" in channel && channel.guild !== null;
}

async function handleMessageDelete(
  message: Message | PartialMessage,
  bulkChannel?: TextBasedChannel,
): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!config().logMessageDeleted) return;

  const logChannel = logChannelId();
  if (!logChannel) return;

  const sourceChannel = bulkChannel ?? message.channel;
  if (!sourceChannel?.isTextBased() || !isGuildTextChannel(sourceChannel))
    return;
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
    timestamp,
  );

  await postLog(message.client, embed);
}

async function handleMessageDeleteBulk(
  messages: ReadonlyMap<string, Message | PartialMessage>,
  channel: TextBasedChannel,
): Promise<void> {
  const items = [...messages.values()];
  for (let i = 0; i < items.length; i += BULK_DELETE_BATCH) {
    const batch = items.slice(i, i + BULK_DELETE_BATCH);
    await Promise.all(
      batch.map((message) => handleMessageDelete(message, channel)),
    );
    if (i + BULK_DELETE_BATCH < items.length) {
      await sleep(BULK_DELETE_DELAY_MS);
    }
  }
}

async function handleGuildBanAdd(ban: GuildBan): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;

  markRecentBan(ban.user.id);

  if (!config().logMemberBanned) return;
  if (!logChannelId()) return;

  const audit = await findRecentBan(ban.guild, ban.user.id);
  const embed = buildMemberBannedEmbed(
    texts(),
    ban.user,
    new Date(),
    audit?.executorId ?? null,
  );
  await postLog(ban.client, embed);
}

async function handleGuildBanRemove(ban: GuildBan): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!config().logMemberUnbanned) return;
  if (!logChannelId()) return;

  const audit = await findRecentUnban(ban.guild, ban.user.id);
  const embed = buildMemberUnbannedEmbed(
    texts(),
    ban.user,
    new Date(),
    audit?.executorId ?? null,
  );
  await postLog(ban.client, embed);
}

async function resolveRemovedMember(
  member: GuildMember | PartialGuildMember,
): Promise<{
  guild: GuildMember["guild"];
  user: NonNullable<GuildMember["user"]>;
} | null> {
  const guildId =
    member.guild?.id ?? ("guildId" in member ? member.guildId : undefined);
  if (!guildId) return null;

  const guild =
    member.guild ??
    member.client.guilds.cache.get(guildId) ??
    (await member.client.guilds.fetch(guildId).catch(() => null));

  if (!guild) return null;

  const user =
    member.user ??
    (await member.client.users.fetch(member.id).catch(() => null));

  if (!user) return null;

  return { guild, user };
}

async function handleGuildMemberRemove(
  member: GuildMember | PartialGuildMember,
): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!logChannelId()) return;
  if (wasRecentBan(member.id)) return;

  const resolved = await resolveRemovedMember(member);
  if (!resolved) return;

  const { guild, user } = resolved;
  const cfg = config();
  const t = texts();
  const timestamp = new Date();

  if (cfg.logMemberKicked) {
    const kickEntry = await findRecentKick(guild, member.id);
    if (kickEntry) {
      await postLog(
        member.client,
        buildMemberKickedEmbed(t, user, timestamp, kickEntry.executorId),
      );
      return;
    }
  }

  if (!cfg.logMemberLeft) return;

  await postLog(member.client, buildMemberLeftEmbed(t, user, timestamp));
}

export function registerModerationLogHandlers(client: Client): void {
  registerSafeHandler(
    client,
    Events.MessageDelete,
    (message) => handleMessageDelete(message),
    "[moderation-log]",
  );

  registerSafeHandler(
    client,
    Events.MessageBulkDelete,
    (messages, channel) => handleMessageDeleteBulk(messages, channel),
    "[moderation-log]",
  );

  registerSafeHandler(
    client,
    Events.GuildBanAdd,
    (ban) => handleGuildBanAdd(ban),
    "[moderation-log]",
  );

  registerSafeHandler(
    client,
    Events.GuildBanRemove,
    (ban) => handleGuildBanRemove(ban),
    "[moderation-log]",
  );

  registerSafeHandler(
    client,
    Events.GuildMemberRemove,
    (member) => handleGuildMemberRemove(member),
    "[moderation-log]",
  );
}
