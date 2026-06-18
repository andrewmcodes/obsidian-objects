import { Plugin } from 'obsidian';
import { ObjectsSettings } from './types/settings';
import { ObjectsContext } from './types/context';
import { DEFAULT_SETTINGS, defaultSchemas } from './utils/defaults';
import { ObjectService } from './services/ObjectService';
import { SchemaService } from './services/SchemaService';
import { BasesService } from './services/BasesService';
import { ObjectActionService } from './services/ObjectActionService';
import { ObjectsSettingTab } from './settings/ObjectsSettingTab';
import { registerSchemaCommands, registerStaticCommands } from './commands/ObjectCommands';
import { OBJECTS_DASHBOARD_VIEW, ObjectsDashboardView } from './views/ObjectsDashboardView';

/**
 * Obsidian Objects — schema-driven, object-based note-taking on top of native
 * Markdown, Properties, and Bases. `main.ts` is intentionally thin: it owns
 * lifecycle and wiring; all behavior lives in services, modals, and commands.
 */
export default class ObjectsPlugin extends Plugin implements ObjectsContext {
  settings!: ObjectsSettings;
  objects!: ObjectService;
  schemas!: SchemaService;
  bases!: BasesService;
  actions!: ObjectActionService;

  /** Ids of dynamic schema commands already registered this session. */
  private registeredCommands = new Set<string>();

  async onload(): Promise<void> {
    await this.loadSettings();

    this.schemas = new SchemaService(this.settings);
    this.objects = new ObjectService(this.app, this.settings);
    this.bases = new BasesService(this.app, this.settings);
    this.actions = new ObjectActionService(this.app, this);

    registerStaticCommands(this, this);
    this.refreshCommands();

    this.registerView(OBJECTS_DASHBOARD_VIEW, (leaf) => new ObjectsDashboardView(leaf, this));
    this.addRibbonIcon('boxes', 'Open objects dashboard', () => void this.activateDashboard());
    this.addCommand({
      id: 'open-objects-dashboard',
      name: 'Open dashboard',
      callback: () => void this.activateDashboard(),
    });

    this.addSettingTab(new ObjectsSettingTab(this, this));
  }

  /** Reveal the dashboard view in the right sidebar, creating it if needed. */
  private async activateDashboard(): Promise<void> {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(OBJECTS_DASHBOARD_VIEW);
    const leaf = existing[0] ?? workspace.getRightLeaf(false);
    if (!leaf) return;
    await leaf.setViewState({ type: OBJECTS_DASHBOARD_VIEW, active: true });
    await workspace.revealLeaf(leaf);
  }

  onunload(): void {
    // Commands, settings tab, and any registered events are cleaned up by
    // Obsidian automatically since they were added via plugin helpers.
  }

  /** Register dynamic `Create <Schema>` commands for any new schemas. */
  refreshCommands(): void {
    registerSchemaCommands(this, this, this.registeredCommands);
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<ObjectsSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);

    // Seed default schemas exactly once, on first run.
    if (!this.settings.hasSeededDefaults && this.settings.schemas.length === 0) {
      this.settings.schemas = defaultSchemas();
      this.settings.hasSeededDefaults = true;
      await this.saveData(this.settings);
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
