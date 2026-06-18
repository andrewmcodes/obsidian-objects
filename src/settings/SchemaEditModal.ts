import { Modal, Notice, Setting } from 'obsidian';
import { PROPERTY_TYPES, PropertyDefinition, PropertyType, Schema } from '../types/schema';
import { ObjectsContext } from '../types/context';
import { slugifyId, validateSchema } from '../services/SchemaService';

/** Deep-clone a schema so edits can be cancelled without side effects. */
function cloneSchema(schema: Schema): Schema {
  return {
    ...schema,
    properties: schema.properties.map((prop) => ({ ...prop, options: prop.options ? [...prop.options] : undefined })),
    templates: schema.templates?.map((template) => ({ ...template })),
  };
}

/** Create an empty schema scaffold for the "add schema" flow. */
function blankSchema(): Schema {
  return {
    id: '',
    label: '',
    folder: '',
    filenameTemplate: '{{title}}',
    properties: [],
    bodyTemplate: '# {{title}}\n\n## Notes\n',
  };
}

/**
 * Modal for creating or editing a single schema, including its properties.
 * Works on a draft copy and only commits via `onSave` after validation.
 */
export class SchemaEditModal extends Modal {
  private draft: Schema;
  private readonly isNew: boolean;

  constructor(
    private ctx: ObjectsContext,
    schema: Schema | null,
    private onSave: () => void | Promise<void>,
  ) {
    super(ctx.app);
    this.isNew = schema === null;
    this.draft = schema ? cloneSchema(schema) : blankSchema();
  }

  onOpen(): void {
    this.titleEl.setText(this.isNew ? 'Add schema' : `Edit ${this.draft.label || 'schema'}`);
    this.render();
  }

  /** Re-render the whole modal (simplest way to reflect property changes). */
  private render(): void {
    const { contentEl } = this;
    contentEl.empty();

    new Setting(contentEl)
      .setName('Label')
      .setDesc('Display name, e.g. Project.')
      .addText((text) =>
        text.setValue(this.draft.label).onChange((value) => {
          this.draft.label = value;
          // Auto-derive the id from the label for new schemas only.
          if (this.isNew) {
            this.draft.id = slugifyId(value, (id) => this.ctx.schemas.byId(id) !== undefined);
          }
        }),
      );

    new Setting(contentEl)
      .setName('Type ID')
      .setDesc('Written to the `type` property. Stable identifier.')
      .addText((text) => {
        text.setValue(this.draft.id).onChange((value) => (this.draft.id = value.trim()));
        if (!this.isNew) text.setDisabled(true);
      });

    new Setting(contentEl)
      .setName('Folder')
      .setDesc('Where notes are created. Falls back to the default folder if empty.')
      .addText((text) =>
        text
          .setPlaceholder(this.ctx.settings.defaultFolder)
          .setValue(this.draft.folder)
          .onChange((value) => (this.draft.folder = value.trim())),
      );

    new Setting(contentEl)
      .setName('Filename template')
      .setDesc('Supports {{title}}, {{date}}, {{type}}.')
      .addText((text) =>
        text.setValue(this.draft.filenameTemplate).onChange((value) => (this.draft.filenameTemplate = value)),
      );

    new Setting(contentEl)
      .setName('Body template')
      .setDesc('Markdown body. Supports {{title}}, {{date}}, {{type}}.')
      .addTextArea((area) => {
        area.setValue(this.draft.bodyTemplate).onChange((value) => (this.draft.bodyTemplate = value));
        area.inputEl.rows = 5;
      });

    contentEl.createEl('h3', { text: 'Properties' });
    this.draft.properties.forEach((prop, index) => this.renderProperty(contentEl, prop, index));

    new Setting(contentEl).addButton((button) =>
      button.setButtonText('Add property').onClick(() => {
        this.draft.properties.push({ key: '', label: '', type: 'text' });
        this.render();
      }),
    );

    contentEl.createEl('h3', { text: 'Additional templates' });
    contentEl.createEl('p', {
      text: 'Optional named body templates the user can pick when creating an object.',
      cls: 'setting-item-description',
    });
    const templates = (this.draft.templates ??= []);
    templates.forEach((template, index) => {
      new Setting(contentEl)
        .addText((text) =>
          text
            .setPlaceholder('Template name')
            .setValue(template.name)
            .onChange((value) => (template.name = value)),
        )
        .addTextArea((area) => {
          area
            .setPlaceholder('Body')
            .setValue(template.body)
            .onChange((value) => (template.body = value));
          area.inputEl.rows = 4;
        })
        .addExtraButton((button) =>
          button
            .setIcon('trash')
            .setTooltip('Remove template')
            .onClick(() => {
              templates.splice(index, 1);
              this.render();
            }),
        );
    });
    new Setting(contentEl).addButton((button) =>
      button.setButtonText('Add template').onClick(() => {
        templates.push({ name: '', body: '' });
        this.render();
      }),
    );

    new Setting(contentEl)
      .addButton((button) =>
        button
          .setButtonText('Save')
          .setCta()
          .onClick(() => void this.save()),
      )
      .addButton((button) => button.setButtonText('Cancel').onClick(() => this.close()));
  }

