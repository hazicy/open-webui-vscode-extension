import * as vscode from 'vscode';
import { io, Socket } from 'socket.io-client';
import type {
  UserInfo,
  JoinDocumentPayload,
  DocumentStateResponse,
  DocumentUpdatePayload,
  AwarenessUpdatePayload,
  LeaveDocumentPayload,
} from './yjsSocketIOTypes';

// Dynamic import for yjs
let Y: any;

async function initYjs() {
  if (!Y) {
    const yjsModule = await import('yjs');
    Y = yjsModule;
  }
}

// Initialize Yjs on module load
initYjs();

/**
 * Socket.IO Provider for Yjs
 * Implements real-time synchronization using Socket.IO
 * Compatible with Open WebUI's Socket.IO backend
 */
export class YjsSocketIOProvider {
  private socket: Socket | null = null;
  private yjsDoc: any;
  private awareness: any;
  private noteId: string;
  private documentId: string; // Formatted as "note:{note_id}"
  private baseUrl: string;
  private userInfo: UserInfo;
  private isConnected = false;
  private disposables: vscode.Disposable[] = [];
  private onRemoteUpdateCallback?: (update: Uint8Array) => void;
  private onAwarenessUpdateCallback?: (states: Map<string, any>) => void;

  constructor(
    baseUrl: string,
    noteId: string,
    yjsDoc: any,
    userInfo?: Partial<UserInfo>,
  ) {
    this.baseUrl = baseUrl;
    this.noteId = noteId;
    this.documentId = `note:${noteId}`;
    this.yjsDoc = yjsDoc;
    this.userInfo = {
      user_id: userInfo?.user_id || this.generateUserId(),
      user_name: userInfo?.user_name || 'VSCode User',
      user_color: userInfo?.user_color || this.generateRandomColor(),
    };
    this.initAwareness();
  }

  /**
   * Initialize Yjs awareness
   */
  private initAwareness(): void {
    initYjs().then(() => {
      this.awareness = new Y.awareness.Awareness(this.yjsDoc);

      // Set local user info
      this.awareness.setLocalStateField('user', this.userInfo);

      // Listen for awareness changes
      this.awareness.on('change', () => {
        if (this.onAwarenessUpdateCallback) {
          this.onAwarenessUpdateCallback(this.awareness.getStates());
        }
      });
    });
  }

