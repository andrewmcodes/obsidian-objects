import { PropertyType, Schema } from './schema';

/**
 * A property added to the frontmatter of every new note, regardless of schema.
 * Seeded with `created_on`, but fully editable: rename, retype, restyle the
 * value, add more, or remove them entirely.
 */
export interface AutoProperty {
  /** Frontmatter key, e.g. `created_on`. */
  key: string;
  /** How the value serializes (e.g. `date` for `created_on`). */
  type: PropertyType;
  /** Value template; `{{date}}`, `{{time:FORMAT}}`, `{{title}}`, `{{type}}`, and `{{property}}` resolve at creation. */
  value: string;
}

// Persisted plugin configuration. Stored via Obsidian's loadData()/saveData().
export interface ObjectsSettings {
  /** User-defined object schemas, in display order. */
  schemas: Schema[];
  /** Default parent folder used when a schema does not specify one. */
  defaultFolder: string;
  /** Folder where `Generate Bases` writes `.base` files. */
  basesFolder: string;
  /** Properties added to every new note's frontmatter, after `type`. */
  autoProperties: AutoProperty[];
  /** Whether the created note is opened after creation. */
  openOnCreate: boolean;
  /**
   * When the Templater community plugin is installed, evaluate `<% … %>`
   * commands in a note's content right after it is created. Opt-in.
   */
  evaluateTemplater: boolean;
  /** Bumped when default schemas have been seeded, so we only seed once. */
  hasSeededDefaults: boolean;
}
