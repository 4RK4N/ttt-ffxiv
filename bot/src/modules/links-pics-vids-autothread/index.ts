import { Events, GuildMember, type Client, type Message } from "discord.js";
import type { CommandModule } from "../../moduleLoader.js";
import {
  buildThreadName,
  startAndPopulateCommentsThread,
} from "../../lib/core/threads.js";
import { isModuleEnabled } from "../../../../shared/core/texts.js";
import { resolveDisplayName } from "../../lib/core/memberDisplayNames.js";
import {
  NAMESPACE,
  channelIds,
  texts,
} from "../../lib/modules/links-pics-vids-autothread/config-io.js";
import { extractSupportedPostUrls, stripUrls } from "./urls.js";

function hasImageOrVideoAttachment(message: Message): boolean {
  return message.attachments.some((a) => {
    const type = a.contentType ?? "";
    return type.startsWith("image/") || type.startsWith("video/");
  });
}

async function handleMessage(message: Message): Promise<void> {
  if (message.author.bot || message.system) return;
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!channelIds().includes(message.channelId)) return;
  if (message.channel.isThread() || message.hasThread) return;

  const content = message.content ?? "";
  const hasPostLink = extractSupportedPostUrls(content).length > 0;
  const hasMedia = hasImageOrVideoAttachment(message);

  if (!hasPostLink && !hasMedia) return;

  const name = buildThreadName(
    resolveDisplayName(
      message.member instanceof GuildMember ? message.member : null,
      message.author,
    ),
    stripUrls(content),
    {
      guild: message.guild,
      client: message.client,
      message,
    },
  );

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
        "[links-pics-vids-autothread] No channelIds configured in " +
          "data/links-pics-vids-autothread/config.json; auto-threading is disabled.",
      );
      return;
    }

    client.on(Events.MessageCreate, (message) => {
      void handleMessage(message).catch((err) => {
        console.error("[links-pics-vids-autothread] Unhandled error:", err);
      });
    });
  },
};

export default linksPicsVidsAutoThreadModule;
