/**
 * AI Routes
 * Backend proxy for AI operations to keep API keys secure
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permissions.middleware.js';
import { Permission } from '../config/permissions.js';
import * as aiService from '../services/ai.service.js';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Validation schemas
const generateMessageSchema = z.object({
  firstName: z.string(),
  pathway: z.string(),
  currentStageId: z.string(),
  joinedDate: z.string(),
  tags: z.array(z.string()),
});

const analyzeJourneySchema = z.object({
  firstName: z.string(),
  pathway: z.string(),
  currentStage: z.string(),
  joinedDate: z.string(),
  lastInteraction: z.string().optional(),
  daysSinceInteraction: z.number(),
  notes: z.array(z.string()),
});

/**
 * POST /api/ai/generate-message
 * Generate a follow-up message for a member
 */
router.post('/generate-message', requirePermission(Permission.AI_GENERATE_MESSAGE), validateBody(generateMessageSchema), async (req, res, next) => {
  try {
    const message = await aiService.generateFollowUpMessage(req.body);
    res.json({ message });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/analyze-journey
 * Analyze a member's journey
 */
router.post('/analyze-journey', requirePermission(Permission.AI_ANALYZE_JOURNEY), validateBody(analyzeJourneySchema), async (req, res, next) => {
  try {
    const analysis = await aiService.analyzeMemberJourney(req.body);
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

export default router;
