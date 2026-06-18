import { describe, expect, it } from 'vitest';
import { buildBaseFile, pluralize } from './BasesService';
import { Schema } from '../types/schema';

describe('pluralize', () => {
  it('handles common English plural forms', () => {
    expect(pluralize('Project')).toBe('Projects');
    expect(pluralize('Company')).toBe('Companies');
    expect(pluralize('Class')).toBe('Classes');
    expect(pluralize('Box')).toBe('Boxes');
  });
});

describe('buildBaseFile', () => {
  const schema: Schema = {
    id: 'person',
    label: 'Person',
    folder: '',
    filenameTemplate: '{{title}}',
    properties: [{ key: 'email', type: 'text' }],
    bodyTemplate: '',
  };

  it('filters on the type property', () => {
    expect(buildBaseFile(schema)).toContain(`- 'type == "person"'`);
  });

  it('declares table and card views ordering file.name and properties', () => {
    const base = buildBaseFile(schema);
    expect(base).toContain('type: table');
    expect(base).toContain('type: cards');
    expect(base).toContain('- file.name');
    expect(base).toContain('- email');
  });
});
