export interface WelcomeTexts {
    rulesMessage: string;
    welcomeContent: string;
    rulesChannelFallback: string;
}
export interface WelcomeConfig {
    channelId: string;
    rulesChannelId: string;
}
export declare const CONFIG_DEFAULTS: WelcomeConfig;
export declare const TEXT_DEFAULTS: WelcomeTexts;
export type WelcomeModuleData = WelcomeConfig & WelcomeTexts;
export declare const MODULE_DEFAULTS: WelcomeConfig & WelcomeTexts;
export declare const NAMESPACE: string;
export declare const get: <K extends keyof WelcomeConfig | keyof WelcomeTexts>(key: K) => (WelcomeConfig & WelcomeTexts)[K];
export declare const data: () => WelcomeConfig & WelcomeTexts;
export declare function welcomeChannelId(): string | undefined;
/** Clickable Discord channel link for {rulesChannel}, or empty when unset. */
export declare function rulesChannelLink(guildId: string): string;
//# sourceMappingURL=types.d.ts.map