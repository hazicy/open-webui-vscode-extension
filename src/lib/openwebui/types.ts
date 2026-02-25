// Open WebUI API Types
// Based on OpenAPI specification for Open WebUI

// ============================================================================
// Common Types
// ============================================================================

export interface ApiError {
  detail?: string;
  message?: string;
  code?: string;
}

export class OpenWebUIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'OpenWebUIError';
  }
}

// ============================================================================
// Ollama Types
// ============================================================================

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaConfig {
  url_idx?: number;
  base_url: string;
}

export interface ModelNameForm {
  name: string;
}

export interface CopyModelForm {
  source: string;
  destination: string;
}

export interface CreateModelForm {
  name: string;
  modelfile?: string;
  stream?: boolean;
}

export interface PushModelForm {
  name: string;
  stream?: boolean;
  insecure?: boolean;
}

export interface GenerateCompletionForm {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateChatCompletionForm {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  format?: string;
  options?: Record<string, unknown>;
}

export interface GenerateEmbedForm {
  model: string;
  input: string;
}

export interface GenerateEmbeddingsForm {
  model: string;
  input: string[];
}

// ============================================================================
// OpenAI Types
// ============================================================================

export interface OpenAIConfig {
  url_idx?: number;
  base_url: string;
  api_key?: string;
}

export interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// Pipeline Types
// ============================================================================

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  url_idx?: number;
}

export interface AddPipelineForm {
  name: string;
  url_idx?: number;
}

export interface DeletePipelineForm {
  id: string;
}

// ============================================================================
// Task Types
// ============================================================================

export interface TaskConfig {
  enabled: boolean;
  [key: string]: unknown;
}

export interface TaskConfigForm {
  enabled?: boolean;
  [key: string]: unknown;
}

export interface ActiveChatsForm {
  chat_ids: string[];
}

// ============================================================================
// Image Types
// ============================================================================

export interface ImagesConfig {
  enabled: boolean;
  default_model: string;
  openai?: {
    url_idx?: number;
    base_url: string;
    api_key?: string;
  };
}

export interface CreateImageForm {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
}

export interface ImageEditForm {
  image: string;
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
}

// ============================================================================
// Audio Types
// ============================================================================

export interface AudioConfig {
  enabled: boolean;
  default_model: string;
  openai?: {
    url_idx?: number;
    base_url: string;
    api_key?: string;
  };
}

export interface AudioConfigUpdateForm {
  enabled?: boolean;
  default_model?: string;
  openai?: {
    url_idx?: number;
    base_url?: string;
    api_key?: string;
  };
}

// ============================================================================
// Retrieval/RAG Types
// ============================================================================

export interface EmbeddingModelUpdateForm {
  default_model?: string;
  openai?: {
    url_idx?: number;
    base_url?: string;
    api_key?: string;
  };
}

export interface ConfigForm {
  enabled?: boolean;
  [key: string]: unknown;
}

export interface ProcessFileForm {
  file: string;
  collection_id?: string;
}

export interface ProcessTextForm {
  text: string;
  collection_id?: string;
}

export interface ProcessWebForm {
  url: string;
  process?: boolean;
  collection_id?: string;
}

// ============================================================================
// Model Types
// ============================================================================

export interface Model {
  id: string;
  name: string;
  type?: 'ollama' | 'openai';
  base_url?: string;
}

// ============================================================================
// Notes Types
// ============================================================================

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
  content: string;
  access_control?: NoteAccessControl;
  tags?: string[];
  folder_id?: string;
  is_pinned?: boolean;
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

// ============================================================================
// Response Wrappers
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  page_size?: number;
}
