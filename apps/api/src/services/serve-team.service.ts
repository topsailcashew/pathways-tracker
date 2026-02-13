import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import serveTeamRbac from './serve-team-rbac.service';
import { Prisma, TeamApplicationStatus, TeamMemberRole } from '@prisma/client';

export class ServeTeamService {
    // ========== TEAM CRUD ==========

    async createTeam(data: {
        tenantId: string;
        name: string;
        description?: string;
        teamImage?: string;
        requiredTrackId?: string;
    }) {
        try {
            const team = await prisma.serveTeam.create({
                data,
                include: {
                    requiredTrack: { select: { id: true, title: true } },
                    _count: { select: { memberships: true, resources: true, events: true } },
                },
            });

            logger.info(`Serve team created: ${team.id}`);
            return team;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new AppError(409, 'DUPLICATE_TEAM', 'A team with this name already exists');
            }
            logger.error('Create team error:', error);
            throw error;
        }
    }

    async getTeamById(teamId: string, tenantId: string) {
        const team = await prisma.serveTeam.findFirst({
            where: { id: teamId, tenantId },
            include: {
                requiredTrack: { select: { id: true, title: true } },
                memberships: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
                    },
                    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
                },
                _count: { select: { memberships: true, resources: true, events: true, applications: true } },
            },
        });

        if (!team) {
            throw new AppError(404, 'TEAM_NOT_FOUND', 'Serve team not found');
        }

        return team;
    }

    async listTeams(tenantId: string, filters: {
        isActive?: boolean;
        page?: number;
        limit?: number;
    }) {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 50, 100);
        const skip = (page - 1) * limit;

        const where: Prisma.ServeTeamWhereInput = {
            tenantId,
            ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        };

        const [teams, total] = await Promise.all([
            prisma.serveTeam.findMany({
                where,
                include: {
                    requiredTrack: { select: { id: true, title: true } },
                    _count: { select: { memberships: true, resources: true, events: true } },
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            prisma.serveTeam.count({ where }),
        ]);

        return {
            teams,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async updateTeam(teamId: string, tenantId: string, data: {
        name?: string;
        description?: string;
        teamImage?: string | null;
        requiredTrackId?: string | null;
        isActive?: boolean;
    }) {
        const existing = await prisma.serveTeam.findFirst({
            where: { id: teamId, tenantId },
        });

        if (!existing) {
            throw new AppError(404, 'TEAM_NOT_FOUND', 'Serve team not found');
        }

        try {
            const team = await prisma.serveTeam.update({
                where: { id: teamId },
                data,
                include: {
                    requiredTrack: { select: { id: true, title: true } },
                    _count: { select: { memberships: true, resources: true, events: true } },
                },
            });

            logger.info(`Serve team updated: ${teamId}`);
            return team;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new AppError(409, 'DUPLICATE_TEAM', 'A team with this name already exists');
            }
            throw error;
        }
    }

    async deleteTeam(teamId: string, tenantId: string) {
        const existing = await prisma.serveTeam.findFirst({
            where: { id: teamId, tenantId },
        });

        if (!existing) {
            throw new AppError(404, 'TEAM_NOT_FOUND', 'Serve team not found');
        }

        await prisma.serveTeam.delete({ where: { id: teamId } });
        logger.info(`Serve team deleted: ${teamId}`);
    }

    // ========== APPLICATIONS ==========

    async applyToTeam(tenantId: string, userId: string, teamId: string, message?: string) {
        const team = await prisma.serveTeam.findFirst({
            where: { id: teamId, tenantId, isActive: true },
        });

        if (!team) {
            throw new AppError(404, 'TEAM_NOT_FOUND', 'Serve team not found or inactive');
        }

        // Check academy eligibility
        const eligible = await serveTeamRbac.checkAcademyEligibility(userId, team.requiredTrackId);
        if (!eligible) {
            throw new AppError(
                403,
                'TRACK_NOT_COMPLETED',
                'You must complete the required Academy track before applying to this team'
            );
        }

        // Check if already a member
        const existingMembership = await prisma.teamMembership.findUnique({
            where: { teamId_userId: { teamId, userId } },
        });
        if (existingMembership) {
            throw new AppError(409, 'ALREADY_MEMBER', 'You are already a member of this team');
        }

        // Check for existing pending application
        const existingApp = await prisma.teamApplication.findUnique({
            where: { teamId_userId: { teamId, userId } },
        });
        if (existingApp && existingApp.status === 'PENDING') {
            throw new AppError(409, 'ALREADY_APPLIED', 'You already have a pending application');
        }

        // Upsert application (allows re-applying after rejection)
        const application = await prisma.teamApplication.upsert({
            where: { teamId_userId: { teamId, userId } },
            update: { status: 'PENDING', message, reviewedBy: null, reviewedAt: null },
            create: { tenantId, teamId, userId, message },
            include: {
                team: { select: { id: true, name: true } },
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        logger.info(`Application submitted: user ${userId} -> team ${teamId}`);
        return application;
    }

    async reviewApplication(
        applicationId: string,
        tenantId: string,
        reviewerId: string,
        reviewerOrgRole: string,
        decision: 'APPROVED' | 'REJECTED'
    ) {
        const application = await prisma.teamApplication.findFirst({
            where: { id: applicationId, tenantId, status: 'PENDING' },
        });

        if (!application) {
            throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Pending application not found');
        }

        // Verify reviewer is a team leader or org admin
        await serveTeamRbac.requireTeamPermission(
            application.teamId,
            reviewerId,
            reviewerOrgRole,
            'MANAGE_ROSTER'
        );

        return await prisma.$transaction(async (tx) => {
            const updated = await tx.teamApplication.update({
                where: { id: applicationId },
                data: {
                    status: decision,
                    reviewedBy: reviewerId,
                    reviewedAt: new Date(),
                },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, email: true } },
                    team: { select: { id: true, name: true } },
                },
            });

            // If approved, create membership
            if (decision === 'APPROVED') {
                await tx.teamMembership.create({
                    data: {
                        tenantId,
                        teamId: application.teamId,
                        userId: application.userId,
                        role: 'MEMBER',
                    },
                });
            }

            // Audit log
            await tx.auditLog.create({
                data: {
                    tenantId,
                    userId: reviewerId,
                    action: 'TEAM_APPLICATION_REVIEW',
                    entityType: 'TeamApplication',
                    entityId: applicationId,
                    newValues: { decision, applicantId: application.userId },
                },
            });

            logger.info(`Application ${applicationId} ${decision} by ${reviewerId}`);
            return updated;
        });
    }

    async listApplications(teamId: string, tenantId: string, status?: TeamApplicationStatus) {
        const where: Prisma.TeamApplicationWhereInput = {
            teamId,
            tenantId,
            ...(status && { status }),
        };

        return prisma.teamApplication.findMany({
            where,
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ========== ROSTER MANAGEMENT ==========

    async updateMemberRole(
        teamId: string,
        targetUserId: string,
        tenantId: string,
        actorUserId: string,
        actorOrgRole: string,
        newRole: TeamMemberRole
    ) {
        await serveTeamRbac.requireTeamPermission(teamId, actorUserId, actorOrgRole, 'MANAGE_ROSTER');

        const membership = await prisma.teamMembership.findUnique({
            where: { teamId_userId: { teamId, userId: targetUserId } },
        });

        if (!membership) {
            throw new AppError(404, 'MEMBERSHIP_NOT_FOUND', 'Team membership not found');
        }

        const updated = await prisma.teamMembership.update({
            where: { id: membership.id },
            data: { role: newRole },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
            },
        });

        await prisma.auditLog.create({
            data: {
                tenantId,
                userId: actorUserId,
                action: 'TEAM_MEMBER_ROLE_CHANGE',
                entityType: 'TeamMembership',
                entityId: membership.id,
                oldValues: { role: membership.role },
                newValues: { role: newRole },
            },
        });

        logger.info(`Team member ${targetUserId} role changed to ${newRole} in team ${teamId}`);
        return updated;
    }

    async removeFromRoster(
        teamId: string,
        targetUserId: string,
        tenantId: string,
        actorUserId: string,
        actorOrgRole: string
    ) {
        await serveTeamRbac.requireTeamPermission(teamId, actorUserId, actorOrgRole, 'MANAGE_ROSTER');

        const membership = await prisma.teamMembership.findUnique({
            where: { teamId_userId: { teamId, userId: targetUserId } },
        });

        if (!membership) {
            throw new AppError(404, 'MEMBERSHIP_NOT_FOUND', 'Team membership not found');
        }

        await prisma.teamMembership.delete({
            where: { id: membership.id },
        });

        logger.info(`User ${targetUserId} removed from team ${teamId} by ${actorUserId}`);
    }

    async getMyTeams(tenantId: string, userId: string) {
        const memberships = await prisma.teamMembership.findMany({
            where: { tenantId, userId },
            include: {
                team: {
                    include: {
                        _count: { select: { memberships: true, resources: true, events: true } },
                    },
                },
            },
            orderBy: { team: { name: 'asc' } },
        });

        return memberships;
    }

    // ========== TEAM RESOURCES ==========

    async addResource(
        teamId: string,
        tenantId: string,
        userId: string,
        orgRole: string,
        data: { title: string; description?: string; fileUrl: string; fileType: string }
    ) {
        // RBAC: only leaders / admins can POST resources
        await serveTeamRbac.requireTeamPermission(teamId, userId, orgRole, 'EDIT_RESOURCES');

        const team = await prisma.serveTeam.findFirst({
            where: { id: teamId, tenantId },
        });
        if (!team) {
            throw new AppError(404, 'TEAM_NOT_FOUND', 'Serve team not found');
        }

        const resource = await prisma.teamResource.create({
            data: {
                tenantId,
                teamId,
                title: data.title,
                description: data.description,
                fileUrl: data.fileUrl,
                fileType: data.fileType as any,
                uploadedById: userId,
            },
            include: {
                uploadedBy: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        logger.info(`Team resource added: ${resource.id} to team ${teamId}`);
        return resource;
    }

    async listResources(teamId: string, tenantId: string) {
        return prisma.teamResource.findMany({
            where: { teamId, tenantId },
            include: {
                uploadedBy: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteResource(
        resourceId: string,
        tenantId: string,
        userId: string,
        orgRole: string
    ) {
        const resource = await prisma.teamResource.findFirst({
            where: { id: resourceId, tenantId },
        });

        if (!resource) {
            throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Team resource not found');
        }

        // RBAC: only leaders / admins can DELETE resources
        await serveTeamRbac.requireTeamPermission(resource.teamId, userId, orgRole, 'DELETE_RESOURCES');

        await prisma.teamResource.delete({ where: { id: resourceId } });
        logger.info(`Team resource deleted: ${resourceId}`);
    }

    // ========== TEAM EVENTS ==========

    async createEvent(
        teamId: string,
        tenantId: string,
        userId: string,
        orgRole: string,
        data: {
            title: string;
            description?: string;
            location?: string;
            startTime: Date;
            endTime?: Date;
        }
    ) {
        await serveTeamRbac.requireTeamPermission(teamId, userId, orgRole, 'MANAGE_EVENTS');

        const team = await prisma.serveTeam.findFirst({
            where: { id: teamId, tenantId },
        });
        if (!team) {
            throw new AppError(404, 'TEAM_NOT_FOUND', 'Serve team not found');
        }

        const event = await prisma.teamEvent.create({
            data: {
                tenantId,
                teamId,
                title: data.title,
                description: data.description,
                location: data.location,
                startTime: data.startTime,
                endTime: data.endTime,
                createdById: userId,
            },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { attendance: true } },
            },
        });

        logger.info(`Team event created: ${event.id} for team ${teamId}`);
        return event;
    }

    async listEvents(teamId: string, tenantId: string, upcoming?: boolean) {
        const where: Prisma.TeamEventWhereInput = {
            teamId,
            tenantId,
            ...(upcoming && { startTime: { gte: new Date() } }),
        };

        return prisma.teamEvent.findMany({
            where,
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { attendance: true } },
            },
            orderBy: { startTime: upcoming ? 'asc' : 'desc' },
        });
    }

    async deleteEvent(
        eventId: string,
        tenantId: string,
        userId: string,
        orgRole: string
    ) {
        const event = await prisma.teamEvent.findFirst({
            where: { id: eventId, tenantId },
        });

        if (!event) {
            throw new AppError(404, 'EVENT_NOT_FOUND', 'Team event not found');
        }

        await serveTeamRbac.requireTeamPermission(event.teamId, userId, orgRole, 'MANAGE_EVENTS');

        await prisma.teamEvent.delete({ where: { id: eventId } });
        logger.info(`Team event deleted: ${eventId}`);
    }

    // ========== ATTENDANCE ==========

    async markAttendance(
        eventId: string,
        tenantId: string,
        markerUserId: string,
        markerOrgRole: string,
        records: Array<{ userId: string; present: boolean }>
    ) {
        const event = await prisma.teamEvent.findFirst({
            where: { id: eventId, tenantId },
        });

        if (!event) {
            throw new AppError(404, 'EVENT_NOT_FOUND', 'Team event not found');
        }

        await serveTeamRbac.requireTeamPermission(event.teamId, markerUserId, markerOrgRole, 'MARK_ATTENDANCE');

        const results = await prisma.$transaction(
            records.map((record) =>
                prisma.teamEventAttendance.upsert({
                    where: { eventId_userId: { eventId, userId: record.userId } },
                    update: { present: record.present, markedById: markerUserId },
                    create: {
                        eventId,
                        userId: record.userId,
                        present: record.present,
                        markedById: markerUserId,
                    },
                })
            )
        );

        logger.info(`Attendance marked for event ${eventId}: ${records.length} records`);
        return results;
    }

    async getAttendance(eventId: string, tenantId: string) {
        const event = await prisma.teamEvent.findFirst({
            where: { id: eventId, tenantId },
        });

        if (!event) {
            throw new AppError(404, 'EVENT_NOT_FOUND', 'Team event not found');
        }

        return prisma.teamEventAttendance.findMany({
            where: { eventId },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            },
            orderBy: { user: { firstName: 'asc' } },
        });
    }
}

export default new ServeTeamService();
