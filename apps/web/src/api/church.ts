import { apiClient } from './client';

export interface ServiceTime {
    id: string;
    day: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    time: string;
    name: string;
    createdAt: string;
}

export interface Church {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    phone: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    denomination?: string;
    weeklyAttendance?: string;
    timezone: string;
    memberTerm: string;
    autoWelcome: boolean;
    serviceTimes: ServiceTime[];
    createdAt: string;
    updatedAt: string;
    tenant?: {
        id: string;
        name: string;
        domain: string;
        plan: string;
        status: string;
        memberCount: number;
        createdAt: string;
    };
}

export interface CreateChurchData {
    name: string;
    email: string;
    phone: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
    denomination?: string;
    weeklyAttendance?: string;
    timezone?: string;
    memberTerm?: string;
    autoWelcome?: boolean;
    serviceTimes?: Array<{
        day: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
        time: string;
        name: string;
    }>;
}

export interface UpdateChurchData {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    denomination?: string;
    weeklyAttendance?: string;
    timezone?: string;
    memberTerm?: string;
    autoWelcome?: boolean;
}

export interface ChurchStats {
    church: {
        name: string;
        denomination?: string;
        weeklyAttendance?: string;
        memberCount: number;
        serviceTimesCount: number;
    };
    tenant: {
        plan?: string;
        status?: string;
        createdAt?: string;
    };
    activity: {
        totalMembers: number;
        totalTasks: number;
    };
}

/**
 * Get church information
 */
export const getChurch = async (): Promise<Church> => {
    const response = await apiClient.get<{ data: Church }>('/api/church');
    return response.data.data;
};

/**
 * Get church statistics
 */
export const getChurchStats = async (): Promise<ChurchStats> => {
    const response = await apiClient.get<{ data: ChurchStats }>('/api/church/stats');
    return response.data.data;
};

/**
 * Create church settings
 */
export const createChurch = async (data: CreateChurchData): Promise<Church> => {
    const response = await apiClient.post<{ data: Church }>('/api/church', data);
    return response.data.data;
};

/**
 * Update church settings
 */
export const updateChurch = async (data: UpdateChurchData): Promise<Church> => {
    const response = await apiClient.patch<{ data: Church }>('/api/church', data);
    return response.data.data;
};

/**
 * Delete church settings
 */
export const deleteChurch = async (): Promise<void> => {
    await apiClient.delete('/api/church');
};

/**
 * Add service time
 */
export const addServiceTime = async (data: {
    day: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    time: string;
    name: string;
}): Promise<ServiceTime> => {
    const response = await apiClient.post<{ data: ServiceTime }>(
        '/api/church/service-times',
        data
    );
    return response.data.data;
};

/**
 * Delete service time
 */
export const deleteServiceTime = async (serviceTimeId: string): Promise<void> => {
    await apiClient.delete(`/api/church/service-times/${serviceTimeId}`);
};
