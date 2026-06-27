import { describe, expect, it } from 'vitest';
import { buildTemplateContent, templateFileName, templateFilesFor } from './TemplateFileService';
import { Schema } from '../types/schema';

const daySchema: Schema = {
  id: 'day',
  label: 'Day',
  folder: 'logs/days',
  filenameTemplate: '{{date}}',
  properties: [{ key: 'week', label: 'Week', type: 'link', linkType: 'week' }],
  bodyTemplate: '> [!tldr]- Overview\n> ![[Day Views.base#Created Today]]\n\n## Log\n\n## Notes\n',
};

const pageSchema: Schema = {
  id: 'page',
  label: 'Page',
  folder: 'pages',
  filenameTemplate: '{{title}}',
  properties: [
    { key: 'aliases', label: 'Aliases', type: 'multiselect' },
    { key: 'up', label: 'Up', type: 'multilink' },
    { key: 'tags', label: 'Tags', type: 'multiselect' },
  ],
  bodyTemplate: '',
  templates: [{ name: 'Hub', body: '![[bases/Backlinks.base#down]]\n' }],
};

describe('buildTemplateContent', () => {
  it('reproduces the day base template with its body', () => {
    expect(buildTemplateContent(daySchema)).toBe(
      [
        '---',
        'type: day',
        'week:',
        '---',
        '',
        '> [!tldr]- Overview',
        '> ![[Day Views.base#Created Today]]',
        '',
        '## Log',
        '',
        '## Notes',
        '',
      ].join('\n'),
    );
  });

  it('emits frontmatter-only when the schema body is empty', () => {
    expect(buildTemplateContent(pageSchema)).toBe(
      ['---', 'type: page', 'aliases:', 'up:', 'tags:', '---', ''].join('\n'),
    );
  });

  it('uses the supplied variant body after the base frontmatter', () => {
    const variant = pageSchema.templates![0]!;
    expect(buildTemplateContent(pageSchema, variant.body)).toBe(
      ['---', 'type: page', 'aliases:', 'up:', 'tags:', '---', '', '![[bases/Backlinks.base#down]]', ''].join('\n'),
    );
  });

  it('leaves body tokens raw rather than rendering them', () => {
    const schema: Schema = { ...daySchema, bodyTemplate: '# {{title}}\n' };
    expect(buildTemplateContent(schema)).toContain('# {{title}}');
  });
});

describe('templateFileName', () => {
  it('resolves {{id}} to the schema id', () => {
    expect(templateFileName('{{id}}.tmpl', 'page')).toBe('page.tmpl');
  });

  it('appends the variant slug after the id', () => {
    expect(templateFileName('{{id}}.tmpl', 'page', 'hub')).toBe('page-hub.tmpl');
  });

  it('falls back to {{id}}.tmpl when the pattern is empty', () => {
    expect(templateFileName('', 'page')).toBe('page.tmpl');
  });

  it('falls back when the pattern has no {{id}} token, so variants stay distinct', () => {
    expect(templateFileName('template.tmpl', 'page')).toBe('page.tmpl');
    expect(templateFileName('template.tmpl', 'page', 'hub')).toBe('page-hub.tmpl');
  });

  it('strips a trailing .md so notePath does not double the extension', () => {
    expect(templateFileName('{{id}}.tmpl.md', 'page')).toBe('page.tmpl');
  });
});

describe('templateFilesFor', () => {
  it('returns the base file plus one file per named variant', () => {
    const files = templateFilesFor(pageSchema, '{{id}}.tmpl');
    expect(files.map((f) => f.name)).toEqual(['page.tmpl', 'page-hub.tmpl']);
  });

  it('returns only the base file when a schema has no variants', () => {
    const files = templateFilesFor(daySchema, '{{id}}.tmpl');
    expect(files.map((f) => f.name)).toEqual(['day.tmpl']);
  });

  it('slugifies the variant name for the filename', () => {
    const schema: Schema = { ...daySchema, templates: [{ name: 'Daily Review', body: 'x' }] };
    const files = templateFilesFor(schema, '{{id}}.tmpl');
    expect(files[1]?.name).toBe('day-daily-review.tmpl');
  });
});
