export declare const NAMESPACE = "tickets";
export interface TicketTypeConfig {
    id: string;
    published: boolean;
    emoji: string;
    channelId: string;
    panelMessageId: string;
    staffRoleId: string;
    deniedRoleIds: string[];
    roleActionRoleId?: string;
}
export interface TicketTypeTexts {
    openButtonLabel: string;
    panelTitle: string;
    panelDescription: string;
    ticketWelcome: string;
    closeButtonLabel: string;
    confirmClosePrompt: string;
    confirmCloseYes: string;
    confirmCloseNo: string;
    ticketClosed: string;
    deleteButtonLabel: string;
    confirmDeletePrompt: string;
    confirmDeleteYes: string;
    confirmDeleteNo: string;
    ticketDeleted: string;
    alreadyOpen: string;
    openSuccess: string;
    roleDenied: string;
    roleActionButtonLabel: string;
    roleActionConfirmation: string;
}
export interface ResolvedTicketType extends TicketTypeConfig, TicketTypeTexts {
}
export interface TicketsConfig {
    enabled?: boolean;
    ticketTypes: TicketTypeConfig[];
}
export interface TicketsTexts {
    disabled: string;
    noPermission: string;
    noDeletePermission: string;
    deleteNotClosed: string;
    categoryUnpublished: string;
    channelNotConfigured: string;
    invalidChannel: string;
    openError: string;
    closeError: string;
    deleteError: string;
    closeCancelled: string;
    deleteCancelled: string;
    threadContextRequired: string;
    invalidInteraction: string;
    openInProgress: string;
    roleActionError: string;
    roleActionHierarchyError: string;
    roleActionOpenerMissing: string;
}
export declare const DEFAULT_TYPE_TEXTS: TicketTypeTexts;
export declare const TEXT_DEFAULTS: TicketsTexts;
export declare const CONFIG_DEFAULTS: TicketsConfig;
export type TicketsModuleData = TicketsConfig & TicketsTexts;
export declare const MODULE_DEFAULTS: TicketsModuleData;
export declare const get: <K extends keyof TicketsConfig | keyof TicketsTexts>(key: K) => TicketsModuleData[K];
export declare const data: () => TicketsModuleData;
export declare function resolveTicketType(id: string): ResolvedTicketType | undefined;
//# sourceMappingURL=types.d.ts.map