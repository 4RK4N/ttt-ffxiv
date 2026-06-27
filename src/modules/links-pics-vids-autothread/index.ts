import { Events, GuildMember, type Client, type Message } from 'discord.js';
import { config } from '../../config.js';
import type { CommandModule } from '../../core/moduleLoader.js';
import {
  buildThreadName,
  THREAD_AUTO_ARCHIVE_MINUTES,
  THREAD_FIRST_MESSAGE,
} from '../../core/threads.js';

// Matches http(s) URLs in free-form message text. We then parse each match with
// the URL API and apply per-site post-detection rules below.
const URL_REGEX = /https?:\/\/[^\s<>]+/gi;

function normalizeHost(host: string): string {
  return host.replace(/^www\./i, '').toLowerCase();
}

/**
 * Returns true when the URL points to a single post (not a profile, group, or
 * site root) on one of the supported sites. Unknown sites return false.
 */
function isSupportedPostUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  const host = normalizeHost(url.hostname);
  // Trailing punctuation (e.g. a period ending a sentence) can be captured by the
  // URL regex; drop it before matching path segments.
  const path = url.pathname.replace(/[).,]+$/, '');

  // X / Twitter: a post lives at /<user>/status/<id> (also /i/web/status/<id>).
  if (['x.com', 'twitter.com', 'mobile.twitter.com'].includes(host)) {
    return /\/status(?:es)?\/\d+/.test(path);
  }

  // Bluesky: a post lives at /profile/<handle>/post/<rkey>.
  if (host === 'bsky.app') {
    return /^\/profile\/[^/]+\/post\/[^/]+/.test(path);
  }

  // Aethy (Mastodon): /@user/<statusId> or /users/<user>/statuses/<id>.
  // A bare /@user is a profile and must not trigger.
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

/** Removes all URLs from the message text, leaving the caption (if any). */
function stripUrls(content: string): string {
  return content.replace(URL_REGEX, ' ').replace(/\s+/g, ' ').trim();
}

function displayNameFor(message: Message): string {
  if (message.member instanceof GuildMember) return message.member.displayName;
  return message.author.displayName ?? message.author.username;
}

async function handleMessage(message: Message): Promise<void> {
  // Ignore bots/webhooks (incl. our own /pic reposts, which thread themselves)
  // and system messages.
  if (message.author.bot || message.system) return;

  // Only the configured pics channels.
  if (!config.picChannelIds.includes(message.channelId)) return;

  // Don't act on messages already inside a thread, or that already have one.
  if (message.channel.isThread() || message.hasThread) return;

  const content = message.content ?? '';
  const urls = content.match(URL_REGEX) ?? [];
  const hasPostLink = urls.some(isSupportedPostUrl);
  const hasMedia = hasImageOrVideoAttachment(message);

  if (!hasPostLink && !hasMedia) return;

  const caption = stripUrls(content);
  const name = buildThreadName(displayNameFor(message), caption);

  try {
    const thread = await message.startThread({
      name,
      autoArchiveDuration: THREAD_AUTO_ARCHIVE_MINUTES,
    });
    await thread.send(THREAD_FIRST_MESSAGE);
  } catch (err) {
    // Non-fatal: usually missing "Create Public Threads" / "Send Messages in
    // Threads" permission. The post itself is unaffected.
    console.error('Failed to create auto comments thread:', err);
  }
}

const linksPicsVidsAutoThreadModule: CommandModule = {
  name: 'links-pics-vids-autothread',
  init(client: Client): void {
    if (config.picChannelIds.length === 0) {
      console.warn(
        '[links-pics-vids-autothread] No AUTOTHREAD_CHANNEL_IDS configured; auto-threading is disabled.'
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
