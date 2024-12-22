import axios, { AxiosInstance } from 'axios';

// API Endpoints
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const OPENAI_API_URL = import.meta.env.VITE_OPENAI_API_URL;
export const VECTOR_DB_URL = import.meta.env.VITE_VECTOR_DB_URL;

// Create axios instances with proper typing
export const mainApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const openAiApi: AxiosInstance = axios.create({
  baseURL: OPENAI_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
  },
});

export const vectorDbApi: AxiosInstance = axios.create({
  baseURL: VECTOR_DB_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for handling errors
const handleRequestError = (error: any) => {
  console.error('API Request Error:', error);
  return Promise.reject(error);
};

// Response interceptor for handling errors
const handleResponseError = (error: any) => {
  if (error.response) {
    // Server responded with error
    console.error('API Response Error:', error.response.data);
  }
  return Promise.reject(error);
};

// Add interceptors to all API instances
[mainApi, openAiApi, vectorDbApi].forEach(api => {
  api.interceptors.request.use(config => config, handleRequestError);
  api.interceptors.response.use(response => response, handleResponseError);
}); 