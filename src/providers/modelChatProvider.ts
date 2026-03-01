import * as vscode from 'vscode';
import { ApiClientManager } from '../services/api';
import { ConfigManager } from '../services/config';
import { I18n } from '../utils';

/**
 * OpenWebUI Model Chat Provider
 * Implements VSCode's LanguageModelChatProvider interface for OpenWebUI
 */
export class OpenWebUIModelChatProvider
  implements vscode.LanguageModelChatProvider
{
  private readonly _onDidChangeLanguageModelChatInformation =
    new vscode.EventEmitter<void>();
  readonly onDidChangeLanguageModelChatInformation = this
    ._onDidChangeLanguageModelChatInformation.event;

  constructor() {}

  /**
   * Provide available language model information
   * Lists all models available from OpenWebUI
   */
  async provideLanguageModelChatInformation(
    options: vscode.PrepareLanguageModelChatModelOptions,
    token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelChatInformation[]> {
    try {
      // Validate configuration first
      const configValidation = ConfigManager.validateConfig();
      if (!configValidation.valid) {
        throw new Error(configValidation.error);
      }

      const client = ApiClientManager.getClient();
      const models = await client.models.list();

      return models.map(
        (model) =>
          ({
            id: model.id,
            name: model.name,
            vendor: 'open-webui',
            description: `${model.type} model - ${
              model.details?.family || model.name
            }`,
            maxInputTokens: model.size || 128000,
            maxOutputTokens: 4096,
            capabilities: {},
            version: model.details?.parameter_size,
            family: model.details?.family || model.type,
          }) as vscode.LanguageModelChatInformation,
      );
    } catch (error) {
      console.error('Failed to fetch models:', error);
      vscode.window.showErrorMessage(
        I18n.t('modelChatProvider.error.fetchModelsFailed'),
      );
      return [];
    }
  }

  /**
   * Provide language model chat response
   * Handles chat completion requests from VSCode
   */
  async provideLanguageModelChatResponse(
    model: vscode.LanguageModelChatInformation,
    messages: readonly vscode.LanguageModelChatRequestMessage[],
    options: vscode.ProvideLanguageModelChatResponseOptions,
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    token: vscode.CancellationToken,
  ): Promise<void> {
    try {
      // Validate configuration
      const configValidation = ConfigManager.validateConfig();
      if (!configValidation.valid) {
        throw new Error(configValidation.error);
      }

      // Convert VSCode messages to OpenAI format
      const chatMessages = this.convertMessagesToOpenAIFormat(messages);

      // Check for cancellation
      if (token.isCancellationRequested) {
        return;
      }

      // Create chat completion request
      const request = {
        model: model.id,
        messages: chatMessages,
        stream: true,
        temperature: options?.modelOptions?.['temperature'] || 0.7,
        max_tokens: options?.modelOptions?.['maxTokens'] || 4096,
      };

      // Make streaming request
      const response = await fetch(
        `${ConfigManager.getApiConfig().baseUrl}/openai/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ConfigManager.getApiConfig().apiToken}`,
          },
          body: JSON.stringify(request),
        },
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (token.isCancellationRequested) {
          reader.cancel();
          return;
        }

        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') {
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content;

              if (content) {
                progress.report({
                  type: 'text',
                  value: content,
                } as vscode.LanguageModelTextPart);
              }
            } catch (e) {
              console.error('Failed to parse streaming response:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat completion error:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      progress.report({
        type: 'text',
        value: `\n\n[Error: ${errorMessage}]`,
      } as vscode.LanguageModelTextPart);
      vscode.window.showErrorMessage(
        I18n.t('modelChatProvider.error.chatCompletionFailed'),
      );
    }
  }

  /**
   * Provide token count for text or messages
   * Estimates token count using a simple heuristic
   */
  provideTokenCount(
    model: vscode.LanguageModelChatInformation,
    text: string | vscode.LanguageModelChatRequestMessage,
    token: vscode.CancellationToken,
  ): Thenable<number> {
    // Simple token estimation: ~4 characters per token
    // This is a rough estimate; actual tokenization is model-specific
    let content = '';

    if (typeof text === 'string') {
      content = text;
    } else if ('text' in text) {
      content = text.text as string;
    } else {
      // For message parts, join all text content
      if (Array.isArray(text.content)) {
        content = text.content
          .filter((part): part is vscode.LanguageModelTextPart => part.type === 'text')
          .map((part) => part.value)
          .join(' ');
      } else {
        content = String(text.content);
      }
    }

    // Rough estimation: ~4 characters per token for English text
    const estimatedTokens = Math.ceil(content.length / 4);
    return Promise.resolve(estimatedTokens);
  }

  /**
   * Convert VSCode messages to OpenAI format
   */
  private convertMessagesToOpenAIFormat(
    messages: readonly vscode.LanguageModelChatRequestMessage[],
  ): Array<{ role: string; content: string }> {
    return messages.map((message) => {
      let content = '';

      if (typeof message.content === 'string') {
        content = message.content;
      } else if (Array.isArray(message.content)) {
        // Join all text parts
        content = message.content
          .filter((part): part is vscode.LanguageModelTextPart => part.type === 'text')
          .map((part) => part.value)
          .join('\n');
      }

      return {
        role: String(message.role),
        content,
      };
    });
  }

  /**
   * Trigger model list refresh event
   * Call this when available models change
   */
  refresh(): void {
    this._onDidChangeLanguageModelChatInformation.fire();
  }
}
