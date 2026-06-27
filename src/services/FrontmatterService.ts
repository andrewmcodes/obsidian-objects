import { PropertyDefinition, PropertyType } from '../types/schema';
import { toWikiLink, toWikiLinks } from '../utils/links';

// Builds YAML frontmatter from object property values. Pure logic with no
// Obsidian dependency so it is fully unit-testable. Output is standard YAML
// that Obsidian Properties and Bases can read.

export type PropertyValue = string | number | boolean | string[] | null | undefined;

/** A single frontmatter entry to serialize. */
export interface FrontmatterEntry {
  key: string;
  type: PropertyType;
  value: PropertyValue;
  /**
   * Whether to write the key when its value is blank, emitted as a bare `key:`
   * so the note ships with the property ready to fill in. Defaults to `true`;
   * set `false` to drop the entry entirely when blank.
   */
  emitWhenBlank?: boolean;
}

function isBlank(value: PropertyValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

// YAML scalars that would be misread if left bare. Anything matching these, or
// containing structural characters, gets wrapped in double quotes.
function needsQuoting(value: string): boolean {
  if (value === '') return true;
  if (/^[\s]|[\s]$/.test(value)) return true; // leading/trailing whitespace
  if (/[:#\-?[\]{}&*!|>'"%@`,]/.test(value)) return true;
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(value)) return true;
  if (/^-?\d/.test(value)) return true; // looks numeric / date-like
  return false;
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Normalize a date-time string to Obsidian's native `YYYY-MM-DDTHH:mm:ss`
 * format. The `datetime-local` picker omits seconds (`YYYY-MM-DDTHH:mm`), so
 * append `:00` to match what Obsidian writes. Anything that isn't a
 * minute-precision date-time is left untouched.
 */
function normalizeDateTime(value: string): string {
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00` : trimmed;
}

function serializeScalar(value: string): string {
  return needsQuoting(value) ? quote(value) : value;
}

/** Serialize a single value to its YAML representation (without the key). */
export function serializeValue(type: PropertyType, value: PropertyValue): string {
  switch (type) {
    case 'checkbox':
      return value === true || value === 'true' ? 'true' : 'false';
    case 'number': {
      const num = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(num) ? String(num) : '';
    }
    case 'multiselect': {
      const items = Array.isArray(value)
        ? value
        : String(value)
            .split(',')
            .map((item) => item.trim());
      const cleaned = items.filter((item) => item !== '');
      if (cleaned.length === 0) return '[]';
      return '\n' + cleaned.map((item) => `  - ${serializeScalar(item)}`).join('\n');
    }
    case 'multilink': {
      const links = toWikiLinks(value as string | string[]);
      if (links.length === 0) return '[]';
      // Wikilinks always contain `[` so they are quoted to stay valid YAML.
      return '\n' + links.map((link) => `  - ${quote(link)}`).join('\n');
    }
    case 'link': {
      const link = toWikiLink(String(value));
      return link === '' ? '' : quote(link);
    }
    case 'date':
      // Date strings (e.g. `2026-06-17`) are emitted bare so Obsidian treats
      // them as native date properties rather than text.
      return String(value).trim();
    case 'datetime':
      // Emitted bare and normalized to Obsidian's `YYYY-MM-DDTHH:mm:ss` so it
      // reads as a native date-time property.
      return normalizeDateTime(String(value));
    case 'select':
    case 'text':
    case 'textarea':
    case 'email':
    case 'url':
    default:
      return serializeScalar(String(value));
  }
}

/**
 * Build a complete YAML frontmatter block (including delimiters) from entries.
 * Blank values are emitted as a bare `key:` so the note ships with the property
 * ready to fill in, unless the entry sets `emitWhenBlank: false`. `type` and
 * `created_on` should be supplied by the caller as the first entries so they
 * always lead the block.
 */
export function buildFrontmatter(entries: FrontmatterEntry[]): string {
  const lines: string[] = ['---'];
  for (const entry of entries) {
    if (isBlank(entry.value) && entry.type !== 'checkbox') {
      // Keep the key ready to fill in unless the caller opts out for this entry.
      if (entry.emitWhenBlank !== false) lines.push(`${entry.key}:`);
      continue;
    }
    const serialized = serializeValue(entry.type, entry.value);
    // Multiselect lists begin with a newline; everything else is `key: value`.
    if (serialized.startsWith('\n')) {
      lines.push(`${entry.key}:${serialized}`);
    } else {
      lines.push(`${entry.key}: ${serialized}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

/** Convenience: map a schema property + raw value into a frontmatter entry. */
export function entryFor(prop: PropertyDefinition, value: PropertyValue): FrontmatterEntry {
  return { key: prop.key, type: prop.type, value };
}
