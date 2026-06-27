import { describe, expect, it } from 'vitest';
import { SchemaService, slugifyId, validateSchema } from './SchemaService';
import { Schema } from '../types/schema';
import { ObjectsSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../utils/defaults';

function schema(id: string, props: Schema['properties'] = []): Schema {
  return { id, label: id, folder: '', filenameTemplate: '{{title}}', properties: props, bodyTemplate: '' };
}

function settings(schemas: Schema[]): ObjectsSettings {
  return { ...DEFAULT_SETTINGS, schemas };
}

describe('slugifyId', () => {
  it('kebab-cases labels', () => {
    expect(slugifyId('Meeting Notes', () => false)).toBe('meeting-notes');
  });

  it('disambiguates collisions', () => {
    const taken = new Set(['project']);
    expect(slugifyId('Project', (id) => taken.has(id))).toBe('project-2');
  });

  it('falls back to "object" for empty labels', () => {
    expect(slugifyId('!!!', () => false)).toBe('object');
  });
});

describe('validateSchema', () => {
  it('accepts a valid schema', () => {
    expect(validateSchema(schema('person', [{ key: 'email', type: 'text' }]), [])).toEqual([]);
  });

  it('rejects reserved and duplicate keys', () => {
    const errors = validateSchema(
      schema('x', [
        { key: 'type', type: 'text' },
        { key: 'dup', type: 'text' },
        { key: 'dup', type: 'text' },
      ]),
      [],
    );
    expect(errors.some((e) => e.includes('reserved'))).toBe(true);
    expect(errors.some((e) => e.includes('Duplicate'))).toBe(true);
  });

  it('requires options for select properties', () => {
    const errors = validateSchema(schema('x', [{ key: 'status', type: 'select' }]), []);
    expect(errors.some((e) => e.includes('option'))).toBe(true);
  });

  it('allows multiselect properties without options (free-form list)', () => {
    expect(validateSchema(schema('x', [{ key: 'tags', type: 'multiselect' }]), [])).toEqual([]);
  });

  it('rejects duplicate ids', () => {
    expect(validateSchema(schema('person'), ['person'])).toContain('Schema id "person" is already in use.');
  });
});

describe('SchemaService', () => {
  it('supports CRUD and reordering', () => {
    const store = settings([schema('a'), schema('b'), schema('c')]);
    const service = new SchemaService(store);

    expect(service.byId('b')?.id).toBe('b');

    service.move(0, 2);
    expect(store.schemas.map((s) => s.id)).toEqual(['b', 'c', 'a']);

    service.remove('c');
    expect(store.schemas.map((s) => s.id)).toEqual(['b', 'a']);

    service.add(schema('d'));
    expect(store.schemas.map((s) => s.id)).toEqual(['b', 'a', 'd']);

    service.update('a', schema('a', [{ key: 'k', type: 'text' }]));
    expect(service.byId('a')?.properties).toHaveLength(1);
  });

  it('clamps out-of-range moves', () => {
    const store = settings([schema('a'), schema('b')]);
    const service = new SchemaService(store);
    service.move(0, 99);
    expect(store.schemas.map((s) => s.id)).toEqual(['b', 'a']);
  });
});
