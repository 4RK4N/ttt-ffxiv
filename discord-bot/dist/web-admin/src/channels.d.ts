import type { WebConfig } from "./config.js";
export interface GuildChannel {
    id: string;
    name: string;
    type: number;
}
/**
 * Lists the guild's text-capable channels via the bot token, sorted by position.
 * Results are cached for a short window. Throws on API failure so the caller can
 * surface an error to the editor.
 */
export declare function listGuildChannels(cfg: WebConfig): Promise<GuildChannel[]>;
//# sourceMappingURL=channels.d.ts.map