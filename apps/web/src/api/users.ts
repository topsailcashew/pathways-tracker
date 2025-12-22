import { apiClient } from './client';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEADER' | 'VOLUNTEER';
    phone?: string;
    onboardingComplete: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEADER' | 'VOLUNTEER';
    phone?: string;
}

export interface UpdateUserData {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEADER' | 'VOLUNTEER';
    onboardingComplete?: boolean;
}

export interface UserStats {
    total: number;
    byRole: Record<string, number>;
}

/**
 * Get all users
 */
export const getUsers = async (role?: string): Promise<User[]> => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);

    const response = await apiClient.get<{ data: User[] }>(
        `/api/users${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data.data;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User> => {
    const response = await apiClient.get<{ data: User }>(`/api/users/${userId}`);
    return response.data.data;
};

/**
 * Create user
 */
export const createUser = async (data: CreateUserData): Promise<User> => {
    const response = await apiClient.post<{ data: User }>('/api/users', data);
    return response.data.data;
};

/**
 * Update user
 */
export const updateUser = async (userId: string, data: UpdateUserData): Promise<User> => {
    const response = await apiClient.patch<{ data: User }>(`/api/users/${userId}`, data);
    return response.data.data;
};

/**
 * Update user role
 */
export const updateUserRole = async (
    userId: string,
    role: 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEADER' | 'VOLUNTEER'
): Promise<User> => {
    const response = await apiClient.patch<{ data: User }>(`/api/users/${userId}/role`, {
        role,
    });
    return response.data.data;
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string): Promise<void> => {
    await apiClient.delete(`/api/users/${userId}`);
};

/**
 * Get user statistics
 */
export const getUserStats = async (): Promise<UserStats> => {
    const response = await apiClient.get<{ data: UserStats }>('/api/users/stats');
    return response.data.data;
};
