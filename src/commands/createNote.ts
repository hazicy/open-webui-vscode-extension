import * as vscode from 'vscode';
import { NoteManager } from '../services/note';
import { getApiClient } from '../services/api';

/**
 * Register create note command
 */
export function registerCreateNoteCommand(
  context: vscode.ExtensionContext,
) {
  const createHandler = async (title?: string) => {
    if (!title) {
      title = await vscode.window.showInputBox({
        placeHolder: 'Enter note title',
        prompt: 'Note title',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Title cannot be empty';
          }
          return null;
        },
      });
    }

    if (!title) {
      return;
    }

    const note = await NoteManager.createNote(title);

    if (note) {
      await NoteManager.setCurrentNote(note, context);
      await vscode.commands.executeCommand('openwebui.openNote', note);
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('openwebui.createNote', () => createHandler()),
  );
}

/**
 * Register create note from selection command
 */
export function registerCreateNoteFromSelectionCommand(
  context: vscode.ExtensionContext,
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('openwebui.createNoteFromSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showWarningMessage('No text selected');
        return;
      }

      const title = await vscode.window.showInputBox({
        placeHolder: 'Enter note title',
        prompt: 'Note title',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Title cannot be empty';
          }
          return null;
        },
      });

      if (!title) {
        return;
      }

      const note = await NoteManager.createNote(title, selectedText);

      if (note) {
        vscode.window.showInformationMessage(`Note "${title}" created from selection`);
      }
    }),
  );
}
