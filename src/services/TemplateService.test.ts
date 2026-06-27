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

  it('formats {{date:FORMAT}} and {{time:FORMAT}} via the injected formatter', () => {
    const withFormat = { ...vars, formatDate: (format: string) => `fmt(${format})` };
    expect(renderTemplate('{{date:YYYYMMDD}}', withFormat)).toBe('fmt(YYYYMMDD)');
    // Formats may contain colons and bracketed literals.
    expect(renderTemplate('{{time:HH:mm}}', withFormat)).toBe('fmt(HH:mm)');
    expect(renderTemplate('{{date:YYYY-[W]WW}}', withFormat)).toBe('fmt(YYYY-[W]WW)');
  });

  it('keeps bare {{date}} as the supplied date and leaves format tokens when no formatter', () => {
    expect(renderTemplate('{{date}}', vars)).toBe('2026-06-17');
    expect(renderTemplate('{{date:YYYY}}', vars)).toBe('{{date:YYYY}}');
  });

  it('substitutes property values, joining lists and leaving missing keys', () => {
    const withProps = { ...vars, properties: { author: 'Ada Lovelace', tags: ['a', 'b'], missing: undefined } };
    expect(renderTemplate('{{author}}', withProps)).toBe('Ada Lovelace');
    expect(renderTemplate('{{tags}}', withProps)).toBe('a, b');
    expect(renderTemplate('{{nope}}', withProps)).toBe('{{nope}}');
  });
});
