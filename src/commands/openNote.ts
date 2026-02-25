import * as vscode from 'vscode';
import { NoteManager } from '../services/note';
import { NoteSyncManager } from '../services/noteSyncManager';
import type { NotesFSProvider } from '../providers/notesFSProvider';
import type { Note } from '../lib/openwebui';

/**
 * Register open note command
 */
export function registerOpenNoteCommand(
  context: vscode.ExtensionContext,
  noteFSProvider: NotesFSProvider,
) {
  const noteSyncManager = new NoteSyncManager(noteFSProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'openwebui.openNote',
      async (note?: Note) => {
        const noteToOpen = note || NoteManager.getCurrentNote();

        if (!noteToOpen) {
          vscode.window.showWarningMessage('No note selected');
          return;
        }

        try {
          const uri = await noteSyncManager.openNote(
            noteToOpen.id,
            (noteToOpen as any).label,
          );

          const document = await vscode.workspace.openTextDocument(uri);

          await vscode.window.showTextDocument(document, {
            preview: true,
          });
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to open note: ${error}`);
        }
      },
    ),
  );
}
