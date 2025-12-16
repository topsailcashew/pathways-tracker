
import { GoogleGenAI, Type } from "@google/genai";
import { Member, PathwayType, Stage } from "../types";
import { getEnvConfig, isAIEnabled } from "../utils/env";
import { logger } from "../utils/logger";

// Initialize Gemini Client
const config = getEnvConfig();
const ai = config.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: config.GEMINI_API_KEY }) : null;

/**
 * Generates a personalized follow-up message for a church member based on their pathway and status.
 */
export const generateFollowUpMessage = async (member: Member): Promise<string> => {
  if (!isAIEnabled() || !ai) {
    logger.warn('AI features are disabled or API key is missing');
    return "AI features are currently unavailable. Please configure your API key in settings.";
  }

  const pathwayName = member.pathway === PathwayType.NEWCOMER ? "Newcomer" : "New Believer";
  
  // Calculate days since joined
  const joinedDate = new Date(member.joinedDate);
  const daysSinceJoined = Math.floor((new Date().getTime() - joinedDate.getTime()) / (1000 * 3600 * 24));

  const context = `
    You are a helpful assistant for a church volunteer application called 'Pathway Tracker'.
    Your goal is to draft a short, warm, and friendly SMS message (under 160 chars ideally, but up to 200 is okay) 
    to a church member named ${member.firstName}.
    
    Context:
    - Pathway: ${pathwayName}
    - Current Stage ID: ${member.currentStageId}
    - Days since joining: ${daysSinceJoined}
    - Tags: ${member.tags.join(', ')}
    
    The tone should be personal, encouraging, and not overly formal. 
    Do not use placeholders like [Your Name], just end with ' - The Team'.
  `;

  try {
    logger.debug('Generating follow-up message', { memberId: member.id });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
    });
    const message = response.text?.trim() || "Could not generate message.";
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
    if (!isAIEnabled() || !ai) {
        logger.warn('AI features are disabled or API key is missing');
        return {
            status: 'On Track',
            reasoning: "AI features unavailable. Configure API Key.",
            suggestedAction: "Check settings"
        };
    }

    const currentStage = stages.find(s => s.id === member.currentStageId)?.name || "Unknown Stage";
    
    // Calculate Last Interaction Date based on Message Logs
    let lastInteraction = "None";
    let daysSinceInteraction = 999;
    
    if (member.messageLog && member.messageLog.length > 0) {
        // Sort descending
        const sortedLogs = [...member.messageLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const lastLog = sortedLogs[0];
        const lastDate = new Date(lastLog.timestamp);
        lastInteraction = lastDate.toLocaleDateString();
        daysSinceInteraction = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    }

    const context = `
      Analyze this church member's integration progress:
      Name: ${member.firstName}
      Joined: ${member.joinedDate} (Current Date: ${new Date().toISOString().split('T')[0]})
      Pathway: ${member.pathway}
      Current Stage: ${currentStage}
      Last Recorded Interaction: ${lastInteraction} (${daysSinceInteraction === 999 ? 'No recorded messages' : daysSinceInteraction + ' days ago'})
      Recent Notes context: ${JSON.stringify(member.notes.slice(0, 3))}

      Task:
      1. Determine status:
         - 'On Track': Joined recently OR has interaction/stage movement within last 14 days.
         - 'Needs Attention': No interaction for 14-30 days OR notes indicate questions/hesitation.
         - 'Stalled': No interaction for 30+ days OR stuck in stage 1 for > 3 weeks.
      2. Provide reasoning (max 15 words).
      3. Suggest one concrete next step (max 6 words).
    `;

    try {
        logger.debug('Analyzing member journey', { memberId: member.id });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: context,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        status: { type: Type.STRING, enum: ['On Track', 'Needs Attention', 'Stalled'] },
                        reasoning: { type: Type.STRING },
                        suggestedAction: { type: Type.STRING }
                    }
                }
            }
        });

        const text = response.text || "{}";
        const analysis = JSON.parse(text) as JourneyAnalysis;
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
