import * as vscode from 'vscode';

export class OpenWebUIModelChatProvider
  implements vscode.LanguageModelChatProvider
{
  onDidChangeLanguageModelChatInformation?: vscode.Event<void> | undefined;
  provideLanguageModelChatInformation(
    options: vscode.PrepareLanguageModelChatModelOptions,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.LanguageModelChatInformation[]> {
    throw new Error('Method not implemented.');
  }
  provideLanguageModelChatResponse(
    model: vscode.LanguageModelChatInformation,
    messages: readonly vscode.LanguageModelChatRequestMessage[],
    options: vscode.ProvideLanguageModelChatResponseOptions,
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    token: vscode.CancellationToken,
  ): Thenable<void> {
    throw new Error('Method not implemented.');
  }
  provideTokenCount(
    model: vscode.LanguageModelChatInformation,
    text: string | vscode.LanguageModelChatRequestMessage,
    token: vscode.CancellationToken,
  ): Thenable<number> {
    throw new Error('Method not implemented.');
  }
}
