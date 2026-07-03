# Module template

Reference layout for a new bot module. **This folder is not loaded by the bot** — the module
loader only discovers `src/modules/<name>/index.js`. Copy this folder to
`src/modules/<your-module-name>/` when adding a feature.

Also see [MODULES.md](../../../MODULES.md) (catalog + data layout) and
[`.cursor/rules/module-template.mdc`](../../.cursor/rules/module-template.mdc).

## Quick start

1. Copy `src/examples/module-template/` → `src/modules/<name>/` (kebab-case namespace).
2. In `types.ts`: set `NAMESPACE` via `createModuleConfig('<name>', …)` to match the folder name.
3. Copy `data/example-module/` → project **`data/<namespace>/`** (Docker volume). Rename
   `*.example.json` → `config.json` / `texts.json`.
4. Wire `index.ts` — enable `commands`, `init`, and/or `componentRoutes` as needed.
5. Add `web-plugin.json` if the module should appear in the web editor.
6. **Panel modules only:** wire `validate.ts` in `src/web/store.ts` and register publish routes in
   `src/web/publishHandlers.ts`.
7. Run `npm run deploy` after adding or changing slash commands.

## File map

| File | Purpose |
|------|---------|
| [`types.ts`](types.ts) | Interfaces, defaults, `createModuleConfig`, `config()`, `texts()`, `resolve*()` |
| [`config-io.ts`](config-io.ts) | IO boundary — **handlers import from here**, not `types.ts` |
| [`handlers.ts`](handlers.ts) | Example patterns: guards, config/text reads, interactions |
| [`index.ts`](index.ts) | `CommandModule` export only |
| [`web-plugin.json`](web-plugin.json) | Web editor manifest (`title`, `description`, `fields`) |
| [`validate.ts`](validate.ts) | Panel/list row validation (web editor save) — optional |
| [`panel.ts`](panel.ts) | Panel publish payload — panel modules only |
| [`data/example-module/`](data/example-module/) | Seed JSON for `data/<namespace>/` |

## Import rule

| Import from | Use for |
|-------------|---------|
| **`config-io.ts`** | `NAMESPACE`, `config()`, `texts()`, `resolve*()`, `get*Config`, `update*` |
| **`types.ts`** | TypeScript types only (`ResolvedExamplePanel`, etc.) |
| **`handlers.ts`** | Shared handler logic (optional but recommended) |

## How config and texts are read

```
data/<namespace>/config.json  ──►  config()  in types.ts  ──►  re-exported by config-io.ts
data/<namespace>/texts.json   ──►  texts()   in types.ts  ──►  re-exported by config-io.ts
```

- **Defaults** in `types.ts` are fallbacks; JSON overrides at runtime.
- Reads are **mtime-cached** in `src/core/texts.ts` — web editor writes call
  `invalidateModuleCache(namespace)` so the bot sees edits without restart.
- **`isModuleEnabled(NAMESPACE)`** checks `config.enabled !== false` (web editor toggle).
- **No `text-io.ts`** — texts are edited via web editor or hand; only config list items use
  `createConfigIo` at runtime (publish flow).

## config-io.ts: simple vs panel

| Module kind | `config-io.ts` role |
|-------------|---------------------|
| **Simple** | Re-export `config`, `texts`, `NAMESPACE`, helpers (`targetChannelId`, …) |
| **Panel** | `createConfigIo` → `get*Config` / `update*` + re-export reads and `resolve*` |

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

| Module | Use for |
|--------|---------|
| [`src/core/moduleConfig.ts`](../../core/moduleConfig.ts) | `createModuleConfig`, `resolveKeyedItem` |
| [`src/core/texts.ts`](../../core/texts.ts) | `format`, `isModuleEnabled`, `getConfig`/`getTexts` (via factory) |
| [`src/core/discordInteractions.ts`](../../core/discordInteractions.ts) | `replyEphemeral`, `memberHasAnyRole` |
| [`src/core/discordRoles.ts`](../../core/discordRoles.ts) | `tryAssignRole`, `tryRemoveRole` |
| [`src/core/threads.ts`](../../core/threads.ts) | `buildThreadName`, `startAndPopulateCommentsThread` |
| [`src/core/panelFields.ts`](../../core/panelFields.ts) | `parsePanelBaseFields` (validators) |
| [`src/core/panelPublisher.ts`](../../core/panelPublisher.ts) | Publish/unpublish orchestration |

## Web editor validation

**Discord IDs (snowflakes):** `channel`, `role`, `channel-multi`, and `role-multi` fields are
validated on save in `src/web/store.ts` (17–20 digits; empty = unset). See
[`web-plugin.json`](web-plugin.json) `channelId` field.

**Panel / list rows:** add `validate.ts` and wire it in `src/web/store.ts` inside the
`writeValues()` object-list loop (same pattern as `custom-embeds`, `reaction-roles`, `tickets`):

```typescript
if (plugin.namespace === '<your-namespace>' && field.key === '<listKey>') {
  try {
    validateYourRow(configRow, textRow);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid configuration.';
    throw new ValidationError(`${key}[${id}]: ${message}`);
  }
}
```

See [`validate.ts`](validate.ts) and [`src/modules/tickets/validate.ts`](../../modules/tickets/validate.ts)
for full examples.

## Module loader patterns (`index.ts`)

| Export | Use for |
|--------|---------|
| `init(client)` | `client.on(Events.…)` listeners |
| `commands[]` | Slash commands — requires `npm run deploy` |
| `componentRoutes[]` | `{ prefix: '<namespace>:', handle }` for buttons/selects |
| `publish*()` | Panel modules — register in `src/web/publishHandlers.ts` |

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
