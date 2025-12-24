import { apiClient } from './client';

export interface Stage {
    id: string;
    pathway: 'NEWCOMER' | 'NEW_BELIEVER';
    name: string;
    description?: string;
    order: number;
    autoAdvanceEnabled: boolean;
    autoAdvanceType?: 'TASK_COMPLETED' | 'TIME_IN_STAGE';
    autoAdvanceValue?: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        members: number;
        automationRules: number;
    };
}

export interface CreateStageData {
    pathway: 'NEWCOMER' | 'NEW_BELIEVER';
    name: string;
    description?: string;
    order: number;
    autoAdvanceEnabled?: boolean;
    autoAdvanceType?: 'TASK_COMPLETED' | 'TIME_IN_STAGE';
    autoAdvanceValue?: string;
}

export interface UpdateStageData {
    name?: string;
    description?: string;
    order?: number;
    autoAdvanceEnabled?: boolean;
    autoAdvanceType?: 'TASK_COMPLETED' | 'TIME_IN_STAGE';
    autoAdvanceValue?: string;
}

export interface ReorderStageData {
    stageId: string;
    newOrder: number;
}

/**
 * Get all stages
 */
export const getStages = async (pathway?: 'NEWCOMER' | 'NEW_BELIEVER'): Promise<Stage[]> => {
    const params = new URLSearchParams();
    if (pathway) params.append('pathway', pathway);

    const response = await apiClient.get<{ data: Stage[] }>(
        `/api/stages${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data.data;
};

/**
 * Get stage by ID
 */
export const getStageById = async (stageId: string): Promise<Stage> => {
    const response = await apiClient.get<{ data: Stage }>(`/api/stages/${stageId}`);
    return response.data.data;
};

/**
 * Create stage
 */
export const createStage = async (data: CreateStageData): Promise<Stage> => {
    const response = await apiClient.post<{ data: Stage }>('/api/stages', data);
    return response.data.data;
};

/**
 * Update stage
 */
export const updateStage = async (stageId: string, data: UpdateStageData): Promise<Stage> => {
    const response = await apiClient.patch<{ data: Stage }>(`/api/stages/${stageId}`, data);
    return response.data.data;
};

/**
 * Reorder stages
 */
export const reorderStages = async (
    pathway: 'NEWCOMER' | 'NEW_BELIEVER',
    reorders: ReorderStageData[]
): Promise<void> => {
    await apiClient.post('/api/stages/reorder', { pathway, reorders });
};

/**
 * Delete stage
 */
export const deleteStage = async (stageId: string): Promise<void> => {
    await apiClient.delete(`/api/stages/${stageId}`);
};

/**
 * Get stage statistics
 */
export const getStageStats = async (pathway?: 'NEWCOMER' | 'NEW_BELIEVER') => {
    const params = new URLSearchParams();
    if (pathway) params.append('pathway', pathway);

    const response = await apiClient.get(
        `/api/stages/stats${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data.data;
};
