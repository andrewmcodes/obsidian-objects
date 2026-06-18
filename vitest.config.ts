import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      // Pure logic modules avoid importing `obsidian`, but provide a stub
      // so anything that does can still be exercised in tests.
      obsidian: fileURLToPath(new URL('./tests/__mocks__/obsidian.ts', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
  },
});
