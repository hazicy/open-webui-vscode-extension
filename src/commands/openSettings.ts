import * as vscode from 'vscode';
import { ConfigManager } from '../services';

export function registerOpenSettingsCommand(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('openwebui.openSettings', async () => {
      await ConfigManager.openSettings();
    }),
  );
}
