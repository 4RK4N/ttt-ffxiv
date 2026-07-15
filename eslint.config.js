import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "discord-bot/dist/",
      "discord-bot/node_modules/",
      "discord-bot/example/",
      "node_modules/",
      "dist/",
      "website/",
      // Vite CSS entry — not part of web-admin tsc
      "discord-bot/web-admin/vite.config.ts",
      "discord-bot/web-admin/src/ui/assets/admin-styles.ts",
    ],
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: [
      "discord-bot/bot/**/*.ts",
      "discord-bot/shared/**/*.ts",
      "discord-bot/web-admin/**/*.ts",
      "scripts/**/*.ts",
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["discord-bot/tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./discord-bot/tests/tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
