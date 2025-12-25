import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface CreateChurchData {
    tenantId: string;
    name: string;
    email: string;
    phone: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
    denomination?: string;
    weeklyAttendance?: string;
    timezone?: string;
    memberTerm?: string;
    autoWelcome?: boolean;
    serviceTimes?: Array<{
        day: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
        time: string;
        name: string;
    }>;
}

interface UpdateChurchData {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    denomination?: string;
    weeklyAttendance?: string;
    timezone?: string;
    memberTerm?: string;
    autoWelcome?: boolean;
}

class ChurchService {
    /**
     * Get church information by tenant ID
     */
    async getChurch(tenantId: string) {
        logger.info(`Fetching church for tenant: ${tenantId}`);

        const church = await prisma.churchSettings.findUnique({
            where: { tenantId },
            include: {
                serviceTimes: {
                    orderBy: { day: 'asc' },
                },
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        domain: true,
                        plan: true,
                        status: true,
                        memberCount: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!church) {
            throw new AppError(404, 'NOT_FOUND', 'Church not found');
        }

        return church;
    }

    /**
     * Create church settings
     */
    async createChurch(data: CreateChurchData) {
        logger.info(`Creating church for tenant: ${data.tenantId}`);

        // Check if church settings already exist
        const existing = await prisma.churchSettings.findUnique({
            where: { tenantId: data.tenantId },
        });

        if (existing) {
            throw new AppError(409, 'CONFLICT', 'Church settings already exist for this tenant');
        }

        const { serviceTimes, ...churchData } = data;

        const church = await prisma.churchSettings.create({
            data: {
                ...churchData,
                serviceTimes: serviceTimes
                    ? {
                          create: serviceTimes,
                      }
                    : undefined,
            },
            include: {
                serviceTimes: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        domain: true,
                        plan: true,
                        status: true,
                        memberCount: true,
                        createdAt: true,
                    },
                },
            },
        });

        logger.info(`Church created successfully: ${church.id}`);
        return church;
    }

    /**
     * Update church settings
     */
    async updateChurch(tenantId: string, data: UpdateChurchData) {
        logger.info(`Updating church for tenant: ${tenantId}`);

        // Check if church exists
        const existing = await prisma.churchSettings.findUnique({
            where: { tenantId },
        });

        if (!existing) {
            throw new AppError(404, 'NOT_FOUND', 'Church not found');
        }

        const church = await prisma.churchSettings.update({
            where: { tenantId },
            data,
            include: {
                serviceTimes: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        domain: true,
                        plan: true,
                        status: true,
                        memberCount: true,
                        createdAt: true,
                    },
                },
            },
        });

        logger.info(`Church updated successfully: ${church.id}`);
        return church;
    }

    /**
     * Delete church settings
     */
    async deleteChurch(tenantId: string) {
        logger.info(`Deleting church for tenant: ${tenantId}`);

        // Check if church exists
        const existing = await prisma.churchSettings.findUnique({
            where: { tenantId },
        });

        if (!existing) {
            throw new AppError(404, 'NOT_FOUND', 'Church not found');
        }

        await prisma.churchSettings.delete({
            where: { tenantId },
        });

        logger.info(`Church deleted successfully for tenant: ${tenantId}`);
        return { message: 'Church deleted successfully' };
    }

    /**
     * Add service time
     */
    async addServiceTime(
        tenantId: string,
        data: {
            day: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
            time: string;
            name: string;
        }
    ) {
        logger.info(`Adding service time for tenant: ${tenantId}`);

        const church = await prisma.churchSettings.findUnique({
            where: { tenantId },
        });

        if (!church) {
            throw new AppError(404, 'NOT_FOUND', 'Church not found');
        }

        const serviceTime = await prisma.serviceTime.create({
            data: {
                ...data,
                churchSettingsId: church.id,
            },
        });

        logger.info(`Service time added: ${serviceTime.id}`);
        return serviceTime;
    }

    /**
     * Delete service time
     */
    async deleteServiceTime(serviceTimeId: string, tenantId: string) {
        logger.info(`Deleting service time: ${serviceTimeId}`);

        const serviceTime = await prisma.serviceTime.findUnique({
            where: { id: serviceTimeId },
            include: {
                churchSettings: true,
            },
        });

        if (!serviceTime) {
            throw new AppError(404, 'NOT_FOUND', 'Service time not found');
        }

        // Verify tenant ownership
        if (serviceTime.churchSettings.tenantId !== tenantId) {
            throw new AppError(403, 'FORBIDDEN', 'Access denied');
        }

        await prisma.serviceTime.delete({
            where: { id: serviceTimeId },
        });

        logger.info(`Service time deleted: ${serviceTimeId}`);
        return { message: 'Service time deleted successfully' };
    }

    /**
     * Get church statistics
     */
    async getChurchStats(tenantId: string) {
        logger.info(`Fetching church stats for tenant: ${tenantId}`);

        const [church, tenant, memberCount, taskCount] = await Promise.all([
            prisma.churchSettings.findUnique({
                where: { tenantId },
                include: {
                    serviceTimes: true,
                },
            }),
            prisma.tenant.findUnique({
                where: { id: tenantId },
            }),
            prisma.member.count({
                where: { tenantId },
            }),
            prisma.task.count({
                where: { tenantId },
            }),
        ]);

        if (!church) {
            throw new AppError(404, 'NOT_FOUND', 'Church not found');
        }

        return {
            church: {
                name: church.name,
                denomination: church.denomination,
                weeklyAttendance: church.weeklyAttendance,
                memberCount,
                serviceTimesCount: church.serviceTimes.length,
            },
            tenant: {
                plan: tenant?.plan,
                status: tenant?.status,
                createdAt: tenant?.createdAt,
            },
            activity: {
                totalMembers: memberCount,
                totalTasks: taskCount,
            },
        };
    }
}

export default new ChurchService();
