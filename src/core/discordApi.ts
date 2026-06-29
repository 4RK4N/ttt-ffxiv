export const DISCORD_API = 'https://discord.com/api/v10';

/** Authenticated Discord REST request using the bot token. */
export async function discordBotFetch(
  botToken: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}
