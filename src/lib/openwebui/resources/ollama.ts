import { HttpClient } from '../http-client';
import type {
  OllamaModel,
  OllamaConfig,
  ModelNameForm,
  CopyModelForm,
  CreateModelForm,
  PushModelForm,
  GenerateCompletionForm,
  GenerateChatCompletionForm,
  GenerateEmbedForm,
  GenerateEmbeddingsForm,
} from '../types';

export class OllamaResource {
  constructor(private httpClient: HttpClient) {}

  // Status endpoints
  async getStatus(): Promise<unknown> {
    return this.httpClient.get('/ollama/');
  }

  // Config endpoints
  async getConfig(): Promise<unknown> {
    return this.httpClient.get('/ollama/config');
  }

  async updateConfig(config: OllamaConfig): Promise<unknown> {
    return this.httpClient.post('/ollama/config/update', config);
  }

  async verifyConnection(config: OllamaConfig): Promise<unknown> {
    return this.httpClient.post('/ollama/verify', config);
  }

  // Model endpoints
  async getTags(urlIdx?: number): Promise<{ models: OllamaModel[] }> {
    return this.httpClient.get('/ollama/api/tags', urlIdx !== undefined ? { url_idx: urlIdx } : undefined);
  }

  async getLoadedModels(): Promise<{ models: OllamaModel[] }> {
    return this.httpClient.get('/ollama/api/ps');
  }

  async getVersion(urlIdx?: number): Promise<{ version: string }> {
    return this.httpClient.get('/ollama/api/version', urlIdx !== undefined ? { url_idx: urlIdx } : undefined);
  }

  async pullModel(name: string, urlIdx?: number): Promise<unknown> {
    return this.httpClient.post(
      urlIdx !== undefined ? `/ollama/api/pull/{urlIdx}` : '/ollama/api/pull',
      { name },
      urlIdx !== undefined ? {} : { url_idx: urlIdx || 0 },
    );
  }

  async pushModel(form: PushModelForm, urlIdx?: number): Promise<unknown> {
    return this.httpClient.delete(
      urlIdx !== undefined ? `/ollama/api/push/{urlIdx}` : '/ollama/api/push',
      form,
      urlIdx !== undefined ? {} : { url_idx: urlIdx },
    );
  }

  async createModel(form: CreateModelForm, urlIdx?: number): Promise<unknown> {
    return this.httpClient.post(
      urlIdx !== undefined ? `/ollama/api/create/{urlIdx}` : '/ollama/api/create',
      form,
      urlIdx !== undefined ? {} : { url_idx: urlIdx || 0 },
    );
  }

  async copyModel(form: CopyModelForm, urlIdx?: number): Promise<unknown> {
    return this.httpClient.post(
      urlIdx !== undefined ? `/ollama/api/copy/{urlIdx}` : '/ollama/api/copy',
      form,
      urlIdx !== undefined ? {} : { url_idx: urlIdx },
    );
  }

  async deleteModel(name: string, urlIdx?: number): Promise<unknown> {
    return this.httpClient.delete(
      urlIdx !== undefined ? `/ollama/api/delete/{urlIdx}` : '/ollama/api/delete',
      { name },
      urlIdx !== undefined ? {} : { url_idx: urlIdx },
    );
  }

  async showModelInfo(name: string): Promise<unknown> {
    return this.httpClient.post('/ollama/api/show', { name });
  }

  async unloadModel(name: string): Promise<unknown> {
    return this.httpClient.post('/ollama/api/unload', { name });
  }

  // Generation endpoints
  async generateCompletion(form: GenerateCompletionForm, urlIdx?: number): Promise<unknown> {
    return this.httpClient.post(
      urlIdx !== undefined ? `/ollama/api/generate/{urlIdx}` : '/ollama/api/generate',
      form,
      urlIdx !== undefined ? {} : { url_idx: urlIdx },
    );
  }

  async generateChatCompletion(form: GenerateChatCompletionForm, urlIdx?: number): Promise<unknown> {
    return this.httpClient.post(
      urlIdx !== undefined ? `/ollama/api/chat/{urlIdx}` : '/ollama/api/chat',
      form,
      urlIdx !== undefined ? {} : { url_idx: urlIdx },
    );
  }

  async generateOpenAICompletion(form: Record<string, unknown>, urlIdx?: number): Promise<unknown> {
    return this.httpClient.post(
      urlIdx !== undefined ? `/ollama/v1/completions/{urlIdx}` : '/ollama/v1/completions',
      form,
      urlIdx !== undefined ? {} : { url_idx: urlIdx },
    );
  }

  async generateOpenAIChatCompletion(form: Record<string, unknown>, urlIdx?: number): Promise<unknown> {
    return this.httpClient.post(
      urlIdx !== undefined ? `/ollama/v1/chat/completions/{urlIdx}` : '/ollama/v1/chat/completions',
      form,
      urlIdx !== undefined ? {} : { url_idx: urlIdx },
    );
  }

  async getOpenAIModels(urlIdx?: number): Promise<unknown> {
    return this.httpClient.get(
      urlIdx !== undefined ? `/ollama/v1/models/{urlIdx}` : '/ollama/v1/models',
      urlIdx !== undefined ? {} : { url_idx: urlIdx },
    );
  }

  // Embeddings
  async embed(form: GenerateEmbedForm, urlIdx?: number): Promise<unknown> {
    return this.httpClient.post(
      urlIdx !== undefined ? `/ollama/api/embed/{urlIdx}` : '/ollama/api/embed',
      form,
      urlIdx !== undefined ? {} : { url_idx: urlIdx },
    );
  }

  async embeddings(form: GenerateEmbeddingsForm, urlIdx?: number): Promise<unknown> {
    return this.httpClient.post(
      urlIdx !== undefined ? `/ollama/api/embeddings/{urlIdx}` : '/ollama/api/embeddings',
      form,
      urlIdx !== undefined ? {} : { url_idx: urlIdx },
    );
  }
}
