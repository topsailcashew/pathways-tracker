import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { TeamMemberRole } from '@prisma/client';

export type TeamPermission =
    | 'VIEW_TEAM'
    | 'EDIT_RESOURCES'
    | 'DELETE_RESOURCES'
    | 'MANAGE_ROSTER'
    | 'MANAGE_EVENTS'
    | 'MARK_ATTENDANCE'
    | 'MESSAGE_ALL';

const TEAM_ROLE_PERMISSIONS: Record<TeamMemberRole, TeamPermission[]> = {
    LEADER: [
        'VIEW_TEAM',
        'EDIT_RESOURCES',
        'DELETE_RESOURCES',
        'MANAGE_ROSTER',
        'MANAGE_EVENTS',
        'MARK_ATTENDANCE',
        'MESSAGE_ALL',
    ],
    MEMBER: [
        'VIEW_TEAM',
    ],
    TRAINEE: [
        'VIEW_TEAM',
    ],
};

// Org-level roles that bypass team-level checks
const ORG_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export class ServeTeamRbacService {
    /**
     * Get a user's team membership (including role) for a specific team.
     */
    async getMembership(teamId: string, userId: string) {
        return prisma.teamMembership.findUnique({
            where: { teamId_userId: { teamId, userId } },
        });
    }

    /**
     * Check if user has a specific team-level permission.
     * Org admins always pass. Team leaders get full team permissions.
     * Members and trainees only get VIEW_TEAM.
     */
    async requireTeamPermission(
        teamId: string,
        userId: string,
        orgRole: string,
        permission: TeamPermission
    ): Promise<void> {
        // Org admins bypass team-level checks
        if (ORG_ADMIN_ROLES.includes(orgRole)) {
            return;
        }

        const membership = await this.getMembership(teamId, userId);

        if (!membership) {
            throw new AppError(
                403,
                'FORBIDDEN',
                'You are not a member of this team'
            );
        }

        const teamPermissions = TEAM_ROLE_PERMISSIONS[membership.role] || [];

        if (!teamPermissions.includes(permission)) {
            throw new AppError(
                403,
                'FORBIDDEN',
                `Team ${membership.role}s do not have the '${permission}' permission`
            );
        }
    }

    /**
     * Check if user is a team LEADER (or org admin).
     */
    async requireTeamLeader(
        teamId: string,
        userId: string,
        orgRole: string
    ): Promise<void> {
        if (ORG_ADMIN_ROLES.includes(orgRole)) {
            return;
        }

        const membership = await this.getMembership(teamId, userId);

        if (!membership || membership.role !== 'LEADER') {
            throw new AppError(
                403,
                'FORBIDDEN',
                'Only team leaders can perform this action'
            );
        }
    }

    /**
     * Check if user is at least a member of the team (or org admin).
     */
    async requireTeamMember(
        teamId: string,
        userId: string,
        orgRole: string
    ): Promise<void> {
        if (ORG_ADMIN_ROLES.includes(orgRole)) {
            return;
        }

        const membership = await this.getMembership(teamId, userId);

        if (!membership) {
            throw new AppError(
                403,
                'FORBIDDEN',
                'You are not a member of this team'
            );
        }
    }

    /**
     * Check if user has completed the required academy track for a team.
     */
    async checkAcademyEligibility(
        userId: string,
        requiredTrackId: string | null
    ): Promise<boolean> {
        if (!requiredTrackId) {
            return true; // No track required
        }

        const enrollment = await prisma.academyEnrollment.findUnique({
            where: { userId_trackId: { userId, trackId: requiredTrackId } },
        });

        return enrollment !== null && enrollment.completedAt !== null;
    }
}

export default new ServeTeamRbacService();
