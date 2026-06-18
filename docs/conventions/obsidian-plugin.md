# Obsidian plugin conventions

Detailed Obsidian-specific guidance for this plugin. The high-level summary lives in [`AGENTS.md`](../../AGENTS.md); this file holds the long-form specs.

## Manifest rules (`manifest.json`)

- Must include: `id`, `name`, `version` (SemVer `x.y.z`), `minAppVersion`, `description`, `isDesktopOnly`. Optional: `author`, `authorUrl`, `fundingUrl`.
- `id` must match the plugin folder name for local dev. **Never change `id` after release** — treat it as a stable API.
- Keep `minAppVersion` accurate when using newer APIs.
- Canonical requirements: <https://github.com/obsidianmd/obsidian-releases/blob/master/.github/workflows/validate-plugin-entry.yml>

## Commands & settings

- Add user-facing commands via `this.addCommand(...)` with stable ids — don't rename ids once released.
- Provide a settings tab with sensible defaults and validation.
- Persist settings with `this.loadData()` / `this.saveData()`. No external storage.

## Versioning & releases

- Releases are automated with [release-please](https://github.com/googleapis/release-please) (`.github/workflows/release.yml`, `release-please-config.json`, `.release-please-manifest.json`).
- Conventional Commits on `main` drive a "release PR" that bumps `version` in `package.json` and `manifest.json` (SemVer) and updates `CHANGELOG.md`. Merging that PR creates the GitHub release and a tag with no leading `v`, then the workflow builds and attaches `main.js`, `manifest.json`, and `styles.css`.
- `versions.json` (plugin version → minimum app version) is **not** auto-updated — bump it manually when you raise `minAppVersion`.
- One-time repo setup: enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests** so release-please can open its PR.

## Security, privacy, and compliance

Follow Obsidian's Developer Policies and Plugin Guidelines:

- Default to local/offline operation. Only make network requests when essential.
- No hidden telemetry. Any optional analytics/third-party calls require explicit opt-in, documented in `README.md` and settings.
- Never execute remote code or auto-update plugin code outside normal releases.
- Minimize scope: read/write only what's necessary inside the vault. Never access files outside the vault.
- Respect privacy: don't collect vault contents, filenames, or personal info unless essential and consented.
- Register and clean up all DOM/app/interval listeners via the `register*` helpers so the plugin unloads safely.

## UX & copy guidelines

- Prefer sentence case for headings, buttons, and titles (enforced by `eslint-plugin-obsidianmd`).
- Use clear, action-oriented imperatives. Use **bold** for literal UI labels.
- Use arrow notation for navigation: **Settings → Community plugins**.
- Keep in-app strings short, consistent, and free of jargon.

## Performance

- Keep startup light; defer heavy work and avoid long tasks during `onload`.
- Batch disk access; avoid excessive vault scans.
- Debounce/throttle expensive operations triggered by file-system events.

## Mobile

- Avoid Node/Electron APIs unless `isDesktopOnly` is `true`.
- Be mindful of memory/storage; avoid large in-memory structures.
- Test on iOS/Android where feasible.

## Testing the plugin manually

Copy `main.js`, `manifest.json`, and `styles.css` (if any) to:

```
<Vault>/.obsidian/plugins/<plugin-id>/
```

Reload Obsidian and enable the plugin in **Settings → Community plugins**.

## Common code patterns

### Register listeners safely

```ts
this.registerEvent(this.app.workspace.on('file-open', (f) => {}));
this.registerDomEvent(activeWindow, 'resize', () => {});
this.registerInterval(window.setInterval(() => {}, 1000));
```

### Persist settings

```ts
this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<MySettings>);
await this.saveData(this.settings);
```

## Troubleshooting

- **Plugin doesn't load**: ensure `main.js` and `manifest.json` are at the top level of `<Vault>/.obsidian/plugins/<plugin-id>/`.
- **`main.js` missing**: run `mise run build` (or `mise run dev`).
- **Commands not appearing**: verify `addCommand` runs during `onload` and ids are unique.
- **Settings not persisting**: ensure `loadData`/`saveData` are awaited and the UI re-renders after changes.

## References

- Sample plugin: <https://github.com/obsidianmd/obsidian-sample-plugin>
- API docs: <https://docs.obsidian.md>
- Developer policies: <https://docs.obsidian.md/Developer+policies>
- Plugin guidelines: <https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines>
- Style guide: <https://help.obsidian.md/style-guide>
