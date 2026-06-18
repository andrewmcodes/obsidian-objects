// Core schema types. These describe how an object *type* behaves: where its
// notes live, how they are named, which properties they carry, and what their
// body looks like. Schemas are plain data and contain no Obsidian API
// references so they can be serialized to plugin settings verbatim.

export const PROPERTY_TYPES = [
  'text',
  'textarea',
  'number',
  'date',
  'checkbox',
  'select',
  'multiselect',
  'link',
  'multilink',
  'email',
  'url',
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export interface PropertyDefinition {
  /** Frontmatter key, e.g. `status`. */
  key: string;
  /** Human-facing label shown in the creation modal. Falls back to `key`. */
  label?: string;
  type: PropertyType;
  /** Whether the creation modal must have a value before submitting. */
  required?: boolean;
  /** Options for `select` / `multiselect` types. */
  options?: string[];
  /** Default value pre-filled in the modal. */
  default?: string | number | boolean | string[];
  /** Regex (source) a text/email/url value must fully match. */
  pattern?: string;
  /** Minimum value for `number` properties. */
  min?: number;
  /** Maximum value for `number` properties. */
  max?: number;
}

/** A named body template. Schemas may define several to choose between. */
export interface NamedTemplate {
  /** Display name shown in the creation modal's template picker. */
  name: string;
  /** Markdown body; supports {{title}}, {{date}}, {{type}}. */
  body: string;
}

export interface Schema {
  /** Stable identifier, also written to the `type` property. */
  id: string;
  /** Human-facing label, e.g. `Project`. */
  label: string;
  /** Vault-relative folder where notes are created. */
  folder: string;
  /** Filename template, e.g. `{{title}}`. */
  filenameTemplate: string;
  /** Ordered property definitions. */
  properties: PropertyDefinition[];
  /** Default Markdown body template; supports {{title}}, {{date}}, {{type}}. */
  bodyTemplate: string;
  /** Optional additional named templates the user can pick when creating. */
  templates?: NamedTemplate[];
}
