export interface PicTexts {
    disabled: string;
    noImages: string;
    notImages: string;
    messageTooLong: string;
    attachmentTooLarge: string;
    downloadFailed: string;
    cannotPost: string;
    postFailed: string;
    attribution: string;
    postedSuccess: string;
    threadNote: string;
    threadFirstMessage: string;
}
export declare const DEFAULT_DELETE_EMOJI = "\uD83D\uDDD1\uFE0F";
export interface PicConfig {
    enabled?: boolean;
    deleteEmoji?: string;
    deleteAuthorLastMention?: boolean;
}
export declare const CONFIG_DEFAULTS: PicConfig;
export declare function resolveDeleteEmoji(cfg: PicConfig): string;
export declare function resolveDeleteAuthorLastMention(cfg: PicConfig): boolean;
export declare const TEXT_DEFAULTS: PicTexts;
export type PicModuleData = PicConfig & PicTexts;
export declare const MODULE_DEFAULTS: PicConfig & PicTexts;
export declare const NAMESPACE: string;
export declare const get: <K extends keyof PicConfig | keyof PicTexts>(key: K) => (PicConfig & PicTexts)[K];
export declare const data: () => PicConfig & PicTexts;
//# sourceMappingURL=types.d.ts.map