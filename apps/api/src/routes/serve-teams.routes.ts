import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import serveTeamService from '../services/serve-team.service';
import notificationService from '../services/notification.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/permissions.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ========== Validation Schemas ==========

const createTeamSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().optional(),
    teamImage: z.string().url().optional(),
    requiredTrackId: z.string().uuid().optional(),
});

const updateTeamSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional().nullable(),
    teamImage: z.string().url().optional().nullable(),
    requiredTrackId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional(),
});

const applySchema = z.object({
    message: z.string().max(1000).optional(),
});

const reviewApplicationSchema = z.object({
    decision: z.enum(['APPROVED', 'REJECTED']),
});

const updateMemberRoleSchema = z.object({
    role: z.enum(['LEADER', 'MEMBER', 'TRAINEE']),
});

const addRosterMemberSchema = z.object({
    userId: z.string().uuid(),
    role: z.enum(['LEADER', 'MEMBER', 'TRAINEE']).default('MEMBER'),
});

const addResourceSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(1000).optional(),
    fileUrl: z.string().url('Must be a valid URL'),
    fileType: z.enum(['PDF', 'VIDEO', 'LINK', 'DOC']),
});

const createEventSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional(),
    location: z.string().max(500).optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
});

const markAttendanceSchema = z.object({
    records: z.array(z.object({
        userId: z.string().uuid(),
        present: z.boolean(),
    })).min(1),
});

const listTeamsQuerySchema = z.object({
    isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const assignTrackSchema = z.object({
    trackId: z.string().uuid('Must be a valid track ID'),
});

const createTeamTrackSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
});

// ========== TEAM CRUD ==========

