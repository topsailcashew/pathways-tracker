/**
 * SMS Service
 * Handles sending SMS via Twilio
 */

import twilio from 'twilio';
import { config } from '../config/env.js';

let twilioClient: twilio.Twilio | null = null;

/**
 * Initialize Twilio client
 */
function getTwilioClient() {
  if (!twilioClient) {
    if (!config.twilio.accountSid || !config.twilio.authToken) {
      console.warn('⚠️  Twilio credentials not configured. SMS features will be disabled.');
      return null;
    }

    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
  }

  return twilioClient;
}

export interface SMSOptions {
  to: string;
  body: string;
}

/**
 * Send an SMS
 */
export async function sendSMS(options: SMSOptions): Promise<boolean> {
  const client = getTwilioClient();

  if (!client || !config.twilio.phoneNumber) {
    console.log('[SMS] Simulation mode - would have sent:', {
      to: options.to,
      body: options.body,
    });
    return true;
  }

  try {
    const message = await client.messages.create({
      body: options.body,
      from: config.twilio.phoneNumber,
      to: options.to,
    });

    console.log('✅ SMS sent:', message.sid);
    return true;
  } catch (error) {
    console.error('❌ SMS send failed:', error);
    return false;
  }
}

/**
 * Send welcome SMS
 */
export async function sendWelcomeSMS(to: string, firstName: string): Promise<boolean> {
  const body = `Hi ${firstName}! Welcome to our church. We're so glad you're here. Feel free to reach out if you need anything. - The Team`;
  return sendSMS({ to, body });
}

/**
 * Send follow-up SMS
 */
export async function sendFollowUpSMS(to: string, message: string): Promise<boolean> {
  return sendSMS({ to, body: message });
}
