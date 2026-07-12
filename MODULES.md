# Modules

Bot features live under `bot/src/modules/<name>/` (handlers), `bot/src/lib/modules/<name>/`
(config-io, panels, publishers), and `shared/modules/<name>/` (web contract: types,
validators, `web-plugin.json`). Runtime config under `data/<name>/`.
The [web editor](README.md#web-editor) edits `config.json` / `texts.json` per module;
changes hot-reload without restart. Panel publish/unpublish goes through the bot internal API.

Setup details and example JSON: [INSTALL.md](INSTALL.md#configuration-reference).

## Catalog

### welcome-message

Posts a welcome card on join and sends rules by DM (falls back to channel if DMs closed).

- **Config:** `channelId`, `rulesChannelId` — `data/welcome-message/config.json`
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

Auto-creates comments threads on qualifying posts in watched channels: X,
Bluesky, Aethy, or Instagram post links; direct Discord image/video links; or
native image/video attachments.

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
- **Setup:** [INSTALL.md — tickets](INSTALL.md#datatickets---ticket-panels-and-private-thread-tickets)

### reaction-roles

Embed role panels: buttons, emoji reactions, or dropdown (single/multi).

- **Config:** `panels[]` (interaction type, role options, publish state)
- **Intent:** Guild Message Reactions (emoji mode)
- **Bot needs:** Manage Roles, role hierarchy above assignable roles
- **Setup:** [INSTALL.md — reaction-roles](INSTALL.md#datareaction-roles---embed-role-panels)

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

- **Config:** `emojiRoleId` (optional — members with this role can use the commands; Administrators always can)
- **Texts:** disabled notice, permission/size/slot errors, success reply
- **Tokens:** `{emoji}` in success reply
- **Permissions:** Manage Emojis and Stickers

---

## Data layout

```
data/
  <namespace>/
    config.json       # settings, enabled toggle, list rows (panels, ticketTypes, …)
    texts.json        # user-facing copy
  welcome-message/
    media/            # welcome card background
    fonts/            # welcome card font
```

Each module ships code defaults in `types.ts`; missing or bad JSON falls back safely.
Slash command names/descriptions stay in code — run `npm run deploy` after changes.

Channel and role fields in the web editor are validated as Discord IDs (numeric snowflakes) on save.

---

## Module code layout

Every production module follows the same shape:

| Location                      | File              | Role                                                     |
| ----------------------------- | ----------------- | -------------------------------------------------------- |
| `shared/modules/<name>/`      | `types.ts`        | Panel modules only — shared contract with web validators |
| `shared/modules/<name>/`      | `validate.ts`     | Row validation for object-lists (panel modules)          |
| `shared/modules/<name>/`      | `web-plugin.json` | Web editor fields (optional)                             |
| `bot/src/lib/modules/<name>/` | `types.ts`        | Non-panel modules — defaults, `config()`, `texts()`      |
| `bot/src/lib/modules/<name>/` | `config-io.ts`    | IO boundary — **handlers import from here**              |
| `bot/src/lib/modules/<name>/` | `panel.ts`        | Publish payload + custom IDs (panel modules)             |
| `bot/src/lib/modules/<name>/` | `publisher.ts`    | Publish/unpublish (panel modules)                        |
| `bot/src/modules/<name>/`     | `index.ts`        | `CommandModule` export only                              |
| `bot/src/modules/<name>/`     | `handlers.ts`     | Event/command handlers (recommended)                     |

**Simple modules:** `config-io.ts` re-exports reads from `bot/src/lib/modules/<name>/types.ts`.
**Panel modules:** shared `types.ts` + `validate.ts`; bot lib holds `config-io`, `panel`, `publisher`.

**Adding a module:** copy [`bot/src/examples/module-template/`](bot/src/examples/module-template/) →
`bot/src/modules/<name>/` and `bot/src/lib/modules/example-module/` → `bot/src/lib/modules/<name>/`.
For the web editor, copy `web-plugin.json` to `shared/modules/<name>/`.
Panel modules also copy `panel-types.ts` and `validate.ts` from the template into `shared/modules/<name>/`.
The loader picks up any folder with `index.ts` automatically.
Panel modules also register the namespace in `bot/src/internal-api/publishRegistry.ts` and validators in
`web-admin/src/store.ts`.

Shared contract helpers: `shared/core/moduleConfig.ts`, `panelFields.ts`, `strings.ts`, `texts.ts`.
Bot runtime helpers: `bot/src/lib/core/discordInteractions.ts`, `discordRoles.ts`, `threads.ts`, `panelPublisher.ts`.

See the [module template README](bot/src/examples/module-template/README.md) for full patterns.

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
