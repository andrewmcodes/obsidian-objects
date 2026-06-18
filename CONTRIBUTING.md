# Contributing

Thanks for your interest in improving Obsidian Objects!

## Setup

This project uses [`mise`](https://mise.jdx.dev/) for tooling and **pnpm via Corepack** for dependencies.

```bash
mise install          # provision Node (from mise.toml)
mise run install      # install dependencies
mise run hooks        # install the commit-msg git hook
```

## Develop

```bash
mise run dev          # esbuild watch build (main.js at repo root)
```

For a live loop against a real vault, install the [Hot Reload](https://github.com/pjeby/hot-reload) plugin and point the build at your vault:

```bash
OBSIDIAN_VAULT="/path/to/your/vault" mise run dev
```

This writes `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/obsidian-objects/` and touches `.hotreload` on every rebuild. To do a one-off install instead, use `mise run install-plugin`.

## Quality gates

Run everything before opening a PR:

```bash
mise run check        # lint + format-check + build + test
```

Individual tasks: `lint`, `format`, `format-check`, `build`, `test`.

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/), enforced by the `commit-msg` hook.
- **Formatting**: Prettier; 2-space indent (`.editorconfig`).
- **Comments**: [TSDoc](https://tsdoc.org/) for symbols; inline `//` only for non-obvious logic.
- **Architecture**: keep `src/main.ts` lifecycle-only; pure logic in `services/` must not import `obsidian` so it stays unit-testable.

See [`AGENTS.md`](AGENTS.md) and [`docs/conventions/`](docs/conventions/) for the full guide.

## Tests

Unit tests live beside the code as `src/**/*.test.ts` and run on [Vitest](https://vitest.dev/) (`mise run test`). Prefer testing pure logic directly; a minimal `obsidian` stub lives at `tests/__mocks__/obsidian.ts`.

## Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please). Conventional Commits on `main` keep a "release PR" open that bumps `package.json` + `manifest.json` and updates `CHANGELOG.md`. Merge that PR to cut a release: it tags the version (no leading `v`) and the workflow builds and attaches `main.js`, `manifest.json`, and `styles.css`.

Note: `versions.json` (plugin version → minAppVersion) is maintained manually — update it when you raise `minAppVersion`.
