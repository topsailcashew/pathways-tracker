import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as aiService from '../services/ai.service';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

/**
 * POST /api/ai/generate-message
 * Generate a personalized follow-up message for a member
 */
router.post('/generate-message', async (req, res, next) => {
  try {
    const { firstName, pathway, currentStageId, joinedDate, tags } = req.body;

    if (!firstName || !pathway || !currentStageId || !joinedDate) {
      return res.status(400).json({
        error: 'Missing required fields: firstName, pathway, currentStageId, joinedDate',
      });
    }

    const message = await aiService.generateFollowUpMessage({
      firstName,
      pathway,
      currentStageId,
      joinedDate,
      tags: tags || [],
    });

    res.json({ message });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/analyze-journey
 * Analyze a member's journey and provide engagement status
 */
router.post('/analyze-journey', async (req, res, next) => {
  try {
    const {
      firstName,
      pathway,
      currentStageId,
      currentStageName,
      joinedDate,
      lastInteraction,
      daysSinceInteraction,
      recentNotes,
    } = req.body;

    if (!firstName || !pathway || !currentStageId || !currentStageName || !joinedDate) {
      return res.status(400).json({
        error:
          'Missing required fields: firstName, pathway, currentStageId, currentStageName, joinedDate',
      });
    }

    const analysis = await aiService.analyzeMemberJourney({
      firstName,
      pathway,
      currentStageId,
      currentStageName,
      joinedDate,
      lastInteraction,
      daysSinceInteraction,
      recentNotes: recentNotes || [],
    });

    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

export default router;
