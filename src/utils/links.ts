// Helpers for wikilink-valued properties (link / multilink). Pure logic.

/**
 * Normalize a value into an Obsidian wikilink. Accepts a bare note name or an
 * already-formatted `[[...]]` link and always returns `[[...]]`. Returns an
 * empty string for blank input.
 *
 * @param value - A note name or existing wikilink.
 */
export function toWikiLink(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (/^\[\[.*\]\]$/.test(trimmed)) return trimmed;
  // Strip any stray surrounding brackets before wrapping.
  const inner = trimmed.replace(/^\[+|\]+$/g, '').trim();
  return `[[${inner}]]`;
}

/**
 * Split a comma-separated string (or array) into normalized wikilinks,
 * dropping blanks.
 *
 * @param value - Raw multilink input.
 */
export function toWikiLinks(value: string | string[]): string[] {
  const items = Array.isArray(value) ? value : value.split(',');
  return items.map((item) => toWikiLink(String(item))).filter((item) => item !== '');
}
