import { describe, expect, it } from 'vitest';
import { groupObjectsByType, ObjectRef } from './DashboardModel';
import { Schema } from '../types/schema';

function schema(id: string, label: string): Schema {
  return { id, label, folder: '', filenameTemplate: '{{title}}', properties: [], bodyTemplate: '' };
}

function ref(name: string, type: string): ObjectRef {
  return { path: `${name}.md`, name, type };
}

const schemas = [schema('person', 'Person'), schema('project', 'Project')];

describe('groupObjectsByType', () => {
  it('groups by schema order and sorts items by name', () => {
    const groups = groupObjectsByType([ref('Zed', 'person'), ref('Ada', 'person'), ref('Site', 'project')], schemas);
    expect(groups.map((g) => g.id)).toEqual(['person', 'project']);
    expect(groups[0]?.items.map((i) => i.name)).toEqual(['Ada', 'Zed']);
  });

  it('omits empty schema groups', () => {
    const groups = groupObjectsByType([ref('Ada', 'person')], schemas);
    expect(groups.map((g) => g.id)).toEqual(['person']);
  });

  it('collects unknown types into an Other group at the end', () => {
    const groups = groupObjectsByType([ref('Ada', 'person'), ref('Thing', 'gadget')], schemas);
    expect(groups.map((g) => g.id)).toEqual(['person', '__other__']);
    expect(groups[1]?.label).toBe('Other');
  });
});
