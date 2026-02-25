import { HttpClient } from '../http-client';
import type { TaskConfig, TaskConfigForm, ActiveChatsForm } from '../types';

export class TasksResource {
  constructor(private httpClient: HttpClient) {}

  // Active chats
  async checkActiveChats(form: ActiveChatsForm): Promise<unknown> {
    return this.httpClient.post('/api/v1/tasks/active/chats', form);
  }

  // Config
  async getConfig(): Promise<TaskConfig> {
    return this.httpClient.get<TaskConfig>('/api/v1/tasks/config');
  }

  async updateConfig(form: TaskConfigForm): Promise<unknown> {
    return this.httpClient.post('/api/v1/tasks/config/update', form);
  }

  // Title generation
  async generateTitle(request: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/api/v1/tasks/title/completions', request);
  }

  // Follow-ups
  async generateFollowUps(request: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/api/v1/tasks/follow_up/completions', request);
  }

  // Tags
  async generateChatTags(request: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/api/v1/tasks/tags/completions', request);
  }

  // Image prompt
  async generateImagePrompt(request: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/api/v1/tasks/image_prompt/completions', request);
  }

  // Queries
  async generateQueries(request: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/api/v1/tasks/queries/completions', request);
  }

  // Autocompletion
  async generateAutocompletion(request: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/api/v1/tasks/auto/completions', request);
  }

  // Emoji
  async generateEmoji(request: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/api/v1/tasks/emoji/completions', request);
  }

  // MoA (Mixture of Agents)
  async generateMoaResponse(request: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/api/v1/tasks/moa/completions', request);
  }
}
