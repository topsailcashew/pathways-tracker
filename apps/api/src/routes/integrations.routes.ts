import { Permission } from '../middleware/permissions.middleware';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import integrationService from '../services/integration.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createIntegrationSchema = z.object({
    sourceName: z.string().min(1, 'Source name is required'),
    sheetUrl: z.string().url('Invalid Google Sheets URL'),
    targetPathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']),
    targetStageId: z.string().uuid('Invalid stage ID'),
    autoCreateTask: z.boolean().optional(),
    taskDescription: z.string().optional(),
    autoWelcome: z.boolean().optional(),
    syncFrequency: z.string().optional(),
});

const updateIntegrationSchema = z.object({
    sourceName: z.string().min(1).optional(),
    sheetUrl: z.string().url().optional(),
    targetPathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']).optional(),
    targetStageId: z.string().uuid().optional(),
    autoCreateTask: z.boolean().optional(),
    taskDescription: z.string().optional(),
    autoWelcome: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'ERROR', 'PAUSED']).optional(),
    syncFrequency: z.string().optional(),
});

const integrationIdSchema = z.object({
    id: z.string().uuid('Invalid integration ID'),
});

/**
 * GET /api/integrations
 * List all integrations
 * Required permission: INTEGRATION_VIEW (Admin+)
 */
router.get(
    '/',
    requirePermission(Permission.INTEGRATION_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const integrations = await integrationService.getIntegrations(
                req.user!.tenantId
            );

            res.json({
                data: integrations,
                meta: {
                    total: integrations.length,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/integrations/stats
 * Get integration statistics
 * Required permission: INTEGRATION_VIEW (Admin+)
 */
router.get(
    '/stats',
    requirePermission(Permission.INTEGRATION_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await integrationService.getIntegrationStats(req.user!.tenantId);

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
 * GET /api/integrations/:id
 * Get integration by ID
 * Required permission: INTEGRATION_VIEW (Admin+)
 */
router.get(
    '/:id',
    requirePermission(Permission.INTEGRATION_VIEW),
    validateParams(integrationIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const integration = await integrationService.getIntegrationById(
                req.params.id,
                req.user!.tenantId
            );

            res.json({
                data: integration,
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
 * POST /api/integrations
 * Create integration
 * Required permission: INTEGRATION_CREATE (Admin+)
 */
router.post(
    '/',
    requirePermission(Permission.INTEGRATION_CREATE),
    validateBody(createIntegrationSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const integration = await integrationService.createIntegration({
                ...req.body,
                tenantId: req.user!.tenantId,
            });

            res.status(201).json({
                data: integration,
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
 * PATCH /api/integrations/:id
 * Update integration
 * Required permission: INTEGRATION_UPDATE (Admin+)
 */
router.patch(
    '/:id',
    requirePermission(Permission.INTEGRATION_UPDATE),
    validateParams(integrationIdSchema),
    validateBody(updateIntegrationSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const integration = await integrationService.updateIntegration(
                req.params.id,
                req.user!.tenantId,
                req.body
            );

            res.json({
                data: integration,
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
 * POST /api/integrations/:id/sync
 * Trigger manual sync
 * Required permission: INTEGRATION_SYNC (Admin+)
 */
router.post(
    '/:id/sync',
    requirePermission(Permission.INTEGRATION_SYNC),
    validateParams(integrationIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await integrationService.triggerSync(
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

/**
 * POST /api/integrations/:id/test
 * Test integration connection
 * Required permission: INTEGRATION_VIEW (Admin+)
 */
router.post(
    '/:id/test',
    requirePermission(Permission.INTEGRATION_VIEW),
    validateParams(integrationIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await integrationService.testConnection(
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

/**
 * DELETE /api/integrations/:id
 * Delete integration
 * Required permission: INTEGRATION_DELETE (Admin+)
 */
router.delete(
    '/:id',
    requirePermission(Permission.INTEGRATION_DELETE),
    validateParams(integrationIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await integrationService.deleteIntegration(
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
