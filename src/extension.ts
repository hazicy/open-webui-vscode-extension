import * as vscode from 'vscode';
import {
  ApiClientManager,
  StorageManager,
  ConfigManager,
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

  // Register language model chat provider
  const modelChatProvider = new OpenWebUIModelChatProvider();
  context.subscriptions.push(
    vscode.lm.registerLanguageModelChatProvider(
      'open-webui',
      modelChatProvider,
    ),
  );

  // Handle configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (ConfigManager.affectsApiConfig(e)) {
        ApiClientManager.recreateClient();
        notesTreeProvider.refresh();
        modelChatProvider.refresh();
        vscode.window.showInformationMessage(
          I18n.t('extension.command.configuration.updated'),
        );
      }
    }),
  );

  // Note: Yjs handles automatic synchronization, so manual save listener is no longer needed
  // When a document is modified, Yjs automatically syncs changes to the server
}

export function deactivate() {
  // Cleanup is handled by VSCode's disposable management
}
