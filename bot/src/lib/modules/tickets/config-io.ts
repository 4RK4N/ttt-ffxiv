import { createConfigIo } from "../../core/configIo.js";
import {
  NAMESPACE,
  type TicketTypeConfig,
} from "@shared/modules/tickets/types.js";
export * from "@shared/modules/tickets/types.js";

const io = createConfigIo<TicketTypeConfig>(NAMESPACE, "ticketTypes");
export const updateTicketType = io.updateItem;
export const getTicketTypeConfig = io.getItemConfig;
