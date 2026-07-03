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

   (Replace `example-module` with your module namespace if you renamed it in `types.ts`.)

2. Rename the example files to their runtime names:

   ```
   config.example.json  →  config.json
   texts.example.json   →  texts.json
   ```

3. Edit `config.json` / `texts.json` (or use the web editor once `web-plugin.json` is
   in place under `src/modules/<name>/`).

## Non-Docker / custom data path

If you set `DATA_DIR` to relocate the data tree, copy this folder there instead:

```
$DATA_DIR/example-module/
```

The bot resolves paths as `data/<namespace>/` relative to `DATA_DIR` (default: project
root `data/`).
