/**
 * Email Service
 * Handles sending emails via Nodemailer (Gmail/SMTP)
 */

import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
function getTransporter() {
  if (!transporter) {
    if (!config.email.user || !config.email.password) {
      console.warn('⚠️  Email credentials not configured. Email features will be disabled.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.log('[EMAIL] Simulation mode - would have sent:', {
      to: options.to,
      subject: options.subject,
    });
    return true;
  }

  try {
    const info = await transport.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('✅ Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return false;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
  const subject = 'Welcome to Our Church!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0A1931;">Welcome, ${firstName}!</h2>
      <p>We're so glad you've joined our church community.</p>
      <p>We're here to support you on your faith journey. Feel free to reach out if you have any questions.</p>
      <p style="margin-top: 30px;">Blessings,<br>The Church Team</p>
    </div>
  `;
  const text = `Welcome, ${firstName}! We're so glad you've joined our church community.`;

  return sendEmail({ to, subject, text, html });
}

/**
 * Send custom follow-up email
 */
export async function sendFollowUpEmail(
  to: string,
  firstName: string,
  message: string
): Promise<boolean> {
  const subject = `Following up with you, ${firstName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h3 style="color: #0A1931;">Hi ${firstName},</h3>
      <p style="white-space: pre-wrap;">${message}</p>
      <p style="margin-top: 30px;">Blessings,<br>The Church Team</p>
    </div>
  `;

  return sendEmail({ to, subject, text: message, html });
}

/**
 * Send task reminder email
 */
export async function sendTaskReminderEmail(
  to: string,
  taskDescription: string
): Promise<boolean> {
  const subject = 'Task Reminder';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h3 style="color: #0A1931;">Task Reminder</h3>
      <p>You have a task that needs attention:</p>
      <div style="background: #F6FAFD; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>${taskDescription}</strong>
      </div>
      <p>Please take a moment to review and complete this task.</p>
      <p style="margin-top: 30px;">Thank you,<br>The Church Team</p>
    </div>
  `;

  return sendEmail({ to, subject, text: `Task Reminder: ${taskDescription}`, html });
}
