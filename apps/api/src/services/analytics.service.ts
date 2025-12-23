import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { Pathway, MemberStatus } from '@prisma/client';

export class AnalyticsService {
    /**
     * Get overview/dashboard analytics
     */
    async getOverview(tenantId: string) {
        try {
            const [
                totalMembers,
                activeMembers,
                integratedMembers,
                inactiveMembers,
                totalTasks,
                pendingTasks,
                overdueTasks,
                completedTasks,
                totalUsers,
                newcomers,
                newBelievers,
            ] = await Promise.all([
                // Member counts
                prisma.member.count({ where: { tenantId } }),
                prisma.member.count({ where: { tenantId, status: 'ACTIVE' } }),
                prisma.member.count({ where: { tenantId, status: 'INTEGRATED' } }),
                prisma.member.count({ where: { tenantId, status: 'INACTIVE' } }),

                // Task counts
                prisma.task.count({ where: { tenantId } }),
                prisma.task.count({ where: { tenantId, completed: false } }),
                prisma.task.count({
                    where: {
                        tenantId,
                        completed: false,
                        dueDate: { lt: new Date() },
                    },
                }),
                prisma.task.count({ where: { tenantId, completed: true } }),

                // User count
                prisma.user.count({ where: { tenantId } }),

                // Pathway counts
                prisma.member.count({ where: { tenantId, pathway: 'NEWCOMER' } }),
                prisma.member.count({ where: { tenantId, pathway: 'NEW_BELIEVER' } }),
            ]);

            // Recent activity
            const recentMembers = await prisma.member.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    pathway: true,
                    status: true,
                    createdAt: true,
                },
            });

            const recentTasks = await prisma.task.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    description: true,
                    completed: true,
                    dueDate: true,
                    member: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            return {
                members: {
                    total: totalMembers,
                    active: activeMembers,
                    integrated: integratedMembers,
                    inactive: inactiveMembers,
                    byPathway: {
                        newcomers,
                        newBelievers,
                    },
                },
                tasks: {
                    total: totalTasks,
                    pending: pendingTasks,
                    overdue: overdueTasks,
                    completed: completedTasks,
                    completionRate:
                        totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0',
                },
                users: {
                    total: totalUsers,
                },
                recentActivity: {
                    members: recentMembers,
                    tasks: recentTasks,
                },
            };
        } catch (error) {
            logger.error('Error fetching overview analytics:', error);
            throw new AppError(500, 'ERROR', 'Failed to fetch overview analytics');
        }
    }

    /**
     * Get member analytics
     */
    async getMemberAnalytics(tenantId: string, pathway?: Pathway) {
        try {
            const where: any = { tenantId };
            if (pathway) {
                where.pathway = pathway;
            }

            // Member status distribution
            const byStatus = await prisma.member.groupBy({
                by: ['status'],
                where,
                _count: { id: true },
            });

            // Members by stage
            const byStage = await prisma.member.groupBy({
                by: ['currentStageId'],
                where,
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
            });

            // Get stage details for byStage
            const stageIds = byStage.map((s) => s.currentStageId);
            const stages = await prisma.stage.findMany({
                where: { id: { in: stageIds } },
                select: { id: true, name: true, order: true, pathway: true },
            });

            const byStageWithNames = byStage.map((stat) => {
                const stage = stages.find((s) => s.id === stat.currentStageId);
                return {
                    stageId: stat.currentStageId,
                    stageName: stage?.name || 'Unknown',
                    stageOrder: stage?.order || 0,
                    pathway: stage?.pathway || 'NEWCOMER',
                    count: stat._count.id,
                };
            }).sort((a, b) => a.stageOrder - b.stageOrder);

            // Members joined over time (last 12 months)
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

            const joinedByMonth = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
                SELECT
                    TO_CHAR(DATE_TRUNC('month', "joinedDate"), 'YYYY-MM') as month,
                    COUNT(*)::int as count
                FROM "Member"
                WHERE "tenantId" = ${tenantId}
                    AND "joinedDate" >= ${twelveMonthsAgo}
                    ${pathway ? prisma.$queryRawUnsafe(`AND pathway = '${pathway}'`) : prisma.$queryRawUnsafe('')}
                GROUP BY DATE_TRUNC('month', "joinedDate")
                ORDER BY month
            `;

            // Member demographics
            const byGender = await prisma.member.groupBy({
                by: ['gender'],
                where,
                _count: { id: true },
            });

            const byMaritalStatus = await prisma.member.groupBy({
                by: ['maritalStatus'],
                where,
                _count: { id: true },
            });

            return {
                byStatus: byStatus.map((s) => ({
                    status: s.status,
                    count: s._count.id,
                })),
                byStage: byStageWithNames,
                joinedByMonth: joinedByMonth.map((m) => ({
                    month: m.month,
                    count: Number(m.count),
                })),
                demographics: {
                    byGender: byGender.map((g) => ({
                        gender: g.gender || 'Unknown',
                        count: g._count.id,
                    })),
                    byMaritalStatus: byMaritalStatus.map((m) => ({
                        status: m.maritalStatus || 'Unknown',
                        count: m._count.id,
                    })),
                },
            };
        } catch (error) {
            logger.error('Error fetching member analytics:', error);
            throw new AppError(500, 'ERROR', 'Failed to fetch member analytics');
        }
    }

    /**
     * Get task analytics
     */
    async getTaskAnalytics(tenantId: string) {
        try {
            // Tasks by status
            const total = await prisma.task.count({ where: { tenantId } });
            const completed = await prisma.task.count({
                where: { tenantId, completed: true },
            });
            const pending = await prisma.task.count({
                where: { tenantId, completed: false },
            });
            const overdue = await prisma.task.count({
                where: {
                    tenantId,
                    completed: false,
                    dueDate: { lt: new Date() },
                },
            });

            // Tasks by priority
            const byPriority = await prisma.task.groupBy({
                by: ['priority'],
                where: { tenantId, completed: false },
                _count: { id: true },
            });

            // Tasks by assignee
            const byAssignee = await prisma.task.groupBy({
                by: ['assignedToId'],
                where: { tenantId, completed: false },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            });

            // Get user details for assignees
            const userIds = byAssignee.map((a) => a.assignedToId);
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, firstName: true, lastName: true },
            });

            const byAssigneeWithNames = byAssignee.map((stat) => {
                const user = users.find((u) => u.id === stat.assignedToId);
                return {
                    userId: stat.assignedToId,
                    userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                    count: stat._count.id,
                };
            });

            // Completion rate over time (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const completedByDay = await prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
                SELECT
                    TO_CHAR(DATE_TRUNC('day', "completedAt"), 'YYYY-MM-DD') as day,
                    COUNT(*)::int as count
                FROM "Task"
                WHERE "tenantId" = ${tenantId}
                    AND "completed" = true
                    AND "completedAt" >= ${thirtyDaysAgo}
                GROUP BY DATE_TRUNC('day', "completedAt")
                ORDER BY day
            `;

            return {
                summary: {
                    total,
                    completed,
                    pending,
                    overdue,
                    completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0',
                },
                byPriority: byPriority.map((p) => ({
                    priority: p.priority,
                    count: p._count.id,
                })),
                byAssignee: byAssigneeWithNames,
                completedByDay: completedByDay.map((d) => ({
                    day: d.day,
                    count: Number(d.count),
                })),
            };
        } catch (error) {
            logger.error('Error fetching task analytics:', error);
            throw new AppError(500, 'ERROR', 'Failed to fetch task analytics');
        }
    }

    /**
     * Export data (prepare data for CSV/Excel export)
     */
    async exportData(tenantId: string, type: 'members' | 'tasks') {
        try {
            if (type === 'members') {
                const members = await prisma.member.findMany({
                    where: { tenantId },
                    include: {
                        currentStage: {
                            select: { name: true },
                        },
                        assignedTo: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                return members.map((m) => ({
                    'First Name': m.firstName,
                    'Last Name': m.lastName,
                    Email: m.email || '',
                    Phone: m.phone || '',
                    Pathway: m.pathway,
                    'Current Stage': m.currentStage.name,
                    Status: m.status,
                    'Assigned To': m.assignedTo
                        ? `${m.assignedTo.firstName} ${m.assignedTo.lastName}`
                        : '',
                    'Joined Date': m.joinedDate.toISOString().split('T')[0],
                }));
            } else {
                const tasks = await prisma.task.findMany({
                    where: { tenantId },
                    include: {
                        member: {
                            select: { firstName: true, lastName: true },
                        },
                        assignedTo: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                return tasks.map((t) => ({
                    Description: t.description,
                    Member: `${t.member.firstName} ${t.member.lastName}`,
                    'Assigned To': `${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
                    Priority: t.priority,
                    'Due Date': t.dueDate.toISOString().split('T')[0],
                    Completed: t.completed ? 'Yes' : 'No',
                    'Completed At': t.completedAt
                        ? t.completedAt.toISOString().split('T')[0]
                        : '',
                }));
            }
        } catch (error) {
            logger.error('Error exporting data:', error);
            throw new AppError(500, 'ERROR', 'Failed to export data');
        }
    }
}

export default new AnalyticsService();
