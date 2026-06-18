import { describe, expect, it } from 'vitest';
import { templateChoices } from './TemplateService';
import { buildNoteContent } from './ObjectService';
import { Schema } from '../types/schema';

const schema: Schema = {
  id: 'meeting',
  label: 'Meeting',
  folder: '',
  filenameTemplate: '{{title}}',
  properties: [],
  bodyTemplate: '# {{title}}\n\n## Notes\n',
  templates: [{ name: 'Standup', body: '# {{title}}\n\n## Standup\n' }],
};

describe('templateChoices', () => {
  it('lists the default body first, then named templates', () => {
    const choices = templateChoices(schema);
    expect(choices.map((c) => c.name)).toEqual(['Default', 'Standup']);
    expect(choices[0]?.body).toContain('## Notes');
  });

  it('returns just the default when there are no named templates', () => {
    expect(templateChoices({ ...schema, templates: undefined }).map((c) => c.name)).toEqual(['Default']);
  });
});

describe('buildNoteContent with a body override', () => {
  it('uses the override template when provided', () => {
    const content = buildNoteContent(schema, 'Daily', {}, '2026-06-17', schema.templates![0]!.body);
    expect(content).toContain('## Standup');
    expect(content).not.toContain('## Notes');
  });

  it('falls back to the schema body template otherwise', () => {
    const content = buildNoteContent(schema, 'Daily', {}, '2026-06-17');
    expect(content).toContain('## Notes');
  });
});
