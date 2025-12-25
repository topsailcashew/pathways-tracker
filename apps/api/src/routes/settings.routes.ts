import { Permission } from '../middleware/permissions.middleware';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import settingsService from '../services/settings.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const updateSettingsSchema = z.object({
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

const serviceTimeSchema = z.object({
    day: z.enum(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']),
    time: z.string(),
    name: z.string(),
});

const serviceTimeIdSchema = z.object({
    id: z.string().uuid(),
});

/**
 * GET /api/settings
 * Get church settings
 * Required permission: SETTINGS_VIEW
 */
router.get(
    '/',
    requirePermission(Permission.SETTINGS_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const settings = await settingsService.getSettings(req.user!.tenantId);

            res.json({
                data: settings,
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
 * PATCH /api/settings
 * Update church settings
 * Required permission: SETTINGS_UPDATE (Admin+)
 */
router.patch(
    '/',
    requirePermission(Permission.SETTINGS_UPDATE),
    validateBody(updateSettingsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const settings = await settingsService.updateSettings(
                req.user!.tenantId,
                req.body
            );

            res.json({
                data: settings,
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
 * POST /api/settings/service-times
 * Add service time
 * Required permission: SETTINGS_UPDATE (Admin+)
 */
router.post(
    '/service-times',
    requirePermission(Permission.SETTINGS_UPDATE),
    validateBody(serviceTimeSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const serviceTime = await settingsService.addServiceTime(
                req.user!.tenantId,
                req.body
            );

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
 * DELETE /api/settings/service-times/:id
 * Delete service time
 * Required permission: SETTINGS_UPDATE (Admin+)
 */
router.delete(
    '/service-times/:id',
    requirePermission(Permission.SETTINGS_UPDATE),
    validateParams(serviceTimeIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await settingsService.deleteServiceTime(
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
