import { apiClient, handleApiError } from './client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  onboardingComplete: boolean;
  avatar?: string;
}

export interface SyncResponse {
  user: User;
}

// Sync user from Supabase to app database
export const syncUser = async (churchName?: string): Promise<SyncResponse> => {
  try {
    const response = await apiClient.post<{ data: SyncResponse }>('/api/auth/sync', {
      churchName,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<{ data: User }>('/api/auth/me');
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Complete onboarding
export const completeOnboarding = async (): Promise<User> => {
  try {
    const response = await apiClient.patch<{ data: User }>('/api/auth/onboarding/complete');
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Logout (server-side cleanup)
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
    // Don't throw - logout should always succeed client-side
  }
};
