import { apiClient, handleApiError } from './client';
import type {
    ServeTeam,
    TeamMembership,
    TeamApplication,
    TeamResource,
    TeamEvent,
    TeamEventAttendance,
    TeamMemberRole,
    TeamTrackAssignment,
    TeamTrainingData,
    TeamMemberProgressData,
    AcademyTrack,
} from '../../types';

// ===== TEAMS =====

export const getServeTeams = async (filters?: { isActive?: boolean }): Promise<ServeTeam[]> => {
    try {
        const params = new URLSearchParams();
        if (filters?.isActive !== undefined) {
            params.append('isActive', String(filters.isActive));
        }
        const response = await apiClient.get<{ data: ServeTeam[]; pagination: any; meta: any }>(
            `/api/serve-teams${params.toString() ? `?${params.toString()}` : ''}`
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getServeTeam = async (teamId: string): Promise<ServeTeam> => {
    try {
        const response = await apiClient.get<{ data: ServeTeam; meta: any }>(`/api/serve-teams/${teamId}`);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const createServeTeam = async (data: {
    name: string;
    description?: string;
    teamImage?: string;
    requiredTrackId?: string;
}): Promise<ServeTeam> => {
    try {
        const response = await apiClient.post<{ data: ServeTeam; meta: any }>('/api/serve-teams', data);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const updateServeTeam = async (
    teamId: string,
    data: Partial<Pick<ServeTeam, 'name' | 'description' | 'teamImage' | 'requiredTrackId' | 'isActive'>>
): Promise<ServeTeam> => {
    try {
        const response = await apiClient.patch<{ data: ServeTeam; meta: any }>(`/api/serve-teams/${teamId}`, data);
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const deleteServeTeam = async (teamId: string): Promise<void> => {
    try {
        await apiClient.delete(`/api/serve-teams/${teamId}`);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getMyTeams = async (): Promise<TeamMembership[]> => {
    try {
        const response = await apiClient.get<{ data: TeamMembership[]; meta: any }>('/api/serve-teams/my-teams');
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// ===== APPLICATIONS =====

export const applyToTeam = async (teamId: string, message?: string): Promise<TeamApplication> => {
    try {
        const response = await apiClient.post<{ data: TeamApplication; meta: any }>(
            `/api/serve-teams/${teamId}/apply`,
            { message }
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getTeamApplications = async (teamId: string, status?: string): Promise<TeamApplication[]> => {
    try {
        const params = status ? `?status=${status}` : '';
        const response = await apiClient.get<{ data: TeamApplication[]; meta: any }>(
            `/api/serve-teams/${teamId}/applications${params}`
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const reviewApplication = async (
    applicationId: string,
    decision: 'APPROVED' | 'REJECTED'
): Promise<TeamApplication> => {
    try {
        const response = await apiClient.patch<{ data: TeamApplication; meta: any }>(
            `/api/serve-teams/applications/${applicationId}/review`,
            { decision }
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// ===== ROSTER =====

export const updateTeamMemberRole = async (
    teamId: string,
    userId: string,
    role: TeamMemberRole
): Promise<TeamMembership> => {
    try {
        const response = await apiClient.patch<{ data: TeamMembership; meta: any }>(
            `/api/serve-teams/${teamId}/roster/${userId}/role`,
            { role }
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const removeFromRoster = async (teamId: string, userId: string): Promise<void> => {
    try {
        await apiClient.delete(`/api/serve-teams/${teamId}/roster/${userId}`);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// ===== RESOURCES =====

export const getTeamResources = async (teamId: string): Promise<TeamResource[]> => {
    try {
        const response = await apiClient.get<{ data: TeamResource[]; meta: any }>(
            `/api/serve-teams/${teamId}/resources`
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const addTeamResource = async (
    teamId: string,
    data: { title: string; description?: string; fileUrl: string; fileType: string }
): Promise<TeamResource> => {
    try {
        const response = await apiClient.post<{ data: TeamResource; meta: any }>(
            `/api/serve-teams/${teamId}/resources`,
            data
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const deleteTeamResource = async (teamId: string, resourceId: string): Promise<void> => {
    try {
        await apiClient.delete(`/api/serve-teams/${teamId}/resources/${resourceId}`);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// ===== EVENTS =====

export const getTeamEvents = async (teamId: string, upcoming?: boolean): Promise<TeamEvent[]> => {
    try {
        const params = upcoming ? '?upcoming=true' : '';
        const response = await apiClient.get<{ data: TeamEvent[]; meta: any }>(
            `/api/serve-teams/${teamId}/events${params}`
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const createTeamEvent = async (
    teamId: string,
    data: { title: string; description?: string; location?: string; startTime: string; endTime?: string }
): Promise<TeamEvent> => {
    try {
        const response = await apiClient.post<{ data: TeamEvent; meta: any }>(
            `/api/serve-teams/${teamId}/events`,
            data
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const deleteTeamEvent = async (teamId: string, eventId: string): Promise<void> => {
    try {
        await apiClient.delete(`/api/serve-teams/${teamId}/events/${eventId}`);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// ===== ATTENDANCE =====

export const markAttendance = async (
    eventId: string,
    records: Array<{ userId: string; present: boolean }>
): Promise<TeamEventAttendance[]> => {
    try {
        const response = await apiClient.post<{ data: TeamEventAttendance[]; meta: any }>(
            `/api/serve-teams/events/${eventId}/attendance`,
            { records }
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getEventAttendance = async (eventId: string): Promise<TeamEventAttendance[]> => {
    try {
        const response = await apiClient.get<{ data: TeamEventAttendance[]; meta: any }>(
            `/api/serve-teams/events/${eventId}/attendance`
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// ===== TEAM TRAINING =====

export const assignTrackToTeam = async (teamId: string, trackId: string): Promise<TeamTrackAssignment> => {
    try {
        const response = await apiClient.post<{ data: TeamTrackAssignment; meta: any }>(
            `/api/serve-teams/${teamId}/training/assign`,
            { trackId }
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const unassignTrackFromTeam = async (teamId: string, trackId: string): Promise<void> => {
    try {
        await apiClient.delete(`/api/serve-teams/${teamId}/training/assign/${trackId}`);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getTeamTrackAssignments = async (teamId: string): Promise<TeamTrackAssignment[]> => {
    try {
        const response = await apiClient.get<{ data: TeamTrackAssignment[]; meta: any }>(
            `/api/serve-teams/${teamId}/training/assignments`
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const createTeamScopedTrack = async (
    teamId: string,
    data: { title: string; description?: string; imageUrl?: string }
): Promise<AcademyTrack> => {
    try {
        const response = await apiClient.post<{ data: AcademyTrack; meta: any }>(
            `/api/serve-teams/${teamId}/training/tracks`,
            data
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getTeamTraining = async (teamId: string): Promise<TeamTrainingData> => {
    try {
        const response = await apiClient.get<{ data: TeamTrainingData; meta: any }>(
            `/api/serve-teams/${teamId}/training/my-training`
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getTeamMemberProgress = async (teamId: string): Promise<TeamMemberProgressData> => {
    try {
        const response = await apiClient.get<{ data: TeamMemberProgressData; meta: any }>(
            `/api/serve-teams/${teamId}/training/progress`
        );
        return response.data.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};
