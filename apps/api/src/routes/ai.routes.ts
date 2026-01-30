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
router.post('/generate-message', async (req, res, next): Promise<void> => {
  try {
    const { firstName, pathway, currentStageId, joinedDate, tags, churchName } = req.body;

    if (!firstName || !pathway || !currentStageId || !joinedDate) {
      res.status(400).json({
        error: 'Missing required fields: firstName, pathway, currentStageId, joinedDate',
      });
      return;
    }

    const message = await aiService.generateFollowUpMessage({
      firstName,
      pathway,
      currentStageId,
      joinedDate,
      tags: tags || [],
      churchName,
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
router.post('/analyze-journey', async (req, res, next): Promise<void> => {
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
      res.status(400).json({
        error:
          'Missing required fields: firstName, pathway, currentStageId, currentStageName, joinedDate',
      });
      return;
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
