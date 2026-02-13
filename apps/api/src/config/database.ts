import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
    ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e: any) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Duration: ${e.duration}ms`);
    });
}

// Log errors
prisma.$on('error', (e: any) => {
    logger.error('Prisma error:', e);
});

// Log warnings
prisma.$on('warn', (e: any) => {
    logger.warn('Prisma warning:', e);
});

// Test connection
prisma.$connect()
    .then(() => {
        logger.info('✅ Database connected successfully');
    })
    .catch((error: any) => {
        if (process.env.NODE_ENV === 'development') {
            logger.warn('⚠️  Database connection failed (dev mode, server will still start):', error.message);
        } else {
            logger.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    });

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
    logger.info('Database disconnected');
});

export default prisma;
