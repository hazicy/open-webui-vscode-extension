import * as vscode from 'vscode';
import type { Chat, ChatMessage } from '../../lib/openwebui/resources/chats';
import { getApiClient } from '../api';
import { I18n } from '../../utils';

/**
 * Chat Manager
 * Manages chat conversations in Open WebUI
 */
export class ChatManager {
  private static currentChat: Chat | null = null;
  private static statusBarItem: vscode.StatusBarItem;

  /**
   * Initialize chat manager
   */
  static initialize(context: vscode.ExtensionContext): void {
    // Restore last opened chat from global state
    const savedChatId = context.globalState.get<string>('currentChatId');
    if (savedChatId) {
      // Chat will be loaded asynchronously
      this.loadChatById(savedChatId);
    }

    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      101,
    );
    this.statusBarItem.command = 'openwebui.showChatPicker';
    this.statusBarItem.show();
  }

  /**
   * Load a chat by ID
   */
  private static async loadChatById(chatId: string): Promise<void> {
    try {
      const client = getApiClient();
      const chat = await client.chats.get(chatId);
      if (chat) {
        this.currentChat = chat;
        this.updateStatusBar();
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  }

  /**
   * Fetch all chats
   */
  static async fetchChats(): Promise<Chat[]> {
    try {
      const client = getApiClient();
      return await client.chats.list();
    } catch (error) {
      vscode.window.showErrorMessage(
        I18n.t('extension.command.failedToFetchChats', String(error)),
      );
      return [];
    }
  }

  /**
   * Get current chat
   */
  static getCurrentChat(): Chat | null {
    return this.currentChat;
  }

  /**
   * Get current chat ID
   */
  static getCurrentChatId(): string {
    return this.currentChat?.id || '';
  }

  /**
   * Check if a chat is opened
   */
  static hasChat(): boolean {
    return this.currentChat !== null;
  }

  /**
   * Set current chat
   */
  static async setCurrentChat(
    chat: Chat,
    context: vscode.ExtensionContext,
  ): Promise<void> {
    this.currentChat = chat;

    // Save to global state
    await context.globalState.update('currentChatId', chat.id);

    // Update status bar
    this.updateStatusBar();

    // Notify tree views to refresh
    vscode.commands.executeCommand('openwebui.refresh');
  }

  /**
   * Create a new chat
   */
  static async createChat(
    title?: string,
    model?: string,
    messages?: ChatMessage[],
  ): Promise<Chat | null> {
    try {
      const client = getApiClient();
      const chat = await client.chats.create({
        title,
        model,
        messages,
      });

      if (chat) {
        vscode.window.showInformationMessage(
          I18n.t('extension.command.chatCreated', title || 'New Chat'),
        );
        return chat;
      }

      return null;
    } catch (error) {
      vscode.window.showErrorMessage(
        I18n.t('extension.command.failedToCreateChat', String(error)),
      );
      return null;
    }
  }

  /**
   * Update chat title
   */
  static async updateChatTitle(chatId: string, title: string): Promise<boolean> {
    try {
      const client = getApiClient();
      await client.chats.updateTitle(chatId, title);

      if (this.currentChat?.id === chatId) {
        this.currentChat.title = title;
        this.updateStatusBar();
      }

      return true;
    } catch (error) {
      vscode.window.showErrorMessage(
        I18n.t('extension.command.failedToUpdateChatTitle', String(error)),
      );
      return false;
    }
  }

  /**
   * Delete a chat
   */
  static async deleteChat(chatId: string): Promise<boolean> {
    const confirm = await vscode.window.showWarningMessage(
      I18n.t('extension.command.confirmDeleteChat'),
      { modal: true },
      I18n.t('extension.command.delete'),
      I18n.t('extension.command.cancel'),
    );

    if (confirm !== I18n.t('extension.command.delete')) {
      return false;
    }

    try {
      const client = getApiClient();
      await client.chats.delete(chatId);

      vscode.window.showInformationMessage(
        I18n.t('extension.command.chatDeleted'),
      );

      // Clear current chat if it was deleted
      if (this.currentChat?.id === chatId) {
        this.currentChat = null;
        this.updateStatusBar();
      }

      return true;
    } catch (error) {
      vscode.window.showErrorMessage(
        I18n.t('extension.command.failedToDeleteChat', String(error)),
      );
      return false;
    }
  }

  /**
   * Add a message to a chat
   */
  static async addMessage(
    chatId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
  ): Promise<ChatMessage | null> {
    try {
      const client = getApiClient();
      return await client.chats.addMessage(chatId, message);
    } catch (error) {
      vscode.window.showErrorMessage(
        I18n.t('extension.command.failedToAddMessage', String(error)),
      );
      return null;
    }
  }

  /**
   * Delete a message from a chat
   */
  static async deleteMessage(chatId: string, messageId: string): Promise<boolean> {
    try {
      const client = getApiClient();
      await client.chats.deleteMessage(chatId, messageId);
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(
        I18n.t('extension.command.failedToDeleteMessage', String(error)),
      );
      return false;
    }
  }

  /**
   * Update status bar display
   */
  private static updateStatusBar(): void {
    if (this.currentChat) {
      this.statusBarItem.text = `$(comment-discussion) ${this.currentChat.title}`;
      this.statusBarItem.tooltip = `${I18n.t('extension.command.currentChat')}: ${this.currentChat.title}`;
    } else {
      this.statusBarItem.text = `$(comment-discussion) ${I18n.t('extension.command.noChatOpen')}`;
      this.statusBarItem.tooltip = I18n.t('extension.command.clickToSelectChat');
    }
  }

  /**
   * Dispose status bar item
   */
  static dispose(): void {
    this.statusBarItem?.dispose();
  }
}
