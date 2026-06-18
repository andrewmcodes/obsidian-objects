import { describe, expect, it } from 'vitest';
import { defaultSchemas } from './defaults';
import { validateSchema } from '../services/SchemaService';
import { PROPERTY_TYPES } from '../types/schema';

describe('defaultSchemas', () => {
  const schemas = defaultSchemas();

  it('includes the six PRD default types', () => {
    expect(schemas.map((s) => s.id)).toEqual(['person', 'project', 'meeting', 'book', 'article', 'idea']);
  });

  it('produces only valid schemas', () => {
    for (const schema of schemas) {
      const others = schemas.filter((s) => s.id !== schema.id).map((s) => s.id);
      expect(validateSchema(schema, others)).toEqual([]);
    }
  });

  it('uses only supported property types', () => {
    for (const schema of schemas) {
      for (const prop of schema.properties) {
        expect(PROPERTY_TYPES).toContain(prop.type);
      }
    }
  });
});
