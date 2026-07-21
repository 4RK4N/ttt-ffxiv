# Installation & Hosting

This guide focuses on running the bot (and optional website) in Docker on your own
server (root server, VPS, home machine, etc.). The Discord bot holds a WebSocket
connection to Discord for gateway events. The **web editor** (same container as the
bot) listens on an internal port and should be exposed only via reverse proxy and
firewall — see the Docker Compose / Caddy sections below.

> Other hosting options (Oracle Cloud Always Free, Fly.io, Railway, Raspberry Pi)
> are summarized at the bottom.

---

## What you need

- A server you can SSH into (Linux is assumed below).
- **Docker** installed (Docker Engine 20+). Docker Compose v2 is included with
  modern Docker as the `docker compose` subcommand.
- The bot's source code on that server.
- A Discord application + bot token.

---

## Part 1 - Create the Discord application (one time)

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   and click **New Application**. Give it a name (e.g. `ttt-ffxiv`).
2. Open **Bot** in the sidebar -> **Reset Token** -> copy the token. This is your
   `discordToken`. Keep it secret. While on this page, enable the
   **Message Content** intent under **Privileged Gateway Intents** - the
   auto-thread feature needs it to read message links/attachments. Also enable
   **Server Members** - required for the welcome module and ticket staff resolution.
3. Open **General Information** -> copy the **Application ID**. This is your
   `clientId`.
4. Invite the bot to your server. Open this URL in a browser, replacing
   `YOUR_CLIENT_ID`:

   ```
   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands&permissions=8
   ```

   `permissions=8` = **Administrator** (all server permissions). Recommended for a
   single trusted self-hosted bot on your server. Keep `discordToken` secret — anyone
   with the token has full server access through the bot.
   Pick your server and authorize.

5. (Recommended for fast command updates) Enable Developer Mode in Discord
   (User Settings -> Advanced -> Developer Mode), then right-click your server icon
   -> **Copy Server ID**. This is your optional `guildId`.

---

## Part 2 - Install Docker on the server (skip if already installed)

On Debian/Ubuntu the quickest way is Docker's convenience script:

```bash
curl -fsSL https://get.docker.com | sh
```

Verify:

```bash
docker --version
docker compose version
```

---

## Part 3 - Get the code and configure secrets

1. Copy the project to the server (via `git clone <your-repo>` or `scp`), then
   `cd` into it:

   ```bash
   cd ttt-ffxiv
   ```

