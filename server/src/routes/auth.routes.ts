/**
 * Authentication Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import * as authService from '../services/auth.service.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'VOLUNTEER']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body.email, req.body.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', validateBody(refreshSchema), async (req, res, next) => {
  try {
    const tokens = await authService.refreshAccessToken(req.body.refreshToken);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await authService.logoutUser(req.user!.userId);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user!.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
