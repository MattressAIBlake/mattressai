import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { getAuthHeaders } from '../../utils/auth';
import { useToastStore } from '../../stores/toastStore';

const API_URL = 'https://api.mattressai.com/v1';
const TIMEOUT = 30000; // 30 seconds
const RETRY_COUNT = 3;

export class ApiClient {
  private client: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: TIMEOUT,
    });

    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes

    this.setupInterceptors();
    this.setupRetry();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth headers
        const headers = getAuthHeaders();
        config.headers = { ...config.headers, ...headers };

        // Add request timestamp
        config.metadata = { startTime: new Date().getTime() };

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response time
        const endTime = new Date().getTime();
        const startTime = response.config.metadata?.startTime;
        if (startTime) {
          console.debug(`Request took ${endTime - startTime}ms`);
        }

        return response;
      },
      (error: AxiosError) => {
        const { addToast } = useToastStore.getState();

        if (error.response) {
          switch (error.response.status) {
            case 401:
              addToast('error', 'Session expired. Please login again.');
              // Handle logout or refresh token
              break;
            case 403:
              addToast('error', 'You don\'t have permission to perform this action.');
              break;
            case 404:
              addToast('error', 'Resource not found.');
              break;
            case 429:
              addToast('error', 'Too many requests. Please try again later.');
              break;
            case 500:
              addToast('error', 'An unexpected error occurred. Please try again.');
              break;
            default:
              addToast('error', 'An error occurred. Please try again.');
          }
        } else if (error.request) {
          addToast('error', 'Network error. Please check your connection.');
        }

        return Promise.reject(error);
      }
    );
  }

  private setupRetry() {
    axiosRetry(this.client, {
      retries: RETRY_COUNT,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ?? 0) >= 500
        );
      },
    });
  }

  private getCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTTL;
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const cacheKey = this.getCacheKey(config);

    // Check cache for GET requests
    if (config.method?.toLowerCase() === 'get') {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.data;
      }
    }

    const response = await this.client.request<T>(config);

    // Cache GET responses
    if (config.method?.toLowerCase() === 'get') {
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    }

    return response.data;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const apiClient = new ApiClient();