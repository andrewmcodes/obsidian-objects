#!/usr/bin/env sh
# Claude Code PostToolUse hook: format and lint-fix a file after Claude edits it.
# Reads the tool-call JSON on stdin, extracts the edited file path, then runs
# Prettier (and ESLint --fix for TypeScript) on just that file. Always exits 0
# so it never blocks the edit.

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

case "$file" in
  *.ts | *.tsx | *.js | *.mjs | *.cjs | *.css | *.md | *.json | *.yml | *.yaml)
    corepack pnpm exec prettier --write "$file" >/dev/null 2>&1
    ;;
esac

case "$file" in
  *.ts | *.tsx)
    corepack pnpm exec eslint --fix "$file" >/dev/null 2>&1
    ;;
esac

exit 0
