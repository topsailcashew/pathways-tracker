import Queue from 'bull';
import logger from '../utils/logger';

const isDevelopment = process.env.NODE_ENV === 'development';
const redisUrl = process.env.REDIS_URL;
const redisEnabled = redisUrl && redisUrl !== 'redis://localhost:6379';

// Helper to create queue only if Redis is available
function createQueue(name: string, options: Queue.QueueOptions): Queue.Queue | null {
    if (!redisEnabled) {
        return null;
    }
    return new Queue(name, options);
}

const redisConfig = redisEnabled ? {
    host: redisUrl!.split('://')[1]?.split(':')[0] || 'localhost',
    port: parseInt(redisUrl!.split(':')[2] || '6379'),
} : { host: 'localhost', port: 6379 };

// Create queues (null if Redis not available)
export const emailQueue = createQueue('email', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export const smsQueue = createQueue('sms', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export const syncQueue = createQueue('sync', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: false,
    },
});

// Queue event handlers (only if queues exist)
if (emailQueue) {
    emailQueue.on('completed', (job) => {
        logger.info(`Email job ${job.id} completed`);
    });
    emailQueue.on('failed', (job, err) => {
        logger.error(`Email job ${job?.id} failed:`, err);
    });
}

if (smsQueue) {
    smsQueue.on('completed', (job) => {
        logger.info(`SMS job ${job.id} completed`);
    });
    smsQueue.on('failed', (job, err) => {
        logger.error(`SMS job ${job?.id} failed:`, err);
    });
}

if (syncQueue) {
    syncQueue.on('completed', (job) => {
        logger.info(`Sync job ${job.id} completed`);
    });
    syncQueue.on('failed', (job, err) => {
        logger.error(`Sync job ${job?.id} failed:`, err);
    });
}

if (redisEnabled) {
    logger.info('✅ Job queues initialized');
} else if (isDevelopment) {
    logger.info('⏭️  Job queues disabled (Redis not configured)');
}
