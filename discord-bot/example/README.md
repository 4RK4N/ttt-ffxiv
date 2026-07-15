# Example module

Reference layout for a new bot module. **This tree is not loaded by the bot** — the module
loader only discovers `bot/src/modules/<name>/index.js`. Copy files from here into the real
project when adding a feature.

Also see [MODULES.md](../MODULES.md) (catalog + data layout) and
[`.cursor/rules/module-template.mdc`](../../.cursor/rules/module-template.mdc).

## Layout

Mirrors `discord-bot/` — copy subtrees into the matching paths:

```text
example/
  README.md                          ← you are here
  bot/src/modules/example-module/    → bot/src/modules/<name>/
  bot/src/lib/modules/example-module/ → bot/src/lib/modules/<name>/
  shared/modules/example-module/     → shared/modules/<name>/   (panel modules)
  data/example-module/               → data/<name>/               (binary assets only)
```

## Quick start

1. Copy `example/bot/src/modules/example-module/` → `bot/src/modules/<name>/` and
   `example/bot/src/lib/modules/example-module/` → `bot/src/lib/modules/<name>/` (kebab-case namespace).
   Adapt `example/shared/modules/example-module/seed.sql` → `shared/modules/<name>/seed.sql`.
   **Panel modules:** also copy `types.ts` and `validate.ts` from `example/shared/modules/example-module/`.
2. Set namespace via `createModuleData('<name>', …)` in `bot/src/lib/modules/<name>/types.ts`
   (simple) or `shared/modules/<name>/types.ts` (panel — use `example/shared/.../types.ts` as starting point).
3. Register in `moduleTable.ts`, add `shared/modules/<name>/seed.sql` (DDL + `editorConfig` + `INSERT`s for each key in `MODULE_DEFAULTS` — **keep TS defaults and seed rows in sync by hand**);
   run `./scripts/db/db-init.sh` on fresh installs.
4. Wire `bot/src/modules/<name>/index.ts` — enable `commands`, `init`, and/or `componentRoutes` as needed.
5. **Panel modules only:** uncomment panel block in `config-io.ts`; implement `panel.ts` + `publisher.ts`;
   add the namespace to `shared/core/panelModuleRegistry.ts` (publish handlers and web-admin row validation).
6. Run `npm run deploy` after adding or changing slash commands.

## File map

| Copy from (example/)                    | Copy to                         | Purpose                                                                  |
| --------------------------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| `bot/src/lib/modules/example-module/`   | `bot/src/lib/modules/<name>/`   | `types.ts` (simple), `config-io.ts`, `panel.ts`, `publisher.ts`          |
| `bot/src/modules/example-module/`       | `bot/src/modules/<name>/`       | `handlers.ts`, `index.ts`                                                |
| `shared/modules/example-module/types.ts`| `shared/modules/<name>/types.ts`| Panel modules — shared contract                                          |
| `shared/modules/example-module/validate.ts` | `shared/modules/<name>/`    | Panel/list row validation (web editor save)                              |
| `shared/modules/example-module/seed.sql`| `shared/modules/<name>/`        | Table DDL + editorConfig + defaults                                      |
| `data/example-module/`                  | `data/<name>/`                  | Binary assets only (images, fonts)                                       |

## Import rule

| Import from        | Use for                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| **`config-io.ts`** | `NAMESPACE`, `get()`, `data()`, `resolve*()`, `get*Config`, `update*` |
| **`types.ts`**     | TypeScript types only (`ResolvedExamplePanel`, etc.)                      |
| **`handlers.ts`**  | Shared handler logic (optional but recommended)                           |

## How config and texts are read

```
Turso `module_*` table  ──►  get() / data()  in types.ts  ──►  re-exported by config-io.ts
```

- **Defaults** in `types.ts` use `defineSimpleModule()` for simple modules; keep `MODULE_DEFAULTS` and `seed.sql` `INSERT` rows in sync manually.
- Reads use an **in-process store** in `shared/core/texts.ts` — reloaded on startup and after DB writes.
- **`isModuleEnabled(NAMESPACE)`** checks `config.enabled !== false` (web editor toggle).
- **Panel list patches** use `createConfigIo` at runtime (publish flow).

## config-io.ts: simple vs panel

| Module kind | `config-io.ts` role                                                          |
| ----------- | ---------------------------------------------------------------------------- |
| **Simple**  | `export * from "./types.js"` — IO boundary only                              |
| **Panel**   | `export * from shared/types` + `createConfigIo` update/get exports           |

After publish, patch config rows:

```typescript
await updateExamplePanel(panelId, {
  published: true,
  panelMessageId: message.id,
  channelId: targetChannel,
});
```

## Shared core helpers

Reuse these instead of duplicating logic:

| Module                                                                             | Use for                                                           |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`shared/core/moduleConfig.ts`](../shared/core/moduleConfig.ts)                    | `createModuleData`, `moduleDefaultsFromParts`, `findListItemById` |
| [`shared/core/texts.ts`](../shared/core/texts.ts)                                   | `format`, `isModuleEnabled`, `get()` / `data()` via `createModuleData` |
| [`bot/src/lib/core/discordInteractions.ts`](../bot/src/lib/core/discordInteractions.ts) | `replyEphemeral`, `memberHasAnyRole`                         |
| [`bot/src/lib/core/discordRoles.ts`](../bot/src/lib/core/discordRoles.ts)          | `tryAssignRole`, `tryRemoveRole`                                  |
| [`bot/src/lib/core/threads.ts`](../bot/src/lib/core/threads.ts)                    | `buildThreadName`, `startAndPopulateCommentsThread`               |
| [`shared/core/panelFields.ts`](../shared/core/panelFields.ts)                      | `parsePanelBaseFields` (validators)                               |
| [`bot/src/lib/core/panelPublisher.ts`](../bot/src/lib/core/panelPublisher.ts)     | Publish/unpublish orchestration                                   |

## Web editor validation

**Discord IDs (snowflakes):** `channel`, `role`, `channel-multi`, and `role-multi` fields are
validated on save in `web-admin/src/store.ts` (17–20 digits; empty = unset). See
any module's `editorConfig` in `shared/modules/<name>/seed.sql` for field examples.

**Panel / list rows:** add `validate.ts` and register the namespace in
`shared/core/panelModuleRegistry.ts` (web-admin validates list rows automatically).

See [`shared/modules/example-module/validate.ts`](shared/modules/example-module/validate.ts) and
[`shared/modules/tickets/validate.ts`](../shared/modules/tickets/validate.ts) for full examples.

## Module loader patterns (`index.ts`)

| Export              | Use for                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `init(client)`      | `client.on(Events.…)` listeners                                                                         |
| `commands[]`        | Slash commands — requires `npm run deploy`                                                              |
| `componentRoutes[]` | `{ prefix: '<namespace>:', handle }` for buttons/selects                                                |
| `publish*()`        | Panel modules — export from `bot/src/lib/modules/<name>/publisher.ts`; register in `publishRegistry.ts` |

## On-disk data

Use `data/<namespace>/` only for **binary assets** (images, fonts). See
[`data/example-module/README.md`](data/example-module/README.md).

The namespace in `createModuleData('…')` must match the module table slug.

## Debugging

During local dev, log loaded config from `init()` (remove before shipping):

```typescript
console.log(`[${NAMESPACE}]`, data());
```

Use `console.warn` / `console.error` with a `[${NAMESPACE}]` prefix for misconfiguration and runtime failures — see `index.ts` `initExample`.
