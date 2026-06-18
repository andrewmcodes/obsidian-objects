# Obsidian Objects

Schema-driven, object-based note-taking for [Obsidian](https://obsidian.md),
built entirely on native Markdown, Properties, and Bases.

Define object schemas (Person, Project, Book, Meeting, …), create structured
object notes through a modal, and browse them with native Bases. Everything is
stored in plain Markdown with Properties — if you disable or uninstall the
plugin, all your data remains fully accessible.

## Features

- **Schema-driven objects** — each object type defines its folder, filename
  template, properties, and body template.
- **Creation modal** — pick a type, fill in the fields, and get a note with
  valid Properties and a populated template.
- **Dynamic commands** — every schema gets a `Create <Schema>` command, plus a
  generic **Create object** picker.
- **Promote selection** — turn selected text into an object and replace it with
  a `[[wikilink]]`.
- **Native Bases** — the **Generate Bases** command writes `.base` files that
  filter on the `type` property. No custom views, just native Bases.
- **Local-first** — no external services, no proprietary storage. Required
  `type` and `created_on` properties are added automatically.

## Property types

`text`, `textarea`, `number`, `date`, `checkbox`, `select`, `multiselect`.

## Getting started

1. Install and enable the plugin in **Settings → Community plugins**.
2. On first run, default schemas (Person, Project, Meeting, Book, Article, Idea)
   are created. Manage them in the **Objects** settings tab.
3. Run **Create object** (or a `Create <Schema>` command) from the command
   palette.

## Commands

- **Create object** — open the object type picker, then the creation modal.
- **Create _&lt;Schema&gt;_** — create an object of a specific type directly.
- **Promote selection to object** — convert selected text into a new object.
- **Generate Bases** — write a `.base` file per schema into the Bases folder.
- **Open settings** — open the Objects settings tab.

## Settings

The **Objects** settings tab lets you:

- Configure the default folder, Bases folder, and whether notes open on create.
- Add, edit, delete, and reorder schemas.
- Edit each schema's id, label, folder, filename template, body template, and
  properties (including options for `select`/`multiselect`).

## Data model

Every object note is a standard Markdown file. Required Properties are always
present:

```markdown
---
type: project
created_on: 2026-06-17
status: active
---

# Vite Migration

## Notes
```

The `type` property is the single source of truth for classification — the
plugin never infers type from folders, tags, or file location.

## Development

This project uses [`mise`](https://mise.jdx.dev/) for tasks and **pnpm via
Corepack** for dependencies.

```bash
mise run install   # install dependencies (corepack pnpm install)
mise run dev       # esbuild watch build
mise run build     # type-check + production bundle
mise run check     # lint + format-check + build + test
mise run hooks     # install the commit-msg git hook
```

See [`AGENTS.md`](AGENTS.md) and [`docs/conventions/`](docs/conventions/) for
the full contributor guide and conventions.

## License

[0-BSD](LICENSE)
