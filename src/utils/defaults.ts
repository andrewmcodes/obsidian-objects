import { Schema } from '../types/schema';
import { ObjectsSettings } from '../types/settings';

// Default schemas seeded on first install. Users may freely modify or delete
// them.
export function defaultSchemas(): Schema[] {
  return [
    {
      id: 'person',
      label: 'Person',
      folder: 'Objects/People',
      filenameTemplate: '{{title}}',
      properties: [
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'website', label: 'Website', type: 'url' },
        { key: 'company', label: 'Company', type: 'link' },
      ],
      bodyTemplate: '# {{title}}\n\n## Notes\n',
    },
    {
      id: 'project',
      label: 'Project',
      folder: 'Objects/Projects',
      filenameTemplate: '{{title}}',
      properties: [
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: ['active', 'paused', 'completed'],
          default: 'active',
        },
        {
          key: 'priority',
          label: 'Priority',
          type: 'select',
          options: ['low', 'medium', 'high'],
        },
      ],
      bodyTemplate: '# {{title}}\n\n## Notes\n\n## Related\n',
      actions: [
        { id: 'archive', name: 'Archive project', type: 'set-property', property: 'status', value: 'completed' },
        { id: 'add-follow-up', name: 'Add follow-up', type: 'append-template', template: '## Follow-up — {{date}}\n' },
      ],
    },
    {
      id: 'meeting',
      label: 'Meeting',
      folder: 'Objects/Meetings',
      filenameTemplate: '{{date}} {{title}}',
      properties: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'attendees', label: 'Attendees', type: 'multilink' },
      ],
      bodyTemplate: '# {{title}}\n\n## Attendees\n\n## Notes\n\n## Actions\n',
    },
    {
      id: 'book',
      label: 'Book',
      folder: 'Objects/Books',
      filenameTemplate: '{{title}}',
      properties: [
        { key: 'author', label: 'Author', type: 'text' },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: ['to-read', 'reading', 'read'],
        },
        { key: 'rating', label: 'Rating', type: 'number' },
      ],
      bodyTemplate: '# {{title}}\n\n## Notes\n',
    },
    {
      id: 'article',
      label: 'Article',
      folder: 'Objects/Articles',
      filenameTemplate: '{{title}}',
      properties: [
        { key: 'author', label: 'Author', type: 'text' },
        { key: 'read', label: 'Read', type: 'checkbox' },
      ],
      bodyTemplate: '# {{title}}\n\n## Notes\n',
    },
    {
      id: 'idea',
      label: 'Idea',
      folder: 'Objects/Ideas',
      filenameTemplate: '{{title}}',
      properties: [],
      bodyTemplate: '# {{title}}\n\n## Notes\n',
    },
  ];
}

export const DEFAULT_SETTINGS: ObjectsSettings = {
  schemas: [],
  defaultFolder: 'Objects',
  basesFolder: 'Bases',
  openOnCreate: true,
  hasSeededDefaults: false,
};
