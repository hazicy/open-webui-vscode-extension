import * as vscode from 'vscode';
import { getApiClient, ConfigManager, NoteManager } from '../services';
import { I18n } from '../utils';
import type { Note } from '../lib/openwebui/types';
import { AxiosError } from 'axios';

type Category = 'category';
type NoteItem = 'note';
type ErrorType = 'error';

export interface TreeItem extends vscode.TreeItem {
  count?: number;
  type?: Category | NoteItem | ErrorType;
  children?: TreeItem[];
  noteData?: Note;
}

const CONTEXT_HAS_ERROR = 'openwebuiHasError'; // 定义 Key

export class NotesTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    const label = element.label ?? '';
    const treeItem = new vscode.TreeItem(label, element.collapsibleState);

    treeItem.id = element.id;

    if (element.type === 'category') {
      treeItem.iconPath = new vscode.ThemeIcon('folder');
      treeItem.contextValue = 'openwebuiCategory';
    }

    if (element.type === 'note') {
      const note = element.noteData;
      // Use pin icon for pinned notes
      if (note?.is_pinned) {
        treeItem.iconPath = new vscode.ThemeIcon('pinned');
      } else {
        treeItem.iconPath = new vscode.ThemeIcon('note');
      }
      treeItem.contextValue = 'openwebuiNote';
      treeItem.command = {
        command: 'openwebui.openNote',
        title: I18n.t('extension.command.openNote'),
        arguments: [element],
      };
      // Show tooltip with note metadata
      if (note) {
        treeItem.tooltip = `${note.title}\n${I18n.t('extension.command.updatedAt')}: ${new Date(note.updated_at).toLocaleString()}`;
      }
    }

    if (element.type === 'error') {
      treeItem.iconPath = new vscode.ThemeIcon('error');
      treeItem.contextValue = 'openwebuiError';
      treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    return treeItem;
  }

  async getChildren(
    element?: TreeItem | undefined,
  ): Promise<vscode.TreeItem[]> {
    if (!element) {
      return this.getAllNotes();
    }

    return Promise.resolve(element.children || []);
  }

  private async getAllNotes(): Promise<TreeItem[]> {
    const validation = ConfigManager.validateConfig();
    if (!validation.valid) {
      await this.setContext(CONTEXT_HAS_ERROR, true);
      return [];
    }

    try {
      const client = getApiClient();
      const notes = await client.notes.list();

      const items = notes.map((note) => ({
        id: note.id,
        label: note.title || note.id,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        type: 'note' as NoteItem,
      }));

      return items;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      const errItems: TreeItem[] = [
        {
          id: '1',
          label: I18n.t('extension.tree.error.requestFailed'),
          type: 'error',
          collapsibleState: vscode.TreeItemCollapsibleState.None,
        },

        {
          id: '2',
          label: I18n.t('extension.tree.error.label', errorMsg),
          collapsibleState: vscode.TreeItemCollapsibleState.None,
        },
      ];
      return errItems;
    }
  }
  private async setContext(key: string, value: any) {
    await vscode.commands.executeCommand('setContext', key, value);
  }
}
