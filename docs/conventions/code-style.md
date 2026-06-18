# Code style

- TypeScript with `strict` mode. Prefer `async/await` over promise chains.
- Formatting is handled by Prettier (`@andrewmcodes/prettier-config`): run `mise run format`. Indentation (2-space) and end-of-line rules come from `.editorconfig`.
- Keep `src/main.ts` minimal — lifecycle only. Feature logic lives in modules.
- One responsibility per module. Split files that grow past ~200–300 lines.
- `tsconfig.json` targets ES2022 with `moduleResolution: "bundler"` and `noEmit` (esbuild does the bundling; `tsc` only type-checks).

See [linting.md](linting.md) for ESLint and [architecture.md](architecture.md) for module boundaries.
