import { describe, expect, it } from 'vitest';
import { renderTemplate } from './TemplateService';

describe('renderTemplate', () => {
  const vars = { title: 'Vite Migration', date: '2026-06-17', type: 'project' };

  it('replaces known variables', () => {
    expect(renderTemplate('# {{title}}', vars)).toBe('# Vite Migration');
    expect(renderTemplate('{{date}} — {{type}}', vars)).toBe('2026-06-17 — project');
  });

  it('is whitespace and case tolerant', () => {
    expect(renderTemplate('{{ title }}', vars)).toBe('Vite Migration');
    expect(renderTemplate('{{TITLE}}', vars)).toBe('Vite Migration');
  });

  it('leaves unknown tokens untouched', () => {
    expect(renderTemplate('{{unknown}}', vars)).toBe('{{unknown}}');
  });
});
