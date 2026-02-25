import * as vscode from 'vscode';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  API: {
    BASE_URL: 'http://127.0.0.1:3000',
    TOKEN: '',
  },
  CACHE: {
    ENABLED: true,
    TTL: 300000, // 5 minutes
  },
} as const;

/**
 * Configuration section keys
 */
export const CONFIG_KEYS = {
  BASE_URL: 'api.baseUrl',
  TOKEN: 'api.token',
  CACHE_ENABLED: 'cache.enabled',
  CACHE_TTL: 'cache.ttl',
} as const;

/**
 * VSCode configuration wrapper
 */
export class VscodeConfig {
  private static readonly SECTION = 'openwebui';

  static get<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    return config.get<T>(key, defaultValue);
  }

  static async update(key: string, value: any, global = true): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    await config.update(key, value, global);
  }

  static onDidChange(
    callback: (e: vscode.ConfigurationChangeEvent) => void
  ): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(callback);
  }
}
