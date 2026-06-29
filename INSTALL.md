# Installation & Hosting

This guide focuses on running the bot in Docker on your own server (root server,
VPS, home machine, etc.). A Discord bot is a long-running process that holds a
WebSocket connection to Discord; it has **no inbound ports** and is not a website,
so you do not need to open any firewall ports or set up a reverse proxy.

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
   and click **New Application**. Give it a name (e.g. `ttt-bot`).
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
   cd ttt-bot
   ```

2. Create `data/config.json` from the template and fill in your values:

   ```bash
   cp data/config.example.json data/config.json
   nano data/config.json
   ```

All `config.json` and `texts.json` files stay only on the server and are
git-ignored - never commit them. The `*.example.json` templates are safe to
commit. See the **Configuration reference** below for every field.

---

## Configuration reference

The bot reads all configuration from JSON files under `data/`. There are no
environment variables to set (only the optional `DATA_DIR`, which relocates the
`data/` directory itself). Each file has a committed `*.example.json` template;
copy it to `config.json` or `texts.json` and edit.

### `data/config.json` - core bot + web editor

```json
{
  "discordToken": "your-bot-token",
  "clientId": "your-application-id",
  "guildId": "your-server-id-optional",
  "botName": "TTT",
  "clientSecret": "oauth2-client-secret-web-editor-only",
  "sessionSecret": "long-random-string-web-editor-only",
  "oauthRedirectUri": "https://your-host/callback",
  "webPort": 8088
}
```

| Field | Required | Description |
| ----- | -------- | ----------- |
| `discordToken` | **Yes** | Bot token from the Developer Portal (Bot -> Reset Token). Keep it secret. |
| `clientId` | **Yes** | Application (client) ID from General Information. |
| `guildId` | No | A server ID for instant, guild-scoped slash command registration during development. Empty = register globally (can take ~1 hour to propagate). Also **required for the web editor** (the admin check runs against this server). |
| `botName` | No | Display name shown in the web editor's title (`<botName> Admin Interface`). Defaults to `TTT`. |
| `clientSecret` | Editor only | OAuth2 client secret (Developer Portal -> OAuth2 -> Client Secret -> Reset). |
| `sessionSecret` | Editor only | Long random string used to sign the editor's session cookies. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `oauthRedirectUri` | Editor only | OAuth2 redirect URL, added verbatim under Developer Portal -> OAuth2 -> Redirects. Use the editor's public `/callback` URL (https makes the cookie `Secure`). For local dev: `http://localhost:8088/callback`. |
| `webPort` | No | Port the editor listens on inside the container. Defaults to `8088`. Caddy proxies to this port (see `docker-compose.yml`), so changing it means updating that label too. |

