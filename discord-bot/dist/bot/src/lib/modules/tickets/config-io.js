import { createConfigIo } from "../../core/configIo.js";
import { NAMESPACE, } from "#shared/modules/tickets/types.js";
export * from "#shared/modules/tickets/types.js";
const io = createConfigIo(NAMESPACE, "ticketTypes");
export const updateTicketType = io.updateItem;
export const getTicketTypeConfig = io.getItemConfig;
//# sourceMappingURL=config-io.js.map