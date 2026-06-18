import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { ObjectsContext } from '../types/context';
import { groupObjectsByType, ObjectRef } from '../services/DashboardModel';

export const OBJECTS_DASHBOARD_VIEW = 'objects-dashboard';

/**
 * A dedicated side-panel view listing all object notes grouped by type, with
 * clickable links. Browsing only — it reads the metadata cache and never
 * mutates the vault.
 */
export class ObjectsDashboardView extends ItemView {
  constructor(
    leaf: WorkspaceLeaf,
    private ctx: ObjectsContext,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return OBJECTS_DASHBOARD_VIEW;
  }

  getDisplayText(): string {
    return 'Objects';
  }

  getIcon(): string {
    return 'boxes';
  }

  async onOpen(): Promise<void> {
    this.render();
    // Keep the dashboard fresh as object notes are created or edited.
    this.registerEvent(this.app.metadataCache.on('resolved', () => this.render()));
  }

  /** Collect every markdown note that carries an object `type`. */
  private collectObjects(): ObjectRef[] {
    const refs: ObjectRef[] = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      const type: unknown = this.app.metadataCache.getFileCache(file)?.frontmatter?.type;
      if (typeof type === 'string' && type) {
        refs.push({ path: file.path, name: file.basename, type });
      }
    }
    return refs;
  }

  /** Render the grouped object list. */
  private render(): void {
    const container = this.contentEl;
    container.empty();
    container.addClass('objects-dashboard');
    container.createEl('h2', { text: 'Objects' });

    const groups = groupObjectsByType(this.collectObjects(), this.ctx.schemas.all());
    if (groups.length === 0) {
      container.createEl('p', { text: 'No objects yet. Create one from the command palette.' });
      return;
    }

    for (const group of groups) {
      container.createEl('h3', { text: `${group.label} (${group.items.length})` });
      const list = container.createEl('ul', { cls: 'objects-dashboard__list' });
      for (const item of group.items) {
        const li = list.createEl('li');
        const link = li.createEl('a', { text: item.name, cls: 'objects-dashboard__link' });
        link.addEventListener('click', (evt) => {
          evt.preventDefault();
          void this.openObject(item.path);
        });
      }
    }
  }

  private async openObject(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) await this.app.workspace.getLeaf(false).openFile(file);
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }
}
