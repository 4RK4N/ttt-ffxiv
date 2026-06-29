# ttt-bot

Custom Discord bot for Tiny Temptation Tubs (TTT), built with an extensible
module system so new features can be added without refactoring the core.

## Modules

### welcome-message (member join welcome)

When a new member joins, the bot posts a MEE6-style welcome card in the configured
welcome channel and sends the server rules to the member.

- **Welcome card**: a generated PNG built from `data/welcome-message/media/background.png`,
  with the member's avatar in a circle (light-purple ring), their display name as
  `<name> just joined`, and a subtitle, both rendered in the Dancing Script font
  (`data/welcome-message/fonts/DancingScript.ttf`). It's posted with a
  `Welcome @member` message.
- **Rules message**: a bilingual (EN/DE) note is sent to the member by **DM**. If
  the member has DMs closed, the bot falls back to posting it in the welcome
  channel, mentioning them. The welcome card post is unaffected if the rules
  message fails.

Configure the target channel with `WELCOME_CHANNEL_ID` in your `.env`. If it's
empty, the module stays disabled. This module uses the `guildMemberAdd` event, so
the bot needs the privileged **Server Members** intent enabled in the Developer
Portal (Bot -> Privileged Gateway Intents).

The welcome/rules text is editable in `data/welcome-message/texts.json`, and the
background image and font can be swapped in the `media/` and `fonts/` subfolders
(see [Editing texts and assets](#editing-texts-and-assets)).

### pic (`/pic`, alias `/post`)

Lets users re-post images through the bot instead of uploading directly to an
age-restricted channel, which helps avoid Discord's auto-moderation false bans.

Usage: run `/pic` (or `/post`) in any channel:

- `message` (required) - the text to include.
- `image1` (required), `image2` ... `image10` (optional) - the images to post.

The bot downloads the attachments, re-uploads them as its own message in the same
channel, and adds `by @you` attribution. Your command invocation is answered with
a private (ephemeral) confirmation, so only the bot's post is publicly visible.

It also starts a thread on the post to keep discussion out of the main channel.
The thread is titled `name - message` (your display name plus the message,
collapsed to one line and truncated to 100 characters with `...` if longer), and
its first message is a short bilingual note asking people to comment in the thread. This requires the bot to have the
**Create Public Threads** and **Send Messages in Threads** permissions in that
channel; if it can't, the images are still posted and you get a note in the
ephemeral confirmation.

### links-pics-vids-autothread (automatic threads)

Replicates the old Mee6 behavior in the pics channels: when a (non-bot) user posts
a message, the bot automatically opens a comments thread on it if the message
either:

- contains a link to a single **post** on a supported site (X/Twitter, Bluesky,
  or Aethy) - profile, group, and site-root links are ignored; or
- has at least one image or video attachment.

The thread uses the same pattern as `/pic`: titled `name - text` with the URL
removed from the text, or just `name` when the message has no text beyond the
link. The first message is the same bilingual note, and the thread auto-archives
after 7 days.

Configure which channels are watched with `AUTOTHREAD_CHANNEL_IDS`
(comma-separated channel IDs) in your `.env`. This module reads message content,
so the bot needs the privileged **Message Content** intent enabled in the
Developer Portal (Bot -> Privileged Gateway Intents). If `AUTOTHREAD_CHANNEL_IDS`
is empty, the module stays disabled.

## Project layout

```
src/
  index.ts              # entry point: client + interaction routing
  config.ts             # loads & validates environment variables
  core/
    moduleLoader.ts     # auto-discovers modules under src/modules/*
    threads.ts          # shared thread title helpers
    texts.ts            # loads per-module texts/assets from data/
  modules/
    welcome-message/
      index.ts          # welcome card + rules on member join
      web-plugin.json   # editor manifest: which texts are editable
    pic-repost-commands/
      index.ts          # the /pic + /post module
      web-plugin.json
    links-pics-vids-autothread/
      index.ts          # auto comments threads on posts
      web-plugin.json
  web/                  # the web text editor (separate process/container)
    server.ts           # entry point: Hono HTTP server + routes
    config.ts           # validates the editor's own env vars
    auth.ts             # Discord OAuth login + guild-admin check + session
    plugins.ts          # scans modules for web-plugin.json manifests
    store.ts            # validated, atomic read/write of texts.json
    ui.ts               # the editor's HTML page
data/                   # editable runtime content (texts + assets), per module
  welcome-message/
    texts.json
    media/background.png
    fonts/DancingScript.ttf
  pic-repost-commands/texts.json
  links-pics-vids-autothread/texts.json
scripts/
  deploy-commands.ts    # registers slash commands with Discord
  copy-web-plugins.js   # copies web-plugin.json manifests into dist on build
```

To add a new feature later, create `src/modules/<name>/index.ts` that exports
either `{ name, commands: [{ data, execute }] }` for slash commands, or
`{ name, init(client) }` to register event listeners (or both). The loader and
deploy script pick it up automatically - no core changes needed. To make its
texts editable in the web editor, drop a `web-plugin.json` in the same folder
(see [Web text editor](#web-text-editor)); the editor discovers it automatically.

### Editing texts and assets

User-facing message text lives in `data/<module>/texts.json`, and the welcome
card's image/font live in `data/welcome-message/media` and `.../fonts`. These are
read at runtime (not bundled into the build), so you can edit them and the bot
picks up changes on the next event - no rebuild or restart needed. Each module
ships code defaults as a fallback, so a missing or malformed file never breaks the
bot. Slash command names/descriptions stay in code (they require `npm run deploy`
to change).

You can edit `texts.json` files by hand, or through the built-in
[Web text editor](#web-text-editor), which writes the same files.

## Web text editor

A small browser UI for editing each module's `texts.json` without touching the
server. It runs as a **separate process/container** that shares the bot's `data/`
directory, so saved edits take effect on the bot's next event - no restart.

- **What's editable** is declared per module by a `web-plugin.json` manifest next
  to the module's `index.js`. Each manifest lists fields (`key`, `label`,
  `type: text | textarea`, optional `help`). The editor scans modules at startup,
  so adding/removing editable fields is just editing that JSON - no code changes.
- **Access** is restricted to **administrators of `GUILD_ID`**. Login is via
  Discord OAuth: the editor checks that your account has the Administrator
  permission on that server before letting you in.
- **Safety**: writes are validated against the manifest (only known keys, string
  values) and written atomically, so a half-saved or malformed file can't reach
  the bot.

### Configuration

Add these to `.env` (see `env.example`). They are only needed by the editor; the
bot ignores them:

```
CLIENT_SECRET=your-oauth2-client-secret      # Developer Portal -> OAuth2 -> Client Secret
SESSION_SECRET=long-random-string            # signs the editor's session cookies
OAUTH_REDIRECT_URI=https://ttt-bot.ii10.de/callback
WEB_PORT=8088                                # port the editor listens on
```

`GUILD_ID` is also required here (it's the server whose admins get access).

In the **Developer Portal -> OAuth2 -> Redirects**, add the exact
`OAUTH_REDIRECT_URI` value (character-for-character, including `https` and
`/callback`). No extra scopes or intents are needed - the editor requests
`identify guilds` itself, and never touches the bot gateway.

Generate a session secret with, e.g.:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Running

```bash
npm run build      # compiles TS and copies web-plugin.json manifests into dist/
npm run web        # starts the editor (or `npm run web:dev` for tsx)
```

With Docker, `docker compose up -d --build` starts both the bot
(`ttt-discord-bot`) and the editor (`ttt-web-editor`) from the same image. The
editor is published behind a `caddy-docker-proxy` label rather than a host port;
see [docker-compose.yml](docker-compose.yml) and [INSTALL.md](INSTALL.md).

## Setup

1. Requirements: Node.js 18+ (uses the built-in global `fetch`).
2. Install dependencies:

```bash
npm install
```

3. Create a Discord application and bot at the
   [Developer Portal](https://discord.com/developers/applications):
   - Copy the **bot token** and the **Application (client) ID**.
   - Invite the bot with the `bot` and `applications.commands` scopes, granting
     **Send Messages** and **Attach Files** permissions.
4. Copy `env.example` to `.env` and fill in the values:

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-test-server-id        # optional; instant registration during dev
AUTOTHREAD_CHANNEL_IDS=123,456      # optional; channels for auto comments threads
WELCOME_CHANNEL_ID=789              # optional; channel for the join welcome card
```

The two privileged modules need their intents enabled in the Developer Portal
(Bot -> Privileged Gateway Intents): **Message Content** for auto-threading and
**Server Members** for the welcome card.

If you also want to run the browser-based text editor, set its extra variables
too - see [Web text editor](#web-text-editor).

## Deploy slash commands

Register the commands with Discord (run again whenever commands change):

```bash
npm run deploy
```

- With `GUILD_ID` set, commands register to that server instantly (best for dev).
- Without it, commands register globally and can take up to ~1 hour to appear.

## Run

```bash
npm start
```

You should see `Logged in as <bot>#0000.` Then try `/pic` in a channel.

## Notes

- Attachment size is limited by the server's upload cap (10 MB by default, higher
  with server boosts). Oversized files are reported back to the user.
- Hosting/deployment (Docker on your own server, plus free alternatives) is
  documented in [INSTALL.md](INSTALL.md).
