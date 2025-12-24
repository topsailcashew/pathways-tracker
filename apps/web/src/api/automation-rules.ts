import { apiClient } from './client';

export interface AutomationRule {
    id: string;
    stageId: string;
    name: string;
    taskDescription: string;
    daysDue: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
    stage?: {
        id: string;
        name: string;
        pathway: 'NEWCOMER' | 'NEW_BELIEVER';
        order: number;
    };
}

export interface CreateAutomationRuleData {
    stageId: string;
    name: string;
    taskDescription: string;
    daysDue: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    enabled?: boolean;
}

export interface UpdateAutomationRuleData {
    name?: string;
    taskDescription?: string;
    daysDue?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    enabled?: boolean;
}

/**
 * Get all automation rules
 */
export const getAutomationRules = async (stageId?: string): Promise<AutomationRule[]> => {
    const params = new URLSearchParams();
    if (stageId) params.append('stageId', stageId);

    const response = await apiClient.get<{ data: AutomationRule[] }>(
        `/api/automation-rules${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data.data;
};

/**
 * Get automation rule by ID
 */
export const getAutomationRuleById = async (ruleId: string): Promise<AutomationRule> => {
    const response = await apiClient.get<{ data: AutomationRule }>(
        `/api/automation-rules/${ruleId}`
    );
    return response.data.data;
};

/**
 * Create automation rule
 */
export const createAutomationRule = async (
    data: CreateAutomationRuleData
): Promise<AutomationRule> => {
    const response = await apiClient.post<{ data: AutomationRule }>(
        '/api/automation-rules',
        data
    );
    return response.data.data;
};

/**
 * Update automation rule
 */
export const updateAutomationRule = async (
    ruleId: string,
    data: UpdateAutomationRuleData
): Promise<AutomationRule> => {
    const response = await apiClient.patch<{ data: AutomationRule }>(
        `/api/automation-rules/${ruleId}`,
        data
    );
    return response.data.data;
};

/**
 * Toggle automation rule
 */
export const toggleAutomationRule = async (
    ruleId: string,
    enabled: boolean
): Promise<AutomationRule> => {
    const response = await apiClient.patch<{ data: AutomationRule }>(
        `/api/automation-rules/${ruleId}/toggle`,
        { enabled }
    );
    return response.data.data;
};

/**
 * Delete automation rule
 */
export const deleteAutomationRule = async (ruleId: string): Promise<void> => {
    await apiClient.delete(`/api/automation-rules/${ruleId}`);
};

/**
 * Get automation rule statistics
 */
export const getAutomationRuleStats = async () => {
    const response = await apiClient.get('/api/automation-rules/stats');
    return response.data.data;
};
