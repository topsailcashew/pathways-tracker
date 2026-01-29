import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

interface SupabaseUserData {
    id: string;
    email: string;
    user_metadata?: {
        full_name?: string;
        name?: string;
        avatar_url?: string;
        picture?: string;
    };
    app_metadata?: {
        provider?: string;
    };
}

interface SyncData {
    supabaseUser: SupabaseUserData;
    churchName?: string;
}

export class AuthService {
    // Sync or create user from Supabase auth
    async syncUser(data: SyncData) {
        try {
            const { supabaseUser, churchName } = data;
            const email = supabaseUser.email?.toLowerCase();

            if (!email) {
                throw new AppError(400, 'INVALID_USER', 'No email provided');
            }

            // Check if user exists by supabaseId
            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { supabaseId: supabaseUser.id },
                        { email: email }
                    ]
                },
                select: {
                    id: true,
                    tenantId: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    avatar: true,
                    onboardingComplete: true,
                    isActive: true,
                    supabaseId: true,
                },
            });

            if (user) {
                // Existing user - update supabaseId if needed and update last login
                if (!user.isActive) {
                    throw new AppError(401, 'ACCOUNT_DISABLED', 'This account has been disabled');
                }

                const updateData: any = {
                    lastLoginAt: new Date(),
                };

                // Update supabaseId if not set
                if (!user.supabaseId) {
                    updateData.supabaseId = supabaseUser.id;
                }

                // Update avatar if provided by Supabase
                const avatarUrl = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture;
                if (avatarUrl && !user.avatar?.includes('ui-avatars')) {
                    updateData.avatar = avatarUrl;
                }

                await prisma.user.update({
                    where: { id: user.id },
                    data: updateData,
                });

                // Update tenant last login
                await prisma.tenant.update({
                    where: { id: user.tenantId },
                    data: { lastLoginAt: new Date() },
                });

                logger.info(`User synced: ${user.email}`);

                return { user };
            }

            // New user - create tenant and user
            const fullName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '';
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || email.split('@')[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            // Determine auth provider
            const provider = supabaseUser.app_metadata?.provider;
            const authProvider = provider === 'google' ? 'GOOGLE' : 'PASSWORD';

            // Create tenant for new user
            const tenant = await prisma.tenant.create({
                data: {
                    name: churchName || `${firstName}'s Church`,
                    domain: `${email.split('@')[0]}-${Date.now()}`,
                    adminEmail: email,
                    plan: 'FREE',
                    status: 'ACTIVE',
                },
            });

            logger.info(`Created new tenant: ${tenant.id}`);

            // Create user
            const avatarUrl = supabaseUser.user_metadata?.avatar_url ||
                             supabaseUser.user_metadata?.picture ||
                             `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=random`;

            const newUser = await prisma.user.create({
                data: {
                    tenantId: tenant.id,
                    supabaseId: supabaseUser.id,
                    email: email,
                    passwordHash: null,
                    authProvider: authProvider,
                    googleId: provider === 'google' ? supabaseUser.id : null,
                    firstName: firstName,
                    lastName: lastName,
                    role: 'ADMIN', // First user is ADMIN
                    avatar: avatarUrl,
                    emailVerified: true,
                    onboardingComplete: false,
                },
                select: {
                    id: true,
                    tenantId: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    avatar: true,
                    onboardingComplete: true,
                },
            });

            logger.info(`User created: ${newUser.email}`);

            return { user: newUser };
        } catch (error) {
            logger.error('Sync user error:', error);
            throw error;
        }
    }

    // Complete onboarding
    async completeOnboarding(userId: string) {
        try {
            const user = await prisma.user.update({
                where: { id: userId },
                data: { onboardingComplete: true },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    onboardingComplete: true,
                },
            });

            logger.info(`Onboarding completed for user: ${user.email}`);

            return user;
        } catch (error) {
            logger.error('Onboarding completion error:', error);
            throw error;
        }
    }

    // Get current user
    async getCurrentUser(userId: string) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    tenantId: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    avatar: true,
                    role: true,
                    gender: true,
                    address: true,
                    location: true,
                    postalCode: true,
                    dateOfBirth: true,
                    isActive: true,
                    emailVerified: true,
                    onboardingComplete: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!user) {
                throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
            }

            return user;
        } catch (error) {
            logger.error('Get current user error:', error);
            throw error;
        }
    }

    // Sign out (server-side cleanup if needed)
    async signOut(userId: string) {
        try {
            logger.info(`User signed out: ${userId}`);
            // No server-side tokens to clean up with Supabase auth
            // Just log the event
        } catch (error) {
            logger.error('Sign out error:', error);
            throw error;
        }
    }
}

export default new AuthService();
