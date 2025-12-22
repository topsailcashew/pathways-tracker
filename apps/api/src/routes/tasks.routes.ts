import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import taskService from '../services/task.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/permissions.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createTaskSchema = z.object({
    memberId: z.string().uuid('Invalid member ID'),
    description: z.string().min(1, 'Description is required'),
    dueDate: z.string().datetime('Invalid date format'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    assignedToId: z.string().uuid('Invalid user ID'),
});

const updateTaskSchema = z.object({
    description: z.string().min(1).optional(),
    dueDate: z.string().datetime().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    assignedToId: z.string().uuid().optional(),
});

const listQuerySchema = z.object({
    assignedToId: z.string().uuid().optional(),
    memberId: z.string().uuid().optional(),
    completed: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    overdue: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// GET /api/tasks - List tasks
router.get(
    '/',
    requirePermission(Permission.TASK_VIEW, Permission.TASK_VIEW_ALL),
    validateQuery(listQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters: any = { ...req.query };

            // If user is VOLUNTEER, only show assigned tasks
            if (req.user!.role === 'VOLUNTEER') {
                filters.assignedToId = req.user!.userId;
            }

            const result = await taskService.listTasks(req.user!.tenantId, filters);

            res.status(200).json({
                data: result.tasks,
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

// POST /api/tasks - Create task
router.post(
    '/',
    requirePermission(Permission.TASK_CREATE),
    validateBody(createTaskSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const task = await taskService.createTask({
                ...req.body,
                dueDate: new Date(req.body.dueDate),
                tenantId: req.user!.tenantId,
                createdById: req.user!.userId,
            });

            res.status(201).json({
                data: task,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/tasks/stats - Get task statistics
router.get(
    '/stats',
    requirePermission(Permission.TASK_VIEW, Permission.TASK_VIEW_ALL),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.role === 'VOLUNTEER' ? req.user!.userId : undefined;
            const stats = await taskService.getTaskStats(req.user!.tenantId, userId);

            res.status(200).json({
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

// GET /api/tasks/:id - Get task by ID
router.get(
    '/:id',
    requirePermission(Permission.TASK_VIEW, Permission.TASK_VIEW_ALL),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const task = await taskService.getTaskById(req.params.id, req.user!.tenantId);

            // Check ownership for VOLUNTEER
            if (
                req.user!.role === 'VOLUNTEER' &&
                task.assignedToId !== req.user!.userId
            ) {
                throw new AppError(403, 'FORBIDDEN', 'You can only view assigned tasks');
            }

            res.status(200).json({
                data: task,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/tasks/:id - Update task
router.patch(
    '/:id',
    requirePermission(Permission.TASK_UPDATE),
    validateBody(updateTaskSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check ownership for VOLUNTEER
            if (req.user!.role === 'VOLUNTEER') {
                const existing = await taskService.getTaskById(req.params.id, req.user!.tenantId);
                if (existing.assignedToId !== req.user!.userId) {
                    throw new AppError(403, 'FORBIDDEN', 'You can only update assigned tasks');
                }
            }

            const task = await taskService.updateTask(
                req.params.id,
                req.user!.tenantId,
                {
                    ...req.body,
                    ...(req.body.dueDate && { dueDate: new Date(req.body.dueDate) }),
                }
            );

            res.status(200).json({
                data: task,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/tasks/:id - Delete task
router.delete(
    '/:id',
    requirePermission(Permission.TASK_DELETE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await taskService.deleteTask(req.params.id, req.user!.tenantId);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/tasks/:id/complete - Complete task
router.patch(
    '/:id/complete',
    requirePermission(Permission.TASK_UPDATE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check ownership for VOLUNTEER
            if (req.user!.role === 'VOLUNTEER') {
                const existing = await taskService.getTaskById(req.params.id, req.user!.tenantId);
                if (existing.assignedToId !== req.user!.userId) {
                    throw new AppError(403, 'FORBIDDEN', 'You can only complete assigned tasks');
                }
            }

            const result = await taskService.completeTask(
                req.params.id,
                req.user!.tenantId,
                req.user!.userId
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

export default router;
