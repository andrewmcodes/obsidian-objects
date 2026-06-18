import { App, normalizePath, TFile, TFolder } from 'obsidian';
import { Schema } from '../types/schema';
import { ObjectsSettings } from '../types/settings';

// Generates native Obsidian Bases (`.base`) files that filter on the `type`
// property. The plugin deliberately does not implement custom Bases views —
// these are plain Base definitions Obsidian renders itself.

/** Build the YAML for a `.base` file that surfaces one schema's objects. */
export function buildBaseFile(schema: Schema): string {
  const order = ['file.name', ...schema.properties.map((prop) => prop.key)];
  const orderLines = (indent: string): string[] => order.map((field) => `${indent}- ${field}`);
  const lines = [
    'filters:',
    '  and:',
    `    - 'type == "${schema.id}"'`,
    'views:',
    // Native table view.
    '  - type: table',
    `    name: ${schema.label}`,
    '    order:',
    ...orderLines('      '),
    // Native card view (Capacities-style browsing) over the same fields.
    '  - type: cards',
    `    name: ${schema.label} cards`,
    '    order:',
    ...orderLines('      '),
    '',
  ];
  return lines.join('\n');
}

/** Pluralize a label for the base filename (simple English heuristic). */
export function pluralize(label: string): string {
  if (/[^aeiou]y$/i.test(label)) return label.replace(/y$/i, 'ies');
  if (/(s|x|z|ch|sh)$/i.test(label)) return `${label}es`;
  return `${label}s`;
}

export class BasesService {
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
   * Write one `.base` file per schema into the configured bases folder.
   * Existing base files are overwritten (they are generated artifacts).
   * Returns the number of base files written.
   */
  async generate(schemas: Schema[]): Promise<number> {
    const folder = this.settings.basesFolder?.trim() || 'Bases';
    await this.ensureFolder(folder);
    let count = 0;
    for (const schema of schemas) {
      const name = pluralize(schema.label);
      const path = normalizePath(`${folder}/${name}.base`);
      const content = buildBaseFile(schema);
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, content);
      } else {
        await this.app.vault.create(path, content);
      }
      count++;
    }
    return count;
  }
}
