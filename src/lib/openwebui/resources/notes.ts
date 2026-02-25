import { HttpClient } from '../http-client';

/**
 * Note Types
 */
export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  access_control?: NoteAccessControl;
  tags?: string[];
  folder_id?: string;
  is_pinned?: boolean;
}

export interface NoteAccessControl {
  access_type: 'private' | 'public' | 'shared';
  user_ids?: string[];
  group_ids?: string[];
}

export interface NoteForm {
  title: string;
  data: Record<string, any>;
  meta: Record<string, any> | null;
  access_grants: Record<string, any>[] | null;
}

export interface NoteAccessGrantsForm {
  access_type: 'private' | 'public' | 'shared';
  user_ids?: string[];
  group_ids?: string[];
}

export interface NoteSearchOptions {
  query?: string;
  view_option?: string;
  permission?: string;
  order_by?: string;
  direction?: string;
  page?: number;
}

export interface NoteListResponse {
  notes: Note[];
  total: number;
  page: number;
  page_size: number;
}

export interface NoteResponse {
  note: Note;
}

export interface NoteItemResponse {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  access_control?: NoteAccessControl;
  tags?: string[];
  folder_id?: string;
  is_pinned?: boolean;
}

/**
 * Notes Resource
 * Manages notes and documents in Open WebUI
 */
export class NotesResource {
  constructor(private httpClient: HttpClient) {}

  /**
   * Get all notes with pagination
   * GET /api/v1/notes/
   */
  async list(page?: number): Promise<NoteItemResponse[]> {
    return this.httpClient.get<NoteItemResponse[]>(
      '/api/v1/notes/',
      page !== undefined ? { page } : undefined,
    );
  }

  /**
   * Search notes with filters
   * GET /api/v1/notes/search
   */
  async search(options: NoteSearchOptions = {}): Promise<NoteListResponse> {
    const params: Record<string, string | number | undefined> = {
      query: options.query,
      view_option: options.view_option,
      permission: options.permission,
      order_by: options.order_by,
      direction: options.direction,
      page: options.page ?? 1,
    };

    return this.httpClient.get<NoteListResponse>(
      '/api/v1/notes/search',
      Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined),
      ),
    );
  }

  /**
   * Get a specific note by ID
   * GET /api/v1/notes/{id}
   */
  async get(id: string): Promise<NoteResponse | null> {
    return this.httpClient.get<NoteResponse | null>(`/api/v1/notes/${id}`);
  }

  /**
   * Create a new note
   * POST /api/v1/notes/create
   */
  async create(form: NoteForm): Promise<Note | null> {
    return this.httpClient.post<Note | null>('/api/v1/notes/create', form);
  }

  /**
   * Update a note by ID
   * POST /api/v1/notes/{id}/update
   */
  async update(id: string, form: Partial<NoteForm>): Promise<Note | null> {
    return this.httpClient.post<Note | null>(
      `/api/v1/notes/${id}/update`,
      form,
    );
  }

  /**
   * Update note access control by ID
   * POST /api/v1/notes/{id}/access/update
   */
  async updateAccess(
    id: string,
    form: NoteAccessGrantsForm,
  ): Promise<Note | null> {
    return this.httpClient.post<Note | null>(
      `/api/v1/notes/${id}/access/update`,
      form,
    );
  }

  /**
   * Delete a note by ID
   * DELETE /api/v1/notes/{id}/delete
   */
  async delete(id: string): Promise<boolean> {
    return this.httpClient.delete<boolean>(`/api/v1/notes/${id}/delete`);
  }

  /**
   * Helper: Search notes by query string
   */
  async searchByTitle(query: string): Promise<NoteListResponse> {
    return this.search({ query, order_by: 'title', direction: 'asc' });
  }

  /**
   * Helper: Search notes by tag
   */
  async searchByTag(tag: string): Promise<NoteListResponse> {
    return this.search({ query: tag, view_option: 'tag' });
  }

  /**
   * Helper: Get pinned notes
   */
  async getPinned(): Promise<NoteListResponse> {
    return this.search({
      view_option: 'pinned',
      order_by: 'updated_at',
      direction: 'desc',
    });
  }

  /**
   * Helper: Get public notes
   */
  async getPublic(): Promise<NoteListResponse> {
    return this.search({
      permission: 'public',
      order_by: 'updated_at',
      direction: 'desc',
    });
  }

  /**
   * Helper: Get shared notes
   */
  async getShared(): Promise<NoteListResponse> {
    return this.search({
      permission: 'shared',
      order_by: 'updated_at',
      direction: 'desc',
    });
  }
}
