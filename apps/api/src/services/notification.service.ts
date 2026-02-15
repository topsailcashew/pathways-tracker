import prisma from '../config/database';
import logger from '../utils/logger';

export class NotificationService {
    async getNotifications(userId: string, tenantId: string, unreadOnly = false) {
        const where: any = { userId, tenantId };
        if (unreadOnly) where.read = false;

        return prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async getUnreadCount(userId: string, tenantId: string) {
        return prisma.notification.count({
            where: { userId, tenantId, read: false },
        });
    }

    async markAsRead(id: string, userId: string) {
        return prisma.notification.updateMany({
            where: { id, userId },
            data: { read: true },
        });
    }

    async markAllRead(userId: string, tenantId: string) {
        return prisma.notification.updateMany({
            where: { userId, tenantId, read: false },
            data: { read: true },
        });
    }

    async createNotification(data: {
        tenantId: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        data?: any;
    }) {
        const notification = await prisma.notification.create({ data });
        logger.info(`Notification created for user ${data.userId}: ${data.type}`);
        return notification;
    }

    async notifyServeTeamLeaders(params: {
        tenantId: string;
        teamId: string;
        memberName: string;
        memberId: string;
        teamName: string;
        referredBy: string;
    }) {
        const leaders = await prisma.teamMembership.findMany({
            where: {
                teamId: params.teamId,
                role: 'LEADER',
                user: { tenantId: params.tenantId },
            },
            select: { userId: true },
        });

        const notifications = await Promise.all(
            leaders.map((leader) =>
                this.createNotification({
                    tenantId: params.tenantId,
                    userId: leader.userId,
                    type: 'SERVE_TEAM_REFERRAL',
                    title: 'New Serve Team Referral',
                    message: `${params.memberName} has been referred to ${params.teamName}.`,
                    data: {
                        memberId: params.memberId,
                        teamId: params.teamId,
                        memberName: params.memberName,
                        teamName: params.teamName,
                        referredBy: params.referredBy,
                    },
                })
            )
        );

        logger.info(`Notified ${notifications.length} leader(s) about referral to team ${params.teamId}`);
        return notifications;
    }
}

export default new NotificationService();
