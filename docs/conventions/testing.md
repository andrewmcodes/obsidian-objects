# Testing

- Tests use [Vitest](https://vitest.dev/): run `mise run test`.
- Co-locate unit tests as `src/**/<name>.test.ts`.
- Test pure logic directly. A minimal `obsidian` stub lives at
  `tests/__mocks__/obsidian.ts` (aliased in `vitest.config.ts`) for modules that
  transitively import it.
- Favor testing services and utils that hold the real logic; UI classes
  (modals, views, settings) are thin and exercised manually in Obsidian.
