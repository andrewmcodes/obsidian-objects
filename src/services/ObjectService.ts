import { App, normalizePath, TFile, TFolder } from 'obsidian';
import { Schema } from '../types/schema';
import { ObjectsSettings } from '../types/settings';
import { buildFrontmatter, FrontmatterEntry, PropertyValue } from './FrontmatterService';
import { renderTemplate } from './TemplateService';
import { nextAvailableName, notePath, resolveFileName } from '../utils/filename';
import { isoDate } from '../utils/date';

export type ObjectValues = Record<string, PropertyValue>;

/**
 * Build the full Markdown note content for an object. Pure: no Obsidian
 * dependency, so it can be unit-tested directly. `type` and `created_on` always
 * lead the frontmatter; user-defined properties follow in schema order.
 */
export function buildNoteContent(
  schema: Schema,
  title: string,
  values: ObjectValues,
  date: string = isoDate(),
  bodyTemplate?: string,
): string {
  const entries: FrontmatterEntry[] = [
    { key: 'type', type: 'text', value: schema.id },
    { key: 'created_on', type: 'date', value: date },
  ];
  for (const prop of schema.properties) {
    entries.push({ key: prop.key, type: prop.type, value: values[prop.key] });
  }
  const frontmatter = buildFrontmatter(entries);
  const body = renderTemplate(bodyTemplate ?? schema.bodyTemplate ?? '', {
    title,
    date,
    type: schema.id,
  }).trim();
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

  /** Resolve the (un-deduplicated) base note name for a schema + title. */
  baseName(schema: Schema, title: string): string {
    return resolveFileName(schema.filenameTemplate, {
      title,
      type: schema.id,
      date: isoDate(),
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
    const content = buildNoteContent(schema, title, values, undefined, bodyTemplate);
    const file = await this.app.vault.create(path, content);
    return { file, path };
  }
}
