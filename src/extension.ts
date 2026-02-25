import * as vscode from 'vscode';
import {
  ApiClientManager,
  StorageManager,
  ConfigManager,
  NoteSyncManager,
} from './services';
import { I18n } from './utils';
import { registerCommands } from './commands';
import { NotesFSProvider } from './providers/notesFSProvider';
import { NotesTreeProvider } from './providers/notesTreeProvider';
import { OpenWebUIModelChatProvider } from './providers/modelChatProvider';

const FS_SCHEMA = 'openwebui';

export function activate(context: vscode.ExtensionContext) {
  // Initialize services
  I18n.initialize(context);
  StorageManager.initialize(context);

  // Register file system provider
  const noteFSProvider = new NotesFSProvider();
  const noteManager = new NoteSyncManager(noteFSProvider);

  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(FS_SCHEMA, noteFSProvider, {
      isCaseSensitive: true,
      isReadonly: false,
    }),
  );

  // Register tree data provider
  const notesTreeProvider = new NotesTreeProvider();
  vscode.window.registerTreeDataProvider('objectsView', notesTreeProvider);

  // Register commands
  registerCommands(context, notesTreeProvider, noteFSProvider);

  // Handle configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (ConfigManager.affectsApiConfig(e)) {
        ApiClientManager.recreateClient();
        notesTreeProvider.refresh();
        vscode.window.showInformationMessage(
          I18n.t('extension.command.configuration.updated'),
        );
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
      if (document.uri.scheme !== FS_SCHEMA) {
        return;
      }

      const note = NoteSyncManager.getMapping(document.uri.fsPath);
      if (!note) {
        return;
      }

      const { noteId, title } = note;

      noteManager.saveNote(noteId, document.getText(), title);
    }),
  );

  vscode.lm.registerLanguageModelChatProvider(
    'open-webui',
    new OpenWebUIModelChatProvider(),
  );
}

export function deactivate() {
  // Cleanup is handled by VSCode's disposable management
}
