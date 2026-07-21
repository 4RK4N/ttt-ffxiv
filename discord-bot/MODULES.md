# Modules

Bot features live under `bot/src/modules/<name>/` (handlers), `bot/src/lib/modules/<name>/`
(config-io, panels, publishers), and `shared/modules/<name>/` (web contract: types,
validators, `seed.sql`). Runtime settings live in Turso (`module_*` tables in `data/ttt.db`).
The [web editor](../README.md#web-editor) edits module settings; changes hot-reload without restart.
Panel publish/unpublish runs in-process (no internal HTTP API).

Setup details: [INSTALL.md](INSTALL.md#configuration-reference).

## Catalog

### welcome-message

Posts a welcome card on join and sends rules by DM (falls back to channel if DMs closed).

- **Config:** `channelId`, `rulesChannelId` — `module_welcome_message` table / web editor
- **Assets:** `data/welcome-message/media/`, `fonts/`
- **Intent:** Server Members (`guildMemberAdd`)
- **Tokens:** `{mention}`, `{rulesChannel}` in texts

### pic-repost-commands (`/pic`, `/post`)

Re-posts user images through the bot with attribution; opens a comments thread.
The author can delete their repost by reacting with the configured delete emoji (bot does not pre-add the reaction). Author delete removes the comments thread first, then the post.

- **Config:** `enabled` toggle, `deleteEmoji` (default 🗑️), `deleteAuthorLastMention` (default on — last mention is delete author)
- **Texts:** disabled notice, errors, thread opener, attribution caption
- **Tokens:** `{message}`, `{mention}`, `{deleteEmoji}` in attribution; `{count}`, `{images}` in success reply
- **Delete auth:** author from user mention in caption (`{mention}` after `{message}`); last mention by default, or first when `deleteAuthorLastMention` is off
- **Permissions:** Send Messages, Attach Files, Manage Messages (strip non-author reactions + delete post), Create Public Threads, Manage Threads (create/delete comments thread)

### links-pics-vids-autothread

Auto-creates comments threads on qualifying posts in watched channels: X/Twitter
(including common fx/vx embed fixers), Bluesky, Aethy, Baraag, or Instagram post links;
direct Discord image/video links; or native image/video attachments.

- **Config:** `channelIds[]`, `deleteNonQualifyingMessages` (default off)
- **Texts:** `threadFirstMessage`, `nonQualifyingDm` (tokens: `{channel}` link, `{message}`)
- **Intent:** Message Content
- **Permissions:** Create Public Threads, Send Messages in Threads; **Manage Messages** when `deleteNonQualifyingMessages` is on
- **Thread naming:** same pattern as `/pic` (`buildThreadName` in core)
- **Enforcement:** when `deleteNonQualifyingMessages` is on, non-qualifying posts are deleted and the author receives a DM (skipped if DMs are closed)

### tickets

Private-thread tickets via panel buttons — no slash commands.

- **Config:** `ticketTypes[]` (channel, staff/denied roles, publish state, optional role-action role)
- **Flow:** open → close → delete; publish/unpublish panels in web editor
- **Intent:** Server Members (staff resolution)
- **Setup:** [INSTALL.md — tickets](INSTALL.md#tickets--ticket-panels-and-private-thread-tickets)

### reaction-roles

Embed role panels: buttons, emoji reactions, or dropdown (single/multi).

- **Config:** `panels[]` (interaction type, role options, publish state)
- **Intent:** Guild Message Reactions (emoji mode)
- **Bot needs:** Manage Roles, role hierarchy above assignable roles
- **Setup:** [INSTALL.md — reaction-roles](INSTALL.md#reaction-roles--embed-role-panels)

### moderation-log

Embed logs for message delete, member leave/kick/ban/unban (each toggleable).

- **Config:** `channelId`, `log*` booleans
- **Intent:** Server Members; **View Audit Log** for moderator attribution on kick/ban/unban

### custom-embeds

Static embed panels (info/rules) with optional author, footer, timestamp.

- **Config:** `panels[]`
- **Permissions:** Send Messages, Embed Links in target channel

### emojis (`/emoji-add`, `/emoji-copy`)

Upload or clone custom server emojis.

- **Config:** `emojiRoleId` (optional — members with this role can use the commands; Administrators always can). The Discord role must also have **Manage Emojis and Stickers** in Server Settings → Roles so assignees see the slash commands.
- **Texts:** disabled notice, permission/size/slot errors, success reply
- **Tokens:** `{emoji}` in success reply
- **Permissions:** Manage Emojis and Stickers (bot and emoji-manager role)

---

## Data layout

```
data/
  config.json         # DB bootstrap only (dbPath)
  ttt.db              # Turso database (gitignored)
  welcome-message/
    media/            # welcome card background
    fonts/            # welcome card font
```

Module settings and copy live in Turso (`module_*` tables), edited via the web editor.
Each module ships code defaults in `types.ts` (`MODULE_DEFAULTS`) and a one-time `seed.sql`; **keep them aligned manually** — every default key in TS needs a matching `INSERT` in seed (JSON-encoded values). `editorConfig` is only in `seed.sql`. `./discord-bot/scripts/db/db-init.sh` applies seeds on fresh installs.
Slash command names/descriptions stay in code — run `npm run deploy` after changes.

Channel and role fields in the web editor are validated as Discord IDs (numeric snowflakes) on save.

---

## Module code layout

Every production module follows the same shape:

| Location                      | File              | Role                                                     |
| ----------------------------- | ----------------- | -------------------------------------------------------- |
| `shared/modules/<name>/`      | `types.ts`        | Panel modules only — shared contract with web validators |
| `shared/modules/<name>/`      | `validate.ts`     | Row validation for object-lists (panel modules)          |
| `shared/modules/<name>/`      | `seed.sql`        | Table DDL + `editorConfig` + default rows (one-time seed) |
| `bot/src/lib/modules/<name>/` | `types.ts`        | Non-panel modules — defaults, `get()` / `data()`         |
| `bot/src/lib/modules/<name>/` | `config-io.ts`    | IO boundary — **handlers import from here**              |
| `bot/src/lib/modules/<name>/` | `panel.ts`        | Publish payload + custom IDs (panel modules)             |
| `bot/src/lib/modules/<name>/` | `publisher.ts`    | Publish/unpublish (panel modules)                        |
| `bot/src/modules/<name>/`     | `index.ts`        | `CommandModule` export only                              |
| `bot/src/modules/<name>/`     | `handlers.ts`     | Event/command handlers (recommended)                     |

**Simple modules:** `config-io.ts` re-exports reads from `bot/src/lib/modules/<name>/types.ts`.
**Panel modules:** shared `types.ts` + `validate.ts`; bot lib holds `config-io`, `panel`, `publisher`.

**Adding a module:** copy [`example/`](example/) into the project — `example/bot/src/modules/example-module/` →
`bot/src/modules/<name>/`, `example/bot/src/lib/modules/example-module/` → `bot/src/lib/modules/<name>/`,
and (panel modules) `example/shared/modules/example-module/` → `shared/modules/<name>/`.
For the web editor, adapt `example/shared/modules/example-module/seed.sql` (see existing modules).
Panel modules also register the namespace in `shared/core/panelModuleRegistry.ts`.
The loader picks up any folder with `index.ts` automatically.

Shared contract helpers: `shared/core/moduleConfig.ts`, `panelFields.ts`, `strings.ts`, `texts.ts`.
Bot runtime helpers: `bot/src/lib/core/discordInteractions.ts`, `discordRoles.ts`, `threads.ts`, `panelPublisher.ts`.

See the [example module README](example/README.md) for full patterns.

---

## Intents & permissions (quick reference)

| Module                     | Privileged intent       | Other requirements                                                            |
| -------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| welcome-message            | Server Members          | —                                                                             |
| pic-repost-commands        | —                       | Manage Messages, Create/Manage Threads                                        |
| links-pics-vids-autothread | Message Content         | Create Public Threads, Send in Threads; Manage Messages (when enforcement on) |
| tickets                    | Server Members          | Manage Threads, Manage Roles                                                  |
| reaction-roles             | — (reactions: standard) | Manage Roles                                                                  |
| moderation-log             | Server Members          | View Audit Log (moderator on kick/ban)                                        |
| custom-embeds              | —                       | Embed Links                                                                   |
| emojis                     | —                       | Manage Emojis and Stickers                                                    |
