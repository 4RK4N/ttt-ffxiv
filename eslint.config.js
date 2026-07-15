import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist/",
      "node_modules/",
      "website/dist/",
      "website/.astro/",
      ".astro/",
      "example/",
      // Vite CSS entry — not part of web-admin tsc
      "web-admin/vite.config.ts",
      "web-admin/src/ui/assets/admin-styles.ts",
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
      "bot/**/*.ts",
      "shared/**/*.ts",
      "web-admin/**/*.ts",
      "scripts/**/*.ts",
      "website/src/**/*.ts",
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
    files: ["website/astro.config.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tests/tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
