import { HttpClient } from '../http-client';
import type { ImagesConfig, CreateImageForm } from '../types';

export class ImagesResource {
  constructor(private httpClient: HttpClient) {}

  // Config
  async getConfig(): Promise<ImagesConfig> {
    return this.httpClient.get<ImagesConfig>('/api/v1/images/config');
  }

  async updateConfig(config: ImagesConfig): Promise<unknown> {
    return this.httpClient.post('/api/v1/images/config/update', config);
  }

  async verifyUrl(url: string): Promise<unknown> {
    return this.httpClient.get('/api/v1/images/config/url/verify', { url });
  }

  // Models
  async getModels(): Promise<unknown> {
    return this.httpClient.get('/api/v1/images/models');
  }

  // Generation
  async generate(form: CreateImageForm): Promise<unknown> {
    return this.httpClient.post('/api/v1/images/generations', form);
  }

  async edit(form: FormData): Promise<unknown> {
    return this.httpClient.post('/api/v1/images/edit', form);
  }
}
