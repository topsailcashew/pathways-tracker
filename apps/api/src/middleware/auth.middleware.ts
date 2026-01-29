import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import supabaseAdmin from '../config/supabase';
import { AppError } from './error.middleware';
import logger from '../utils/logger';

export interface AuthUser {
    userId: string;
    tenantId: string;
    email: string;
    role: string;
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(401, 'UNAUTHORIZED', 'No token provided');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token with Supabase
        const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !supabaseUser) {
            logger.warn('Supabase token verification failed:', error?.message);
            throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
        }

        // Get user from database by supabaseId
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { supabaseId: supabaseUser.id },
                    { email: supabaseUser.email }
                ]
            },
            select: {
                id: true,
                tenantId: true,
                email: true,
                role: true,
                isActive: true,
                supabaseId: true,
            },
        });

        if (!user) {
            throw new AppError(401, 'UNAUTHORIZED', 'User not found. Please sync your account.');
        }

        if (!user.isActive) {
            throw new AppError(401, 'UNAUTHORIZED', 'Account is inactive');
        }

        // If user doesn't have supabaseId yet, update it
        if (!user.supabaseId) {
            await prisma.user.update({
                where: { id: user.id },
                data: { supabaseId: supabaseUser.id },
            });
        }

        // Attach user to request
        req.user = {
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
            email: user.email,
        };

        next();
    } catch (error: any) {
        if (error instanceof AppError) {
            return next(error);
        }
        logger.error('Authentication error:', error);
        next(new AppError(401, 'UNAUTHORIZED', 'Authentication failed'));
    }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);

        // Verify token with Supabase
        const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !supabaseUser) {
            return next();
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { supabaseId: supabaseUser.id },
                    { email: supabaseUser.email }
                ]
            },
            select: {
                id: true,
                tenantId: true,
                email: true,
                role: true,
                isActive: true,
            },
        });

        if (user && user.isActive) {
            req.user = {
                userId: user.id,
                tenantId: user.tenantId,
                role: user.role,
                email: user.email,
            };
        }

        next();
    } catch (error) {
        // Ignore auth errors for optional auth
        next();
    }
};
