/**
 * Authentication Service (Firestore)
 * Handles user authentication, JWT tokens, and password hashing
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getFirestore, Collections } from '../config/firestore.js';
import { config } from '../config/env.js';
import { User, UserRole } from '../types/models.js';
import { hasPermission, hasAnyPermission, hasAllPermissions, getRolePermissions } from '../config/permissions.js';

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
  const db = getFirestore();

  // Check if user already exists
  const existingUsers = await db
    .collection(Collections.USERS)
    .where('email', '==', data.email)
    .limit(1)
    .get();

  if (!existingUsers.empty) {
    throw new Error('User already exists with this email');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const now = new Date().toISOString();
  const userRef = db.collection(Collections.USERS).doc();

  const userData: User = {
    id: userRef.id,
    email: data.email,
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
    name: `${data.firstName} ${data.lastName}`,
    phone: data.phone,
    role: data.role ? UserRole[data.role] : UserRole.VOLUNTEER,
    createdAt: now,
    updatedAt: now,
  };

  await userRef.set(userData);

  // Generate tokens
  const tokens = generateTokens({ id: userData.id, email: userData.email, role: userData.role });

  // Store refresh token
  await userRef.update({ refreshToken: tokens.refreshToken });

  // Return user without password
  const { password: _, refreshToken: __, ...userWithoutSensitive } = userData;

  return { user: userWithoutSensitive, tokens };
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string) {
  const db = getFirestore();

  // Find user
  const userSnapshot = await db
    .collection(Collections.USERS)
    .where('email', '==', email)
    .limit(1)
    .get();

  if (userSnapshot.empty) {
    throw new Error('Invalid credentials');
  }

  const userDoc = userSnapshot.docs[0];
  const user = userDoc.data() as User;

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const tokens = generateTokens(user);

  // Store refresh token and update last login
  await userDoc.ref.update({
    refreshToken: tokens.refreshToken,
    lastLogin: new Date().toISOString(),
  });

  // Return user without password
  const { password: _, refreshToken: __, ...userWithoutSensitive } = user;

  return { user: userWithoutSensitive, tokens };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string) {
  const db = getFirestore();

  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Find user and verify refresh token
    const userDoc = await db.collection(Collections.USERS).doc(payload.userId).get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const user = userDoc.data() as User;

    if (user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token
    await userDoc.ref.update({ refreshToken: tokens.refreshToken });

    return tokens;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

/**
 * Logout user
 */
export async function logoutUser(userId: string) {
  const db = getFirestore();
  await db.collection(Collections.USERS).doc(userId).update({ refreshToken: null });
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const db = getFirestore();
  const userDoc = await db.collection(Collections.USERS).doc(userId).get();

  if (!userDoc.exists) {
    return null;
  }

  const user = userDoc.data() as User;
  const { password: _, refreshToken: __, ...userWithoutSensitive } = user;
  return userWithoutSensitive;
}

/**
 * Re-export permission helpers for convenience
 */
export { hasPermission, hasAnyPermission, hasAllPermissions, getRolePermissions };
