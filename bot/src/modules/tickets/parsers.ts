import {
  CLOSE_CONFIRM_PREFIX,
  CLOSE_PREFIX,
  DELETE_CONFIRM_PREFIX,
  DELETE_PREFIX,
} from "../../lib/modules/tickets/panel.js";

export interface ParsedCloseCustomId {
  threadId: string;
  typeId: string;
  openerUserId?: string;
}

export interface ParsedDeleteCustomId {
  threadId: string;
  typeId: string;
}

export function parseCloseCustomId(
  customId: string,
): ParsedCloseCustomId | null {
  const confirm = customId.startsWith(CLOSE_CONFIRM_PREFIX);
  const prefix = confirm ? CLOSE_CONFIRM_PREFIX : CLOSE_PREFIX;
  if (!customId.startsWith(prefix)) return null;

  const segments = customId.slice(prefix.length).split(":");
  if (segments.length < 2) return null;

  const threadId = segments[0];
  if (segments.length >= 3) {
    return { threadId, typeId: segments[1], openerUserId: segments[2] };
  }
  return { threadId, typeId: segments.slice(1).join(":") };
}

export function parseDeleteCustomId(
  customId: string,
): ParsedDeleteCustomId | null {
  const confirm = customId.startsWith(DELETE_CONFIRM_PREFIX);
  const prefix = confirm ? DELETE_CONFIRM_PREFIX : DELETE_PREFIX;
  if (!customId.startsWith(prefix)) return null;

  const segments = customId.slice(prefix.length).split(":");
  if (segments.length < 2) return null;

  return { threadId: segments[0], typeId: segments.slice(1).join(":") };
}
