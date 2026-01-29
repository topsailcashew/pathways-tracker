import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import authService from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import supabaseAdmin from '../config/supabase';
import { AppError } from '../middleware/error.middleware';

const router = Router();

// Validation schemas
const syncSchema = z.object({
    churchName: z.string().optional(),
});

// POST /api/auth/sync - Sync user from Supabase auth to app database
router.post(
    '/sync',
    validateBody(syncSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get token from header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new AppError(401, 'UNAUTHORIZED', 'No token provided');
            }

            const token = authHeader.substring(7);
            console.log('[Auth Sync] Verifying token with Supabase...');

            // Verify token and get user from Supabase
            const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

            if (error) {
                console.error('[Auth Sync] Supabase error:', error.message, error);
                throw new AppError(401, 'UNAUTHORIZED', `Token verification failed: ${error.message}`);
            }

            if (!supabaseUser) {
                console.error('[Auth Sync] No user returned from Supabase');
                throw new AppError(401, 'UNAUTHORIZED', 'Invalid token - no user');
            }

            console.log('[Auth Sync] Supabase user verified:', supabaseUser.email);

            // Sync user to app database
            const result = await authService.syncUser({
                supabaseUser: {
                    id: supabaseUser.id,
                    email: supabaseUser.email!,
                    user_metadata: supabaseUser.user_metadata,
                    app_metadata: supabaseUser.app_metadata,
                },
                churchName: req.body.churchName,
            });

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

// GET /api/auth/me - Get current user
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

// PATCH /api/auth/onboarding/complete - Complete onboarding
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

// POST /api/auth/logout - Sign out (optional server-side cleanup)
router.post(
    '/logout',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await authService.signOut(req.user!.userId);

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

export default router;
