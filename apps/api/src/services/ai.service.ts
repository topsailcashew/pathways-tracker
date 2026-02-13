import { GoogleGenAI, Type } from '@google/genai';
import { AppError } from '../middleware/error.middleware';

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface GenerateMessageRequest {
  firstName: string;
  pathway: 'NEWCOMER' | 'NEW_BELIEVER' | 'MEMBER';
  currentStageId: string;
  joinedDate: string;
  tags: string[];
  churchName?: string;
}

export interface AnalyzeJourneyRequest {
  firstName: string;
  pathway: 'NEWCOMER' | 'NEW_BELIEVER' | 'MEMBER';
  currentStageId: string;
  currentStageName: string;
  joinedDate: string;
  lastInteraction?: string;
  daysSinceInteraction?: number;
  recentNotes: string[];
}

export interface JourneyAnalysis {
  status: 'On Track' | 'Needs Attention' | 'Stalled';
  reasoning: string;
  suggestedAction: string;
}

/**
 * Generates a personalized follow-up message for a church member
 */
export const generateFollowUpMessage = async (
  request: GenerateMessageRequest
): Promise<string> => {
  if (!ai) {
    throw new AppError(503, 'AI_NOT_CONFIGURED', 'AI features are not configured. Please set GEMINI_API_KEY environment variable.');
  }

  const pathwayName = request.pathway === 'NEWCOMER' ? 'Newcomer' : 'New Believer';

  // Calculate days since joined
  const joinedDate = new Date(request.joinedDate);
  const daysSinceJoined = Math.floor(
    (new Date().getTime() - joinedDate.getTime()) / (1000 * 3600 * 24)
  );

  const churchDisplayName = request.churchName || 'Church';
  const context = `
    You are a helpful assistant for a church called '${churchDisplayName}'.
    Your goal is to draft a short, warm, and friendly SMS message (under 160 chars ideally, but up to 200 is okay)
    to a church member named ${request.firstName}.

    Context:
    - Pathway: ${pathwayName}
    - Current Stage ID: ${request.currentStageId}
    - Days since joining: ${daysSinceJoined}
    - Tags: ${request.tags.join(', ')}

    The tone should be personal, encouraging, and not overly formal.
    Do not use placeholders like [Your Name], just end with ' - ${churchDisplayName}'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
    });

    const message = response.text?.trim() || 'Could not generate message.';
    return message;
  } catch (error) {
    console.error('Failed to generate message:', error);
    throw new AppError(502, 'AI_SERVICE_ERROR', 'Failed to generate message. Please try again later.');
  }
};

/**
 * Analyzes member history and status to determine engagement health
 */
export const analyzeMemberJourney = async (
  request: AnalyzeJourneyRequest
): Promise<JourneyAnalysis> => {
  if (!ai) {
    throw new AppError(503, 'AI_NOT_CONFIGURED', 'AI features are not configured. Please set GEMINI_API_KEY environment variable.');
  }

  const lastInteraction = request.lastInteraction || 'None';
  const daysSinceInteraction = request.daysSinceInteraction ?? 999;

  const context = `
    Analyze this church member's integration progress:
    Name: ${request.firstName}
    Joined: ${request.joinedDate} (Current Date: ${new Date().toISOString().split('T')[0]})
    Pathway: ${request.pathway}
    Current Stage: ${request.currentStageName}
    Last Recorded Interaction: ${lastInteraction} (${daysSinceInteraction === 999 ? 'No recorded messages' : daysSinceInteraction + ' days ago'})
    Recent Notes context: ${JSON.stringify(request.recentNotes.slice(0, 3))}

    Task:
    1. Determine status:
       - 'On Track': Joined recently OR has interaction/stage movement within last 14 days.
       - 'Needs Attention': No interaction for 14-30 days OR notes indicate questions/hesitation.
       - 'Stalled': No interaction for 30+ days OR stuck in stage 1 for > 3 weeks.
    2. Provide reasoning (max 15 words).
    3. Suggest one concrete next step (max 6 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              enum: ['On Track', 'Needs Attention', 'Stalled'],
            },
            reasoning: { type: Type.STRING },
            suggestedAction: { type: Type.STRING },
          },
        },
      },
    });

    const text = response.text || '{}';
    const analysis = JSON.parse(text) as JourneyAnalysis;
    return analysis;
  } catch (error) {
    console.error('Failed to analyze member journey:', error);
    throw new AppError(502, 'AI_SERVICE_ERROR', 'Failed to analyze member journey. Please try again later.');
  }
};
