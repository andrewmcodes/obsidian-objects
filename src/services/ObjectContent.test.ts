import { describe, expect, it } from 'vitest';
import { buildNoteContent } from './ObjectService';
import { Schema } from '../types/schema';

const projectSchema: Schema = {
  id: 'project',
  label: 'Project',
  folder: 'Objects/Projects',
  filenameTemplate: '{{title}}',
  properties: [
    { key: 'status', type: 'select', options: ['active'] },
    { key: 'tags', type: 'multiselect', options: ['a', 'b'] },
    { key: 'archived', type: 'checkbox' },
  ],
  bodyTemplate: '# {{title}}\n\n## Notes\n',
};

describe('buildNoteContent', () => {
  it('always leads with type and created_on', () => {
    const content = buildNoteContent(projectSchema, 'Vite Migration', {}, '2026-06-17');
    expect(content.startsWith('---\ntype: project\ncreated_on: 2026-06-17')).toBe(true);
  });

  it('renders the body template with the title', () => {
    const content = buildNoteContent(projectSchema, 'Vite Migration', {}, '2026-06-17');
    expect(content).toContain('# Vite Migration');
    expect(content).toContain('## Notes');
  });

  it('includes provided property values and a false checkbox', () => {
    const content = buildNoteContent(
      projectSchema,
      'Vite Migration',
      { status: 'active', tags: ['a', 'b'], archived: false },
      '2026-06-17',
    );
    expect(content).toContain('status: active');
    expect(content).toContain('tags:\n  - a\n  - b');
    expect(content).toContain('archived: false');
  });

  it('omits empty optional properties', () => {
    const content = buildNoteContent(projectSchema, 'Vite Migration', { status: '' }, '2026-06-17');
    expect(content).not.toContain('status:');
  });
});
