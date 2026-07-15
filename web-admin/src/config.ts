import { config } from "@shared/config.js";

export interface WebConfig {
  clientId: string;
  clientSecret: string;
  sessionSecret: string;
  oauthRedirectUri: string;
  guildId: string;
  port: number;
  /** Bot token, used to list the guild's channels for the channel pickers. */
  botToken: string;
  /** Display name used in the page title ("<botName> Admin Interface"). */
  botName: string;
  /** True when the redirect URI is https, so cookies can be marked Secure. */
  secureCookies: boolean;
}

/**
 * Validates the environment the web editor needs and returns a typed config, or
 * exits with a clear message listing what is missing.
 */
export function loadWebConfig(): WebConfig {
  const missing: string[] = [];
  if (!config.clientSecret) missing.push("clientSecret");
  if (!config.sessionSecret) missing.push("sessionSecret");
  if (!config.oauthRedirectUri) missing.push("oauthRedirectUri");
  if (!config.guildId) missing.push("guildId");

  if (missing.length > 0) {
    console.error(
      `[web] Missing required config value(s): ${missing.join(", ")}.\n` +
        "Run ./scripts/db/db-init.sh or update app_config in the database.",
    );
    process.exit(1);
  }

  let secureCookies = false;
  try {
    secureCookies = new URL(config.oauthRedirectUri!).protocol === "https:";
  } catch {
    console.error(
      `[web] Config value "oauthRedirectUri" is not a valid URL: "${config.oauthRedirectUri}".`,
    );
    process.exit(1);
  }

  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret!,
    sessionSecret: config.sessionSecret!,
    oauthRedirectUri: config.oauthRedirectUri!,
    guildId: config.guildId!,
    port: config.webPort,
    botToken: config.discordToken,
    botName: config.botName,
    secureCookies,
  };
}
