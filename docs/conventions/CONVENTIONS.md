# Conventions

Living record of the conventions used in this repository. Add to it as new
conventions are established. These mirror the operational rules in
[`AGENTS.md`](../../AGENTS.md) but are organized by topic for humans.

## Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/): `type: subject`.
- Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`.
- Keep the subject short and imperative ("add", not "added").
- Commit messages are validated by `@andrewmcodes/commitlint-config` via the
  `commit-msg` git hook. Install hooks with `mise run hooks`.

## Comments & documentation

- Document symbols (functions, classes, interfaces, properties) with
  [TSDoc](https://tsdoc.org/) `/** ... */` doc comments. Use tags
  (`@param`, `@returns`) where they add clarity.
- Use inline `//` comments to explain non-obvious logic inside function bodies.
- Prefer self-explanatory names over comments that restate the code.

## Code style

- TypeScript with `strict` mode. Prefer `async/await` over promise chains.
- Formatting is handled by Prettier (`@andrewmcodes/prettier-config`): run
  `mise run format`. Indentation/quote rules come from `.editorconfig`.
- Linting uses ESLint with `eslint-plugin-obsidianmd`: run `mise run lint`.
- Keep `src/main.ts` minimal — lifecycle only. Feature logic lives in modules.
- One responsibility per module. Split files that grow past ~200–300 lines.

## Architecture

- `src/types/` — plain data types (no Obsidian imports).
- `src/services/` — domain logic. Pure where possible so it can be unit-tested
  without Obsidian; vault/UI access is isolated to clearly named methods.
- `src/modals/` — Obsidian `Modal` subclasses (UI only).
- `src/settings/` — settings tab and schema editor UI.
- `src/commands/` — command registration.
- `src/utils/` — small pure helpers (dates, filenames, defaults).
- Pure logic must not import from `obsidian` so tests can run in Node.

## Testing

- Tests use [Vitest](https://vitest.dev/): run `mise run test`.
- Co-locate unit tests as `src/**/<name>.test.ts`.
- Test pure logic directly. A minimal `obsidian` stub lives at
  `tests/__mocks__/obsidian.ts` for modules that transitively import it.

## Tooling

- Task runner: [`mise`](https://mise.jdx.dev/). See `mise.toml` for tasks
  (`install`, `dev`, `build`, `lint`, `format`, `test`, `check`, `hooks`).
- `mise run check` runs lint + build + test together.
