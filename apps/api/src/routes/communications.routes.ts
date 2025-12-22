import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import communicationService from '../services/communication.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { requirePermissions } from '../middleware/permissions.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const sendEmailSchema = z.object({
    memberId: z.string().uuid('Invalid member ID'),
    subject: z.string().min(1, 'Subject is required'),
    content: z.string().min(1, 'Content is required'),
});

const sendSMSSchema = z.object({
    memberId: z.string().uuid('Invalid member ID'),
    content: z.string().min(1, 'Content is required').max(1600, 'SMS content too long'),
});

const historyQuerySchema = z.object({
    memberId: z.string().uuid().optional(),
    channel: z.enum(['SMS', 'EMAIL']).optional(),
});

/**
 * POST /api/communications/email
 * Send email to a member
 * Required permission: MESSAGE_SEND (Team Leader+)
 */
router.post(
    '/email',
    requirePermissions(['MESSAGE_SEND']),
    validateBody(sendEmailSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const message = await communicationService.sendEmail({
                ...req.body,
                sentById: req.user!.userId,
                tenantId: req.user!.tenantId,
            });

            res.status(201).json({
                data: message,
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
 * POST /api/communications/sms
 * Send SMS to a member
 * Required permission: MESSAGE_SEND (Team Leader+)
 */
router.post(
    '/sms',
    requirePermissions(['MESSAGE_SEND']),
    validateBody(sendSMSSchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const message = await communicationService.sendSMS({
                ...req.body,
                sentById: req.user!.userId,
                tenantId: req.user!.tenantId,
            });

            res.status(201).json({
                data: message,
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
 * GET /api/communications/history
 * Get message history
 * Required permission: MESSAGE_VIEW
 */
router.get(
    '/history',
    requirePermissions(['MESSAGE_VIEW']),
    validateQuery(historyQuerySchema),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { memberId, channel } = req.query;
            const messages = await communicationService.getMessageHistory(
                req.user!.tenantId,
                memberId as string | undefined,
                channel as any
            );

            res.json({
                data: messages,
                meta: {
                    total: messages.length,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/communications/stats
 * Get communication statistics
 * Required permission: MESSAGE_VIEW
 */
router.get(
    '/stats',
    requirePermissions(['MESSAGE_VIEW']),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const stats = await communicationService.getCommunicationStats(
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

export default router;
