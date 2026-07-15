export interface Config {
    discordToken: string;
    clientId: string;
    guildId: string | undefined;
    botName: string;
    clientSecret: string | undefined;
    sessionSecret: string | undefined;
    oauthRedirectUri: string | undefined;
    webPort: number;
}
/** Keys in app_config that must not appear in default SQL dumps. */
export declare const APP_CONFIG_SECRET_KEYS: Set<string>;
export declare let config: Config;
export declare function initConfig(options?: {
    readonly?: boolean;
}): Promise<void>;
//# sourceMappingURL=config.d.ts.map