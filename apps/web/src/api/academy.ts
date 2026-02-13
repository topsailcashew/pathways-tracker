import { apiClient, handleApiError } from './client';
import type {
    AcademyTrack,
    AcademyModule,
    AcademyQuiz,
    AcademyEnrollment,
    AcademyModuleProgress,
    AcademyHuddleComment,
    QuizSubmissionResult,
    AcademyPipelineStats,
} from '../../types';

// ===== TRACKS =====

export const getAcademyTracks = async (filters?: { isPublished?: boolean }): Promise<AcademyTrack[]> => {
    try {
        const params = new URLSearchParams();
        if (filters?.isPublished !== undefined) {
            params.append('isPublished', String(filters.isPublished));
        }
        const response = await apiClient.get<{ data: AcademyTrack[]; pagination: any; meta: any }>(
            `/api/academy/tracks${params.toString() ? `?${params.toString()}` : ''}`
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getAcademyTrack = async (id: string): Promise<AcademyTrack> => {
    try {
        const response = await apiClient.get<{ data: AcademyTrack; meta: any }>(`/api/academy/tracks/${id}`);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const createAcademyTrack = async (data: { title: string; description?: string; imageUrl?: string }): Promise<AcademyTrack> => {
    try {
        const response = await apiClient.post<{ data: AcademyTrack; meta: any }>('/api/academy/tracks', data);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const updateAcademyTrack = async (id: string, data: Partial<Pick<AcademyTrack, 'title' | 'description' | 'imageUrl' | 'isPublished' | 'order'>>): Promise<AcademyTrack> => {
    try {
        const response = await apiClient.patch<{ data: AcademyTrack; meta: any }>(`/api/academy/tracks/${id}`, data);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const deleteAcademyTrack = async (id: string): Promise<void> => {
    try {
        await apiClient.delete(`/api/academy/tracks/${id}`);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// ===== MODULES =====

export const createAcademyModule = async (trackId: string, data: {
    title: string;
    description?: string;
    videoUrl: string;
    order: number;
    requiredModuleId?: string | null;
}): Promise<AcademyModule> => {
    try {
        const response = await apiClient.post<{ data: AcademyModule; meta: any }>(`/api/academy/tracks/${trackId}/modules`, data);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const updateAcademyModule = async (id: string, data: Partial<Pick<AcademyModule, 'title' | 'description' | 'videoUrl' | 'order' | 'status' | 'requiredModuleId'>>): Promise<AcademyModule> => {
    try {
        const response = await apiClient.patch<{ data: AcademyModule; meta: any }>(`/api/academy/modules/${id}`, data);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const deleteAcademyModule = async (id: string): Promise<void> => {
    try {
        await apiClient.delete(`/api/academy/modules/${id}`);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// ===== QUIZZES =====

export const getAcademyQuiz = async (moduleId: string): Promise<AcademyQuiz> => {
    try {
        const response = await apiClient.get<{ data: AcademyQuiz; meta: any }>(`/api/academy/modules/${moduleId}/quiz`);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const upsertAcademyQuiz = async (moduleId: string, data: {
    passingScore: number;
    questions: Array<{
        questionText: string;
        questionType?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
        options: Array<{ id: string; text: string }>;
        correctOptionId: string;
        order: number;
    }>;
}): Promise<AcademyQuiz> => {
    try {
        const response = await apiClient.put<{ data: AcademyQuiz; meta: any }>(`/api/academy/modules/${moduleId}/quiz`, data);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// ===== ENROLLMENT & PROGRESS =====

export const enrollInAcademyTrack = async (trackId: string, userId?: string): Promise<AcademyEnrollment> => {
    try {
        const response = await apiClient.post<{ data: AcademyEnrollment; meta: any }>('/api/academy/enroll', { trackId, userId });
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getAcademyMyProgress = async (): Promise<{ enrollments: AcademyEnrollment[]; progress: AcademyModuleProgress[] }> => {
    try {
        const response = await apiClient.get<{ data: { enrollments: AcademyEnrollment[]; progress: AcademyModuleProgress[] }; meta: any }>('/api/academy/my-progress');
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getAcademyNextStep = async (): Promise<AcademyModuleProgress | null> => {
    try {
        const response = await apiClient.get<{ data: AcademyModuleProgress | null; meta: any }>('/api/academy/next-step');
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const markAcademyVideoWatched = async (moduleId: string): Promise<void> => {
    try {
        await apiClient.patch(`/api/academy/modules/${moduleId}/video-watched`);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const submitAcademyQuiz = async (moduleId: string, answers: Array<{ questionId: string; selectedOptionId: string }>): Promise<QuizSubmissionResult> => {
    try {
        const response = await apiClient.post<{ data: QuizSubmissionResult; meta: any }>(`/api/academy/modules/${moduleId}/submit-quiz`, { answers });
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// ===== ADMIN ANALYTICS =====

export const getAcademyStats = async (): Promise<AcademyPipelineStats> => {
    try {
        const response = await apiClient.get<{ data: AcademyPipelineStats; meta: any }>('/api/academy/admin/stats');
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getAcademyTrackProgress = async (trackId: string): Promise<any> => {
    try {
        const response = await apiClient.get<{ data: any; meta: any }>(`/api/academy/admin/tracks/${trackId}/progress`);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getAcademyUserProgress = async (userId: string): Promise<any> => {
    try {
        const response = await apiClient.get<{ data: any; meta: any }>(`/api/academy/admin/users/${userId}/progress`);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// ===== HUDDLE =====

export const getAcademyHuddleComments = async (moduleId: string, page?: number): Promise<AcademyHuddleComment[]> => {
    try {
        const params = page ? `?page=${page}` : '';
        const response = await apiClient.get<{ data: AcademyHuddleComment[]; pagination: any; meta: any }>(`/api/academy/modules/${moduleId}/huddle${params}`);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const addAcademyHuddleComment = async (moduleId: string, content: string): Promise<AcademyHuddleComment> => {
    try {
        const response = await apiClient.post<{ data: AcademyHuddleComment; meta: any }>(`/api/academy/modules/${moduleId}/huddle`, { content });
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const deleteAcademyHuddleComment = async (commentId: string): Promise<void> => {
    try {
        await apiClient.delete(`/api/academy/huddle/${commentId}`);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};
