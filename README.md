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
  the member has DMs closed, the bot falls back to posting a short message in the
  welcome channel that mentions them and links the rules channel. The welcome
  card post is unaffected if the rules message fails. The rules channel is linked
  via the `{rulesChannel}` token, which renders as a clickable channel link
  (built from the guild and the configured `rulesChannelId`).

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

### tickets (private-thread ticket panels)

Button-driven support tickets via private threads — no slash commands. Each
**ticket type** is a category with its own channel, staff roles, optional denied
roles, panel copy, and flow messages. Configure in the [Web editor](#web-editor),
save, then **Publish panel** to post the open button in Discord. **Unpublish**
disables new opens (the panel message stays; clicks get an ephemeral
unavailable reply).

- **Open**: any user (unless blocked by denied roles) gets a private thread;
  staff and admins are auto-added.
- **Close / delete**: the ticket opener can close their own ticket; delete remains staff/admin only.
- **Denied roles**: optional per type; users with any selected role cannot open.
- **Role action button** (optional): per ticket type, staff can click a button inside the
  thread to grant a configured role to the ticket opener. Leave `roleActionRoleId` empty to
  hide the button.

See [INSTALL.md — tickets](INSTALL.md#datatickets---ticket-panels-and-private-thread-tickets)
for setup. Requires **Server Members** intent (staff resolution).

### reaction-roles (embed role panels)

Web-configured role panels posted as embeds — buttons, emoji reactions, or a
dropdown (single- or multi-select). Each **panel** has its own channel,
interaction type, role options, and optional ephemeral follow-up for buttons
and dropdowns (leave blank for no reply). **Publish panel** posts or updates the
Discord message; **Unpublish** stops processing interactions.

See [INSTALL.md — reaction-roles](INSTALL.md#datareaction-roles---embed-role-panels)
for setup. Emoji mode needs **Guild Message Reactions** intent (standard, not
privileged). The bot role must sit above assignable roles and have **Manage Roles**.

### moderation-log (audit-style event logging)

Posts embed logs to a configured channel when messages are deleted or members leave,
are kicked, banned, or unbanned. Each event type can be toggled independently in the
[Web editor](#web-editor). Kick, ban, and unban entries include the moderator when
Discord's audit log provides one (requires **View Audit Log**). Ban events are
deduplicated so a ban does not also log as a leave or kick.

Configure the log channel with `channelId` in `data/moderation-log/config.json`, or
pick it from a channel dropdown in the editor. If `channelId` is empty, the module
stays disabled. Member leave/kick detection uses the **Server Members** intent.

See [INSTALL.md — moderation-log](INSTALL.md#datamoderation-log---event-logging).

### custom-embeds (static info embed panels)

Web-configured embed messages for server info, rules summaries, or other static content
— no slash commands. Each **panel** has its own channel, title, description, optional
author/footer, and optional timestamp (refreshed on re-publish). **Save**, then
**Publish panel** to post or update the Discord message; **Unpublish** stops tracking
the panel (the message stays until removed manually).

See [INSTALL.md — custom-embeds](INSTALL.md#datacustom-embeds---static-embed-panels)
for setup. The bot needs **Send Messages** and **Embed Links** in the target channel.

## Project layout

```
src/
  index.ts              # entry point: client + interaction routing
  config.ts             # loads & validates data/config.json
  core/
    moduleLoader.ts     # auto-discovers modules under src/modules/*
    discordApi.ts       # authenticated Discord REST fetch
    discordEmoji.ts     # emoji parse/encode helpers
    discordReactions.ts # bot reaction sync with rate-limit spacing
    embedBuilder.ts     # shared Discord embed construction
    panelPublish.ts     # shared panel message post/edit
    panelPublisher.ts   # shared publish/unpublish orchestration
    configIo.ts         # shared config read/write helpers
    jsonWrite.ts        # atomic JSON file writes
    limits.ts           # shared caps (e.g. max panel options)
    threads.ts          # shared thread title helpers
    texts.ts            # loads per-module texts/assets from data/
    moduleConfig.ts     # createModuleConfig + resolveKeyedItem helpers
    panelFields.ts      # shared panel row field parsing
    discordInteractions.ts  # replyEphemeral, memberHasAnyRole
  examples/
    module-template/    # reference module layout (not loaded by bot)
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
    tickets/
      index.ts          # ticket panel buttons + open/close/delete flow
      web-plugin.json
    reaction-roles/
      index.ts          # role panel buttons/selects + emoji reactions
      web-plugin.json
    moderation-log/
      index.ts          # message delete + member leave/kick/ban/unban logs
      web-plugin.json
    custom-embeds/
      index.ts          # static embed panel publish/unpublish
      web-plugin.json
  web/                  # the web editor (separate process/container)
    server.ts           # entry point: Hono HTTP server + routes
    config.ts           # validates the editor's own config
    auth.ts             # Discord OAuth login + guild-admin check + session
    plugins.ts          # scans modules for web-plugin.json manifests
    publishHandlers.ts  # registry for module publish/unpublish routes
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
  tickets/
    config.json         # { "ticketTypes": [...] } - per-type channels, roles, publish state
    texts.json
  moderation-log/
    config.json         # { "channelId": "...", log* toggles } - log channel + event filters
    texts.json
  custom-embeds/
    config.json         # { "panels": [...] } - per-panel channel, publish state, timestamp
    texts.json
scripts/
  deploy-commands.ts    # registers slash commands with Discord
  copy-web-plugins.js   # copies web-plugin.json manifests into dist on build
```

To add a new feature later, create `src/modules/<name>/index.ts` that exports
either `{ name, commands: [{ data, execute }] }` for slash commands, or
`{ name, init(client) }` to register event listeners (or both). The loader and
deploy script pick it up automatically - no core changes needed. See
`src/examples/module-template/` for a documented starting layout (`types.ts`,
`config-io.ts`, optional `web-plugin.json`). To make its texts or config editable
in the web editor, drop a `web-plugin.json` in the same folder (see
[Web editor](#web-editor)); the editor discovers it automatically.

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
  optional `help`, a `type` (`text`, `textarea`, `boolean`, `channel`, `channel-multi`,
  `role-multi`, or `object-list`), and a `store` (`texts` for `texts.json`,
  `config` for `config.json`; defaults to `texts`). The editor scans modules at
  startup, so adding/removing editable fields is just editing that JSON - no
  code changes.
- **Channel/role pickers**: `channel`/`channel-multi` and `role-multi` fields
  render as checklists populated live via the bot token.
- **Access** is restricted to **administrators of `guildId`**. Login is via
  Discord OAuth: the editor checks that your account has the Administrator
  permission on that server before letting you in.
- **Safety**: writes are validated against the manifest (only known keys, correct
  value types) and written atomically, so a half-saved or malformed file can't
  reach the bot. Mutating API requests require a CSRF token (double-submit via
  signed cookie + `X-CSRF-Token` header). Session cookies use `SameSite=Lax`
  (required for OAuth; `Strict` breaks the Discord login redirect).

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
replace the `caddy:` hostname in [docker-compose.yml](docker-compose.yml) with
yours and keep port `8088` in sync with `webPort`. See [INSTALL.md](INSTALL.md).

## Setup

1. Requirements: Node.js 18+ (uses the built-in global `fetch`).
2. Install dependencies:

```bash
npm install
```

3. Create a Discord application and bot at the
   [Developer Portal](https://discord.com/developers/applications):
   - Copy the **bot token** and the **Application (client) ID**.
   - Invite the bot to your server. Recommended URL (Administrator — needed for
     tickets, moderation-log audit attribution, channel/role listing, thread management):

     ```
     https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands&permissions=8
     ```

     See [INSTALL.md](INSTALL.md) Part 1 for details.
4. Copy `data/config.example.json` to `data/config.json` and fill in at least
   `discordToken` and `clientId`:

```bash
cp data/config.example.json data/config.json
```

   Per-module settings live under `data/<module>/`. Copy each module's
   `*.example.json` templates before first use (e.g. welcome channel, auto-thread
   channels, moderation log channel). For every field, what's optional, and the
   privileged intents each module needs, see the
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
