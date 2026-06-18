import { PropertyDefinition, Schema } from '../types/schema';
import { PropertyValue } from './FrontmatterService';
import { propertyLabel } from './SchemaService';

// Validates user-entered object values against a schema's rules. Pure logic so
// it can be unit-tested without Obsidian. Returns human-readable error strings.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Require a scheme + host; intentionally permissive about the rest.
const URL_RE = /^[a-z][a-z\d+.-]*:\/\/[^\s]+$/i;

function isEmpty(value: PropertyValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Validate a single property value. Returns an error message, or `null` when
 * the value is valid (including when an optional field is left blank).
 *
 * @param prop - The property definition with any validation rules.
 * @param value - The value entered by the user.
 */
export function validatePropertyValue(prop: PropertyDefinition, value: PropertyValue): string | null {
  const label = propertyLabel(prop);

  if (isEmpty(value)) {
    return prop.required ? `${label} is required.` : null;
  }

  switch (prop.type) {
    case 'number': {
      const num = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(num)) return `${label} must be a number.`;
      if (prop.min !== undefined && num < prop.min) return `${label} must be ≥ ${prop.min}.`;
      if (prop.max !== undefined && num > prop.max) return `${label} must be ≤ ${prop.max}.`;
      return null;
    }
    case 'email':
      return EMAIL_RE.test(String(value)) ? checkPattern(prop, value, label) : `${label} must be a valid email.`;
    case 'url':
      return URL_RE.test(String(value)) ? checkPattern(prop, value, label) : `${label} must be a valid URL.`;
    case 'text':
    case 'textarea':
    case 'select':
      return checkPattern(prop, value, label);
    default:
      return null;
  }
}

/** Apply the optional regex `pattern` rule, if any. */
function checkPattern(prop: PropertyDefinition, value: PropertyValue, label: string): string | null {
  if (!prop.pattern) return null;
  let re: RegExp;
  try {
    re = new RegExp(`^(?:${prop.pattern})$`);
  } catch {
    // A malformed pattern shouldn't block creation; treat it as no constraint.
    return null;
  }
  return re.test(String(value)) ? null : `${label} does not match the required format.`;
}

/**
 * Validate every property of an object, returning all error messages (empty
 * array when the object is valid).
 */
export function validateObjectValues(schema: Schema, values: Record<string, PropertyValue>): string[] {
  const errors: string[] = [];
  for (const prop of schema.properties) {
    const error = validatePropertyValue(prop, values[prop.key]);
    if (error) errors.push(error);
  }
  return errors;
}
