import { ACTION_TYPES, ActionType, ObjectAction, PROPERTY_TYPES, Schema, SchemaVariant } from '../types/schema';
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

/**
 * Coerce an unknown value into a valid property `default`, preserving the
 * supported value shapes (string, number, boolean, or string array). Anything
 * else becomes `undefined` so it is simply omitted.
 */
function asDefault(value: unknown): string | number | boolean | string[] | undefined {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(asString);
  return undefined;
}

/** Keep a finite number, otherwise `undefined`. */
function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Keep a non-empty string, otherwise `undefined`. */
function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** Coerce an unknown value into a variant, or `null` if it has no name. */
function coerceVariant(raw: unknown): SchemaVariant | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const name = asString(r.name);
  if (!name) return null;
  const variant: SchemaVariant = { name };
  if (typeof r.body === 'string') variant.body = r.body;
  if (typeof r.defaults === 'object' && r.defaults !== null) {
    const defaults: Record<string, string | number | boolean | string[]> = {};
    for (const [key, value] of Object.entries(r.defaults as Record<string, unknown>)) {
      const coerced = asDefault(value);
      if (coerced !== undefined) defaults[key] = coerced;
    }
    if (Object.keys(defaults).length) variant.defaults = defaults;
  }
  return variant;
}

/** Coerce an unknown value into a valid action, or `null` if unusable. */
function coerceAction(raw: unknown): ObjectAction | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!(ACTION_TYPES as readonly string[]).includes(asString(r.type))) return null;
  return {
    id: asString(r.id),
    name: asString(r.name),
    type: r.type as ActionType,
    property: asOptionalString(r.property),
    value: asOptionalString(r.value),
    template: asOptionalString(r.template),
    targetSchema: asOptionalString(r.targetSchema),
  };
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
          default: asDefault(p.default),
          pattern: asOptionalString(p.pattern),
          min: asNumber(p.min),
          max: asNumber(p.max),
          linkType: asOptionalString(p.linkType),
        }))
    : [];

  const actions = Array.isArray(r.actions)
    ? r.actions.map(coerceAction).filter((a): a is ObjectAction => a !== null)
    : undefined;

  const variants = Array.isArray(r.variants)
    ? r.variants.map(coerceVariant).filter((v): v is SchemaVariant => v !== null)
    : undefined;

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
    variants: variants && variants.length ? variants : undefined,
    actions: actions && actions.length ? actions : undefined,
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
