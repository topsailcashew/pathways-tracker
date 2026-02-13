import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from './error.middleware';

// Validate request body
export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const details = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                return next(
                    new AppError(400, 'VALIDATION_ERROR', 'Validation failed', details)
                );
            }
            next(error);
        }
    };
};

// Validate query parameters
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse(req.query);
            req.query = parsed;
            next();
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const details = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                return next(
                    new AppError(400, 'VALIDATION_ERROR', 'Query validation failed', details)
                );
            }
            next(error);
        }
    };
};

// Validate route parameters
export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.params);
            next();
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const details = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                return next(
                    new AppError(400, 'VALIDATION_ERROR', 'Parameter validation failed', details)
                );
            }
            next(error);
        }
    };
};
