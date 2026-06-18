import { describe, expect, it } from 'vitest';
import { nextAvailableName, notePath, resolveFileName, sanitizeFileName } from './filename';

describe('sanitizeFileName', () => {
  it('strips illegal characters and collapses whitespace', () => {
    expect(sanitizeFileName('a/b:c*d?')).toBe('a b c d');
    expect(sanitizeFileName('  spaced   out  ')).toBe('spaced out');
    expect(sanitizeFileName('trailing.')).toBe('trailing');
  });
});

describe('resolveFileName', () => {
  const vars = { title: 'Standup', date: '2026-06-17', type: 'meeting' };

  it('renders and sanitizes the template', () => {
    expect(resolveFileName('{{date}} {{title}}', vars)).toBe('2026-06-17 Standup');
  });

  it('falls back to the title when the template is empty', () => {
    expect(resolveFileName('', vars)).toBe('Standup');
  });

  it('falls back to Untitled when everything collapses', () => {
    expect(resolveFileName('{{title}}', { ...vars, title: '///' })).toBe('Untitled');
  });
});

describe('nextAvailableName', () => {
  it('returns the base when free', () => {
    expect(nextAvailableName('Project', () => false)).toBe('Project');
  });

  it('follows the Obsidian "Name 2" convention', () => {
    const taken = new Set(['Project', 'Project 2']);
    expect(nextAvailableName('Project', (name) => taken.has(name))).toBe('Project 3');
  });
});

describe('notePath', () => {
  it('joins folder and name into a .md path', () => {
    expect(notePath('Objects/Projects', 'Vite')).toBe('Objects/Projects/Vite.md');
    expect(notePath('', 'Vite')).toBe('Vite.md');
    expect(notePath('/Objects/', 'Vite')).toBe('Objects/Vite.md');
  });
});
