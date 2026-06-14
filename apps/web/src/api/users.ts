import { apiClient } from './client';

export type UserRole = 'SUPER_ADMIN' | 'CHURCH_ADMIN' | 'PASTOR' | 'MINISTRY_LEADER' | 'VOLUNTEER';

export const ROLE_LABELS: Record<UserRole, string> = {
    SUPER_ADMIN:     'Super Admin',
    CHURCH_ADMIN:    'Church Admin',
    PASTOR:          'Pastor',
    MINISTRY_LEADER: 'Ministry Leader',
    VOLUNTEER:       'Volunteer',
};

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatar?: string;
    phone?: string;
    onboardingComplete: boolean;
    emailVerified: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
}

export interface UpdateUserData {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
    onboardingComplete?: boolean;
}

export interface InviteDirectData {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
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
export const updateUserRole = async (userId: string, role: UserRole): Promise<User> => {
    const response = await apiClient.patch<{ data: User }>(`/api/users/${userId}/role`, { role });
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

/**
 * Invite a member to create a user account (links to existing Member record)
 */
export const inviteMember = async (memberId: string): Promise<{ message: string; email: string }> => {
    const response = await apiClient.post<{ message: string; data: { email: string } }>('/api/users/invite', { memberId });
    return { message: response.data.message, email: response.data.data.email };
};

/**
 * Invite a new user directly by email with an Integration Team role
 */
export const inviteByEmail = async (data: InviteDirectData): Promise<{ message: string; email: string }> => {
    const response = await apiClient.post<{ message: string; data: { email: string } }>('/api/users/invite-direct', data);
    return { message: response.data.message, email: response.data.data.email };
};
