// Define all permissions (mirroring backend)
export enum Permission {
  // User permissions
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  // Member permissions
  MEMBER_VIEW = 'member:view',
  MEMBER_VIEW_ALL = 'member:view_all',
  MEMBER_CREATE = 'member:create',
  MEMBER_UPDATE = 'member:update',
  MEMBER_DELETE = 'member:delete',
  MEMBER_ASSIGN = 'member:assign',

  // Task permissions
  TASK_VIEW = 'task:view',
  TASK_VIEW_ALL = 'task:view_all',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',

  // Stage permissions
  STAGE_VIEW = 'stage:view',
  STAGE_CREATE = 'stage:create',
  STAGE_UPDATE = 'stage:update',
  STAGE_DELETE = 'stage:delete',
  STAGE_REORDER = 'stage:reorder',

  // Automation permissions
  AUTOMATION_VIEW = 'automation:view',
  AUTOMATION_CREATE = 'automation:create',
  AUTOMATION_UPDATE = 'automation:update',
  AUTOMATION_DELETE = 'automation:delete',

  // Communication permissions
  COMMUNICATION_SEND_EMAIL = 'communication:send_email',
  COMMUNICATION_SEND_SMS = 'communication:send_sms',
  COMMUNICATION_VIEW_HISTORY = 'communication:view_history',
  COMMUNICATION_USE_AI = 'communication:use_ai',

  // Settings permissions
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update',

  // Integration permissions
  INTEGRATION_VIEW = 'integration:view',
  INTEGRATION_CREATE = 'integration:create',
  INTEGRATION_UPDATE = 'integration:update',
  INTEGRATION_DELETE = 'integration:delete',
  INTEGRATION_SYNC = 'integration:sync',

  // Analytics permissions
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',

  // Form permissions
  FORM_VIEW = 'form:view',
  FORM_CREATE = 'form:create',
  FORM_UPDATE = 'form:update',
  FORM_DELETE = 'form:delete',

  // Admin permissions
  ADMIN_VIEW_LOGS = 'admin:view_logs',
  ADMIN_MANAGE_TENANTS = 'admin:manage_tenants',
  ADMIN_VIEW_HEALTH = 'admin:view_health',

  // Academy permissions
  ACADEMY_VIEW = 'academy:view',
  ACADEMY_ENROLL = 'academy:enroll',
  ACADEMY_SUBMIT_QUIZ = 'academy:submit_quiz',
  ACADEMY_MANAGE_TRACKS = 'academy:manage_tracks',
  ACADEMY_MANAGE_MODULES = 'academy:manage_modules',
  ACADEMY_MANAGE_QUIZZES = 'academy:manage_quizzes',
  ACADEMY_VIEW_PROGRESS = 'academy:view_progress',
  ACADEMY_VIEW_ALL_PROGRESS = 'academy:view_all_progress',
  ACADEMY_HUDDLE_COMMENT = 'academy:huddle_comment',
}

// Role definitions
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEADER' | 'VOLUNTEER';

