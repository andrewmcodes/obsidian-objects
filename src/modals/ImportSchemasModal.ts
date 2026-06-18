import { Modal, Notice, Setting } from 'obsidian';
import { ObjectsContext } from '../types/context';
import { parseSchemas } from '../services/SchemaIO';

/**
 * Modal that imports schemas from pasted JSON. Supports merging (add schemas
 * with new ids, skipping existing ones) or replacing all schemas.
 */
export class ImportSchemasModal extends Modal {
  private json = '';
  private replace = false;

  constructor(
    private ctx: ObjectsContext,
    private onImported: () => void | Promise<void>,
  ) {
    super(ctx.app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText('Import schemas');

    new Setting(contentEl)
      .setName('Schema JSON')
      .setDesc('Paste a schema bundle exported from another vault.')
      .addTextArea((area) => {
        area.setPlaceholder('{ "version": 1, "schemas": [ ... ] }').onChange((value) => (this.json = value));
        area.inputEl.rows = 10;
        area.inputEl.addClass('objects-fullwidth');
      });

    new Setting(contentEl)
      .setName('Replace existing schemas')
      .setDesc('When on, all current schemas are replaced. When off, only new ids are added.')
      .addToggle((toggle) => toggle.setValue(this.replace).onChange((value) => (this.replace = value)));

    new Setting(contentEl).addButton((button) =>
      button
        .setButtonText('Import')
        .setCta()
        .onClick(() => void this.import()),
    );
  }

  /** Validate and apply the pasted schemas. */
  private async import(): Promise<void> {
    const { schemas, errors } = parseSchemas(this.json);
    if (errors.length) {
      new Notice(`Import failed:\n${errors.join('\n')}`);
      return;
    }
    if (schemas.length === 0) {
      new Notice('No schemas found to import.');
      return;
    }

    if (this.replace) {
      this.ctx.settings.schemas = schemas;
    } else {
      const existing = new Set(this.ctx.schemas.all().map((s) => s.id));
      let added = 0;
      for (const schema of schemas) {
        if (!existing.has(schema.id)) {
          this.ctx.schemas.add(schema);
          added++;
        }
      }
      new Notice(`Imported ${added} new schema${added === 1 ? '' : 's'} (${schemas.length - added} skipped).`);
    }

    await this.ctx.saveSettings();
    this.ctx.refreshCommands();
    await this.onImported();
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
