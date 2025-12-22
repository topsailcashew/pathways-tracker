import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: any;
    };
    meta: {
        timestamp: string;
        requestId?: string;
    };
}

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Log error
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: (req as any).user?.userId,
    });

    // Default error response
    let statusCode = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details = undefined;

    // Handle known errors
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;
        details = err.details;
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = err.message;
    } else if (err.name === 'UnauthorizedError' || err.message.includes('token')) {
        statusCode = 401;
        code = 'UNAUTHORIZED';
        message = 'Authentication failed';
    } else if (err.name === 'PrismaClientKnownRequestError') {
        statusCode = 400;
        code = 'DATABASE_ERROR';
        message = 'Database operation failed';
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'An unexpected error occurred';
        details = undefined;
    }

    const response: ErrorResponse = {
        error: {
            code,
            message,
            ...(details && { details }),
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId: (req as any).requestId,
        },
    };

    res.status(statusCode).json(response);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
    const response: ErrorResponse = {
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
        meta: {
            timestamp: new Date().toISOString(),
        },
    };

    res.status(404).json(response);
};
