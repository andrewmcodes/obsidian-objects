import { App, Modal, Setting } from 'obsidian';

export type ConflictChoice = 'open' | 'duplicate' | 'cancel';

/**
 * Shown when an object note with the resolved name already exists. Mirrors the
 * PRD: "Open existing", "Create duplicate", "Cancel".
 */
export class ConflictModal extends Modal {
  private resolved = false;

  constructor(
    app: App,
    private name: string,
    private onChoice: (choice: ConflictChoice) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText('Object already exists');
    contentEl.createEl('p', {
      text: `A note named "${this.name}" already exists. What would you like to do?`,
    });

    new Setting(contentEl)
      .addButton((button) =>
        button
          .setButtonText('Open existing')
          .setCta()
          .onClick(() => this.choose('open')),
      )
      .addButton((button) => button.setButtonText('Create duplicate').onClick(() => this.choose('duplicate')))
      .addButton((button) => button.setButtonText('Cancel').onClick(() => this.choose('cancel')));
  }

  private choose(choice: ConflictChoice): void {
    this.resolved = true;
    this.onChoice(choice);
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
    // Closing via Escape / click-away counts as cancel.
    if (!this.resolved) this.onChoice('cancel');
  }
}
