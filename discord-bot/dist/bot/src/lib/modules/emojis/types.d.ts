export interface EmojisConfig {
    enabled?: boolean;
    emojiRoleId?: string;
}
export interface EmojisTexts {
    disabled: string;
    noPermission: string;
    invalidName: string;
    nameTaken: string;
    notImage: string;
    fileTooLarge: string;
    notCustomEmoji: string;
    downloadFailed: string;
    botMissingPermission: string;
    slotsFull: string;
    createFailed: string;
    addedSuccess: string;
}
export declare const CONFIG_DEFAULTS: EmojisConfig;
export declare const TEXT_DEFAULTS: EmojisTexts;
export type EmojisModuleData = EmojisConfig & EmojisTexts;
export declare const MODULE_DEFAULTS: EmojisConfig & EmojisTexts;
export declare const NAMESPACE: string;
export declare const get: <K extends keyof EmojisConfig | keyof EmojisTexts>(key: K) => (EmojisConfig & EmojisTexts)[K];
export declare const data: () => EmojisConfig & EmojisTexts;
export declare function emojiRoleId(): string | undefined;
//# sourceMappingURL=types.d.ts.map