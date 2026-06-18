// Minimal stub of the Obsidian API for unit tests. Only the surface area that
// pure-logic modules might touch is provided here; UI classes are intentionally
// left as no-op shells so importing them never crashes a test run.

export class Plugin {}
export class Modal {}
export class PluginSettingTab {}
export class Setting {}
export class Notice {}
export class TFile {}
export class TFolder {}
export class App {}

export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
}
