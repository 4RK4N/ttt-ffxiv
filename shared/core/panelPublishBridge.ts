export interface PublishDiscordContext {
  botToken: string;
}

export interface PublishHandlers {
  publish: (ctx: PublishDiscordContext, itemId: string) => Promise<void>;
  unpublish: (itemId: string) => Promise<void>;
}

let handlersByNamespace: Record<string, PublishHandlers> = {};

/** Called once at combined-app startup from the bot publish registry. */
export function registerPublishHandlers(
  map: Record<string, PublishHandlers>,
): void {
  handlersByNamespace = map;
}

export function getPublishHandlers(
  namespace: string,
): PublishHandlers | undefined {
  return handlersByNamespace[namespace];
}
