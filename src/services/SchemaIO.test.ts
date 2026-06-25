import { describe, expect, it } from 'vitest';
import { exportSchemas, parseSchemas, SCHEMA_EXPORT_VERSION } from './SchemaIO';
import { defaultSchemas } from '../utils/defaults';

describe('exportSchemas / parseSchemas', () => {
  it('round-trips the default schemas', () => {
    const json = exportSchemas(defaultSchemas());
    expect((JSON.parse(json) as { version: number }).version).toBe(SCHEMA_EXPORT_VERSION);
    const { schemas, errors } = parseSchemas(json);
    expect(errors).toEqual([]);
    expect(schemas.map((s) => s.id)).toEqual(defaultSchemas().map((s) => s.id));
  });

  it('accepts a bare schema array', () => {
    const { schemas, errors } = parseSchemas(JSON.stringify(defaultSchemas()));
    expect(errors).toEqual([]);
    expect(schemas).toHaveLength(defaultSchemas().length);
  });

  it('reports invalid JSON', () => {
    expect(parseSchemas('{ not json').errors).toEqual(['Invalid JSON.']);
  });

  it('reports a missing schemas array', () => {
    expect(parseSchemas('{"version":1}').errors).toEqual(['Expected a "schemas" array.']);
  });

  it('collects validation errors and skips bad schemas', () => {
    const { schemas, errors } = parseSchemas(
      JSON.stringify({
        version: 1,
        schemas: [
          { id: 'ok', label: 'Ok', properties: [] },
          { id: 'ok', label: 'Dup', properties: [] },
          { label: 'No id' },
        ],
      }),
    );
    expect(schemas.map((s) => s.id)).toEqual(['ok']);
    expect(errors).toHaveLength(2);
  });

  it('preserves a property default through import', () => {
    const { schemas } = parseSchemas(
      JSON.stringify({
        version: 1,
        schemas: [
          {
            id: 'x',
            label: 'X',
            properties: [
              { key: 'status', type: 'select', options: ['a', 'b'], default: 'a' },
              { key: 'tags', type: 'multiselect', default: ['state/unprocessed'] },
            ],
          },
        ],
      }),
    );
    expect(schemas[0]?.properties[0]?.default).toBe('a');
    expect(schemas[0]?.properties[1]?.default).toEqual(['state/unprocessed']);
  });

  it('defaults unknown property types to text', () => {
    const { schemas } = parseSchemas(
      JSON.stringify({ version: 1, schemas: [{ id: 'x', label: 'X', properties: [{ key: 'k', type: 'bogus' }] }] }),
    );
    expect(schemas[0]?.properties[0]?.type).toBe('text');
  });
});
