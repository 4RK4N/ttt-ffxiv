import type { DiscordApiContext } from './panelPublish.js';

export interface PanelPublisher {
  publish: (ctx: DiscordApiContext, id: string) => Promise<void>;
  unpublish: (id: string) => Promise<void>;
}

export function createPanelPublisher<
  T extends { channelId: string; panelMessageId: string; published: boolean },
>(opts: {
  resolve: (id: string) => T | undefined;
  getConfig: (id: string) => T | undefined;
  update: (id: string, patch: Partial<T>) => Promise<T | undefined>;
  publishPanel: (
    ctx: DiscordApiContext,
    id: string,
    channelId: string,
    existingMessageId?: string
  ) => Promise<string>;
  entityLabel: string;
}): PanelPublisher {
  async function publish(ctx: DiscordApiContext, id: string): Promise<void> {
    const item = opts.resolve(id);
    if (!item) throw new Error(`Unknown ${opts.entityLabel} "${id}".`);
    if (!item.channelId.trim()) {
      throw new Error(`Channel is not configured for this ${opts.entityLabel}.`);
    }

    const messageId = await opts.publishPanel(
      ctx,
      id,
      item.channelId,
      item.panelMessageId || undefined
    );

    await opts.update(id, {
      published: true,
      panelMessageId: messageId,
    } as Partial<T>);
  }

  async function unpublish(id: string): Promise<void> {
    if (!opts.getConfig(id)) throw new Error(`Unknown ${opts.entityLabel} "${id}".`);
    await opts.update(id, { published: false } as Partial<T>);
  }

  return { publish, unpublish };
}
