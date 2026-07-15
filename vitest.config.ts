import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(rootDir, "shared"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: [
        "shared/core/**/*.ts",
        "shared/modules/**/*.ts",
        "bot/src/lib/core/threads.ts",
        "bot/src/lib/core/discordInteractions.ts",
        "bot/src/lib/core/discordRoles.ts",
        "bot/src/lib/core/discordEvents.ts",
        "bot/src/lib/core/download.ts",
        "bot/src/lib/core/buttonEmoji.ts",
        "bot/src/lib/core/reactionContext.ts",
        "shared/core/panelModuleRegistry.ts",
        "bot/src/modules/tickets/names.ts",
        "bot/src/modules/tickets/parsers.ts",
        "bot/src/modules/tickets/permissions.ts",
        "bot/src/modules/tickets/confirm-flow.ts",
        "bot/src/modules/tickets/open.ts",
        "bot/src/modules/tickets/member-cache.ts",
        "bot/src/modules/welcome-message/card.ts",
        "bot/src/modules/reaction-roles/parsers.ts",
        "bot/src/modules/reaction-roles/cooldown.ts",
        "bot/src/modules/reaction-roles/guards.ts",
        "bot/src/modules/reaction-roles/respond.ts",
        "bot/src/modules/moderation-log/embeds.ts",
        "bot/src/modules/emojis/handlers.ts",
        "bot/src/modules/pic-repost-commands/handlers.ts",
        "web-admin/src/auth.ts",
        "web-admin/src/csp.ts",
        "web-admin/src/editor-logic.ts",
      ],
      thresholds: {
        lines: 50,
        statements: 50,
        branches: 41,
        functions: 50,
        "shared/core/**": {
          lines: 62,
          statements: 62,
          branches: 58,
          functions: 58,
        },
        "shared/modules/**": {
          lines: 65,
          statements: 65,
          branches: 35,
          functions: 20,
        },
      },
    },
  },
});
