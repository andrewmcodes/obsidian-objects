import { Schema } from '../types/schema';

// Pure model for the objects dashboard: groups object notes by their `type`
// into schema-ordered buckets. No Obsidian dependency so it is unit-testable.

/** A discovered object note. */
export interface ObjectRef {
  path: string;
  name: string;
  type: string;
}

/** A dashboard group: one schema (or "Other") plus its objects. */
export interface DashboardGroup {
  id: string;
  label: string;
  items: ObjectRef[];
}

/**
 * Group object notes by `type`, one group per schema (in schema order), plus a
 * trailing "Other" group for objects whose type matches no schema. Items within
 * a group are sorted by name (case-insensitive). Empty groups are omitted.
 *
 * @param objects - Discovered object notes.
 * @param schemas - The defined schemas, in display order.
 */
export function groupObjectsByType(objects: ObjectRef[], schemas: Schema[]): DashboardGroup[] {
  const byType = new Map<string, ObjectRef[]>();
  for (const object of objects) {
    const list = byType.get(object.type) ?? [];
    list.push(object);
    byType.set(object.type, list);
  }

  const sortByName = (a: ObjectRef, b: ObjectRef): number =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

  const groups: DashboardGroup[] = [];
  const knownTypes = new Set<string>();
  for (const schema of schemas) {
    knownTypes.add(schema.id);
    const items = (byType.get(schema.id) ?? []).slice().sort(sortByName);
    if (items.length) groups.push({ id: schema.id, label: schema.label, items });
  }

  const other: ObjectRef[] = [];
  for (const [type, items] of byType) {
    if (!knownTypes.has(type)) other.push(...items);
  }
  if (other.length) groups.push({ id: '__other__', label: 'Other', items: other.slice().sort(sortByName) });

  return groups;
}
