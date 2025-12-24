import { apiClient } from './client';

export interface Integration {
    id: string;
    sourceName: string;
    sheetUrl: string;
    targetPathway: 'NEWCOMER' | 'NEW_BELIEVER';
    targetStageId: string;
    autoCreateTask: boolean;
    taskDescription?: string;
    autoWelcome: boolean;
    status: 'ACTIVE' | 'ERROR' | 'PAUSED';
    lastSync?: string;
    lastSyncStatus?: string;
    syncFrequency?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateIntegrationData {
    sourceName: string;
    sheetUrl: string;
    targetPathway: 'NEWCOMER' | 'NEW_BELIEVER';
    targetStageId: string;
    autoCreateTask?: boolean;
    taskDescription?: string;
    autoWelcome?: boolean;
    syncFrequency?: string;
}

export interface UpdateIntegrationData {
    sourceName?: string;
    sheetUrl?: string;
    targetPathway?: 'NEWCOMER' | 'NEW_BELIEVER';
    targetStageId?: string;
    autoCreateTask?: boolean;
    taskDescription?: string;
    autoWelcome?: boolean;
    status?: 'ACTIVE' | 'ERROR' | 'PAUSED';
    syncFrequency?: string;
}

/**
 * Get all integrations
 */
export const getIntegrations = async (): Promise<Integration[]> => {
    const response = await apiClient.get<{ data: Integration[] }>('/api/integrations');
    return response.data.data;
};

/**
 * Get integration by ID
 */
export const getIntegrationById = async (integrationId: string): Promise<Integration> => {
    const response = await apiClient.get<{ data: Integration }>(
        `/api/integrations/${integrationId}`
    );
    return response.data.data;
};

/**
 * Create integration
 */
export const createIntegration = async (
    data: CreateIntegrationData
): Promise<Integration> => {
    const response = await apiClient.post<{ data: Integration }>('/api/integrations', data);
    return response.data.data;
};

/**
 * Update integration
 */
export const updateIntegration = async (
    integrationId: string,
    data: UpdateIntegrationData
): Promise<Integration> => {
    const response = await apiClient.patch<{ data: Integration }>(
        `/api/integrations/${integrationId}`,
        data
    );
    return response.data.data;
};

/**
 * Delete integration
 */
export const deleteIntegration = async (integrationId: string): Promise<void> => {
    await apiClient.delete(`/api/integrations/${integrationId}`);
};

/**
 * Trigger manual sync
 */
export const triggerSync = async (integrationId: string) => {
    const response = await apiClient.post(`/api/integrations/${integrationId}/sync`);
    return response.data.data;
};

/**
 * Test integration connection
 */
export const testConnection = async (integrationId: string) => {
    const response = await apiClient.post(`/api/integrations/${integrationId}/test`);
    return response.data.data;
};

/**
 * Get integration statistics
 */
export const getIntegrationStats = async () => {
    const response = await apiClient.get('/api/integrations/stats');
    return response.data.data;
};
