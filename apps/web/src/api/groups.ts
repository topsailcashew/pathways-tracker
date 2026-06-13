import { apiClient } from './client';

export interface Group {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    category?: string;
    meetingDay?: string;
    meetingTime?: string;
    location?: string;
    maxCapacity?: number;
    isActive: boolean;
    leaderId?: string;
    createdAt: string;
    updatedAt: string;
    leader?: { id: string; firstName: string; lastName: string; avatar?: string };
    memberships?: GroupMembership[];
    _count?: { memberships: number };
}

export interface GroupMembership {
    id: string;
    tenantId: string;
    groupId: string;
    memberId: string;
    joinedAt: string;
    member?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        photoUrl?: string;
    };
}

export interface CreateGroupData {
    name: string;
    description?: string;
    category?: string;
    meetingDay?: string;
    meetingTime?: string;
    location?: string;
    maxCapacity?: number;
    leaderId?: string | null;
    isActive?: boolean;
}

export type UpdateGroupData = Partial<CreateGroupData>;

export const getGroups = async (): Promise<Group[]> => {
    const res = await apiClient.get<{ data: Group[] }>('/api/groups');
    return res.data.data;
};

export const getGroup = async (id: string): Promise<Group> => {
    const res = await apiClient.get<{ data: Group }>(`/api/groups/${id}`);
    return res.data.data;
};

export const createGroup = async (data: CreateGroupData): Promise<Group> => {
    const res = await apiClient.post<{ data: Group }>('/api/groups', data);
    return res.data.data;
};

export const updateGroup = async (id: string, data: UpdateGroupData): Promise<Group> => {
    const res = await apiClient.patch<{ data: Group }>(`/api/groups/${id}`, data);
    return res.data.data;
};

export const deleteGroup = async (id: string): Promise<void> => {
    await apiClient.delete(`/api/groups/${id}`);
};

export const addMember = async (groupId: string, memberId: string): Promise<GroupMembership> => {
    const res = await apiClient.post<{ data: GroupMembership }>(`/api/groups/${groupId}/members`, { memberId });
    return res.data.data;
};

export const removeMember = async (groupId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/api/groups/${groupId}/members/${memberId}`);
};
