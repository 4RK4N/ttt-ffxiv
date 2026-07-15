import type { Client, ClientEvents } from "discord.js";
/** Registers a client event handler and logs failures without throwing. */
export declare function registerSafeHandler<K extends keyof ClientEvents>(client: Client, event: K, handler: (...args: ClientEvents[K]) => void | Promise<void>, logPrefix: string): void;
//# sourceMappingURL=discordEvents.d.ts.map