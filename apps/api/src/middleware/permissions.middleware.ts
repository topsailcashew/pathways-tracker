import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import logger from '../utils/logger';

// Define all permissions
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
}

// Role-based permissions mapping
export const RolePermissions: Record<string, Permission[]> = {
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
    ],
};

// Middleware to check permissions
export const requirePermission = (...permissions: Permission[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
        }

        const userPermissions = RolePermissions[req.user.role] || [];

        // Check if user has at least one of the required permissions
        const hasPermission = permissions.some((permission) =>
            userPermissions.includes(permission)
        );

        if (!hasPermission) {
            logger.warn(`Permission denied for user ${req.user.userId}`, {
                required: permissions,
                userRole: req.user.role,
            });

            return next(
                new AppError(
                    403,
                    'FORBIDDEN',
                    'You do not have permission to perform this action',
                    { required: permissions }
                )
            );
        }

        next();
    };
};

// Middleware to check if user has specific role
export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    403,
                    'FORBIDDEN',
                    'You do not have the required role',
                    { required: roles, current: req.user.role }
                )
            );
        }

        next();
    };
};

// Helper to check if user has permission
export const hasPermission = (role: string, permission: Permission): boolean => {
    const permissions = RolePermissions[role] || [];
    return permissions.includes(permission);
};

// Helper to get all permissions for a role
export const getRolePermissions = (role: string): Permission[] => {
    return RolePermissions[role] || [];
};
