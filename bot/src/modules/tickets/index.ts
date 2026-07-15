import type { CommandModule } from "../../moduleLoader.js";
import { NAMESPACE } from "../../lib/modules/tickets/config-io.js";
import {
  CLOSE_CANCEL_PREFIX,
  CLOSE_CONFIRM_PREFIX,
  CLOSE_PREFIX,
  DELETE_CANCEL_PREFIX,
  DELETE_CONFIRM_PREFIX,
  DELETE_PREFIX,
  OPEN_PREFIX,
  ROLE_ACTION_PREFIX,
} from "../../lib/modules/tickets/panel.js";
import { handleCloseCancel, handleCloseTicket } from "./close.js";
import { handleDeleteCancel, handleDeleteTicket } from "./delete.js";
import { registerMemberCacheWarm } from "./member-cache.js";
import { registerOpenTicketIndexHandlers } from "./open-index.js";
import { handleOpenTicket } from "./open.js";
import { handleRoleAction } from "./role-action.js";
import {
  type ButtonInteraction,
  type MessageComponentInteraction,
} from "discord.js";

async function handleComponent(
  interaction: MessageComponentInteraction,
): Promise<void> {
  if (!interaction.isButton()) return;

  const { customId } = interaction;

  if (customId.startsWith(OPEN_PREFIX)) {
    await handleOpenTicket(interaction);
    return;
  }

  if (customId.startsWith(CLOSE_CANCEL_PREFIX)) {
    await handleCloseCancel(interaction);
    return;
  }

  if (customId.startsWith(DELETE_CANCEL_PREFIX)) {
    await handleDeleteCancel(interaction);
    return;
  }

  if (customId.startsWith(ROLE_ACTION_PREFIX)) {
    await handleRoleAction(interaction as ButtonInteraction);
    return;
  }

  if (
    customId.startsWith(DELETE_CONFIRM_PREFIX) ||
    customId.startsWith(DELETE_PREFIX)
  ) {
    await handleDeleteTicket(interaction as ButtonInteraction);
    return;
  }

  if (
    customId.startsWith(CLOSE_PREFIX) ||
    customId.startsWith(CLOSE_CONFIRM_PREFIX)
  ) {
    await handleCloseTicket(interaction as ButtonInteraction);
  }
}

const ticketsModule: CommandModule = {
  name: NAMESPACE,
  init: (client) => {
    registerMemberCacheWarm(client);
    registerOpenTicketIndexHandlers(client);
  },
  componentRoutes: [{ prefix: "tickets:", handle: handleComponent }],
};

export default ticketsModule;
