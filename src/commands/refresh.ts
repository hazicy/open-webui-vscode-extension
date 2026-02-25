import * as vscode from 'vscode';
import { NotesTreeProvider } from '../providers/notesTreeProvider';

export function registerRefreshCommand(
  context: vscode.ExtensionContext,
  objectsTreeProvider: NotesTreeProvider,
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('openwebui.refresh', () => {
      objectsTreeProvider.refresh();
    }),
  );
}
