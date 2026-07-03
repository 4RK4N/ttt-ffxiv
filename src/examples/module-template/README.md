# Module template

Reference layout for a new bot module. **This folder is not loaded by the bot** — the module
loader only discovers `src/modules/<name>/index.js`. Copy this folder to
`src/modules/<your-module-name>/` when adding a feature.

## Quick start

1. Copy `src/examples/module-template/` → `src/modules/<name>/` (kebab-case namespace).
2. Rename types/defaults in `types.ts`; delete panel files if unused.
3. Copy `data/example-module/` to project **`data/`** (Docker volume). Rename
   `*.example.json` → `config.json` / `texts.json`.
4. Wire `index.ts` — enable `commands`, `init`, and/or `componentRoutes` as needed.
5. Run `npm run deploy` after adding or changing slash commands.

## File map

| File | Purpose |
|------|---------|
| [`types.ts`](types.ts) | Interfaces, `CONFIG_DEFAULTS`, `TEXT_DEFAULTS`, `config()`, `texts()`, helpers |
| [`config-io.ts`](config-io.ts) | IO boundary — import this in handlers (not `types.ts` directly) |
| [`handlers.ts`](handlers.ts) | **Example patterns** for reading config/texts, guards, `format()` |
| [`index.ts`](index.ts) | `CommandModule` export: init, commands, componentRoutes, publish |
| [`web-plugin.json`](web-plugin.json) | Web editor field manifest |
| [`panel.ts`](panel.ts), [`validate.ts`](validate.ts) | Panel modules only |
| [`data/example-module/`](data/example-module/) | Seed JSON — move to Docker `data/` volume |

## How config and texts are read

```
data/<namespace>/config.json  ──►  config()   in types.ts  ──►  re-exported by config-io.ts
data/<namespace>/texts.json   ──►  texts()    in types.ts  ──►  re-exported by config-io.ts
```

- **Defaults** in `types.ts` are fallbacks; JSON overrides at runtime.
- Reads are **mtime-cached** — edits (web editor or hand) apply on the next call without restart.
- **`isModuleEnabled(NAMESPACE)`** checks `config.enabled !== false` (web editor toggle).

See [`handlers.ts`](handlers.ts) for copy-paste patterns: guards, `texts().disabled`, `format(texts().greeting, { mention })`.

## config-io.ts: simple vs panel

| Module kind | config-io.ts role |
|-------------|-------------------|
| **Simple** | Re-exports `config`, `texts`, `NAMESPACE` — no runtime writes |
| **Panel** | Adds `createConfigIo` → `get*Config` / `update*` for publish state patches |

Texts are never written at runtime — only via web editor. There is no `text-io.ts`.

## Module loader patterns (index.ts)

| Export | Use for |
|--------|---------|
| `init(client)` | `client.on(Events.…)` listeners |
| `commands[]` | Slash commands (`SlashCommandBuilder` + `execute`) |
| `componentRoutes[]` | `{ prefix: 'my-module:', handle }` for buttons/selects |
| `publish*Panel()` | Panel modules — register in `src/web/publishHandlers.ts` |

## Data folder

**Move `data/example-module/` to the Docker data volume** — project-root `data/`
(`./data:/app/data` in `docker-compose.yml`). See [`data/example-module/README.md`](data/example-module/README.md).

The `NAMESPACE` in `types.ts` must match the folder name under `data/`.
