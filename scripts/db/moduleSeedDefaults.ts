import { MODULE_DEFAULTS as customEmbeds } from "../../shared/modules/custom-embeds/types.js";
import { MODULE_DEFAULTS as reactionRoles } from "../../shared/modules/reaction-roles/types.js";
import { MODULE_DEFAULTS as tickets } from "../../shared/modules/tickets/types.js";
import type { ModuleNamespace } from "../../shared/core/moduleTable.js";
import { MODULE_DEFAULTS as autothread } from "../../bot/src/lib/modules/links-pics-vids-autothread/types.js";
import { MODULE_DEFAULTS as emojis } from "../../bot/src/lib/modules/emojis/types.js";
import { MODULE_DEFAULTS as moderationLog } from "../../bot/src/lib/modules/moderation-log/types.js";
import { MODULE_DEFAULTS as picRepost } from "../../bot/src/lib/modules/pic-repost-commands/types.js";
import { MODULE_DEFAULTS as welcomeMessage } from "../../bot/src/lib/modules/welcome-message/types.js";

function seedRows(data: object): Record<string, unknown> {
  return data as Record<string, unknown>;
}

export const MODULE_SEED_DEFAULTS: Record<
  ModuleNamespace,
  Record<string, unknown>
> = {
  "welcome-message": seedRows(welcomeMessage),
  "pic-repost-commands": seedRows(picRepost),
  "links-pics-vids-autothread": seedRows(autothread),
  tickets: seedRows(tickets),
  "reaction-roles": seedRows(reactionRoles),
  "custom-embeds": seedRows(customEmbeds),
  "moderation-log": seedRows(moderationLog),
  emojis: seedRows(emojis),
};
