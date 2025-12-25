import { Permission } from '../middleware/permissions.middleware';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import analyticsService from '../services/analytics.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import { validateQuery } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const pathwayQuerySchema = z.object({
    pathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']).optional(),
});

const exportQuerySchema = z.object({
    type: z.enum(['members', 'tasks']),
});

/**
 * GET /api/analytics/overview
 * Get dashboard overview analytics
 * Required permission: ANALYTICS_VIEW (Team Leader+)
 */
router.get(
    '/overview',
    requirePermission(Permission.ANALYTICS_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const overview = await analyticsService.getOverview(req.user!.tenantId);

            res.json({
                data: overview,
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
 * GET /api/analytics/members
 * Get member analytics
 * Required permission: ANALYTICS_VIEW (Team Leader+)
 */
router.get(
    '/members',
    requirePermission(Permission.ANALYTICS_VIEW),
    validateQuery(pathwayQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { pathway } = req.query;
            const analytics = await analyticsService.getMemberAnalytics(
                req.user!.tenantId,
                pathway as any
            );

            res.json({
                data: analytics,
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
 * GET /api/analytics/tasks
 * Get task analytics
 * Required permission: ANALYTICS_VIEW (Team Leader+)
 */
router.get(
    '/tasks',
    requirePermission(Permission.ANALYTICS_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const analytics = await analyticsService.getTaskAnalytics(req.user!.tenantId);

            res.json({
                data: analytics,
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
 * GET /api/analytics/export
 * Export data to CSV/Excel
 * Required permission: ANALYTICS_EXPORT (Admin+)
 */
router.get(
    '/export',
    requirePermission(Permission.ANALYTICS_EXPORT),
    validateQuery(exportQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type } = req.query;
            const data = await analyticsService.exportData(
                req.user!.tenantId,
                type as 'members' | 'tasks'
            );

            res.json({
                data,
                meta: {
                    total: data.length,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
