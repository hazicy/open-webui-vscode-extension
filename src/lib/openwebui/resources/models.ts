import { HttpClient } from '../http-client';

/**
 * Model Types
 */
export interface Model {
  id: string;
  name: string;
  type: 'ollama' | 'openai' | 'pipeline';
  base_url?: string;
  size?: number;
  modified_at?: string;
  details?: {
    format?: string;
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface PullModelForm {
  name: string;
  url_idx?: number;
}

export interface DeleteModelForm {
  name: string;
  url_idx?: number;
}

/**
 * Models Resource
 * Unified model management for Ollama, OpenAI, and Pipelines
 */
export class ModelsResource {
  constructor(private httpClient: HttpClient) {}

  /**
   * List all models from all sources
   */
  async list(): Promise<Model[]> {
    try {
      // Get Ollama models
      const ollamaResult = await this.httpClient.get<{ models: any[] }>('/ollama/api/tags');
      const ollamaModels = (ollamaResult.models || []).map((m: any) => ({
        ...m,
        type: 'ollama' as const,
      }));

      // Get OpenAI models
      const openaiResult = await this.httpClient.get<{ data: any[] }>('/openai/models');
      const openaiModels = (openaiResult.data || []).map((m: any) => ({
        id: m.id,
        name: m.id,
        type: 'openai' as const,
        ...m,
      }));

      return [...ollamaModels, ...openaiModels];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  /**
   * Get models by type
   */
  async listByType(type: 'ollama' | 'openai' | 'pipeline'): Promise<Model[]> {
    const allModels = await this.list();
    return allModels.filter((m) => m.type === type);
  }

  /**
   * Pull/download an Ollama model
   */
  async pull(form: PullModelForm): Promise<unknown> {
    return this.httpClient.post('/ollama/api/pull', { name: form.name }, form.url_idx !== undefined ? { url_idx: form.url_idx } : undefined);
  }

  /**
   * Delete a model
   */
  async delete(form: DeleteModelForm): Promise<unknown> {
    return this.httpClient.delete('/ollama/api/delete', { name: form.name }, form.url_idx !== undefined ? { url_idx: form.url_idx } : undefined);
  }

  /**
   * Get model info
   */
  async getInfo(name: string): Promise<unknown> {
    return this.httpClient.post('/ollama/api/show', { name });
  }

  /**
   * Get loaded models in memory
   */
  async getLoaded(): Promise<unknown> {
    return this.httpClient.get('/ollama/api/ps');
  }

  /**
   * Unload a model from memory
   */
  async unload(name: string): Promise<unknown> {
    return this.httpClient.post('/ollama/api/unload', { name });
  }

  /**
   * Verify Ollama connection
   */
  async verifyOllama(baseUrl: string): Promise<unknown> {
    return this.httpClient.post('/ollama/verify', { base_url: baseUrl });
  }

  /**
   * Get Ollama config
   */
  async getOllamaConfig(): Promise<unknown> {
    return this.httpClient.get('/ollama/config');
  }

  /**
   * Update Ollama config
   */
  async updateOllamaConfig(config: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/ollama/config/update', config);
  }
}
