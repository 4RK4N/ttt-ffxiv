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
  message fails. The rules channel is linked via the `{rulesChannel}` token,
  which renders as a clickable channel link (built from the guild and the
  configured `rulesChannelId`).

Configure the target channel with `channelId` in
`data/welcome-message/config.json`, and the linked rules channel with
`rulesChannelId`, or pick both from channel dropdowns in the
[Web editor](#web-editor). If `channelId` is empty, the module stays disabled;
if `rulesChannelId` is empty, the `{rulesChannel}` token renders as nothing.
This module uses the `guildMemberAdd` event, so
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

This module can be turned off with its on/off toggle in the
[Web editor](#web-editor); while off, `/pic` and `/post` reply with a short
"disabled" notice instead of posting.

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

Configure which channels are watched with `channelIds` (an array of channel IDs)
in `data/links-pics-vids-autothread/config.json`, or tick them in a channel
picker in the [Web editor](#web-editor). This module reads message content, so
the bot needs the privileged **Message Content** intent enabled in the Developer
Portal (Bot -> Privileged Gateway Intents). If `channelIds` is empty, the module
stays disabled.

## Project layout

```
src/
  index.ts              # entry point: client + interaction routing
  config.ts             # loads & validates data/config.json
  core/
    moduleLoader.ts     # auto-discovers modules under src/modules/*
    threads.ts          # shared thread title helpers
    texts.ts            # loads per-module texts/assets from data/
  modules/
    welcome-message/
      index.ts          # welcome card + rules on member join
      web-plugin.json   # editor manifest: which texts/config are editable
    pic-repost-commands/
      index.ts          # the /pic + /post module
      web-plugin.json
    links-pics-vids-autothread/
      index.ts          # auto comments threads on posts
      web-plugin.json
  web/                  # the web editor (separate process/container)
    server.ts           # entry point: Hono HTTP server + routes
    config.ts           # validates the editor's own config
    auth.ts             # Discord OAuth login + guild-admin check + session
    plugins.ts          # scans modules for web-plugin.json manifests
    store.ts            # validated, atomic read/write of texts.json + config.json
    channels.ts         # lists the guild's channels for the channel pickers
    ui.ts               # the editor's HTML page (side-tabs per module)
data/                   # runtime config + editable content (git-ignored secrets)
  config.json           # bot config (token, IDs, web editor) - from config.example.json
  welcome-message/
    config.json         # { "channelId": "...", "rulesChannelId": "..." } - welcome + rules channels
    texts.json
    media/background.png
    fonts/DancingScript.ttf
  pic-repost-commands/
    config.json         # { "enabled": true } - master on/off switch
    texts.json
  links-pics-vids-autothread/
    config.json         # { "channelIds": [...] } - watched channels
    texts.json
scripts/
  deploy-commands.ts    # registers slash commands with Discord
  copy-web-plugins.js   # copies web-plugin.json manifests into dist on build
```

To add a new feature later, create `src/modules/<name>/index.ts` that exports
either `{ name, commands: [{ data, execute }] }` for slash commands, or
`{ name, init(client) }` to register event listeners (or both). The loader and
deploy script pick it up automatically - no core changes needed. To make its
texts or config editable in the web editor, drop a `web-plugin.json` in the same
folder (see [Web editor](#web-editor)); the editor discovers it automatically.

### Editing texts and assets

User-facing message text lives in `data/<module>/texts.json`, and the welcome
card's image/font live in `data/welcome-message/media` and `.../fonts`. These are
read at runtime (not bundled into the build), so you can edit them and the bot
picks up changes on the next event - no rebuild or restart needed. Each module
ships code defaults as a fallback, so a missing or malformed file never breaks the
bot. Slash command names/descriptions stay in code (they require `npm run deploy`
to change).

You can edit `texts.json` files by hand, or through the built-in
[Web editor](#web-editor), which writes the same files.

## Web editor

A small browser UI for editing each module's `texts.json` and `config.json`
without touching the server. Modules are organized into **side-tabs** (one per
module). It runs as a **separate process/container** that shares the bot's
`data/` directory, so saved edits take effect on the bot's next event - no
restart.

- **On/off toggle**: each module has a master switch in its tab (and a colored
  dot on the side-tab: green = on, grey = off). Flipping it is instant and is
  saved as an `enabled` boolean in that module's `config.json`. A disabled module
  stops acting immediately - the bot hot-reloads the change on its next event, no
  restart needed. Only an explicit `false` disables; a missing `enabled` key reads
  as on, so modules stay enabled by default.
- **What's editable** is declared per module by a `web-plugin.json` manifest next
  to the module's `index.js`. Each manifest lists fields with a `key`, `label`,
  optional `help`, a `type` (`text`, `textarea`, `channel`, or `channel-multi`),
  and a `store` (`texts` for `texts.json`, `config` for `config.json`; defaults
  to `texts`). The editor scans modules at startup, so adding/removing editable
  fields is just editing that JSON - no code changes.
- **Channel pickers**: `channel`/`channel-multi` fields render as dropdowns
  populated with the server's channels, fetched live via the bot token, so you
  set channel IDs by picking from a list instead of copying IDs by hand.
- **Access** is restricted to **administrators of `guildId`**. Login is via
  Discord OAuth: the editor checks that your account has the Administrator
  permission on that server before letting you in.
- **Safety**: writes are validated against the manifest (only known keys, correct
  value types) and written atomically, so a half-saved or malformed file can't
  reach the bot.

### Configuration

The editor reads `clientSecret`, `sessionSecret`, `oauthRedirectUri`, `webPort`,
and `guildId` from `data/config.json`, and uses the bot's `discordToken` to list
the server's channels for the channel pickers. These are only needed by the
editor; the bot ignores the OAuth/web ones. See the
[Configuration reference](INSTALL.md#configuration-reference) in `INSTALL.md`
for each field, how to generate a session secret, and the exact
`oauthRedirectUri` you must register under **Developer Portal -> OAuth2 ->
Redirects**. No extra scopes or intents are needed - the editor requests
`identify guilds` itself and never touches the bot gateway.

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
4. Copy `data/config.example.json` to `data/config.json` and fill in at least
   `discordToken` and `clientId`:

```bash
cp data/config.example.json data/config.json
```

   Per-module channel settings live in
   `data/links-pics-vids-autothread/config.json` (`channelIds`) and
   `data/welcome-message/config.json` (`channelId`, `rulesChannelId`). For every field, what's
   optional, and the privileged intents each module needs, see the
   [Configuration reference](INSTALL.md#configuration-reference) in `INSTALL.md`.

## Deploy slash commands

Register the commands with Discord (run again whenever commands change):

```bash
npm run deploy
```

- With `guildId` set, commands register to that server instantly (best for dev).
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
