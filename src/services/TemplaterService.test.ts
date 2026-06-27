import { describe, expect, it, vi } from 'vitest';
import type { App, TFile } from 'obsidian';
import { isTemplaterEnabled, runTemplater } from './TemplaterService';

/** Build a fake App whose plugin registry optionally contains Templater. */
function appWith(templater: unknown): App {
  const plugins = templater === undefined ? {} : { 'templater-obsidian': templater };
  return { plugins: { plugins } } as unknown as App;
}

// eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test stub, not a real vault file
const file = { basename: 'Note' } as unknown as TFile;

describe('isTemplaterEnabled', () => {
  it('detects the plugin in the registry', () => {
    expect(isTemplaterEnabled(appWith({ templater: {} }))).toBe(true);
    expect(isTemplaterEnabled(appWith(undefined))).toBe(false);
  });
});

describe('runTemplater', () => {
  it('invokes overwrite_file_commands when available', async () => {
    const overwrite = vi.fn().mockResolvedValue(undefined);
    await runTemplater(appWith({ templater: { overwrite_file_commands: overwrite } }), file);
    expect(overwrite).toHaveBeenCalledWith(file);
  });

  it('is a no-op when Templater or the method is missing', async () => {
    await expect(runTemplater(appWith(undefined), file)).resolves.toBeUndefined();
    await expect(runTemplater(appWith({ templater: {} }), file)).resolves.toBeUndefined();
  });

  it('swallows errors thrown by Templater', async () => {
    const overwrite = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(
      runTemplater(appWith({ templater: { overwrite_file_commands: overwrite } }), file),
    ).resolves.toBeUndefined();
  });
});
