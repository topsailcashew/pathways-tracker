/**
 * Authentication Service
 * Handles user authentication, JWT tokens, and password hashing
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.bcrypt.rounds);
}

/**
 * Verify a password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

/**
 * Generate both tokens
 */
export function generateTokens(user: { id: string; email: string; role: string }): AuthTokens {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
}

/**
 * Register a new user
 */
export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'ADMIN' | 'VOLUNTEER';
}) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`,
      phone: data.phone,
      role: data.role || 'VOLUNTEER',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const tokens = generateTokens(user);

  // Store refresh token
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { user, tokens };
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const tokens = generateTokens(user);

  // Store refresh token and update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: tokens.refreshToken,
      lastLogin: new Date(),
    },
  });

  // Return user without password
  const { password: _, refreshToken: __, ...userWithoutSensitive } = user;

  return { user: userWithoutSensitive, tokens };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Find user and verify refresh token
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

/**
 * Logout user
 */
export async function logoutUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}
