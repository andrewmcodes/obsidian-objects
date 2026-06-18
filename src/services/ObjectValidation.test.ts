import { describe, expect, it } from 'vitest';
import { validateObjectValues, validatePropertyValue } from './ObjectValidation';
import { PropertyDefinition, Schema } from '../types/schema';

function prop(p: Partial<PropertyDefinition> & { type: PropertyDefinition['type'] }): PropertyDefinition {
  return { key: 'k', label: 'Field', ...p };
}

describe('validatePropertyValue', () => {
  it('passes blank optional values and flags blank required ones', () => {
    expect(validatePropertyValue(prop({ type: 'text' }), '')).toBeNull();
    expect(validatePropertyValue(prop({ type: 'text', required: true }), '')).toBe('Field is required.');
  });

  it('enforces number ranges', () => {
    expect(validatePropertyValue(prop({ type: 'number', min: 1, max: 5 }), 3)).toBeNull();
    expect(validatePropertyValue(prop({ type: 'number', min: 1 }), 0)).toBe('Field must be ≥ 1.');
    expect(validatePropertyValue(prop({ type: 'number', max: 5 }), 9)).toBe('Field must be ≤ 5.');
    expect(validatePropertyValue(prop({ type: 'number' }), 'abc')).toBe('Field must be a number.');
  });

  it('validates email and url formats', () => {
    expect(validatePropertyValue(prop({ type: 'email' }), 'a@b.com')).toBeNull();
    expect(validatePropertyValue(prop({ type: 'email' }), 'nope')).toBe('Field must be a valid email.');
    expect(validatePropertyValue(prop({ type: 'url' }), 'https://x.dev')).toBeNull();
    expect(validatePropertyValue(prop({ type: 'url' }), 'x.dev')).toBe('Field must be a valid URL.');
  });

  it('applies a regex pattern as a full match', () => {
    expect(validatePropertyValue(prop({ type: 'text', pattern: '[A-Z]{2,}' }), 'AB')).toBeNull();
    expect(validatePropertyValue(prop({ type: 'text', pattern: '[A-Z]{2,}' }), 'Ab')).toBe(
      'Field does not match the required format.',
    );
  });

  it('ignores a malformed pattern rather than blocking', () => {
    expect(validatePropertyValue(prop({ type: 'text', pattern: '[' }), 'anything')).toBeNull();
  });
});

describe('validateObjectValues', () => {
  const schema: Schema = {
    id: 'x',
    label: 'X',
    folder: '',
    filenameTemplate: '{{title}}',
    bodyTemplate: '',
    properties: [
      prop({ key: 'age', label: 'Age', type: 'number', min: 0 }),
      prop({ key: 'mail', label: 'Mail', type: 'email', required: true }),
    ],
  };

  it('collects every error', () => {
    const errors = validateObjectValues(schema, { age: -1, mail: '' });
    expect(errors).toHaveLength(2);
  });

  it('is empty for a valid object', () => {
    expect(validateObjectValues(schema, { age: 30, mail: 'a@b.com' })).toEqual([]);
  });
});
