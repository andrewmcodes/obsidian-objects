import { Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { PROPERTY_TYPES, PropertyType } from '../types/schema';
import { ObjectsContext } from '../types/context';
import { SchemaEditModal } from './SchemaEditModal';
import { ImportSchemasModal } from '../modals/ImportSchemasModal';
import { FolderSuggest } from '../suggest/FolderSuggest';
import { exportSchemas } from '../services/SchemaIO';
import { isTemplaterEnabled } from '../services/TemplaterService';
import { defaultSchemas } from '../utils/defaults';

/**
 * The "Objects" settings tab: global folders/behavior plus schema management
 * (add, edit, delete, reorder).
 */
export class ObjectsSettingTab extends PluginSettingTab {
  /**
   * @param plugin - The owning plugin (required by `PluginSettingTab`).
   * @param ctx - Shared plugin context for services and persistence.
   */
  constructor(
    plugin: Plugin,
    private ctx: ObjectsContext,
  ) {
    super(plugin.app, plugin);
  }

  display(): void {
    this.render();
  }

  /** Render (or re-render) the tab contents. */
  private render(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName('Folders and behavior').setHeading();

    new Setting(containerEl)
      .setName('Default folder')
      .setDesc('Parent folder used when a schema does not specify its own.')
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl);
        text.setValue(this.ctx.settings.defaultFolder).onChange(async (value) => {
          this.ctx.settings.defaultFolder = value.trim();
          await this.ctx.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Bases folder')
      .setDesc('Where the "Generate Bases" command writes `.base` files.')
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl);
        text.setValue(this.ctx.settings.basesFolder).onChange(async (value) => {
          this.ctx.settings.basesFolder = value.trim();
          await this.ctx.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Open note after creating')
      .setDesc('Open the new note in the active editor once created.')
      .addToggle((toggle) =>
        toggle.setValue(this.ctx.settings.openOnCreate).onChange(async (value) => {
          this.ctx.settings.openOnCreate = value;
          await this.ctx.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Create templates')
      .setDesc(
        'Generate template files for object types — automatically for new types and on demand from the command palette.',
      )
      .addToggle((toggle) =>
        toggle.setValue(this.ctx.settings.createTemplates).onChange(async (value) => {
          this.ctx.settings.createTemplates = value;
          await this.ctx.saveSettings();
          // Re-render to reveal or hide the dependent inputs below.
          this.render();
        }),
      );

    if (this.ctx.settings.createTemplates) {
      new Setting(containerEl)
        .setName('Templates folder')
        .setDesc('Where generated template files are written.')
        .addText((text) => {
          new FolderSuggest(this.app, text.inputEl);
          text
            .setPlaceholder('Templates folder')
            .setValue(this.ctx.settings.templatesFolder)
            .onChange(async (value) => {
              this.ctx.settings.templatesFolder = value.trim();
              await this.ctx.saveSettings();
            });
        });

      new Setting(containerEl)
        .setName('Naming convention')
        .setDesc(
          'Pattern for template filenames; {{id}} is the object type id. Variant files append the slugified variant name.',
        )
        .addText((text) =>
          text
            .setPlaceholder('{{id}}.tmpl')
            .setValue(this.ctx.settings.templateNaming)
            .onChange(async (value) => {
              this.ctx.settings.templateNaming = value.trim();
              await this.ctx.saveSettings();
            }),
        );
    }

    // Templater is optional; only surface the toggle when it is installed.
    if (isTemplaterEnabled(this.app)) {
      /* eslint-disable obsidianmd/ui/sentence-case -- "Templater" is a proper noun (plugin name). */
      new Setting(containerEl)
        .setName('Evaluate Templater syntax')
        .setDesc('After creating a note, run Templater to evaluate any <% … %> commands in it.')
        .addToggle((toggle) =>
          toggle.setValue(this.ctx.settings.evaluateTemplater).onChange(async (value) => {
            this.ctx.settings.evaluateTemplater = value;
            await this.ctx.saveSettings();
          }),
        );
      /* eslint-enable obsidianmd/ui/sentence-case */
    }

    this.renderAutoProperties(containerEl);

    new Setting(containerEl).setName('Schemas').setHeading();

    const schemas = this.ctx.schemas.all();
    if (schemas.length === 0) {
      containerEl.createEl('p', { text: 'No schemas yet. Add one below.' });
    }

    schemas.forEach((schema, index) => {
      new Setting(containerEl)
        .setName(schema.label || schema.id)
        .setDesc(
          `type: ${schema.id} · ${schema.properties.length} propert${schema.properties.length === 1 ? 'y' : 'ies'}`,
        )
        .addExtraButton((button) =>
          button
            .setIcon('arrow-up')
            .setTooltip('Move up')
            .setDisabled(index === 0)
            .onClick(async () => {
              this.ctx.schemas.move(index, index - 1);
              await this.ctx.saveSettings();
              this.ctx.refreshCommands();
              this.render();
            }),
        )
        .addExtraButton((button) =>
          button
            .setIcon('arrow-down')
            .setTooltip('Move down')
            .setDisabled(index === schemas.length - 1)
            .onClick(async () => {
              this.ctx.schemas.move(index, index + 1);
              await this.ctx.saveSettings();
              this.ctx.refreshCommands();
              this.render();
            }),
        )
        .addButton((button) =>
          button.setButtonText('Edit').onClick(() => {
            new SchemaEditModal(this.ctx, schema, () => this.render()).open();
          }),
        )
        .addButton((button) =>
          button
            .setButtonText('Delete')
            .setDestructive()
            .onClick(async () => {
              this.ctx.schemas.remove(schema.id);
              await this.ctx.saveSettings();
              this.ctx.refreshCommands();
              this.render();
            }),
        );
    });

    new Setting(containerEl)
      .addButton((button) =>
        button
          .setButtonText('Add schema')
          .setCta()
          .onClick(() => {
            new SchemaEditModal(this.ctx, null, () => this.render()).open();
          }),
      )
      .addButton((button) =>
        button.setButtonText('Restore default schemas').onClick(async () => {
          const existing = new Set(this.ctx.schemas.all().map((schema) => schema.id));
          for (const schema of defaultSchemas()) {
            if (!existing.has(schema.id)) this.ctx.schemas.add(schema);
          }
          await this.ctx.saveSettings();
          this.ctx.refreshCommands();
          this.render();
        }),
      );

    new Setting(containerEl)
      .setName('Share schemas')
      .setDesc('Copy schemas as JSON, or import schemas from another vault.')
      .addButton((button) =>
        button.setButtonText('Export to clipboard').onClick(async () => {
          const schemas = this.ctx.schemas.all();
          if (schemas.length === 0) {
            new Notice('No schemas to export.');
            return;
          }
          try {
            await navigator.clipboard.writeText(exportSchemas(schemas));
            new Notice(`Copied ${schemas.length} schema${schemas.length === 1 ? '' : 's'} to the clipboard.`);
          } catch (error) {
            console.error('Objects: failed to copy schemas', error);
            new Notice('Failed to copy schemas to the clipboard.');
          }
        }),
      )
      .addButton((button) =>
        button.setButtonText('Import…').onClick(() => {
          new ImportSchemasModal(this.ctx, () => this.render()).open();
        }),
      );
  }

  /** Render the editor for properties added to every new note. */
  private renderAutoProperties(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Automatic properties').setHeading();
    containerEl.createEl('p', {
      text: 'Added to every new note after the type. Values support {{date}}, {{time:FORMAT}}, {{title}}, {{type}}, and {{property}} tokens. Remove created_on here to stop adding it.',
      cls: 'setting-item-description',
    });

    const autoProperties = this.ctx.settings.autoProperties;
    autoProperties.forEach((auto, index) => {
      new Setting(containerEl)
        .setClass('objects-property-row')
        .addText((text) =>
          text
            .setPlaceholder('Key')
            .setValue(auto.key)
            .onChange(async (value) => {
              auto.key = value.trim();
              await this.ctx.saveSettings();
            }),
        )
        .addDropdown((drop) => {
          for (const type of PROPERTY_TYPES) drop.addOption(type, type);
          drop.setValue(auto.type).onChange(async (value) => {
            auto.type = value as PropertyType;
            await this.ctx.saveSettings();
          });
        })
        .addText((text) =>
          text
            .setPlaceholder('Value, e.g. {{date}}')
            .setValue(auto.value)
            .onChange(async (value) => {
              auto.value = value;
              await this.ctx.saveSettings();
            }),
        )
        .addExtraButton((button) =>
          button
            .setIcon('trash')
            .setTooltip('Remove property')
            .onClick(async () => {
              autoProperties.splice(index, 1);
              await this.ctx.saveSettings();
              this.render();
            }),
        );
    });

    new Setting(containerEl).addButton((button) =>
      button.setButtonText('Add automatic property').onClick(async () => {
        autoProperties.push({ key: '', type: 'text', value: '' });
        await this.ctx.saveSettings();
        this.render();
      }),
    );
  }
}
