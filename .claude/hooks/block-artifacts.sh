#!/usr/bin/env sh
# Claude Code PreToolUse hook: refuse edits to generated/locked files.
# Reads the tool-call JSON on stdin, extracts the target file path, and exits
# non-zero (blocking the edit) when it points at a build artifact or lockfile.
# These are produced by `mise run build` and pnpm — hand-edits silently diverge
# from source. Exit 2 tells Claude the action is denied; the message on stderr
# explains why. Any other case exits 0 to allow the edit.

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$file" ] && exit 0

base=$(basename "$file")
case "$base" in
  main.js)
    echo "Refusing to edit main.js — it is a build artifact. Edit the TypeScript source in src/ and run \`mise run build\`." >&2
    exit 2
    ;;
  pnpm-lock.yaml)
    echo "Refusing to edit pnpm-lock.yaml by hand. Change package.json and run \`corepack pnpm install\` to regenerate it." >&2
    exit 2
    ;;
esac

exit 0
