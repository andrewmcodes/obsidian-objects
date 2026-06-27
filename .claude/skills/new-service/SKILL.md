---
name: new-service
description: Scaffold a new domain service in src/services/ with its paired Vitest test, following this project's conventions (pure logic, no obsidian import, TSDoc on exported symbols).
disable-model-invocation: true
---

# new-service

Scaffold a new service under `src/services/` plus its co-located Vitest test, matching the conventions in `AGENTS.md` and `docs/conventions/`.

## Arguments

The user invokes this as `/new-service <Name> [one-line purpose]`, e.g. `/new-service TagIndex builds a lookup of tags to notes`.

- `<Name>` — PascalCase base. If the user omits the `Service` suffix, append it (so `TagIndex` → `TagIndexService`). The files become `src/services/<Name>Service.ts` and `src/services/<Name>Service.test.ts`.
- The remaining words are the purpose, used in the file's top comment and the test description.

If no name is given, ask for one before creating anything.

## Rules (from this repo's conventions)

- **Pure logic only**: a service in `src/services/` must NOT `import` from `obsidian`, so it unit-tests in plain Node. Any vault/UI access belongs in a clearly named method that takes its dependencies as arguments, or in a separate Obsidian-aware caller. Do not add an `obsidian` import to the scaffold.
- **TSDoc** (`/** … */` with `@param`/`@returns`) on every exported symbol. Inline `//` only for non-obvious logic. (`docs/conventions/comments.md`)
- **TypeScript strict**; prefer `async/await`.
- 2-space indent, single quotes, semicolons (Prettier `@andrewmcodes/prettier-config`).
- Keep the file focused; split if it would grow past ~200–300 lines.

## Steps

1. Resolve the final `<Name>Service` and the purpose string. Confirm neither file already exists (don't overwrite — if one does, stop and tell the user).
2. Write `src/services/<Name>Service.ts` using the template below, substituting the name, purpose, and a sensible first exported function the user can rename.
3. Write `src/services/<Name>Service.test.ts` with a `describe` block targeting that function.
4. Run `mise run test` (or `corepack pnpm exec vitest run <Name>Service`) and `corepack pnpm exec eslint src/services/<Name>Service.ts` to confirm the scaffold is green, then report the two paths created.

## Template — service

```ts
// <Purpose>. Pure logic so it can be unit-tested without Obsidian.

/**
 * <Describe what this does.>
 *
 * @param input - <describe>
 * @returns <describe>
 */
export function <verb>(input: string): string {
  return input;
}
```

## Template — test

```ts
import { describe, expect, it } from 'vitest';
import { <verb> } from './<Name>Service';

describe('<verb>', () => {
  it('<describes the expected behavior>', () => {
    expect(<verb>('x')).toBe('x');
  });
});
```

Replace the placeholder `<verb>` export with whatever the purpose implies — the goal is a compiling, passing starting point that follows the house style, not a finished feature.
