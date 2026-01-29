import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import supabase from '../lib/supabase';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - Add Supabase auth token to all requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('[API] Failed to get session for request:', error);
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
  async (error: AxiosError) => {
    // If we get a 401, let Supabase handle token refresh automatically
    // The next request will get a fresh token from the session
    if (error.response?.status === 401) {
      // Check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // No valid session, redirect to login
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

// Error handling helper
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      'An unexpected error occurred'
    );
  }
  return 'An unexpected error occurred';
};
