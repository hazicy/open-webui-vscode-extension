import * as vscode from 'vscode';
import type { OpenWebUIClient } from '../lib/openwebui';
import type { NotesFSProvider } from '../providers/notesFSProvider';
import { ApiClientManager } from './api';
import { YjsSocketIOProvider } from './yjsSocketIOProvider';

// Dynamic import for yjs (ES Module)
let Y: any;

async function initYjs() {
  if (!Y) {
    const yjsModule = await import('yjs');
    Y = yjsModule;
  }
}

/**
 * Note document metadata
 */
interface NoteMetadata {
  noteId: string;
  title: string;
  updatedAt: string;
  yjsDoc: any;
  syncProvider: YjsSocketIOProvider | null;
  disposable: vscode.Disposable;
}

/**
 * Note Sync Manager
 * Manages note synchronization between VSCode and Open WebUI using Yjs (CRDT)
 * Provides real-time collaboration and conflict resolution
 */
export class NoteSyncManager {
  fsProvider: NotesFSProvider;
  client: OpenWebUIClient;

  private static pathMapping = new Map<string, NoteMetadata>();
  private static syncDebounceTimers = new Map<string, NodeJS.Timeout>();

  constructor(fsProvider: NotesFSProvider) {
    this.fsProvider = fsProvider;
    this.client = ApiClientManager.getClient();
  }

