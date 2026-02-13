import dotenv from 'dotenv';

// Load environment variables BEFORE other imports
dotenv.config();

import app from './app';
import logger from './utils/logger';
import prisma from './config/database';
import redis from './config/redis';

// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    if (process.env.NODE_ENV === 'development') {
        logger.warn('Missing environment variables (dev mode, continuing):', missingEnvVars);
    } else {
        logger.error('Missing required environment variables:', missingEnvVars);
        process.exit(1);
    }
}

const PORT = parseInt(process.env.PORT || '4000');
const HOST = process.env.HOST || '0.0.0.0';

// Start server
const server = app.listen(PORT, HOST, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Shepherd API Server                         ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV?.padEnd(42) || 'development'.padEnd(42)}║
║   Port:        ${PORT.toString().padEnd(42)}║
║   URL:         http://localhost:${PORT}${' '.repeat(27)}║
║                                                           ║
║   Health:      http://localhost:${PORT}/health${' '.repeat(20)}║
║   API:         http://localhost:${PORT}/api${' '.repeat(23)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            // Close database connection
            await prisma.$disconnect();
            logger.info('Database disconnected');

            // Close Redis connection
            if (redis) {
                await redis.quit();
                logger.info('Redis disconnected');
            }

            logger.info('Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30050);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

export default server;
