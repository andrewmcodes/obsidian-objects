// Filename helpers. Pure logic so naming/conflict behavior is unit-testable.

import { renderTemplate, TemplateVars } from '../services/TemplateService';

// Characters Obsidian/most filesystems disallow in a note name.
const ILLEGAL_CHARS = /[\\/:*?"<>|#^[\]]/g;

/** Strip illegal characters and collapse whitespace into a safe note name. */
export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(ILLEGAL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Trailing dots are invalid on Windows.
    .replace(/\.+$/, '')
    .trim();
  return cleaned;
}

/** Render a filename template (e.g. `{{date}} {{title}}`) and sanitize it. */
export function resolveFileName(template: string, vars: TemplateVars): string {
  const rendered = renderTemplate(template || '{{title}}', vars).trim();
  const safe = sanitizeFileName(rendered);
  // Always fall back to the title (or "Untitled") if the template collapses
  // to nothing.
  return safe || sanitizeFileName(vars.title) || 'Untitled';
}

/**
 * Find the next available note name following Obsidian's convention:
 * `Name`, `Name 2`, `Name 3`, … `exists` reports whether a base name (no
 * extension) is already taken.
 */
export function nextAvailableName(base: string, exists: (name: string) => boolean): string {
  if (!exists(base)) return base;
  let counter = 2;
  while (exists(`${base} ${counter}`)) counter++;
  return `${base} ${counter}`;
}

/** Join a folder and note name into a vault-relative `.md` path. */
export function notePath(folder: string, name: string): string {
  const normalizedFolder = folder.replace(/\\/g, '/').replace(/\/+$/g, '').replace(/^\/+/, '');
  const file = `${name}.md`;
  return normalizedFolder ? `${normalizedFolder}/${file}` : file;
}
