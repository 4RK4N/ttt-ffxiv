import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable "${name}". ` +
      'Copy "env.example" to ".env" and fill in the values.'
    );
  }
  return value.trim();
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : undefined;
}

function optionalList(name: string): string[] {
  const value = optional(name);
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

export interface Config {
  token: string;
  clientId: string;
  guildId: string | undefined;
  picChannelIds: string[];
  welcomeChannelId: string | undefined;
  // Web editor settings. These are optional here so the bot process starts
  // without them; the web entrypoint validates the ones it needs (see web/config).
  clientSecret: string | undefined;
  sessionSecret: string | undefined;
  oauthRedirectUri: string | undefined;
  webPort: number;
}

function optionalPort(name: string, fallback: number): number {
  const value = optional(name);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : fallback;
}

export const config: Config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  // Optional: when set, slash commands register to this guild instantly (great for dev).
  guildId: optional('GUILD_ID'),
  // Channels where the bot auto-creates a comments thread on qualifying posts.
  picChannelIds: optionalList('AUTOTHREAD_CHANNEL_IDS'),
  // Channel where the welcome card is posted when a member joins.
  welcomeChannelId: optional('WELCOME_CHANNEL_ID'),
  // OAuth client secret used by the web editor to exchange the auth code.
  clientSecret: optional('CLIENT_SECRET'),
  // Secret used to sign the web editor's session cookies.
  sessionSecret: optional('SESSION_SECRET'),
  // Registered Discord OAuth2 redirect URI (must match the Developer Portal).
  oauthRedirectUri: optional('OAUTH_REDIRECT_URI'),
  // Port the web editor listens on.
  webPort: optionalPort('WEB_PORT', 8088),
};
