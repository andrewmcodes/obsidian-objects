import { Modal, Notice, Setting } from 'obsidian';
import { ObjectsContext } from '../types/context';
import { openPluginSettings } from '../utils/settings-ui';
import { PLUGIN_ID } from '../utils/constants';

/**
 * Lets the user pick an existing object type and generate its template file(s).
 * Used by the "Generate template" command.
 */
export class GenerateTemplateModal extends Modal {
  constructor(private ctx: ObjectsContext) {
    super(ctx.app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText('Generate template');

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
          .setButtonText('Generate')
          .setCta()
          .onClick(async () => {
            this.close();
            await this.generate(schema.id);
          }),
      );
    }
  }

  /** Generate the template file(s) for the chosen schema and report the result. */
  private async generate(schemaId: string): Promise<void> {
    const schema = this.ctx.schemas.byId(schemaId);
    if (!schema) return;
    try {
      const count = await this.ctx.templateFiles.generateFor(schema);
      new Notice(`Generated ${count} template file${count === 1 ? '' : 's'}.`);
    } catch (error) {
      console.error('Objects: failed to generate template files', error);
      new Notice('Failed to generate template files. See console for details.');
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
