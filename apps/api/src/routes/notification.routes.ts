import { Router, Request, Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications — get current user's notifications
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const unreadOnly = req.query.unreadOnly === 'true';
        const notifications = await notificationService.getNotifications(
            req.user!.userId,
            req.user!.tenantId,
            unreadOnly
        );
        const unreadCount = await notificationService.getUnreadCount(
            req.user!.userId,
            req.user!.tenantId
        );
        res.json({ notifications, unreadCount });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/notifications/read-all — mark all as read (must be before /:id to avoid conflict)
router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await notificationService.markAllRead(req.user!.userId, req.user!.tenantId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await notificationService.markAsRead(req.params.id, req.user!.userId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
