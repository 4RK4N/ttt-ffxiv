import { Events, GuildMember, type Client, type Message } from 'discord.js';
import type { CommandModule } from '../../core/moduleLoader.js';
import {
  buildThreadName,
  THREAD_AUTO_ARCHIVE_MINUTES,
} from '../../core/threads.js';
import { isModuleEnabled } from '../../core/texts.js';
import { NAMESPACE, channelIds, texts } from './types.js';

const URL_REGEX = /https?:\/\/[^\s<>]+/gi;

function normalizeHost(host: string): string {
  return host.replace(/^www\./i, '').toLowerCase();
}

function isSupportedPostUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  const host = normalizeHost(url.hostname);
  const path = url.pathname.replace(/[).,]+$/, '');

  if (['x.com', 'twitter.com', 'mobile.twitter.com'].includes(host)) {
    return /\/status(?:es)?\/\d+/.test(path);
  }

  if (host === 'bsky.app') {
    return /^\/profile\/[^/]+\/post\/[^/]+/.test(path);
  }

  if (host === 'aethy.com') {
    return /^\/@[^/]+\/\d+/.test(path) || /^\/users\/[^/]+\/statuses\/\d+/.test(path);
  }

  return false;
}

function hasImageOrVideoAttachment(message: Message): boolean {
  return message.attachments.some((a) => {
    const type = a.contentType ?? '';
    return type.startsWith('image/') || type.startsWith('video/');
  });
}

function stripUrls(content: string): string {
  return content.replace(URL_REGEX, ' ').replace(/\s+/g, ' ').trim();
}

function displayNameFor(message: Message): string {
  if (message.member instanceof GuildMember) return message.member.displayName;
  return message.author.displayName ?? message.author.username;
}

async function handleMessage(message: Message): Promise<void> {
  if (message.author.bot || message.system) return;
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!channelIds().includes(message.channelId)) return;
  if (message.channel.isThread() || message.hasThread) return;

  const content = message.content ?? '';
  const urls = content.match(URL_REGEX) ?? [];
  const hasPostLink = urls.some(isSupportedPostUrl);
  const hasMedia = hasImageOrVideoAttachment(message);

  if (!hasPostLink && !hasMedia) return;

  const name = buildThreadName(displayNameFor(message), stripUrls(content), {
    guild: message.guild,
    client: message.client,
    message,
  });

  try {
    const thread = await message.startThread({
      name,
      autoArchiveDuration: THREAD_AUTO_ARCHIVE_MINUTES,
    });

    try {
      await thread.members.add(message.author.id);
    } catch (err) {
      console.error('Failed to add author to auto comments thread:', err);
    }

    await thread.send(texts().threadFirstMessage);
  } catch (err) {
    console.error('Failed to create auto comments thread:', err);
  }
}

const linksPicsVidsAutoThreadModule: CommandModule = {
  name: NAMESPACE,
  init(client: Client): void {
    if (channelIds().length === 0) {
      console.warn(
        '[links-pics-vids-autothread] No channelIds configured in ' +
        'data/links-pics-vids-autothread/config.json; auto-threading is disabled.'
      );
      return;
    }

    client.on(Events.MessageCreate, (message) => {
      void handleMessage(message).catch((err) => {
        console.error('[links-pics-vids-autothread] Unhandled error:', err);
      });
    });
  },
};

export default linksPicsVidsAutoThreadModule;
