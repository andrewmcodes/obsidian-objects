// Renders a schema body template. Pure logic, no Obsidian dependency.
// Supported variables (per PRD): {{title}}, {{date}}, {{type}}.

export interface TemplateVars {
  title: string;
  date: string;
  type: string;
}

/**
 * Replace `{{var}}` tokens (whitespace-tolerant) with their values. Unknown
 * tokens are left untouched so a user typo is visible rather than silently
 * eaten.
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  const map: Record<string, string> = {
    title: vars.title,
    date: vars.date,
    type: vars.type,
  };
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => {
    const replacement = map[name.toLowerCase()];
    return replacement === undefined ? match : replacement;
  });
}
