-- One-time seed template (SQLite/Turso). Copy to shared/modules/<name>/seed.sql and rename.
-- Keep INSERT values in sync with MODULE_DEFAULTS in types.ts.
CREATE TABLE IF NOT EXISTS module_example_module (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO module_example_module(key,value) VALUES('editorConfig','{"title":"Example Module","description":"Template module — replace before shipping.","fields":[{"key":"channelId","label":"Target channel","type":"channel","store":"config","help":"Leave empty to disable."},{"key":"greeting","label":"Greeting","type":"text","help":"Tokens: {mention}"},{"key":"disabled","label":"Disabled message","type":"text"}]}') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_example_module(key,value) VALUES('enabled','true') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_example_module(key,value) VALUES('channelId','""') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_example_module(key,value) VALUES('disabled','"This feature is currently disabled."') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
INSERT INTO module_example_module(key,value) VALUES('greeting','"Hello {mention}!"') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
