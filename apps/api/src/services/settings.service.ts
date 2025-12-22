import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { DayOfWeek } from '@prisma/client';

interface ServiceTimeData {
    day: DayOfWeek;
    time: string;
    name: string;
}

interface ChurchSettingsData {
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
    serviceTimes?: ServiceTimeData[];
}

export class SettingsService {
    /**
     * Get church settings for a tenant
     */
    async getSettings(tenantId: string) {
        try {
            let settings = await prisma.churchSettings.findUnique({
                where: { tenantId },
                include: {
                    serviceTimes: {
                        orderBy: [{ day: 'asc' }, { time: 'asc' }],
                    },
                },
            });

            // If settings don't exist, create default ones
            if (!settings) {
                const tenant = await prisma.tenant.findUnique({
                    where: { id: tenantId },
                });

                if (!tenant) {
                    throw new AppError('Tenant not found', 404);
                }

                settings = await prisma.churchSettings.create({
                    data: {
                        tenantId,
                        name: tenant.name,
                        email: tenant.adminEmail,
                        phone: '',
                        address: '',
                        city: '',
                        state: '',
                        zip: '',
                    },
                    include: {
                        serviceTimes: true,
                    },
                });
            }

            logger.info(`Retrieved settings for tenant ${tenantId}`);
            return settings;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error fetching settings:', error);
            throw new AppError('Failed to fetch settings', 500);
        }
    }

    /**
     * Update church settings
     */
    async updateSettings(tenantId: string, data: ChurchSettingsData) {
        try {
            // Get or create settings
            let settings = await prisma.churchSettings.findUnique({
                where: { tenantId },
            });

            if (!settings) {
                // Create if doesn't exist
                const tenant = await prisma.tenant.findUnique({
                    where: { id: tenantId },
                });

                if (!tenant) {
                    throw new AppError('Tenant not found', 404);
                }

                settings = await prisma.churchSettings.create({
                    data: {
                        tenantId,
                        name: data.name || tenant.name,
                        email: data.email || tenant.adminEmail,
                        phone: data.phone || '',
                        address: data.address || '',
                        city: data.city || '',
                        state: data.state || '',
                        zip: data.zip || '',
                    },
                });
            }

            // Extract service times from data
            const { serviceTimes, ...settingsData } = data;

            // Update settings
            const updatedSettings = await prisma.churchSettings.update({
                where: { id: settings.id },
                data: settingsData,
            });

            // Update service times if provided
            if (serviceTimes) {
                // Delete existing service times
                await prisma.serviceTime.deleteMany({
                    where: { churchSettingsId: settings.id },
                });

                // Create new service times
                if (serviceTimes.length > 0) {
                    await prisma.serviceTime.createMany({
                        data: serviceTimes.map((st) => ({
                            churchSettingsId: settings.id,
                            day: st.day,
                            time: st.time,
                            name: st.name,
                        })),
                    });
                }
            }

            // Fetch complete settings with service times
            const completeSettings = await prisma.churchSettings.findUnique({
                where: { id: settings.id },
                include: {
                    serviceTimes: {
                        orderBy: [{ day: 'asc' }, { time: 'asc' }],
                    },
                },
            });

            logger.info(`Updated settings for tenant ${tenantId}`);
            return completeSettings;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error updating settings:', error);
            throw new AppError('Failed to update settings', 500);
        }
    }

    /**
     * Add service time
     */
    async addServiceTime(tenantId: string, serviceTime: ServiceTimeData) {
        try {
            const settings = await prisma.churchSettings.findUnique({
                where: { tenantId },
            });

            if (!settings) {
                throw new AppError('Settings not found', 404);
            }

            const newServiceTime = await prisma.serviceTime.create({
                data: {
                    churchSettingsId: settings.id,
                    day: serviceTime.day,
                    time: serviceTime.time,
                    name: serviceTime.name,
                },
            });

            logger.info(`Added service time for tenant ${tenantId}`);
            return newServiceTime;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error adding service time:', error);
            throw new AppError('Failed to add service time', 500);
        }
    }

    /**
     * Delete service time
     */
    async deleteServiceTime(serviceTimeId: string, tenantId: string) {
        try {
            const serviceTime = await prisma.serviceTime.findFirst({
                where: {
                    id: serviceTimeId,
                    churchSettings: {
                        tenantId,
                    },
                },
            });

            if (!serviceTime) {
                throw new AppError('Service time not found', 404);
            }

            await prisma.serviceTime.delete({
                where: { id: serviceTimeId },
            });

            logger.info(`Deleted service time ${serviceTimeId}`);
            return { message: 'Service time deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error deleting service time:', error);
            throw new AppError('Failed to delete service time', 500);
        }
    }
}

export default new SettingsService();
