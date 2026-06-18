import { App } from 'obsidian';
import { ObjectsSettings } from './settings';
import { ObjectService } from '../services/ObjectService';
import { SchemaService } from '../services/SchemaService';
import { BasesService } from '../services/BasesService';

// The slice of the plugin that UI (modals, settings tab) and commands depend
// on. Declared as an interface so those modules don't import the concrete
// plugin class (and to keep them easy to construct in isolation).
export interface ObjectsContext {
  app: App;
  settings: ObjectsSettings;
  objects: ObjectService;
  schemas: SchemaService;
  bases: BasesService;
  saveSettings(): Promise<void>;
  /** Re-register dynamic `Create <Schema>` commands after schema changes. */
  refreshCommands(): void;
}