2. Bootstrap Turso and app settings:

   ```bash
   cp data/config.example.json data/config.json   # DB path only
   ./discord-bot/scripts/db/db-init.sh
   ```

   `discord-bot/scripts/db/db-init.sh` creates `data/ttt.db`, applies `discord-bot/scripts/db/schema.sql` and
   per-module `seed.sql` files, prompts for Discord/OAuth secrets (stored in the
   `app_config` table), and seeds module tables from code defaults (`MODULE_DEFAULTS`
   in each module's `types.ts`). Node steps run inside the `ttt-discord-bot` container —
   build it first with `./scripts/build.sh bot`.

   Host **Node.js is not required** on the server; only Docker.

Bot secrets and module settings live in **Turso** (`data/ttt.db`: `app_config` and
`module_*` tables). On disk under `data/` you keep:

- `data/config.json` — path to the SQLite database (`dbPath`)
- `data/ttt.db` — embedded Turso database (gitignored)
- Binary assets (welcome card media, fonts)

Never commit `data/config.json` or `data/ttt.db`. See **Configuration reference** below.

**Schema updates:** write a `.sql` file under `discord-bot/scripts/db/migrations/`, then
`./discord-bot/scripts/db/db-update.sh discord-bot/scripts/db/migrations/001_example.sql` (stops the bot if running, applies SQL, restarts).

**Backups:** with the bot running, `./discord-bot/scripts/db/db-dump.sh backups/ttt-YYYY-MM-DD.sql` (read-only exec into the container). Default dumps **redact** `discordToken`, `clientSecret`, and `sessionSecret` in `app_config`. For a credential-bearing backup (treat like the DB file): `./discord-bot/scripts/db/db-dump.sh --include-secrets backups/full.sql` (or `docker compose exec -T ttt-discord-bot node dist/scripts/db/cli.js dump-db --include-secrets data/ttt.db > backups/full.sql`).

**First-time init:** `./discord-bot/scripts/db/db-init.sh` (stops the bot if running, applies schema/seeds, prompts for secrets, restarts if it was up).

---

## Configuration reference

Runtime settings are stored in Turso as key-value rows (`TEXT` JSON values).
The web editor writes the database directly; the bot keeps an in-process module
store (`discord-bot/shared/core/texts.ts`) that reloads automatically when rows change.

### `data/config.json` — database bootstrap only

```json
{
  "dbPath": "data/ttt.db"
}
```

| Field    | Required | Description |
| -------- | -------- | ----------- |
| `dbPath` | No       | Path to the Turso SQLite file. Defaults to `data/ttt.db`. |

### `app_config` table — bot + web editor secrets

Populated interactively by `./discord-bot/scripts/db/db-init.sh`.

| Key                 | Required         | Description |
| ------------------- | ---------------- | ----------- |
| `discordToken`      | **Yes**          | Bot token from the Developer Portal. |
| `clientId`          | **Yes**          | Application (client) ID. |
| `guildId`           | No               | Server ID for guild-scoped slash commands; **required for the web editor**. |
| `botName`           | No               | Web editor title. Defaults to `TTT`. |
| `clientSecret`      | Editor only      | OAuth2 client secret. |
| `sessionSecret`     | Editor only      | Session cookie signing secret. |
| `oauthRedirectUri`  | Editor only      | OAuth redirect URL (`/callback`). |
| `webPort`           | No               | Editor port inside the container (default `8088`). |

Changing `app_config` values requires restarting the bot container.
Module settings hot-reload without a restart.

To rotate a secret: update the row in Turso, or re-run `./discord-bot/scripts/db/db-init.sh --force`.

The four editor fields (`clientSecret`, `sessionSecret`, `oauthRedirectUri`,
`webPort`) plus `guildId` are only needed if you run the browser-based editor;
the bot process ignores OAuth fields. The editor uses `discordToken` (the bot
token) to list the server's channels and roles. Panel publish/unpublish runs
in-process (no internal HTTP API). Session cookies use `SameSite=Lax` (required
for OAuth — `Strict` breaks the Discord callback). Mutating API requests require
a CSRF token (`X-CSRF-Token` header matching a signed cookie set at login).
See [Web editor](README.md#web-editor).

**Health check:** `GET /health` on the web port returns `{"ok":true}` when the
combined app is up.

**Deployment security notes:**
- The web editor listens on `0.0.0.0` inside the container — expose it only via reverse proxy and firewall.
- `./discord-bot/scripts/db/db-init.sh` passes secrets as Docker `-e` env vars (visible via `docker inspect`); treat host/container env as sensitive.
- Admin role checks are cached for 3 seconds on read-only editor requests; mutating HTMX requests always re-check live Discord roles.
- Run `npm audit` when updating dependencies on the server; apply patch-level bumps as part of deploys.

Each module's `enabled` key (in its `module_*` table) is the master on/off switch
exposed as a toggle in the [Web editor](README.md#web-editor).
Only an explicit `false` disables the module; if the key is absent it reads as
enabled. The bot hot-reloads this from Turso.

### Module settings (`module_*` tables)

Each module has a dedicated table (e.g. `module_tickets`). Settings and user-facing
copy are stored as individual key rows (`TEXT` JSON values). Panel modules (tickets,
reaction-roles, custom-embeds) store merged list rows — e.g. `ticketTypes[]`
includes both `channelId` and `panelTitle` in one array. Each table also has an
`editorConfig` row defining web editor fields (replaces the old `web-plugin.json` files).

Configure modules via the [Web editor](README.md#web-editor).

### links-pics-vids-autothread — auto-threading

Settings live in `module_links_pics_vids_autothread` (edit via the [Web editor](README.md#web-editor)).
Reference keys:

```json
{
  "enabled": true,
  "channelIds": ["123", "456"],
  "deleteNonQualifyingMessages": false,
  "threadFirstMessage": "Please comment here in the thread…",
  "nonQualifyingDm": "Hi! Your message in {channel} was removed…"
}
```

`channelIds` lists the channels where the bot auto-creates a comments thread on
qualifying posts (X/Twitter, Bluesky, Aethy, or Instagram post links; direct
Discord image/video links; or native image/video attachments).
Leave it empty (`[]`) to disable the module, or set `"enabled": false` to turn it
off while keeping the channel list. This module needs the privileged **Message Content**
intent (Developer Portal -> Bot -> Privileged Gateway Intents), plus **Create
Public Threads** and **Send Messages in Threads** in each watched channel.

**`deleteNonQualifyingMessages`** — when `true`, messages without images, videos,
or supported post links are deleted and the author receives a DM (`nonQualifyingDm`;
tokens `{channel}`, `{message}`). Default is `false`. Requires **Manage Messages**
in watched channels when enabled. If the user's DMs are closed, the message is still
deleted and a warning is logged.

`nonQualifyingDm` tokens: `{channel}` (Discord channel link), `{message}` (deleted
message text). Text over 2000 characters is sent as an embed automatically (max 4096).

### welcome-message — join welcome card

Settings live in `module_welcome_message` (web editor). Reference keys:

```json
{
  "enabled": true,
  "channelId": "789",
  "rulesChannelId": "456",
  "welcomeContent": "Welcome {mention}",
  "rulesMessage": "…",
  "rulesChannelFallback": "…"
}
```

`channelId` is the channel where the welcome card is posted when a member joins.
Leave it blank (`""`) to disable the module, or set `"enabled": false` to turn it
off while keeping the channel configured. `rulesChannelId` is the channel linked
from the rules message via the `{rulesChannel}` token; leave it blank to render
the token as nothing. This module needs the privileged **Server Members** intent
(Developer Portal -> Bot -> Privileged Gateway Intents).

Welcome card media/fonts remain on disk under `data/welcome-message/media/`.

### tickets — ticket panels and private-thread tickets

Settings live in `module_tickets` (web editor). Each **ticket type** is one category:
pick a channel (panel + threads live there), staff role, panel copy, and flow messages.
**Save**, then click **Publish panel** to post the open button in Discord.
**Unpublish** disables new tickets (the panel stays; clicking the button replies
with an ephemeral “not available” message).

Staff role needs **View Channel** + **Manage Threads** on each ticket channel so
they can see private threads (the bot itself uses **Administrator** from the invite above).
Only staff/admin can delete tickets. The opener can close their own ticket; staff/admin can close any ticket.
Optional **denied roles** per ticket type block users with those roles from opening
(empty list = no check). Optional **role action button** per ticket type: when
`roleActionRoleId` is set, staff see a button in the thread that grants that role to
the ticket opener (label and confirmation text are editable per type).

On ticket open, all members of roles with Administrator permission plus the configured
staff role are auto-added to the thread. At bot startup the member list is fetched
once into a tickets-owned cache (1s pause between 1000-member pages); gateway events
keep it current. Ticket opens pace thread member adds by 250ms. Large guilds may delay
startup warm; if warm fails, opens still work but staff auto-add may be incomplete.

**Unpublish** disables new opens only — the Discord panel message stays until removed
manually or the type is re-published after deleting the old message.

### reaction-roles — embed role panels

Settings live in `module_reaction_roles` (web editor). Each **panel** is one embed
message: pick a channel, interaction type (buttons, emoji reactions, or dropdown),
role options, and copy. **Save**, then **Publish panel** to post to Discord.
**Unpublish** stops the bot from handling interactions on that panel (the message stays).

- **Toggleable**: when enabled, re-interacting removes roles; when disabled, roles
  are assigned once.
- **Ephemeral reply**: optional per panel for buttons and dropdowns; not available
  for emoji mode. Tokens: `{mention}`, `{role}`. Leave blank for no reply.
- **Bot role**: must be above every assignable role and have **Manage Roles**.
  Managed/integration roles cannot be assigned.

Emoji mode adds reactions to the published message automatically on publish.

### moderation-log — event logging

Settings live in `module_moderation_log` (web editor). Set `channelId` to the
channel where log embeds are posted. Leave it empty (`""`) to disable the module,
or set `"enabled": false` to turn it off while keeping the channel configured.
Each event type has its own boolean toggle:

| Key                 | Default | Event                                         |
| ------------------- | ------- | --------------------------------------------- |
| `logMessageDeleted` | `true`  | A message is deleted (including bulk deletes) |
| `logMemberLeft`     | `true`  | A member leaves voluntarily                   |
| `logMemberKicked`   | `true`  | A member is kicked (detected via audit log)   |
| `logMemberBanned`   | `true`  | A member is banned                            |
| `logMemberUnbanned` | `true`  | A member is unbanned                          |

Kick, ban, and unban logs include the moderator when Discord's audit log provides an
executor within ~5 seconds of the event. The bot needs **View Audit Log** for that;
without it, logs still post but show "Unknown" for the moderator. Ban events are
deduplicated so the same removal does not also log as a leave or kick.

Member leave/kick detection uses the privileged **Server Members** intent (Developer
Portal -> Bot -> Privileged Gateway Intents). Deleted-message logs do not require
**Message Content** — the delete event carries cached content when available.

Text template keys (e.g. `messageDeleted`, `memberBanned`) support tokens such as
`{author}`, `{channel}`, `{mention}`, `{executorId}`, `{messageId}`, and `{userId}`.
Defaults live in `discord-bot/bot/src/lib/modules/moderation-log/types.ts` (`TEXT_DEFAULTS`).

### custom-embeds — static embed panels

Settings live in `module_custom_embeds` (web editor). Each **panel** is one embed
message: pick a channel, set title/description, and optionally author name/icon URL,
footer, and a timestamp toggle. **Save**, then **Publish panel** to post or update
the Discord message. **Unpublish** stops tracking the panel (the message stays until
removed manually or the panel is re-published after deleting the old message).

- **Description** is required; title, author, and footer are optional.
- **Author icon URL** must be a valid `http` or `https` URL and requires an author name.
- **Show timestamp**: when enabled, the embed shows the publish time; re-publishing
  refreshes it.

The bot needs **Send Messages** and **Embed Links** in each target channel.

### pic-repost-commands — /pic and /post commands

Settings live in `module_pic_repost_commands` (web editor). Reference keys:

```json
{
  "enabled": true,
  "deleteEmoji": "🗑️",
  "deleteAuthorLastMention": true
}
```

- **`deleteEmoji`** — emoji the post author reacts with to delete their repost (unicode or `<:name:id>`). The bot does not add this reaction; it is shown in the attribution caption via the `{deleteEmoji}` token.
- **`deleteAuthorLastMention`** — when `true` (default), delete auth uses the **last** user mention in the caption; when `false`, the first mention. Put `{mention}` after `{message}` in the attribution template so mentions inside the caption text are not treated as the author.

This module has no channel setting (the commands work in whatever channel they're
run). Set `"enabled": false` (or flip the toggle in the web editor) to turn off `/pic`
and `/post`; while off they reply with a short "disabled" notice instead of posting.

### emojis — /emoji-add and /emoji-copy commands

Settings live in `module_emojis` (web editor). Reference keys:

```json
{ "enabled": true, "emojiRoleId": "" }
```

- **`emojiRoleId`** — Discord role ID allowed to use `/emoji-add` and `/emoji-copy`
  alongside Administrators. Leave empty for admins only.

User-facing error and success messages are editable in the web editor. Images must be
256 KiB or smaller. Run `npm run deploy` after enabling the module so the slash
commands appear in Discord.

The bot needs **Manage Emojis and Stickers** in the server.

---

## Part 4 - Build the images

Run from the repo root (where `docker-compose.yml` lives). The committed `.env` sets
`COMPOSE_BAKE=true` — keep that enabled so builds go through Bake/Buildx and the
`nproc` ulimits in `docker-compose.yml` take effect.

Use [`scripts/build.sh`](scripts/build.sh) for deploy builds. Bot and web editor use
[`discord-bot/Dockerfile`](discord-bot/Dockerfile) (separate image targets); website uses
[`website/Dockerfile`](website/Dockerfile). Builds use layer cache by default;
changed source re-runs only the affected steps.

| Flag / args               | Effect                                                |
| ------------------------- | ----------------------------------------------------- |
| _(none)_                  | Build and recreate bot + website services             |
| `-v`                      | Full step-by-step output (`--progress plain`)         |
| `--no-cache`              | Ignore layer cache; full rebuild                      |
| `bot` / `website`         | Build only listed services (aliases or `ttt-*` names) |

```bash
chmod +x scripts/build.sh   # once, on Linux/macOS
./scripts/build.sh
./scripts/build.sh -v
./scripts/build.sh --no-cache
./scripts/build.sh -v --no-cache
./scripts/build.sh bot
./scripts/build.sh bot website
```

This builds and recreates:

- **`ttt-discord-bot:1.6.5`** — single Node 24 (glibc) image: Discord bot + web editor in one process (`dist/bot/src/app.js`). Includes Turso, discord.js, hono, and admin UI assets.
- **`ttt-website:2.0.0`** — multi-stage: Astro static site (`website/`), served by nginx on port **8089** inside the container.

Runtime config and the database live in the mounted `./data` volume — not copied into images at build time.

---

## Part 5 - Register the slash commands (run after every command change)

Slash commands must be registered with Discord before they appear. Run the deploy
script **inside a one-off container** (it reads `data/config.json` from the
mounted volume):

```bash
docker compose run --rm ttt-discord-bot npm run deploy
```

- With `guildId` set, slash commands (`/pic`, `/post`, `/emoji-add`, `/emoji-copy`, etc.)
  appear in that server within seconds.
- Without it, they register globally and can take up to ~1 hour to show up.

**Module `enabled` toggle vs deploy:** The web editor's per-module **enabled** switch
only affects runtime behavior (handlers reply "disabled" when off). Deploy registers
slash commands from code; modules with `enabled: false` in Turso are **omitted**
on deploy so they disappear from Discord. Re-run deploy after toggling enabled if you
want slash commands to match.

You only need to repeat this when you add or change commands - not on every restart.

---

## Part 6 - Start the bot

When using Docker Compose with Caddy, replace the `caddy:` hostname label on
`ttt-discord-bot` in `docker-compose.yml` with your public hostname. The
`caddy.reverse_proxy` upstream port must match `webPort` (default `8088`).

```bash
docker compose up -d
```

`-d` runs it in the background. The `restart: unless-stopped` policy keeps it
alive across crashes and server reboots.

Check it connected:

```bash
docker compose logs -f ttt-discord-bot
```

You should see `Logged in as <bot>#0000.` Press `Ctrl+C` to stop following logs
(the bot keeps running).

Now go to your Discord server and try `/pic`, `/post`, `/emoji-add`, or `/emoji-copy`.

---

## Part 7 - Public website (`ttt-ffxiv.com`)

Static multi-page site built with **Astro 7 + Tailwind CSS**. The site is **built inside the
`ttt-website` Docker image** (see `website/Dockerfile`) and served by nginx.

| Path                                              | Purpose                                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `website/src/pages/`                              | One `.astro` file per page (DE + EN)                                                                     |
| `website/src/layouts/`, `website/src/components/` | Shared layout (topbar, drawer) and components (gallery, timer)                                           |
| `website/src/data/nav.ts`                         | Navigation labels and DE↔EN path mapping                                                                 |
| `website/src/styles/global.css`                   | Tailwind theme + shared text styles                                                                      |
| `website/src/assets/`                             | Page images (logo, icons, gallery, background) — optimized to WebP at build via Astro `<Image>`          |
| `website/public/`                                 | Fixed-URL assets only: `robots.txt`, favicon, apple-touch-icon, OG share image                           |
| `website/astro.config.mjs`                        | `@astrojs/sitemap` generates `sitemap-index.xml` at build time                                           |
| `website/dist/`                                   | Local `npm run build` output (gitignored); dev preview only — production uses files baked into the image |
| `website/Dockerfile`                              | Multi-stage: `npm ci` + `npm run build` (`astro check` then `astro build`), then nginx                   |
| `website/nginx.conf`                              | nginx config (clean URLs, gzip, caching); `listen 8089`                                                  |

**Site images:** keep `website/src/assets/` **in git** (do not gitignore). Logo,
gallery, icons, and background are source content — the Docker build runs
`astro build` and needs them on disk after `git pull`. Organize optimized page
images by purpose under `website/src/assets/images/`: `content/`, `events/`,
`guestbook/`, `team/`, `staff/`, `partner/`, and
`gallery/{venue,room01,room02,bands}/`. Only `website/dist/` and
`website/.astro/` are build output and stay gitignored. `website/public/` holds
four fixed-URL files (favicon, share image, etc.) only.

After **website** source changes, rebuild and restart the website service:

```bash
docker compose build ttt-website && docker compose up -d --force-recreate ttt-website
```

For a full stack deploy (bot + website), use `./scripts/build.sh` (see Part 4 for flags).

### Local preview and quality checks

```bash
cd website
npm install
npm run dev            # Astro dev server
npm run lint           # ESLint (incl. .astro)
npm run format:check   # Prettier (incl. .astro)
npm test               # Vitest
npm run check          # astro check (types)
npm run build          # astro check then astro build (same path as Docker builder)
```

Lint, format, and tests are local/dev only — they are **not** run inside the production nginx image.
`astro check` runs in the Docker **builder** as part of `npm run build`; the final image only serves static `dist/`.

Bot / web-admin use the same script names from `discord-bot/` (`lint`, `format` / `format:check`, `test`); see [README.md § Local quality checks](README.md#local-quality-checks).

### How traffic reaches the site (nginx + Caddy + SSL)

Nothing listens on the host for the public website — same pattern as the web editor:

```text
Browser ──HTTPS──► Caddy (caddy-docker-proxy, ports 80/443 on host)
                      │
                      └── HTTP ──► ttt-website:8089 (nginx, internal Docker network)
```

| Layer     | Role                                                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Caddy** | Public entrypoint. Terminates TLS (Let's Encrypt cert for `ttt-ffxiv.com`), redirects HTTP→HTTPS, proxies to the container.               |
| **nginx** | Serves the built site (baked into the image at build time) on **port 8089 inside the container only**. Plain HTTP — no certificates here. |

The `caddy:` and `caddy.reverse_proxy: "{{upstreams 8089}}"` labels on `ttt-website`
tell Caddy which hostname and which internal port to use. Keep `website/nginx.conf`
`listen 8089` in sync with that upstream port (editor uses **8088**, website **8089**).

There is no Apache-style `.htaccess`. Static routing (clean URLs like `/de/regeln/`) lives
in `website/nginx.conf` (`try_files`). You only edit that file if URL rules change — not
per-folder overrides.

### DNS

Point **`ttt-ffxiv.com`** (and optional `www`) to the same host as your Caddy stack.
Caddy auto-provisions a Let's Encrypt certificate for the hostname in the `caddy:` label
and redirects plain HTTP to HTTPS — no SSL config in nginx required.

---

## Everyday commands

| Action                         | Command                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| View logs                      | `docker compose logs -f ttt-discord-bot`                                                      |
| Stop the bot                   | `docker compose down`                                                                         |
| Start the bot                  | `docker compose up -d`                                                                        |
| Restart the bot                | `docker compose restart ttt-discord-bot`                                                      |
| Rebuild after code changes     | `./scripts/build.sh` (optional `-v`, `--no-cache`)                                            |
| Re-register commands           | `docker compose run --rm ttt-discord-bot npm run deploy`                                      |
| Rebuild website after edits    | `docker compose build ttt-website && docker compose up -d --force-recreate ttt-website`       |

### Updating to new code

```bash
git pull
./scripts/build.sh
# only if commands changed:
docker compose run --rm ttt-discord-bot npm run deploy
```

---

## Plain Docker (without Compose)

If you prefer not to use Compose:

```bash
# Bot + web editor (single image)
docker build -f discord-bot/Dockerfile --target ttt-discord-bot -t ttt-discord-bot:1.6.5 .

# Website
docker build -f website/Dockerfile --target ttt-website -t ttt-website:2.0.0 .


# Register commands (one-off). The -v mount provides data/config.json (DB bootstrap).
docker run --rm -v "$(pwd)/data:/app/data" ttt-discord-bot npm run deploy

# Run in the background with auto-restart.
# The -v mount provides data/config.json and on-disk module assets (e.g. welcome media).
docker run -d --name ttt-discord-bot \
  -v "$(pwd)/data:/app/data" --restart unless-stopped ttt-discord-bot

# Logs
docker logs -f ttt-discord-bot
```

---

## Troubleshooting

- **Commands don't appear**: make sure you ran the deploy step. Global commands
  are slow to propagate - set `guildId` for instant updates during setup.
- **"Missing required config value"** on start: run `./discord-bot/scripts/db/db-init.sh` or
  check `app_config` in Turso (`discordToken`, `clientId`, etc.).
- **Web editor missing OAuth fields**: same — populate `app_config` via
  `discord-bot/scripts/db/db-init.sh` or update rows directly.
- **Bot is online but `/pic` fails to post**: the bot needs **Send Messages** and
  **Attach Files** permissions in that channel. Re-check the channel's permission
  overrides for the bot's role.
- **Web editor save errors**: ensure `data/ttt.db` exists and is writable.
  During `./discord-bot/scripts/db/db-init.sh`, `data/` may need to be writable
  by UID 1000; afterward containers need read/write access to `data/ttt.db`.

- **Large images fail**: Discord caps uploads (10 MB on unboosted servers). The
  bot reports this back to the user privately.
- **Website build panics at "Building static entrypoints"** (`rayon-core` /
  `ThreadPoolBuildError`, or `runtime: newosproc` / `GOMAXPROCS` from esbuild):
  Astro 7's Rust compiler and Vite's esbuild both spawn many OS threads; on
  tight runners the Docker build can hit `nproc` limits (`Resource temporarily
  unavailable`). `website/Dockerfile` caps this with `RAYON_NUM_THREADS=1`,
  `GOMAXPROCS=1`, and `UV_THREADPOOL_SIZE=2`. Rebuild with
  `docker compose build ttt-website` or `./scripts/build.sh website`. Compose
  Bake ulimits (`COMPOSE_BAKE=true` in `.env`) help but are not sufficient alone
  on constrained hosts; avoid bare `docker build` unless you pass equivalent
  `--ulimit` flags.

---

## Other hosting options (summary)

A bot must stay **always on**, so "serverless" / sleep-on-idle free tiers are a
poor fit.

- **Oracle Cloud Always Free**: a genuinely free, always-on small VM. Install
  Docker and follow this same guide. Best zero-cost option if you didn't already
  have a server.
- **Fly.io / Railway / Render (background worker)**: easy git-based deploys, but
  free tiers are credit-limited and some sleep idle apps - fine for testing,
  watch the limits for 24/7 use.
- **Raspberry Pi / spare home machine**: run via Docker exactly as above; just
  keep it powered and online.

Since you already have a root server, the Docker steps above are the simplest and
have no extra cost.
