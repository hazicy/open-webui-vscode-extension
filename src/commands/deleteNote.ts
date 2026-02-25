import * as vscode from 'vscode';
import { NoteManager } from '../services/note';

/**
 * Register delete note command
 */
export function registerDeleteNoteCommand(
  context: vscode.ExtensionContext,
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('openwebui.deleteNote', async (noteId?: string) => {
      const noteToDelete = noteId || NoteManager.getCurrentNoteId();

      if (!noteToDelete) {
        vscode.window.showWarningMessage('No note selected');
        return;
      }

      const success = await NoteManager.deleteNote(noteToDelete);

      if (success) {
        // Refresh tree views
        vscode.commands.executeCommand('openwebui.refresh');
      }
    }),
  );
}
