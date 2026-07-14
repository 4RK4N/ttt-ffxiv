-- Turso/SQLite base schema (app secrets only; module tables live in per-module seed.sql)
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0
);
