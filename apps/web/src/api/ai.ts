import { apiClient, handleApiError } from './client';

export interface GenerateMessageRequest {
  firstName: string;
  pathway: 'NEWCOMER' | 'NEW_BELIEVER' | 'MEMBER';
  currentStageId: string;
  joinedDate: string;
  tags: string[];
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

// Generate a personalized follow-up message
export const generateMessage = async (
  request: GenerateMessageRequest
): Promise<string> => {
  try {
    const response = await apiClient.post<{ message: string }>(
      '/api/ai/generate-message',
      request
    );
    return response.data.message;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Analyze member journey
export const analyzeJourney = async (
  request: AnalyzeJourneyRequest
): Promise<JourneyAnalysis> => {
  try {
    const response = await apiClient.post<JourneyAnalysis>(
      '/api/ai/analyze-journey',
      request
    );
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
