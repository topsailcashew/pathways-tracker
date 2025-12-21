/**
 * Permission Middleware
 * Checks if authenticated user has required permissions
 */

import { Request, Response, NextFunction } from 'express';
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '../config/permissions.js';

/**
 * Require specific permission
 * Usage: router.get('/path', authenticate, requirePermission(Permission.MEMBER_VIEW), handler)
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
        userRole: req.user.role,
      });
    }

    next();
  };
}

/**
 * Require any of the specified permissions
 * Usage: router.get('/path', authenticate, requireAnyPermission([Permission.A, Permission.B]), handler)
 */
export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: `Any of: ${permissions.join(', ')}`,
        userRole: req.user.role,
      });
    }

    next();
  };
}

/**
 * Require all of the specified permissions
 * Usage: router.get('/path', authenticate, requireAllPermissions([Permission.A, Permission.B]), handler)
 */
export function requireAllPermissions(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: `All of: ${permissions.join(', ')}`,
        userRole: req.user.role,
      });
    }

    next();
  };
}

/**
 * Require specific role(s)
 * Usage: router.get('/path', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), handler)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: `Role must be one of: ${allowedRoles.join(', ')}`,
        userRole: req.user.role,
      });
    }

    next();
  };
}

/**
 * Check resource ownership
 * Middleware factory that checks if user can access a resource
 */
export function checkResourceOwnership(getResourceOwnerId: (req: Request) => Promise<string | null>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Super Admin can access everything
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    try {
      const resourceOwnerId = await getResourceOwnerId(req);

      if (!resourceOwnerId) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // User can access their own resources
      if (req.user.userId === resourceOwnerId) {
        return next();
      }

      // Check if user has permission to view all resources
      // This will be checked in the route handler based on the specific permission
      return res.status(403).json({
        error: 'You do not have permission to access this resource',
      });
    } catch (error) {
      next(error);
    }
  };
}
