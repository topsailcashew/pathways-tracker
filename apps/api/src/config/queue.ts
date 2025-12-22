import Queue from 'bull';
import redis from './redis';
import logger from '../utils/logger';

// Create queues
export const emailQueue = new Queue('email', {
    redis: {
        host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
        port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
    },
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

export const smsQueue = new Queue('sms', {
    redis: {
        host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
        port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
    },
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

export const syncQueue = new Queue('sync', {
    redis: {
        host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
        port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
    },
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: false,
    },
});

// Queue event handlers
emailQueue.on('completed', (job) => {
    logger.info(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
    logger.error(`Email job ${job?.id} failed:`, err);
});

smsQueue.on('completed', (job) => {
    logger.info(`SMS job ${job.id} completed`);
});

smsQueue.on('failed', (job, err) => {
    logger.error(`SMS job ${job?.id} failed:`, err);
});

syncQueue.on('completed', (job) => {
    logger.info(`Sync job ${job.id} completed`);
});

syncQueue.on('failed', (job, err) => {
    logger.error(`Sync job ${job?.id} failed:`, err);
});

logger.info('✅ Job queues initialized');
