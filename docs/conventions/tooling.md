# Tooling

- Task runner: [`mise`](https://mise.jdx.dev/). See `mise.toml` for tasks.
- Package manager: **pnpm via Corepack** (pinned by `packageManager` in `package.json`); run as `corepack pnpm …`.
- `mise run check` runs lint + format-check + build + test together — run it before opening a PR.

| Task                      | What it does                           |
| ------------------------- | -------------------------------------- |
| `mise run install`        | Install dependencies                   |
| `mise run dev`            | esbuild watch (hot reload via vault)   |
| `mise run build`          | Type-check + production bundle         |
| `mise run lint`           | ESLint                                 |
| `mise run format`         | ESLint `--fix` then Prettier `--write` |
| `mise run test`           | Vitest                                 |
| `mise run check`          | lint + format-check + build + test     |
| `mise run hooks`          | Install the commit-msg git hook        |
| `mise run install-plugin` | Build and copy artifacts into a vault  |

## Dependencies

- Bump dependencies one at a time, running `mise run check` after each.
- Dependabot proposes weekly updates (grouped dev-dependencies) — see `.github/dependabot.yml`.
- See [linting.md](linting.md) for the ESLint version constraint.
