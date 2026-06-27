import { App, normalizePath, TFile, TFolder } from 'obsidian';
import { Schema } from '../types/schema';
import { ObjectsSettings } from '../types/settings';
import { buildFrontmatter, FrontmatterEntry } from './FrontmatterService';
import { slugifyId } from './SchemaService';
import { notePath } from '../utils/filename';

// Generates reusable Obsidian template files (`.tmpl.md`) for object types. A
// template's frontmatter is `type: <id>` followed by every schema property key
// with an empty value, ready to fill in; the body is the schema's (or a
// variant's) body verbatim. Body `{{…}}` tokens are intentionally left raw so
// the file stays a reusable template. Pure content/naming logic lives in the
// exported helpers below (no Obsidian dependency) so they unit-test in Node.

/**
 * Build the Markdown content for a template file: `type` plus every schema
 * property as a bare `key:`, then the supplied `body` (defaults to the schema's
 * body template). The body is written verbatim — tokens are not rendered.
 */
export function buildTemplateContent(schema: Schema, body?: string): string {
  const entries: FrontmatterEntry[] = [{ key: 'type', type: 'text', value: schema.id }];
  for (const prop of schema.properties) {
    entries.push({ key: prop.key, type: prop.type, value: undefined });
  }
  const frontmatter = buildFrontmatter(entries);
  const trimmed = (body ?? schema.bodyTemplate ?? '').trim();
  return trimmed ? `${frontmatter}\n\n${trimmed}\n` : `${frontmatter}\n`;
}

const ID_TOKEN = /\{\{\s*id\s*\}\}/gi;

/**
 * Resolve a template filename (without the `.md` extension) from the naming
 * pattern. `{{id}}` is replaced with the schema id; for a variant, the
 * slugified variant name is appended after the id (e.g. `{{id}}.tmpl` →
 * `page-hub.tmpl`). Patterns missing `{{id}}` fall back to `{{id}}.tmpl` so
 * each type (and variant) maps to a distinct file rather than colliding.
 */
export function templateFileName(pattern: string, id: string, variantSlug?: string): string {
  // `search` with a fresh literal avoids the shared global regex's `lastIndex` state.
  const base = pattern.search(/\{\{\s*id\s*\}\}/i) !== -1 ? pattern : '{{id}}.tmpl';
  const idToken = variantSlug ? `${id}-${variantSlug}` : id;
  // `notePath` appends `.md`, so drop a trailing `.md` the user may have typed
  // (e.g. `{{id}}.tmpl.md`) to avoid a doubled `.md.md` extension.
  return base.replace(ID_TOKEN, idToken).trim().replace(/\.md$/i, '');
}

/** The template files (base + one per named variant) a schema produces. */
export function templateFilesFor(schema: Schema, pattern: string): { name: string; content: string }[] {
  const files = [{ name: templateFileName(pattern, schema.id), content: buildTemplateContent(schema) }];
  for (const variant of schema.templates ?? []) {
    const slug = slugifyId(variant.name, () => false);
    files.push({
      name: templateFileName(pattern, schema.id, slug),
      content: buildTemplateContent(schema, variant.body),
    });
  }
  return files;
}

/**
 * Writes generated template files into the configured templates folder. Owns
 * the vault mutations; the content/naming logic is the pure helpers above.
 */
export class TemplateFileService {
  constructor(
    private app: App,
    private settings: ObjectsSettings,
  ) {}

  private async ensureFolder(folderPath: string): Promise<void> {
    if (!folderPath) return;
    const normalized = normalizePath(folderPath);
    if (this.app.vault.getAbstractFileByPath(normalized) instanceof TFolder) return;
    await this.app.vault.createFolder(normalized).catch((error: unknown) => {
      if (!(this.app.vault.getAbstractFileByPath(normalized) instanceof TFolder)) throw error;
    });
  }

  /**
   * Generate the template file(s) for a single schema (base plus one per named
   * variant). Existing files are overwritten — they are generated artifacts.
   * No-ops (returning 0) when the "Create templates" setting is disabled.
   * Returns the number of files written.
   */
  async generateFor(schema: Schema): Promise<number> {
    if (!this.settings.createTemplates) return 0;
    const folder = this.settings.templatesFolder?.trim() || 'Templates';
    await this.ensureFolder(folder);
    let count = 0;
    for (const file of templateFilesFor(schema, this.settings.templateNaming)) {
      const path = normalizePath(notePath(folder, file.name));
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, file.content);
      } else {
        await this.app.vault.create(path, file.content);
      }
      count++;
    }
    return count;
  }

  /** Generate template files for every supplied schema; returns the total written. */
  async generate(schemas: Schema[]): Promise<number> {
    let count = 0;
    for (const schema of schemas) count += await this.generateFor(schema);
    return count;
  }
}
