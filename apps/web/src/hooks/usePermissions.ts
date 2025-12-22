import { useAppContext } from '../context/AppContext';
import {
  Permission,
  UserRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
} from '../utils/permissions';

/**
 * Hook for checking user permissions
 */
export const usePermissions = () => {
  const { currentUser } = useAppContext();

  const userRole = (currentUser?.role as UserRole) || 'VOLUNTEER';

  return {
    userRole,
    currentUser,

    /**
     * Check if user has a specific permission
     */
    can: (permission: Permission): boolean => {
      return hasPermission(userRole, permission);
    },

    /**
     * Check if user has any of the specified permissions
     */
    canAny: (permissions: Permission[]): boolean => {
      return hasAnyPermission(userRole, permissions);
    },

    /**
     * Check if user has all of the specified permissions
     */
    canAll: (permissions: Permission[]): boolean => {
      return hasAllPermissions(userRole, permissions);
    },

    /**
     * Check if user has a specific role
     */
    hasRole: (role: UserRole): boolean => {
      return userRole === role;
    },

    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole: (roles: UserRole[]): boolean => {
      return roles.includes(userRole);
    },

    /**
     * Get all permissions for current user
     */
    getPermissions: (): Permission[] => {
      return getRolePermissions(userRole);
    },

    /**
     * Check if user is super admin
     */
    isSuperAdmin: (): boolean => {
      return userRole === 'SUPER_ADMIN';
    },

    /**
     * Check if user is admin (church level)
     */
    isAdmin: (): boolean => {
      return userRole === 'ADMIN';
    },

    /**
     * Check if user is team leader
     */
    isTeamLeader: (): boolean => {
      return userRole === 'TEAM_LEADER';
    },

    /**
     * Check if user is volunteer
     */
    isVolunteer: (): boolean => {
      return userRole === 'VOLUNTEER';
    },

    /**
     * Check if user can view all members (not just assigned)
     */
    canViewAllMembers: (): boolean => {
      return hasPermission(userRole, Permission.MEMBER_VIEW_ALL);
    },

    /**
     * Check if user can view all tasks (not just assigned)
     */
    canViewAllTasks: (): boolean => {
      return hasPermission(userRole, Permission.TASK_VIEW_ALL);
    },
  };
};
