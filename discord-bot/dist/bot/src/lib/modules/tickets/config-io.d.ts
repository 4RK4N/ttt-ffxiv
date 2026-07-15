import { type TicketTypeConfig } from "#shared/modules/tickets/types.js";
export * from "#shared/modules/tickets/types.js";
export declare const updateTicketType: (id: string, patch: Partial<TicketTypeConfig>) => Promise<TicketTypeConfig | undefined>;
export declare const getTicketTypeConfig: (id: string) => TicketTypeConfig | undefined;
//# sourceMappingURL=config-io.d.ts.map