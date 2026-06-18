import { PROPERTY_TYPES, Schema } from '../types/schema';
import { validateSchema } from './SchemaService';

// Serialize/deserialize schemas as JSON for sharing between vaults. Pure logic.

/** Current on-disk format version for exported schema bundles. */
export const SCHEMA_EXPORT_VERSION = 1;

interface SchemaBundleShape {
  version: number;
  schemas: unknown;
}

/**
 * Serialize schemas to a pretty-printed JSON bundle suitable for sharing.
 *
 * @param schemas - The schemas to export.
 */
export function exportSchemas(schemas: Schema[]): string {
  return JSON.stringify({ version: SCHEMA_EXPORT_VERSION, schemas }, null, 2);
}

export interface ParseResult {
  /** Schemas that parsed and validated successfully. */
  schemas: Schema[];
  /** Human-readable problems found while parsing/validating. */
  errors: string[];
}

/** Safely coerce an unknown value to a string (non-strings become ''). */
function asString(value: unknown): string {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
}

/** Coerce an unknown value into a Schema, filling sane defaults. */
function coerceSchema(raw: unknown): Schema | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.label !== 'string') return null;

  const properties = Array.isArray(r.properties)
    ? r.properties
        .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
        .map((p) => ({
          key: asString(p.key),
          label: p.label === undefined ? undefined : asString(p.label),
          type: (PROPERTY_TYPES as readonly string[]).includes(asString(p.type))
            ? (p.type as Schema['properties'][number]['type'])
            : 'text',
          required: p.required === true ? true : undefined,
          options: Array.isArray(p.options) ? p.options.map(asString) : undefined,
        }))
    : [];

  return {
    id: r.id,
    label: r.label,
    folder: typeof r.folder === 'string' ? r.folder : '',
    filenameTemplate: typeof r.filenameTemplate === 'string' ? r.filenameTemplate : '{{title}}',
    properties,
    bodyTemplate: typeof r.bodyTemplate === 'string' ? r.bodyTemplate : '# {{title}}\n',
    templates: Array.isArray(r.templates)
      ? r.templates
          .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
          .map((t) => ({ name: asString(t.name), body: asString(t.body) }))
      : undefined,
  };
}

/**
 * Parse a JSON bundle (or bare schema array) into validated schemas.
 *
 * @param json - The JSON text to parse.
 */
export function parseSchemas(json: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { schemas: [], errors: ['Invalid JSON.'] };
  }

  const rawList: unknown = Array.isArray(data) ? data : (data as SchemaBundleShape)?.schemas;
  if (!Array.isArray(rawList)) {
    return { schemas: [], errors: ['Expected a "schemas" array.'] };
  }

  const schemas: Schema[] = [];
  const errors: string[] = [];
  rawList.forEach((raw, index) => {
    const schema = coerceSchema(raw);
    if (!schema) {
      errors.push(`Schema #${index + 1}: missing id or label.`);
      return;
    }
    const otherIds = schemas.map((s) => s.id);
    const schemaErrors = validateSchema(schema, otherIds);
    if (schemaErrors.length) {
      errors.push(`${schema.id || `Schema #${index + 1}`}: ${schemaErrors.join(' ')}`);
      return;
    }
    schemas.push(schema);
  });

  return { schemas, errors };
}
