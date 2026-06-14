import React, { useState, useEffect } from 'react';
import { IoAddOutline, IoPencilOutline, IoTrashOutline, IoPersonOutline, IoMailOutline } from 'react-icons/io5';
import * as usersApi from '../src/api/users';
import { ROLE_LABELS, type UserRole } from '../src/api/users';
import { useToast } from '../src/components/Toast';
import { usePermissions } from '../src/hooks/usePermissions';
import { Permission } from '../src/utils/permissions';

// Which roles each inviter can assign (mirrors backend ASSIGNABLE_ROLES)
const ASSIGNABLE_ROLES: Record<UserRole, UserRole[]> = {
    SUPER_ADMIN:     ['CHURCH_ADMIN', 'PASTOR', 'MINISTRY_LEADER', 'VOLUNTEER'],
    CHURCH_ADMIN:    ['PASTOR', 'MINISTRY_LEADER', 'VOLUNTEER'],
    PASTOR:          ['MINISTRY_LEADER', 'VOLUNTEER'],
    MINISTRY_LEADER: ['VOLUNTEER'],
    VOLUNTEER:       [],
};

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
    onboardingComplete: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const { showSuccess, showError } = useToast();
    const { can, userRole } = usePermissions();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const assignableRoles = ASSIGNABLE_ROLES[userRole] ?? [];

    const defaultRole = (assignableRoles[assignableRoles.length - 1] ?? 'VOLUNTEER') as UserRole;

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: defaultRole,
        phone: '',
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await usersApi.getUsers();
            setUsers(data as User[]);
        } catch {
            showError('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingUser) {
                await usersApi.updateUser(editingUser.id, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    role: formData.role,
                });
                showSuccess('User updated successfully');
            } else {
                await usersApi.inviteByEmail({
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    role: formData.role,
                    phone: formData.phone || undefined,
                });
                showSuccess(`Invitation sent to ${formData.email}`);
            }
            setIsModalOpen(false);
            resetForm();
            loadUsers();
        } catch (err: any) {
            const msg = err?.response?.data?.error;
            showError(msg || (editingUser ? 'Failed to update user' : 'Failed to send invitation'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (userId: string, userName: string) => {
        try {
            await usersApi.deleteUser(userId);
            showSuccess(`${userName} has been removed`);
            loadUsers();
        } catch {
            showError('Failed to remove user');
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone || '',
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({ email: '', firstName: '', lastName: '', role: defaultRole, phone: '' });
    };

    const getRoleBadgeClasses = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN':     return 'bg-[#14213D] text-white';
            case 'CHURCH_ADMIN':    return 'bg-[#1F2D52] text-white';
            case 'PASTOR':          return 'bg-[#FCA311]/20 text-[#B8732A]';
            case 'MINISTRY_LEADER': return 'bg-[#4F7E50]/15 text-[#4F7E50]';
            default:                return 'bg-[#EFEBE0] text-[#6B6960]';
        }
    };

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
                    <h1 className="text-[2.125rem] font-bold tracking-tight text-[#14213D]">Team Members</h1>
                    <p className="text-sm text-[#6B6960] mt-1">Manage your church team and their roles</p>
                </div>

                {can(Permission.USER_CREATE) && assignableRoles.length > 0 && (
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors"
                    >
                        <IoAddOutline size={20} />
                        Invite User
                    </button>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm overflow-hidden">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-[#E5E0D2]">
                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Name</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Email</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Phone</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Role</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Status</th>
                            {can(Permission.USER_UPDATE) && (
                                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-[#E5E0D2] last:border-0 hover:bg-[#FAF8F4] transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 h-9 w-9 bg-[#EFEBE0] rounded-full flex items-center justify-center">
                                            <IoPersonOutline className="h-4 w-4 text-[#6B6960]" />
                                        </div>
                                        <span className="text-sm font-medium text-[#14213D]">
                                            {user.firstName} {user.lastName}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6960]">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6960]">{user.phone || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`text-[11px] font-semibold rounded-[4px] px-2 py-0.5 ${getRoleBadgeClasses(user.role)}`}>
                                        {ROLE_LABELS[user.role] ?? user.role.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="flex items-center gap-1.5">
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${user.onboardingComplete ? 'bg-[#4F7E50]' : 'bg-[#9E9D95]'}`} />
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">
                                            {user.onboardingComplete ? 'Active' : 'Invited'}
                                        </span>
                                    </span>
                                </td>
                                {can(Permission.USER_UPDATE) && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="p-1.5 text-[#9E9D95] hover:text-[#14213D] transition-colors mr-1"
                                            title="Edit user"
                                        >
                                            <IoPencilOutline size={18} />
                                        </button>
                                        {can(Permission.USER_DELETE) && (
                                            <button
                                                onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                                                className="p-1.5 text-[#9E9D95] hover:text-[#B42626] transition-colors"
                                                title="Remove user"
                                            >
                                                <IoTrashOutline size={18} />
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="text-center py-12 text-[#9E9D95]">
                        No team members yet. Invite your first team member to get started.
                    </div>
                )}
            </div>

            {/* Invite / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[20px] shadow-xl w-full max-w-md">
                        <div className="border-b border-[#E5E0D2] px-6 py-5">
                            <h2 className="text-lg font-bold text-[#14213D]">
                                {editingUser ? 'Edit Team Member' : 'Invite Team Member'}
                            </h2>
                            {!editingUser && (
                                <p className="text-sm text-[#6B6960] mt-1 flex items-center gap-1.5">
                                    <IoMailOutline size={14} />
                                    They'll receive an email with a link to set up their account.
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                        className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                        className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    disabled={!!editingUser}
                                    className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311] disabled:bg-[#FAF8F4] disabled:text-[#9E9D95]"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311]"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                                    Role *
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(252,163,17,0.25)] focus:border-[#FCA311]"
                                >
                                    {(editingUser
                                        ? (Object.keys(ROLE_LABELS) as UserRole[]).filter(r => r !== 'SUPER_ADMIN')
                                        : assignableRoles
                                    ).map((role) => (
                                        <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="bg-white border border-[#D8D2C2] text-[#14213D] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#FAF8F4] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting
                                        ? (editingUser ? 'Saving…' : 'Sending…')
                                        : (editingUser ? 'Save Changes' : 'Send Invitation')
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
