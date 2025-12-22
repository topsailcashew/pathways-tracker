import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { Pathway, AutoAdvanceType } from '@prisma/client';

interface CreateStageData {
    pathway: Pathway;
    name: string;
    description?: string;
    order: number;
    autoAdvanceEnabled?: boolean;
    autoAdvanceType?: AutoAdvanceType;
    autoAdvanceValue?: string;
    tenantId: string;
}

interface UpdateStageData {
    name?: string;
    description?: string;
    order?: number;
    autoAdvanceEnabled?: boolean;
    autoAdvanceType?: AutoAdvanceType;
    autoAdvanceValue?: string;
}

interface ReorderStageData {
    stageId: string;
    newOrder: number;
}

export class StageService {
    /**
     * Get all stages for a pathway
     */
    async getStages(tenantId: string, pathway?: Pathway) {
        try {
            const where: any = { tenantId };
            if (pathway) {
                where.pathway = pathway;
            }

            const stages = await prisma.stage.findMany({
                where,
                orderBy: [{ pathway: 'asc' }, { order: 'asc' }],
                include: {
                    _count: {
                        select: {
                            members: true,
                            automationRules: true,
                        },
                    },
                },
            });

            logger.info(`Retrieved ${stages.length} stages for tenant ${tenantId}`);
            return stages;
        } catch (error) {
            logger.error('Error fetching stages:', error);
            throw new AppError('Failed to fetch stages', 500);
        }
    }

    /**
     * Get stage by ID
     */
    async getStageById(stageId: string, tenantId: string) {
        try {
            const stage = await prisma.stage.findFirst({
                where: { id: stageId, tenantId },
                include: {
                    automationRules: {
                        where: { enabled: true },
                        orderBy: { priority: 'desc' },
                    },
                    _count: {
                        select: {
                            members: true,
                        },
                    },
                },
            });

            if (!stage) {
                throw new AppError('Stage not found', 404);
            }

            return stage;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error fetching stage:', error);
            throw new AppError('Failed to fetch stage', 500);
        }
    }

    /**
     * Create a new stage
     */
    async createStage(data: CreateStageData) {
        try {
            // Check if stage name already exists for this pathway
            const existingStage = await prisma.stage.findFirst({
                where: {
                    tenantId: data.tenantId,
                    pathway: data.pathway,
                    name: data.name,
                },
            });

            if (existingStage) {
                throw new AppError('Stage with this name already exists for this pathway', 400);
            }

            // Check if order is already taken
            const orderTaken = await prisma.stage.findFirst({
                where: {
                    tenantId: data.tenantId,
                    pathway: data.pathway,
                    order: data.order,
                },
            });

            if (orderTaken) {
                // Shift all stages at or after this order up by 1
                await this.shiftStagesUp(data.tenantId, data.pathway, data.order);
            }

            // Create the stage
            const stage = await prisma.stage.create({
                data: {
                    tenantId: data.tenantId,
                    pathway: data.pathway,
                    name: data.name,
                    description: data.description,
                    order: data.order,
                    autoAdvanceEnabled: data.autoAdvanceEnabled || false,
                    autoAdvanceType: data.autoAdvanceType,
                    autoAdvanceValue: data.autoAdvanceValue,
                },
            });

            logger.info(`Created stage ${stage.id} (${stage.name}) for pathway ${stage.pathway}`);
            return stage;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error creating stage:', error);
            throw new AppError('Failed to create stage', 500);
        }
    }

    /**
     * Update a stage
     */
    async updateStage(stageId: string, tenantId: string, data: UpdateStageData) {
        try {
            // Verify stage exists in this tenant
            const existingStage = await prisma.stage.findFirst({
                where: { id: stageId, tenantId },
            });

            if (!existingStage) {
                throw new AppError('Stage not found', 404);
            }

            // If name is being updated, check it's not taken
            if (data.name && data.name !== existingStage.name) {
                const nameTaken = await prisma.stage.findFirst({
                    where: {
                        tenantId,
                        pathway: existingStage.pathway,
                        name: data.name,
                        id: { not: stageId },
                    },
                });

                if (nameTaken) {
                    throw new AppError('Stage name already in use for this pathway', 400);
                }
            }

            // If order is being updated
            if (data.order !== undefined && data.order !== existingStage.order) {
                await this.reorderSingle(stageId, tenantId, data.order);
                // Don't update order in this call, it was handled by reorderSingle
                delete data.order;
            }

            // Update the stage
            const updatedStage = await prisma.stage.update({
                where: { id: stageId },
                data,
            });

            logger.info(`Updated stage ${stageId}`);
            return updatedStage;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error updating stage:', error);
            throw new AppError('Failed to update stage', 500);
        }
    }

