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

  it('round-trips linkType, pattern, min/max, and actions on import', () => {
    const bundle = {
      version: 1,
      schemas: [
        {
          id: 'x',
          label: 'X',
          properties: [
            { key: 'owner', type: 'link', linkType: 'person' },
            { key: 'code', type: 'text', pattern: '[A-Z]{2,}' },
            { key: 'score', type: 'number', min: 1, max: 5 },
          ],
          actions: [
            { id: 'done', name: 'Mark done', type: 'set-property', property: 'status', value: 'done' },
            { name: 'Bogus', type: 'not-a-real-type' },
          ],
        },
      ],
    };
    const { schemas, errors } = parseSchemas(JSON.stringify(bundle));
    expect(errors).toEqual([]);
    const [schema] = schemas;
    expect(schema?.properties[0]?.linkType).toBe('person');
    expect(schema?.properties[1]?.pattern).toBe('[A-Z]{2,}');
    expect(schema?.properties[2]?.min).toBe(1);
    expect(schema?.properties[2]?.max).toBe(5);
    // The action with an unrecognized type is dropped; the valid one survives.
    expect(schema?.actions).toHaveLength(1);
    expect(schema?.actions?.[0]).toMatchObject({ type: 'set-property', property: 'status', value: 'done' });
  });

  it('round-trips variants (name, defaults, body) on import', () => {
    const bundle = {
      version: 1,
      schemas: [
        {
          id: 'meeting',
          label: 'Meeting',
          properties: [{ key: 'status', type: 'select', options: ['todo', 'in_progress'] }],
          variants: [
            { name: 'Recurring', defaults: { status: 'in_progress', tags: ['recurring'] }, body: '## Agenda\n' },
            { name: '' },
          ],
        },
      ],
    };
    const { schemas, errors } = parseSchemas(JSON.stringify(bundle));
    expect(errors).toEqual([]);
    // The nameless variant is dropped; the named one keeps its defaults and body.
    expect(schemas[0]?.variants).toHaveLength(1);
    expect(schemas[0]?.variants?.[0]).toEqual({
      name: 'Recurring',
      defaults: { status: 'in_progress', tags: ['recurring'] },
      body: '## Agenda\n',
    });
  });

  it('defaults unknown property types to text', () => {
    const { schemas } = parseSchemas(
      JSON.stringify({ version: 1, schemas: [{ id: 'x', label: 'X', properties: [{ key: 'k', type: 'bogus' }] }] }),
    );
    expect(schemas[0]?.properties[0]?.type).toBe('text');
  });
});
