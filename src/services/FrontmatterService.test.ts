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
});

describe('buildFrontmatter', () => {
  it('emits delimited YAML and omits blank optional values', () => {
    const yaml = buildFrontmatter([
      { key: 'type', type: 'text', value: 'project' },
      { key: 'created_on', type: 'date', value: '2026-06-17' },
      { key: 'status', type: 'select', value: 'active' },
      { key: 'note', type: 'text', value: '' },
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
