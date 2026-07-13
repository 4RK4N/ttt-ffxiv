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
   bot/src/examples/module-template/web-plugin.json  →  shared/modules/<name>/web-plugin.json
   ```

   Use kebab-case for `<name>` (e.g. `my-feature`). Delete unused files (`panel.ts`, `validate.ts` for simple modules).

2. **Set the namespace** — `createModuleData('<name>', …)` must match the PostgreSQL table prefix:
   - **Simple modules:** `bot/src/lib/modules/<name>/types.ts`
   - **Panel modules:** `shared/modules/<name>/types.ts` (copy from [`panel-types.ts`](bot/src/examples/module-template/panel-types.ts))

3. **Register the module table** — add the namespace to `MODULE_NAMESPACES` in `shared/core/moduleTable.ts` and `scripts/db/schema.sql`, then run `./scripts/db/db-update.sh <file.sql>` when applying schema changes.

4. **Wire `index.ts`** — export a `CommandModule` with at least one of:
   - `init(client)` — event listeners
   - `commands[]` — slash commands (then `npm run deploy`)
   - `componentRoutes[]` — buttons/selects by `customId` prefix

5. **Web editor (optional)** — keep/adapt `web-plugin.json`; rebuild so `copy-web-plugins.js` copies it to `dist/`.

6. **Panel modules only** — copy [`panel-types.ts`](bot/src/examples/module-template/panel-types.ts) and [`validate.ts`](bot/src/examples/module-template/validate.ts) to `shared/modules/<name>/`; bot lib `panel.ts` / `publisher.ts`; wire validate in `web-admin/src/store.ts`; register namespace in `bot/src/internal-api/publishRegistry.ts`; add defaults to `scripts/db/moduleSeedDefaults.ts`.

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

Runtime settings and copy live in PostgreSQL. Edit via the web editor — the bot hot-reloads on a short interval.

## Project layout

```
shared/           core/, config.ts, modules/ (types, validate, web-plugin.json)
bot/src/          index.ts, moduleLoader.ts, modules/ (handlers + index.ts), examples/
web-admin/src/    web editor server + UI
website/          Astro public site (see INSTALL.md § Part 7)
Dockerfile        bot + web-editor image targets (shared npm ci)
data/             DB bootstrap config.json + binary assets (welcome media)
scripts/db/       db-init.sh, db-update.sh, db-dump.sh, cli.ts, schema.sql
postgres-data/    PostgreSQL data directory (gitignored)
```

## Web editor

Browser UI for editing module settings in PostgreSQL (side-tabs per module).
Runs as a separate container on the same Docker network as Postgres — no restart needed for module edits.

- Per-module **on/off** toggle (`enabled` in `module_*` table)
- Fields declared in each module's `web-plugin.json`
- Guild **administrator** access via Discord OAuth

```bash
npm run build
npm run web        # or npm run web:dev
```

With Docker: `./scripts/build.sh` for deploy (see [INSTALL.md § Part 4](INSTALL.md#part-4---build-the-images)).

## Setup

1. Node.js 24+ (local dev only; Docker-only servers need only Docker)
2. `npm install`
3. [Developer Portal](https://discord.com/developers/applications): bot token + client ID; invite with Administrator (see [INSTALL.md](INSTALL.md))
4. `cp data/config.example.json data/config.json` — DB bootstrap only
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
