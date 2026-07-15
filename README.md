# ttt-ffxiv

Custom Discord bot for Tiny Temptation Tubs (TTT), built with an extensible module
system so new features can be added without refactoring the core.

**Module catalog and data layout:** [discord-bot/MODULES.md](discord-bot/MODULES.md)
**Hosting, Docker, and config reference:** [INSTALL.md](INSTALL.md)
**Public venue website:** [INSTALL.md § Part 7](INSTALL.md#part-7---public-website-ttt-ffxivcom) — Astro + Tailwind, sources in `website/src/`

## How to add a new module

Copy the reference template — it is **not loaded by the bot** (only `discord-bot/bot/src/modules/*/index.ts` is).

1. **Copy source files** (paths relative to `discord-bot/`)

   ```text
   example/bot/src/modules/example-module/       →  bot/src/modules/<name>/
   example/bot/src/lib/modules/example-module/   →  bot/src/lib/modules/<name>/
   example/shared/modules/example-module/          →  shared/modules/<name>/   (panel modules)
   ```

   Use kebab-case for `<name>` (e.g. `my-feature`). Delete unused files (`panel.ts`, `validate.ts` for simple modules).

2. **Set the namespace** — `createModuleData('<name>', …)` must match the Turso table prefix:
   - **Simple modules:** `bot/src/lib/modules/<name>/types.ts`
   - **Panel modules:** `shared/modules/<name>/types.ts` (copy from [`example/shared/modules/example-module/types.ts`](discord-bot/example/shared/modules/example-module/types.ts))

3. **Register the module table** — add the namespace to `MODULE_NAMESPACES` in `shared/core/moduleTable.ts`, add `shared/modules/<name>/seed.sql` (adapt [`example/shared/modules/example-module/seed.sql`](discord-bot/example/shared/modules/example-module/seed.sql)), then `./discord-bot/scripts/db/db-update.sh <file.sql>` for incremental changes on a live DB. **Keep `MODULE_DEFAULTS` in `types.ts` and the matching `INSERT` rows in `seed.sql` in sync manually** (same keys/values; `editorConfig` lives only in `seed.sql`).

4. **Wire `index.ts`** — export a `CommandModule` with at least one of:
   - `init(client)` — event listeners
   - `commands[]` — slash commands (then `npm run deploy` from `discord-bot/`)
   - `componentRoutes[]` — buttons/selects by `customId` prefix

5. **Web editor (optional)** — add an `editorConfig` row in `seed.sql` (title, description, fields). When you change code defaults in `types.ts`, update the corresponding `INSERT` rows in `seed.sql` too.

6. **Panel modules only** — copy `types.ts` and `validate.ts` from `example/shared/modules/example-module/` to `shared/modules/<name>/`; implement bot lib `panel.ts` / `publisher.ts`; add namespace to `shared/core/panelModuleRegistry.ts`.

Handlers import config/texts from **`bot/src/lib/modules/<name>/config-io.ts`**, not `types.ts`. Full patterns: [`discord-bot/example/README.md`](discord-bot/example/README.md).

```bash
cd discord-bot
npm run build
npm run deploy    # if you added slash commands
npm start
```

No core changes needed — [`moduleLoader.ts`](discord-bot/bot/src/moduleLoader.ts) discovers the new folder automatically.

## Modules (summary)

| Module                                                              | What it does                           |
| ------------------------------------------------------------------- | -------------------------------------- |
| [welcome-message](discord-bot/MODULES.md#welcome-message)                       | Welcome card + rules on join           |
| [pic-repost-commands](discord-bot/MODULES.md#pic-repost-commands-pic-post)      | `/pic` / `/post` image repost + thread |
| [links-pics-vids-autothread](discord-bot/MODULES.md#links-pics-vids-autothread) | Auto comments threads in pics channels |
| [tickets](discord-bot/MODULES.md#tickets)                                       | Private-thread ticket panels           |
| [reaction-roles](discord-bot/MODULES.md#reaction-roles)                         | Button/emoji/dropdown role panels      |
| [moderation-log](discord-bot/MODULES.md#moderation-log)                         | Message/member event logging           |
| [custom-embeds](discord-bot/MODULES.md#custom-embeds)                           | Static embed info panels               |
| [emojis](discord-bot/MODULES.md#emojis-emoji-add-emoji-copy)                    | `/emoji-add` / `/emoji-copy`           |

Runtime settings and copy live in Turso (`data/ttt.db`). Edit via the web editor — the bot hot-reloads on save.

## Project layout

```
discord-bot/      bot/, shared/, web-admin/, scripts/, tests/, example/
  Dockerfile      single bot+editor image target (node:24-slim)
  MODULES.md      module catalog
website/          Astro public site (see INSTALL.md § Part 7)
data/             config.json, ttt.db, binary assets (welcome media)
```

## Web editor

Browser UI for editing module settings in Turso (side-tabs per module).
Runs in the same process as the bot — no restart needed for module edits.

- Per-module **on/off** toggle (`enabled` in `module_*` table)
- Fields declared in each module's `editorConfig` row
- Guild **administrator** access via Discord OAuth

```bash
cd discord-bot
npm run build
npm start          # combined bot + editor
npm run web:dev    # editor only (dev)
```

With Docker: `./scripts/build.sh bot` for deploy (see [INSTALL.md § Part 4](INSTALL.md#part-4---build-the-images)).

## Setup

1. Node.js 24+ (local dev only; Docker-only servers need only Docker)
2. `cd discord-bot && npm install`
3. [Developer Portal](https://discord.com/developers/applications): bot token + client ID; invite with Administrator (see [INSTALL.md](INSTALL.md))
4. `cp data/config.example.json data/config.json` — DB path only (from repo root)
5. `./discord-bot/scripts/db/db-init.sh` — schema, app secrets (`app_config`), module defaults (see [INSTALL.md](INSTALL.md))

## Deploy slash commands

```bash
cd discord-bot
npm run deploy
```

Guild ID in config → instant guild commands. Omit → global (~1 h).

## Run

```bash
cd discord-bot
npm start
```

## Notes

- Attachment size limited by server upload cap; oversize files reported to the user.
