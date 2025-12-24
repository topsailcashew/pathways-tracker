import { apiClient, tokenStorage, handleApiError } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'VOLUNTEER' | 'TEAM_LEADER' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    onboardingCompleted: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  onboardingCompleted: boolean;
}

// Login
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
    const { accessToken, refreshToken } = response.data;

    // Store tokens
    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);

    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Register
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
    const { accessToken, refreshToken } = response.data;

    // Store tokens
    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);

    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      await apiClient.post('/api/auth/logout', { refreshToken });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear tokens, even if the API call fails
    tokenStorage.clearTokens();
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Complete onboarding
export const completeOnboarding = async (): Promise<User> => {
  try {
    const response = await apiClient.patch<User>('/api/auth/onboarding/complete');
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Refresh token
export const refreshAccessToken = async (): Promise<string> => {
  try {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ accessToken: string }>(
      '/api/auth/refresh',
      { refreshToken }
    );

    const { accessToken } = response.data;
    tokenStorage.setAccessToken(accessToken);

    return accessToken;
  } catch (error) {
    tokenStorage.clearTokens();
    throw new Error(handleApiError(error));
  }
};
