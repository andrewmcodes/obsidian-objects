import { AbstractInputSuggest, App, TFolder } from 'obsidian';

/**
 * Autocomplete for vault folder paths, attached to a text `<input>`. As the
 * user types, matching folders are suggested; selecting one fills the input and
 * fires its `input` event so the bound `Setting.onChange` persists the value.
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(
    app: App,
    private readonly textInputEl: HTMLInputElement,
  ) {
    super(app, textInputEl);
  }

  protected getSuggestions(query: string): TFolder[] {
    const lower = query.toLowerCase();
    return this.app.vault
      .getAllLoadedFiles()
      .filter((file): file is TFolder => file instanceof TFolder && file.path.toLowerCase().includes(lower))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path === '/' ? '/ (vault root)' : folder.path);
  }

  selectSuggestion(folder: TFolder): void {
    // The vault root is represented as an empty path (schemas fall back to the
    // default folder when blank).
    const value = folder.path === '/' ? '' : folder.path;
    this.setValue(value);
    this.textInputEl.dispatchEvent(new Event('input'));
    this.close();
  }
}
