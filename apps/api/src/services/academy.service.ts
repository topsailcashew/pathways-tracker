import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { EnrollmentStatus, ModuleStatus, Prisma } from '@prisma/client';

export class AcademyService {
    // ========== TRACK CRUD ==========

    async createTrack(data: {
        tenantId: string;
        title: string;
        description?: string;
        imageUrl?: string;
    }) {
        try {
            const maxOrder = await prisma.academyTrack.aggregate({
                where: { tenantId: data.tenantId },
                _max: { order: true },
            });

            const track = await prisma.academyTrack.create({
                data: {
                    ...data,
                    order: (maxOrder._max.order ?? -1) + 1,
                },
                include: {
                    _count: { select: { modules: true, enrollments: true } },
                },
            });

            logger.info(`Academy track created: ${track.id}`);
            return track;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new AppError(409, 'DUPLICATE_TRACK', 'A track with this title already exists');
            }
            logger.error('Create track error:', error);
            throw error;
        }
    }

    async getTrackById(trackId: string, tenantId: string) {
        try {
            const track = await prisma.academyTrack.findFirst({
                where: { id: trackId, tenantId },
                include: {
                    modules: {
                        orderBy: { order: 'asc' },
                        include: {
                            quiz: {
                                include: { questions: { orderBy: { order: 'asc' } } },
                            },
                        },
                    },
                    _count: { select: { modules: true, enrollments: true } },
                },
            });

            if (!track) {
                throw new AppError(404, 'TRACK_NOT_FOUND', 'Track not found');
            }

            return track;
        } catch (error) {
            logger.error('Get track error:', error);
            throw error;
        }
    }

    async listTracks(tenantId: string, filters: {
        isPublished?: boolean;
        page?: number;
        limit?: number;
    }) {
        try {
            const page = filters.page || 1;
            const limit = Math.min(filters.limit || 50, 100);
            const skip = (page - 1) * limit;

            const where: Prisma.AcademyTrackWhereInput = {
                tenantId,
                ...(filters.isPublished !== undefined && { isPublished: filters.isPublished }),
            };

            const [tracks, total] = await Promise.all([
                prisma.academyTrack.findMany({
                    where,
                    include: {
                        _count: { select: { modules: true, enrollments: true } },
                    },
                    orderBy: { order: 'asc' },
                    skip,
                    take: limit,
                }),
                prisma.academyTrack.count({ where }),
            ]);

            return {
                tracks,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            };
        } catch (error) {
            logger.error('List tracks error:', error);
            throw error;
        }
    }

    async updateTrack(trackId: string, tenantId: string, data: {
        title?: string;
        description?: string;
        imageUrl?: string | null;
        isPublished?: boolean;
        order?: number;
    }) {
        try {
            const existing = await prisma.academyTrack.findFirst({
                where: { id: trackId, tenantId },
            });

            if (!existing) {
                throw new AppError(404, 'TRACK_NOT_FOUND', 'Track not found');
            }

            const track = await prisma.academyTrack.update({
                where: { id: trackId },
                data,
                include: {
                    _count: { select: { modules: true, enrollments: true } },
                },
            });

            logger.info(`Academy track updated: ${trackId}`);
            return track;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new AppError(409, 'DUPLICATE_TRACK', 'A track with this title already exists');
            }
            logger.error('Update track error:', error);
            throw error;
        }
    }

    async deleteTrack(trackId: string, tenantId: string) {
        try {
            const existing = await prisma.academyTrack.findFirst({
                where: { id: trackId, tenantId },
            });

            if (!existing) {
                throw new AppError(404, 'TRACK_NOT_FOUND', 'Track not found');
            }

            await prisma.academyTrack.delete({ where: { id: trackId } });
            logger.info(`Academy track deleted: ${trackId}`);
        } catch (error) {
            logger.error('Delete track error:', error);
            throw error;
        }
    }

    // ========== MODULE CRUD ==========

    async createModule(data: {
        tenantId: string;
        trackId: string;
        title: string;
        description?: string;
        videoUrl: string;
        order: number;
        requiredModuleId?: string | null;
    }) {
        try {
            // Verify track exists and belongs to tenant
            const track = await prisma.academyTrack.findFirst({
                where: { id: data.trackId, tenantId: data.tenantId },
            });

            if (!track) {
                throw new AppError(404, 'TRACK_NOT_FOUND', 'Track not found');
            }

            if (data.requiredModuleId) {
                const prereq = await prisma.academyModule.findFirst({
                    where: { id: data.requiredModuleId, trackId: data.trackId },
                });
                if (!prereq) {
                    throw new AppError(404, 'PREREQUISITE_NOT_FOUND', 'Prerequisite module not found in this track');
                }
            }

            const module = await prisma.academyModule.create({
                data,
                include: {
                    quiz: true,
                    requiredModule: { select: { id: true, title: true } },
                },
            });

            logger.info(`Academy module created: ${module.id}`);
            return module;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new AppError(409, 'DUPLICATE_ORDER', 'A module with this order already exists in this track');
            }
            logger.error('Create module error:', error);
            throw error;
        }
    }

    async getModuleById(moduleId: string, tenantId: string) {
        try {
            const module = await prisma.academyModule.findFirst({
                where: { id: moduleId, tenantId },
                include: {
                    quiz: {
                        include: { questions: { orderBy: { order: 'asc' } } },
                    },
                    requiredModule: { select: { id: true, title: true } },
                    track: { select: { id: true, title: true } },
                },
            });

            if (!module) {
                throw new AppError(404, 'MODULE_NOT_FOUND', 'Module not found');
            }

            return module;
        } catch (error) {
            logger.error('Get module error:', error);
            throw error;
        }
    }

    async listModulesByTrack(trackId: string, tenantId: string) {
        try {
            return await prisma.academyModule.findMany({
                where: { trackId, tenantId },
                include: {
                    quiz: { select: { id: true, passingScore: true, _count: { select: { questions: true } } } },
                    requiredModule: { select: { id: true, title: true } },
                },
                orderBy: { order: 'asc' },
            });
        } catch (error) {
            logger.error('List modules error:', error);
            throw error;
        }
    }

    async updateModule(moduleId: string, tenantId: string, data: {
        title?: string;
        description?: string;
        videoUrl?: string;
        order?: number;
        status?: ModuleStatus;
        requiredModuleId?: string | null;
    }) {
        try {
            const existing = await prisma.academyModule.findFirst({
                where: { id: moduleId, tenantId },
            });

            if (!existing) {
                throw new AppError(404, 'MODULE_NOT_FOUND', 'Module not found');
            }

            if (data.requiredModuleId) {
                const prereq = await prisma.academyModule.findFirst({
                    where: { id: data.requiredModuleId, trackId: existing.trackId },
                });
                if (!prereq) {
                    throw new AppError(404, 'PREREQUISITE_NOT_FOUND', 'Prerequisite module not found in this track');
                }
                if (data.requiredModuleId === moduleId) {
                    throw new AppError(400, 'SELF_PREREQUISITE', 'A module cannot be its own prerequisite');
                }
            }

            const module = await prisma.academyModule.update({
                where: { id: moduleId },
                data,
                include: {
                    quiz: true,
                    requiredModule: { select: { id: true, title: true } },
                },
            });

            logger.info(`Academy module updated: ${moduleId}`);
            return module;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new AppError(409, 'DUPLICATE_ORDER', 'A module with this order already exists in this track');
            }
            logger.error('Update module error:', error);
            throw error;
        }
    }

    async deleteModule(moduleId: string, tenantId: string) {
        try {
            const existing = await prisma.academyModule.findFirst({
                where: { id: moduleId, tenantId },
            });

            if (!existing) {
                throw new AppError(404, 'MODULE_NOT_FOUND', 'Module not found');
            }

            await prisma.academyModule.delete({ where: { id: moduleId } });
            logger.info(`Academy module deleted: ${moduleId}`);
        } catch (error) {
            logger.error('Delete module error:', error);
            throw error;
        }
    }

    // ========== QUIZ CRUD ==========

    async upsertQuiz(moduleId: string, tenantId: string, data: {
        passingScore: number;
        questions: Array<{
            questionText: string;
            questionType?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
            options: Array<{ id: string; text: string }>;
            correctOptionId: string;
            order: number;
        }>;
    }) {
        try {
            const module = await prisma.academyModule.findFirst({
                where: { id: moduleId, tenantId },
            });

            if (!module) {
                throw new AppError(404, 'MODULE_NOT_FOUND', 'Module not found');
            }

            // Delete existing quiz if any, then create new one
            return await prisma.$transaction(async (tx) => {
                await tx.academyQuiz.deleteMany({ where: { moduleId } });

                const quiz = await tx.academyQuiz.create({
                    data: {
                        moduleId,
                        passingScore: data.passingScore,
                        questions: {
                            create: data.questions.map((q) => ({
                                questionText: q.questionText,
                                questionType: q.questionType || 'MULTIPLE_CHOICE',
                                options: q.options as any,
                                correctOptionId: q.correctOptionId,
                                order: q.order,
                            })),
                        },
                    },
                    include: {
                        questions: { orderBy: { order: 'asc' } },
                    },
                });

                logger.info(`Academy quiz upserted for module: ${moduleId}`);
                return quiz;
            });
        } catch (error) {
            logger.error('Upsert quiz error:', error);
            throw error;
        }
    }

    async getQuizByModule(moduleId: string, tenantId: string, includeAnswers: boolean = false) {
        try {
            const module = await prisma.academyModule.findFirst({
                where: { id: moduleId, tenantId },
            });

            if (!module) {
                throw new AppError(404, 'MODULE_NOT_FOUND', 'Module not found');
            }

            const quiz = await prisma.academyQuiz.findUnique({
                where: { moduleId },
                include: {
                    questions: { orderBy: { order: 'asc' } },
                },
            });

            if (!quiz) {
                throw new AppError(404, 'QUIZ_NOT_FOUND', 'Quiz not found for this module');
            }

            // Strip correct answers for non-admin users
            if (!includeAnswers) {
                return {
                    ...quiz,
                    questions: quiz.questions.map(({ correctOptionId, ...q }) => q),
                };
            }

            return quiz;
        } catch (error) {
            logger.error('Get quiz error:', error);
            throw error;
        }
    }

    // ========== ENROLLMENT & PROGRESS ==========

    async enrollUser(tenantId: string, userId: string, trackId: string) {
        try {
            // Verify track exists, is published, and belongs to tenant
            const track = await prisma.academyTrack.findFirst({
                where: { id: trackId, tenantId, isPublished: true },
                include: {
                    modules: {
                        where: { status: 'PUBLISHED' },
                        orderBy: { order: 'asc' },
                    },
                },
            });

            if (!track) {
                throw new AppError(404, 'TRACK_NOT_FOUND', 'Published track not found');
            }

            if (track.modules.length === 0) {
                throw new AppError(400, 'NO_MODULES', 'Track has no published modules');
            }

            // Check if already enrolled
            const existing = await prisma.academyEnrollment.findUnique({
                where: { userId_trackId: { userId, trackId } },
            });

            if (existing) {
                throw new AppError(409, 'ALREADY_ENROLLED', 'User is already enrolled in this track');
            }

            // Find the first module (one with no prerequisite, or lowest order)
            const firstModule = track.modules.find(m => !m.requiredModuleId) || track.modules[0];

            return await prisma.$transaction(async (tx) => {
                const enrollment = await tx.academyEnrollment.create({
                    data: { tenantId, userId, trackId },
                });

                // Create progress records for all published modules
                await tx.academyModuleProgress.createMany({
                    data: track.modules.map((m) => ({
                        tenantId,
                        userId,
                        moduleId: m.id,
                        status: m.id === firstModule.id ? 'STARTED' as EnrollmentStatus : 'LOCKED' as EnrollmentStatus,
                        startedAt: m.id === firstModule.id ? new Date() : null,
                    })),
                });

                logger.info(`User ${userId} enrolled in track ${trackId}`);
                return enrollment;
            });
        } catch (error) {
            logger.error('Enroll user error:', error);
            throw error;
        }
    }

    async getMyProgress(tenantId: string, userId: string) {
        try {
            const enrollments = await prisma.academyEnrollment.findMany({
                where: { tenantId, userId },
                include: {
                    track: {
                        include: {
                            _count: { select: { modules: true } },
                        },
                    },
                },
                orderBy: { enrolledAt: 'desc' },
            });

            const progress = await prisma.academyModuleProgress.findMany({
                where: { tenantId, userId },
                include: {
                    module: {
                        select: {
                            id: true,
                            title: true,
                            trackId: true,
                            order: true,
                            videoUrl: true,
                            description: true,
                            requiredModuleId: true,
                        },
                    },
                },
                orderBy: { module: { order: 'asc' } },
            });

            return { enrollments, progress };
        } catch (error) {
            logger.error('Get progress error:', error);
            throw error;
        }
    }

    async getNextStep(tenantId: string, userId: string) {
        try {
            // Find first in-progress module
            const nextProgress = await prisma.academyModuleProgress.findFirst({
                where: { tenantId, userId, status: 'STARTED' },
                include: {
                    module: {
                        include: {
                            track: { select: { id: true, title: true } },
                            quiz: {
                                include: { questions: { orderBy: { order: 'asc' } } },
                            },
                        },
                    },
                },
                orderBy: { module: { order: 'asc' } },
            });

            if (!nextProgress) {
                return null;
            }

            // Strip correct answers from quiz
            if (nextProgress.module.quiz) {
                (nextProgress.module.quiz as any).questions = nextProgress.module.quiz.questions.map(
                    ({ correctOptionId, ...q }) => q
                );
            }

            return nextProgress;
        } catch (error) {
            logger.error('Get next step error:', error);
            throw error;
        }
    }

    async markVideoWatched(tenantId: string, userId: string, moduleId: string) {
        try {
            const progress = await prisma.academyModuleProgress.findUnique({
                where: { userId_moduleId: { userId, moduleId } },
            });

            if (!progress) {
                throw new AppError(404, 'PROGRESS_NOT_FOUND', 'Progress record not found');
            }

            if (progress.tenantId !== tenantId) {
                throw new AppError(403, 'FORBIDDEN', 'Access denied');
            }

            if (progress.status !== 'STARTED') {
                throw new AppError(400, 'INVALID_STATE', 'Module is not in progress');
            }

            await prisma.academyModuleProgress.update({
                where: { userId_moduleId: { userId, moduleId } },
                data: { videoWatched: true },
            });

            logger.info(`Video watched: user ${userId}, module ${moduleId}`);
        } catch (error) {
            logger.error('Mark video watched error:', error);
            throw error;
        }
    }

    async submitQuiz(tenantId: string, userId: string, moduleId: string, answers: Array<{
        questionId: string;
        selectedOptionId: string;
    }>) {
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Verify progress exists, is STARTED, and video is watched
                const progress = await tx.academyModuleProgress.findUnique({
                    where: { userId_moduleId: { userId, moduleId } },
                });

                if (!progress || progress.tenantId !== tenantId) {
                    throw new AppError(404, 'PROGRESS_NOT_FOUND', 'Progress record not found');
                }

                if (progress.status !== 'STARTED') {
                    throw new AppError(400, 'INVALID_STATE', 'Module is not in progress');
                }

                if (!progress.videoWatched) {
                    throw new AppError(400, 'VIDEO_NOT_WATCHED', 'Must watch the video before taking the quiz');
                }

                // 2. Get quiz and questions
                const quiz = await tx.academyQuiz.findUnique({
                    where: { moduleId },
                    include: { questions: { orderBy: { order: 'asc' } } },
                });

                if (!quiz) {
                    throw new AppError(404, 'QUIZ_NOT_FOUND', 'Quiz not found');
                }

                // 3. Grade
                let correctCount = 0;
                for (const question of quiz.questions) {
                    const answer = answers.find(a => a.questionId === question.id);
                    if (answer && answer.selectedOptionId === question.correctOptionId) {
                        correctCount++;
                    }
                }

                const score = Math.round((correctCount / quiz.questions.length) * 100);
                const passed = score >= quiz.passingScore;

                // 4. Update progress
                const updateData: Prisma.AcademyModuleProgressUpdateInput = {
                    quizScore: score,
                    attempts: { increment: 1 },
                };

                if (passed) {
                    updateData.quizPassed = true;
                    updateData.status = 'COMPLETED';
                    updateData.completedAt = new Date();
                }

                await tx.academyModuleProgress.update({
                    where: { userId_moduleId: { userId, moduleId } },
                    data: updateData,
                });

                let trackCompleted = false;

                // 5. If passed, unlock next module and check track completion
                if (passed) {
                    const module = await tx.academyModule.findUnique({ where: { id: moduleId } });

                    // Unlock dependent module
                    const nextModule = await tx.academyModule.findFirst({
                        where: { trackId: module!.trackId, requiredModuleId: moduleId, status: 'PUBLISHED' },
                    });

                    if (nextModule) {
                        const nextProgress = await tx.academyModuleProgress.findUnique({
                            where: { userId_moduleId: { userId, moduleId: nextModule.id } },
                        });
                        if (nextProgress && nextProgress.status === 'LOCKED') {
                            await tx.academyModuleProgress.update({
                                where: { userId_moduleId: { userId, moduleId: nextModule.id } },
                                data: { status: 'STARTED', startedAt: new Date() },
                            });
                        }
                    }

                    // Check track completion
                    const allModules = await tx.academyModule.findMany({
                        where: { trackId: module!.trackId, status: 'PUBLISHED' },
                    });

                    const completedCount = await tx.academyModuleProgress.count({
                        where: {
                            userId,
                            moduleId: { in: allModules.map(m => m.id) },
                            status: 'COMPLETED',
                        },
                    });

                    trackCompleted = completedCount === allModules.length;

                    if (trackCompleted) {
                        await tx.academyEnrollment.update({
                            where: { userId_trackId: { userId, trackId: module!.trackId } },
                            data: { completedAt: new Date() },
                        });

                        // Create audit log
                        await tx.auditLog.create({
                            data: {
                                tenantId,
                                userId,
                                action: 'ACADEMY_TRACK_COMPLETE',
                                entityType: 'AcademyTrack',
                                entityId: module!.trackId,
                                newValues: { completedAt: new Date().toISOString() },
                            },
                        });

                        logger.info(`User ${userId} completed track ${module!.trackId}`);
                    }
                }

                return {
                    score,
                    passed,
                    correctCount,
                    totalQuestions: quiz.questions.length,
                    trackCompleted,
                };
            });
        } catch (error) {
            logger.error('Submit quiz error:', error);
            throw error;
        }
    }

    // ========== ADMIN ANALYTICS ==========

    async getTrackProgressStats(tenantId: string, trackId: string) {
        try {
            const track = await prisma.academyTrack.findFirst({
                where: { id: trackId, tenantId },
                include: {
                    modules: {
                        where: { status: 'PUBLISHED' },
                        orderBy: { order: 'asc' },
                        select: { id: true, title: true, order: true },
                    },
                },
            });

            if (!track) {
                throw new AppError(404, 'TRACK_NOT_FOUND', 'Track not found');
            }

            const [totalEnrolled, completedCount] = await Promise.all([
                prisma.academyEnrollment.count({ where: { tenantId, trackId } }),
                prisma.academyEnrollment.count({ where: { tenantId, trackId, completedAt: { not: null } } }),
            ]);

            // Get per-module breakdown
            const moduleBreakdown = await Promise.all(
                track.modules.map(async (m) => {
                    const [stuckCount, moduleCompletedCount] = await Promise.all([
                        prisma.academyModuleProgress.count({
                            where: { tenantId, moduleId: m.id, status: 'STARTED' },
                        }),
                        prisma.academyModuleProgress.count({
                            where: { tenantId, moduleId: m.id, status: 'COMPLETED' },
                        }),
                    ]);

                    return {
                        moduleId: m.id,
                        moduleTitle: m.title,
                        order: m.order,
                        stuckCount,
                        completedCount: moduleCompletedCount,
                    };
                })
            );

            return {
                trackId,
                trackTitle: track.title,
                totalEnrolled,
                completedCount,
                moduleBreakdown,
            };
        } catch (error) {
            logger.error('Get track progress stats error:', error);
            throw error;
        }
    }

    async getAllProgressStats(tenantId: string) {
        try {
            const tracks = await prisma.academyTrack.findMany({
                where: { tenantId },
                orderBy: { order: 'asc' },
                select: { id: true, title: true },
            });

            const [totalEnrolled, totalCompleted, readyForScheduling] = await Promise.all([
                prisma.academyEnrollment.count({ where: { tenantId } }),
                prisma.academyEnrollment.count({ where: { tenantId, completedAt: { not: null } } }),
                prisma.academyEnrollment.groupBy({
                    by: ['userId'],
                    where: { tenantId, completedAt: { not: null } },
                }).then(r => r.length),
            ]);

            const trackBreakdown = await Promise.all(
                tracks.map(async (t) => {
                    const [enrolled, completed] = await Promise.all([
                        prisma.academyEnrollment.count({ where: { tenantId, trackId: t.id } }),
                        prisma.academyEnrollment.count({ where: { tenantId, trackId: t.id, completedAt: { not: null } } }),
                    ]);
                    return {
                        trackId: t.id,
                        trackTitle: t.title,
                        enrolled,
                        completed,
                    };
                })
            );

            return {
                totalTracks: tracks.length,
                totalEnrolled,
                totalCompleted,
                readyForScheduling,
                trackBreakdown,
            };
        } catch (error) {
            logger.error('Get all progress stats error:', error);
            throw error;
        }
    }

    async getUserProgressDetail(tenantId: string, userId: string) {
        try {
            const enrollments = await prisma.academyEnrollment.findMany({
                where: { tenantId, userId },
                include: {
                    track: { select: { id: true, title: true } },
                },
            });

            const progress = await prisma.academyModuleProgress.findMany({
                where: { tenantId, userId },
                include: {
                    module: {
                        select: { id: true, title: true, trackId: true, order: true },
                    },
                },
                orderBy: { module: { order: 'asc' } },
            });

            return { enrollments, progress };
        } catch (error) {
            logger.error('Get user progress detail error:', error);
            throw error;
        }
    }

    // ========== HUDDLE COMMENTS ==========

    async addHuddleComment(tenantId: string, userId: string, moduleId: string, content: string) {
        try {
            const module = await prisma.academyModule.findFirst({
                where: { id: moduleId, tenantId },
            });

            if (!module) {
                throw new AppError(404, 'MODULE_NOT_FOUND', 'Module not found');
            }

            const comment = await prisma.academyHuddleComment.create({
                data: { tenantId, userId, moduleId, content },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                },
            });

            logger.info(`Huddle comment added: ${comment.id}`);
            return comment;
        } catch (error) {
            logger.error('Add huddle comment error:', error);
            throw error;
        }
    }

    async getHuddleComments(tenantId: string, moduleId: string, filters: {
        page?: number;
        limit?: number;
    }) {
        try {
            const page = filters.page || 1;
            const limit = Math.min(filters.limit || 20, 50);
            const skip = (page - 1) * limit;

            const [comments, total] = await Promise.all([
                prisma.academyHuddleComment.findMany({
                    where: { tenantId, moduleId },
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.academyHuddleComment.count({ where: { tenantId, moduleId } }),
            ]);

            return {
                comments,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            };
        } catch (error) {
            logger.error('Get huddle comments error:', error);
            throw error;
        }
    }

    async deleteHuddleComment(commentId: string, tenantId: string, userId: string, userRole: string) {
        try {
            const comment = await prisma.academyHuddleComment.findFirst({
                where: { id: commentId, tenantId },
            });

            if (!comment) {
                throw new AppError(404, 'COMMENT_NOT_FOUND', 'Comment not found');
            }

            // Only allow delete if owner or admin
            if (comment.userId !== userId && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
                throw new AppError(403, 'FORBIDDEN', 'You can only delete your own comments');
            }

            await prisma.academyHuddleComment.delete({ where: { id: commentId } });
            logger.info(`Huddle comment deleted: ${commentId}`);
        } catch (error) {
            logger.error('Delete huddle comment error:', error);
            throw error;
        }
    }
}

export default new AcademyService();
