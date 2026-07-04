# Example module data

**Move this folder to the Docker data volume directory** (or your local `data/` tree).

With the default Docker Compose setup, that is the project-root `data/` folder on the
host — bind-mounted to `/app/data` inside the bot and web-editor containers
(see `docker-compose.yml`: `./data:/app/data`).

## Setup

1. Copy this entire `example-module/` folder to:

   ```
   data/example-module/
   ```

   The folder name must match `NAMESPACE` in `types.ts` (`createModuleConfig('example-module', …)`).

2. Rename the example files to their runtime names:

   ```
   config.example.json  →  config.json
   texts.example.json   →  texts.json
   ```

3. Edit via the web editor (once `web-plugin.json` is in `shared/modules/<name>/`) or by hand.

## Config vs texts

| File | Contents |
|------|----------|
| `config.json` | Settings: `enabled`, `channelId` (Discord snowflake), panel list rows for panel modules |
| `texts.json` | User-facing copy edited in the web editor |

The web editor validates `channel` / `role` fields as numeric Discord IDs on save.

## Non-Docker / custom data path

If you set `DATA_DIR` to relocate the data tree, copy this folder there instead:

```
$DATA_DIR/example-module/
```

Edits invalidate the bot's in-memory cache automatically (`invalidateModuleCache` in
`web-admin/src/store.ts`) — no restart required.
