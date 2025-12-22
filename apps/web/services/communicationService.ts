/**
 * Mock Communication Service
 * Simulates sending emails and SMS messages.
 */

export const sendEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Log to console to demonstrate "sending"
  console.log(`%c[Email Sent]`, 'color: #10B981; font-weight: bold;', `To: ${to} | Subject: ${subject} | Body: ${body}`);
  
  return true;
};

export const sendSMS = async (to: string, body: string): Promise<boolean> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Log to console
  console.log(`%c[SMS Sent]`, 'color: #3B82F6; font-weight: bold;', `To: ${to} | Body: ${body}`);
  
  return true;
};