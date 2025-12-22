import Redis from 'ioredis';
import logger from '../utils/logger';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError(err) {
        logger.error('Redis connection error:', err);
        return true;
    },
});

redis.on('connect', () => {
    logger.info('✅ Redis connected successfully');
});

redis.on('error', (error) => {
    logger.error('❌ Redis error:', error);
});

redis.on('close', () => {
    logger.warn('Redis connection closed');
});

// Graceful shutdown
process.on('beforeExit', async () => {
    await redis.quit();
    logger.info('Redis disconnected');
});

export default redis;
