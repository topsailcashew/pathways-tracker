import Redis from 'ioredis';
import logger from '../utils/logger';

const isDevelopment = process.env.NODE_ENV === 'development';
const redisUrl = process.env.REDIS_URL;

let redis: Redis | null = null;

// Only connect to Redis if REDIS_URL is explicitly set or in production
if (redisUrl && redisUrl !== 'redis://localhost:6379') {
    redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 3) {
                logger.warn('Redis max retries reached, giving up');
                return null; // Stop retrying
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        reconnectOnError(err) {
            logger.error('Redis connection error:', err);
            return false;
        },
    });

    redis.on('connect', () => {
        logger.info('✅ Redis connected successfully');
    });

    redis.on('error', (error) => {
        if (!isDevelopment) {
            logger.error('❌ Redis error:', error);
        }
    });

    redis.on('close', () => {
        logger.warn('Redis connection closed');
    });

    // Graceful shutdown
    process.on('beforeExit', async () => {
        if (redis) {
            await redis.quit();
            logger.info('Redis disconnected');
        }
    });
} else if (isDevelopment) {
    logger.info('⏭️  Redis disabled for development (set REDIS_URL to enable)');
}

export default redis;
