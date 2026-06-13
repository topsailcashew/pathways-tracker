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
            throw new AppError(500, 'ERROR', 'Failed to fetch stages');
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
                throw new AppError(404, 'ERROR', 'Stage not found');
            }

            return stage;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error fetching stage:', error);
            throw new AppError(500, 'ERROR', 'Failed to fetch stage');
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
                throw new AppError(400, 'ERROR', 'Stage with this name already exists for this pathway');
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
            throw new AppError(500, 'ERROR', 'Failed to create stage');
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
                throw new AppError(404, 'ERROR', 'Stage not found');
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
                    throw new AppError(400, 'ERROR', 'Stage name already in use for this pathway');
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
            throw new AppError(500, 'ERROR', 'Failed to update stage');
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
                throw new AppError(404, 'ERROR', 'Stage not found');
            }

            // Can't delete if members are in this stage
            if (stage._count.members > 0) {
                throw new AppError(
                    400,
                    'ERROR',
                    `Cannot delete stage with ${stage._count.members} members. Move them to another stage first.`
                );
            }

            // Clean up StageHistory references before deleting:
            // - toStageId references get cascade-deleted (onDelete: Cascade in schema)
            // - fromStageId references get set to null (onDelete: SetNull in schema)
            // Both are now handled by DB-level cascade. Just delete the stage.
            await prisma.stage.delete({
                where: { id: stageId },
            });

            // Reorder remaining stages to close the gap
            await this.normalizeOrders(tenantId, stage.pathway);

            logger.info(`Deleted stage ${stageId}`);
            return { message: 'Stage deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error deleting stage:', error);
            throw new AppError(500, 'ERROR', 'Failed to delete stage');
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
                throw new AppError(404, 'ERROR', 'One or more stages not found');
            }

            // Use a single UPDATE with CASE to avoid unique constraint violations.
            // PostgreSQL checks constraints after the entire statement completes.
            // Input is validated by zod (stageId: uuid, newOrder: int).
            const cases = reorders
                .map(r => `WHEN id = '${r.stageId}' THEN ${r.newOrder}`)
                .join(' ');
            const ids = reorders.map(r => `'${r.stageId}'`).join(', ');

            await prisma.$executeRawUnsafe(
                `UPDATE "Stage" SET "order" = CASE ${cases} END, "updatedAt" = NOW() WHERE id IN (${ids})`
            );

            logger.info(`Reordered ${reorders.length} stages for pathway ${pathway}`);
            return { message: 'Stages reordered successfully' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error reordering stages:', error);
            throw new AppError(500, 'ERROR', 'Failed to reorder stages');
        }
    }

    /**
     * Reorder a single stage atomically via a single SQL CASE statement.
     *
     * Using separate updateMany + update calls causes a transient unique
     * constraint violation when shifting stages UP (incrementing orders for
     * rows between newOrder and oldOrder-1 temporarily duplicates oldOrder
     * while the moving stage hasn't been repositioned yet). The CASE approach
     * updates every affected row in one statement so the DB never sees a
     * duplicate mid-update.
     */
    private async reorderSingle(stageId: string, tenantId: string, newOrder: number) {
        const stage = await prisma.stage.findFirst({
            where: { id: stageId, tenantId },
        });

        if (!stage) {
            throw new AppError(404, 'ERROR', 'Stage not found');
        }

        const oldOrder = stage.order;
        if (oldOrder === newOrder) return;

        // Collect all stages that need to move
        let affectedWhere: { gte?: number; lte?: number; gt?: number; lt?: number };
        let shift: number;

        if (newOrder > oldOrder) {
            // Moving DOWN: pull in-between stages one step closer to the top
            affectedWhere = { gt: oldOrder, lte: newOrder };
            shift = -1;
        } else {
            // Moving UP: push in-between stages one step toward the bottom
            affectedWhere = { gte: newOrder, lt: oldOrder };
            shift = 1;
        }

        const affected = await prisma.stage.findMany({
            where: { tenantId, pathway: stage.pathway, order: affectedWhere },
            select: { id: true, order: true },
        });

        // Build a single CASE statement for all rows (including the moving stage)
        const allRows = [
            ...affected.map(r => ({ id: r.id, newOrd: r.order + shift })),
            { id: stageId, newOrd: newOrder },
        ];

        const cases = allRows.map(r => `WHEN id = '${r.id}' THEN ${r.newOrd}`).join(' ');
        const ids   = allRows.map(r => `'${r.id}'`).join(', ');

        await prisma.$executeRawUnsafe(
            `UPDATE "Stage" SET "order" = CASE ${cases} END, "updatedAt" = NOW() WHERE id IN (${ids})`
        );
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

    // -----------------------------------------------------------------------
    // Default stage definitions
    // -----------------------------------------------------------------------

    static readonly DEFAULT_NEWCOMER_STAGES = [
        { name: 'First Visit',      description: 'Person attended for the first time',       order: 1 },
        { name: 'Follow-up Call',   description: 'Initial outreach call or message made',    order: 2 },
        { name: "Newcomer's Lunch", description: "Attended the newcomer's lunch event",       order: 3 },
        { name: 'Connect Group',    description: 'Joined a small group or connect group',     order: 4 },
        { name: 'Serving',          description: 'Actively serving in a ministry role',       order: 5 },
        { name: 'Integrated',       description: 'Fully integrated into church community',    order: 6 },
    ];

    static readonly DEFAULT_NEW_BELIEVER_STAGES = [
        { name: 'Decision Made',    description: 'Made a decision to follow Christ',           order: 1 },
        { name: 'Foundations',      description: 'Completing new believer foundations course', order: 2 },
        { name: 'Baptism',          description: 'Preparing for or completed water baptism',   order: 3 },
        { name: 'Discipleship',     description: 'In active one-on-one discipleship',          order: 4 },
        { name: 'Integrated',       description: 'Fully integrated into church community',     order: 5 },
    ];

    /**
     * Seed the two default pathways for a tenant (idempotent).
     * Only inserts stages that don't already exist for the tenant+pathway.
     */
    async seedDefaultStages(tenantId: string) {
        const existing = await prisma.stage.findMany({
            where: { tenantId },
            select: { pathway: true, name: true },
        });

        const has = (pathway: Pathway, name: string) =>
            existing.some(s => s.pathway === pathway && s.name === name);

        const toCreate: Array<{
            tenantId: string;
            pathway: Pathway;
            name: string;
            description: string;
            order: number;
        }> = [];

        for (const s of StageService.DEFAULT_NEWCOMER_STAGES) {
            if (!has(Pathway.NEWCOMER, s.name)) {
                toCreate.push({ tenantId, pathway: Pathway.NEWCOMER, ...s });
            }
        }
        for (const s of StageService.DEFAULT_NEW_BELIEVER_STAGES) {
            if (!has(Pathway.NEW_BELIEVER, s.name)) {
                toCreate.push({ tenantId, pathway: Pathway.NEW_BELIEVER, ...s });
            }
        }

        if (toCreate.length > 0) {
            await prisma.stage.createMany({ data: toCreate, skipDuplicates: true });
            logger.info(`Seeded ${toCreate.length} default stages for tenant ${tenantId}`);
        }

        return prisma.stage.findMany({
            where: { tenantId },
            orderBy: [{ pathway: 'asc' }, { order: 'asc' }],
        });
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
            throw new AppError(500, 'ERROR', 'Failed to fetch stage statistics');
        }
    }
}

export default new StageService();
