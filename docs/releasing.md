# Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please), driven by [Conventional Commits](https://www.conventionalcommits.org/).

## How it works

1. Every push to `main` runs the **Release** workflow (`.github/workflows/release.yml`). release-please reads the commits since the last release and maintains an open **release PR** that bumps the version and updates `CHANGELOG.md`.
2. Merging that PR creates a GitHub release and a git tag (no leading `v`).
3. The same workflow then builds the plugin, attests build provenance, and uploads `main.js`, `manifest.json`, and `styles.css` to the release.

You never bump versions or create tags by hand — you just merge the release PR when you want to cut a release.

## What gets bumped

The version is derived from commit types since the last release:

| Commit                               | Bump  |
| ------------------------------------ | ----- |
| `fix:`                               | patch |
| `feat:`                              | minor |
| `feat!:` / `BREAKING CHANGE:` footer | major |

release-please writes the new version into `package.json` and `manifest.json` (via `extra-files`), and regenerates `CHANGELOG.md`. `chore:`, `docs:`, `refactor:`, `test:`, `build:`, and `ci:` commits don't trigger a release on their own but are still included in the changelog where applicable.

## Configuration

- `release-please-config.json` — release settings (`release-type: node`, `include-v-in-tag: false`, and the `manifest.json` version updater).
- `.release-please-manifest.json` — the last released version (release-please updates this).
- `.github/workflows/release.yml` — the workflow (release-please job + build/publish job).

## Manual control

- **Force a specific version**: add a `Release-As: 1.2.3` footer to a commit on `main` (or in the merge commit), and release-please will target that version next.
- **Hold a release**: simply don't merge the release PR — it keeps updating as new commits land.

## `versions.json` (manual)

`versions.json` maps each plugin version to its minimum Obsidian version. release-please's JSON updater can only change existing values, not add a new key per release, so this file is **maintained by hand**: update it when you raise `minAppVersion` in `manifest.json`.

## One-time repo setup

release-please opens its PR using the built-in `GITHUB_TOKEN`, which requires:

**Settings → Actions → General → Workflow permissions →** enable **"Allow GitHub Actions to create and approve pull requests"**.

Without this, the workflow runs but the release PR is never created.

## Publishing to the community catalog (first release only)

To list the plugin in Obsidian's community catalog, follow the [plugin submission guidelines](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin): open a PR against [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases) adding the plugin to `community-plugins.json`. This is a one-time step; subsequent releases are picked up automatically from GitHub releases.
