import type { Client, ClientEvents } from "discord.js";

/** Registers a client event handler and logs failures without throwing. */
export function registerSafeHandler<K extends keyof ClientEvents>(
  client: Client,
  event: K,
  handler: (...args: ClientEvents[K]) => void | Promise<void>,
  logPrefix: string,
): void {
  client.on(event, (...args) => {
    void Promise.resolve(handler(...args)).catch((err) => {
      console.error(`${logPrefix} ${String(event)} handler error:`, err);
    });
  });
}
