import { Request } from 'express';

// Extend Express Request type to include user context
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            userId: string;
            tenantId: string;
            role: string;
            email: string;
        };
        requestId?: string;
    }
}

export { };
