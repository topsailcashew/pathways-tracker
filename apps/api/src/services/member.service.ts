import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { Pathway, MemberStatus, Prisma } from '@prisma/client';

interface CreateMemberData {
    tenantId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    pathway: Pathway;
    currentStageId: string;
    assignedToId?: string;
    createdById: string;
    dateOfBirth?: Date;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
}

interface UpdateMemberData {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    maritalStatus?: string;
    assignedToId?: string;
}

export class MemberService {
    // Create member
    async createMember(data: CreateMemberData) {
        try {
            // Check if email already exists in tenant
            if (data.email) {
                const existing = await prisma.member.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        email: data.email.toLowerCase(),
                    },
                });

                if (existing) {
                    throw new AppError(409, 'EMAIL_EXISTS', 'Member with this email already exists');
                }
            }

            // Verify stage exists and belongs to correct pathway
            const stage = await prisma.stage.findFirst({
                where: {
                    id: data.currentStageId,
                    tenantId: data.tenantId,
                    pathway: data.pathway,
                },
            });

            if (!stage) {
                throw new AppError(404, 'STAGE_NOT_FOUND', 'Invalid stage for this pathway');
            }

            // Create member
            const member = await prisma.member.create({
                data: {
                    tenantId: data.tenantId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email?.toLowerCase() || null,
                    phone: data.phone || null,
                    pathway: data.pathway,
                    currentStageId: data.currentStageId,
                    assignedToId: data.assignedToId || null,
                    createdById: data.createdById,
                    dateOfBirth: data.dateOfBirth || null,
                    gender: (data.gender as any) || null,
                    address: data.address || null,
                    city: data.city || null,
                    state: data.state || null,
                    zip: data.zip || null,
                    photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        data.firstName + ' ' + data.lastName
                    )}&background=random`,
                },
                include: {
                    currentStage: true,
                    assignedTo: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });

            // Create initial note
            await prisma.note.create({
                data: {
                    memberId: member.id,
                    content: `[System] Member added to ${data.pathway} pathway`,
                    isSystem: true,
                    createdById: data.createdById,
                },
            });

            // Update tenant member count
            await prisma.tenant.update({
                where: { id: data.tenantId },
                data: { memberCount: { increment: 1 } },
            });

            logger.info(`Member created: ${member.id}`);

            return member;
        } catch (error) {
            logger.error('Create member error:', error);
            throw error;
        }
    }

    // Get member by ID
    async getMemberById(memberId: string, tenantId: string) {
        try {
            const member = await prisma.member.findFirst({
                where: {
                    id: memberId,
                    tenantId,
                },
                include: {
                    currentStage: true,
                    assignedTo: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true,
                        },
                    },
                    family: {
                        include: {
                            members: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    familyRole: true,
                                },
                            },
                        },
                    },
                    notes: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                        include: {
                            createdBy: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                    tags: true,
                    resources: true,
                    tasks: {
                        where: { completed: false },
                        orderBy: { dueDate: 'asc' },
                    },
                },
            });

            if (!member) {
                throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found');
            }

            return member;
        } catch (error) {
            logger.error('Get member error:', error);
            throw error;
        }
    }

    // List members with filters
    async listMembers(
        tenantId: string,
        filters: {
            pathway?: Pathway;
            status?: MemberStatus;
            stageId?: string;
            assignedToId?: string;
            search?: string;
            page?: number;
            limit?: number;
        }
    ) {
        try {
            const page = filters.page || 1;
            const limit = Math.min(filters.limit || 50, 100);
            const skip = (page - 1) * limit;

            const where: Prisma.MemberWhereInput = {
                tenantId,
                ...(filters.pathway && { pathway: filters.pathway }),
                ...(filters.status && { status: filters.status }),
                ...(filters.stageId && { currentStageId: filters.stageId }),
                ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
                ...(filters.search && {
                    OR: [
                        { firstName: { contains: filters.search, mode: 'insensitive' } },
                        { lastName: { contains: filters.search, mode: 'insensitive' } },
                        { email: { contains: filters.search, mode: 'insensitive' } },
                        { phone: { contains: filters.search, mode: 'insensitive' } },
                    ],
                }),
            };

            const [members, total] = await Promise.all([
                prisma.member.findMany({
                    where,
                    include: {
                        currentStage: true,
                        assignedTo: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.member.count({ where }),
            ]);

            return {
                members,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('List members error:', error);
            throw error;
        }
    }

    // Update member
    async updateMember(memberId: string, tenantId: string, data: UpdateMemberData) {
        try {
            // Check if member exists
            const existing = await prisma.member.findFirst({
                where: { id: memberId, tenantId },
            });

            if (!existing) {
                throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found');
            }

            // Check email uniqueness if updating email
            if (data.email && data.email !== existing.email) {
                const emailExists = await prisma.member.findFirst({
                    where: {
                        tenantId,
                        email: data.email.toLowerCase(),
                        id: { not: memberId },
                    },
                });

                if (emailExists) {
                    throw new AppError(409, 'EMAIL_EXISTS', 'Email already in use');
                }
            }

            // Update member
            const updateData: any = {};
            if (data.firstName !== undefined) updateData.firstName = data.firstName;
            if (data.lastName !== undefined) updateData.lastName = data.lastName;
            if (data.email !== undefined) updateData.email = data.email.toLowerCase();
            if (data.phone !== undefined) updateData.phone = data.phone;
            if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
            if (data.gender !== undefined) updateData.gender = data.gender;
            if (data.address !== undefined) updateData.address = data.address;
            if (data.city !== undefined) updateData.city = data.city;
            if (data.state !== undefined) updateData.state = data.state;
            if (data.zip !== undefined) updateData.zip = data.zip;
            if (data.maritalStatus !== undefined) updateData.maritalStatus = data.maritalStatus;
            if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;

            const member = await prisma.member.update({
                where: { id: memberId },
                data: updateData,
                include: {
                    currentStage: true,
                    assignedTo: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            logger.info(`Member updated: ${memberId}`);

            return member;
        } catch (error) {
            logger.error('Update member error:', error);
            throw error;
        }
    }

    // Advance member to new stage
    async advanceStage(
        memberId: string,
        toStageId: string,
        tenantId: string,
        userId: string,
        reason?: string
    ) {
        try {
            return await prisma.$transaction(async (tx) => {
                // Get member and current stage
                const member = await tx.member.findFirst({
                    where: { id: memberId, tenantId },
                    include: { currentStage: true },
                });

                if (!member) {
                    throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found');
                }

                // Verify new stage exists and belongs to same pathway
                const newStage = await tx.stage.findFirst({
                    where: {
                        id: toStageId,
                        tenantId,
                        pathway: member.pathway,
                    },
                });

                if (!newStage) {
                    throw new AppError(404, 'STAGE_NOT_FOUND', 'Invalid stage');
                }

                // Create stage history
                await tx.stageHistory.create({
                    data: {
                        memberId,
                        fromStageId: member.currentStageId,
                        toStageId,
                        changedBy: userId,
                        reason: reason || 'Manual advance',
                    },
                });

                // Update member
                const updatedMember = await tx.member.update({
                    where: { id: memberId },
                    data: {
                        currentStageId: toStageId,
                        lastStageChangeDate: new Date(),
                    },
                    include: {
                        currentStage: true,
                    },
                });

                // Create system note
                await tx.note.create({
                    data: {
                        memberId,
                        content: `[System] Advanced from "${member.currentStage.name}" to "${newStage.name}"`,
                        isSystem: true,
                        createdById: userId,
                    },
                });

                // Check automation rules for new stage
                const rules = await tx.automationRule.findMany({
                    where: {
                        stageId: toStageId,
                        enabled: true,
                    },
                });

                const createdTasks = [];
                for (const rule of rules) {
                    const task = await tx.task.create({
                        data: {
                            tenantId,
                            memberId,
                            description: rule.taskDescription,
                            dueDate: new Date(Date.now() + rule.daysDue * 24 * 60 * 60 * 1000),
                            priority: rule.priority,
                            assignedToId: member.assignedToId || userId,
                            createdById: userId,
                            createdByRule: true,
                            automationRuleId: rule.id,
                        },
                    });

                    createdTasks.push(task);

                    await tx.note.create({
                        data: {
                            memberId,
                            content: `[System] Auto-created task: ${rule.taskDescription}`,
                            isSystem: true,
                        },
                    });
                }

                logger.info(`Member ${memberId} advanced to stage ${toStageId}`);

                return { member: updatedMember, createdTasks };
            });
        } catch (error) {
            logger.error('Advance stage error:', error);
            throw error;
        }
    }

    // Delete member
    async deleteMember(memberId: string, tenantId: string) {
        try {
            const member = await prisma.member.findFirst({
                where: { id: memberId, tenantId },
            });

            if (!member) {
                throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found');
            }

            await prisma.member.delete({
                where: { id: memberId },
            });

            // Update tenant member count
            await prisma.tenant.update({
                where: { id: tenantId },
                data: { memberCount: { decrement: 1 } },
            });

            logger.info(`Member deleted: ${memberId}`);
        } catch (error) {
            logger.error('Delete member error:', error);
            throw error;
        }
    }

    // Add note to member
    async addNote(memberId: string, tenantId: string, content: string, userId: string) {
        try {
            const member = await prisma.member.findFirst({
                where: { id: memberId, tenantId },
            });

            if (!member) {
                throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found');
            }

            const note = await prisma.note.create({
                data: {
                    memberId,
                    content,
                    createdById: userId,
                },
                include: {
                    createdBy: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            return note;
        } catch (error) {
            logger.error('Add note error:', error);
            throw error;
        }
    }

    // Add tag to member
    async addTag(memberId: string, tenantId: string, tag: string) {
        try {
            const member = await prisma.member.findFirst({
                where: { id: memberId, tenantId },
            });

            if (!member) {
                throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found');
            }

            const memberTag = await prisma.memberTag.create({
                data: {
                    memberId,
                    tag,
                },
            });

            return memberTag;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new AppError(409, 'TAG_EXISTS', 'Tag already exists for this member');
            }
            logger.error('Add tag error:', error);
            throw error;
        }
    }

    // Remove tag from member
    async removeTag(memberId: string, tenantId: string, tagId: string) {
        try {
            const tag = await prisma.memberTag.findFirst({
                where: {
                    id: tagId,
                    member: {
                        id: memberId,
                        tenantId,
                    },
                },
            });

            if (!tag) {
                throw new AppError(404, 'TAG_NOT_FOUND', 'Tag not found');
            }

            await prisma.memberTag.delete({
                where: { id: tagId },
            });
        } catch (error) {
            logger.error('Remove tag error:', error);
            throw error;
        }
    }
}

export default new MemberService();
