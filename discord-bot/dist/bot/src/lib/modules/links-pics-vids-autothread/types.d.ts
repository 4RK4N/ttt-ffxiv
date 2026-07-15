export interface AutoThreadTexts {
    threadFirstMessage: string;
    nonQualifyingDm: string;
}
export interface AutoThreadConfig {
    channelIds: string[];
    deleteNonQualifyingMessages?: boolean;
}
export declare const CONFIG_DEFAULTS: AutoThreadConfig;
export declare const TEXT_DEFAULTS: AutoThreadTexts;
export type AutoThreadModuleData = AutoThreadConfig & AutoThreadTexts;
export declare const MODULE_DEFAULTS: AutoThreadConfig & AutoThreadTexts;
export declare const NAMESPACE: string;
export declare const get: <K extends keyof AutoThreadConfig | keyof AutoThreadTexts>(key: K) => (AutoThreadConfig & AutoThreadTexts)[K];
export declare const data: () => AutoThreadConfig & AutoThreadTexts;
export declare function channelIds(): string[];
export declare function deleteNonQualifyingMessagesEnabled(moduleData?: AutoThreadConfig & AutoThreadTexts): boolean;
//# sourceMappingURL=types.d.ts.map