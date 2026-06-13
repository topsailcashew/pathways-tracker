import React, { useState, useEffect } from 'react';
import {
    IoAddOutline, IoPencilOutline, IoTrashOutline, IoPeopleOutline,
    IoLocationOutline, IoTimeOutline, IoPersonOutline, IoCloseOutline,
    IoSearchOutline, IoPersonAddOutline,
} from 'react-icons/io5';
import * as groupsApi from '../src/api/groups';
import type { Group, CreateGroupData } from '../src/api/groups';
import { useToast } from '../src/components/Toast';
import { usePermissions } from '../src/hooks/usePermissions';
import { Permission } from '../src/utils/permissions';
import { apiClient } from '../src/api/client';

const MEETING_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES = ['Bible Study', 'Prayer', 'Youth', 'Womens', 'Mens', 'Couples', 'Singles', 'Senior', 'Community', 'Other'];

interface MinimalMember {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    photoUrl?: string;
}

const emptyForm = (): CreateGroupData => ({
    name: '',
    description: '',
    category: '',
    meetingDay: '',
    meetingTime: '',
    location: '',
    maxCapacity: undefined,
    leaderId: null,
    isActive: true,
});

export default function GroupsPage() {
    const { showSuccess, showError } = useToast();
    const { can } = usePermissions();
    const canManage = can(Permission.SERVE_TEAM_CREATE);

    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [formData, setFormData] = useState<CreateGroupData>(emptyForm());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Member add state
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [members, setMembers] = useState<MinimalMember[]>([]);
    const [memberSearch, setMemberSearch] = useState('');
    const [isAddingMember, setIsAddingMember] = useState(false);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const data = await groupsApi.getGroups();
            setGroups(data);
        } catch {
            showError('Failed to load groups');
        } finally {
            setIsLoading(false);
        }
    };

    const loadGroupDetail = async (groupId: string) => {
        try {
            const data = await groupsApi.getGroup(groupId);
            setSelectedGroup(data);
        } catch {
            showError('Failed to load group details');
        }
    };

    const loadMembers = async () => {
        try {
            const res = await apiClient.get<{ data: MinimalMember[] }>('/api/members?limit=500');
            setMembers(res.data.data);
        } catch {
            showError('Failed to load members');
        }
    };

    const openCreateModal = () => {
        setEditingGroup(null);
        setFormData(emptyForm());
        setIsGroupModalOpen(true);
    };

    const openEditModal = (group: Group) => {
        setEditingGroup(group);
        setFormData({
            name: group.name,
            description: group.description ?? '',
            category: group.category ?? '',
            meetingDay: group.meetingDay ?? '',
            meetingTime: group.meetingTime ?? '',
            location: group.location ?? '',
            maxCapacity: group.maxCapacity ?? undefined,
            leaderId: group.leaderId ?? null,
            isActive: group.isActive,
        });
        setIsGroupModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload: CreateGroupData = {
                ...formData,
                description: formData.description || undefined,
                category: formData.category || undefined,
                meetingDay: formData.meetingDay || undefined,
                meetingTime: formData.meetingTime || undefined,
                location: formData.location || undefined,
                leaderId: formData.leaderId || null,
            };

            if (editingGroup) {
                await groupsApi.updateGroup(editingGroup.id, payload);
                showSuccess('Group updated');
            } else {
                await groupsApi.createGroup(payload);
                showSuccess('Group created');
            }
            setIsGroupModalOpen(false);
            await loadGroups();
            if (selectedGroup && editingGroup?.id === selectedGroup.id) {
                await loadGroupDetail(editingGroup.id);
            }
        } catch (err: any) {
            showError(err?.response?.data?.error || 'Failed to save group');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (group: Group) => {
        try {
            await groupsApi.deleteGroup(group.id);
            showSuccess(`"${group.name}" deleted`);
            if (selectedGroup?.id === group.id) setSelectedGroup(null);
            await loadGroups();
        } catch {
            showError('Failed to delete group');
        }
    };

    const openMemberModal = async () => {
        await loadMembers();
        setMemberSearch('');
        setIsMemberModalOpen(true);
    };

    const handleAddMember = async (member: MinimalMember) => {
        if (!selectedGroup) return;
        setIsAddingMember(true);
        try {
            await groupsApi.addMember(selectedGroup.id, member.id);
            showSuccess(`${member.firstName} ${member.lastName} added`);
            await loadGroupDetail(selectedGroup.id);
            setIsMemberModalOpen(false);
        } catch (err: any) {
            showError(err?.response?.data?.error || 'Failed to add member');
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!selectedGroup) return;
        try {
            await groupsApi.removeMember(selectedGroup.id, memberId);
            showSuccess(`${memberName} removed`);
            await loadGroupDetail(selectedGroup.id);
        } catch {
            showError('Failed to remove member');
        }
    };

    const existingMemberIds = new Set(selectedGroup?.memberships?.map(m => m.memberId) ?? []);
    const filteredMembers = members.filter(m => {
        if (existingMemberIds.has(m.id)) return false;
        const q = memberSearch.toLowerCase();
        return !q || `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-[#14213D] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[2.125rem] font-bold tracking-tight text-[#14213D]">Connect Groups</h1>
                    <p className="text-sm text-[#6B6960] mt-1">Manage small groups and their members</p>
                </div>
                {canManage && (
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors"
                    >
                        <IoAddOutline size={20} />
                        New Group
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Groups list */}
                <div className="lg:col-span-1 space-y-3">
                    {groups.length === 0 && (
                        <div className="bg-white rounded-2xl border border-[#E5E0D2] p-8 text-center text-[#9E9D95] text-sm">
                            No groups yet. Create your first group to get started.
                        </div>
                    )}
                    {groups.map(group => (
                        <div
                            key={group.id}
                            onClick={() => loadGroupDetail(group.id)}
                            className={`bg-white rounded-xl border cursor-pointer transition-all p-4 ${
                                selectedGroup?.id === group.id
                                    ? 'border-[#14213D] shadow-md'
                                    : 'border-[#E5E0D2] hover:border-[#D8D2C2] hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-[#14213D] truncate">{group.name}</p>
                                        {!group.isActive && (
                                            <span className="text-[10px] font-semibold bg-[#EFEBE0] text-[#9E9D95] rounded px-1.5 py-0.5 shrink-0">Inactive</span>
                                        )}
                                    </div>
                                    {group.category && (
                                        <p className="text-[11px] text-[#6B6960] mt-0.5">{group.category}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2">
                                        {group.meetingDay && (
                                            <span className="flex items-center gap-1 text-[11px] text-[#6B6960]">
                                                <IoTimeOutline size={11} />
                                                {group.meetingDay}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 text-[11px] text-[#6B6960]">
                                            <IoPeopleOutline size={11} />
                                            {group._count?.memberships ?? 0}
                                            {group.maxCapacity ? ` / ${group.maxCapacity}` : ''}
                                        </span>
                                    </div>
                                </div>
                                {canManage && (
                                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => openEditModal(group)}
                                            className="p-1.5 text-[#9E9D95] hover:text-[#14213D] transition-colors"
                                            title="Edit"
                                        >
                                            <IoPencilOutline size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(group)}
                                            className="p-1.5 text-[#9E9D95] hover:text-[#B42626] transition-colors"
                                            title="Delete"
                                        >
                                            <IoTrashOutline size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Group detail */}
                <div className="lg:col-span-2">
                    {!selectedGroup ? (
                        <div className="bg-white rounded-2xl border border-[#E5E0D2] h-64 flex items-center justify-center text-[#9E9D95] text-sm">
                            Select a group to view its members
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-[#E5E0D2]">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-[#14213D]">{selectedGroup.name}</h2>
                                        {selectedGroup.description && (
                                            <p className="text-sm text-[#6B6960] mt-1">{selectedGroup.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-4 mt-3">
                                            {selectedGroup.category && (
                                                <span className="text-[11px] font-semibold bg-[#EFEBE0] text-[#6B6960] rounded px-2 py-0.5">{selectedGroup.category}</span>
                                            )}
                                            {selectedGroup.meetingDay && (
                                                <span className="flex items-center gap-1 text-xs text-[#6B6960]">
                                                    <IoTimeOutline size={13} />
                                                    {selectedGroup.meetingDay}{selectedGroup.meetingTime ? ` · ${selectedGroup.meetingTime}` : ''}
                                                </span>
                                            )}
                                            {selectedGroup.location && (
                                                <span className="flex items-center gap-1 text-xs text-[#6B6960]">
                                                    <IoLocationOutline size={13} />
                                                    {selectedGroup.location}
                                                </span>
                                            )}
                                            {selectedGroup.leader && (
                                                <span className="flex items-center gap-1 text-xs text-[#6B6960]">
                                                    <IoPersonOutline size={13} />
                                                    {selectedGroup.leader.firstName} {selectedGroup.leader.lastName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {canManage && (
                                        <button
                                            onClick={openMemberModal}
                                            className="flex items-center gap-1.5 bg-[#14213D] text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors shrink-0"
                                        >
                                            <IoPersonAddOutline size={16} />
                                            Add Member
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Members list */}
                            <div className="divide-y divide-[#E5E0D2]">
                                {(!selectedGroup.memberships || selectedGroup.memberships.length === 0) && (
                                    <div className="px-6 py-10 text-center text-sm text-[#9E9D95]">
                                        No members yet. Add members to this group.
                                    </div>
                                )}
                                {selectedGroup.memberships?.map(m => (
                                    <div key={m.id} className="px-6 py-3 flex items-center justify-between hover:bg-[#FAF8F4] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#EFEBE0] flex items-center justify-center text-[#6B6960] text-xs font-semibold shrink-0">
                                                {m.member?.firstName?.charAt(0)}{m.member?.lastName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#14213D]">
                                                    {m.member?.firstName} {m.member?.lastName}
                                                </p>
                                                {m.member?.email && (
                                                    <p className="text-xs text-[#9E9D95]">{m.member.email}</p>
                                                )}
                                            </div>
                                        </div>
                                        {canManage && (
                                            <button
                                                onClick={() => handleRemoveMember(m.memberId, `${m.member?.firstName} ${m.member?.lastName}`)}
                                                className="p-1.5 text-[#9E9D95] hover:text-[#B42626] transition-colors"
                                                title="Remove from group"
                                            >
                                                <IoTrashOutline size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Group Modal */}
            {isGroupModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[20px] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="border-b border-[#E5E0D2] px-6 py-5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-[#14213D]">
                                {editingGroup ? 'Edit Group' : 'New Group'}
                            </h2>
                            <button onClick={() => setIsGroupModalOpen(false)} className="text-[#9E9D95] hover:text-[#14213D]">
                                <IoCloseOutline size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                    Group Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311]"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311] resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311]"
                                    >
                                        <option value="">None</option>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                        Max Capacity
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.maxCapacity ?? ''}
                                        onChange={e => setFormData({ ...formData, maxCapacity: e.target.value ? parseInt(e.target.value) : undefined })}
                                        placeholder="Unlimited"
                                        className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                        Meeting Day
                                    </label>
                                    <select
                                        value={formData.meetingDay}
                                        onChange={e => setFormData({ ...formData, meetingDay: e.target.value })}
                                        className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311]"
                                    >
                                        <option value="">Not set</option>
                                        {MEETING_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                        Meeting Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.meetingTime}
                                        onChange={e => setFormData({ ...formData, meetingTime: e.target.value })}
                                        className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. Room 12, Online, etc."
                                    className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311]"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-[#D8D2C2] accent-[#14213D]"
                                />
                                <label htmlFor="isActive" className="text-sm text-[#14213D] font-medium">Active</label>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsGroupModalOpen(false)}
                                    className="bg-white border border-[#D8D2C2] text-[#14213D] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#FAF8F4] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving…' : (editingGroup ? 'Save Changes' : 'Create Group')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {isMemberModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[20px] shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="border-b border-[#E5E0D2] px-6 py-5 flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-bold text-[#14213D]">Add Member</h2>
                            <button onClick={() => setIsMemberModalOpen(false)} className="text-[#9E9D95] hover:text-[#14213D]">
                                <IoCloseOutline size={22} />
                            </button>
                        </div>

                        <div className="px-6 py-3 border-b border-[#E5E0D2] shrink-0">
                            <div className="relative">
                                <IoSearchOutline size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9D95]" />
                                <input
                                    type="text"
                                    placeholder="Search members…"
                                    value={memberSearch}
                                    onChange={e => setMemberSearch(e.target.value)}
                                    autoFocus
                                    className="bg-[#FAF8F4] border border-[#E5E0D2] rounded-lg pl-9 pr-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311]"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 divide-y divide-[#E5E0D2]">
                            {filteredMembers.length === 0 && (
                                <div className="px-6 py-8 text-center text-sm text-[#9E9D95]">
                                    {memberSearch ? 'No members match your search' : 'All members are already in this group'}
                                </div>
                            )}
                            {filteredMembers.map(member => (
                                <button
                                    key={member.id}
                                    onClick={() => handleAddMember(member)}
                                    disabled={isAddingMember}
                                    className="w-full flex items-center gap-3 px-6 py-3 hover:bg-[#FAF8F4] transition-colors text-left disabled:opacity-50"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#EFEBE0] flex items-center justify-center text-[#6B6960] text-xs font-semibold shrink-0">
                                        {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#14213D]">{member.firstName} {member.lastName}</p>
                                        {member.email && <p className="text-xs text-[#9E9D95]">{member.email}</p>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
