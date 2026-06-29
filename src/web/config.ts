import { config } from '../config.js';

export interface WebConfig {
  clientId: string;
  clientSecret: string;
  sessionSecret: string;
  oauthRedirectUri: string;
  guildId: string;
  port: number;
  /** True when the redirect URI is https, so cookies can be marked Secure. */
  secureCookies: boolean;
}

/**
 * Validates the environment the web editor needs and returns a typed config, or
 * exits with a clear message listing what is missing. Kept separate from the bot
 * so the bot can start without these variables.
 */
export function loadWebConfig(): WebConfig {
  const missing: string[] = [];
  if (!config.clientSecret) missing.push('CLIENT_SECRET');
  if (!config.sessionSecret) missing.push('SESSION_SECRET');
  if (!config.oauthRedirectUri) missing.push('OAUTH_REDIRECT_URI');
  // GUILD_ID is optional for the bot but required here for the admin check.
  if (!config.guildId) missing.push('GUILD_ID');

  if (missing.length > 0) {
    console.error(
      `[web] Missing required environment variable(s): ${missing.join(', ')}.\n` +
        'Copy "env.example" to ".env" and fill in the web editor section.'
    );
    process.exit(1);
  }

  let secureCookies = false;
  try {
    secureCookies = new URL(config.oauthRedirectUri!).protocol === 'https:';
  } catch {
    console.error(`[web] OAUTH_REDIRECT_URI is not a valid URL: "${config.oauthRedirectUri}".`);
    process.exit(1);
  }

  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret!,
    sessionSecret: config.sessionSecret!,
    oauthRedirectUri: config.oauthRedirectUri!,
    guildId: config.guildId!,
    port: config.webPort,
    secureCookies,
  };
}
