import { Editor, Notice, Plugin } from 'obsidian';
import { ObjectsContext } from '../types/context';
import { openCreateFlow } from '../modals/ObjectTypeModal';
import { CreateObjectModal } from '../modals/CreateObjectModal';
import { ImportSchemasModal } from '../modals/ImportSchemasModal';
import { exportSchemas } from '../services/SchemaIO';
import { openPluginSettings } from '../utils/settings-ui';
import { PLUGIN_ID } from '../utils/constants';

/**
 * Register the static commands (always present regardless of schemas).
 *
 * @param plugin - The plugin to register commands on.
 * @param ctx - Shared plugin context.
 */
export function registerStaticCommands(plugin: Plugin, ctx: ObjectsContext): void {
  plugin.addCommand({
    id: 'create-object',
    name: 'Create object',
    callback: () => openCreateFlow(ctx, null),
  });

  plugin.addCommand({
    id: 'promote-selection-to-object',
    name: 'Promote selection to object',
    editorCheckCallback: (checking: boolean, editor: Editor) => {
      const selection = editor.getSelection().trim();
      if (!selection) return false;
      if (checking) return true;
      promoteSelection(ctx, editor, selection);
      return true;
    },
  });

  plugin.addCommand({
    id: 'generate-bases',
    // "Bases" is Obsidian's proper feature name, so it stays capitalized.
    // eslint-disable-next-line obsidianmd/ui/sentence-case
    name: 'Generate Bases',
    callback: () => void generateBases(ctx),
  });

  plugin.addCommand({
    id: 'export-schemas',
    name: 'Export schemas to clipboard',
    callback: () => void exportSchemasToClipboard(ctx),
  });

  plugin.addCommand({
    id: 'import-schemas',
    name: 'Import schemas',
    callback: () => new ImportSchemasModal(ctx, () => {}).open(),
  });

  plugin.addCommand({
    id: 'open-objects-settings',
    name: 'Open settings',
    callback: () => openPluginSettings(plugin.app, PLUGIN_ID),
  });
}

/** Copy all schemas as a JSON bundle to the clipboard. */
async function exportSchemasToClipboard(ctx: ObjectsContext): Promise<void> {
  const schemas = ctx.schemas.all();
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
}

/**
 * Generate (or refresh) the dynamic `Create <Schema>` commands. Obsidian has no
 * public "remove command" API, so we register once per id; the command list is
 * naturally rebuilt when the plugin reloads. We guard against duplicate
 * registration within a single session via `registered`.
 */
export function registerSchemaCommands(plugin: Plugin, ctx: ObjectsContext, registered: Set<string>): void {
  for (const schema of ctx.schemas.all()) {
    const id = `create-object-${schema.id}`;
    if (registered.has(id)) continue;
    registered.add(id);
    plugin.addCommand({
      id,
      name: `Create ${schema.label}`,
      // Re-resolve the schema at call time so edits are reflected.
      checkCallback: (checking: boolean) => {
        const current = ctx.schemas.byId(schema.id);
        if (!current) return false;
        if (checking) return true;
        new CreateObjectModal(ctx, current).open();
        return true;
      },
    });
  }
}

/** Promote selected text into a new object and replace it with a wikilink. */
function promoteSelection(ctx: ObjectsContext, editor: Editor, selection: string): void {
  openCreateFlow(ctx, null, {
    initialTitle: selection,
    onCreated: (file) => {
      editor.replaceSelection(`[[${file.basename}]]`);
    },
  });
}

/** Run the BasesService for all schemas and report the result. */
async function generateBases(ctx: ObjectsContext): Promise<void> {
  const schemas = ctx.schemas.all();
  if (schemas.length === 0) {
    new Notice('No schemas to generate base files for.');
    return;
  }
  try {
    const count = await ctx.bases.generate(schemas);
    new Notice(`Generated ${count} base file${count === 1 ? '' : 's'}.`);
  } catch (error) {
    console.error('Objects: failed to generate base files', error);
    new Notice('Failed to generate base files. See console for details.');
  }
}
