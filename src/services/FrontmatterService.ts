import { PropertyDefinition, PropertyType } from '../types/schema';

// Builds YAML frontmatter from object property values. Pure logic with no
// Obsidian dependency so it is fully unit-testable. Output is standard YAML
// that Obsidian Properties and Bases can read.

export type PropertyValue = string | number | boolean | string[] | null | undefined;

/** A single frontmatter entry to serialize. */
export interface FrontmatterEntry {
  key: string;
  type: PropertyType;
  value: PropertyValue;
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
    case 'date':
      // Date strings (e.g. `2026-06-17`) are emitted bare so Obsidian
      // treats them as native date properties rather than text.
      return String(value).trim();
    case 'select':
    case 'text':
    case 'textarea':
    default:
      return serializeScalar(String(value));
  }
}

/**
 * Build a complete YAML frontmatter block (including delimiters) from entries.
 * Blank, non-required values are omitted. `type` and `created_on` should be
 * supplied by the caller as the first entries so they always lead the block.
 */
export function buildFrontmatter(entries: FrontmatterEntry[]): string {
  const lines: string[] = ['---'];
  for (const entry of entries) {
    if (isBlank(entry.value) && entry.type !== 'checkbox') continue;
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
