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
};
