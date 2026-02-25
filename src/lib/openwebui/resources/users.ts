import { HttpClient } from '../http-client';

/**
 * User Types
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface UpdateUserForm {
  email?: string;
  name?: string;
  password?: string;
  role?: 'admin' | 'user';
}

/**
 * Users Resource
 * Manages user accounts in Open WebUI
 */
export class UsersResource {
  constructor(private httpClient: HttpClient) {}

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    return this.httpClient.get<User>('/api/v1/users/me');
  }

  /**
   * Update current user profile
   */
  async updateProfile(form: UpdateUserForm): Promise<User> {
    return this.httpClient.patch<User>('/api/v1/users/me', form);
  }

  /**
   * List all users (admin only)
   */
  async list(): Promise<User[]> {
    const result = await this.httpClient.get<{ users: User[] }>('/api/v1/users');
    return result.users || [];
  }

  /**
   * Get a specific user by ID (admin only)
   */
  async get(id: string): Promise<User> {
    return this.httpClient.get<User>(`/api/v1/users/${id}`);
  }

  /**
   * Update a user (admin only)
   */
  async update(id: string, form: UpdateUserForm): Promise<User> {
    return this.httpClient.patch<User>(`/api/v1/users/${id}`, form);
  }

  /**
   * Delete a user (admin only)
   */
  async delete(id: string): Promise<void> {
    return this.httpClient.delete<void>(`/api/v1/users/${id}`);
  }
}
