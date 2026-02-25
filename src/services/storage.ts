import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * File metadata
 */
export interface FileMetadata {
  path: string;
  size: number;
  created: number;
  modified: number;
}

/**
 * Cached item metadata
 */
export interface CachedItem {
  id: string;
  title: string;
  type: 'note' | 'chat' | 'model';
  path: string;
  cachedAt: number;
}

/**
 * Storage Manager
 * Manages file storage and caching for Open WebUI
 */
export class StorageManager {
  private static cacheDir: string;
  private static metadataFile: string;
  private static metadata: Map<string, CachedItem> = new Map();

  /**
   * Initialize storage manager
   */
  static initialize(context: vscode.ExtensionContext): void {
    this.cacheDir = path.join(context.globalStorageUri.fsPath, 'openwebui-cache');
    this.metadataFile = path.join(this.cacheDir, 'metadata.json');
    this.ensureCacheDir();
    this.loadMetadata();
  }

  /**
   * Get cache directory path
   */
  static getCacheDir(): string {
    return this.cacheDir;
  }

  /**
   * Ensure cache directory exists
   */
  private static ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Load metadata from disk
   */
  private static loadMetadata(): void {
    if (fs.existsSync(this.metadataFile)) {
      try {
        const data = fs.readFileSync(this.metadataFile, 'utf8');
        const items = JSON.parse(data) as CachedItem[];
        this.metadata = new Map(items.map((item) => [item.id, item]));
      } catch (error) {
        console.error('Failed to load metadata:', error);
        this.metadata = new Map();
      }
    }
  }

  /**
   * Save metadata to disk
   */
  private static saveMetadata(): void {
    try {
      const items = Array.from(this.metadata.values());
      fs.writeFileSync(this.metadataFile, JSON.stringify(items, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save metadata:', error);
    }
  }

  /**
   * Sanitize filename to be safe for filesystem
   */
  static sanitizeFilename(name: string): string {
    return name.replace(/[\\/:*?"<>|]/g, '_');
  }

  /**
   * Write note to cache
   */
  static writeNote(noteId: string, title: string, content: string): string {
    this.ensureCacheDir();

    const safeName = this.sanitizeFilename(title);
    const filePath = path.join(this.cacheDir, `notes/${safeName}.md`);

    // Ensure notes subdirectory exists
    const notesDir = path.join(this.cacheDir, 'notes');
    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, 'utf8');

    // Update metadata
    this.metadata.set(noteId, {
      id: noteId,
      title,
      type: 'note',
      path: filePath,
      cachedAt: Date.now(),
    });
    this.saveMetadata();

    return filePath;
  }

  /**
   * Read note from cache
   */
  static readNote(noteId: string): { content: string; title: string } | null {
    const metadata = this.metadata.get(noteId);
    if (!metadata || metadata.type !== 'note') {
      return null;
    }

    if (!fs.existsSync(metadata.path)) {
      this.metadata.delete(noteId);
      this.saveMetadata();
      return null;
    }

    const content = fs.readFileSync(metadata.path, 'utf8');
    return { content, title: metadata.title };
  }

  /**
   * Write chat to cache
   */
  static writeChat(chatId: string, title: string, content: string): string {
    this.ensureCacheDir();

    const safeName = this.sanitizeFilename(title);
    const filePath = path.join(this.cacheDir, `chats/${safeName}.json`);

    // Ensure chats subdirectory exists
    const chatsDir = path.join(this.cacheDir, 'chats');
    if (!fs.existsSync(chatsDir)) {
      fs.mkdirSync(chatsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, 'utf8');

    // Update metadata
    this.metadata.set(chatId, {
      id: chatId,
      title,
      type: 'chat',
      path: filePath,
      cachedAt: Date.now(),
    });
    this.saveMetadata();

    return filePath;
  }

  /**
   * Read chat from cache
   */
  static readChat(chatId: string): { content: string; title: string } | null {
    const metadata = this.metadata.get(chatId);
    if (!metadata || metadata.type !== 'chat') {
      return null;
    }

    if (!fs.existsSync(metadata.path)) {
      this.metadata.delete(chatId);
      this.saveMetadata();
      return null;
    }

    const content = fs.readFileSync(metadata.path, 'utf8');
    return { content, title: metadata.title };
  }

  /**
   * Write file to cache (generic)
   */
  static writeFile(filename: string, content: string): string {
    this.ensureCacheDir();

    const safeName = this.sanitizeFilename(filename);
    const filePath = path.join(this.cacheDir, `${safeName}.md`);

    fs.writeFileSync(filePath, content, 'utf8');

    return filePath;
  }

  /**
   * Read file from cache (generic)
   */
  static readFile(filename: string): string | null {
    const safeName = this.sanitizeFilename(filename);
    const filePath = path.join(this.cacheDir, `${safeName}.md`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Check if file exists in cache
   */
  static fileExists(filename: string): boolean {
    const safeName = this.sanitizeFilename(filename);
    const filePath = path.join(this.cacheDir, `${safeName}.md`);
    return fs.existsSync(filePath);
  }

  /**
   * Get file metadata
   */
  static getFileMetadata(filename: string): FileMetadata | null {
    const safeName = this.sanitizeFilename(filename);
    const filePath = path.join(this.cacheDir, `${safeName}.md`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);

    return {
      path: filePath,
      size: stats.size,
      created: stats.birthtimeMs,
      modified: stats.mtimeMs,
    };
  }

  /**
   * Delete file from cache
   */
  static deleteFile(filename: string): boolean {
    const safeName = this.sanitizeFilename(filename);
    const filePath = path.join(this.cacheDir, `${safeName}.md`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }

    return false;
  }

  /**
   * Delete item from cache by ID
   */
  static deleteItem(itemId: string): boolean {
    const metadata = this.metadata.get(itemId);
    if (!metadata) {
      return false;
    }

    if (fs.existsSync(metadata.path)) {
      fs.unlinkSync(metadata.path);
    }

    this.metadata.delete(itemId);
    this.saveMetadata();

    return true;
  }

  /**
   * Clear all cache
   */
  static clearCache(): void {
    if (!fs.existsSync(this.cacheDir)) {
      return;
    }

    const files = fs.readdirSync(this.cacheDir, { recursive: true }) as string[];
    files.forEach((file) => {
      const filePath = path.join(this.cacheDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        fs.unlinkSync(filePath);
      }
    });

    this.metadata.clear();
    this.saveMetadata();
  }

  /**
   * Get cache size in bytes
   */
  static getCacheSize(): number {
    if (!fs.existsSync(this.cacheDir)) {
      return 0;
    }

    let totalSize = 0;
    const files = fs.readdirSync(this.cacheDir, { recursive: true }) as string[];

    files.forEach((file) => {
      const filePath = path.join(this.cacheDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      } catch {
        // File might not exist
      }
    });

    return totalSize;
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    totalSize: number;
    itemCount: number;
    notesCount: number;
    chatsCount: number;
  } {
    const items = Array.from(this.metadata.values());
    return {
      totalSize: this.getCacheSize(),
      itemCount: items.length,
      notesCount: items.filter((i) => i.type === 'note').length,
      chatsCount: items.filter((i) => i.type === 'chat').length,
    };
  }

  /**
   * Clean old cache items (older than specified days)
   */
  static cleanOldCache(maxAgeDays: number = 7): number {
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    let cleaned = 0;

    for (const [id, metadata] of this.metadata.entries()) {
      if (now - metadata.cachedAt > maxAge) {
        if (this.deleteItem(id)) {
          cleaned++;
        }
      }
    }

    return cleaned;
  }
}
