import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import supabase from '../lib/supabase';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Module-level token cache — avoids calling getSession() on every request
let cachedAccessToken: string | null = null;

// Initialize: grab current session + listen for changes
supabase.auth.getSession().then(({ data: { session } }) => {
  cachedAccessToken = session?.access_token ?? null;
});

supabase.auth.onAuthStateChange((_event, session) => {
  cachedAccessToken = session?.access_token ?? null;
});

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds - Supabase free tier can be slow on cold start
});

// Request interceptor - synchronously attach cached token (no async overhead)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (cachedAccessToken) {
      config.headers.Authorization = `Bearer ${cachedAccessToken}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // If the cached token is stale, the onAuthStateChange listener will update it.
      // If there's no valid session at all, redirect to login.
      if (!cachedAccessToken) {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

// Error handling helper
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string | { message?: string; code?: string } }>;
    const data = axiosError.response?.data;
    // Backend sends errors as { error: { code, message } }
    const errorField = data?.error;
    const errorMessage = typeof errorField === 'object' && errorField !== null
      ? errorField.message
      : errorField;
    return (
      data?.message ||
      errorMessage ||
      axiosError.message ||
      'An unexpected error occurred'
    );
  }
  return 'An unexpected error occurred';
};
