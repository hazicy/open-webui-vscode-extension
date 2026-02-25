import * as vscode from 'vscode';
import type { Note } from '../../lib/openwebui/types';
import { getApiClient } from '../api';
import { I18n } from '../../utils';

/**
 * Note Manager
 * Manages note operations in Open WebUI
 */
export class NoteManager {
  private static currentNote: Note | null = null;
  private static statusBarItem: vscode.StatusBarItem;

  /**
   * Initialize note manager
   */
  static initialize(context: vscode.ExtensionContext): void {
    // Restore last opened note from global state
    const savedNoteId = context.globalState.get<string>('currentNoteId');
    if (savedNoteId) {
      // Note will be loaded asynchronously
      this.loadNoteById(savedNoteId);
    }

    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.command = 'openwebui.showNotePicker';
    this.statusBarItem.show();
  }

  /**
   * Load a note by ID
   */
  private static async loadNoteById(noteId: string): Promise<void> {
    try {
      const client = getApiClient();
      const response = await client.notes.get(noteId);
      if (response?.note) {
        this.currentNote = response.note;
      }
    } catch (error) {
      console.error('Failed to load note:', error);
    }
  }

  /**
   * Fetch all notes with optional search
   */
  static async fetchNotes(searchOptions?: {
    query?: string;
    permission?: string;
    view_option?: string;
  }): Promise<Note[]> {
    try {
      const client = getApiClient();

      if (searchOptions) {
        const response = await client.notes.search({
          ...searchOptions,
          page: 1,
        });
        return response.notes || [];
      } else {
        const response = await client.notes.list();
        return response || [];
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        I18n.t('extension.command.failedToFetchNotes', String(error)),
      );
      return [];
    }
  }

  /**
   * Get current note
   */
  static getCurrentNote(): Note | null {
    return this.currentNote;
  }

  /**
   * Get current note ID
   */
  static getCurrentNoteId(): string {
    return this.currentNote?.id || '';
  }

  /**
   * Check if a note is opened
   */
  static hasNote(): boolean {
    return this.currentNote !== null;
  }

  /**
   * Set current note
   */
  static async setCurrentNote(
    note: Note,
    context: vscode.ExtensionContext,
  ): Promise<void> {
    this.currentNote = note;

    // Save to global state
    await context.globalState.update('currentNoteId', note.id);

    // Notify tree views to refresh
    vscode.commands.executeCommand('openwebui.refresh');
  }

  /**
   * Create a new note
   */
  static async createNote(
    title: string,
    content: string = '',
    options?: {
      tags?: string[];
      is_pinned?: boolean;
      access_control?: {
        access_type: 'private' | 'public' | 'shared';
      };
    },
  ): Promise<Note | null> {
    try {
      const client = getApiClient();
      const note = await client.notes.create({
        title,
        data: {
          title: '',
        },
        access_grants: [],
        meta: null,
      });

      if (note) {
        vscode.window.showInformationMessage(
          I18n.t('extension.command.noteCreated', title),
        );
        return note;
      }

      return null;
    } catch (error) {
      vscode.window.showErrorMessage(
        I18n.t('extension.command.failedToCreateNote', String(error)),
      );
      return null;
    }
  }

  /**
   * Update a note
   */
  static async updateNote(
    noteId: string,
    updates: {
      title?: string;
      content?: string;
      tags?: string[];
    },
  ): Promise<Note | null> {
    try {
      const client = getApiClient();
      const note = await client.notes.update(noteId, {
        title: updates.title || this.currentNote?.title || '',
        data: {
          json: null,
          md: updates.content,
          html: '',
        },
        access_grants: [],
        meta: null,
      });

      if (note && this.currentNote?.id === noteId) {
        this.currentNote = note;
      }

      return note;
    } catch (error) {
      vscode.window.showErrorMessage(
        I18n.t('extension.command.failedToUpdateNote', String(error)),
      );
      return null;
    }
  }

  /**
   * Delete a note
   */
  static async deleteNote(noteId: string): Promise<boolean> {
    const confirm = await vscode.window.showWarningMessage(
      I18n.t('extension.command.confirmDeleteNote'),
      { modal: true },
      I18n.t('extension.command.delete'),
      I18n.t('extension.command.cancel'),
    );

    if (confirm !== I18n.t('extension.command.delete')) {
      return false;
    }

    try {
      const client = getApiClient();
      const success = await client.notes.delete(noteId);

      if (success) {
        vscode.window.showInformationMessage(
          I18n.t('extension.command.noteDeleted'),
        );

        // Clear current note if it was deleted
        if (this.currentNote?.id === noteId) {
          this.currentNote = null;
        }

        return true;
      }

      return false;
    } catch (error) {
      vscode.window.showErrorMessage(
        I18n.t('extension.command.failedToDeleteNote', String(error)),
      );
      return false;
    }
  }

  /**
   * Search notes
   */
  static async searchNotes(query: string): Promise<Note[]> {
    return this.fetchNotes({ query });
  }

  /**
   * Get pinned notes
   */
  static async getPinnedNotes(): Promise<Note[]> {
    try {
      const client = getApiClient();
      const response = await client.notes.getPinned();
      return response.notes || [];
    } catch (error) {
      console.error('Failed to get pinned notes:', error);
      return [];
    }
  }

  /**
   * Get public notes
   */
  static async getPublicNotes(): Promise<Note[]> {
    try {
      const client = getApiClient();
      const response = await client.notes.getPublic();
      return response.notes || [];
    } catch (error) {
      console.error('Failed to get public notes:', error);
      return [];
    }
  }

  /**
   * Update note access
   */
  static async updateNoteAccess(
    noteId: string,
    accessType: 'private' | 'public' | 'shared',
    user_ids?: string[],
  ): Promise<Note | null> {
    try {
      const client = getApiClient();
      const note = await client.notes.updateAccess(noteId, {
        access_type: accessType,
        user_ids,
      });

      if (note && this.currentNote?.id === noteId) {
        this.currentNote = note;
      }

      return note;
    } catch (error) {
      vscode.window.showErrorMessage(
        I18n.t('extension.command.failedToUpdateAccess', String(error)),
      );
      return null;
    }
  }

  /**
   * Dispose status bar item
   */
  static dispose(): void {
    this.statusBarItem?.dispose();
  }
}
