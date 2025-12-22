/**
 * AI Service (Backend Proxy)
 * Handles all Google Gemini AI interactions securely on the server
 */

import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config/env.js';

const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

export interface JourneyAnalysis {
  status: 'On Track' | 'Needs Attention' | 'Stalled';
  reasoning: string;
  suggestedAction: string;
}

/**
 * Generate a follow-up message for a member
 */
export async function generateFollowUpMessage(memberData: {
  firstName: string;
  pathway: string;
  currentStageId: string;
  joinedDate: string;
  tags: string[];
}): Promise<string> {
  const joinedDate = new Date(memberData.joinedDate);
  const daysSinceJoined = Math.floor(
    (new Date().getTime() - joinedDate.getTime()) / (1000 * 3600 * 24)
  );

  const context = `
    You are a helpful assistant for a church volunteer application called 'Pathway Tracker'.
    Your goal is to draft a short, warm, and friendly SMS message (under 160 chars ideally, but up to 200 is okay)
    to a church member named ${memberData.firstName}.

    Context:
    - Pathway: ${memberData.pathway}
    - Current Stage ID: ${memberData.currentStageId}
    - Days since joining: ${daysSinceJoined}
    - Tags: ${memberData.tags.join(', ')}

    The tone should be personal, encouraging, and not overly formal.
    Do not use placeholders like [Your Name], just end with ' - The Team'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
    });

    return response.text?.trim() || 'Could not generate message.';
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new Error('Failed to generate message');
  }
}

/**
 * Analyze a member's journey
 */
export async function analyzeMemberJourney(memberData: {
  firstName: string;
  pathway: string;
  currentStage: string;
  joinedDate: string;
  lastInteraction?: string;
  daysSinceInteraction: number;
  notes: string[];
}): Promise<JourneyAnalysis> {
  const context = `
    Analyze this church member's integration progress:
    Name: ${memberData.firstName}
    Joined: ${memberData.joinedDate} (Current Date: ${new Date().toISOString().split('T')[0]})
    Pathway: ${memberData.pathway}
    Current Stage: ${memberData.currentStage}
    Last Recorded Interaction: ${memberData.lastInteraction || 'None'} (${
    memberData.daysSinceInteraction === 999
      ? 'No recorded messages'
      : memberData.daysSinceInteraction + ' days ago'
  })
    Recent Notes context: ${JSON.stringify(memberData.notes.slice(0, 3))}

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
            status: { type: Type.STRING, enum: ['On Track', 'Needs Attention', 'Stalled'] },
            reasoning: { type: Type.STRING },
            suggestedAction: { type: Type.STRING },
          },
        },
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text) as JourneyAnalysis;
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      status: 'Needs Attention',
      reasoning: 'Analysis temporarily unavailable',
      suggestedAction: 'Review manually',
    };
  }
}
