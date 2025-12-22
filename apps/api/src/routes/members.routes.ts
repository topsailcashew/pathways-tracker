import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import memberService from '../services/member.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/permissions.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createMemberSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().optional(),
    pathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']),
    currentStageId: z.string().uuid('Invalid stage ID'),
    assignedToId: z.string().uuid('Invalid user ID').optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
});

const updateMemberSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER']).optional(),
    assignedToId: z.string().uuid().optional(),
});

const advanceStageSchema = z.object({
    toStageId: z.string().uuid('Invalid stage ID'),
    reason: z.string().optional(),
});

const addNoteSchema = z.object({
    content: z.string().min(1, 'Note content is required'),
});

const addTagSchema = z.object({
    tag: z.string().min(1, 'Tag is required'),
});

const listQuerySchema = z.object({
    pathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']).optional(),
    status: z.enum(['ACTIVE', 'INTEGRATED', 'INACTIVE']).optional(),
    stageId: z.string().uuid().optional(),
    assignedToId: z.string().uuid().optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// GET /api/members - List members
router.get(
    '/',
    requirePermission(Permission.MEMBER_VIEW, Permission.MEMBER_VIEW_ALL),
    validateQuery(listQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters: any = { ...req.query };

            // If user is VOLUNTEER, only show assigned members
            if (req.user!.role === 'VOLUNTEER') {
                filters.assignedToId = req.user!.userId;
            }

            const result = await memberService.listMembers(req.user!.tenantId, filters);

            res.status(200).json({
                data: result.members,
                pagination: result.pagination,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/members - Create member
router.post(
    '/',
    requirePermission(Permission.MEMBER_CREATE),
    validateBody(createMemberSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const member = await memberService.createMember({
                ...req.body,
                tenantId: req.user!.tenantId,
                createdById: req.user!.userId,
            });

            res.status(201).json({
                data: member,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/members/:id - Get member by ID
router.get(
    '/:id',
    requirePermission(Permission.MEMBER_VIEW, Permission.MEMBER_VIEW_ALL),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const member = await memberService.getMemberById(req.params.id, req.user!.tenantId);

            // Check ownership for VOLUNTEER
            if (
                req.user!.role === 'VOLUNTEER' &&
                member.assignedToId !== req.user!.userId
            ) {
                throw new AppError(403, 'FORBIDDEN', 'You can only view assigned members');
            }

            res.status(200).json({
                data: member,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/members/:id - Update member
router.patch(
    '/:id',
    requirePermission(Permission.MEMBER_UPDATE),
    validateBody(updateMemberSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check ownership for VOLUNTEER
            if (req.user!.role === 'VOLUNTEER') {
                const existing = await memberService.getMemberById(req.params.id, req.user!.tenantId);
                if (existing.assignedToId !== req.user!.userId) {
                    throw new AppError(403, 'FORBIDDEN', 'You can only update assigned members');
                }
            }

            const member = await memberService.updateMember(
                req.params.id,
                req.user!.tenantId,
                req.body
            );

            res.status(200).json({
                data: member,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/members/:id - Delete member
router.delete(
    '/:id',
    requirePermission(Permission.MEMBER_DELETE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await memberService.deleteMember(req.params.id, req.user!.tenantId);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/members/:id/stage - Advance member to new stage
router.patch(
    '/:id/stage',
    requirePermission(Permission.MEMBER_UPDATE),
    validateBody(advanceStageSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check ownership for VOLUNTEER
            if (req.user!.role === 'VOLUNTEER') {
                const existing = await memberService.getMemberById(req.params.id, req.user!.tenantId);
                if (existing.assignedToId !== req.user!.userId) {
                    throw new AppError(403, 'FORBIDDEN', 'You can only update assigned members');
                }
            }

            const result = await memberService.advanceStage(
                req.params.id,
                req.body.toStageId,
                req.user!.tenantId,
                req.user!.userId,
                req.body.reason
            );

            res.status(200).json({
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

// POST /api/members/:id/notes - Add note to member
router.post(
    '/:id/notes',
    requirePermission(Permission.MEMBER_UPDATE),
    validateBody(addNoteSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const note = await memberService.addNote(
                req.params.id,
                req.user!.tenantId,
                req.body.content,
                req.user!.userId
            );

            res.status(201).json({
                data: note,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/members/:id/tags - Add tag to member
router.post(
    '/:id/tags',
    requirePermission(Permission.MEMBER_UPDATE),
    validateBody(addTagSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tag = await memberService.addTag(
                req.params.id,
                req.user!.tenantId,
                req.body.tag
            );

            res.status(201).json({
                data: tag,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/members/:memberId/tags/:tagId - Remove tag from member
router.delete(
    '/:memberId/tags/:tagId',
    requirePermission(Permission.MEMBER_UPDATE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await memberService.removeTag(
                req.params.memberId,
                req.user!.tenantId,
                req.params.tagId
            );

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

export default router;
