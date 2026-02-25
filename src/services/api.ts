import { OpenWebUIClient } from '../lib/openwebui';
import { ConfigManager } from './config';

/**
 * API Client Manager
 * Manages the OpenWebUIClient lifecycle and configuration
 */
export class ApiClientManager {
  private static client: OpenWebUIClient | null = null;

  /**
   * Get or create the API client instance
   */
  static getClient(): OpenWebUIClient {
    if (!this.client) {
      this.client = this.createClient();
    }
    return this.client;
  }

  /**
   * Create a new API client instance
   */
  private static createClient(): OpenWebUIClient {
    const config = ConfigManager.getApiConfig();

    return new OpenWebUIClient({
      baseURL: config.baseUrl,
      apiKey: config.apiToken,
      timeout: 30000,
    });
  }

  /**
   * Recreate the API client instance
   * Call this after configuration changes
   */
  static recreateClient(): void {
    this.client = this.createClient();
  }

  /**
   * Reset the client (for testing or cleanup)
   */
  static resetClient(): void {
    this.client = null;
  }
}

// Export singleton instance getter
export const getApiClient = () => ApiClientManager.getClient();

// Export type
export type { OpenWebUIClient } from '../lib/openwebui';
