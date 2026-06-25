# Obsidian Objects

<p align="center">
  <img src="assets/social-image.png" alt="Obsidian Objects" width="100%">
</p>

<p align="center">
  <a href="https://github.com/andrewmcodes/obsidian-objects/actions/workflows/lint.yml"><img src="https://github.com/andrewmcodes/obsidian-objects/actions/workflows/lint.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/andrewmcodes/obsidian-objects/releases/latest"><img src="https://img.shields.io/github/v/release/andrewmcodes/obsidian-objects?sort=semver&display_name=tag" alt="Latest release"></a>
  <img src="https://img.shields.io/badge/minAppVersion-1.13.0-7c3aed" alt="Minimum Obsidian version 1.13.0">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
</p>

Schema-driven, object-based note-taking for [Obsidian](https://obsidian.md), built on native Markdown, Properties, and Bases.

Define object types like Person, Project, or Meeting, create structured notes through a modal, and browse them with native Bases. Everything lives in plain Markdown with Properties, so your notes stay fully readable even if you disable or uninstall the plugin.

📖 **[Documentation site →](https://andrewmcodes.github.io/obsidian-objects/)**

## Features

- **Schema-driven objects:** each type defines its folder, filename template, properties, body templates, and validation rules.
- **Creation modal:** pick a type, fill in the fields (with autocomplete and validation), choose a template, and get a note with valid Properties.
- **Dynamic commands:** every schema gets its own `Create <Schema>` command, plus a generic **Create object** picker.
- **Promote selection:** turn highlighted text into an object and replace it with a `[[wikilink]]`.
- **Native Bases:** the **Generate Bases** command writes `.base` files with table and card views that filter on the `type` property. Obsidian renders them, so there's no custom view code.
- **Dashboard:** a sidebar view lists every object grouped by type for quick browsing.
- **Local-first:** no external services and no proprietary storage. The required `type` and `created_on` properties are filled in for you.

## Property types

`text`, `textarea`, `number`, `date`, `datetime`, `checkbox`, `select`, `multiselect`, `link`, `multilink` (wikilink relationships), `email`, `url`.

## Beyond the basics

- **Relationships:** `link` and `multilink` properties store `[[wikilinks]]`, and the note autocomplete can be scoped to one object type (so a meeting's attendees only suggest people).
- **Template tokens:** filename and body templates support `{{title}}`, `{{type}}`, `{{date}}`, moment-formatted `{{date:FORMAT}}` / `{{time:FORMAT}}` (e.g. `{{date:YYYYMMDD}}`, ISO week `{{date:YYYY-[W]WW}}`), and `{{property}}` values such as `{{author}}`. With the Templater plugin installed, an opt-in setting also evaluates `<% … %>` commands in new notes.
- **Multiple templates:** a schema can define several named body templates to pick from when you create an object.
- **Variants:** a schema can define named presets that override property defaults (and optionally the body), chosen from a dropdown when you create an object.
- **Default values:** any property can carry a default that pre-fills the creation modal (and can be overridden there).
- **Validation rules:** properties support regex patterns, number min/max, and email/URL format checks, enforced as you create.
- **Object actions:** a schema can attach custom commands to its notes, such as setting a property, appending a template section, or creating a linked object.
- **Schema sharing:** export your schemas to JSON and import them into another vault.

## Getting started

1. Install and enable the plugin in **Settings → Community plugins**.
2. On first run, default schemas (Person, Project, Meeting, Book, Article, Idea) are created. Manage them in the **Objects** settings tab.
3. Run **Create object** (or a `Create <Schema>` command) from the command palette.

## Commands

- **Create object:** open the object type picker, then the creation modal.
- **Create _&lt;Schema&gt;_:** create an object of a specific type directly.
- **Promote selection to object:** convert selected text into a new object.
- **Generate Bases:** write a `.base` file per schema (table + card views).
- **Open dashboard:** open the objects dashboard in the sidebar.
- **Export schemas to clipboard** / **Import schemas:** share schemas as JSON.
- **Open settings:** open the Objects settings tab.

## Settings

The **Objects** settings tab lets you:

- Configure the default folder, Bases folder, and whether notes open on create.
- Edit the automatic properties added to every new note (seeded with `created_on: {{date}}`) — change them, add your own, or remove them.
- Add, edit, delete, and reorder schemas.
- Edit each schema's id, label, folder, filename template, body template, and properties (including options for `select`/`multiselect`).

## Data model

Every object note is a standard Markdown file. The `type` Property is always present, followed by the automatic properties (`created_on` by default, configurable in settings) and then the schema's own properties:

```markdown
---
type: project
created_on: 2026-06-17
status: active
---

# Vite Migration

## Notes
```

The `type` property is the single source of truth for classification. The plugin never infers type from folders, tags, or file location.

## Development

This project uses [`mise`](https://mise.jdx.dev/) for tasks and **pnpm via Corepack** for dependencies.

```bash
mise run install   # install dependencies (corepack pnpm install)
mise run dev       # esbuild watch build
mise run build     # type-check + production bundle
mise run check     # lint + format-check + build + test
mise run hooks     # install the commit-msg git hook
```

Requires **Obsidian 1.13+**. To install into a local vault, copy `main.js`, `manifest.json`, and `styles.css` into `<Vault>/.obsidian/plugins/obsidian-objects/`. The convenience task below builds and copies them for you (quote the path; a leading `~` is expanded):

```bash
OBSIDIAN_VAULT="~/git/andrewmcodes/digital-brain" mise run install-plugin
```

Then, in Obsidian, enable **Settings → Community plugins** (turn off Restricted mode if asked), reload the app, and turn on **Objects** under **Installed plugins**. A manually-installed plugin shows up there, not in the **Browse** catalog, which only lists submitted community plugins.

### Testing locally

- **Unit tests** (pure logic) run with [Vitest](https://vitest.dev/):

  ```bash
  mise run test          # one-off
  pnpm test:watch        # watch mode
  ```

- **Manual testing** in a real vault. The UI (modals, dashboard, commands, generated Bases) gets exercised by hand in Obsidian. For a live loop, install the [Hot Reload](https://github.com/pjeby/hot-reload) plugin and point the build at your vault so it rebuilds and reloads on every save:

  ```bash
  OBSIDIAN_VAULT="/path/to/your/vault" mise run dev
  ```

  Otherwise run `mise run install-plugin` and reload Obsidian after each build.

For an overview, see the [documentation site](https://andrewmcodes.github.io/obsidian-objects/). For the full contributor guide and conventions, see [`AGENTS.md`](AGENTS.md) and [`docs/conventions/CONVENTIONS.md`](docs/conventions/CONVENTIONS.md).

## License

[MIT](LICENSE)
