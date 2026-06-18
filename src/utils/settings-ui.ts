import { App } from 'obsidian';

/**
 * Obsidian exposes a settings controller at `app.setting` that is not part of
 * the public typings. This narrow interface lets us call it type-safely.
 */
interface SettingsController {
  setting?: {
    open(): void;
    openTabById(id: string): void;
  };
}

/**
 * Open the plugin's settings tab.
 *
 * @param app - The Obsidian app instance.
 * @param pluginId - The plugin id whose settings tab should be focused.
 */
export function openPluginSettings(app: App, pluginId: string): void {
  const controller = app as unknown as SettingsController;
  controller.setting?.open();
  controller.setting?.openTabById(pluginId);
}
