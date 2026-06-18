# Architecture

Source lives in `src/`. Keep `main.ts` lifecycle-only and delegate to modules:

- `src/types/` — plain data types (no Obsidian imports).
- `src/services/` — domain logic. Pure where possible so it can be unit-tested without Obsidian; vault/UI access is isolated to clearly named methods.
- `src/modals/` — Obsidian `Modal` subclasses (UI only).
- `src/settings/` — settings tab and schema editor UI.
- `src/views/` — `ItemView` subclasses (e.g. the objects dashboard).
- `src/commands/` — command registration.
- `src/utils/` — small pure helpers (dates, filenames, links, defaults, constants).

Rule of thumb: **pure logic must not import from `obsidian`** so it stays unit-testable in plain Node. Anything touching the vault, workspace, or UI lives in a service method, modal, view, or command — never in the pure helpers.
