import { Permission } from '../middleware/permissions.middleware';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import automationRuleService from '../services/automation-rule.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createAutomationRuleSchema = z.object({
    stageId: z.string().uuid('Invalid stage ID'),
    name: z.string().min(1, 'Rule name is required'),
    taskDescription: z.string().min(1, 'Task description is required'),
    daysDue: z.number().int().min(0, 'Days due must be positive'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    enabled: z.boolean().optional(),
});

const updateAutomationRuleSchema = z.object({
    name: z.string().min(1).optional(),
    taskDescription: z.string().min(1).optional(),
    daysDue: z.number().int().min(0).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    enabled: z.boolean().optional(),
});

const toggleRuleSchema = z.object({
    enabled: z.boolean(),
});

const ruleIdSchema = z.object({
    id: z.string().uuid('Invalid rule ID'),
});

const stageQuerySchema = z.object({
    stageId: z.string().uuid().optional(),
});

/**
 * GET /api/automation-rules
 * List all automation rules (optionally filter by stage)
 * Required permission: AUTOMATION_VIEW (Admin+)
 */
router.get(
    '/',
    requirePermission(Permission.AUTOMATION_VIEW),
    validateQuery(stageQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { stageId } = req.query;
            const rules = await automationRuleService.getAutomationRules(
                req.user!.tenantId,
                stageId as string | undefined
            );

            res.json({
                data: rules,
                meta: {
                    total: rules.length,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/automation-rules/stats
 * Get automation rule statistics
 * Required permission: AUTOMATION_VIEW (Admin+)
 */
router.get(
    '/stats',
    requirePermission(Permission.AUTOMATION_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await automationRuleService.getAutomationRuleStats(
                req.user!.tenantId
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
 * GET /api/automation-rules/:id
 * Get automation rule by ID
 * Required permission: AUTOMATION_VIEW (Admin+)
 */
router.get(
    '/:id',
    requirePermission(Permission.AUTOMATION_VIEW),
    validateParams(ruleIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rule = await automationRuleService.getAutomationRuleById(
                req.params.id,
                req.user!.tenantId
            );

            res.json({
                data: rule,
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
 * POST /api/automation-rules
 * Create automation rule
 * Required permission: AUTOMATION_CREATE (Admin+)
 */
router.post(
    '/',
    requirePermission(Permission.AUTOMATION_CREATE),
    validateBody(createAutomationRuleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rule = await automationRuleService.createAutomationRule({
                ...req.body,
                tenantId: req.user!.tenantId,
            });

            res.status(201).json({
                data: rule,
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
 * PATCH /api/automation-rules/:id
 * Update automation rule
 * Required permission: AUTOMATION_UPDATE (Admin+)
 */
router.patch(
    '/:id',
    requirePermission(Permission.AUTOMATION_UPDATE),
    validateParams(ruleIdSchema),
    validateBody(updateAutomationRuleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rule = await automationRuleService.updateAutomationRule(
                req.params.id,
                req.user!.tenantId,
                req.body
            );

            res.json({
                data: rule,
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
 * PATCH /api/automation-rules/:id/toggle
 * Toggle automation rule enabled/disabled
 * Required permission: AUTOMATION_UPDATE (Admin+)
 */
router.patch(
    '/:id/toggle',
    requirePermission(Permission.AUTOMATION_UPDATE),
    validateParams(ruleIdSchema),
    validateBody(toggleRuleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rule = await automationRuleService.toggleAutomationRule(
                req.params.id,
                req.user!.tenantId,
                req.body.enabled
            );

            res.json({
                data: rule,
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
 * DELETE /api/automation-rules/:id
 * Delete automation rule
 * Required permission: AUTOMATION_DELETE (Admin+)
 */
router.delete(
    '/:id',
    requirePermission(Permission.AUTOMATION_DELETE),
    validateParams(ruleIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await automationRuleService.deleteAutomationRule(
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
