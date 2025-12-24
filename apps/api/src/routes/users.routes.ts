import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import userService from '../services/user.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/permissions.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'VOLUNTEER']),
    phone: z.string().optional(),
});

const updateUserSchema = z.object({
    email: z.string().email('Invalid email format').optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'VOLUNTEER']).optional(),
    onboardingComplete: z.boolean().optional(),
});

const updateRoleSchema = z.object({
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'VOLUNTEER']),
});

const userIdSchema = z.object({
    id: z.string().uuid('Invalid user ID'),
});

/**
 * GET /api/users
 * List all users in the tenant
 * Required permission: USER_VIEW (Admin+)
 */
router.get(
    '/',
    requirePermission(Permission.USER_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { role } = req.query;
            const users = await userService.getUsers(
                req.user!.tenantId,
                role as string | undefined
            );

            res.json({
                data: users,
                meta: {
                    total: users.length,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/users/stats
 * Get user statistics
 * Required permission: USER_VIEW (Admin+)
 */
router.get(
    '/stats',
    requirePermission(Permission.USER_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await userService.getUserStats(req.user!.tenantId);

            res.json({
                data: stats,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/users/:id
 * Get user by ID
 * Required permission: USER_VIEW (Admin+)
 */
router.get(
    '/:id',
    requirePermission(Permission.USER_VIEW),
    validateParams(userIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await userService.getUserById(
                req.params.id,
                req.user!.tenantId
            );

            res.json({
                data: user,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/users
 * Create a new user
 * Required permission: USER_CREATE (Admin+)
 */
router.post(
    '/',
    requirePermission(Permission.USER_CREATE),
    validateBody(createUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await userService.createUser({
                ...req.body,
                tenantId: req.user!.tenantId,
            });

            res.status(201).json({
                data: user,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/users/:id
 * Update user
 * Required permission: USER_UPDATE (Admin+)
 */
router.patch(
    '/:id',
    requirePermission(Permission.USER_UPDATE),
    validateParams(userIdSchema),
    validateBody(updateUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await userService.updateUser(
                req.params.id,
                req.user!.tenantId,
                req.body
            );

            res.json({
                data: user,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/users/:id/role
 * Update user role
 * Required permission: USER_UPDATE (Admin+)
 */
router.patch(
    '/:id/role',
    requirePermission(Permission.USER_UPDATE),
    validateParams(userIdSchema),
    validateBody(updateRoleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await userService.updateUserRole(
                req.params.id,
                req.user!.tenantId,
                req.body.role,
                req.user!.role
            );

            res.json({
                data: user,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/users/:id
 * Delete user
 * Required permission: USER_DELETE (Admin+)
 */
router.delete(
    '/:id',
    requirePermission(Permission.USER_DELETE),
    validateParams(userIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await userService.deleteUser(
                req.params.id,
                req.user!.tenantId,
                req.user!.userId
            );

            res.json({
                data: result,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