  /**
   * Open a note in VSCode editor with Yjs synchronization enabled
   */
  async openNote(noteId: string, title: string): Promise<vscode.Uri> {
    // Initialize Yjs modules
    await initYjs();

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

    // Initialize Yjs document
    const yjsDoc = new Y.Doc();
    const yText = yjsDoc.getText('content');

    // Set initial content
    yText.insert(0, content);

    // Initialize Socket.IO provider for real-time sync
    const baseUrl = this.getBaseUrl();
    const syncProvider = baseUrl
      ? new YjsSocketIOProvider(baseUrl, noteId, yjsDoc, {
          user_name: 'VSCode User',
        })
      : null;

    // Connect to collaboration server
    if (syncProvider) {
      syncProvider.connect();

      // Set up remote update handler
      syncProvider.onRemoteUpdate(async (update: Uint8Array) => {
        await this.handleRemoteUpdate(uri, noteId, title);
      });

      // Set up awareness update handler (optional, for showing other users)
      syncProvider.onAwarenessUpdate((states: Map<string, any>) => {
        console.log('[NoteSyncManager] Awareness states changed:', states.size);
        // Can be used to show remote users' cursors, presence, etc.
      });
    }

    // Set up document change handler for auto-sync
    const updateHandler = (update: Uint8Array) => {
      this.handleYjsUpdate(uri, noteId, title, update);

      // Send update to server via Socket.IO with content data
      if (syncProvider && syncProvider.connected) {
        const yText = yjsDoc.getText('content');
        const content = yText.toString();

        syncProvider.sendUpdate(update, {
          md: content,
        });
      }
    };

    yjsDoc.on('update', updateHandler);

    // Store metadata
    const metadata: NoteMetadata = {
      noteId,
      title,
      updatedAt: note.updated_at || new Date().toISOString(),
      yjsDoc,
      syncProvider,
      disposable: {
        dispose: () => {
          yjsDoc.off('update', updateHandler);
        },
      },
    };

    NoteSyncManager.pathMapping.set(uri.fsPath, metadata);

    // Write initial content to file system
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content));

    return uri;
  }

  /**
   * Handle Yjs document updates and sync to server
   */
  private handleYjsUpdate(
    uri: vscode.Uri,
    noteId: string,
    title: string,
    update?: Uint8Array,
  ): void {
    const metadata = NoteSyncManager.pathMapping.get(uri.fsPath);
    if (!metadata) {
      return;
    }

    // Debounce sync to avoid excessive API calls
    const existingTimer = NoteSyncManager.syncDebounceTimers.get(noteId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.syncToServer(uri, noteId, title);
    }, 1000); // 1 second debounce

    NoteSyncManager.syncDebounceTimers.set(noteId, timer);
  }

  /**
   * Handle remote updates from other clients
   */
  private async handleRemoteUpdate(
    uri: vscode.Uri,
    noteId: string,
    title: string,
  ): Promise<void> {
    try {
      const metadata = NoteSyncManager.pathMapping.get(uri.fsPath);
      if (!metadata) {
        return;
      }

      const { yjsDoc } = metadata;
      const yText = yjsDoc.getText('content');
      const content = yText.toString();

      // Update file system with remote content
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content));

      // Show notification
      vscode.window.showInformationMessage('Document updated by remote user');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to apply remote update: ${error}`);
    }
  }

  /**
   * Sync document content to Open WebUI server
   */
  private async syncToServer(
    uri: vscode.Uri,
    noteId: string,
    title: string,
  ): Promise<void> {
    try {
      const metadata = NoteSyncManager.pathMapping.get(uri.fsPath);
      if (!metadata) {
        return;
      }

      const { yjsDoc, updatedAt } = metadata;
      const yText = yjsDoc.getText('content');
      const content = yText.toString();

      // Get current server state to check for conflicts
      const response = await this.client.notes.get(noteId);
      if (!response) {
        return;
      }

      const serverNote = (response as any).data?.content || response;
      const serverUpdatedAt = serverNote?.updated_at;

      // Conflict resolution: server wins if newer
      if (serverUpdatedAt && serverUpdatedAt > updatedAt) {
        // Merge server content into local Yjs document
        this.mergeServerContent(metadata, serverNote.md || '');
      } else {
        // Save local content to server
        await this.client.notes.update(noteId, {
          title,
          data: {
            content: {
              md: content,
            },
          },
        });

        // Update metadata timestamp
        metadata.updatedAt = new Date().toISOString();
      }

      // Update file system with latest content
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to sync note: ${error}`);
    }
  }

  /**
   * Merge server content into local Yjs document using CRDT merge
   */
  private mergeServerContent(
    metadata: NoteMetadata,
    serverContent: string,
  ): void {
    const { yjsDoc } = metadata;
    const yText = yjsDoc.getText('content');
    const localContent = yText.toString();

    // Simple merge strategy: if server content is different, replace
    // In production, you might want more sophisticated merge strategies
    if (serverContent !== localContent) {
      yText.delete(0, localContent.length);
      yText.insert(0, serverContent);
    }
  }

  /**
   * Get Yjs document for a file path
   */
  static getYjsDoc(filePath: string): any | undefined {
    return NoteSyncManager.pathMapping.get(filePath)?.yjsDoc;
  }

  /**
   * Get mapping for a file path
   */
  static getMapping(filePath: string): NoteMetadata | undefined {
    return NoteSyncManager.pathMapping.get(filePath);
  }

  /**
   * Remove mapping and cleanup resources (useful when files are closed)
   */
  static removeMapping(filePath: string): void {
    const metadata = NoteSyncManager.pathMapping.get(filePath);
    if (metadata) {
      // Cleanup Yjs document and Socket.IO connection
      metadata.syncProvider?.destroy();
      metadata.yjsDoc.destroy();
      metadata.disposable.dispose();

      // Clear debounce timer
      const timer = NoteSyncManager.syncDebounceTimers.get(metadata.noteId);
      if (timer) {
        clearTimeout(timer);
        NoteSyncManager.syncDebounceTimers.delete(metadata.noteId);
      }

      NoteSyncManager.pathMapping.delete(filePath);
    }
  }

  /**
   * Clear all mappings and cleanup all resources
   */
  static clearMappings(): void {
    for (const [filePath] of NoteSyncManager.pathMapping) {
      NoteSyncManager.removeMapping(filePath);
    }
  }

  /**
   * Get base URL for Socket.IO connection
   */
  private getBaseUrl(): string | null {
    // Get base URL from configuration
    const config = vscode.workspace.getConfiguration('openwebui');
    const baseUrl = config.get<string>('api.baseUrl');

    if (!baseUrl) {
      return null;
    }

    return baseUrl;
  }

  /**
   * Get sync status for a note
   */
  static getSyncStatus(filePath: string): {
    isConnected: boolean;
    isSyncing: boolean;
  } {
    const metadata = NoteSyncManager.pathMapping.get(filePath);
    const isSyncing = NoteSyncManager.syncDebounceTimers.has(
      metadata?.noteId || '',
    );

    return {
      isConnected: metadata?.syncProvider?.connected || false,
      isSyncing,
    };
  }
}
