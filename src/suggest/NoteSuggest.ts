import { AbstractInputSuggest, App, TFile } from 'obsidian';

/**
 * Autocomplete for note names, attached to a text `<input>`. Used by `link` and
 * `multilink` property fields. In `multi` mode it operates on the comma-
 * separated token currently being typed and appends a separator after a pick,
 * so several notes can be added in sequence. When `typeFilter` is set, only
 * notes whose `type` property matches are suggested.
 */
export class NoteSuggest extends AbstractInputSuggest<TFile> {
  constructor(
    app: App,
    private readonly textInputEl: HTMLInputElement,
    private readonly multi = false,
    private readonly typeFilter?: string,
  ) {
    super(app, textInputEl);
  }

  /** The fragment to match against — the last comma token in multi mode. */
  private token(query: string): string {
    const raw = this.multi ? (query.split(',').pop() ?? '') : query;
    return raw.trim().toLowerCase();
  }

  /** Whether a note's `type` property satisfies the optional type filter. */
  private matchesType(file: TFile): boolean {
    if (!this.typeFilter) return true;
    const type: unknown = this.app.metadataCache.getFileCache(file)?.frontmatter?.type;
    return type === this.typeFilter;
  }

  protected getSuggestions(query: string): TFile[] {
    const token = this.token(query);
    const files = this.app.vault.getMarkdownFiles().filter((f) => this.matchesType(f));
    const matches =
      token === ''
        ? files
        : files.filter((f) => f.basename.toLowerCase().includes(token) || f.path.toLowerCase().includes(token));
    return matches.sort((a, b) => a.basename.localeCompare(b.basename));
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.createDiv({ text: file.basename });
    // Show the folder path as a muted subtitle to disambiguate same-named notes.
    if (file.parent && file.parent.path !== '/') {
      el.createDiv({ text: file.parent.path, cls: 'objects-suggest__path' });
    }
  }

  selectSuggestion(file: TFile): void {
    if (this.multi) {
      const segments = this.textInputEl.value.split(',').map((s) => s.trim());
      // Replace the in-progress token with the picked note, then add a trailing
      // separator so the next note can be typed immediately.
      segments[segments.length - 1] = file.basename;
      this.setValue(segments.filter((s) => s !== '').join(', ') + ', ');
    } else {
      this.setValue(file.basename);
    }
    this.textInputEl.dispatchEvent(new Event('input'));
    this.close();
  }
}
