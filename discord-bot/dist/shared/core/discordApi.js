import { fetchWithTimeout } from "./fetchWithTimeout.js";
export const DISCORD_API = "https://discord.com/api/v10";
/** Authenticated Discord REST request using the bot token. */
export async function discordBotFetch(botToken, path, init) {
    const hasBody = init?.body !== undefined && init?.body !== null && init?.body !== "";
    const headers = {
        Authorization: `Bot ${botToken}`,
        ...init?.headers,
    };
    if (hasBody && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    return fetchWithTimeout(`${DISCORD_API}${path}`, {
        ...init,
        headers,
    });
}
//# sourceMappingURL=discordApi.js.map