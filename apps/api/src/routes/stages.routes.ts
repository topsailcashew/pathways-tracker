import { Permission } from '../middleware/permissions.middleware';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Pathway } from '@prisma/client';
import stageService from '../services/stage.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const pathwayQuerySchema = z.object({
    pathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']).optional(),
});

const createStageSchema = z.object({
    pathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']),
    name: z.string().min(1, 'Stage name is required'),
    description: z.string().optional(),
    order: z.number().int().min(0),
    autoAdvanceEnabled: z.boolean().optional(),
    autoAdvanceType: z.enum(['TASK_COMPLETED', 'TIME_IN_STAGE']).optional(),
    autoAdvanceValue: z.string().optional(),
});

const updateStageSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    order: z.number().int().min(0).optional(),
    autoAdvanceEnabled: z.boolean().optional(),
    autoAdvanceType: z.enum(['TASK_COMPLETED', 'TIME_IN_STAGE']).optional(),
    autoAdvanceValue: z.string().optional(),
});

const reorderStagesSchema = z.object({
    pathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']),
    reorders: z.array(
        z.object({
            stageId: z.string().uuid(),
            newOrder: z.number().int().min(0),
        })
    ),
});

const stageIdSchema = z.object({
    id: z.string().uuid('Invalid stage ID'),
});

/**
 * GET /api/stages
 * List all stages (optionally filter by pathway)
 * Required permission: STAGE_VIEW
 */
router.get(
    '/',
    requirePermission(Permission.STAGE_VIEW),
    validateQuery(pathwayQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { pathway } = req.query;
            const stages = await stageService.getStages(
                req.user!.tenantId,
                pathway as Pathway | undefined
            );

            res.json({
                data: stages,
                meta: {
                    total: stages.length,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/stages/stats
 * Get stage statistics
 * Required permission: STAGE_VIEW
 */
router.get(
    '/stats',
    requirePermission(Permission.STAGE_VIEW),
    validateQuery(pathwayQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { pathway } = req.query;
            const stats = await stageService.getStageStats(
                req.user!.tenantId,
                pathway as Pathway | undefined
            );

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
 * GET /api/stages/:id
 * Get stage by ID
 * Required permission: STAGE_VIEW
 */
router.get(
    '/:id',
    requirePermission(Permission.STAGE_VIEW),
    validateParams(stageIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stage = await stageService.getStageById(
                req.params.id,
                req.user!.tenantId
            );

            res.json({
                data: stage,
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
 * POST /api/stages
 * Create a new stage
 * Required permission: STAGE_CREATE (Admin+)
 */
router.post(
    '/',
    requirePermission(Permission.STAGE_CREATE),
    validateBody(createStageSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stage = await stageService.createStage({
                ...req.body,
                tenantId: req.user!.tenantId,
            });

            res.status(201).json({
                data: stage,
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
 * PATCH /api/stages/:id
 * Update stage
 * Required permission: STAGE_UPDATE (Admin+)
 */
router.patch(
    '/:id',
    requirePermission(Permission.STAGE_UPDATE),
    validateParams(stageIdSchema),
    validateBody(updateStageSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stage = await stageService.updateStage(
                req.params.id,
                req.user!.tenantId,
                req.body
            );

            res.json({
                data: stage,
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
 * POST /api/stages/reorder
 * Reorder stages
 * Required permission: STAGE_UPDATE (Admin+)
 */
router.post(
    '/reorder',
    requirePermission(Permission.STAGE_UPDATE),
    validateBody(reorderStagesSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { pathway, reorders } = req.body;
            const result = await stageService.reorderStages(
                req.user!.tenantId,
                pathway,
                reorders
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

/**
 * DELETE /api/stages/:id
 * Delete stage
 * Required permission: STAGE_DELETE (Admin+)
 */
router.delete(
    '/:id',
    requirePermission(Permission.STAGE_DELETE),
    validateParams(stageIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await stageService.deleteStage(
                req.params.id,
                req.user!.tenantId
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
