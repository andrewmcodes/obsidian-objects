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

  it('writes blank schema properties as bare keys ready to fill in', () => {
    const content = buildNoteContent(projectSchema, 'Vite Migration', { status: '' }, '2026-06-17');
    // Every schema key is present even with no value supplied.
    expect(content).toContain('\nstatus:\n');
    expect(content).toContain('\ntags:\n');
    expect(content).toContain('\narchived: false\n');
  });

  it('honors custom auto-properties, omitting created_on when removed', () => {
    const content = buildNoteContent(projectSchema, 'Vite Migration', {}, '2026-06-17', undefined, undefined, [
      { key: 'author', type: 'text', value: 'Andrew' },
      { key: 'logged_at', type: 'datetime', value: '{{date}}T09:00' },
    ]);
    expect(content).toContain('author: Andrew');
    expect(content).toContain('logged_at: 2026-06-17T09:00:00');
    expect(content).not.toContain('created_on');
  });

  it('drops an auto-property whose key a schema property already owns', () => {
    const content = buildNoteContent(
      projectSchema,
      'Vite Migration',
      { status: 'active' },
      '2026-06-17',
      undefined,
      undefined,
      [{ key: 'status', type: 'text', value: 'auto' }],
    );
    // The schema's own `status` wins; the note has a single status line.
    expect(content).toContain('status: active');
    expect(content).not.toContain('status: auto');
  });
});
