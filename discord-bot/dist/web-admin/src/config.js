import { config } from "#shared/config.js";
/**
 * Validates the environment the web editor needs and returns a typed config, or
 * exits with a clear message listing what is missing.
 */
export function loadWebConfig() {
    const missing = [];
    if (!config.clientSecret)
        missing.push("clientSecret");
    if (!config.sessionSecret)
        missing.push("sessionSecret");
    if (!config.oauthRedirectUri)
        missing.push("oauthRedirectUri");
    if (!config.guildId)
        missing.push("guildId");
    if (missing.length > 0) {
        console.error(`[web] Missing required config value(s): ${missing.join(", ")}.\n` +
            "Run ./scripts/db/db-init.sh or update app_config in the database.");
        process.exit(1);
    }
    let secureCookies = false;
    try {
        secureCookies = new URL(config.oauthRedirectUri).protocol === "https:";
    }
    catch {
        console.error(`[web] Config value "oauthRedirectUri" is not a valid URL: "${config.oauthRedirectUri}".`);
        process.exit(1);
    }
    return {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        sessionSecret: config.sessionSecret,
        oauthRedirectUri: config.oauthRedirectUri,
        guildId: config.guildId,
        port: config.webPort,
        botToken: config.discordToken,
        botName: config.botName,
        secureCookies,
    };
}
//# sourceMappingURL=config.js.map