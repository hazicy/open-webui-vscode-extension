import { HttpClient } from '../http-client';
import type { Pipeline, AddPipelineForm, DeletePipelineForm } from '../types';

export class PipelinesResource {
  constructor(private httpClient: HttpClient) {}

  async getList(): Promise<{ pipelines: Pipeline[] }> {
    return this.httpClient.get('/api/v1/pipelines/list');
  }

  async upload(formData: FormData): Promise<unknown> {
    return this.httpClient.post('/api/v1/pipelines/upload', formData);
  }

  async add(form: AddPipelineForm): Promise<unknown> {
    return this.httpClient.post('/api/v1/pipelines/add', form);
  }

  async delete(form: DeletePipelineForm): Promise<unknown> {
    return this.httpClient.delete('/api/v1/pipelines/delete', form);
  }

  async getPipelines(urlIdx?: number): Promise<Pipeline[]> {
    const result = await this.httpClient.get<{ pipelines: Pipeline[] }>(
      '/api/v1/pipelines/',
      urlIdx !== undefined ? { urlIdx } : undefined,
    );
    return result.pipelines || [];
  }

  async getValves(pipelineId: string, urlIdx: number): Promise<unknown> {
    return this.httpClient.get(`/api/v1/pipelines/${pipelineId}/valves`, { urlIdx });
  }

  async getValvesSpec(pipelineId: string, urlIdx: number): Promise<unknown> {
    return this.httpClient.get(`/api/v1/pipelines/${pipelineId}/valves/spec`, { urlIdx });
  }

  async updateValves(pipelineId: string, urlIdx: number, valves: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post(`/api/v1/pipelines/${pipelineId}/valves/update`, valves, { urlIdx });
  }
}
