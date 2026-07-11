import { Notice, Plugin, PluginSettingTab, Setting, SettingDefinitionGroup, SettingDefinitionItem } from 'obsidian';
import { PROPERTY_TYPES, PropertyType } from '../types/schema';
import { ObjectsContext } from '../types/context';
import { SchemaEditModal } from './SchemaEditModal';
import { ImportSchemasModal } from '../modals/ImportSchemasModal';
import { exportSchemas } from '../services/SchemaIO';
import { isTemplaterEnabled } from '../services/TemplaterService';
import { defaultSchemas } from '../utils/defaults';

/**
 * The "Objects" settings tab: global folders/behavior plus schema management
 * (add, edit, delete, reorder).
 *
 * Uses Obsidian's declarative settings API (`getSettingDefinitions`, since
 * 1.13.0) so the plain settings are searchable; the dynamic collections
 * (automatic properties, schemas) are supplied as imperative `render` rows.
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

  /** Read a control's value from the plugin's own settings store. */
  getControlValue(key: string): unknown {
    return (this.ctx.settings as unknown as Record<string, unknown>)[key];
  }

  /** Persist a control's value, trimming text like the imperative UI did. */
  async setControlValue(key: string, value: unknown): Promise<void> {
    (this.ctx.settings as unknown as Record<string, unknown>)[key] = typeof value === 'string' ? value.trim() : value;
    await this.ctx.saveSettings();
    // The template and Templater options are gated on other controls; re-evaluate
    // visibility so they appear or disappear the moment their gate changes.
    this.refreshDomState();
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [this.foldersAndBehaviorGroup(), this.automaticPropertiesGroup(), this.schemasGroup()];
  }

  /** Global folders plus creation behavior toggles. */
  private foldersAndBehaviorGroup(): SettingDefinitionGroup {
    const showTemplates = () => this.ctx.settings.createTemplates;
    return {
      type: 'group',
      heading: 'Folders and behavior',
      items: [
        {
          name: 'Default folder',
          desc: 'Parent folder used when a schema does not specify its own.',
          control: { type: 'folder', key: 'defaultFolder' },
        },
        {
          name: 'Bases folder',
          desc: 'Where the "Generate Bases" command writes `.base` files.',
          control: { type: 'folder', key: 'basesFolder' },
        },
        {
          name: 'Open note after creating',
          desc: 'Open the new note in the active editor once created.',
          control: { type: 'toggle', key: 'openOnCreate' },
        },
        {
          name: 'Create templates',
          desc: 'Generate template files for object types — automatically for new types and on demand from the command palette.',
          control: { type: 'toggle', key: 'createTemplates' },
        },
        {
          name: 'Templates folder',
          desc: 'Where generated template files are written.',
          visible: showTemplates,
          control: { type: 'folder', key: 'templatesFolder', placeholder: 'Templates folder' },
        },
        {
          name: 'Naming convention',
          desc: 'Pattern for template filenames; {{id}} is the object type id. Variant files append the slugified variant name.',
          visible: showTemplates,
          control: { type: 'text', key: 'templateNaming', placeholder: '{{id}}.tmpl' },
        },
        {
          name: 'Evaluate Templater syntax',
          desc: 'After creating a note, run Templater to evaluate any <% … %> commands in it.',
          // Only relevant when the optional Templater plugin is installed.
          visible: () => isTemplaterEnabled(this.app),
          control: { type: 'toggle', key: 'evaluateTemplater' },
        },
      ],
    };
  }

  /** Editor for properties added to the frontmatter of every new note. */
  private automaticPropertiesGroup(): SettingDefinitionGroup {
    const autoProperties = this.ctx.settings.autoProperties;
    return {
      type: 'group',
      heading: 'Automatic properties',
      items: [
        {
          name: '',
          desc: 'Added to every new note after the type. Values support {{date}}, {{time:FORMAT}}, {{title}}, {{type}}, and {{property}} tokens. Remove created_on here to stop adding it.',
          searchable: false,
        },
        ...autoProperties.map((auto, index) => ({
          name: '',
          searchable: false,
          render: (setting: Setting) => {
            setting
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
                    this.update();
                  }),
              );
          },
        })),
        {
          name: '',
          searchable: false,
          render: (setting: Setting) => {
            setting.addButton((button) =>
              button.setButtonText('Add automatic property').onClick(async () => {
                autoProperties.push({ key: '', type: 'text', value: '' });
                await this.ctx.saveSettings();
                this.update();
              }),
            );
          },
        },
      ],
    };
  }

  /** Schema list with reorder/edit/delete plus add, restore, and share actions. */
  private schemasGroup(): SettingDefinitionGroup {
    const schemas = this.ctx.schemas.all();
    const rows = schemas.map((schema, index) => ({
      name: schema.label || schema.id,
      desc: `type: ${schema.id} · ${schema.properties.length} propert${schema.properties.length === 1 ? 'y' : 'ies'}`,
      render: (setting: Setting) => {
        setting
          .addExtraButton((button) =>
            button
              .setIcon('arrow-up')
              .setTooltip('Move up')
              .setDisabled(index === 0)
              .onClick(async () => {
                this.ctx.schemas.move(index, index - 1);
                await this.ctx.saveSettings();
                this.ctx.refreshCommands();
                this.update();
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
                this.update();
              }),
          )
          .addButton((button) =>
            button.setButtonText('Edit').onClick(() => {
              new SchemaEditModal(this.ctx, schema, () => this.update()).open();
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
                this.update();
              }),
          );
      },
    }));

    const emptyState =
      schemas.length === 0 ? [{ name: '', desc: 'No schemas yet. Add one below.', searchable: false }] : [];

    return {
      type: 'group',
      heading: 'Schemas',
      items: [
        ...emptyState,
        ...rows,
        {
          name: '',
          searchable: false,
          render: (setting: Setting) => {
            setting
              .addButton((button) =>
                button
                  .setButtonText('Add schema')
                  .setCta()
                  .onClick(() => {
                    new SchemaEditModal(this.ctx, null, () => this.update()).open();
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
                  this.update();
                }),
              );
          },
        },
        {
          name: 'Share schemas',
          desc: 'Copy schemas as JSON, or import schemas from another vault.',
          render: (setting: Setting) => {
            setting
              .addButton((button) =>
                button.setButtonText('Export to clipboard').onClick(async () => {
                  const all = this.ctx.schemas.all();
                  if (all.length === 0) {
                    new Notice('No schemas to export.');
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText(exportSchemas(all));
                    new Notice(`Copied ${all.length} schema${all.length === 1 ? '' : 's'} to the clipboard.`);
                  } catch (error) {
                    console.error('Objects: failed to copy schemas', error);
                    new Notice('Failed to copy schemas to the clipboard.');
                  }
                }),
              )
              .addButton((button) =>
                button.setButtonText('Import…').onClick(() => {
                  new ImportSchemasModal(this.ctx, () => this.update()).open();
                }),
              );
          },
        },
      ],
    };
  }
}
