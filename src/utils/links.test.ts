import { describe, expect, it } from 'vitest';
import { toWikiLink, toWikiLinks } from './links';

describe('toWikiLink', () => {
  it('wraps a bare note name', () => {
    expect(toWikiLink('Chris Oliver')).toBe('[[Chris Oliver]]');
  });

  it('leaves an existing wikilink untouched', () => {
    expect(toWikiLink('[[Chris Oliver]]')).toBe('[[Chris Oliver]]');
  });

  it('returns empty for blank input', () => {
    expect(toWikiLink('   ')).toBe('');
  });
});

describe('toWikiLinks', () => {
  it('splits and normalizes a comma-separated string', () => {
    expect(toWikiLinks('Chris Oliver, [[Ada Lovelace]]')).toEqual(['[[Chris Oliver]]', '[[Ada Lovelace]]']);
  });

  it('accepts arrays and drops blanks', () => {
    expect(toWikiLinks(['A', '', 'B'])).toEqual(['[[A]]', '[[B]]']);
  });
});
