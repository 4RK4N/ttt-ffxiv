# Module template

Reference layout for a new bot module. **This folder is not loaded by the bot** — the module
loader only discovers `bot/src/modules/<name>/index.js`. Copy bot + shared template files when
adding a feature.

Also see [MODULES.md](../../../../MODULES.md) (catalog + data layout) and
[`.cursor/rules/module-template.mdc`](../../../../.cursor/rules/module-template.mdc).

## Quick start

1. Copy `bot/src/examples/module-template/` → `bot/src/modules/<name>/` and
   `bot/src/lib/modules/example-module/` → `bot/src/lib/modules/<name>/` (kebab-case namespace).
   Add `shared/modules/<name>/web-plugin.json` (and panel `types.ts` + `validate.ts` if needed).
2. In `bot/src/lib/modules/<name>/types.ts` (or shared `types.ts` for panels): set namespace via `createModuleConfig('<name>', …)`.
3. Copy `data/example-module/` → project **`data/<namespace>/`** (Docker volume). Rename
   `*.example.json` → `config.json` / `texts.json`.
4. Wire `bot/src/modules/<name>/index.ts` — enable `commands`, `init`, and/or `componentRoutes` as needed.
5. Add `shared/modules/<name>/web-plugin.json` if the module should appear in the web editor.
6. **Panel modules only:** wire `validate.ts` in `web-admin/src/store.ts` and register namespace in
   `bot/src/internal-api/publishRegistry.ts`.
7. Run `npm run deploy` after adding or changing slash commands.

## File map

| Location                  | File                | Purpose                                                                         |
| ------------------------- | ------------------- | ------------------------------------------------------------------------------- |
| `bot/src/lib/modules/<name>/` | `types.ts`          | Interfaces, defaults, `createModuleConfig`, `config()`, `texts()` (non-panel) |
| `shared/modules/<name>/`  | `types.ts`          | Panel modules — shared contract with web validators                           |
| `bot/src/lib/modules/<name>/` | `config-io.ts`      | IO boundary — **handlers import from here**, not `types.ts`                     |
| `bot/src/modules/<name>/` | `handlers.ts`       | Example patterns: guards, config/text reads, interactions                       |
| `bot/src/modules/<name>/` | `index.ts`          | `CommandModule` export only                                                     |
| `shared/modules/<name>/`  | `web-plugin.json`   | Web editor manifest (`title`, `description`, `fields`)                          |
| `shared/modules/<name>/`  | `validate.ts`       | Panel/list row validation (web editor save) — optional                          |
| `bot/src/lib/modules/<name>/`  | `panel.ts`          | Panel publish payload — panel modules only                                      |
| `bot/src/lib/modules/<name>/`  | `publisher.ts`      | Publish/unpublish — panel modules only                                          |
| `data/example-module/`    | (under this folder) | Seed JSON for `data/<namespace>/`                                               |

## Import rule

| Import from        | Use for                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| **`config-io.ts`** | `NAMESPACE`, `config()`, `texts()`, `resolve*()`, `get*Config`, `update*` |
| **`types.ts`**     | TypeScript types only (`ResolvedExamplePanel`, etc.)                      |
| **`handlers.ts`**  | Shared handler logic (optional but recommended)                           |

## How config and texts are read

```
data/<namespace>/config.json  ──►  config()  in types.ts  ──►  re-exported by config-io.ts
data/<namespace>/texts.json   ──►  texts()   in types.ts  ──►  re-exported by config-io.ts
```

- **Defaults** in `types.ts` are fallbacks; JSON overrides at runtime.
- Reads are **mtime-cached** in `shared/core/texts.ts` — web editor writes call
  `invalidateModuleCache(namespace)` so the bot sees edits without restart.
- **`isModuleEnabled(NAMESPACE)`** checks `config.enabled !== false` (web editor toggle).
- **No `text-io.ts`** — texts are edited via web editor or hand; only config list items use
  `createConfigIo` at runtime (publish flow).

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

| Module                                                                                 | Use for                                                           |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`shared/core/moduleConfig.ts`](../../../../shared/core/moduleConfig.ts)               | `createModuleConfig`, `resolveKeyedItem`                          |
| [`shared/core/texts.ts`](../../../../shared/core/texts.ts)                             | `format`, `isModuleEnabled`, `getConfig`/`getTexts` (via factory) |
| [`bot/src/lib/core/discordInteractions.ts`](../../lib/core/discordInteractions.ts) | `replyEphemeral`, `memberHasAnyRole`                              |
| [`bot/src/lib/core/discordRoles.ts`](../../lib/core/discordRoles.ts)               | `tryAssignRole`, `tryRemoveRole`                                  |
| [`bot/src/lib/core/threads.ts`](../../lib/core/threads.ts)                         | `buildThreadName`, `startAndPopulateCommentsThread`               |
| [`shared/core/panelFields.ts`](../../../../shared/core/panelFields.ts)                 | `parsePanelBaseFields` (validators)                               |
| [`bot/src/lib/core/panelPublisher.ts`](../../lib/core/panelPublisher.ts)           | Publish/unpublish orchestration                                   |

## Web editor validation

**Discord IDs (snowflakes):** `channel`, `role`, `channel-multi`, and `role-multi` fields are
validated on save in `web-admin/src/store.ts` (17–20 digits; empty = unset). See
[`web-plugin.json`](web-plugin.json) `channelId` field.

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

| Export              | Use for                                                        |
| ------------------- | -------------------------------------------------------------- |
| `init(client)`      | `client.on(Events.…)` listeners                                |
| `commands[]`        | Slash commands — requires `npm run deploy`                     |
| `componentRoutes[]` | `{ prefix: '<namespace>:', handle }` for buttons/selects       |
| `publish*()`        | Panel modules — register in `bot/src/internal-api/publishRegistry.ts` |

## Data folder

**Move `data/example-module/` to the Docker data volume** — project-root `data/`
(`./data:/app/data` in `docker-compose.yml`). Details: [`data/example-module/README.md`](data/example-module/README.md).

The namespace in `createModuleConfig('…')` must match the folder name under `data/`.

## Debugging

During local dev, log loaded config from `init()` (remove before shipping):

```typescript
console.log(`[${NAMESPACE}]`, config());
```

Use `console.warn` / `console.error` with a `[${NAMESPACE}]` prefix for misconfiguration and runtime failures — see `index.ts` `initExample`.
