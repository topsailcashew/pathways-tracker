import { apiClient, handleApiError } from './client';

export interface Notification {
    id: string;
    tenantId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    read: boolean;
    createdAt: string;
}

export async function getNotifications(unreadOnly = false): Promise<{ notifications: Notification[]; unreadCount: number }> {
    try {
        const params = unreadOnly ? '?unreadOnly=true' : '';
        const res = await apiClient.get(`/api/notifications${params}`);
        return res.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
}

export async function markNotificationRead(id: string): Promise<void> {
    try {
        await apiClient.patch(`/api/notifications/${id}/read`);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
}

export async function markAllNotificationsRead(): Promise<void> {
    try {
        await apiClient.patch('/api/notifications/read-all');
    } catch (error) {
        throw new Error(handleApiError(error));
    }
}