  /** Render the editor row(s) for one property definition. */
  private renderProperty(container: HTMLElement, prop: PropertyDefinition, index: number): void {
    const setting = new Setting(container)
      .setClass('objects-property-row')
      .addText((text) =>
        text
          .setPlaceholder('Key')
          .setValue(prop.key)
          .onChange((v) => (prop.key = v.trim())),
      )
      .addText((text) =>
        text
          .setPlaceholder('Label')
          .setValue(prop.label ?? '')
          .onChange((v) => (prop.label = v)),
      )
      .addDropdown((drop) => {
        for (const type of PROPERTY_TYPES) drop.addOption(type, type);
        drop.setValue(prop.type).onChange((value) => {
          prop.type = value as PropertyType;
          this.render();
        });
      })
      .addToggle((toggle) =>
        toggle
          .setTooltip('Required')
          .setValue(prop.required === true)
          .onChange((value) => (prop.required = value)),
      )
      .addExtraButton((button) =>
        button
          .setIcon('trash')
          .setTooltip('Remove property')
          .onClick(() => {
            this.draft.properties.splice(index, 1);
            this.render();
          }),
      );

    // Options field only applies to select / multiselect.
    if (prop.type === 'select' || prop.type === 'multiselect') {
      new Setting(container)
        .setName('Options')
        .setDesc('Comma-separated.')
        .addText((text) =>
          text
            .setPlaceholder('First, second, third')
            .setValue((prop.options ?? []).join(', '))
            .onChange((value) => {
              prop.options = value
                .split(',')
                .map((item) => item.trim())
                .filter((item) => item !== '');
            }),
        );
    }
    setting.settingEl.addClass('objects-property-setting');
  }

  /** Validate and persist the draft via `onSave`. */
  private async save(): Promise<void> {
    this.draft.label = this.draft.label.trim();
    // Drop incomplete named templates; omit the field entirely if none remain.
    if (this.draft.templates) {
      this.draft.templates = this.draft.templates.filter((t) => t.name.trim() !== '' && t.body.trim() !== '');
      if (this.draft.templates.length === 0) delete this.draft.templates;
    }
    if (this.isNew && !this.draft.id) {
      this.draft.id = slugifyId(this.draft.label, (id) => this.ctx.schemas.byId(id) !== undefined);
    }
    const otherIds = this.ctx.schemas
      .all()
      .filter((schema) => this.isNew || schema.id !== this.draft.id)
      .map((schema) => schema.id);
    const errors = validateSchema(this.draft, otherIds);
    if (errors.length) {
      new Notice(errors.join('\n'));
      return;
    }

    if (this.isNew) this.ctx.schemas.add(this.draft);
    else this.ctx.schemas.update(this.draft.id, this.draft);
    await this.ctx.saveSettings();
    this.ctx.refreshCommands();
    await this.onSave();
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