    /**
     * Delete a stage
     */
    async deleteStage(stageId: string, tenantId: string) {
        try {
            // Verify stage exists in this tenant
            const stage = await prisma.stage.findFirst({
                where: { id: stageId, tenantId },
                include: {
                    _count: {
                        select: { members: true },
                    },
                },
            });

            if (!stage) {
                throw new AppError('Stage not found', 404);
            }

            // Can't delete if members are in this stage
            if (stage._count.members > 0) {
                throw new AppError(
                    `Cannot delete stage with ${stage._count.members} members. Move them to another stage first.`,
                    400
                );
            }

            // Delete the stage
            await prisma.stage.delete({
                where: { id: stageId },
            });

            // Reorder remaining stages
            await this.normalizeOrders(tenantId, stage.pathway);

            logger.info(`Deleted stage ${stageId}`);
            return { message: 'Stage deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error deleting stage:', error);
            throw new AppError('Failed to delete stage', 500);
        }
    }

    /**
     * Reorder multiple stages at once
     */
    async reorderStages(tenantId: string, pathway: Pathway, reorders: ReorderStageData[]) {
        try {
            // Verify all stages exist and belong to this tenant and pathway
            const stageIds = reorders.map((r) => r.stageId);
            const stages = await prisma.stage.findMany({
                where: {
                    id: { in: stageIds },
                    tenantId,
                    pathway,
                },
            });

            if (stages.length !== stageIds.length) {
                throw new AppError('One or more stages not found', 404);
            }

            // Update all stages in a transaction
            await prisma.$transaction(
                reorders.map((reorder) =>
                    prisma.stage.update({
                        where: { id: reorder.stageId },
                        data: { order: reorder.newOrder },
                    })
                )
            );

            logger.info(`Reordered ${reorders.length} stages for pathway ${pathway}`);
            return { message: 'Stages reordered successfully' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error reordering stages:', error);
            throw new AppError('Failed to reorder stages', 500);
        }
    }

    /**
     * Reorder a single stage
     */
    private async reorderSingle(stageId: string, tenantId: string, newOrder: number) {
        const stage = await prisma.stage.findFirst({
            where: { id: stageId, tenantId },
        });

        if (!stage) {
            throw new AppError('Stage not found', 404);
        }

        const oldOrder = stage.order;

        if (oldOrder === newOrder) {
            return; // No change needed
        }

        // If moving down (higher order number)
        if (newOrder > oldOrder) {
            // Shift stages between oldOrder+1 and newOrder down by 1
            await prisma.stage.updateMany({
                where: {
                    tenantId,
                    pathway: stage.pathway,
                    order: {
                        gt: oldOrder,
                        lte: newOrder,
                    },
                },
                data: {
                    order: {
                        decrement: 1,
                    },
                },
            });
        } else {
            // Moving up (lower order number)
            // Shift stages between newOrder and oldOrder-1 up by 1
            await prisma.stage.updateMany({
                where: {
                    tenantId,
                    pathway: stage.pathway,
                    order: {
                        gte: newOrder,
                        lt: oldOrder,
                    },
                },
                data: {
                    order: {
                        increment: 1,
                    },
                },
            });
        }

        // Update the stage to its new order
        await prisma.stage.update({
            where: { id: stageId },
            data: { order: newOrder },
        });
    }

    /**
     * Shift all stages at or after a given order up by 1
     */
    private async shiftStagesUp(tenantId: string, pathway: Pathway, fromOrder: number) {
        await prisma.stage.updateMany({
            where: {
                tenantId,
                pathway,
                order: {
                    gte: fromOrder,
                },
            },
            data: {
                order: {
                    increment: 1,
                },
            },
        });
    }

    /**
     * Normalize orders to be sequential (0, 1, 2, 3, ...)
     */
    private async normalizeOrders(tenantId: string, pathway: Pathway) {
        const stages = await prisma.stage.findMany({
            where: { tenantId, pathway },
            orderBy: { order: 'asc' },
        });

        await prisma.$transaction(
            stages.map((stage, index) =>
                prisma.stage.update({
                    where: { id: stage.id },
                    data: { order: index },
                })
            )
        );
    }

    /**
     * Get stage statistics
     */
    async getStageStats(tenantId: string, pathway?: Pathway) {
        try {
            const where: any = { tenantId };
            if (pathway) {
                where.pathway = pathway;
            }

            const stages = await prisma.stage.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            members: true,
                        },
                    },
                },
            });

            const stats = stages.map((stage) => ({
                id: stage.id,
                name: stage.name,
                pathway: stage.pathway,
                order: stage.order,
                memberCount: stage._count.members,
            }));

            return stats;
        } catch (error) {
            logger.error('Error fetching stage stats:', error);
            throw new AppError('Failed to fetch stage statistics', 500);
        }
    }
}

export default new StageService();
