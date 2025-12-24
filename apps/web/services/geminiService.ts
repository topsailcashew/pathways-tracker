
import { Member, PathwayType, Stage } from "../types";
import { isAIEnabled } from "../utils/env";
import { logger } from "../utils/logger";
import * as aiApi from "../src/api/ai";

/**
 * Generates a personalized follow-up message for a church member based on their pathway and status.
 */
export const generateFollowUpMessage = async (member: Member): Promise<string> => {
  if (!isAIEnabled()) {
    logger.warn('AI features are disabled');
    return "AI features are currently unavailable. Please enable them in settings.";
  }

  try {
    logger.debug('Generating follow-up message via backend API', { memberId: member.id });
    const message = await aiApi.generateMessage({
      firstName: member.firstName,
      pathway: member.pathway,
      currentStageId: member.currentStageId,
      joinedDate: member.joinedDate,
      tags: member.tags,
    });
    logger.info('Successfully generated follow-up message', { memberId: member.id });
    return message;
  } catch (error) {
    logger.error("Failed to generate message", error as Error, { memberId: member.id });
    return "Sorry, I couldn't generate a message right now. Please try again later.";
  }
};

export interface JourneyAnalysis {
  status: 'On Track' | 'Needs Attention' | 'Stalled';
  reasoning: string;
  suggestedAction: string;
}

/**
 * Analyzes member history and status to determine engagement health.
 */
export const analyzeMemberJourney = async (member: Member, stages: Stage[]): Promise<JourneyAnalysis> => {
    if (!isAIEnabled()) {
        logger.warn('AI features are disabled');
        return {
            status: 'On Track',
            reasoning: "AI features unavailable. Enable in settings.",
            suggestedAction: "Check settings"
        };
    }

    const currentStage = stages.find(s => s.id === member.currentStageId);
    const currentStageName = currentStage?.name || "Unknown Stage";

    // Calculate Last Interaction Date based on Message Logs
    let lastInteraction: string | undefined;
    let daysSinceInteraction: number | undefined;

    if (member.messageLog && member.messageLog.length > 0) {
        // Sort descending
        const sortedLogs = [...member.messageLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const lastLog = sortedLogs[0];
        const lastDate = new Date(lastLog.timestamp);
        lastInteraction = lastDate.toLocaleDateString();
        daysSinceInteraction = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    }

    try {
        logger.debug('Analyzing member journey via backend API', { memberId: member.id });
        const analysis = await aiApi.analyzeJourney({
            firstName: member.firstName,
            pathway: member.pathway,
            currentStageId: member.currentStageId,
            currentStageName,
            joinedDate: member.joinedDate,
            lastInteraction,
            daysSinceInteraction,
            recentNotes: member.notes.slice(0, 3),
        });
        logger.info('Successfully analyzed member journey', { memberId: member.id, status: analysis.status });
        return analysis;
    } catch (e) {
        logger.error("Failed to analyze member journey", e as Error, { memberId: member.id });
        return {
            status: 'Needs Attention',
            reasoning: "Analysis temporarily unavailable",
            suggestedAction: "Review manually"
        };
    }
}
