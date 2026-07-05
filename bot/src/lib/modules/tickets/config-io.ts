import { createConfigIo } from "../../core/configIo.js";
import type { TicketTypeConfig } from "../../../../../shared/modules/tickets/types.js";
import {
  CONFIG_DEFAULTS,
  NAMESPACE,
  config,
  resolveTicketType,
  texts,
} from "../../../../../shared/modules/tickets/types.js";

const io = createConfigIo<TicketTypeConfig>(
  NAMESPACE,
  "ticketTypes",
  CONFIG_DEFAULTS,
);

export const updateTicketType = io.updateItem;
export const getTicketTypeConfig = io.getItemConfig;

export { NAMESPACE, CONFIG_DEFAULTS, config, texts, resolveTicketType };
