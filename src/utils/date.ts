// Date helpers. Kept separate so the rest of the code never touches `new Date`
// directly, which makes call sites easy to reason about and test.

/** Local-time `YYYY-MM-DD`, matching Obsidian's default date property format. */
export function isoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
