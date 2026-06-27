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

export interface Config {
  token: string;
  clientId: string;
  guildId: string | undefined;
}

export const config: Config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  // Optional: when set, slash commands register to this guild instantly (great for dev).
  guildId: optional('GUILD_ID'),
};
