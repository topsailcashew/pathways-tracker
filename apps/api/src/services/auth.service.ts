import bcrypt from 'bcrypt';
import { sign, verify, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    tenantId?: string; // For first user, create tenant
    churchName?: string; // For first user
}

interface LoginData {
    email: string;
    password: string;
}

export class AuthService {
    // Generate access token
    private generateAccessToken(userId: string, tenantId: string, email: string): string {
        return sign(
            { userId, tenantId, email },
            process.env.JWT_SECRET!,
            { expiresIn: ACCESS_TOKEN_EXPIRY } as SignOptions
        );
    }

    // Generate refresh token
    private generateRefreshToken(userId: string): string {
        return sign(
            { userId, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: REFRESH_TOKEN_EXPIRY } as SignOptions
        );
    }

    // Calculate refresh token expiry date
    private getRefreshTokenExpiry(): Date {
        const days = parseInt(REFRESH_TOKEN_EXPIRY.replace('d', ''));
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    // Register new user
    async register(data: RegisterData) {
        try {
            // Check if email already exists
            const existingUser = await prisma.user.findFirst({
                where: { email: data.email.toLowerCase() },
            });

            if (existingUser) {
                throw new AppError(409, 'EMAIL_EXISTS', 'Email already registered');
            }

            // Hash password
            const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

            // Create tenant if this is the first user
            let tenantId: string = data.tenantId || '';
            if (!tenantId) {
                const tenant = await prisma.tenant.create({
                    data: {
                        name: data.churchName || `${data.firstName}'s Church`,
                        domain: `${data.email.split('@')[0]}-${Date.now()}`,
                        adminEmail: data.email,
                        plan: 'FREE',
                        status: 'ACTIVE',
                    },
                });
                tenantId = tenant.id;
                logger.info(`Created new tenant: ${tenant.id}`);
            }

            // Create user
            const user = await prisma.user.create({
                data: {
                    tenantId,
                    email: data.email.toLowerCase(),
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone || null,
                    role: data.tenantId ? 'VOLUNTEER' : 'ADMIN', // First user is ADMIN
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        data.firstName + ' ' + data.lastName
                    )}&background=random`,
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
                    createdAt: true,
                },
            });

            // Generate tokens
            const accessToken = this.generateAccessToken(user.id, user.tenantId, user.email);
            const refreshToken = this.generateRefreshToken(user.id);

            // Store refresh token
            await prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: refreshToken,
                    expiresAt: this.getRefreshTokenExpiry(),
                },
            });

            logger.info(`User registered: ${user.email}`);

            return {
                user,
                accessToken,
                refreshToken,
            };
        } catch (error) {
            logger.error('Registration error:', error);
            throw error;
        }
    }

    // Login user
    async login(data: LoginData) {
        try {
            // Find user
            const user = await prisma.user.findFirst({
                where: {
                    email: data.email.toLowerCase(),
                    isActive: true,
                },
                select: {
                    id: true,
                    tenantId: true,
                    email: true,
                    passwordHash: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    avatar: true,
                    onboardingComplete: true,
                    isActive: true,
                },
            });

            if (!user) {
                throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
            if (!isValidPassword) {
                throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
            }

            // Generate tokens
            const accessToken = this.generateAccessToken(user.id, user.tenantId, user.email);
            const refreshToken = this.generateRefreshToken(user.id);

            // Store refresh token
            await prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: refreshToken,
                    expiresAt: this.getRefreshTokenExpiry(),
                },
            });

            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });

            // Update tenant last login
            await prisma.tenant.update({
                where: { id: user.tenantId },
                data: { lastLoginAt: new Date() },
            });

            logger.info(`User logged in: ${user.email}`);

            // Remove passwordHash from response
            const { passwordHash, ...userWithoutPassword } = user;

            return {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
            };
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    // Refresh access token
    async refresh(refreshToken: string) {
        try {
            // Verify refresh token
            const decoded = verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET!
            ) as any;

            // Check if token exists in database and is not revoked
            const tokenRecord = await prisma.refreshToken.findFirst({
                where: {
                    token: refreshToken,
                    userId: decoded.userId,
                    revokedAt: null,
                    expiresAt: { gt: new Date() },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            tenantId: true,
                            email: true,
                            isActive: true,
                        },
                    },
                },
            });

            if (!tokenRecord || !tokenRecord.user.isActive) {
                throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
            }

            // Revoke old refresh token (token rotation)
            await prisma.refreshToken.update({
                where: { id: tokenRecord.id },
                data: { revokedAt: new Date() },
            });

            // Generate new tokens
            const newAccessToken = this.generateAccessToken(
                tokenRecord.user.id,
                tokenRecord.user.tenantId,
                tokenRecord.user.email
            );
            const newRefreshToken = this.generateRefreshToken(tokenRecord.user.id);

            // Store new refresh token
            await prisma.refreshToken.create({
                data: {
                    userId: tokenRecord.user.id,
                    token: newRefreshToken,
                    expiresAt: this.getRefreshTokenExpiry(),
                },
            });

            logger.info(`Token refreshed for user: ${tokenRecord.user.email}`);

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            };
        } catch (error: any) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
            }
            throw error;
        }
    }

    // Logout user
    async logout(refreshToken: string) {
        try {
            // Revoke refresh token
            await prisma.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { revokedAt: new Date() },
            });

            logger.info('User logged out');
        } catch (error) {
            logger.error('Logout error:', error);
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
}

export default new AuthService();
