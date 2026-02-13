import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import academyService from '../services/academy.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/permissions.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ========== Validation Schemas ==========

const createTrackSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
});

const updateTrackSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    isPublished: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
});

const createModuleSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional(),
    videoUrl: z.string().url('Must be a valid URL'),
    order: z.number().int().min(0),
    requiredModuleId: z.string().uuid().optional().nullable(),
});

const updateModuleSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional().nullable(),
    videoUrl: z.string().url().optional(),
    order: z.number().int().min(0).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    requiredModuleId: z.string().uuid().optional().nullable(),
});

const questionSchema = z.object({
    questionText: z.string().min(1),
    questionType: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']).optional(),
    options: z.array(z.object({
        id: z.string().min(1),
        text: z.string().min(1),
    })).min(2).max(6),
    correctOptionId: z.string().min(1),
    order: z.number().int().min(0),
});

const upsertQuizSchema = z.object({
    passingScore: z.number().int().min(1).max(100).default(100),
    questions: z.array(questionSchema).min(1).max(20),
});

const enrollSchema = z.object({
    trackId: z.string().uuid(),
    userId: z.string().uuid().optional(),
});

const submitQuizSchema = z.object({
    answers: z.array(z.object({
        questionId: z.string().uuid(),
        selectedOptionId: z.string().min(1),
    })).min(1),
});

const huddleCommentSchema = z.object({
    content: z.string().min(1).max(2000),
});

