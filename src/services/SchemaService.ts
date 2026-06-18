import { PropertyDefinition, Schema } from '../types/schema';
import { ObjectsSettings } from '../types/settings';

/**
 * Operates on the in-memory settings object. Persistence is the caller's job
 * (plugin.saveSettings); these methods are pure transforms / lookups so they
 * can be unit-tested without Obsidian.
 */
export class SchemaService {
  constructor(private settings: ObjectsSettings) {}

  all(): Schema[] {
    return this.settings.schemas;
  }

  byId(id: string): Schema | undefined {
    return this.settings.schemas.find((schema) => schema.id === id);
  }

  add(schema: Schema): void {
    this.settings.schemas.push(schema);
  }

  update(id: string, updated: Schema): void {
    const index = this.settings.schemas.findIndex((schema) => schema.id === id);
    if (index >= 0) this.settings.schemas[index] = updated;
  }

  remove(id: string): void {
    this.settings.schemas = this.settings.schemas.filter((schema) => schema.id !== id);
  }

  /** Move a schema by index, clamped to bounds. Used for reordering. */
  move(from: number, to: number): void {
    const list = this.settings.schemas;
    if (from < 0 || from >= list.length) return;
    const target = Math.max(0, Math.min(list.length - 1, to));
    const item = list.splice(from, 1)[0];
    if (!item) return;
    list.splice(target, 0, item);
  }
}

/** Convert a label into a stable, unique schema id (kebab-ish identifier). */
export function slugifyId(label: string, taken: (id: string) => boolean): string {
  const base =
    label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'object';
  if (!taken(base)) return base;
  let counter = 2;
  while (taken(`${base}-${counter}`)) counter++;
  return `${base}-${counter}`;
}

/** Validate a schema, returning human-readable error strings (empty if valid). */
export function validateSchema(schema: Schema, otherIds: string[]): string[] {
  const errors: string[] = [];
  if (!schema.id.trim()) errors.push('Schema id is required.');
  if (otherIds.includes(schema.id)) errors.push(`Schema id "${schema.id}" is already in use.`);
  if (!schema.label.trim()) errors.push('Schema label is required.');

  const keys = new Set<string>();
  for (const prop of schema.properties) {
    if (!prop.key.trim()) {
      errors.push('Every property needs a key.');
      continue;
    }
    if (prop.key === 'type' || prop.key === 'created_on') {
      errors.push(`Property key "${prop.key}" is reserved.`);
    }
    if (keys.has(prop.key)) errors.push(`Duplicate property key "${prop.key}".`);
    keys.add(prop.key);
    if ((prop.type === 'select' || prop.type === 'multiselect') && !(prop.options && prop.options.length)) {
      errors.push(`Property "${prop.key}" needs at least one option.`);
    }
  }
  return errors;
}

/** Resolve the display label for a property, falling back to its key. */
export function propertyLabel(prop: PropertyDefinition): string {
  return prop.label?.trim() || prop.key;
}
