/**
 * Permission System
 * Defines all permissions and role-based access control
 */

/**
 * System Permissions
 * Each permission represents a specific action in the system
 */
export enum Permission {
  // User Management
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  // Member Management
  MEMBER_VIEW = 'member:view',
  MEMBER_CREATE = 'member:create',
  MEMBER_UPDATE = 'member:update',
  MEMBER_DELETE = 'member:delete',
  MEMBER_VIEW_ALL = 'member:view_all', // View all members vs only assigned
  MEMBER_ASSIGN = 'member:assign', // Assign members to users

  // Task Management
  TASK_VIEW = 'task:view',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_VIEW_ALL = 'task:view_all', // View all tasks vs only assigned
  TASK_ASSIGN = 'task:assign',

  // Communication
  COMM_SEND_EMAIL = 'comm:send_email',
  COMM_SEND_SMS = 'comm:send_sms',
  COMM_VIEW_HISTORY = 'comm:view_history',
  COMM_VIEW_ALL_HISTORY = 'comm:view_all_history',

  // AI Features
  AI_GENERATE_MESSAGE = 'ai:generate_message',
  AI_ANALYZE_JOURNEY = 'ai:analyze_journey',

  // Settings & Configuration
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update',
  SETTINGS_UPDATE_CHURCH = 'settings:update_church',
  SETTINGS_MANAGE_INTEGRATIONS = 'settings:manage_integrations',
  SETTINGS_MANAGE_AUTOMATION = 'settings:manage_automation',
  SETTINGS_MANAGE_PATHWAYS = 'settings:manage_pathways',

  // Reports & Analytics
  REPORTS_VIEW = 'reports:view',
  REPORTS_EXPORT = 'reports:export',
  REPORTS_VIEW_ALL = 'reports:view_all',

  // System Administration
  SYSTEM_VIEW_LOGS = 'system:view_logs',
  SYSTEM_MANAGE_TENANTS = 'system:manage_tenants', // Super Admin only
  SYSTEM_VIEW_HEALTH = 'system:view_health',
}

/**
 * Role to Permission Mapping
 * Defines which permissions each role has
 */
export const RolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    // Super Admin has ALL permissions
    ...Object.values(Permission),
  ],

  ADMIN: [
    // User Management
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    // Note: Cannot delete users or manage roles (only Super Admin)

    // Full Member Management
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_UPDATE,
    Permission.MEMBER_DELETE,
    Permission.MEMBER_VIEW_ALL,
    Permission.MEMBER_ASSIGN,

    // Full Task Management
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_VIEW_ALL,
    Permission.TASK_ASSIGN,

    // Full Communication
    Permission.COMM_SEND_EMAIL,
    Permission.COMM_SEND_SMS,
    Permission.COMM_VIEW_HISTORY,
    Permission.COMM_VIEW_ALL_HISTORY,

    // AI Features
    Permission.AI_GENERATE_MESSAGE,
    Permission.AI_ANALYZE_JOURNEY,

    // Full Settings Access
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,
    Permission.SETTINGS_UPDATE_CHURCH,
    Permission.SETTINGS_MANAGE_INTEGRATIONS,
    Permission.SETTINGS_MANAGE_AUTOMATION,
    Permission.SETTINGS_MANAGE_PATHWAYS,

    // Full Reports
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.REPORTS_VIEW_ALL,

    // System Health
    Permission.SYSTEM_VIEW_HEALTH,
    Permission.SYSTEM_VIEW_LOGS,
  ],

  VOLUNTEER: [
    // Basic User Management
    Permission.USER_VIEW, // Can view other users

    // Limited Member Management
    Permission.MEMBER_VIEW, // Can view members
    Permission.MEMBER_CREATE, // Can add new members
    Permission.MEMBER_UPDATE, // Can update members
    // Cannot delete members
    // Can only view assigned members (not MEMBER_VIEW_ALL)

    // Limited Task Management
    Permission.TASK_VIEW, // Can view tasks
    Permission.TASK_CREATE, // Can create tasks
    Permission.TASK_UPDATE, // Can update tasks
    // Cannot delete tasks
    // Can only view assigned tasks (not TASK_VIEW_ALL)

    // Basic Communication
    Permission.COMM_SEND_EMAIL,
    Permission.COMM_SEND_SMS,
    Permission.COMM_VIEW_HISTORY, // Only for assigned members

    // AI Features
    Permission.AI_GENERATE_MESSAGE,
    Permission.AI_ANALYZE_JOURNEY,

    // View-Only Settings
    Permission.SETTINGS_VIEW,

    // Basic Reports
    Permission.REPORTS_VIEW, // Only for assigned members

    // System Health
    Permission.SYSTEM_VIEW_HEALTH,
  ],

  // Team Leader role (between Volunteer and Admin)
  TEAM_LEADER: [
    // User Management
    Permission.USER_VIEW,

    // Extended Member Management
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_UPDATE,
    Permission.MEMBER_VIEW_ALL, // Can view all members
    Permission.MEMBER_ASSIGN, // Can assign members to volunteers

    // Extended Task Management
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_VIEW_ALL, // Can view all tasks
    Permission.TASK_ASSIGN, // Can assign tasks

    // Full Communication
    Permission.COMM_SEND_EMAIL,
    Permission.COMM_SEND_SMS,
    Permission.COMM_VIEW_HISTORY,
    Permission.COMM_VIEW_ALL_HISTORY,

    // AI Features
    Permission.AI_GENERATE_MESSAGE,
    Permission.AI_ANALYZE_JOURNEY,

    // Limited Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE, // Basic settings only

    // Extended Reports
    Permission.REPORTS_VIEW,
    Permission.REPORTS_VIEW_ALL,
    Permission.REPORTS_EXPORT,

    // System Health
    Permission.SYSTEM_VIEW_HEALTH,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = RolePermissions[role];
  if (!permissions) {
    return false;
  }
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): Permission[] {
  return RolePermissions[role] || [];
}

/**
 * Resource ownership check
 * Determines if a user can access a resource based on ownership
 */
export function canAccessResource(
  userRole: string,
  userId: string,
  resourceOwnerId: string,
  requiredPermission: Permission
): boolean {
  // Super Admin can access everything
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  // Check if user has the permission
  if (!hasPermission(userRole, requiredPermission)) {
    return false;
  }

  // If user has "view_all" or "manage_all" permission, they can access any resource
  const viewAllPermission = `${requiredPermission.split(':')[0]}:view_all` as Permission;
  if (hasPermission(userRole, viewAllPermission)) {
    return true;
  }

  // Otherwise, user can only access their own resources
  return userId === resourceOwnerId;
}
