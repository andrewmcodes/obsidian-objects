import { App, TFile } from 'obsidian';

// Optional integration with the Templater community plugin. We never depend on
// it directly: everything is feature-detected and guarded so a missing plugin,
// a disabled one, or a changed API simply leaves the note's `<% … %>` syntax
// untouched (its current behavior without this integration).

const TEMPLATER_ID = 'templater-obsidian';

/** The slice of Templater's API we call, all optional. */
interface TemplaterApi {
  templater?: {
    overwrite_file_commands?: (file: TFile, activeFile?: boolean) => Promise<void>;
  };
}

/** Read the plugin registry off `app` (not part of Obsidian's public types). */
function templaterApi(app: App): TemplaterApi | undefined {
  const registry = (app as unknown as { plugins?: { plugins?: Record<string, unknown> } }).plugins;
  return registry?.plugins?.[TEMPLATER_ID] as TemplaterApi | undefined;
}

/** Whether the Templater plugin is installed and enabled. */
export function isTemplaterEnabled(app: App): boolean {
  return templaterApi(app) !== undefined;
}

/**
 * Evaluate Templater `<% … %>` commands in `file`, rewriting it in place. A
 * no-op that never throws when Templater is absent or exposes a different API.
 *
 * @param app - The Obsidian app.
 * @param file - The freshly created note to process.
 */
export async function runTemplater(app: App, file: TFile): Promise<void> {
  const api = templaterApi(app);
  const overwrite = api?.templater?.overwrite_file_commands;
  if (!overwrite) return;
  try {
    await overwrite.call(api.templater, file);
  } catch (error) {
    console.error('Objects: Templater evaluation failed', error);
  }
}
