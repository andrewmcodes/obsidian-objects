import { App, MarkdownView, Notice, TFile } from 'obsidian';
import { ObjectAction, Schema } from '../types/schema';
import { ObjectsContext } from '../types/context';
import { renderTemplate } from './TemplateService';
import { dateFormatter } from './ObjectService';
import { isoDate } from '../utils/date';
import { CreateObjectModal } from '../modals/CreateObjectModal';

/**
 * Runs custom per-schema actions against the active object note. Each action
 * type maps to a small, well-defined mutation; ambiguous behavior is avoided.
 */
export class ObjectActionService {
  constructor(
    private app: App,
    private ctx: ObjectsContext,
  ) {}

  /** The `type` frontmatter value of a file, or null. */
  private typeOf(file: TFile): string | null {
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    const type: unknown = fm?.type;
    return typeof type === 'string' ? type : null;
  }

  /** The active markdown file whose `type` matches `schemaId`, or null. */
  activeFileForSchema(schemaId: string): TFile | null {
    const file = this.app.workspace.getActiveViewOfType(MarkdownView)?.file ?? null;
    if (file && this.typeOf(file) === schemaId) return file;
    return null;
  }

  /** Execute an action against `file`. */
  async run(schema: Schema, action: ObjectAction, file: TFile): Promise<void> {
    try {
      switch (action.type) {
        case 'set-property':
          await this.setProperty(action, file);
          break;
        case 'append-template':
          await this.appendTemplate(action, file);
          break;
        case 'create-linked':
          this.createLinked(action, file);
          break;
      }
    } catch (error) {
      console.error('Objects: action failed', error);
      new Notice('Action failed. See console for details.');
    }
  }

  /** Set or update a single frontmatter property. */
  private async setProperty(action: ObjectAction, file: TFile): Promise<void> {
    if (!action.property) return;
    await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
      fm[action.property as string] = action.value ?? '';
    });
    new Notice(`Set ${action.property} to "${action.value ?? ''}".`);
  }

  /** Append a rendered template to the end of the note body. */
  private async appendTemplate(action: ObjectAction, file: TFile): Promise<void> {
    if (!action.template) return;
    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    const rendered = renderTemplate(action.template, {
      title: file.basename,
      date: isoDate(),
      type: this.typeOf(file) ?? '',
      properties: frontmatter ?? {},
      formatDate: dateFormatter(),
    });
    await this.app.vault.process(file, (data) => `${data.replace(/\s*$/, '')}\n\n${rendered}\n`);
    new Notice('Appended to note.');
  }

  /** Create a linked object of the target schema, backlinking the source. */
  private createLinked(action: ObjectAction, file: TFile): void {
    const target = action.targetSchema ? this.ctx.schemas.byId(action.targetSchema) : undefined;
    if (!target) {
      new Notice('Action target schema not found.');
      return;
    }
    new CreateObjectModal(this.ctx, target, {
      onCreated: async (created) => {
        // Append a link to the new object in the source note.
        await this.app.vault.process(file, (data) => `${data.replace(/\s*$/, '')}\n\n[[${created.basename}]]\n`);
      },
    }).open();
  }
}
