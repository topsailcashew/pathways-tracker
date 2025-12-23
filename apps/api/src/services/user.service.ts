import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { UserRole } from '@prisma/client';

const SALT_ROUNDS = 10;

interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
    tenantId: string;
}

interface UpdateUserData {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
    onboardingComplete?: boolean;
}

export class UserService {
    /**
     * Get all users for a tenant
     */
    async getUsers(tenantId: string, role?: UserRole) {
        try {
            const where: any = { tenantId };
            if (role) {
                where.role = role;
            }

            const users = await prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phone: true,
                    onboardingComplete: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });

            logger.info(`Retrieved ${users.length} users for tenant ${tenantId}`);
            return users;
        } catch (error) {
            logger.error('Error fetching users:', error);
            throw new AppError(500, 'ERROR', 'Failed to fetch users');
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string, tenantId: string) {
        try {
            const user = await prisma.user.findFirst({
                where: { id: userId, tenantId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phone: true,
                    onboardingComplete: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!user) {
                throw new AppError(404, 'ERROR', 'User not found');
            }

            return user;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error fetching user:', error);
            throw new AppError(500, 'ERROR', 'Failed to fetch user');
        }
    }

    /**
     * Create a new user (Admin only)
     */
    async createUser(data: CreateUserData) {
        try {
            // Check if email already exists in this tenant
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: data.email,
                    tenantId: data.tenantId,
                },
            });

            if (existingUser) {
                throw new AppError(400, 'ERROR', 'User with this email already exists');
            }

            // Hash password
            const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role,
                    phone: data.phone,
                    tenantId: data.tenantId,
                    onboardingComplete: false,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phone: true,
                    onboardingComplete: true,
                    createdAt: true,
                },
            });

            logger.info(`Created user ${user.id} (${user.email}) with role ${user.role}`);
            return user;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error creating user:', error);
            throw new AppError(500, 'ERROR', 'Failed to create user');
        }
    }

    /**
     * Update user
     */
    async updateUser(userId: string, tenantId: string, data: UpdateUserData) {
        try {
            // Verify user exists in this tenant
            const existingUser = await prisma.user.findFirst({
                where: { id: userId, tenantId },
            });

            if (!existingUser) {
                throw new AppError(404, 'ERROR', 'User not found');
            }

            // If email is being updated, check it's not taken
            if (data.email && data.email !== existingUser.email) {
                const emailTaken = await prisma.user.findFirst({
                    where: {
                        email: data.email,
                        tenantId,
                        id: { not: userId },
                    },
                });

                if (emailTaken) {
                    throw new AppError(400, 'ERROR', 'Email already in use');
                }
            }

            // Update user
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    role: data.role,
                    onboardingComplete: data.onboardingComplete,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phone: true,
                    onboardingComplete: true,
                    updatedAt: true,
                },
            });

            logger.info(`Updated user ${userId}`);
            return updatedUser;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error updating user:', error);
            throw new AppError(500, 'ERROR', 'Failed to update user');
        }
    }

    /**
     * Update user role (Admin/Super Admin only)
     */
    async updateUserRole(userId: string, tenantId: string, newRole: UserRole, requestingUserRole: UserRole) {
        try {
            // Verify user exists in this tenant
            const user = await prisma.user.findFirst({
                where: { id: userId, tenantId },
            });

            if (!user) {
                throw new AppError(404, 'ERROR', 'User not found');
            }

            // Only SUPER_ADMIN can assign SUPER_ADMIN role
            if (newRole === 'SUPER_ADMIN' && requestingUserRole !== 'SUPER_ADMIN') {
                throw new AppError(403, 'ERROR', 'Only Super Admins can assign Super Admin role');
            }

            // Only SUPER_ADMIN can modify another SUPER_ADMIN
            if (user.role === 'SUPER_ADMIN' && requestingUserRole !== 'SUPER_ADMIN') {
                throw new AppError(403, 'ERROR', 'Only Super Admins can modify Super Admin users');
            }

            // Update role
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { role: newRole },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                },
            });

            logger.info(`Updated user ${userId} role to ${newRole}`);
            return updatedUser;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error updating user role:', error);
            throw new AppError(500, 'ERROR', 'Failed to update user role');
        }
    }

    /**
     * Delete user (Soft delete - deactivate)
     */
    async deleteUser(userId: string, tenantId: string, requestingUserId: string) {
        try {
            // Can't delete yourself
            if (userId === requestingUserId) {
                throw new AppError(400, 'ERROR', 'You cannot delete your own account');
            }

            // Verify user exists in this tenant
            const user = await prisma.user.findFirst({
                where: { id: userId, tenantId },
            });

            if (!user) {
                throw new AppError(404, 'ERROR', 'User not found');
            }

            // For now, we'll actually delete. In production, you might want soft delete
            // by adding an `active` boolean field to the schema
            await prisma.user.delete({
                where: { id: userId },
            });

            logger.info(`Deleted user ${userId}`);
            return { message: 'User deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error deleting user:', error);
            throw new AppError(500, 'ERROR', 'Failed to delete user');
        }
    }

    /**
     * Get user statistics
     */
    async getUserStats(tenantId: string) {
        try {
            const stats = await prisma.user.groupBy({
                by: ['role'],
                where: { tenantId },
                _count: { id: true },
            });

            const total = await prisma.user.count({ where: { tenantId } });

            const formattedStats = {
                total,
                byRole: stats.reduce((acc: any, stat: any) => {
                    acc[stat.role] = stat._count.id;
                    return acc;
                }, {}),
            };

            return formattedStats;
        } catch (error) {
            logger.error('Error fetching user stats:', error);
            throw new AppError(500, 'ERROR', 'Failed to fetch user statistics');
        }
    }
}

export default new UserService();
