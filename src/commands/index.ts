import * as vscode from 'vscode';
import { NotesTreeProvider } from '../providers/notesTreeProvider';
import { registerRefreshCommand } from './refresh';
import { registerOpenSettingsCommand } from './openSettings';
import { registerOpenNoteCommand } from './openNote';
import type { NotesFSProvider } from '../providers/notesFSProvider';

export function registerCommands(
  context: vscode.ExtensionContext,
  objectsTreeProvider: NotesTreeProvider,
  noteFSProvider: NotesFSProvider,
) {
  registerRefreshCommand(context, objectsTreeProvider);
  registerOpenSettingsCommand(context);
  registerOpenNoteCommand(context, noteFSProvider);
}
