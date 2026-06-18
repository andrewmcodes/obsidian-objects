# Obsidian Objects — agent guide

Schema-driven, object-based note-taking for Obsidian built on native Markdown,
Properties, and Bases. This file is the concise operating guide; detailed specs
live in [`docs/conventions/`](docs/conventions/).

## Project overview

- Obsidian community plugin (TypeScript → bundled JavaScript via esbuild).
- Entry point: `src/main.ts` → `main.js`, loaded by Obsidian.
- Release artifacts: `main.js`, `manifest.json`, and `styles.css`.
- Product spec: `.ai/PRD.md`. Progress tracker: `.ai/TASKS.md`.

## Environment & tooling

- Task runner: [`mise`](https://mise.jdx.dev/) — see `mise.toml`.
- Package manager: **pnpm via Corepack** (pinned by `packageManager` in
  `package.json`). Run pnpm as `corepack pnpm …` or after `corepack enable`.
- Node: pinned by `mise.toml` (`[tools]`).

Common tasks (`mise run <task>`):

| Task           | What it does                           |
| -------------- | -------------------------------------- |
| `install`      | Install dependencies with pnpm         |
| `dev`          | esbuild watch build                    |
| `build`        | Type-check + production bundle         |
| `lint`         | ESLint (`eslint-plugin-obsidianmd`)    |
| `format`       | ESLint `--fix` then Prettier `--write` |
| `format-check` | Prettier `--check`                     |
| `test`         | Vitest                                 |
| `check`        | lint + format-check + build + test     |
| `hooks`        | Install the commit-msg git hook        |

## Architecture

Source lives in `src/`; keep `main.ts` minimal (lifecycle only) and delegate to:

- `types/` — plain data types (no `obsidian` imports).
- `services/` — domain logic, pure where possible so it unit-tests without
  Obsidian; vault/UI access isolated to clearly named methods.
- `modals/` — `Modal` subclasses (UI).
- `settings/` — settings tab and schema editor.
- `views/` — `ItemView` subclasses (e.g. the objects dashboard).
- `commands/` — command registration.
- `utils/` — small pure helpers (dates, filenames, defaults, constants).

Pure logic must not import from `obsidian` so tests run in plain Node. Split any
file that grows past ~200–300 lines.

## Conventions

See [`docs/conventions/CONVENTIONS.md`](docs/conventions/CONVENTIONS.md) for the
full set. Highlights:

- **Comments**: document symbols with [TSDoc](https://tsdoc.org/) `/** … */`
  (`@param`, `@returns`). Inline `//` only for non-obvious logic.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/),
  validated by `@andrewmcodes/commitlint-config` via the `commit-msg` hook.
- **Formatting**: Prettier (`@andrewmcodes/prettier-config`); 2-space indent per
  `.editorconfig`. **Do not commit build artifacts** (`main.js`, `node_modules`).
- **TypeScript**: `strict` mode; prefer `async/await`.

Obsidian-specific rules (manifest, releases, security, performance, mobile, UX
copy, troubleshooting) live in
[`docs/conventions/obsidian-plugin.md`](docs/conventions/obsidian-plugin.md).

**Keep the docs in sync:** when you change or establish a convention, update the
relevant file in [`docs/conventions/`](docs/conventions/) (and the index table
in `CONVENTIONS.md`) in the same change.

## Agent do / don't

**Do**

- Add commands with stable ids (don't rename once released).
- Provide defaults and validation in settings.
- Write idempotent load/unload paths; use `this.register*` helpers for cleanup.
- Run `mise run check` before considering work done.

**Don't**

- Introduce network calls without a clear user-facing reason and documentation.
- Ship cloud-dependent features without disclosure and explicit opt-in.
- Store or transmit vault contents unless essential and consented.

## References

- API docs: <https://docs.obsidian.md>
- Plugin guidelines: <https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines>
- More detail: [`docs/conventions/`](docs/conventions/)