// Role-based permissions mapping
export const RolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission), // All permissions

  ADMIN: [
    // Users
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ROLES,

    // Members
    Permission.MEMBER_VIEW,
    Permission.MEMBER_VIEW_ALL,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_UPDATE,
    Permission.MEMBER_DELETE,
    Permission.MEMBER_ASSIGN,

    // Tasks
    Permission.TASK_VIEW,
    Permission.TASK_VIEW_ALL,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,

    // Stages
    Permission.STAGE_VIEW,
    Permission.STAGE_CREATE,
    Permission.STAGE_UPDATE,
    Permission.STAGE_DELETE,
    Permission.STAGE_REORDER,

    // Automation
    Permission.AUTOMATION_VIEW,
    Permission.AUTOMATION_CREATE,
    Permission.AUTOMATION_UPDATE,
    Permission.AUTOMATION_DELETE,

    // Communication
    Permission.COMMUNICATION_SEND_EMAIL,
    Permission.COMMUNICATION_SEND_SMS,
    Permission.COMMUNICATION_VIEW_HISTORY,
    Permission.COMMUNICATION_USE_AI,

    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,

    // Integrations
    Permission.INTEGRATION_VIEW,
    Permission.INTEGRATION_CREATE,
    Permission.INTEGRATION_UPDATE,
    Permission.INTEGRATION_DELETE,
    Permission.INTEGRATION_SYNC,

    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,

    // Forms
    Permission.FORM_VIEW,
    Permission.FORM_CREATE,
    Permission.FORM_UPDATE,
    Permission.FORM_DELETE,

    // Academy
    Permission.ACADEMY_VIEW,
    Permission.ACADEMY_ENROLL,
    Permission.ACADEMY_SUBMIT_QUIZ,
    Permission.ACADEMY_MANAGE_TRACKS,
    Permission.ACADEMY_MANAGE_MODULES,
    Permission.ACADEMY_MANAGE_QUIZZES,
    Permission.ACADEMY_VIEW_PROGRESS,
    Permission.ACADEMY_VIEW_ALL_PROGRESS,
    Permission.ACADEMY_HUDDLE_COMMENT,
  ],

  TEAM_LEADER: [
    // Users (view only)
    Permission.USER_VIEW,

    // Members
    Permission.MEMBER_VIEW,
    Permission.MEMBER_VIEW_ALL,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_UPDATE,
    Permission.MEMBER_ASSIGN,

    // Tasks
    Permission.TASK_VIEW,
    Permission.TASK_VIEW_ALL,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_ASSIGN,

    // Stages (view only)
    Permission.STAGE_VIEW,

    // Automation (view only)
    Permission.AUTOMATION_VIEW,

    // Communication
    Permission.COMMUNICATION_SEND_EMAIL,
    Permission.COMMUNICATION_SEND_SMS,
    Permission.COMMUNICATION_VIEW_HISTORY,
    Permission.COMMUNICATION_USE_AI,

    // Settings (view only)
    Permission.SETTINGS_VIEW,

    // Integrations (view only)
    Permission.INTEGRATION_VIEW,

    // Analytics
    Permission.ANALYTICS_VIEW,

    // Forms (view only)
    Permission.FORM_VIEW,

    // Academy
    Permission.ACADEMY_VIEW,
    Permission.ACADEMY_ENROLL,
    Permission.ACADEMY_SUBMIT_QUIZ,
    Permission.ACADEMY_VIEW_PROGRESS,
    Permission.ACADEMY_VIEW_ALL_PROGRESS,
    Permission.ACADEMY_HUDDLE_COMMENT,
  ],

  VOLUNTEER: [
    // Members (assigned only)
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_UPDATE,

    // Tasks (assigned only)
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,

    // Stages (view only)
    Permission.STAGE_VIEW,

    // Communication
    Permission.COMMUNICATION_SEND_EMAIL,
    Permission.COMMUNICATION_SEND_SMS,
    Permission.COMMUNICATION_VIEW_HISTORY,
    Permission.COMMUNICATION_USE_AI,

    // Settings (view only)
    Permission.SETTINGS_VIEW,

    // Academy
    Permission.ACADEMY_VIEW,
    Permission.ACADEMY_ENROLL,
    Permission.ACADEMY_SUBMIT_QUIZ,
    Permission.ACADEMY_VIEW_PROGRESS,
    Permission.ACADEMY_HUDDLE_COMMENT,
  ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  const permissions = RolePermissions[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (
  role: UserRole,
  permissions: Permission[]
): boolean => {
  return permissions.some((permission) => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (
  role: UserRole,
  permissions: Permission[]
): boolean => {
  return permissions.every((permission) => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return RolePermissions[role] || [];
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Church Admin',
    TEAM_LEADER: 'Team Leader',
    VOLUNTEER: 'Volunteer',
  };
  return roleNames[role] || role;
};

/**
 * Get role description
 */
export const getRoleDescription = (role: UserRole): string => {
  const descriptions: Record<UserRole, string> = {
    SUPER_ADMIN: 'Full system access across all churches',
    ADMIN: 'Full church management access',
    TEAM_LEADER: 'Manage team members and tasks',
    VOLUNTEER: 'View and update assigned members',
  };
  return descriptions[role] || '';
};

/**
 * Get role color for UI
 */
export const getRoleColor = (role: UserRole): string => {
  const colors: Record<UserRole, string> = {
    SUPER_ADMIN: 'purple',
    ADMIN: 'blue',
    TEAM_LEADER: 'green',
    VOLUNTEER: 'gray',
  };
  return colors[role] || 'gray';
};
