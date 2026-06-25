import { App, moment, normalizePath, TFile, TFolder } from 'obsidian';
import { Schema } from '../types/schema';
import { ObjectsSettings } from '../types/settings';
import { buildFrontmatter, FrontmatterEntry, PropertyValue } from './FrontmatterService';
import { renderTemplate } from './TemplateService';
import { nextAvailableName, notePath, resolveFileName } from '../utils/filename';
import { runTemplater } from './TemplaterService';
import { AutoProperty } from '../types/settings';
import { DEFAULT_AUTO_PROPERTIES } from '../utils/defaults';
import { isoDate } from '../utils/date';

export type ObjectValues = Record<string, PropertyValue>;

/**
 * A `{{date:FORMAT}}`/`{{time:FORMAT}}` formatter pinned to a single "now".
 * Obsidian's `moment` is callable at runtime, but its type only exposes the
 * (non-callable) module namespace, so it is treated as callable here.
 */
export function dateFormatter(): (format: string) => string {
  const callable = moment as unknown as (input?: string) => { format: (format: string) => string };
  const now = callable();
  return (format: string) => now.format(format);
}

/**
 * Build the full Markdown note content for an object. `type` always leads the
 * frontmatter, followed by the configured auto-properties (default
 * `created_on`) and then the schema's properties in order. Pass `formatDate` to
 * resolve `{{date:FORMAT}}`/`{{time:FORMAT}}` tokens in templates and
 * auto-property values.
 */
export function buildNoteContent(
  schema: Schema,
  title: string,
  values: ObjectValues,
  date: string = isoDate(),
  bodyTemplate?: string,
  formatDate?: (format: string) => string,
  autoProperties: AutoProperty[] = DEFAULT_AUTO_PROPERTIES,
): string {
  const vars = { title, date, type: schema.id, properties: values, formatDate };
  const entries: FrontmatterEntry[] = [{ key: 'type', type: 'text', value: schema.id }];
  // Auto-properties go after `type`; skip `type` and any key a schema property
  // already owns so the note never has duplicate frontmatter keys.
  const schemaKeys = new Set(schema.properties.map((prop) => prop.key));
  for (const auto of autoProperties) {
    if (!auto.key || auto.key === 'type' || schemaKeys.has(auto.key)) continue;
    entries.push({ key: auto.key, type: auto.type, value: renderTemplate(auto.value, vars) });
  }
  for (const prop of schema.properties) {
    entries.push({ key: prop.key, type: prop.type, value: values[prop.key] });
  }
  const frontmatter = buildFrontmatter(entries);
  const body = renderTemplate(bodyTemplate ?? schema.bodyTemplate ?? '', vars).trim();
  return body ? `${frontmatter}\n\n${body}\n` : `${frontmatter}\n`;
}

export interface CreateResult {
  file: TFile;
  path: string;
}

/**
 * Wraps vault mutations (folder + file creation) needed to materialize an
 * object note. Conflict *decisions* are made by the UI; this service exposes
 * the primitives those decisions need.
 */
export class ObjectService {
  constructor(
    private app: App,
    private settings: ObjectsSettings,
  ) {}

  /** Effective folder for a schema, falling back to the default folder. */
  folderFor(schema: Schema): string {
    const folder = schema.folder?.trim() || this.settings.defaultFolder?.trim() || '';
    return folder;
  }

  /**
   * Resolve the (un-deduplicated) base note name for a schema + title. Property
   * values are supplied so filename templates can reference them (e.g.
   * `{{author}}`) alongside `{{date:FORMAT}}` tokens.
   */
  baseName(schema: Schema, title: string, values: ObjectValues = {}): string {
    return resolveFileName(schema.filenameTemplate, {
      title,
      type: schema.id,
      date: isoDate(),
      properties: values,
      formatDate: dateFormatter(),
    });
  }

  /** Whether a `.md` note already exists at folder/name. */
  exists(folder: string, name: string): boolean {
    const path = normalizePath(notePath(folder, name));
    return this.app.vault.getAbstractFileByPath(path) instanceof TFile;
  }

  /** Existing file at folder/name, or null. */
  fileAt(folder: string, name: string): TFile | null {
    const path = normalizePath(notePath(folder, name));
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }

  /** Next free name following Obsidian's `Name 2`, `Name 3` convention. */
  uniqueName(folder: string, base: string): string {
    return nextAvailableName(base, (name) => this.exists(folder, name));
  }

  /** Create any missing folders along `folderPath`. */
  private async ensureFolder(folderPath: string): Promise<void> {
    if (!folderPath) return;
    const normalized = normalizePath(folderPath);
    const existing = this.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof TFolder) return;
    await this.app.vault.createFolder(normalized).catch((error: unknown) => {
      // A racing create may have already made it; ignore only that case.
      if (!(this.app.vault.getAbstractFileByPath(normalized) instanceof TFolder)) {
        throw error;
      }
    });
  }

  /** Create the note file, creating folders as needed. */
  async create(
    schema: Schema,
    name: string,
    values: ObjectValues,
    title: string,
    bodyTemplate?: string,
  ): Promise<CreateResult> {
    const folder = this.folderFor(schema);
    await this.ensureFolder(folder);
    const path = normalizePath(notePath(folder, name));
    const content = buildNoteContent(
      schema,
      title,
      values,
      undefined,
      bodyTemplate,
      dateFormatter(),
      this.settings.autoProperties,
    );
    const file = await this.app.vault.create(path, content);
    // After our own {{…}} tokens are written, optionally let Templater evaluate
    // any <% … %> commands in the new note.
    if (this.settings.evaluateTemplater) await runTemplater(this.app, file);
    return { file, path };
  }
}
