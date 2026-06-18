import { Modal, Notice, Setting, TFile } from 'obsidian';
import { ObjectsContext } from '../types/context';
import { CreateObjectModal } from './CreateObjectModal';
import { openPluginSettings } from '../utils/settings-ui';
import { PLUGIN_ID } from '../utils/constants';

/**
 * Lets the user pick which object type (schema) to create, then hands off to
 * {@link CreateObjectModal}. Used by the generic "Create object" command.
 */
export class ObjectTypeModal extends Modal {
  constructor(
    private ctx: ObjectsContext,
    private options: { initialTitle?: string; onCreated?: (file: TFile) => void | Promise<void> } = {},
  ) {
    super(ctx.app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText('Create object');

    const schemas = this.ctx.schemas.all();
    if (schemas.length === 0) {
      contentEl.createEl('p', {
        text: 'No object schemas defined yet. Add one in the settings tab.',
      });
      new Setting(contentEl).addButton((button) =>
        button
          .setButtonText('Open settings')
          .setCta()
          .onClick(() => {
            this.close();
            openPluginSettings(this.app, PLUGIN_ID);
          }),
      );
      return;
    }

    contentEl.createEl('p', { text: 'Choose an object type:' });
    for (const schema of schemas) {
      new Setting(contentEl).setName(schema.label).addButton((button) =>
        button
          .setButtonText('Create')
          .setCta()
          .onClick(() => {
            this.close();
            new CreateObjectModal(this.ctx, schema, this.options).open();
          }),
      );
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/** Open the create-object flow for a specific schema id, or the type picker. */
export function openCreateFlow(
  ctx: ObjectsContext,
  schemaId: string | null,
  options: { initialTitle?: string; onCreated?: (file: TFile) => void | Promise<void> } = {},
): void {
  if (schemaId) {
    const schema = ctx.schemas.byId(schemaId);
    if (!schema) {
      new Notice(`Unknown object type: ${schemaId}`);
      return;
    }
    new CreateObjectModal(ctx, schema, options).open();
    return;
  }
  new ObjectTypeModal(ctx, options).open();
}
