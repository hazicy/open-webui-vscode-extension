import * as vscode from 'vscode';
import type { OpenWebUIClient } from '../lib/openwebui';
import type { NotesFSProvider } from '../providers/notesFSProvider';
import { ApiClientManager } from './api';

/**
 * Note Sync Manager
 * Manages note synchronization between VSCode and Open WebUI
 */
export class NoteSyncManager {
  fsProvider: NotesFSProvider;
  client: OpenWebUIClient;

  private static pathMapping = new Map<
    string,
    { noteId: string; title: string }
  >();

  constructor(fsProvider: NotesFSProvider) {
    this.fsProvider = fsProvider;
    this.client = ApiClientManager.getClient();
  }

  /**
   * Open a note in VSCode editor
   */
  async openNote(noteId: string, title: string): Promise<vscode.Uri> {
    const response = await this.client.notes.get(noteId);
    if (!response) {
      throw new Error(`Note not found: ${noteId}`);
    }

    const note = (response as any).data.content || response;
    if (!note) {
      throw new Error(`Invalid note response for ID: ${noteId}`);
    }

    const filename = `${title}.md`;
    const uri = vscode.Uri.parse(`openwebui:///${filename}`);
    const content = note.md || '';

    await vscode.workspace.fs.writeFile(uri, Buffer.from(content));

    NoteSyncManager.pathMapping.set(uri.fsPath, {
      noteId: noteId,
      title: title,
    });

    return uri;
  }

  /**
   * Save note content to Open WebUI
   */
  async saveNote(
    noteId: string,
    content: string,
    title: string,
  ): Promise<void> {
    if (!content) {
      throw new Error('Content cannot be empty');
    }

    await this.client.notes.update(noteId, {
      title,
      data: {
        content: {
          md: content,
        },
      },
    });
  }

  /**
   * Get mapping for a file path
   */
  static getMapping(
    filePath: string,
  ): { noteId: string; title: string } | undefined {
    return NoteSyncManager.pathMapping.get(filePath);
  }

  /**
   * Remove mapping (useful when files are closed)
   */
  static removeMapping(filePath: string): void {
    NoteSyncManager.pathMapping.delete(filePath);
  }

  /**
   * Clear all mappings
   */
  static clearMappings(): void {
    NoteSyncManager.pathMapping.clear();
  }
}
