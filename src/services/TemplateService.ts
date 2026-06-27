// Renders a schema body/filename template. Pure logic, no Obsidian dependency:
// date/time formatting is delegated to an injected `formatDate` so the renderer
// stays testable in plain Node.
//
// Supported tokens:
//   {{title}}, {{type}}            — the note title and schema id
//   {{date}}                       — the creation date, local YYYY-MM-DD
//   {{date:FORMAT}} {{time:FORMAT}} — moment-formatted now (e.g. {{date:YYYYMMDD}})
//   {{<property key>}}             — a property value (e.g. {{author}})

import type { PropertyValue } from './FrontmatterService';
import { NamedTemplate, Schema } from '../types/schema';

export interface TemplateVars {
  title: string;
  date: string;
  type: string;
  /** Property values for `{{key}}` substitution (e.g. `{{author}}`). */
  properties?: Record<string, PropertyValue>;
  /**
   * Formats a moment-style format string against "now" for `{{date:FORMAT}}` /
   * `{{time:FORMAT}}`. Injected by the caller (Obsidian's bundled `moment`) so
   * this module needs no Obsidian dependency. When absent, those tokens are
   * left untouched.
   */
  formatDate?: (format: string) => string;
}

/** Render a property value as a template-friendly string. */
function stringifyValue(value: PropertyValue): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

/** Resolve one token's value, or `undefined` to leave the token untouched. */
function resolveToken(token: string, vars: TemplateVars): string | undefined {
  const dateTime = /^(date|time)(?::(.+))?$/i.exec(token);
  if (dateTime) {
    const format = dateTime[2];
    if (format !== undefined) return vars.formatDate ? vars.formatDate(format) : undefined;
    // Bare {{date}} keeps the supplied creation date; bare {{time}} needs a formatter.
    if (dateTime[1]?.toLowerCase() === 'date') return vars.date;
    return vars.formatDate ? vars.formatDate('HH:mm') : undefined;
  }
  const lower = token.toLowerCase();
  if (lower === 'title') return vars.title;
  if (lower === 'type') return vars.type;
  const props = vars.properties;
  if (props && Object.prototype.hasOwnProperty.call(props, token)) return stringifyValue(props[token]);
  return undefined;
}

/**
 * Replace `{{token}}` tokens (whitespace-tolerant) with their values. Unknown
 * tokens are left untouched so a user typo is visible rather than silently
 * eaten.
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, token: string) => {
    const replacement = resolveToken(token, vars);
    return replacement === undefined ? match : replacement;
  });
}

/**
 * The list of body templates a user can choose from for a schema: the default
 * body template (named "Default") followed by any named templates.
 */
export function templateChoices(schema: Schema): NamedTemplate[] {
  return [{ name: 'Default', body: schema.bodyTemplate ?? '' }, ...(schema.templates ?? [])];
}
