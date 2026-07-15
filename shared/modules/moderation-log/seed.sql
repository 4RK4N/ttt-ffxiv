-- One-time seed for moderation-log (SQLite/Turso). Do not re-run on a populated DB.
CREATE TABLE IF NOT EXISTS module_moderation_log (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO module_moderation_log(key,value) VALUES('editorConfig','{"title":"Moderation Log","description":"Posts embed logs to a channel when messages are deleted or members leave, are kicked, banned, or unbanned.","fields":[{"key":"channelId","label":"Log channel","type":"channel","store":"config","help":"Channel where moderation events are posted. Leave empty to disable."},{"key":"logMessageDeleted","label":"Log deleted messages","type":"boolean","store":"config"},{"key":"logMemberLeft","label":"Log member leave","type":"boolean","store":"config"},{"key":"logMemberKicked","label":"Log member kick","type":"boolean","store":"config"},{"key":"logMemberBanned","label":"Log member ban","type":"boolean","store":"config"},{"key":"logMemberUnbanned","label":"Log member unban","type":"boolean","store":"config"},{"key":"messageDeleted","label":"Deleted message line","type":"text","help":"Tokens: {author}, {channel}"},{"key":"messageDeletedEmpty","label":"Deleted message (no text)","type":"text","help":"Shown when the deleted message had no text content."},{"key":"authorUnknown","label":"Unknown author","type":"text","help":"Used for {author} and the embed author name when Discord sends no author (e.g. bulk/system deletes)."},{"key":"memberLeft","label":"Member left","type":"text","help":"Tokens: {mention}"},{"key":"memberKicked","label":"Member kicked","type":"text","help":"Tokens: {mention}, {executorId}"},{"key":"memberBanned","label":"Member banned","type":"text","help":"Tokens: {mention}, {executorId}"},{"key":"memberUnbanned","label":"Member unbanned","type":"text","help":"Tokens: {mention}, {executorId}"},{"key":"executorUnknown","label":"Unknown moderator","type":"text","help":"Substituted for {executorId} when the audit log has no executor."},{"key":"footerMessageId","label":"Footer (deleted message)","type":"text","help":"Tokens: {messageId}"},{"key":"footerUserId","label":"Footer (member events)","type":"text","help":"Tokens: {userId}"}]}') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('enabled','true') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('channelId','""') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('logMessageDeleted','true') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('logMemberLeft','true') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('logMemberKicked','true') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('logMemberBanned','true') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('logMemberUnbanned','true') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('messageDeleted','"🗑️ Message sent by {author} deleted in {channel}"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('messageDeletedEmpty','"[no text content]"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('authorUnknown','"Unknown user"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('memberLeft','"📤 {mention} has left the server"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('memberKicked','"👮 {mention} has been kicked by {executorId}"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('memberBanned','"👮 🔒 {mention} has been banned by {executorId}"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('memberUnbanned','"🔓 {mention} has been unbanned by {executorId}"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('executorUnknown','"Unknown"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('footerMessageId','"Message ID: {messageId}"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_moderation_log(key,value) VALUES('footerUserId','"ID: {userId}"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
