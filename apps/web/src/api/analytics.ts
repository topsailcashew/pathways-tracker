import { apiClient } from './client';

export interface OverviewAnalytics {
    members: {
        total: number;
        active: number;
        integrated: number;
        inactive: number;
        byPathway: {
            newcomers: number;
            newBelievers: number;
        };
    };
    tasks: {
        total: number;
        pending: number;
        overdue: number;
        completed: number;
        completionRate: string;
    };
    users: {
        total: number;
    };
    recentActivity: {
        members: any[];
        tasks: any[];
    };
}

export interface MemberAnalytics {
    byStatus: Array<{ status: string; count: number }>;
    byStage: Array<{
        stageId: string;
        stageName: string;
        stageOrder: number;
        pathway: string;
        count: number;
    }>;
    joinedByMonth: Array<{ month: string; count: number }>;
    demographics: {
        byGender: Array<{ gender: string; count: number }>;
        byMaritalStatus: Array<{ status: string; count: number }>;
    };
}

export interface TaskAnalytics {
    summary: {
        total: number;
        completed: number;
        pending: number;
        overdue: number;
        completionRate: string;
    };
    byPriority: Array<{ priority: string; count: number }>;
    byAssignee: Array<{ userId: string; userName: string; count: number }>;
    completedByDay: Array<{ day: string; count: number }>;
}

/**
 * Get overview analytics
 */
export const getOverview = async (): Promise<OverviewAnalytics> => {
    const response = await apiClient.get<{ data: OverviewAnalytics }>(
        '/api/analytics/overview'
    );
    return response.data.data;
};

/**
 * Get member analytics
 */
export const getMemberAnalytics = async (
    pathway?: 'NEWCOMER' | 'NEW_BELIEVER'
): Promise<MemberAnalytics> => {
    const params = new URLSearchParams();
    if (pathway) params.append('pathway', pathway);

    const response = await apiClient.get<{ data: MemberAnalytics }>(
        `/api/analytics/members${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data.data;
};

/**
 * Get task analytics
 */
export const getTaskAnalytics = async (): Promise<TaskAnalytics> => {
    const response = await apiClient.get<{ data: TaskAnalytics }>('/api/analytics/tasks');
    return response.data.data;
};

/**
 * Export data
 */
export const exportData = async (type: 'members' | 'tasks'): Promise<any[]> => {
    const response = await apiClient.get<{ data: any[] }>(
        `/api/analytics/export?type=${type}`
    );
    return response.data.data;
};
