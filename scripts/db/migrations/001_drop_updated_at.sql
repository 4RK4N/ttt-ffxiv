-- Drop legacy updated_at column from all KV tables (single-process Turso).
-- Safe to re-run only on DBs that still have updated_at; fresh DBs skip via IF NOT EXISTS patterns.

CREATE TABLE IF NOT EXISTS app_config_new (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO app_config_new (key, value) SELECT key, value FROM app_config;
DROP TABLE app_config;
ALTER TABLE app_config_new RENAME TO app_config;

CREATE TABLE IF NOT EXISTS module_custom_embeds_new (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO module_custom_embeds_new (key, value) SELECT key, value FROM module_custom_embeds;
DROP TABLE module_custom_embeds;
ALTER TABLE module_custom_embeds_new RENAME TO module_custom_embeds;

CREATE TABLE IF NOT EXISTS module_emojis_new (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO module_emojis_new (key, value) SELECT key, value FROM module_emojis;
DROP TABLE module_emojis;
ALTER TABLE module_emojis_new RENAME TO module_emojis;

CREATE TABLE IF NOT EXISTS module_links_pics_vids_autothread_new (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO module_links_pics_vids_autothread_new (key, value) SELECT key, value FROM module_links_pics_vids_autothread;
DROP TABLE module_links_pics_vids_autothread;
ALTER TABLE module_links_pics_vids_autothread_new RENAME TO module_links_pics_vids_autothread;

CREATE TABLE IF NOT EXISTS module_moderation_log_new (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO module_moderation_log_new (key, value) SELECT key, value FROM module_moderation_log;
DROP TABLE module_moderation_log;
ALTER TABLE module_moderation_log_new RENAME TO module_moderation_log;

CREATE TABLE IF NOT EXISTS module_pic_repost_commands_new (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO module_pic_repost_commands_new (key, value) SELECT key, value FROM module_pic_repost_commands;
DROP TABLE module_pic_repost_commands;
ALTER TABLE module_pic_repost_commands_new RENAME TO module_pic_repost_commands;

CREATE TABLE IF NOT EXISTS module_reaction_roles_new (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO module_reaction_roles_new (key, value) SELECT key, value FROM module_reaction_roles;
DROP TABLE module_reaction_roles;
ALTER TABLE module_reaction_roles_new RENAME TO module_reaction_roles;

CREATE TABLE IF NOT EXISTS module_tickets_new (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO module_tickets_new (key, value) SELECT key, value FROM module_tickets;
DROP TABLE module_tickets;
ALTER TABLE module_tickets_new RENAME TO module_tickets;

CREATE TABLE IF NOT EXISTS module_welcome_message_new (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO module_welcome_message_new (key, value) SELECT key, value FROM module_welcome_message;
DROP TABLE module_welcome_message;
ALTER TABLE module_welcome_message_new RENAME TO module_welcome_message;
