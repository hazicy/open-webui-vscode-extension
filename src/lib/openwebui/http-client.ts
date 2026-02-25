import axios, {
  type AxiosInstance,
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { OpenWebUIError } from './types';

export interface HttpClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private apiKey?: string;

  constructor(config: HttpClientConfig) {
    this.apiKey = config.apiKey;

    this.axiosInstance = axios.create({
      baseURL: config.baseURL.replace(/\/$/, ''),
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Add request interceptor to include API key
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.apiKey) {
          config.headers.Authorization = `Bearer ${this.apiKey}`;
        }
        return config;
      },
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: unknown) => this.handleError(error),
    );
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await this.axiosInstance.get<T>(path, {
      params,
      headers,
    });
    return response.data;
  }

  async post<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(path, body, {
      params,
      headers,
    });
    return response.data;
  }

  async patch<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await this.axiosInstance.patch<T>(path, body, {
      headers,
    });
    return response.data;
  }

  async delete<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const response = await this.axiosInstance.delete<T>(path, {
      data: body,
      params,
    });
    return response.data;
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        detail?: string;
        message?: string;
        code?: string;
      }>;

      const status = axiosError.response?.status || 500;
      const errorData = axiosError.response?.data || {
        detail: axiosError.message || 'An error occurred',
      };

      const apiError = new Error(
        errorData.detail || errorData.message || 'An error occurred',
      ) as OpenWebUIError;
      apiError.code = errorData.code || 'unknown_error';
      throw apiError;
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unknown error occurred');
  }
}
