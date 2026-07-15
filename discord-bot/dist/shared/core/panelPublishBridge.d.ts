export interface PublishDiscordContext {
    botToken: string;
}
export interface PublishHandlers {
    publish: (ctx: PublishDiscordContext, itemId: string) => Promise<void>;
    unpublish: (itemId: string) => Promise<void>;
}
/** Called once at combined-app startup from the bot publish registry. */
export declare function registerPublishHandlers(map: Record<string, PublishHandlers>): void;
export declare function getPublishHandlers(namespace: string): PublishHandlers | undefined;
//# sourceMappingURL=panelPublishBridge.d.ts.map