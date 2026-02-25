import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Supported locales
 */
export const SUPPORTED_LOCALES = {
  ZH_CN: 'zh-cn',
  EN: 'en',
} as const;

type LocaleKey = keyof typeof SUPPORTED_LOCALES;

/**
 * Internationalization Manager
 */
export class I18n {
  private static bundle: Record<string, string> = {};
  private static currentLocale: string = 'en';

  /**
   * Initialize i18n based on VSCode locale
   */
  static initialize(context: vscode.ExtensionContext): void {
    const vscodeLocale = vscode.env.language || 'en';
    this.currentLocale = this.resolveLocale(vscodeLocale);

    const bundlePath = this.getBundlePath(
      context.extensionUri.fsPath,
      this.currentLocale,
    );

    try {
      const bundleContent = fs.readFileSync(bundlePath, 'utf-8');
      this.bundle = JSON.parse(bundleContent);
    } catch (error) {
      console.warn(
        `Failed to load localization bundle from ${bundlePath}`,
        error,
      );
      this.bundle = {};
    }
  }

  /**
   * Get localized string by key
   * Supports placeholder replacement: {0}, {1}, etc.
   */
  static localize(key: string, ...args: (string | number)[]): string {
    let message = this.bundle[key] || key;

    // Replace placeholders with arguments
    args.forEach((arg, index) => {
      message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
    });

    return message;
  }

  /**
   * Shorthand for localize
   */
  static t(key: string, ...args: (string | number)[]): string {
    return this.localize(key, ...args);
  }

  /**
   * Get current locale
   */
  static getCurrentLocale(): string {
    return this.currentLocale;
  }

  /**
   * Resolve locale to supported locale
   */
  private static resolveLocale(locale: string): string {
    if (locale.startsWith('zh')) {
      return SUPPORTED_LOCALES.ZH_CN;
    }
    return SUPPORTED_LOCALES.EN;
  }

  /**
   * Get bundle file path for locale
   */
  private static getBundlePath(extensionPath: string, locale: string): string {
    const filename =
      locale === SUPPORTED_LOCALES.ZH_CN
        ? 'bundle.l10n.zh-cn.json'
        : 'bundle.l10n.json';

    return path.join(extensionPath, 'l10n', filename);
  }
}

/**
 * Convenience functions
 */
export const localize = (key: string, ...args: (string | number)[]) =>
  I18n.localize(key, ...args);
export const t = (key: string, ...args: (string | number)[]) =>
  I18n.t(key, ...args);
