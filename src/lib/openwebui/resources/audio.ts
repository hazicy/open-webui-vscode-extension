import { HttpClient } from '../http-client';
import type { AudioConfig, AudioConfigUpdateForm } from '../types';

export class AudioResource {
  constructor(private httpClient: HttpClient) {}

  // Config
  async getAudioConfig(): Promise<AudioConfig> {
    return this.httpClient.get<AudioConfig>('/api/v1/audio/config');
  }

  async updateAudioConfig(form: AudioConfigUpdateForm): Promise<unknown> {
    return this.httpClient.post('/api/v1/audio/config/update', form);
  }

  // Speech
  async speech(request: Record<string, unknown>): Promise<unknown> {
    return this.httpClient.post('/api/v1/audio/speech', request);
  }

  // Transcription
  async transcribe(formData: FormData): Promise<unknown> {
    return this.httpClient.post('/api/v1/audio/transcriptions', formData);
  }

  // Models
  async getModels(): Promise<unknown> {
    return this.httpClient.get('/api/v1/audio/models');
  }

  // Voices
  async getVoices(): Promise<unknown> {
    return this.httpClient.get('/api/v1/audio/voices');
  }
}
