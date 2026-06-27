import { Modal, Notice, Setting } from 'obsidian';
import {
  ACTION_TYPES,
  ActionType,
  ObjectAction,
  PROPERTY_TYPES,
  PropertyDefinition,
  PropertyType,
  Schema,
  SchemaVariant,
} from '../types/schema';
import { ObjectsContext } from '../types/context';
import { FolderSuggest } from '../suggest/FolderSuggest';
import { propertyLabel, slugifyId, validateSchema } from '../services/SchemaService';

/** Deep-clone a schema so edits can be cancelled without side effects. */
function cloneSchema(schema: Schema): Schema {
  return {
    ...schema,
    properties: schema.properties.map((prop) => ({
      ...prop,
      options: prop.options ? [...prop.options] : undefined,
      default: Array.isArray(prop.default) ? [...prop.default] : prop.default,
    })),
    templates: schema.templates?.map((template) => ({ ...template })),
    variants: schema.variants?.map((variant) => ({
      ...variant,
      defaults: variant.defaults
        ? Object.fromEntries(
            Object.entries(variant.defaults).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]),
          )
        : undefined,
    })),
    actions: schema.actions?.map((action) => ({ ...action })),
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
      .addText((text) => {
        new FolderSuggest(this.ctx.app, text.inputEl);
        text
          .setPlaceholder(this.ctx.settings.defaultFolder)
          .setValue(this.draft.folder)
          .onChange((value) => (this.draft.folder = value.trim()));
      });

    new Setting(contentEl)
      .setName('Filename template')
      .setDesc('Supports {{title}}, {{type}}, {{date}}, {{date:FORMAT}}, {{time:FORMAT}}, and {{property}}.')
      .addText((text) =>
        text.setValue(this.draft.filenameTemplate).onChange((value) => (this.draft.filenameTemplate = value)),
      );

    new Setting(contentEl)
      .setName('Body template')
      .setDesc(
        'Markdown body. Supports {{title}}, {{type}}, {{date}}, {{date:FORMAT}}, {{time:FORMAT}}, and {{property}}.',
      )
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

    contentEl.createEl('h3', { text: 'Variants' });
    contentEl.createEl('p', {
      text: 'Optional named presets: default overrides (and an optional body) chosen when creating an object.',
      cls: 'setting-item-description',
    });
    const variants = (this.draft.variants ??= []);
    variants.forEach((variant, index) => this.renderVariant(contentEl, variant, index));
    new Setting(contentEl).addButton((button) =>
      button.setButtonText('Add variant').onClick(() => {
        variants.push({ name: '' });
        this.render();
      }),
    );

    contentEl.createEl('h3', { text: 'Actions' });
    contentEl.createEl('p', {
      text: 'Optional commands available on notes of this type.',
      cls: 'setting-item-description',
    });
    const actions = (this.draft.actions ??= []);
    actions.forEach((action, index) => this.renderAction(contentEl, action, index));
    new Setting(contentEl).addButton((button) =>
      button.setButtonText('Add action').onClick(() => {
        actions.push({ id: '', name: '', type: 'set-property' });
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
          // The default is type-specific (e.g. a string vs a list); reset it.
          prop.default = undefined;
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

    // Number rules: min / max.
    if (prop.type === 'number') {
      new Setting(container)
        .setName('Range')
        .setDesc('Optional minimum and maximum.')
        .addText((text) => {
          text.inputEl.type = 'number';
          text.setPlaceholder('Min').setValue(prop.min?.toString() ?? '');
          text.onChange((value) => (prop.min = value === '' ? undefined : Number(value)));
        })
        .addText((text) => {
          text.inputEl.type = 'number';
          text.setPlaceholder('Max').setValue(prop.max?.toString() ?? '');
          text.onChange((value) => (prop.max = value === '' ? undefined : Number(value)));
        });
    }

    // Pattern rule applies to free-text-like types.
    if (['text', 'textarea', 'email', 'url', 'select'].includes(prop.type)) {
      new Setting(container)
        .setName('Pattern')
        .setDesc('Optional regex the value must fully match.')
        .addText((text) =>
          text
            .setPlaceholder('e.g. [A-Z]{2,}')
            .setValue(prop.pattern ?? '')
            .onChange((value) => (prop.pattern = value.trim() === '' ? undefined : value)),
        );
    }

    // Link target: scope autocomplete to a specific object type.
    if (prop.type === 'link' || prop.type === 'multilink') {
      new Setting(container)
        .setName('Linked type')
        .setDesc('Optionally limit suggestions to notes of this type.')
        .addDropdown((drop) => {
          drop.addOption('', 'Any type');
          for (const schema of this.ctx.schemas.all()) drop.addOption(schema.id, schema.label);
          drop.setValue(prop.linkType ?? '').onChange((value) => (prop.linkType = value || undefined));
        });
    }

    this.renderDefaultField(container, prop);
    setting.settingEl.addClass('objects-property-setting');
  }

  /** Render the "Default" input for a property, writing to `prop.default`. */
  private renderDefaultField(container: HTMLElement, prop: PropertyDefinition): void {
    this.renderValueField(
      container,
      prop,
      () => prop.default,
      (value) => (prop.default = value),
      {
        name: 'Default',
        desc: 'Pre-filled when creating an object.',
        checkboxDesc: 'Pre-checked when creating an object.',
      },
    );
  }

  /**
   * Render a type-appropriate value input for a property, reading via `current`
   * and writing via `update`. Shared by the schema default and per-variant
   * overrides; `update(undefined)` clears the value.
   */
  private renderValueField(
    container: HTMLElement,
    prop: PropertyDefinition,
    current: () => PropertyDefinition['default'],
    update: (value: PropertyDefinition['default']) => void,
    opts: { name: string; desc: string; checkboxDesc?: string },
  ): void {
    const setting = new Setting(container).setName(opts.name).setDesc(opts.desc);
    const value = current();
    const asStringArray = (raw: string): string[] | undefined => {
      const items = raw
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== '');
      return items.length ? items : undefined;
    };

    switch (prop.type) {
      case 'checkbox':
        if (opts.checkboxDesc) setting.setDesc(opts.checkboxDesc);
        setting.addToggle((toggle) => toggle.setValue(value === true).onChange((v) => update(v || undefined)));
        break;
      case 'number':
        setting.addText((text) => {
          text.inputEl.type = 'number';
          text.setValue(typeof value === 'number' ? String(value) : '');
          text.onChange((raw) => {
            const num = Number(raw);
            update(raw === '' || !Number.isFinite(num) ? undefined : num);
          });
        });
        break;
      case 'select':
        setting.addDropdown((drop) => {
          drop.addOption('', '—');
          for (const option of prop.options ?? []) drop.addOption(option, option);
          drop.setValue(typeof value === 'string' ? value : '');
          drop.onChange((v) => update(v || undefined));
        });
        break;
      case 'multiselect':
      case 'multilink':
        setting.setDesc(`${opts.desc} Comma-separated.`);
        setting.addText((text) =>
          text.setValue(Array.isArray(value) ? value.join(', ') : '').onChange((raw) => update(asStringArray(raw))),
        );
        break;
      case 'date':
      case 'datetime':
        setting.addText((text) => {
          text.inputEl.type = prop.type === 'date' ? 'date' : 'datetime-local';
          text.setValue(typeof value === 'string' ? value : '');
          text.onChange((raw) => update(raw === '' ? undefined : raw));
        });
        break;
      default:
        setting.addText((text) =>
          text
            .setValue(typeof value === 'string' ? value : '')
            .onChange((raw) => update(raw.trim() === '' ? undefined : raw)),
        );
        break;
    }
  }

  /** Render the editor row(s) for one variant: name, body, and per-property overrides. */
  private renderVariant(container: HTMLElement, variant: SchemaVariant, index: number): void {
    new Setting(container)
      .setClass('objects-property-row')
      .addText((text) =>
        text
          .setPlaceholder('Variant name')
          .setValue(variant.name)
          .onChange((value) => (variant.name = value)),
      )
      .addTextArea((area) => {
        area
          .setPlaceholder('Body (optional; falls back to the default body)')
          .setValue(variant.body ?? '')
          .onChange((value) => (variant.body = value.trim() === '' ? undefined : value));
        area.inputEl.rows = 3;
      })
      .addExtraButton((button) =>
        button
          .setIcon('trash')
          .setTooltip('Remove variant')
          .onClick(() => {
            this.draft.variants?.splice(index, 1);
            this.render();
          }),
      );

    for (const prop of this.draft.properties) {
      if (!prop.key.trim()) continue;
      this.renderValueField(
        container,
        prop,
        () => variant.defaults?.[prop.key],
        (value) => {
          if (value === undefined) {
            if (variant.defaults) delete variant.defaults[prop.key];
          } else {
            (variant.defaults ??= {})[prop.key] = value;
          }
        },
        { name: propertyLabel(prop), desc: `Override (blank uses the schema default).` },
      );
    }
  }

  /** Render the editor row(s) for one custom action. */
  private renderAction(container: HTMLElement, action: ObjectAction, index: number): void {
    new Setting(container)
      .addText((text) =>
        text
          .setPlaceholder('Action name')
          .setValue(action.name)
          .onChange((value) => (action.name = value)),
      )
      .addDropdown((drop) => {
        for (const type of ACTION_TYPES) drop.addOption(type, type);
        drop.setValue(action.type).onChange((value) => {
          action.type = value as ActionType;
          this.render();
        });
      })
      .addExtraButton((button) =>
        button
          .setIcon('trash')
          .setTooltip('Remove action')
          .onClick(() => {
            this.draft.actions?.splice(index, 1);
            this.render();
          }),
      );

    if (action.type === 'set-property') {
      new Setting(container)
        .setName('Set property')
        .addText((text) =>
          text
            .setPlaceholder('Key')
            .setValue(action.property ?? '')
            .onChange((value) => (action.property = value.trim())),
        )
        .addText((text) =>
          text
            .setPlaceholder('Value')
            .setValue(action.value ?? '')
            .onChange((value) => (action.value = value)),
        );
    } else if (action.type === 'append-template') {
      new Setting(container)
        .setName('Append template')
        .setDesc('Supports {{title}}, {{type}}, {{date}}, {{date:FORMAT}}, {{time:FORMAT}}, and {{property}}.')
        .addTextArea((area) => {
          area
            .setPlaceholder('## Follow-up\n')
            .setValue(action.template ?? '')
            .onChange((value) => (action.template = value));
          area.inputEl.rows = 3;
        });
    } else if (action.type === 'create-linked') {
      new Setting(container).setName('Create linked object').addDropdown((drop) => {
        drop.addOption('', '—');
        for (const schema of this.ctx.schemas.all()) drop.addOption(schema.id, schema.label);
        drop.setValue(action.targetSchema ?? '').onChange((value) => (action.targetSchema = value || undefined));
      });
    }
  }

  /** Validate and persist the draft via `onSave`. */
  private async save(): Promise<void> {
    this.draft.label = this.draft.label.trim();
    // Drop incomplete named templates; omit the field entirely if none remain.
    if (this.draft.templates) {
      this.draft.templates = this.draft.templates.filter((t) => t.name.trim() !== '' && t.body.trim() !== '');
      if (this.draft.templates.length === 0) delete this.draft.templates;
    }
    // Drop unnamed variants and prune empty default maps / blank bodies.
    if (this.draft.variants) {
      this.draft.variants = this.draft.variants.filter((v) => v.name.trim() !== '');
      for (const variant of this.draft.variants) {
        variant.name = variant.name.trim();
        if (variant.defaults && Object.keys(variant.defaults).length === 0) delete variant.defaults;
        if (variant.body !== undefined && variant.body.trim() === '') delete variant.body;
      }
      if (this.draft.variants.length === 0) delete this.draft.variants;
    }
    // Drop unnamed actions and assign each a stable id derived from its name.
    if (this.draft.actions) {
      this.draft.actions = this.draft.actions.filter((a) => a.name.trim() !== '');
      const usedIds = new Set<string>();
      for (const action of this.draft.actions) {
        action.name = action.name.trim();
        action.id = slugifyId(action.id || action.name, (id) => usedIds.has(id));
        usedIds.add(action.id);
      }
      if (this.draft.actions.length === 0) delete this.draft.actions;
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
    // Generate template file(s) for a brand-new type. No-ops unless the
    // "Create templates" setting is enabled.
    if (this.isNew) await this.generateTemplates();
    await this.onSave();
    this.close();
  }

  /** Generate template file(s) for the newly created type, reporting the result. */
  private async generateTemplates(): Promise<void> {
    try {
      const count = await this.ctx.templateFiles.generateFor(this.draft);
      if (count > 0) new Notice(`Generated ${count} template file${count === 1 ? '' : 's'}.`);
    } catch (error) {
      console.error('Objects: failed to generate template files', error);
      new Notice('Failed to generate template files. See console for details.');
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
