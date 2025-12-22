import React, { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { Permission, UserRole } from '../utils/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
  role?: UserRole;
  roles?: UserRole[];
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 *
 * Usage:
 * <PermissionGuard permission={Permission.MEMBER_DELETE}>
 *   <button>Delete Member</button>
 * </PermissionGuard>
 *
 * <PermissionGuard permissions={[Permission.ADMIN_VIEW_LOGS]} fallback={<p>Access denied</p>}>
 *   <AdminPanel />
 * </PermissionGuard>
 *
 * <PermissionGuard role="ADMIN">
 *   <AdminSettings />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  fallback = null,
}) => {
  const { can, canAny, canAll, hasRole, hasAnyRole } = usePermissions();

  let hasAccess = true;

  // Check single permission
  if (permission) {
    hasAccess = can(permission);
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  }

  // Check single role
  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    hasAccess = hasAccess && hasAnyRole(roles);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

interface CanAccessProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
}

/**
 * Simpler component for single permission check
 *
 * Usage:
 * <CanAccess permission={Permission.MEMBER_DELETE}>
 *   <button>Delete</button>
 * </CanAccess>
 */
export const CanAccess: React.FC<CanAccessProps> = ({
  children,
  permission,
  fallback = null,
}) => {
  const { can } = usePermissions();

  return can(permission) ? <>{children}</> : <>{fallback}</>;
};

interface RoleGuardProps {
  children: ReactNode;
  role?: UserRole;
  roles?: UserRole[];
  fallback?: ReactNode;
}

/**
 * Component for role-based rendering
 *
 * Usage:
 * <RoleGuard role="ADMIN">
 *   <AdminPanel />
 * </RoleGuard>
 *
 * <RoleGuard roles={["ADMIN", "TEAM_LEADER"]}>
 *   <ManagerTools />
 * </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  roles,
  fallback = null,
}) => {
  const { hasRole, hasAnyRole } = usePermissions();

  let hasAccess = true;

  if (role) {
    hasAccess = hasRole(role);
  }

  if (roles && roles.length > 0) {
    hasAccess = hasAnyRole(roles);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
