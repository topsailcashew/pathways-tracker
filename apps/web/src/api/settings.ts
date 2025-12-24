import { apiClient } from './client';

export interface ServiceTime {
    id: string;
    day: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    time: string;
    name: string;
    createdAt: string;
}

export interface ChurchSettings {
    id: string;
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
}

export interface UpdateSettingsData {
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
    serviceTimes?: Array<{
        day: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
        time: string;
        name: string;
    }>;
}

/**
 * Get church settings
 */
export const getSettings = async (): Promise<ChurchSettings> => {
    const response = await apiClient.get<{ data: ChurchSettings }>('/api/settings');
    return response.data.data;
};

/**
 * Update church settings
 */
export const updateSettings = async (data: UpdateSettingsData): Promise<ChurchSettings> => {
    const response = await apiClient.patch<{ data: ChurchSettings }>('/api/settings', data);
    return response.data.data;
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
        '/api/settings/service-times',
        data
    );
    return response.data.data;
};

/**
 * Delete service time
 */
export const deleteServiceTime = async (serviceTimeId: string): Promise<void> => {
    await apiClient.delete(`/api/settings/service-times/${serviceTimeId}`);
};
