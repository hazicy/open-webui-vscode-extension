import { HttpClient } from '../http-client';
import type {
  OpenAIConfig,
  OpenAIModel,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from '../types';

export class OpenAIResource {
  constructor(private httpClient: HttpClient) {}

  // Config endpoints
  async getConfig(): Promise<unknown> {
    return this.httpClient.get('/openai/config');
  }

  async updateConfig(config: OpenAIConfig): Promise<unknown> {
    return this.httpClient.post('/openai/config/update', config);
  }

  async verifyConnection(config: OpenAIConfig): Promise<unknown> {
    return this.httpClient.post('/openai/verify', config);
  }

  // Model endpoints
  async getModels(urlIdx?: number): Promise<OpenAIModel[]> {
    const result = await this.httpClient.get<{ data: OpenAIModel[] }>(
      urlIdx !== undefined ? `/openai/models/{urlIdx}` : '/openai/models',
      urlIdx !== undefined ? {} : { url_idx: urlIdx },
    );
    return result.data || [];
  }

  // Chat endpoints
  async createChatCompletion(
    request: ChatCompletionRequest,
    bypassFilter?: boolean,
    bypassSystemPrompt?: boolean,
  ): Promise<ChatCompletionResponse> {
    return this.httpClient.post<ChatCompletionResponse>(
      '/openai/chat/completions',
      request,
      {
        bypass_filter: bypassFilter,
        bypass_system_prompt: bypassSystemPrompt,
      },
    );
  }

  // Audio endpoints
  async speech(request: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/openai/audio/speech', request);
  }

  // Responses endpoint
  async responses(request: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/openai/responses', request);
  }

  // Deprecated proxy endpoint
  async proxy(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<unknown> {
    switch (method) {
      case 'GET':
        return this.httpClient.get(`/openai/${path}`);
      case 'POST':
        return this.httpClient.post(`/openai/${path}`, body);
      case 'PUT':
        return this.httpClient.patch(`/openai/${path}`, body);
      case 'DELETE':
        return this.httpClient.delete(`/openai/${path}`);
    }
  }
}
