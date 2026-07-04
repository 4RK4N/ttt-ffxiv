# Modules

Bot features live under `bot/src/modules/<name>/` (handlers) and `shared/modules/<name>/`
(types, config-io, panels). Runtime config under `data/<name>/`.
The [web editor](README.md#web-editor) edits `config.json` / `texts.json` per module;
changes hot-reload without restart.

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

- **Config:** `enabled` toggle
- **Texts:** disabled notice, errors, thread opener
- **Permissions:** Send Messages, Attach Files, Create Public Threads (thread optional)

### links-pics-vids-autothread

Auto-creates comments threads on qualifying posts in watched channels (X/Bluesky/Aethy links or media).

- **Config:** `channelIds[]`
- **Intent:** Message Content
- **Thread naming:** same pattern as `/pic` (`buildThreadName` in core)

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

| Location | File | Role |
|----------|------|------|
| `shared/modules/<name>/` | `types.ts` | `createModuleConfig`, defaults, `config()`, `texts()`, `resolve*()` |
| `shared/modules/<name>/` | `config-io.ts` | IO boundary — **handlers import from here** |
| `shared/modules/<name>/` | `web-plugin.json` | Web editor fields (optional) |
| `shared/modules/<name>/` | `validate.ts` | Row validation for object-lists (panel modules) |
| `shared/modules/<name>/` | `panel.ts` | Publish payload (panel modules) |
| `bot/src/modules/<name>/` | `index.ts` | `CommandModule` export only |
| `bot/src/modules/<name>/` | `handlers.ts` | Event/command handlers (recommended) |

**Simple modules:** `config-io.ts` re-exports reads.
**Panel modules:** add `createConfigIo` for publish-time config patches (`published`, `panelMessageId`, …).

**Adding a module:** copy [`bot/src/examples/module-template/`](bot/src/examples/module-template/) →
`bot/src/modules/<name>/` and `shared/modules/example-module/` → `shared/modules/<name>/`.
The loader picks up any folder with `index.ts` automatically.
Panel modules also register publish routes in `web-admin/src/publishHandlers.ts` and validators in
`web-admin/src/store.ts`.

Shared helpers: `shared/core/moduleConfig.ts`, `discordInteractions.ts`, `discordRoles.ts`,
`threads.ts`, `panelFields.ts`, `panelPublisher.ts`.

See the [module template README](bot/src/examples/module-template/README.md) for full patterns.

---

## Intents & permissions (quick reference)

| Module | Privileged intent | Other requirements |
|--------|-------------------|-------------------|
| welcome-message | Server Members | — |
| pic-repost-commands | — | Thread permissions in channel |
| links-pics-vids-autothread | Message Content | — |
| tickets | Server Members | Manage Threads, Manage Roles |
| reaction-roles | — (reactions: standard) | Manage Roles |
| moderation-log | Server Members | View Audit Log (moderator on kick/ban) |
| custom-embeds | — | Embed Links |
