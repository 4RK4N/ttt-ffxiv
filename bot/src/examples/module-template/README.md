# Module template

Reference layout for a new bot module. **This folder is not loaded by the bot** — the module
loader only discovers `bot/src/modules/<name>/index.js`. Copy bot + shared template files when
adding a feature.

Also see [MODULES.md](../../../../MODULES.md) (catalog + data layout) and
[`.cursor/rules/module-template.mdc`](../../../../.cursor/rules/module-template.mdc).

## Quick start

1. Copy `bot/src/examples/module-template/` → `bot/src/modules/<name>/` and
   `bot/src/lib/modules/example-module/` → `bot/src/lib/modules/<name>/` (kebab-case namespace).
   Add `editorConfig` to `shared/modules/<name>/seed.sql` for the web editor (see existing modules).
   **Panel modules:** also copy [`panel-types.ts`](panel-types.ts) → `shared/modules/<name>/types.ts` and
   [`validate.ts`](validate.ts) → `shared/modules/<name>/validate.ts`.
2. Set namespace via `createModuleData('<name>', …)` in `bot/src/lib/modules/<name>/types.ts`
   (simple) or `shared/modules/<name>/types.ts` (panel — use `panel-types.ts` as starting point).
3. Register in `moduleTable.ts`, add `shared/modules/<name>/seed.sql` (`npm run generate-seed-sql`);
   run `./scripts/db/db-init.sh` on fresh installs.
4. Wire `bot/src/modules/<name>/index.ts` — enable `commands`, `init`, and/or `componentRoutes` as needed.
5. **Panel modules only:** uncomment panel block in `config-io.ts`; implement `panel.ts` + `publisher.ts`;
   wire `validate.ts` in `web-admin/src/store.ts`; register namespace in
   `bot/src/internal-api/publishRegistry.ts`.
6. Run `npm run deploy` after adding or changing slash commands.

## File map

| Location                            | File                | Purpose                                                                  |
| ----------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| `bot/src/lib/modules/<name>/`       | `types.ts`          | Simple modules — interfaces, defaults, `get()` / `data()`                |
| `shared/modules/<name>/`            | `types.ts`          | Panel modules — copy from [`panel-types.ts`](panel-types.ts)             |
| `bot/src/lib/modules/<name>/`       | `config-io.ts`      | IO boundary — **handlers import from here**, not `types.ts`              |
| `bot/src/modules/<name>/`           | `handlers.ts`       | Example patterns: guards, config/text reads, interactions                |
| `bot/src/modules/<name>/`           | `index.ts`          | `CommandModule` export only                                              |
| `shared/modules/<name>/`            | `seed.sql`          | Table DDL + editorConfig + defaults (web editor fields)                  |
| `bot/src/examples/module-template/` | `validate.ts`       | Copy to `shared/modules/<name>/` for panel row validation                |
| `shared/modules/<name>/`            | `validate.ts`       | Panel/list row validation (web editor save) — lives here after copy      |
| `bot/src/lib/modules/<name>/`       | `panel.ts`          | Panel publish payload — panel modules only                               |
| `bot/src/lib/modules/<name>/`       | `publisher.ts`      | Publish/unpublish — panel modules only (see example-module/publisher.ts) |

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

- **Defaults** in `types.ts` are fallbacks and seed values for `./scripts/db/db-init.sh`.
- Reads are **cached** in `shared/core/texts.ts` — the bot refreshes when DB rows change.
- **`isModuleEnabled(NAMESPACE)`** checks `config.enabled !== false` (web editor toggle).
- **Panel list patches** use `createConfigIo` at runtime (publish flow).

## config-io.ts: simple vs panel

| Module kind | `config-io.ts` role                                                          |
| ----------- | ---------------------------------------------------------------------------- |
| **Simple**  | Re-export `config`, `texts`, `NAMESPACE`, helpers (`targetChannelId`, …)     |
| **Panel**   | `createConfigIo` → `get*Config` / `update*` + re-export reads and `resolve*` |

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
| [`shared/core/moduleConfig.ts`](../../../../shared/core/moduleConfig.ts)           | `createModuleData`, `moduleDefaultsFromParts`, `findListItemById` |
| [`shared/core/texts.ts`](../../../../shared/core/texts.ts)                         | `format`, `isModuleEnabled`, `get()` / `data()` via `createModuleData` |
| [`bot/src/lib/core/discordInteractions.ts`](../../lib/core/discordInteractions.ts) | `replyEphemeral`, `memberHasAnyRole`                              |
| [`bot/src/lib/core/discordRoles.ts`](../../lib/core/discordRoles.ts)               | `tryAssignRole`, `tryRemoveRole`                                  |
| [`bot/src/lib/core/threads.ts`](../../lib/core/threads.ts)                         | `buildThreadName`, `startAndPopulateCommentsThread`               |
| [`shared/core/panelFields.ts`](../../../../shared/core/panelFields.ts)             | `parsePanelBaseFields` (validators)                               |
| [`bot/src/lib/core/panelPublisher.ts`](../../lib/core/panelPublisher.ts)           | Publish/unpublish orchestration                                   |

## Web editor validation

**Discord IDs (snowflakes):** `channel`, `role`, `channel-multi`, and `role-multi` fields are
validated on save in `web-admin/src/store.ts` (17–20 digits; empty = unset). See
any module's `editorConfig` in `shared/modules/<name>/seed.sql` for field examples.

**Panel / list rows:** add `validate.ts` and wire it in `web-admin/src/store.ts` inside the
`writeValues()` object-list loop (same pattern as `custom-embeds`, `reaction-roles`, `tickets`):

```typescript
if (plugin.namespace === "<your-namespace>" && field.key === "<listKey>") {
  try {
    validateYourRow(configRow, textRow);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid configuration.";
    throw new ValidationError(`${key}[${id}]: ${message}`);
  }
}
```

See [`validate.ts`](validate.ts) and [`shared/modules/tickets/validate.ts`](../../../../shared/modules/tickets/validate.ts)
for full examples.

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
