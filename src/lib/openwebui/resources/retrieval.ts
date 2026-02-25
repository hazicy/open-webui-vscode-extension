import { HttpClient } from '../http-client';
import type {
  EmbeddingModelUpdateForm,
  ConfigForm,
  ProcessFileForm,
  ProcessTextForm,
  ProcessWebForm,
} from '../types';

export class RetrievalResource {
  constructor(private httpClient: HttpClient) {}

  // Status
  async getStatus(): Promise<unknown> {
    return this.httpClient.get('/api/v1/retrieval/');
  }

  // Embedding config
  async getEmbeddingConfig(): Promise<unknown> {
    return this.httpClient.get('/api/v1/retrieval/embedding');
  }

  async updateEmbeddingConfig(form: EmbeddingModelUpdateForm): Promise<unknown> {
    return this.httpClient.post('/api/v1/retrieval/embedding/update', form);
  }

  // RAG config
  async getRagConfig(): Promise<unknown> {
    return this.httpClient.get('/api/v1/retrieval/config');
  }

  async updateRagConfig(form: ConfigForm): Promise<unknown> {
    return this.httpClient.post('/api/v1/retrieval/config/update', form);
  }

  // Process content
  async processFile(form: ProcessFileForm): Promise<unknown> {
    return this.httpClient.post('/api/v1/retrieval/process/file', form);
  }

  async processText(form: ProcessTextForm): Promise<unknown> {
    return this.httpClient.post('/api/v1/retrieval/process/text', form);
  }

  async processWeb(form: ProcessWebForm): Promise<unknown> {
    return this.httpClient.post('/api/v1/retrieval/process/web', form);
  }

  async processUrl(form: ProcessWebForm): Promise<unknown> {
    return this.httpClient.post('/api/v1/retrieval/process/url', form);
  }
}
