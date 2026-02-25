import { HttpClient } from './http-client';
import { OllamaResource } from './resources/ollama';
import { OpenAIResource } from './resources/openai';
import { PipelinesResource } from './resources/pipelines';
import { TasksResource } from './resources/tasks';
import { ImagesResource } from './resources/images';
import { AudioResource } from './resources/audio';
import { RetrievalResource } from './resources/retrieval';
import { ModelsResource } from './resources/models';
import { ChatsResource } from './resources/chats';
import { FilesResource } from './resources/files';
import { UsersResource } from './resources/users';
import { ConfigResource } from './resources/config';
import { NotesResource } from './resources/notes';

export interface OpenWebUIClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class OpenWebUIClient {
  private httpClient: HttpClient;
  public readonly ollama: OllamaResource;
  public readonly openai: OpenAIResource;
  public readonly pipelines: PipelinesResource;
  public readonly tasks: TasksResource;
  public readonly images: ImagesResource;
  public readonly audio: AudioResource;
  public readonly retrieval: RetrievalResource;
  public readonly models: ModelsResource;
  public readonly chats: ChatsResource;
  public readonly files: FilesResource;
  public readonly users: UsersResource;
  public readonly config: ConfigResource;
  public readonly notes: NotesResource;

  constructor(config: OpenWebUIClientConfig) {
    this.httpClient = new HttpClient(config);
    this.ollama = new OllamaResource(this.httpClient);
    this.openai = new OpenAIResource(this.httpClient);
    this.pipelines = new PipelinesResource(this.httpClient);
    this.tasks = new TasksResource(this.httpClient);
    this.images = new ImagesResource(this.httpClient);
    this.audio = new AudioResource(this.httpClient);
    this.retrieval = new RetrievalResource(this.httpClient);
    this.models = new ModelsResource(this.httpClient);
    this.chats = new ChatsResource(this.httpClient);
    this.files = new FilesResource(this.httpClient);
    this.users = new UsersResource(this.httpClient);
    this.config = new ConfigResource(this.httpClient);
    this.notes = new NotesResource(this.httpClient);
  }

  setApiKey(apiKey: string): void {
    this.httpClient.setApiKey(apiKey);
  }
}
