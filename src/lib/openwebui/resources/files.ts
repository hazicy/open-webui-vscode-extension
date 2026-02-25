import { HttpClient } from '../http-client';

/**
 * Files Resource
 * Manages file uploads and downloads in Open WebUI
 */
export class FilesResource {
  constructor(private httpClient: HttpClient) {}

  /**
   * Upload a file
   */
  async upload(file: File | FormData): Promise<{ url: string; name: string }> {
    let formData: FormData;

    if (file instanceof FormData) {
      formData = file;
    } else {
      formData = new FormData();
      formData.append('file', file);
    }

    return this.httpClient.post<{ url: string; name: string }>('/api/v1/files/upload', formData as any);
  }

  /**
   * Get file info
   */
  async get(fileId: string): Promise<unknown> {
    return this.httpClient.get(`/api/v1/files/${fileId}`);
  }

  /**
   * Delete a file
   */
  async delete(fileId: string): Promise<void> {
    return this.httpClient.delete<void>(`/api/v1/files/${fileId}`);
  }

  /**
   * List all files
   */
  async list(): Promise<unknown> {
    return this.httpClient.get('/api/v1/files');
  }
}