const listTracksQuerySchema = z.object({
    isPublished: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const paginationQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// ========== TRACK ROUTES ==========

// GET /api/academy/tracks - List tracks
router.get(
    '/tracks',
    requirePermission(Permission.ACADEMY_VIEW),
    validateQuery(listTracksQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters: any = { ...req.query };

            // Volunteers only see published tracks
            if (req.user!.role === 'VOLUNTEER' || req.user!.role === 'TEAM_LEADER') {
                filters.isPublished = true;
            }

            const result = await academyService.listTracks(req.user!.tenantId, filters);

            res.status(200).json({
                data: result.tracks,
                pagination: result.pagination,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/academy/tracks - Create track
router.post(
    '/tracks',
    requirePermission(Permission.ACADEMY_MANAGE_TRACKS),
    validateBody(createTrackSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const track = await academyService.createTrack({
                ...req.body,
                tenantId: req.user!.tenantId,
            });

            res.status(201).json({
                data: track,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/academy/tracks/:id - Get track with modules
router.get(
    '/tracks/:id',
    requirePermission(Permission.ACADEMY_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const track = await academyService.getTrackById(req.params.id, req.user!.tenantId);

            res.status(200).json({
                data: track,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/academy/tracks/:id - Update track
router.patch(
    '/tracks/:id',
    requirePermission(Permission.ACADEMY_MANAGE_TRACKS),
    validateBody(updateTrackSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const track = await academyService.updateTrack(
                req.params.id,
                req.user!.tenantId,
                req.body
            );

            res.status(200).json({
                data: track,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/academy/tracks/:id - Delete track
router.delete(
    '/tracks/:id',
    requirePermission(Permission.ACADEMY_MANAGE_TRACKS),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await academyService.deleteTrack(req.params.id, req.user!.tenantId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

// ========== MODULE ROUTES ==========

// POST /api/academy/tracks/:id/modules - Create module in track
router.post(
    '/tracks/:id/modules',
    requirePermission(Permission.ACADEMY_MANAGE_MODULES),
    validateBody(createModuleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const module = await academyService.createModule({
                ...req.body,
                trackId: req.params.id,
                tenantId: req.user!.tenantId,
            });

            res.status(201).json({
                data: module,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/academy/modules/:id - Update module
router.patch(
    '/modules/:id',
    requirePermission(Permission.ACADEMY_MANAGE_MODULES),
    validateBody(updateModuleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const module = await academyService.updateModule(
                req.params.id,
                req.user!.tenantId,
                req.body
            );

            res.status(200).json({
                data: module,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/academy/modules/:id - Delete module
router.delete(
    '/modules/:id',
    requirePermission(Permission.ACADEMY_MANAGE_MODULES),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await academyService.deleteModule(req.params.id, req.user!.tenantId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

// ========== QUIZ ROUTES ==========

// PUT /api/academy/modules/:id/quiz - Create or update quiz
router.put(
    '/modules/:id/quiz',
    requirePermission(Permission.ACADEMY_MANAGE_QUIZZES),
    validateBody(upsertQuizSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const quiz = await academyService.upsertQuiz(
                req.params.id,
                req.user!.tenantId,
                req.body
            );

            res.status(200).json({
                data: quiz,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/academy/modules/:id/quiz - Get quiz (answers stripped for non-admins)
router.get(
    '/modules/:id/quiz',
    requirePermission(Permission.ACADEMY_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const includeAnswers = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
            const quiz = await academyService.getQuizByModule(
                req.params.id,
                req.user!.tenantId,
                includeAnswers
            );

            res.status(200).json({
                data: quiz,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// ========== ENROLLMENT & PROGRESS ROUTES ==========

// POST /api/academy/enroll - Enroll in track
router.post(
    '/enroll',
    requirePermission(Permission.ACADEMY_ENROLL),
    validateBody(enrollSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.body.userId || req.user!.userId;
            const enrollment = await academyService.enrollUser(
                req.user!.tenantId,
                userId,
                req.body.trackId
            );

            res.status(201).json({
                data: enrollment,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/academy/my-progress - Get current user's progress
router.get(
    '/my-progress',
    requirePermission(Permission.ACADEMY_VIEW_PROGRESS),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await academyService.getMyProgress(
                req.user!.tenantId,
                req.user!.userId
            );

            res.status(200).json({
                data: result,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/academy/next-step - Get "Your Next Step"
router.get(
    '/next-step',
    requirePermission(Permission.ACADEMY_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await academyService.getNextStep(
                req.user!.tenantId,
                req.user!.userId
            );

            res.status(200).json({
                data: result,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/academy/modules/:id/video-watched - Mark video as watched
router.patch(
    '/modules/:id/video-watched',
    requirePermission(Permission.ACADEMY_SUBMIT_QUIZ),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await academyService.markVideoWatched(
                req.user!.tenantId,
                req.user!.userId,
                req.params.id
            );

            res.status(200).json({
                data: { success: true },
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/academy/modules/:id/submit-quiz - Submit quiz answers
router.post(
    '/modules/:id/submit-quiz',
    requirePermission(Permission.ACADEMY_SUBMIT_QUIZ),
    validateBody(submitQuizSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await academyService.submitQuiz(
                req.user!.tenantId,
                req.user!.userId,
                req.params.id,
                req.body.answers
            );

            res.status(200).json({
                data: result,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// ========== ADMIN ROUTES ==========

// GET /api/academy/admin/stats - Pipeline health stats
router.get(
    '/admin/stats',
    requirePermission(Permission.ACADEMY_VIEW_ALL_PROGRESS),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await academyService.getAllProgressStats(req.user!.tenantId);

            res.status(200).json({
                data: stats,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/academy/admin/tracks/:id/progress - Track progress details
router.get(
    '/admin/tracks/:id/progress',
    requirePermission(Permission.ACADEMY_VIEW_ALL_PROGRESS),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await academyService.getTrackProgressStats(
                req.user!.tenantId,
                req.params.id
            );

            res.status(200).json({
                data: stats,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/academy/admin/users/:userId/progress - User progress details
router.get(
    '/admin/users/:userId/progress',
    requirePermission(Permission.ACADEMY_VIEW_ALL_PROGRESS),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await academyService.getUserProgressDetail(
                req.user!.tenantId,
                req.params.userId
            );

            res.status(200).json({
                data: result,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// ========== HUDDLE ROUTES ==========

// POST /api/academy/modules/:id/huddle - Add huddle comment
router.post(
    '/modules/:id/huddle',
    requirePermission(Permission.ACADEMY_HUDDLE_COMMENT),
    validateBody(huddleCommentSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const comment = await academyService.addHuddleComment(
                req.user!.tenantId,
                req.user!.userId,
                req.params.id,
                req.body.content
            );

            res.status(201).json({
                data: comment,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/academy/modules/:id/huddle - Get huddle comments
router.get(
    '/modules/:id/huddle',
    requirePermission(Permission.ACADEMY_VIEW),
    validateQuery(paginationQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await academyService.getHuddleComments(
                req.user!.tenantId,
                req.params.id,
                req.query as any
            );

            res.status(200).json({
                data: result.comments,
                pagination: result.pagination,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/academy/huddle/:id - Delete huddle comment
router.delete(
    '/huddle/:id',
    requirePermission(Permission.ACADEMY_HUDDLE_COMMENT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await academyService.deleteHuddleComment(
                req.params.id,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role
            );

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

export default router;
