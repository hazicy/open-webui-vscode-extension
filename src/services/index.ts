/**
 * Services Module
 * Centralized exports for all services
 */

// API
export { ApiClientManager, getApiClient } from './api';
export type { OpenWebUIClient } from '../lib/openwebui';

// Config
export { ConfigManager } from './config';
export { DEFAULT_CONFIG, CONFIG_KEYS, VscodeConfig } from './config/schema';

// Note Management (New)
export { NoteManager } from './note';
export { NoteSyncManager } from './noteSyncManager';

// Chat Management (New)
export { ChatManager } from './chat';

// Storage
export * from './storage';
