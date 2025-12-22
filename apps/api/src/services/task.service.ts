import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { TaskPriority, Prisma } from '@prisma/client';

interface CreateTaskData {
    tenantId: string;
    memberId: string;
    description: string;
    dueDate: Date;
    priority?: TaskPriority;
    assignedToId: string;
    createdById: string;
}

interface UpdateTaskData {
    description?: string;
    dueDate?: Date;
    priority?: TaskPriority;
    assignedToId?: string;
}

export class TaskService {
    // Create task
    async createTask(data: CreateTaskData) {
        try {
            // Verify member exists
            const member = await prisma.member.findFirst({
                where: {
                    id: data.memberId,
                    tenantId: data.tenantId,
                },
            });

            if (!member) {
                throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found');
            }

            const task = await prisma.task.create({
                data: {
                    ...data,
                    priority: data.priority || 'MEDIUM',
                },
                include: {
                    member: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    assignedTo: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            logger.info(`Task created: ${task.id}`);

            return task;
        } catch (error) {
            logger.error('Create task error:', error);
            throw error;
        }
    }

    // Get task by ID
    async getTaskById(taskId: string, tenantId: string) {
        try {
            const task = await prisma.task.findFirst({
                where: {
                    id: taskId,
                    tenantId,
                },
                include: {
                    member: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            pathway: true,
                            currentStage: true,
                        },
                    },
                    assignedTo: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    createdBy: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            if (!task) {
                throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found');
            }

            return task;
        } catch (error) {
            logger.error('Get task error:', error);
            throw error;
        }
    }

    // List tasks with filters
    async listTasks(
        tenantId: string,
        filters: {
            assignedToId?: string;
            memberId?: string;
            completed?: boolean;
            overdue?: boolean;
            priority?: TaskPriority;
            page?: number;
            limit?: number;
        }
    ) {
        try {
            const page = filters.page || 1;
            const limit = Math.min(filters.limit || 50, 100);
            const skip = (page - 1) * limit;

            const where: Prisma.TaskWhereInput = {
                tenantId,
                ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
                ...(filters.memberId && { memberId: filters.memberId }),
                ...(filters.completed !== undefined && { completed: filters.completed }),
                ...(filters.priority && { priority: filters.priority }),
                ...(filters.overdue && {
                    completed: false,
                    dueDate: { lt: new Date() },
                }),
            };

            const [tasks, total] = await Promise.all([
                prisma.task.findMany({
                    where,
                    include: {
                        member: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                        assignedTo: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
                    skip,
                    take: limit,
                }),
                prisma.task.count({ where }),
            ]);

            return {
                tasks,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('List tasks error:', error);
            throw error;
        }
    }

    // Update task
    async updateTask(taskId: string, tenantId: string, data: UpdateTaskData) {
        try {
            const existing = await prisma.task.findFirst({
                where: { id: taskId, tenantId },
            });

            if (!existing) {
                throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found');
            }

            const task = await prisma.task.update({
                where: { id: taskId },
                data,
                include: {
                    member: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    assignedTo: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            logger.info(`Task updated: ${taskId}`);

            return task;
        } catch (error) {
            logger.error('Update task error:', error);
            throw error;
        }
    }

    // Complete task
    async completeTask(taskId: string, tenantId: string, userId: string) {
        try {
            return await prisma.$transaction(async (tx) => {
                const task = await tx.task.findFirst({
                    where: { id: taskId, tenantId },
                    include: {
                        member: {
                            include: {
                                currentStage: true,
                            },
                        },
                    },
                });

                if (!task) {
                    throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found');
                }

                if (task.completed) {
                    throw new AppError(400, 'TASK_ALREADY_COMPLETED', 'Task already completed');
                }

                // Mark task as completed
                const updatedTask = await tx.task.update({
                    where: { id: taskId },
                    data: {
                        completed: true,
                        completedAt: new Date(),
                    },
                });

                // Check if this task triggers auto-advance
                const stage = task.member.currentStage;
                let memberAdvanced = false;

                if (
                    stage.autoAdvanceEnabled &&
                    stage.autoAdvanceType === 'TASK_COMPLETED' &&
                    stage.autoAdvanceValue
                ) {
                    // Check if task description matches the trigger keyword
                    if (task.description.toLowerCase().includes(stage.autoAdvanceValue.toLowerCase())) {
                        // Get next stage
                        const nextStage = await tx.stage.findFirst({
                            where: {
                                tenantId,
                                pathway: task.member.pathway,
                                order: stage.order + 1,
                            },
                        });

                        if (nextStage) {
                            // Advance member to next stage
                            await tx.stageHistory.create({
                                data: {
                                    memberId: task.memberId,
                                    fromStageId: stage.id,
                                    toStageId: nextStage.id,
                                    changedBy: userId,
                                    reason: 'Auto-advanced: Task completed',
                                },
                            });

                            await tx.member.update({
                                where: { id: task.memberId },
                                data: {
                                    currentStageId: nextStage.id,
                                    lastStageChangeDate: new Date(),
                                },
                            });

                            await tx.note.create({
                                data: {
                                    memberId: task.memberId,
                                    content: `[System] Auto-advanced from "${stage.name}" to "${nextStage.name}" (task completed)`,
                                    isSystem: true,
                                },
                            });

                            memberAdvanced = true;
                            logger.info(`Member ${task.memberId} auto-advanced to ${nextStage.id}`);
                        } else {
                            // Final stage - mark as integrated
                            await tx.member.update({
                                where: { id: task.memberId },
                                data: { status: 'INTEGRATED' },
                            });

                            await tx.note.create({
                                data: {
                                    memberId: task.memberId,
                                    content: '[System] Pathway completed - marked as integrated',
                                    isSystem: true,
                                },
                            });
                        }
                    }
                }

                logger.info(`Task completed: ${taskId}`);

                return { task: updatedTask, memberAdvanced };
            });
        } catch (error) {
            logger.error('Complete task error:', error);
            throw error;
        }
    }

    // Delete task
    async deleteTask(taskId: string, tenantId: string) {
        try {
            const task = await prisma.task.findFirst({
                where: { id: taskId, tenantId },
            });

            if (!task) {
                throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found');
            }

            await prisma.task.delete({
                where: { id: taskId },
            });

            logger.info(`Task deleted: ${taskId}`);
        } catch (error) {
            logger.error('Delete task error:', error);
            throw error;
        }
    }

    // Get task statistics
    async getTaskStats(tenantId: string, userId?: string) {
        try {
            const where: Prisma.TaskWhereInput = {
                tenantId,
                ...(userId && { assignedToId: userId }),
            };

            const [total, completed, overdue, highPriority] = await Promise.all([
                prisma.task.count({ where }),
                prisma.task.count({ where: { ...where, completed: true } }),
                prisma.task.count({
                    where: {
                        ...where,
                        completed: false,
                        dueDate: { lt: new Date() },
                    },
                }),
                prisma.task.count({
                    where: {
                        ...where,
                        completed: false,
                        priority: 'HIGH',
                    },
                }),
            ]);

            return {
                total,
                completed,
                pending: total - completed,
                overdue,
                highPriority,
                completionRate: total > 0 ? (completed / total) * 100 : 0,
            };
        } catch (error) {
            logger.error('Get task stats error:', error);
            throw error;
        }
    }
}

export default new TaskService();
