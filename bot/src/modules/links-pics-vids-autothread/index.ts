import { Events, GuildMember, type Client, type Message } from 'discord.js';
import type { CommandModule } from '../../moduleLoader.js';
import {
  buildThreadName,
  startAndPopulateCommentsThread,
} from '../../../../shared/core/threads.js';
import { isModuleEnabled } from '../../../../shared/core/texts.js';
import { NAMESPACE, channelIds, texts } from '../../../../shared/modules/links-pics-vids-autothread/config-io.js';
import { extractSupportedPostUrls } from './urls.js';

const URL_REGEX = /https?:\/\/[^\s<>]+/gi;

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
  const hasPostLink = extractSupportedPostUrls(content).length > 0;
  const hasMedia = hasImageOrVideoAttachment(message);

  if (!hasPostLink && !hasMedia) return;

  const name = buildThreadName(displayNameFor(message), stripUrls(content), {
    guild: message.guild,
    client: message.client,
    message,
  });

  await startAndPopulateCommentsThread(message, {
    name,
    logPrefix: `[${NAMESPACE}]`,
    authorUserId: message.author.id,
    firstMessage: texts().threadFirstMessage,
  });
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
