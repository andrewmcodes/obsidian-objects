import { Modal, Notice, Setting, TFile } from 'obsidian';
import { Schema } from '../types/schema';
import { ObjectsContext } from '../types/context';
import { propertyLabel } from '../services/SchemaService';
import { ObjectValues } from '../services/ObjectService';
import { PropertyValue } from '../services/FrontmatterService';
import { templateChoices } from '../services/TemplateService';
import { validateObjectValues } from '../services/ObjectValidation';
import { NoteSuggest } from '../suggest/NoteSuggest';
import { ConflictModal } from './ConflictModal';

/**
 * Modal that collects a title and the schema's property values, then creates
 * the object note (handling naming conflicts and optionally opening the note).
 */
export class CreateObjectModal extends Modal {
  private title = '';
  private values: ObjectValues = {};
  private submitting = false;
  /** Body template chosen in the template picker (when a schema has several). */
  private bodyTemplate: string;

  constructor(
    private ctx: ObjectsContext,
    private schema: Schema,
    private options: { initialTitle?: string; onCreated?: (file: TFile) => void | Promise<void> } = {},
  ) {
    super(ctx.app);
    this.title = options.initialTitle?.trim() ?? '';
    // Default to the schema's primary body template.
    this.bodyTemplate = schema.bodyTemplate ?? '';
    // Seed defaults from the schema so unspecified values still serialize.
    for (const prop of schema.properties) {
      if (prop.default !== undefined) this.values[prop.key] = prop.default;
    }
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText(`Create ${this.schema.label}`);

    new Setting(contentEl)
      .setName('Title')
      .setDesc('Used for the note name and the {{title}} template variable.')
      .addText((text) => {
        text.setPlaceholder('Title').setValue(this.title);
        text.onChange((value) => (this.title = value));
        text.inputEl.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void this.submit();
          }
        });
        window.setTimeout(() => text.inputEl.focus(), 0);
      });

    for (const prop of this.schema.properties) {
      this.renderProperty(contentEl, prop);
    }

    const choices = templateChoices(this.schema);
    if (choices.length > 1) {
      new Setting(contentEl)
        .setName('Template')
        .setDesc('Body template for the new note.')
        .addDropdown((drop) => {
          choices.forEach((choice, index) => {
            drop.addOption(String(index), choice.name);
          });
          drop.setValue('0');
          drop.onChange((value) => {
            const choice = choices[Number(value)];
            if (choice) this.bodyTemplate = choice.body;
          });
        });
    }

    new Setting(contentEl).addButton((button) =>
      button
        .setButtonText('Create')
        .setCta()
        .onClick(() => void this.submit()),
    );
  }

  /** Render a single property input, wired to update `this.values`. */
  private renderProperty(container: HTMLElement, prop: Schema['properties'][number]): void {
    const setting = new Setting(container).setName(propertyLabel(prop));
    const set = (value: PropertyValue): void => {
      this.values[prop.key] = value;
    };

    switch (prop.type) {
      case 'textarea':
        setting.addTextArea((c) => c.setValue(String(this.values[prop.key] ?? '')).onChange((v) => set(v)));
        break;
      case 'number':
        setting.addText((c) => {
          c.inputEl.type = 'number';
          c.setValue(this.values[prop.key] != null ? String(this.values[prop.key]) : '');
          c.onChange((v) => set(v === '' ? '' : Number(v)));
        });
        break;
      case 'date':
        setting.addText((c) => {
          c.inputEl.type = 'date';
          c.setValue(String(this.values[prop.key] ?? '')).onChange((v) => set(v));
        });
        break;
      case 'checkbox':
        setting.addToggle((c) => c.setValue(this.values[prop.key] === true).onChange((v) => set(v)));
        break;
      case 'select':
        setting.addDropdown((c) => {
          c.addOption('', '—');
          for (const option of prop.options ?? []) c.addOption(option, option);
          c.setValue(String(this.values[prop.key] ?? ''));
          c.onChange((v) => set(v));
        });
        break;
      case 'multiselect':
        this.renderMultiselect(setting, prop);
        break;
      case 'email':
        setting.addText((c) => {
          c.inputEl.type = 'email';
          c.setValue(String(this.values[prop.key] ?? '')).onChange((v) => set(v));
        });
        break;
      case 'url':
        setting.addText((c) => {
          c.inputEl.type = 'url';
          c.setValue(String(this.values[prop.key] ?? '')).onChange((v) => set(v));
        });
        break;
      case 'link':
        setting.setDesc('Note name or [[wikilink]].');
        setting.addText((c) => {
          new NoteSuggest(this.app, c.inputEl, false, prop.linkType);
          c.setValue(String(this.values[prop.key] ?? '')).onChange((v) => set(v));
        });
        break;
      case 'multilink':
        setting.setDesc('Comma-separated note names or [[wikilinks]].');
        setting.addText((c) => {
          new NoteSuggest(this.app, c.inputEl, true, prop.linkType);
          c.setValue(
            Array.isArray(this.values[prop.key]) ? (this.values[prop.key] as string[]).join(', ') : '',
          ).onChange((v) => set(v.split(',').map((item) => item.trim())));
        });
        break;
      case 'text':
      default:
        setting.addText((c) => c.setValue(String(this.values[prop.key] ?? '')).onChange((v) => set(v)));
        break;
    }
  }

  /**
   * Render multiselect as a row of toggles, one per option. With no options it
   * is a free-form list (e.g. tags, aliases), entered as comma-separated text.
   */
  private renderMultiselect(setting: Setting, prop: Schema['properties'][number]): void {
    if (!prop.options || prop.options.length === 0) {
      setting.setDesc('Comma-separated values.');
      setting.addText((c) => {
        c.setValue(Array.isArray(this.values[prop.key]) ? (this.values[prop.key] as string[]).join(', ') : '');
        c.onChange(
          (v) =>
            (this.values[prop.key] = v
              .split(',')
              .map((item) => item.trim())
              .filter((item) => item !== '')),
        );
      });
      return;
    }
    const selected = new Set<string>(Array.isArray(this.values[prop.key]) ? (this.values[prop.key] as string[]) : []);
    setting.setDesc('Select all that apply.');
    const wrapper = setting.controlEl.createDiv({ cls: 'objects-multiselect' });
    for (const option of prop.options ?? []) {
      const label = wrapper.createEl('label', { cls: 'objects-multiselect__item' });
      const checkbox = label.createEl('input', { type: 'checkbox' });
      checkbox.checked = selected.has(option);
      label.appendText(` ${option}`);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selected.add(option);
        else selected.delete(option);
        this.values[prop.key] = Array.from(selected);
      });
    }
    this.values[prop.key] = Array.from(selected);
  }

  /** Validate required fields, then create (handling conflicts). */
  private async submit(): Promise<void> {
    if (this.submitting) return;
    const title = this.title.trim();
    if (!title) {
      new Notice('A title is required.');
      return;
    }
    const errors = validateObjectValues(this.schema, this.values);
    if (errors.length) {
      new Notice(errors.join('\n'));
      return;
    }

    this.submitting = true;
    try {
      const folder = this.ctx.objects.folderFor(this.schema);
      const base = this.ctx.objects.baseName(this.schema, title);
      if (this.ctx.objects.exists(folder, base)) {
        this.handleConflict(folder, base, title);
        this.submitting = false;
        return;
      }
      await this.finishCreate(base, title);
    } catch (error) {
      console.error('Objects: failed to create note', error);
      new Notice('Failed to create object. See console for details.');
      this.submitting = false;
    }
  }

  /** Resolve an existing-name conflict via {@link ConflictModal}. */
  private handleConflict(folder: string, base: string, title: string): void {
    new ConflictModal(this.app, base, (choice) => {
      if (choice === 'open') {
        const existing = this.ctx.objects.fileAt(folder, base);
        if (existing) void this.openFile(existing);
        this.close();
      } else if (choice === 'duplicate') {
        const unique = this.ctx.objects.uniqueName(folder, base);
        void this.finishCreate(unique, title);
      }
      // 'cancel' leaves the create modal open for edits.
    }).open();
  }

  /** Perform the actual file creation and post-create actions. */
  private async finishCreate(name: string, title: string): Promise<void> {
    const { file } = await this.ctx.objects.create(this.schema, name, this.values, title, this.bodyTemplate);
    new Notice(`Created ${file.basename}`);
    if (this.options.onCreated) await this.options.onCreated(file);
    if (this.ctx.settings.openOnCreate) await this.openFile(file);
    this.close();
  }

  private async openFile(file: TFile): Promise<void> {
    await this.app.workspace.getLeaf(false).openFile(file);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
