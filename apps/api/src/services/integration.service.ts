import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { Pathway, IntegrationStatus } from '@prisma/client';

interface CreateIntegrationData {
    sourceName: string;
    sheetUrl: string;
    targetPathway: Pathway;
    targetStageId: string;
    autoCreateTask?: boolean;
    taskDescription?: string;
    autoWelcome?: boolean;
    syncFrequency?: string;
    tenantId: string;
}

interface UpdateIntegrationData {
    sourceName?: string;
    sheetUrl?: string;
    targetPathway?: Pathway;
    targetStageId?: string;
    autoCreateTask?: boolean;
    taskDescription?: string;
    autoWelcome?: boolean;
    status?: IntegrationStatus;
    syncFrequency?: string;
}

export class IntegrationService {
    /**
     * Get all integrations for a tenant
     */
    async getIntegrations(tenantId: string) {
        try {
            const integrations = await prisma.integrationConfig.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
            });

            logger.info(`Retrieved ${integrations.length} integrations for tenant ${tenantId}`);
            return integrations;
        } catch (error) {
            logger.error('Error fetching integrations:', error);
            throw new AppError('Failed to fetch integrations', 500);
        }
    }

    /**
     * Get integration by ID
     */
    async getIntegrationById(integrationId: string, tenantId: string) {
        try {
            const integration = await prisma.integrationConfig.findFirst({
                where: { id: integrationId, tenantId },
            });

            if (!integration) {
                throw new AppError('Integration not found', 404);
            }

            return integration;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error fetching integration:', error);
            throw new AppError('Failed to fetch integration', 500);
        }
    }

    /**
     * Create integration
     */
    async createIntegration(data: CreateIntegrationData) {
        try {
            // Verify target stage exists
            const stage = await prisma.stage.findFirst({
                where: {
                    id: data.targetStageId,
                    tenantId: data.tenantId,
                    pathway: data.targetPathway,
                },
            });

            if (!stage) {
                throw new AppError('Target stage not found', 404);
            }

            // Create integration
            const integration = await prisma.integrationConfig.create({
                data: {
                    tenantId: data.tenantId,
                    sourceName: data.sourceName,
                    sheetUrl: data.sheetUrl,
                    targetPathway: data.targetPathway,
                    targetStageId: data.targetStageId,
                    autoCreateTask: data.autoCreateTask || false,
                    taskDescription: data.taskDescription,
                    autoWelcome: data.autoWelcome || false,
                    syncFrequency: data.syncFrequency,
                    status: 'ACTIVE',
                },
            });

            logger.info(`Created integration ${integration.id} (${integration.sourceName})`);
            return integration;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error creating integration:', error);
            throw new AppError('Failed to create integration', 500);
        }
    }

    /**
     * Update integration
     */
    async updateIntegration(
        integrationId: string,
        tenantId: string,
        data: UpdateIntegrationData
    ) {
        try {
            // Verify integration exists
            const existingIntegration = await prisma.integrationConfig.findFirst({
                where: { id: integrationId, tenantId },
            });

            if (!existingIntegration) {
                throw new AppError('Integration not found', 404);
            }

            // If target stage is being updated, verify it exists
            if (data.targetStageId) {
                const pathway = data.targetPathway || existingIntegration.targetPathway;
                const stage = await prisma.stage.findFirst({
                    where: {
                        id: data.targetStageId,
                        tenantId,
                        pathway,
                    },
                });

                if (!stage) {
                    throw new AppError('Target stage not found', 404);
                }
            }

            // Update integration
            const updatedIntegration = await prisma.integrationConfig.update({
                where: { id: integrationId },
                data,
            });

            logger.info(`Updated integration ${integrationId}`);
            return updatedIntegration;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error updating integration:', error);
            throw new AppError('Failed to update integration', 500);
        }
    }

    /**
     * Delete integration
     */
    async deleteIntegration(integrationId: string, tenantId: string) {
        try {
            const integration = await prisma.integrationConfig.findFirst({
                where: { id: integrationId, tenantId },
            });

            if (!integration) {
                throw new AppError('Integration not found', 404);
            }

            await prisma.integrationConfig.delete({
                where: { id: integrationId },
            });

            logger.info(`Deleted integration ${integrationId}`);
            return { message: 'Integration deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error deleting integration:', error);
            throw new AppError('Failed to delete integration', 500);
        }
    }

    /**
     * Trigger a manual sync for an integration
     */
    async triggerSync(integrationId: string, tenantId: string) {
        try {
            const integration = await prisma.integrationConfig.findFirst({
                where: { id: integrationId, tenantId },
            });

            if (!integration) {
                throw new AppError('Integration not found', 404);
            }

            if (integration.status !== 'ACTIVE') {
                throw new AppError('Cannot sync inactive integration', 400);
            }

            // TODO: Implement actual Google Sheets sync logic
            // This is a placeholder that will be implemented when
            // Google Sheets OAuth is set up

            logger.info(`Simulating sync for integration ${integrationId}`);

            // Update last sync time
            const updatedIntegration = await prisma.integrationConfig.update({
                where: { id: integrationId },
                data: {
                    lastSync: new Date(),
                    lastSyncStatus: 'Sync simulation successful',
                },
            });

            logger.info(`Sync completed for integration ${integrationId}`);
            return {
                success: true,
                message: 'Sync completed (simulated)',
                integration: updatedIntegration,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error triggering sync:', error);

            // Update integration with error status
            await prisma.integrationConfig.update({
                where: { id: integrationId },
                data: {
                    lastSync: new Date(),
                    lastSyncStatus: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    status: 'ERROR',
                },
            });

            throw new AppError('Failed to trigger sync', 500);
        }
    }

    /**
     * Test integration connection
     */
    async testConnection(integrationId: string, tenantId: string) {
        try {
            const integration = await prisma.integrationConfig.findFirst({
                where: { id: integrationId, tenantId },
            });

            if (!integration) {
                throw new AppError('Integration not found', 404);
            }

            // TODO: Implement actual connection test when Google Sheets OAuth is set up
            logger.info(`Testing connection for integration ${integrationId}`);

            // Simulate connection test
            const isValid = integration.sheetUrl.includes('docs.google.com');

            return {
                success: isValid,
                message: isValid
                    ? 'Connection test successful (simulated)'
                    : 'Invalid Google Sheets URL',
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error testing connection:', error);
            throw new AppError('Failed to test connection', 500);
        }
    }

    /**
     * Get integration statistics
     */
    async getIntegrationStats(tenantId: string) {
        try {
            const total = await prisma.integrationConfig.count({ where: { tenantId } });
            const active = await prisma.integrationConfig.count({
                where: { tenantId, status: 'ACTIVE' },
            });
            const error = await prisma.integrationConfig.count({
                where: { tenantId, status: 'ERROR' },
            });
            const paused = await prisma.integrationConfig.count({
                where: { tenantId, status: 'PAUSED' },
            });

            return {
                total,
                active,
                error,
                paused,
            };
        } catch (error) {
            logger.error('Error fetching integration stats:', error);
            throw new AppError('Failed to fetch integration statistics', 500);
        }
    }
}

export default new IntegrationService();
