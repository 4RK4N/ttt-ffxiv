export interface ModLogTexts {
    messageDeleted: string;
    messageDeletedEmpty: string;
    authorUnknown: string;
    memberLeft: string;
    memberKicked: string;
    memberBanned: string;
    memberUnbanned: string;
    executorUnknown: string;
    footerMessageId: string;
    footerUserId: string;
}
export declare const TEXT_DEFAULTS: ModLogTexts;
export interface ModLogConfig {
    channelId: string;
    logMessageDeleted: boolean;
    logMemberLeft: boolean;
    logMemberKicked: boolean;
    logMemberBanned: boolean;
    logMemberUnbanned: boolean;
}
export declare const CONFIG_DEFAULTS: ModLogConfig;
export type ModLogModuleData = ModLogConfig & ModLogTexts;
export declare const MODULE_DEFAULTS: ModLogConfig & ModLogTexts;
export declare const NAMESPACE: string;
export declare const get: <K extends keyof ModLogConfig | keyof ModLogTexts>(key: K) => (ModLogConfig & ModLogTexts)[K];
export declare const data: () => ModLogConfig & ModLogTexts;
export declare function logChannelId(): string | undefined;
//# sourceMappingURL=types.d.ts.map