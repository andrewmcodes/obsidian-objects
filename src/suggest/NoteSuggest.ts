import { AbstractInputSuggest, App, TFile } from 'obsidian';

/**
 * Autocomplete for note names, attached to a text `<input>`. Used by `link` and
 * `multilink` property fields. In `multi` mode it operates on the comma-
 * separated token currently being typed and appends a separator after a pick,
 * so several notes can be added in sequence.
 */
export class NoteSuggest extends AbstractInputSuggest<TFile> {
  constructor(
    app: App,
    private readonly textInputEl: HTMLInputElement,
    private readonly multi = false,
  ) {
    super(app, textInputEl);
  }

  /** The fragment to match against — the last comma token in multi mode. */
  private token(query: string): string {
    const raw = this.multi ? (query.split(',').pop() ?? '') : query;
    return raw.trim().toLowerCase();
  }

  protected getSuggestions(query: string): TFile[] {
    const token = this.token(query);
    const files = this.app.vault.getMarkdownFiles();
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
