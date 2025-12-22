import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import authService from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
    churchName: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

// POST /api/auth/register
router.post(
    '/register',
    validateBody(registerSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await authService.register(req.body);

            res.status(201).json({
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

// POST /api/auth/login
router.post(
    '/login',
    validateBody(loginSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await authService.login(req.body);

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

// POST /api/auth/refresh
router.post(
    '/refresh',
    validateBody(refreshSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refresh(refreshToken);

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

// POST /api/auth/logout
router.post(
    '/logout',
    validateBody(refreshSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { refreshToken } = req.body;
            await authService.logout(refreshToken);

            res.status(200).json({
                data: { message: 'Logged out successfully' },
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/auth/me
router.get(
    '/me',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await authService.getCurrentUser(req.user!.userId);

            res.status(200).json({
                data: user,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/auth/onboarding/complete
router.patch(
    '/onboarding/complete',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await authService.completeOnboarding(req.user!.userId);

            res.status(200).json({
                data: user,
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
