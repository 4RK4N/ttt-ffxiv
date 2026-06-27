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
   `DISCORD_TOKEN`. Keep it secret.
3. Open **General Information** -> copy the **Application ID**. This is your
   `CLIENT_ID`.
4. Invite the bot to your server. Open this URL in a browser, replacing
   `YOUR_CLIENT_ID`:

   ```
   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands&permissions=309237696512
   ```

   Permissions `309237696512` = **Send Messages** + **Attach Files** + **Embed Links**
   + **Create Public Threads** + **Send Messages in Threads** (the thread perms are
   needed for the comments thread created on each post).
   Pick your server and authorize.
5. (Recommended for fast command updates) Enable Developer Mode in Discord
   (User Settings -> Advanced -> Developer Mode), then right-click your server icon
   -> **Copy Server ID**. This is your optional `GUILD_ID`.

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

2. Create the `.env` file from the template and fill in your values:

   ```bash
   cp env.example .env
   nano .env
   ```

   ```
   DISCORD_TOKEN=your-bot-token
   CLIENT_ID=your-application-id
   GUILD_ID=your-server-id      # optional but recommended
   ```

   The `.env` file stays only on the server and is git-ignored - never commit it.

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
script **inside a one-off container** that uses your `.env`:

```bash
docker compose run --rm ttt-discord-bot npm run deploy
```

- With `GUILD_ID` set, the `/pic` and `/post` commands appear in that server within
  seconds.
- Without it, they register globally and can take up to ~1 hour to show up.

You only need to repeat this when you add or change commands - not on every restart.

---

## Part 6 - Start the bot

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

# Register commands (one-off)
docker run --rm --env-file .env ttt-discord-bot npm run deploy

# Run in the background with auto-restart
docker run -d --name ttt-discord-bot --env-file .env --restart unless-stopped ttt-discord-bot

# Logs
docker logs -f ttt-discord-bot
```

---

## Troubleshooting

- **Commands don't appear**: make sure you ran the deploy step. Global commands
  are slow to propagate - set `GUILD_ID` for instant updates during setup.
- **"Missing required environment variable"** on start: your `.env` is missing or
  a value is blank. Confirm `DISCORD_TOKEN` and `CLIENT_ID` are filled in.
- **Bot is online but `/pic` fails to post**: the bot needs **Send Messages** and
  **Attach Files** permissions in that channel. Re-check the channel's permission
  overrides for the bot's role.
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
