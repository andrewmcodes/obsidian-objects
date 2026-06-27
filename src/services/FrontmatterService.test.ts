import { describe, expect, it } from 'vitest';
import { buildFrontmatter, serializeValue } from './FrontmatterService';

describe('serializeValue', () => {
  it('serializes checkboxes as booleans', () => {
    expect(serializeValue('checkbox', true)).toBe('true');
    expect(serializeValue('checkbox', false)).toBe('false');
    expect(serializeValue('checkbox', 'true')).toBe('true');
  });

  it('serializes numbers, dropping invalid input', () => {
    expect(serializeValue('number', 42)).toBe('42');
    expect(serializeValue('number', '3.5')).toBe('3.5');
    expect(serializeValue('number', 'nope')).toBe('');
  });

  it('quotes strings that need it and leaves safe ones bare', () => {
    expect(serializeValue('text', 'hello')).toBe('hello');
    expect(serializeValue('text', 'a: b')).toBe('"a: b"');
    expect(serializeValue('text', 'true')).toBe('"true"');
    expect(serializeValue('text', '123')).toBe('"123"');
  });

  it('serializes multiselect as a YAML list', () => {
    expect(serializeValue('multiselect', ['a', 'b'])).toBe('\n  - a\n  - b');
    expect(serializeValue('multiselect', 'a, b')).toBe('\n  - a\n  - b');
    expect(serializeValue('multiselect', [])).toBe('[]');
  });

  it('serializes link values as quoted wikilinks', () => {
    expect(serializeValue('link', 'Chris Oliver')).toBe('"[[Chris Oliver]]"');
    expect(serializeValue('link', '[[Acme Inc]]')).toBe('"[[Acme Inc]]"');
    expect(serializeValue('link', '')).toBe('');
  });

  it('serializes multilink as a list of quoted wikilinks', () => {
    expect(serializeValue('multilink', 'Chris Oliver, Ada Lovelace')).toBe(
      '\n  - "[[Chris Oliver]]"\n  - "[[Ada Lovelace]]"',
    );
    expect(serializeValue('multilink', [])).toBe('[]');
  });

  it('emits dates bare and normalizes datetimes to seconds precision', () => {
    expect(serializeValue('date', '2026-06-17')).toBe('2026-06-17');
    // The datetime-local picker omits seconds; match Obsidian's YYYY-MM-DDTHH:mm:ss.
    expect(serializeValue('datetime', '2026-06-17T09:30')).toBe('2026-06-17T09:30:00');
    // An existing seconds component is preserved.
    expect(serializeValue('datetime', '2026-06-17T09:30:45')).toBe('2026-06-17T09:30:45');
  });

  it('serializes email and url as scalars', () => {
    expect(serializeValue('email', 'a@b.com')).toBe('"a@b.com"');
    expect(serializeValue('url', 'https://x.dev')).toBe('"https://x.dev"');
  });
});

describe('buildFrontmatter', () => {
  it('emits blank values as bare keys by default', () => {
    const yaml = buildFrontmatter([
      { key: 'type', type: 'text', value: 'page' },
      { key: 'aliases', type: 'multiselect', value: [] },
      { key: 'up', type: 'multilink', value: '' },
      { key: 'tags', type: 'multiselect', value: undefined },
    ]);
    expect(yaml).toBe(['---', 'type: page', 'aliases:', 'up:', 'tags:', '---'].join('\n'));
  });

  it('drops blank entries opted out with emitWhenBlank: false', () => {
    const yaml = buildFrontmatter([
      { key: 'type', type: 'text', value: 'project' },
      { key: 'created_on', type: 'date', value: '2026-06-17' },
      { key: 'status', type: 'select', value: 'active' },
      { key: 'note', type: 'text', value: '', emitWhenBlank: false },
    ]);
    expect(yaml).toBe(['---', 'type: project', 'created_on: 2026-06-17', 'status: active', '---'].join('\n'));
  });

  it('keeps false checkboxes even though they look blank', () => {
    const yaml = buildFrontmatter([{ key: 'read', type: 'checkbox', value: false }]);
    expect(yaml).toContain('read: false');
  });

  it('renders multiselect lists under their key', () => {
    const yaml = buildFrontmatter([{ key: 'tags', type: 'multiselect', value: ['x', 'y'] }]);
    expect(yaml).toBe('---\ntags:\n  - x\n  - y\n---');
  });
});
