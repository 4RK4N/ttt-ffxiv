import type { DiscordApiContext } from "./panelPublish.js";
export interface PanelPublisher {
    publish: (ctx: DiscordApiContext, id: string) => Promise<void>;
    unpublish: (id: string) => Promise<void>;
}
export declare function createPanelPublisher<T extends {
    channelId: string;
    panelMessageId: string;
    published: boolean;
}>(opts: {
    resolve: (id: string) => T | undefined;
    getConfig: (id: string) => T | undefined;
    update: (id: string, patch: Partial<T>) => Promise<T | undefined>;
    publishPanel: (ctx: DiscordApiContext, id: string, channelId: string, existingMessageId?: string) => Promise<string>;
    entityLabel: string;
}): PanelPublisher;
//# sourceMappingURL=panelPublisher.d.ts.map