import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable "${name}". ` +
      'Copy "env.example" to ".env" and fill in the values.'
    );
  }
  return value.trim();
}

function optional(name) {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : undefined;
}

export const config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  // Optional: when set, slash commands register to this guild instantly (great for dev).
  guildId: optional('GUILD_ID'),
};