  /**
   * Generate a unique user ID
   */
  private generateUserId(): string {
    return `vscode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a random color for user cursor
   */
  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Set callback for remote updates
   */
  onRemoteUpdate(callback: (update: Uint8Array) => void): void {
    this.onRemoteUpdateCallback = callback;
  }

  /**
   * Set callback for awareness updates
   */
  onAwarenessUpdate(callback: (states: Map<string, any>) => void): void {
    this.onAwarenessUpdateCallback = callback;
  }

  /**
   * Connect to Socket.IO server
   */
  connect(): void {
    try {
      // Construct Socket.IO URL
      const socketUrl = this.getSocketIOUrl();

      console.log('[YjsSocketIO] Connecting to:', socketUrl);
      console.log('[YjsSocketIO] Document ID:', this.documentId);
      console.log('[YjsSocketIO] User:', this.userInfo);

      // Create Socket.IO connection
      this.socket = io(socketUrl, {
        path: '/ws/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: {
          token: this.getAuthToken(),
        },
      });

      // Set up event handlers
      this.setupEventHandlers();

      vscode.window.showInformationMessage(
        'Connecting to collaboration server...',
      );
    } catch (error) {
      console.error('[YjsSocketIO] Connection failed:', error);
      vscode.window.showErrorMessage(`Failed to connect: ${error}`);
    }
  }

  /**
   * Set up Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) {
      return;
    }

    // Log all events for debugging
    this.socket.onAny((eventName: string, ...args: any[]) => {
      console.log('[YjsSocketIO] Event received:', eventName, args);
    });

    // Connection events
    this.socket.on('connect', async () => {
      console.log('[YjsSocketIO] Connected with ID:', this.socket?.id);
      this.isConnected = true;

      // Wait a bit before joining to ensure connection is stable
      setTimeout(() => {
        this.joinDocument();
      }, 100);

      vscode.window.showInformationMessage(
        `Collaboration connected: ${this.noteId}`,
      );
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[YjsSocketIO] Disconnected:', reason);
      this.isConnected = false;
      vscode.window.showWarningMessage(`Collaboration disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[YjsSocketIO] Connection error:', error);
      vscode.window.showErrorMessage(`Connection error: ${error.message}`);
    });

    // Yjs document events - according to Open WebUI spec
    this.socket.on('ydoc:document:state', (data: DocumentStateResponse) => {
      console.log('[YjsSocketIO] Document state received:', data);
      this.handleDocumentState(data);
    });

    this.socket.on('ydoc:document:update', (data: DocumentUpdatePayload) => {
      console.log('[YjsSocketIO] Document update received:', data);
      this.handleDocumentUpdate(data);
    });

    // Awareness events (cursor sharing, user presence)
    this.socket.on('ydoc:awareness:update', (data: AwarenessUpdatePayload) => {
      console.log('[YjsSocketIO] Awareness update received:', data);
      this.handleAwarenessUpdate(data);
    });
  }

  /**
   * Join the document collaboration room
   */
  private async joinDocument(): Promise<void> {
    if (!this.socket || !this.isConnected) {
      console.warn('[YjsSocketIO] Cannot join: socket not connected');
      return;
    }

    try {
      await initYjs();

      // Get current document state
      const state = Y.encodeStateAsUpdate(this.yjsDoc);

      const payload: JoinDocumentPayload = {
        document_id: this.documentId,
        user_id: this.userInfo.user_id,
        user_name: this.userInfo.user_name,
        user_color: this.userInfo.user_color,
      };

      console.log('[YjsSocketIO] Joining document:', {
        document_id: this.documentId,
        user_id: this.userInfo.user_id,
        stateLength: state.length,
      });

      this.socket.emit('ydoc:document:join', payload);

      console.log('[YjsSocketIO] Join event emitted successfully');
    } catch (error) {
      console.error('[YjsSocketIO] Error joining document:', error);
      vscode.window.showErrorMessage(`Failed to join document: ${error}`);
    }
  }

  /**
   * Handle document state from server
   */
  private handleDocumentState(data: DocumentStateResponse): void {
    try {
      if (data.document_id !== this.documentId) {
        console.log(
          '[YjsSocketIO] Ignoring state for different document:',
          data.document_id,
        );
        return;
      }

      if (data.state && data.state.length > 0) {
        const update = new Uint8Array(data.state);
        Y.applyUpdate(this.yjsDoc, update);
        console.log(
          '[YjsSocketIO] Applied document state, sessions:',
          data.sessions,
        );
      }
    } catch (error) {
      console.error('[YjsSocketIO] Failed to apply document state:', error);
      vscode.window.showErrorMessage(
        `Failed to apply document state: ${error}`,
      );
    }
  }

  /**
   * Handle document update from server (from other clients)
   */
  private handleDocumentUpdate(data: DocumentUpdatePayload): void {
    try {
      // Filter out updates from ourselves
      if (data.socket_id === this.socket?.id) {
        console.log('[YjsSocketIO] Ignoring own update');
        return;
      }

      if (data.document_id !== this.documentId) {
        console.log(
          '[YjsSocketIO] Ignoring update for different document:',
          data.document_id,
        );
        return;
      }

      if (data.update && data.update.length > 0) {
        const update = new Uint8Array(data.update);

        // Apply update to local Yjs document
        Y.applyUpdate(this.yjsDoc, update);

        // Notify callback for UI updates
        if (this.onRemoteUpdateCallback) {
          this.onRemoteUpdateCallback(update);
        }

        console.log(
          '[YjsSocketIO] Applied remote update from user:',
          data.user_id,
        );

        // Show subtle notification (don't spam)
        vscode.window
          .showInformationMessage(
            `Document updated by ${data.user_id}`,
            ...['Hide'],
          )
          .then((selection) => {
            if (selection === 'Hide') {
              // User chose to hide this type of notification
            }
          });
      }
    } catch (error) {
      console.error('[YjsSocketIO] Failed to apply remote update:', error);
      vscode.window.showErrorMessage(`Failed to apply remote update: ${error}`);
    }
  }

  /**
   * Handle awareness updates (cursor position, user presence)
   */
  private handleAwarenessUpdate(data: AwarenessUpdatePayload): void {
    try {
      if (data.document_id !== this.documentId) {
        return;
      }

      if (data.update && data.update.length > 0) {
        // Apply awareness update to local awareness instance
        if (this.awareness) {
          Y.applyUpdate(this.awareness, new Uint8Array(data.update));
          console.log(
            '[YjsSocketIO] Applied awareness update from user:',
            data.user_id,
          );
        }
      }
    } catch (error) {
      console.error('[YjsSocketIO] Failed to apply awareness update:', error);
    }
  }

  /**
   * Send document update to server
   */
  sendUpdate(update: Uint8Array, content?: { md: string }): void {
    if (!this.socket || !this.isConnected) {
      console.warn('[YjsSocketIO] Cannot send update: not connected');
      return;
    }

    try {
      const payload: DocumentUpdatePayload = {
        document_id: this.documentId,
        user_id: this.userInfo.user_id,
        socket_id: this.socket.id,
        update: Array.from(update),
      };

      // Optionally include full content data
      if (content) {
        payload.data = { content };
      }

      console.log('[YjsSocketIO] Sending update:', {
        document_id: this.documentId,
        update_length: update.length,
        has_content: !!content,
      });

      this.socket.emit('ydoc:document:update', payload);

      console.log('[YjsSocketIO] Update sent successfully');
    } catch (error) {
      console.error('[YjsSocketIO] Error sending update:', error);
    }
  }

  /**
   * Send awareness update (cursor position, selection, etc.)
   */
  sendAwareness(update: Uint8Array): void {
    if (!this.socket || !this.isConnected) {
      console.warn('[YjsSocketIO] Cannot send awareness: not connected');
      return;
    }

    try {
      const payload: AwarenessUpdatePayload = {
        document_id: this.documentId,
        user_id: this.userInfo.user_id,
        update: Array.from(update),
      };

      this.socket.emit('ydoc:awareness:update', payload);

      console.log('[YjsSocketIO] Awareness update sent');
    } catch (error) {
      console.error('[YjsSocketIO] Error sending awareness update:', error);
    }
  }

  /**
   * Get current awareness state
   */
  getAwarenessStates(): Map<string, any> | null {
    return this.awareness ? this.awareness.getStates() : null;
  }

  /**
   * Set local awareness state (cursor position, selection, etc.)
   */
  setLocalAwarenessState(field: string, value: any): void {
    if (this.awareness) {
      this.awareness.setLocalStateField(field, value);

      // Send awareness update to server
      const update = Y.encodeAwarenessUpdate(this.awareness, [
        this.awareness.clientID,
      ]);
      this.sendAwareness(update);
    }
  }

  /**
   * Get Socket.IO URL from base URL
   */
  private getSocketIOUrl(): string {
    try {
      const url = new URL(this.baseUrl);
      // Use ws:// or wss:// protocol
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${url.host}`;
      console.log('[YjsSocketIO] WebSocket URL:', wsUrl);
      return wsUrl;
    } catch {
      console.log('[YjsSocketIO] Using base URL directly:', this.baseUrl);
      return this.baseUrl;
    }
  }

  /**
   * Get authentication token from VSCode configuration
   */
  private getAuthToken(): string {
    const config = vscode.workspace.getConfiguration('openwebui');
    const token = config.get<string>('api.token', '');
    console.log('[YjsSocketIO] Auth token present:', !!token);
    return token;
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect and cleanup
   */
  destroy(): void {
    if (this.socket) {
      // Leave document room
      if (this.isConnected) {
        const payload: LeaveDocumentPayload = {
          document_id: this.documentId,
          user_id: this.userInfo.user_id,
        };

        this.socket.emit('ydoc:document:leave', payload);
        console.log('[YjsSocketIO] Leave document emitted');
      }

      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
    }

    // Destroy awareness instance
    if (this.awareness) {
      this.awareness.destroy();
      this.awareness = null;
    }

    // Dispose all subscriptions
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.isConnected = false;

    console.log('[YjsSocketIO] Provider destroyed');
  }
}
