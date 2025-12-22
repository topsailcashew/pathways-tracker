/**
 * User & Role Management Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission, requireRole } from '../middleware/permissions.middleware.js';
import { Permission } from '../config/permissions.js';
import { getFirestore, Collections } from '../config/firestore.js';
import { User, UserRole } from '../types/models.js';
import * as authService from '../services/auth.service.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  location: z.string().optional(),
  postalCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'VOLUNTEER']),
});

const idParamSchema = z.object({
  id: z.string(),
});

/**
 * GET /api/users
 * List all users (requires USER_VIEW permission)
 */
router.get('/', requirePermission(Permission.USER_VIEW), async (req, res, next) => {
  try {
    const db = getFirestore();
    const usersSnapshot = await db.collection(Collections.USERS).get();

    const users = usersSnapshot.docs.map((doc) => {
      const user = doc.data() as User;
      const { password, refreshToken, ...userWithoutSensitive } = user;
      return userWithoutSensitive;
    });

    res.json({ users, total: users.length });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:id
 * Get a single user
 */
router.get('/:id', requirePermission(Permission.USER_VIEW), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/:id
 * Update user profile (users can update their own profile, or admins can update any)
 */
router.put('/:id', validateParams(idParamSchema), validateBody(updateUserSchema), async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Users can update their own profile
    const canUpdate =
      req.user!.userId === userId || authService.hasPermission(req.user!.role, Permission.USER_UPDATE);

    if (!canUpdate) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const db = getFirestore();
    const userRef = db.collection(Collections.USERS).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user
    await userRef.update({
      ...req.body,
      updatedAt: new Date().toISOString(),
    });

    // Get updated user
    const updatedUser = await authService.getUserById(userId);
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/:id/role
 * Update user role (requires USER_MANAGE_ROLES permission - Super Admin only)
 */
router.put(
  '/:id/role',
  requirePermission(Permission.USER_MANAGE_ROLES),
  validateParams(idParamSchema),
  validateBody(updateRoleSchema),
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;

      // Cannot change own role
      if (req.user!.userId === userId) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }

      const db = getFirestore();
      const userRef = db.collection(Collections.USERS).doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update role
      await userRef.update({
        role: UserRole[role],
        updatedAt: new Date().toISOString(),
      });

      // Get updated user
      const updatedUser = await authService.getUserById(userId);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/users/:id
 * Delete user (requires USER_DELETE permission - Super Admin only)
 */
router.delete(
  '/:id',
  requirePermission(Permission.USER_DELETE),
  validateParams(idParamSchema),
  async (req, res, next) => {
    try {
      const userId = req.params.id;

      // Cannot delete own account
      if (req.user!.userId === userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const db = getFirestore();
      const userRef = db.collection(Collections.USERS).doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete user
      await userRef.delete();

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users/me/permissions
 * Get current user's permissions
 */
router.get('/me/permissions', async (req, res, next) => {
  try {
    const permissions = authService.getRolePermissions(req.user!.role);
    res.json({
      role: req.user!.role,
      permissions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
