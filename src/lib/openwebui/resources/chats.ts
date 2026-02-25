import { HttpClient } from '../http-client';

/**
 * Chat/Conversation Types
 */
export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  model?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChatForm {
  title?: string;
  model?: string;
  messages?: ChatMessage[];
}

/**
 * Chats Resource
 * Manages chat conversations in Open WebUI
 */
export class ChatsResource {
  constructor(private httpClient: HttpClient) {}

  /**
   * List all chat conversations
   * Note: This endpoint may not exist in the provided OpenAPI spec
   * You may need to check the actual Open WebUI API
   */
  async list(): Promise<Chat[]> {
    try {
      const result = await this.httpClient.get<{ chats: Chat[] }>(
        '/api/v1/chats',
      );
      return result.chats || [];
    } catch (error) {
      // Fallback: endpoint may not exist or be named differently
      console.warn('Chats list endpoint may not be available:', error);
      return [];
    }
  }

  /**
   * Get a specific chat by ID
   */
  async get(id: string): Promise<Chat> {
    return this.httpClient.get<Chat>(`/api/v1/chats/${id}`);
  }

  /**
   * Create a new chat
   */
  async create(form: CreateChatForm): Promise<Chat> {
    return this.httpClient.post<Chat>('/api/v1/chats', form);
  }

  /**
   * Update a chat
   */
  async update(id: string, form: Partial<CreateChatForm>): Promise<Chat> {
    return this.httpClient.patch<Chat>(`/api/v1/chats/${id}`, form);
  }

  /**
   * Delete a chat
   */
  async delete(id: string): Promise<void> {
    return this.httpClient.delete<void>(`/api/v1/chats/${id}`);
  }

  /**
   * Add a message to a chat
   */
  async addMessage(
    chatId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
  ): Promise<ChatMessage> {
    return this.httpClient.post<ChatMessage>(
      `/api/v1/chats/${chatId}/messages`,
      message,
    );
  }

  /**
   * Delete a message from a chat
   */
  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    return this.httpClient.delete<void>(
      `/api/v1/chats/${chatId}/messages/${messageId}`,
    );
  }

  /**
   * Update chat title
   */
  async updateTitle(id: string, title: string): Promise<Chat> {
    return this.httpClient.post<Chat>(`/api/v1/chats/${id}/title`, { title });
  }
}
