# TODO

Deferred work from reaction-roles / web editor reviews. Low priority unless noted.

## Consolidation (wait for a 3rd publishable module)

- [ ] **Generic `config-io` factory** — `reaction-roles/config-io.ts` and `tickets/config-io.ts` share the same read/update/get pattern; extract e.g. `createConfigIo<T>(namespace, listKey, defaults)`.
- [ ] **Generic publish helpers** — `publishXPanel` / `unpublishXPanel` boilerplate in `reaction-roles/index.ts` and `tickets/index.ts`; shared `createPanelPublisher({ resolve, update, getConfig, publishPanel })`.

## Web editor (`src/web/ui.ts`)

- [ ] **De-module-ify `syncEphemeralField`** — drive visibility from `web-plugin.json` (e.g. `visibleWhen: { reactionType: ['button', 'dropdown', …] }`, `defaultItem` on object-list fields) instead of `if (ns === 'reaction-roles')` branches.
- [ ] **Clear `ephemeralMessage` on emoji mode** — `syncEphemeralField` hides the field in the UI but does not clear the saved value in JSON when switching interaction type to emoji; either clear on save or on type change.

## Validation

- [ ] **Panel rules on save** — duplicate emojis, required labels, option count, etc. are enforced in `validatePanel` at publish time only (`reaction-roles/panel.ts`); mirror key rules in `store.ts` on save so invalid configs fail early in the web editor.

## Reaction-roles runtime

- [ ] **Per-user interaction cooldown** — optional debounce/cooldown on button, dropdown, and emoji handlers to reduce Discord rate-limit spam from rapid toggling.
