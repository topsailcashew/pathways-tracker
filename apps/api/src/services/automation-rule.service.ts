import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { TaskPriority } from '@prisma/client';

interface CreateAutomationRuleData {
    stageId: string;
    name: string;
    taskDescription: string;
    daysDue: number;
    priority?: TaskPriority;
    enabled?: boolean;
    tenantId: string;
}

interface UpdateAutomationRuleData {
    name?: string;
    taskDescription?: string;
    daysDue?: number;
    priority?: TaskPriority;
    enabled?: boolean;
}

export class AutomationRuleService {
    /**
     * Get all automation rules for a tenant
     */
    async getAutomationRules(tenantId: string, stageId?: string) {
        try {
            const where: any = { tenantId };
            if (stageId) {
                where.stageId = stageId;
            }

            const rules = await prisma.automationRule.findMany({
                where,
                include: {
                    stage: {
                        select: {
                            id: true,
                            name: true,
                            pathway: true,
                            order: true,
                        },
                    },
                },
                orderBy: [{ stageId: 'asc' }, { priority: 'desc' }],
            });

            logger.info(`Retrieved ${rules.length} automation rules for tenant ${tenantId}`);
            return rules;
        } catch (error) {
            logger.error('Error fetching automation rules:', error);
            throw new AppError(500, 'ERROR', 'Failed to fetch automation rules');
        }
    }

    /**
     * Get automation rule by ID
     */
    async getAutomationRuleById(ruleId: string, tenantId: string) {
        try {
            const rule = await prisma.automationRule.findFirst({
                where: { id: ruleId, tenantId },
                include: {
                    stage: {
                        select: {
                            id: true,
                            name: true,
                            pathway: true,
                            order: true,
                        },
                    },
                },
            });

            if (!rule) {
                throw new AppError(404, 'ERROR', 'Automation rule not found');
            }

            return rule;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error fetching automation rule:', error);
            throw new AppError(500, 'ERROR', 'Failed to fetch automation rule');
        }
    }

    /**
     * Create automation rule
     */
    async createAutomationRule(data: CreateAutomationRuleData) {
        try {
            // Verify stage exists and belongs to this tenant
            const stage = await prisma.stage.findFirst({
                where: {
                    id: data.stageId,
                    tenantId: data.tenantId,
                },
            });

            if (!stage) {
                throw new AppError(404, 'ERROR', 'Stage not found');
            }

            // Create rule
            const rule = await prisma.automationRule.create({
                data: {
                    tenantId: data.tenantId,
                    stageId: data.stageId,
                    name: data.name,
                    taskDescription: data.taskDescription,
                    daysDue: data.daysDue,
                    priority: data.priority || 'MEDIUM',
                    enabled: data.enabled !== undefined ? data.enabled : true,
                },
                include: {
                    stage: {
                        select: {
                            name: true,
                            pathway: true,
                        },
                    },
                },
            });

            logger.info(
                `Created automation rule ${rule.id} (${rule.name}) for stage ${stage.name}`
            );
            return rule;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error creating automation rule:', error);
            throw new AppError(500, 'ERROR', 'Failed to create automation rule');
        }
    }

    /**
     * Update automation rule
     */
    async updateAutomationRule(
        ruleId: string,
        tenantId: string,
        data: UpdateAutomationRuleData
    ) {
        try {
            // Verify rule exists in this tenant
            const existingRule = await prisma.automationRule.findFirst({
                where: { id: ruleId, tenantId },
            });

            if (!existingRule) {
                throw new AppError(404, 'ERROR', 'Automation rule not found');
            }

            // Update rule
            const updatedRule = await prisma.automationRule.update({
                where: { id: ruleId },
                data,
                include: {
                    stage: {
                        select: {
                            name: true,
                            pathway: true,
                        },
                    },
                },
            });

            logger.info(`Updated automation rule ${ruleId}`);
            return updatedRule;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error updating automation rule:', error);
            throw new AppError(500, 'ERROR', 'Failed to update automation rule');
        }
    }

    /**
     * Toggle automation rule enabled state
     */
    async toggleAutomationRule(ruleId: string, tenantId: string, enabled: boolean) {
        try {
            const rule = await prisma.automationRule.findFirst({
                where: { id: ruleId, tenantId },
            });

            if (!rule) {
                throw new AppError(404, 'ERROR', 'Automation rule not found');
            }

            const updatedRule = await prisma.automationRule.update({
                where: { id: ruleId },
                data: { enabled },
            });

            logger.info(`${enabled ? 'Enabled' : 'Disabled'} automation rule ${ruleId}`);
            return updatedRule;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error toggling automation rule:', error);
            throw new AppError(500, 'ERROR', 'Failed to toggle automation rule');
        }
    }

    /**
     * Delete automation rule
     */
    async deleteAutomationRule(ruleId: string, tenantId: string) {
        try {
            const rule = await prisma.automationRule.findFirst({
                where: { id: ruleId, tenantId },
            });

            if (!rule) {
                throw new AppError(404, 'ERROR', 'Automation rule not found');
            }

            await prisma.automationRule.delete({
                where: { id: ruleId },
            });

            logger.info(`Deleted automation rule ${ruleId}`);
            return { message: 'Automation rule deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error deleting automation rule:', error);
            throw new AppError(500, 'ERROR', 'Failed to delete automation rule');
        }
    }

    /**
     * Get automation rule statistics
     */
    async getAutomationRuleStats(tenantId: string) {
        try {
            const total = await prisma.automationRule.count({ where: { tenantId } });
            const enabled = await prisma.automationRule.count({
                where: { tenantId, enabled: true },
            });
            const disabled = total - enabled;

            const byStage = await prisma.automationRule.groupBy({
                by: ['stageId'],
                where: { tenantId },
                _count: { id: true },
            });

            return {
                total,
                enabled,
                disabled,
                byStage: byStage.length,
            };
        } catch (error) {
            logger.error('Error fetching automation rule stats:', error);
            throw new AppError(500, 'ERROR', 'Failed to fetch automation rule statistics');
        }
    }
}

export default new AutomationRuleService();
