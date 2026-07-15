-- One-time seed for welcome-message (SQLite/Turso). Do not re-run on a populated DB.
CREATE TABLE IF NOT EXISTS module_welcome_message (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO module_welcome_message(key,value) VALUES('editorConfig','{"title":"Welcome Message","description":"Greets new members with a welcome card and sends them the server rules via DM.","fields":[{"key":"rulesChannelId","label":"Rules channel","type":"channel","store":"config","help":"Linked from the rules message via the {rulesChannel} token. Leave empty to omit the link."},{"key":"channelId","label":"Welcome channel","type":"channel","store":"config","help":"Channel where the welcome card is posted when a member joins. Leave empty to disable."},{"key":"rulesMessage","label":"Rules message","type":"textarea","help":"Sent to the new member via DM (and posted in-channel if their DMs are closed). Tokens: {rulesChannel}"},{"key":"welcomeContent","label":"Welcome line","type":"text","help":"Posted with the welcome card. Tokens: {mention}"},{"key":"rulesChannelFallback","label":"Rules channel fallback","type":"textarea","help":"Short message posted in the welcome channel when the rules DM fails. Tokens: {mention}, {rulesChannel}"}]}') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_welcome_message(key,value) VALUES('enabled','true') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_welcome_message(key,value) VALUES('channelId','""') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_welcome_message(key,value) VALUES('rulesChannelId','""') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_welcome_message(key,value) VALUES('rulesMessage','"🇬🇧 English\nHave a great time here in **Tiny Temptation Tubs**\nPlease head over to {rulesChannel}\n and accept them to completely unlock the server for you (except NSFW that is optional).\n\n🇩🇪 Deutsch\nViel Spass im **Tiny Temptation Tubs**\nBitte lies dir die Regeln in {rulesChannel}\n durch und akzeptiere diese um den Server vollständig freizuschalten für dich (ausser NSFW dies ist optional)."') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_welcome_message(key,value) VALUES('welcomeContent','"Welcome {mention}"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_welcome_message(key,value) VALUES('rulesChannelFallback','"{mention} please read and accept the rules in {rulesChannel} to fully unlock the server."') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
