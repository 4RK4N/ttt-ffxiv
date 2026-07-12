import { defineConfig } from "vitest/config";

export default defineConfig({
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
        "bot/src/modules/tickets/names.ts",
        "bot/src/modules/tickets/parsers.ts",
        "bot/src/modules/tickets/permissions.ts",
        "bot/src/modules/tickets/confirm-flow.ts",
        "bot/src/modules/tickets/guards.ts",
        "bot/src/modules/reaction-roles/parsers.ts",
        "bot/src/modules/reaction-roles/cooldown.ts",
        "bot/src/modules/reaction-roles/guards.ts",
        "bot/src/modules/reaction-roles/respond.ts",
        "bot/src/modules/moderation-log/embeds.ts",
        "bot/src/modules/emojis/handlers.ts",
        "bot/src/modules/pic-repost-commands/handlers.ts",
        "web-admin/src/csp.ts",
        "web-admin/src/editor-logic.ts",
      ],
      thresholds: {
        lines: 48,
        statements: 48,
        branches: 41,
        functions: 48,
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
