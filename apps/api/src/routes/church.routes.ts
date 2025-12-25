import { Permission } from '../middleware/permissions.middleware';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import churchService from '../services/church.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createChurchSchema = z.object({
    name: z.string().min(1, 'Church name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(1, 'Phone is required'),
    website: z.string().url('Invalid URL').optional(),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required'),
    country: z.string().optional(),
    denomination: z.string().optional(),
    weeklyAttendance: z.string().optional(),
    timezone: z.string().optional(),
    memberTerm: z.string().optional(),
    autoWelcome: z.boolean().optional(),
    serviceTimes: z
        .array(
            z.object({
                day: z.enum(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']),
                time: z.string(),
                name: z.string(),
            })
        )
        .optional(),
});

const updateChurchSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    denomination: z.string().optional(),
    weeklyAttendance: z.string().optional(),
    timezone: z.string().optional(),
    memberTerm: z.string().optional(),
    autoWelcome: z.boolean().optional(),
});

const serviceTimeSchema = z.object({
    day: z.enum(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']),
    time: z.string(),
    name: z.string(),
});

const serviceTimeIdSchema = z.object({
    id: z.string().uuid(),
});

/**
 * GET /api/church
 * Get church information
 * Required permission: SETTINGS_VIEW
 */
router.get(
    '/',
    requirePermission(Permission.SETTINGS_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const church = await churchService.getChurch(req.user!.tenantId);

            res.json({
                data: church,
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
 * GET /api/church/stats
 * Get church statistics
 * Required permission: SETTINGS_VIEW
 */
router.get(
    '/stats',
    requirePermission(Permission.SETTINGS_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await churchService.getChurchStats(req.user!.tenantId);

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
 * POST /api/church
 * Create church settings
 * Required permission: SETTINGS_UPDATE (Admin+)
 */
router.post(
    '/',
    requirePermission(Permission.SETTINGS_UPDATE),
    validateBody(createChurchSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const church = await churchService.createChurch({
                ...req.body,
                tenantId: req.user!.tenantId,
            });

            res.status(201).json({
                data: church,
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
 * PATCH /api/church
 * Update church settings
 * Required permission: SETTINGS_UPDATE (Admin+)
 */
router.patch(
    '/',
    requirePermission(Permission.SETTINGS_UPDATE),
    validateBody(updateChurchSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const church = await churchService.updateChurch(req.user!.tenantId, req.body);

            res.json({
                data: church,
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
 * DELETE /api/church
 * Delete church settings
 * Required permission: SETTINGS_UPDATE (Admin+)
 */
router.delete(
    '/',
    requirePermission(Permission.SETTINGS_UPDATE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await churchService.deleteChurch(req.user!.tenantId);

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
 * POST /api/church/service-times
 * Add service time
 * Required permission: SETTINGS_UPDATE (Admin+)
 */
router.post(
    '/service-times',
    requirePermission(Permission.SETTINGS_UPDATE),
    validateBody(serviceTimeSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const serviceTime = await churchService.addServiceTime(req.user!.tenantId, req.body);

            res.status(201).json({
                data: serviceTime,
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
 * DELETE /api/church/service-times/:id
 * Delete service time
 * Required permission: SETTINGS_UPDATE (Admin+)
 */
router.delete(
    '/service-times/:id',
    requirePermission(Permission.SETTINGS_UPDATE),
    validateParams(serviceTimeIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await churchService.deleteServiceTime(req.params.id, req.user!.tenantId);

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
