# ttt-bot

Custom Discord bot for Tiny Temptation Tubs (TTT), built with an extensible module
system so new features can be added without refactoring the core.

**Module catalog and data layout:** [MODULES.md](MODULES.md)
**Hosting, Docker, and config reference:** [INSTALL.md](INSTALL.md)
**Public venue website:** [INSTALL.md § Part 7](INSTALL.md#part-7---public-website-ttt-ffxivcom) — Astro + Tailwind, sources in `website/src/`

## How to add a new module

Copy the reference template — it is **not loaded by the bot** (only `bot/src/modules/*/index.ts` is).

1. **Copy source files**

   ```text
   bot/src/examples/module-template/  →  bot/src/modules/<name>/   (handlers, index.ts)
   bot/src/lib/modules/example-module/  →  bot/src/lib/modules/<name>/  (config-io, types, panel…)
   ```

   Use kebab-case for `<name>` (e.g. `my-feature`). Delete unused files (`panel.ts`, `validate.ts` for simple modules).

2. **Set the namespace** — `createModuleData('<name>', …)` must match the Turso table prefix:
   - **Simple modules:** `bot/src/lib/modules/<name>/types.ts`
   - **Panel modules:** `shared/modules/<name>/types.ts` (copy from [`panel-types.ts`](bot/src/examples/module-template/panel-types.ts))

3. **Register the module table** — add the namespace to `MODULE_NAMESPACES` in `shared/core/moduleTable.ts`, add `shared/modules/<name>/seed.sql` (run `npm run generate-seed-sql` after editing `editorConfig` in an existing seed), then `./scripts/db/db-update.sh <file.sql>` for incremental changes on a live DB.

4. **Wire `index.ts`** — export a `CommandModule` with at least one of:
   - `init(client)` — event listeners
   - `commands[]` — slash commands (then `npm run deploy`)
   - `componentRoutes[]` — buttons/selects by `customId` prefix

5. **Web editor (optional)** — add an `editorConfig` row in `seed.sql` (title, description, fields). Regenerate with `npm run generate-seed-sql` when defaults change; edit `editorConfig` directly in `seed.sql` when changing editor fields.

6. **Panel modules only** — copy [`panel-types.ts`](bot/src/examples/module-template/panel-types.ts) and [`validate.ts`](bot/src/examples/module-template/validate.ts) to `shared/modules/<name>/`; bot lib `panel.ts` / `publisher.ts`; wire validate in `web-admin/src/store.ts`; register namespace in `bot/src/internal-api/publishRegistry.ts`.

Handlers import config/texts from **`bot/src/lib/modules/<name>/config-io.ts`**, not `types.ts`. Patterns and core helpers are documented in [`bot/src/examples/module-template/README.md`](bot/src/examples/module-template/README.md).

```bash
npm run build
npm run deploy    # if you added slash commands
npm start
```

No core changes needed — [`moduleLoader.ts`](bot/src/moduleLoader.ts) discovers the new folder automatically.

## Modules (summary)

| Module                                                              | What it does                           |
| ------------------------------------------------------------------- | -------------------------------------- |
| [welcome-message](MODULES.md#welcome-message)                       | Welcome card + rules on join           |
| [pic-repost-commands](MODULES.md#pic-repost-commands-pic-post)      | `/pic` / `/post` image repost + thread |
| [links-pics-vids-autothread](MODULES.md#links-pics-vids-autothread) | Auto comments threads in pics channels |
| [tickets](MODULES.md#tickets)                                       | Private-thread ticket panels           |
| [reaction-roles](MODULES.md#reaction-roles)                         | Button/emoji/dropdown role panels      |
| [moderation-log](MODULES.md#moderation-log)                         | Message/member event logging           |
| [custom-embeds](MODULES.md#custom-embeds)                           | Static embed info panels               |
| [emojis](MODULES.md#emojis-emoji-add-emoji-copy)                    | `/emoji-add` / `/emoji-copy`           |

Runtime settings and copy live in Turso (`data/ttt.db`). Edit via the web editor — the bot hot-reloads on save.

## Project layout

```
shared/           core/, config.ts, modules/ (types, validate, seed.sql)
bot/src/          app.ts, index.ts, moduleLoader.ts, modules/, examples/
web-admin/src/    web editor UI (served by combined app)
website/          Astro public site (see INSTALL.md § Part 7)
Dockerfile        single bot+editor image target (node:24-slim)
data/             config.json, ttt.db, binary assets (welcome media)
scripts/db/       db-init.sh, db-update.sh, db-dump.sh, cli.ts, schema.sql
```

## Web editor

Browser UI for editing module settings in Turso (side-tabs per module).
Runs in the same process as the bot — no restart needed for module edits.

- Per-module **on/off** toggle (`enabled` in `module_*` table)
- Fields declared in each module's `editorConfig` row
- Guild **administrator** access via Discord OAuth

```bash
npm run build
npm start          # combined bot + editor
npm run web:dev    # editor only (dev)
```

With Docker: `./scripts/build.sh bot` for deploy (see [INSTALL.md § Part 4](INSTALL.md#part-4---build-the-images)).

## Setup

1. Node.js 24+ (local dev only; Docker-only servers need only Docker)
2. `npm install`
3. [Developer Portal](https://discord.com/developers/applications): bot token + client ID; invite with Administrator (see [INSTALL.md](INSTALL.md))
4. `cp data/config.example.json data/config.json` — DB path only
5. `./scripts/db/db-init.sh` — schema, app secrets (`app_config`), module defaults (see [INSTALL.md](INSTALL.md))

## Deploy slash commands

```bash
npm run deploy
```

Guild ID in config → instant guild commands. Omit → global (~1 h).

## Run

```bash
npm start
```

## Notes

- Attachment size limited by server upload cap; oversize files reported to the user.
