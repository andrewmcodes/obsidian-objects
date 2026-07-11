/// <reference types="node" />
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
  globalIgnores([
    'node_modules',
    'dist',
    'esbuild.config.mjs',
    'version-bump.mjs',
    'versions.json',
    'vitest.config.ts',
    'commitlint.config.js',
    'tests',
    'main.js',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
  ]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mts', 'manifest.json'],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.json'],
      },
    },
  },
  ...obsidianmd.configs.recommended,
  {
    rules: {
      // "Bases" and "Templater" are Obsidian feature/plugin names that keep their canonical casing.
      'obsidianmd/ui/sentence-case': ['warn', { enforceCamelCaseLower: true, brands: ['Bases', 'Templater'] }],
    },
  },
  {
    // Test stubs cast plain objects to Obsidian types; the real vault types are unavailable in unit tests.
    files: ['**/*.test.ts'],
    rules: {
      'obsidianmd/no-tfile-tfolder-cast': 'off',
    },
  },
);
