import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../../stores/authStore';

// API version and base URL configuration
const API_VERSION = 'v1';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

// Error types for better error handling
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Create a custom error class for API errors
export class ApiRequestError extends Error {
  constructor(
    public statusCode: number,
    public error: ApiError,
    public originalError: AxiosError
  ) {
    super(error.message);
    this.name = 'ApiRequestError';
  }
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for adding auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Handle specific error cases
          switch (error.response.status) {
            case 401:
              // Handle unauthorized (e.g., token expired)
              useAuthStore.getState().signOut();
              break;
            case 403:
              // Handle forbidden
              console.error('Access forbidden');
              break;
            case 404:
              // Handle not found
              console.error('Resource not found');
              break;
            case 429:
              // Handle rate limiting
              console.error('Too many requests');
              break;
          }

          // Transform error to our custom format
          throw new ApiRequestError(
            error.response.status,
            error.response.data as ApiError,
            error
          );
        }
        
        // Handle network errors
        if (error.request) {
          throw new ApiRequestError(
            0,
            {
              code: 'NETWORK_ERROR',
              message: 'Network error occurred',
              details: error.request,
            },
            error
          );
        }

        // Handle other errors
        throw new ApiRequestError(
          0,
          {
            code: 'UNKNOWN_ERROR',
            message: 'An unknown error occurred',
            details: error.message,
          },
          error
        );
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Export types for API responses
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
} 