The four editor fields (`clientSecret`, `sessionSecret`, `oauthRedirectUri`,
`webPort`) plus `guildId` are only needed if you run the browser-based editor;
the bot process ignores them. The editor also uses `discordToken` (the bot
token) to list the server's channels for its channel pickers. Session cookies
use `SameSite=Lax` (required for OAuth — `Strict` breaks the Discord callback).
Mutating API requests require a CSRF token (`X-CSRF-Token` header matching a
signed cookie set at login). See [Web editor](README.md#web-editor).

Every module's `config.json` also accepts an optional `enabled` boolean - the
master on/off switch exposed as a toggle in the [Web editor](README.md#web-editor).
Only an explicit `"enabled": false` disables the module; if the key is absent it
reads as enabled, so existing configs keep working. The bot hot-reloads this, so
toggling takes effect on the next event without a restart.

### `data/links-pics-vids-autothread/config.json` - auto-threading

```json
{ "enabled": true, "channelIds": ["123", "456"] }
```

`channelIds` lists the channels where the bot auto-creates a comments thread on
qualifying posts (X/Twitter, Bluesky, Aethy links, or direct image/video).
Leave it empty (`[]`) to disable the module, or set `"enabled": false` to turn it
off while keeping the channel list. You can also set both in the
[Web editor](README.md#web-editor) (a channel picker plus the on/off toggle)
instead of editing the file. This module needs the privileged **Message Content**
intent (Developer Portal -> Bot -> Privileged Gateway Intents).

### `data/welcome-message/config.json` - join welcome card

```json
{ "enabled": true, "channelId": "789", "rulesChannelId": "456" }
```

`channelId` is the channel where the welcome card is posted when a member joins.
Leave it blank (`""`) to disable the module, or set `"enabled": false` to turn it
off while keeping the channel configured. `rulesChannelId` is the channel linked
from the rules message via the `{rulesChannel}` token; leave it blank to render
the token as nothing. You can also set all of these in the
[Web editor](README.md#web-editor) (channel dropdowns plus the on/off toggle)
instead of editing the file. This module needs the privileged **Server Members**
intent (Developer Portal -> Bot -> Privileged Gateway Intents).

### `data/tickets/` - ticket panels and private-thread tickets

Copy the examples and configure via the [Web editor](README.md#web-editor):

```bash
cp data/tickets/config.example.json data/tickets/config.json
cp data/tickets/texts.example.json data/tickets/texts.json
```

Each **ticket type** is one category: pick a channel (panel + threads live there),
staff roles, panel copy, and flow messages. **Save**, then click **Publish panel**
to post the open button in Discord. **Unpublish** disables new tickets (the panel
stays; clicking the button replies with an ephemeral “not available” message).

Staff roles need **View Channel** + **Manage Threads** on each ticket channel so
they can see private threads (the bot itself uses **Administrator** from the invite above).
Only staff/admin can close or delete tickets; openers cannot self-close.
Optional **denied roles** per ticket type block users with those roles from opening
(empty list = no check).

On ticket open, all members of roles with Administrator permission plus configured
staff roles are auto-added to the thread. At bot startup the member list is fetched
once into a tickets-owned cache (1s pause between 1000-member pages); gateway events
keep it current. Ticket opens pace thread member adds by 250ms. Large guilds may delay
startup warm; if warm fails, opens still work but staff auto-add may be incomplete.

**Unpublish** disables new opens only — the Discord panel message stays until removed
manually or the type is re-published after deleting the old message.

### `data/pic-repost-commands/config.json` - /pic and /post commands

```json
{ "enabled": true }
```

This module has no channel setting (the commands work in whatever channel they're
run), so its `config.json` holds only the `enabled` toggle. Set `"enabled": false`
(or flip the toggle in the [Web editor](README.md#web-editor)) to turn off `/pic`
and `/post`; while off they reply with a short "disabled" notice instead of
posting.

---

## Part 4 - Build the image

```bash
docker compose build
```

This produces an image named `ttt-discord-bot` using the included `Dockerfile`. The
`Dockerfile` is a multi-stage build: the first stage compiles the TypeScript
sources to plain JavaScript (`npm run build` -> `dist/`), and the final runtime
image ships only the compiled output plus production dependencies.

---

## Part 5 - Register the slash commands (run after every command change)

Slash commands must be registered with Discord before they appear. Run the deploy
script **inside a one-off container** (it reads `data/config.json` from the
mounted volume):

```bash
docker compose run --rm ttt-discord-bot npm run deploy
```

- With `guildId` set, the `/pic` and `/post` commands appear in that server within
  seconds.
- Without it, they register globally and can take up to ~1 hour to show up.

You only need to repeat this when you add or change commands - not on every restart.

---

## Part 6 - Start the bot

When using Docker Compose with Caddy, replace the `caddy:` hostname label on
`ttt-web-editor` in `docker-compose.yml` with your public hostname. The
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

Now go to your Discord server and try `/pic` or `/post`.

---

## Everyday commands

| Action                         | Command                                  |
| ------------------------------ | ---------------------------------------- |
| View logs                      | `docker compose logs -f ttt-discord-bot` |
| Stop the bot                   | `docker compose down`                    |
| Start the bot                  | `docker compose up -d`                   |
| Restart the bot                | `docker compose restart ttt-discord-bot` |
| Rebuild after code changes     | `docker compose up -d --build`           |
| Re-register commands           | `docker compose run --rm ttt-discord-bot npm run deploy` |

### Updating to new code

```bash
git pull                       # or copy new files over
docker compose up -d --build   # rebuild + restart
# only if commands changed:
docker compose run --rm ttt-discord-bot npm run deploy
```

---

## Plain Docker (without Compose)

If you prefer not to use Compose:

```bash
# Build
docker build -t ttt-discord-bot .

# Register commands (one-off). The -v mount provides data/config.json.
docker run --rm -v "$(pwd)/data:/app/data" ttt-discord-bot npm run deploy

# Run in the background with auto-restart.
# The -v mount provides data/config.json and makes edits to module texts/assets
# in ./data persist (and survive rebuilds).
docker run -d --name ttt-discord-bot \
  -v "$(pwd)/data:/app/data" --restart unless-stopped ttt-discord-bot

# Logs
docker logs -f ttt-discord-bot
```

---

## Troubleshooting

- **Commands don't appear**: make sure you ran the deploy step. Global commands
  are slow to propagate - set `guildId` for instant updates during setup.
- **"Missing required config value"** on start: `data/config.json` is missing or
  a value is blank. Confirm `discordToken` and `clientId` are filled in.
- **Bot is online but `/pic` fails to post**: the bot needs **Send Messages** and
  **Attach Files** permissions in that channel. Re-check the channel's permission
  overrides for the bot's role.
- **Web editor "Failed to save changes" (`EACCES` in `ttt-web-editor` logs)**: the
  editor container runs as the non-root `node` user (uid 1000) but can't write to
  the bind-mounted `./data`. Make the host data dir owned by that uid once:

  ```bash
  sudo chown -R 1000:1000 ./data
  ```

  (Confirm the image's uid with `docker run --rm ttt-discord-bot id node` if unsure.)

  Caveat: with `./data` owned by uid 1000, your own user can no longer edit those
  files directly. Prefer the web editor for changes. If you must hand-edit a file,
  use `sudo` and then re-chown it back to 1000 afterwards (nano's save can rewrite
  it as root):

  ```bash
  sudo nano ./data/welcome-message/config.json
  sudo chown 1000:1000 ./data/welcome-message/config.json
  ```
- **Large images fail**: Discord caps uploads (10 MB on unboosted servers). The
  bot reports this back to the user privately.

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
