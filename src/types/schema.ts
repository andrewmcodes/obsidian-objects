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

export const ACTION_TYPES = ['set-property', 'append-template', 'create-linked'] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

/**
 * A custom command available on a note of this object type. Each action becomes
 * an Obsidian command shown only when the active note's `type` matches.
 */
export interface ObjectAction {
  /** Stable id, unique within the schema. */
  id: string;
  /** Command label, e.g. "Archive project". */
  name: string;
  type: ActionType;
  /** `set-property`: the frontmatter key to set. */
  property?: string;
  /** `set-property`: the value to assign. */
  value?: string;
  /** `append-template`: Markdown appended to the note body. */
  template?: string;
  /** `create-linked`: schema id of the object to create. */
  targetSchema?: string;
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
  /** Optional custom actions (commands) available on notes of this type. */
  actions?: ObjectAction[];
}
