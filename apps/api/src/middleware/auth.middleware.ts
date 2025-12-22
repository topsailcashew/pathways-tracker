import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from './error.middleware';
import logger from '../utils/logger';

export interface JwtPayload {
    userId: string;
    tenantId: string;
    email: string;
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

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as JwtPayload;

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                tenantId: true,
                email: true,
                role: true,
                isActive: true,
                emailVerified: true,
            },
        });

        if (!user) {
            throw new AppError(401, 'UNAUTHORIZED', 'User not found');
        }

        if (!user.isActive) {
            throw new AppError(401, 'UNAUTHORIZED', 'Account is inactive');
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
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError(401, 'UNAUTHORIZED', 'Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError(401, 'TOKEN_EXPIRED', 'Token has expired'));
        }
        next(error);
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
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
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
