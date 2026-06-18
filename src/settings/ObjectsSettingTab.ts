import { Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ObjectsContext } from '../types/context';
import { SchemaEditModal } from './SchemaEditModal';
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
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName('Folders and behavior').setHeading();

    new Setting(containerEl)
      .setName('Default folder')
      .setDesc('Parent folder used when a schema does not specify its own.')
      .addText((text) =>
        text.setValue(this.ctx.settings.defaultFolder).onChange(async (value) => {
          this.ctx.settings.defaultFolder = value.trim();
          await this.ctx.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Bases folder')
      .setDesc('Where the "Generate Bases" command writes `.base` files.')
      .addText((text) =>
        text.setValue(this.ctx.settings.basesFolder).onChange(async (value) => {
          this.ctx.settings.basesFolder = value.trim();
          await this.ctx.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Open note after creating')
      .setDesc('Open the new note in the active editor once created.')
      .addToggle((toggle) =>
        toggle.setValue(this.ctx.settings.openOnCreate).onChange(async (value) => {
          this.ctx.settings.openOnCreate = value;
          await this.ctx.saveSettings();
        }),
      );

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
              this.display();
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
              this.display();
            }),
        )
        .addButton((button) =>
          button.setButtonText('Edit').onClick(() => {
            new SchemaEditModal(this.ctx, schema, () => this.display()).open();
          }),
        )
        .addButton((button) =>
          button
            .setButtonText('Delete')
            .setWarning()
            .onClick(async () => {
              this.ctx.schemas.remove(schema.id);
              await this.ctx.saveSettings();
              this.ctx.refreshCommands();
              this.display();
            }),
        );
    });

    new Setting(containerEl)
      .addButton((button) =>
        button
          .setButtonText('Add schema')
          .setCta()
          .onClick(() => {
            new SchemaEditModal(this.ctx, null, () => this.display()).open();
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
          this.display();
        }),
      );
  }
}
