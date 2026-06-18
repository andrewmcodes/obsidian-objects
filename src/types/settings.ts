import { Schema } from './schema';

// Persisted plugin configuration. Stored via Obsidian's loadData()/saveData().
export interface ObjectsSettings {
  /** User-defined object schemas, in display order. */
  schemas: Schema[];
  /** Default parent folder used when a schema does not specify one. */
  defaultFolder: string;
  /** Folder where `Generate Bases` writes `.base` files. */
  basesFolder: string;
  /** Whether the created note is opened after creation. */
  openOnCreate: boolean;
  /** Bumped when default schemas have been seeded, so we only seed once. */
  hasSeededDefaults: boolean;
}