// GET /api/serve-teams - List all teams
router.get(
    '/',
    requirePermission(Permission.SERVE_TEAM_VIEW),
    validateQuery(listTeamsQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters: any = { ...req.query };

            // Non-admin users only see active teams
            if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
                filters.isActive = true;
            }

            const result = await serveTeamService.listTeams(req.user!.tenantId, filters);

            res.status(200).json({
                data: result.teams,
                pagination: result.pagination,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/serve-teams - Create team (Admin only)
router.post(
    '/',
    requirePermission(Permission.SERVE_TEAM_CREATE),
    validateBody(createTeamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const team = await serveTeamService.createTeam({
                ...req.body,
                tenantId: req.user!.tenantId,
            });

            res.status(201).json({
                data: team,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/serve-teams/my-teams - Get teams the current user belongs to
router.get(
    '/my-teams',
    requirePermission(Permission.SERVE_TEAM_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const memberships = await serveTeamService.getMyTeams(
                req.user!.tenantId,
                req.user!.userId
            );

            res.status(200).json({
                data: memberships,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/serve-teams/:teamId - Get team details
router.get(
    '/:teamId',
    requirePermission(Permission.SERVE_TEAM_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const team = await serveTeamService.getTeamById(
                req.params.teamId,
                req.user!.tenantId
            );

            res.status(200).json({
                data: team,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/serve-teams/:teamId - Update team (Admin only)
router.patch(
    '/:teamId',
    requirePermission(Permission.SERVE_TEAM_UPDATE),
    validateBody(updateTeamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const team = await serveTeamService.updateTeam(
                req.params.teamId,
                req.user!.tenantId,
                req.body
            );

            res.status(200).json({
                data: team,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/serve-teams/:teamId - Delete team (Admin only)
router.delete(
    '/:teamId',
    requirePermission(Permission.SERVE_TEAM_DELETE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await serveTeamService.deleteTeam(
                req.params.teamId,
                req.user!.tenantId
            );
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

// ========== APPLICATIONS ==========

// POST /api/serve-teams/:teamId/apply - Apply to join a team
router.post(
    '/:teamId/apply',
    requirePermission(Permission.SERVE_TEAM_APPLY),
    validateBody(applySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const application = await serveTeamService.applyToTeam(
                req.user!.tenantId,
                req.user!.userId,
                req.params.teamId,
                req.body.message
            );

            res.status(201).json({
                data: application,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/serve-teams/:teamId/applications - List applications (Leader/Admin)
router.get(
    '/:teamId/applications',
    requirePermission(Permission.SERVE_TEAM_MANAGE_ROSTER),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const status = req.query.status as string | undefined;
            const applications = await serveTeamService.listApplications(
                req.params.teamId,
                req.user!.tenantId,
                status as any
            );

            res.status(200).json({
                data: applications,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/serve-teams/applications/:applicationId/review - Review application
router.patch(
    '/applications/:applicationId/review',
    requirePermission(Permission.SERVE_TEAM_MANAGE_ROSTER),
    validateBody(reviewApplicationSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await serveTeamService.reviewApplication(
                req.params.applicationId,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role,
                req.body.decision
            );

            res.status(200).json({
                data: result,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// ========== ROSTER ==========

// POST /api/serve-teams/:teamId/roster - Add member directly to roster (bypass application flow)
router.post(
    '/:teamId/roster',
    requirePermission(Permission.SERVE_TEAM_MANAGE_ROSTER),
    validateBody(addRosterMemberSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const membership = await serveTeamService.addMemberToRoster(
                req.params.teamId,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role,
                req.body
            );

            res.status(201).json({
                data: membership,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/serve-teams/:teamId/roster/:userId/role - Update member role
router.patch(
    '/:teamId/roster/:userId/role',
    requirePermission(Permission.SERVE_TEAM_MANAGE_ROSTER),
    validateBody(updateMemberRoleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await serveTeamService.updateMemberRole(
                req.params.teamId,
                req.params.userId,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role,
                req.body.role
            );

            res.status(200).json({
                data: result,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/serve-teams/:teamId/roster/:userId - Remove from roster
router.delete(
    '/:teamId/roster/:userId',
    requirePermission(Permission.SERVE_TEAM_MANAGE_ROSTER),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await serveTeamService.removeFromRoster(
                req.params.teamId,
                req.params.userId,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role
            );
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

// ========== RESOURCES ==========

// GET /api/serve-teams/:teamId/resources - List resources (members can GET)
router.get(
    '/:teamId/resources',
    requirePermission(Permission.SERVE_TEAM_VIEW_RESOURCES),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const resources = await serveTeamService.listResources(
                req.params.teamId,
                req.user!.tenantId
            );

            res.status(200).json({
                data: resources,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/serve-teams/:teamId/resources - Add resource (Leader/Admin only via RBAC)
router.post(
    '/:teamId/resources',
    requirePermission(Permission.SERVE_TEAM_EDIT_RESOURCES),
    validateBody(addResourceSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const resource = await serveTeamService.addResource(
                req.params.teamId,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role,
                req.body
            );

            res.status(201).json({
                data: resource,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/serve-teams/:teamId/resources/:resourceId
router.delete(
    '/:teamId/resources/:resourceId',
    requirePermission(Permission.SERVE_TEAM_EDIT_RESOURCES),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await serveTeamService.deleteResource(
                req.params.resourceId,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role
            );
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

// ========== EVENTS ==========

// GET /api/serve-teams/:teamId/events - List events
router.get(
    '/:teamId/events',
    requirePermission(Permission.SERVE_TEAM_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const upcoming = req.query.upcoming === 'true';
            const events = await serveTeamService.listEvents(
                req.params.teamId,
                req.user!.tenantId,
                upcoming
            );

            res.status(200).json({
                data: events,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/serve-teams/:teamId/events - Create event (Leader/Admin via RBAC)
router.post(
    '/:teamId/events',
    requirePermission(Permission.SERVE_TEAM_MANAGE_EVENTS),
    validateBody(createEventSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const event = await serveTeamService.createEvent(
                req.params.teamId,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role,
                {
                    ...req.body,
                    startTime: new Date(req.body.startTime),
                    endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
                }
            );

            res.status(201).json({
                data: event,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/serve-teams/:teamId/events/:eventId
router.delete(
    '/:teamId/events/:eventId',
    requirePermission(Permission.SERVE_TEAM_MANAGE_EVENTS),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await serveTeamService.deleteEvent(
                req.params.eventId,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role
            );
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

// ========== ATTENDANCE ==========

// POST /api/serve-teams/events/:eventId/attendance - Mark attendance
router.post(
    '/events/:eventId/attendance',
    requirePermission(Permission.SERVE_TEAM_MANAGE_EVENTS),
    validateBody(markAttendanceSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const results = await serveTeamService.markAttendance(
                req.params.eventId,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role,
                req.body.records
            );

            res.status(200).json({
                data: results,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/serve-teams/events/:eventId/attendance - Get attendance
router.get(
    '/events/:eventId/attendance',
    requirePermission(Permission.SERVE_TEAM_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const attendance = await serveTeamService.getAttendance(
                req.params.eventId,
                req.user!.tenantId
            );

            res.status(200).json({
                data: attendance,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// ========== TEAM TRAINING ==========

// POST /api/serve-teams/:teamId/training/assign - Assign a track to a team (Admin only)
router.post(
    '/:teamId/training/assign',
    requirePermission(Permission.SERVE_TEAM_UPDATE),
    validateBody(assignTrackSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const assignment = await serveTeamService.assignTrackToTeam(
                req.params.teamId,
                req.body.trackId,
                req.user!.tenantId,
                req.user!.userId
            );

            res.status(201).json({
                data: assignment,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/serve-teams/:teamId/training/assign/:trackId - Unassign track from team
router.delete(
    '/:teamId/training/assign/:trackId',
    requirePermission(Permission.SERVE_TEAM_UPDATE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await serveTeamService.unassignTrackFromTeam(
                req.params.teamId,
                req.params.trackId,
                req.user!.tenantId
            );
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/serve-teams/:teamId/training/assignments - List assigned tracks
router.get(
    '/:teamId/training/assignments',
    requirePermission(Permission.SERVE_TEAM_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const assignments = await serveTeamService.getTeamTrackAssignments(
                req.params.teamId,
                req.user!.tenantId
            );

            res.status(200).json({
                data: assignments,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/serve-teams/:teamId/training/tracks - Create team-scoped track (Leader)
router.post(
    '/:teamId/training/tracks',
    requirePermission(Permission.SERVE_TEAM_EDIT_RESOURCES),
    validateBody(createTeamTrackSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const track = await serveTeamService.createTeamScopedTrack(
                req.params.teamId,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role,
                req.body
            );

            res.status(201).json({
                data: track,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/serve-teams/:teamId/training/my-training - Get current user's team training
router.get(
    '/:teamId/training/my-training',
    requirePermission(Permission.SERVE_TEAM_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const training = await serveTeamService.getTeamTraining(
                req.params.teamId,
                req.user!.tenantId,
                req.user!.userId
            );

            res.status(200).json({
                data: training,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/serve-teams/:teamId/training/progress - Get team member progress (Leader/Admin)
router.get(
    '/:teamId/training/progress',
    requirePermission(Permission.SERVE_TEAM_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const progress = await serveTeamService.getTeamMemberProgress(
                req.params.teamId,
                req.user!.tenantId,
                req.user!.userId,
                req.user!.role
            );

            res.status(200).json({
                data: progress,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// ========== Referral ==========

const referMemberSchema = z.object({
    memberId: z.string().uuid(),
    memberName: z.string().min(1),
});

// POST /:teamId/refer — refer a member to this serve team, notify leaders
router.post(
    '/:teamId/refer',
    requirePermission(Permission.SERVE_TEAM_MANAGE_ROSTER),
    validateBody(referMemberSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { memberId, memberName } = req.body;
            const teamId = req.params.teamId;
            const tenantId = req.user!.tenantId;

            // Get team name for the notification
            const team = await serveTeamService.getTeamById(teamId, tenantId);

            const notifications = await notificationService.notifyServeTeamLeaders({
                tenantId,
                teamId,
                memberId,
                memberName,
                teamName: team.name,
                referredBy: req.user!.userId,
            });

            res.status(200).json({
                message: `Referral sent to ${notifications.length} team leader(s)`,
                data: { notifiedCount: notifications.length },
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
