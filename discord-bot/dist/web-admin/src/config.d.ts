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
export declare function loadWebConfig(): WebConfig;
//# sourceMappingURL=config.d.ts.map