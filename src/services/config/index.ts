import { ApiConfig } from '../../types';
import { DEFAULT_CONFIG, VscodeConfig, CONFIG_KEYS } from './schema';
import vscode from 'vscode';

/**
 * Configuration Manager
 * Centralized configuration access with validation
 */
export class ConfigManager {
  /**
   * Get complete API configuration
   */
  static getApiConfig(): ApiConfig {
    return {
      baseUrl: VscodeConfig.get(
        CONFIG_KEYS.BASE_URL,
        DEFAULT_CONFIG.API.BASE_URL,
      ),
      apiToken: VscodeConfig.get(CONFIG_KEYS.TOKEN, DEFAULT_CONFIG.API.TOKEN),
    };
  }

  /**
   * Validate if configuration is complete
   */
  static validateConfig(): { valid: boolean; error?: string } {
    const config = this.getApiConfig();

    if (!config.apiToken) {
      return {
        valid: false,
        error: 'API token is missing. Please configure it in settings.',
      };
    }

    return { valid: true };
  }

  /**
   * Get cache configuration
   */
  static getCacheConfig(): { enabled: boolean; ttl: number } {
    return {
      enabled: VscodeConfig.get(
        CONFIG_KEYS.CACHE_ENABLED,
        DEFAULT_CONFIG.CACHE.ENABLED,
      ),
      ttl: VscodeConfig.get(CONFIG_KEYS.CACHE_TTL, DEFAULT_CONFIG.CACHE.TTL),
    };
  }

  /**
   * Check if configuration affects API settings
   */
  static affectsApiConfig(event: vscode.ConfigurationChangeEvent): boolean {
    return (
      event.affectsConfiguration(`openwebui.${CONFIG_KEYS.BASE_URL}`) ||
      event.affectsConfiguration(`openwebui.${CONFIG_KEYS.TOKEN}`)
    );
  }

  /**
   * Open VSCode settings for this extension
   */
  static async openSettings(): Promise<void> {
    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      'openwebui.api',
    );
  }
}
