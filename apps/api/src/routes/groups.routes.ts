import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/permissions.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';

const router = Router();
router.use(authenticate);

const groupIdSchema = z.object({ id: z.string().uuid() });
const membershipIdSchema = z.object({ id: z.string().uuid(), memberId: z.string().uuid() });

const createGroupSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    category: z.string().optional(),
    meetingDay: z.string().optional(),
    meetingTime: z.string().optional(),
    location: z.string().optional(),
    maxCapacity: z.number().int().positive().optional(),
    leaderId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional(),
});

const updateGroupSchema = createGroupSchema.partial();

const addMemberSchema = z.object({
    memberId: z.string().uuid('Invalid member ID'),
});

/**
 * GET /api/groups
 * List all groups in the tenant
 */
router.get(
    '/',
    requirePermission(Permission.SERVE_TEAM_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const groups = await prisma.group.findMany({
                where: { tenantId: req.user!.tenantId },
                include: {
                    leader: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                    _count: { select: { memberships: true } },
                },
                orderBy: { name: 'asc' },
            });

            res.json({ data: groups, meta: { total: groups.length } });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/groups
 * Create a new group
 */
router.post(
    '/',
    requirePermission(Permission.SERVE_TEAM_CREATE),
    validateBody(createGroupSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const group = await prisma.group.create({
                data: {
                    ...req.body,
                    tenantId: req.user!.tenantId,
                },
                include: {
                    leader: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                    _count: { select: { memberships: true } },
                },
            });

            res.status(201).json({ data: group });
        } catch (error: any) {
            if (error.code === 'P2002') {
                res.status(409).json({ error: 'A group with this name already exists' });
                return;
            }
            next(error);
        }
    }
);

/**
 * GET /api/groups/:id
 * Get group by ID with its members
 */
router.get(
    '/:id',
    requirePermission(Permission.SERVE_TEAM_VIEW),
    validateParams(groupIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const group = await prisma.group.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId },
                include: {
                    leader: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                    memberships: {
                        include: {
                            member: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    phone: true,
                                    photoUrl: true,
                                },
                            },
                        },
                        orderBy: { joinedAt: 'asc' },
                    },
                    _count: { select: { memberships: true } },
                },
            });

            if (!group) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            res.json({ data: group });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/groups/:id
 * Update a group
 */
router.patch(
    '/:id',
    requirePermission(Permission.SERVE_TEAM_UPDATE),
    validateParams(groupIdSchema),
    validateBody(updateGroupSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const existing = await prisma.group.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId },
            });

            if (!existing) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            const group = await prisma.group.update({
                where: { id: req.params.id },
                data: req.body,
                include: {
                    leader: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                    _count: { select: { memberships: true } },
                },
            });

            res.json({ data: group });
        } catch (error: any) {
            if (error.code === 'P2002') {
                res.status(409).json({ error: 'A group with this name already exists' });
                return;
            }
            next(error);
        }
    }
);

/**
 * DELETE /api/groups/:id
 * Delete a group
 */
router.delete(
    '/:id',
    requirePermission(Permission.SERVE_TEAM_DELETE),
    validateParams(groupIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const existing = await prisma.group.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId },
            });

            if (!existing) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            await prisma.group.delete({ where: { id: req.params.id } });
            res.json({ data: { id: req.params.id } });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/groups/:id/members
 * Add a member to a group
 */
router.post(
    '/:id/members',
    requirePermission(Permission.SERVE_TEAM_MANAGE_ROSTER),
    validateParams(groupIdSchema),
    validateBody(addMemberSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { memberId } = req.body;
            const tenantId = req.user!.tenantId;

            const group = await prisma.group.findFirst({
                where: { id: req.params.id, tenantId },
            });

            if (!group) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            const member = await prisma.member.findFirst({
                where: { id: memberId, tenantId },
            });

            if (!member) {
                res.status(404).json({ error: 'Member not found' });
                return;
            }

            if (group.maxCapacity) {
                const count = await prisma.groupMembership.count({ where: { groupId: group.id } });
                if (count >= group.maxCapacity) {
                    res.status(409).json({ error: 'Group is at maximum capacity' });
                    return;
                }
            }

            const membership = await prisma.groupMembership.create({
                data: { tenantId, groupId: group.id, memberId },
                include: {
                    member: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            photoUrl: true,
                        },
                    },
                },
            });

            res.status(201).json({ data: membership });
        } catch (error: any) {
            if (error.code === 'P2002') {
                res.status(409).json({ error: 'Member is already in this group' });
                return;
            }
            next(error);
        }
    }
);

/**
 * DELETE /api/groups/:id/members/:memberId
 * Remove a member from a group
 */
router.delete(
    '/:id/members/:memberId',
    requirePermission(Permission.SERVE_TEAM_MANAGE_ROSTER),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = req.user!.tenantId;

            const membership = await prisma.groupMembership.findFirst({
                where: { groupId: req.params.id, memberId: req.params.memberId, tenantId },
            });

            if (!membership) {
                res.status(404).json({ error: 'Membership not found' });
                return;
            }

            await prisma.groupMembership.delete({ where: { id: membership.id } });
            res.json({ data: { id: membership.id } });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
