# Example module data

Optional on-disk assets for modules that need files (e.g. welcome card media under
`data/welcome-message/media/`).

**Settings and copy are not stored here** — they live in PostgreSQL (`module_*` tables)
and are edited via the web editor.

## New module checklist

1. Add `MODULE_DEFAULTS` in the module's `types.ts`.
2. Register the namespace in `shared/core/moduleTable.ts` and `scripts/db/schema.sql`.
3. Add the namespace to `scripts/db/moduleSeedDefaults.ts` for `./scripts/db/db-init.sh` seeding.
4. Create `data/<namespace>/` only if the module needs binary assets on disk.

The namespace in `createModuleData('…')` must match the table slug (e.g. `welcome-message`
→ `module_welcome_message`).
