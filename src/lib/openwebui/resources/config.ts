import { HttpClient } from '../http-client';

/**
 * Config Types
 */
export interface GlobalConfig {
  // General settings
  enabled?: boolean;
  name?: string;
  description?: string;

  // Feature flags
  features?: {
    image_generation?: boolean;
    speech_to_text?: boolean;
    text_to_speech?: boolean;
    retrieval?: boolean;
    pipelines?: boolean;
  };

  // Default models
  defaults?: {
    chat_model?: string;
    image_model?: string;
    embedding_model?: string;
    speech_model?: string;
  };
}

/**
 * Config Resource
 * Manages global Open WebUI configuration
 */
export class ConfigResource {
  constructor(private httpClient: HttpClient) {}

  /**
   * Get global configuration
   */
  async get(): Promise<GlobalConfig> {
    return this.httpClient.get<GlobalConfig>('/api/v1/config');
  }

  /**
   * Update global configuration
   */
  async update(config: Partial<GlobalConfig>): Promise<GlobalConfig> {
    return this.httpClient.post<GlobalConfig>('/api/v1/config/update', config);
  }

  /**
   * Reset configuration to defaults
   */
  async reset(): Promise<GlobalConfig> {
    return this.httpClient.post<GlobalConfig>('/api/v1/config/reset', {});
  }

  /**
   * Get all feature flags
   */
  async getFeatures(): Promise<GlobalConfig['features']> {
    const config = await this.get();
    return config.features || {};
  }

  /**
   * Update a specific feature flag
   */
  async updateFeature(feature: string, enabled: boolean): Promise<GlobalConfig> {
    return this.update({
      features: {
        [feature]: enabled,
      },
    });
  }
}
