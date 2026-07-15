/** Registers a client event handler and logs failures without throwing. */
export function registerSafeHandler(client, event, handler, logPrefix) {
    client.on(event, (...args) => {
        void Promise.resolve(handler(...args)).catch((err) => {
            console.error(`${logPrefix} ${String(event)} handler error:`, err);
        });
    });
}
//# sourceMappingURL=discordEvents.js.map