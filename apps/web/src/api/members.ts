import { apiClient, handleApiError } from './client';

export type PathwayType = 'NEWCOMER' | 'NEW_BELIEVER' | 'MEMBER';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pathway: PathwayType;
  status: string;
  firstVisitDate: string;
  lastContactDate: string;
  assignedToId?: string;
  stageId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  stage: {
    id: string;
    name: string;
    order: number;
  };
  notes?: Array<{
    id: string;
    content: string;
    createdAt: string;
    createdBy: {
      firstName: string;
      lastName: string;
    };
  }>;
  tags?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export interface CreateMemberData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pathway: PathwayType;
  firstVisitDate: string;
  assignedToId?: string;
}

export interface UpdateMemberData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  pathway?: PathwayType;
  status?: string;
  firstVisitDate?: string;
  lastContactDate?: string;
  assignedToId?: string;
}

export interface MemberFilters {
  pathway?: PathwayType;
  status?: string;
  stageId?: string;
  assignedToId?: string;
  search?: string;
}

// Get all members with optional filters
export const getMembers = async (filters?: MemberFilters): Promise<Member[]> => {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<Member[]>(
      `/api/members${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get member by ID
export const getMember = async (id: string): Promise<Member> => {
  try {
    const response = await apiClient.get<Member>(`/api/members/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Create member
export const createMember = async (data: CreateMemberData): Promise<Member> => {
  try {
    const response = await apiClient.post<Member>('/api/members', data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Update member
export const updateMember = async (
  id: string,
  data: UpdateMemberData
): Promise<Member> => {
  try {
    const response = await apiClient.patch<Member>(`/api/members/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Delete member
export const deleteMember = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/members/${id}`);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Advance member to next stage
export const advanceMemberStage = async (
  id: string,
  stageId: string
): Promise<Member> => {
  try {
    const response = await apiClient.patch<Member>(`/api/members/${id}/stage`, {
      stageId,
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Add note to member
export const addMemberNote = async (
  id: string,
  content: string
): Promise<Member> => {
  try {
    const response = await apiClient.post<Member>(`/api/members/${id}/notes`, {
      content,
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Add tag to member
export const addMemberTag = async (
  id: string,
  tagId: string
): Promise<Member> => {
  try {
    const response = await apiClient.post<Member>(`/api/members/${id}/tags`, {
      tagId,
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Remove tag from member
export const removeMemberTag = async (
  memberId: string,
  tagId: string
): Promise<void> => {
  try {
    await apiClient.delete(`/api/members/${memberId}/tags/${tagId}`);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
