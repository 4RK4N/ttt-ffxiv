-- App secrets/settings (key-value). Module tables are created via per-module seed.sql.
CREATE TABLE IF NOT EXISTS app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
