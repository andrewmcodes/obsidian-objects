import { describe, expect, it } from 'vitest';
import { isoDate } from './date';

describe('isoDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(isoDate(new Date(2026, 5, 7))).toBe('2026-06-07');
  });

  it('zero-pads months and days', () => {
    expect(isoDate(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
});
