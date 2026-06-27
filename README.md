# ttt-bot

Custom Discord bot for Tiny Temptation Tubs (TTT), built with an extensible
module system so new features can be added without refactoring the core.

## Modules

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
  index.js              # entry point: client + interaction routing
  config.js             # loads & validates environment variables
  core/
    moduleLoader.js     # auto-discovers modules under src/modules/*
    threads.js          # shared thread title/first-message helpers
  modules/
    pic-repost-commands/index.js        # the /pic + /post module
    links-pics-vids-autothread/index.js # auto comments threads on posts
scripts/
  deploy-commands.js    # registers slash commands with Discord
```

To add a new feature later, create `src/modules/<name>/index.js` that exports
either `{ name, commands: [{ data, execute }] }` for slash commands, or
`{ name, init(client) }` to register event listeners (or both). The loader and
deploy script pick it up automatically - no core changes needed.

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
GUILD_ID=your-test-server-id   # optional; instant registration during dev
```

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
