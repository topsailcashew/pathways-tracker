import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import userService from '../services/user.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/permissions.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import prisma from '../config/database';
import supabaseAdmin from '../config/supabase';
import logger from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const ALL_ROLES = ['SUPER_ADMIN', 'CHURCH_ADMIN', 'PASTOR', 'MINISTRY_LEADER', 'VOLUNTEER'] as const;
type AppRole = typeof ALL_ROLES[number];

// Which roles a given role can invite/assign (hierarchy)
const ASSIGNABLE_ROLES: Record<AppRole, AppRole[]> = {
    SUPER_ADMIN:    ['CHURCH_ADMIN', 'PASTOR', 'MINISTRY_LEADER', 'VOLUNTEER'],
    CHURCH_ADMIN:   ['PASTOR', 'MINISTRY_LEADER', 'VOLUNTEER'],
    PASTOR:         ['MINISTRY_LEADER', 'VOLUNTEER'],
    MINISTRY_LEADER:['VOLUNTEER'],
    VOLUNTEER:      [],
};

const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(ALL_ROLES),
    phone: z.string().optional(),
});

const updateUserSchema = z.object({
    email: z.string().email('Invalid email format').optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    role: z.enum(ALL_ROLES).optional(),
    onboardingComplete: z.boolean().optional(),
});

const updateRoleSchema = z.object({
    role: z.enum(ALL_ROLES),
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
                role as any
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
 * POST /api/users/invite
 * Invite a member to create a user account
 * Required permission: USER_CREATE (Admin+)
 */
const inviteSchema = z.object({
    memberId: z.string().uuid('Invalid member ID'),
});

router.post(
    '/invite',
    requirePermission(Permission.USER_CREATE),
    validateBody(inviteSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { memberId } = req.body;
            const tenantId = req.user!.tenantId;

            // 1. Look up the member
            const member = await prisma.member.findFirst({
                where: { id: memberId, tenantId },
                select: { id: true, email: true, firstName: true, lastName: true },
            });

            if (!member) {
                res.status(404).json({ error: 'Member not found' });
                return;
            }

            if (!member.email) {
                res.status(400).json({ error: 'Member does not have an email address' });
                return;
            }

            // 2. Check no user already exists for this email in this tenant
            const existingUser = await prisma.user.findFirst({
                where: { tenantId, email: member.email.toLowerCase() },
            });

            if (existingUser) {
                res.status(409).json({ error: 'A user account already exists for this email' });
                return;
            }

            // 3. Pre-create the User row so syncUser finds it on first login
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName + ' ' + member.lastName)}&background=random`;

            await prisma.user.create({
                data: {
                    tenantId,
                    email: member.email.toLowerCase(),
                    firstName: member.firstName,
                    lastName: member.lastName,
                    role: 'VOLUNTEER',
                    avatar: avatarUrl,
                    linkedMemberId: member.id,
                    onboardingComplete: false,
                    emailVerified: false,
                },
            });

            // 4. Send Supabase invite email
            const redirectTo = process.env.FRONTEND_URL || 'http://localhost:3000';
            const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
                member.email.toLowerCase(),
                { redirectTo }
            );

            if (inviteError) {
                // Roll back the pre-created user if invite fails
                await prisma.user.deleteMany({
                    where: { tenantId, email: member.email.toLowerCase(), supabaseId: null },
                });
                logger.error('Supabase invite error:', inviteError);
                res.status(500).json({ error: 'Failed to send invitation email' });
                return;
            }

            logger.info(`Invitation sent to ${member.email} for member ${member.id}`);

            res.status(200).json({
                message: 'Invitation sent successfully',
                data: { email: member.email },
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/users/invite-direct
 * Invite a new team member by email. Pre-creates the User row and sends a
 * Supabase magic-link invite. The inviter can only assign roles below their own.
 * Required permission: USER_CREATE
 */
const inviteDirectSchema = z.object({
    email: z.string().email('Invalid email format'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(ALL_ROLES),
    phone: z.string().optional(),
});

router.post(
    '/invite-direct',
    requirePermission(Permission.USER_CREATE),
    validateBody(inviteDirectSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, firstName, lastName, role, phone } = req.body;
            const tenantId = req.user!.tenantId;
            const requestingRole = req.user!.role as AppRole;
            const normalizedEmail = email.toLowerCase();

            // Enforce role hierarchy — can only invite roles below your own
            const allowed = ASSIGNABLE_ROLES[requestingRole] ?? [];
            if (!allowed.includes(role)) {
                res.status(403).json({ error: `You cannot invite users with the role ${role}` });
                return;
            }

            const existingUser = await prisma.user.findFirst({
                where: { tenantId, email: normalizedEmail },
            });

            if (existingUser) {
                res.status(409).json({ error: 'A user account already exists for this email' });
                return;
            }

            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=random`;

            await prisma.user.create({
                data: {
                    tenantId,
                    email: normalizedEmail,
                    firstName,
                    lastName,
                    role,
                    phone: phone || null,
                    avatar: avatarUrl,
                    onboardingComplete: false,
                    emailVerified: false,
                },
            });

            const redirectTo = process.env.FRONTEND_URL || 'http://localhost:3000';
            const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
                normalizedEmail,
                { redirectTo }
            );

            if (inviteError) {
                await prisma.user.deleteMany({
                    where: { tenantId, email: normalizedEmail, supabaseId: null },
                });
                logger.error('Supabase invite error:', inviteError);
                res.status(500).json({ error: 'Failed to send invitation email' });
                return;
            }

            logger.info(`Invitation sent to ${normalizedEmail} with role ${role} by ${requestingRole}`);

            res.status(200).json({
                message: 'Invitation sent successfully',
                data: { email: normalizedEmail, firstName, lastName, role },
                meta: { timestamp: new Date().toISOString() },
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
            const requestingRole = req.user!.role as AppRole;
            const targetRole = req.body.role as AppRole;
            const allowed = ASSIGNABLE_ROLES[requestingRole] ?? [];
            if (!allowed.includes(targetRole)) {
                res.status(403).json({ error: `You cannot create users with the role ${targetRole}` });
                return;
            }
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
                req.body.role as any,
                req.user!.role as any
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
