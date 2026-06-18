# Linting

- ESLint with a flat config (`eslint.config.mts`) using [`eslint-plugin-obsidianmd`](https://github.com/obsidianmd/eslint-plugin) for Obsidian-specific rules, plus `typescript-eslint`.
- Run `mise run lint`; autofix via `mise run format` (ESLint `--fix` then Prettier).

## Notable rules

- **Sentence case** (`obsidianmd/ui/sentence-case`) — UI strings (command names, settings labels, notices) use sentence case. `Bases` is Obsidian's proper feature name, so the `Generate Bases` command keeps the capital via a targeted `eslint-disable-next-line`.
- **No plugin name in command names** (`obsidianmd/commands/no-plugin-name-in-command-name`) — commands must not include "Objects" (it's already shown in the palette).
- **No unsupported API** (`obsidianmd/no-unsupported-api`) — flags APIs newer than `manifest.json`'s `minAppVersion` (currently `1.13.0`).

## ESLint version constraint

ESLint and `@eslint/js` are **held at v9** even though v10 is available.

`eslint-plugin-obsidianmd@0.3.0` pins `@eslint/js: ^9.30.1`, and its transitive plugins (`@microsoft/eslint-plugin-sdl`, `eslint-plugin-react`, `eslint-plugin-import`) only support eslint ≤9. Upgrading to eslint 10 produces unmet peer dependencies and a fragile lint setup that can crash on eslint 10's removed APIs.

`typescript-eslint` (≥8.61) already supports eslint 10, so **the sole blocker is `eslint-plugin-obsidianmd`**. Revisit the eslint 10 upgrade once it ships eslint 10 / `@eslint/js` 10 support.
