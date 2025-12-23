import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { MessageChannel, MessageDirection, MessageStatus } from '@prisma/client';

// These will be implemented when SendGrid/Twilio are properly configured
// For now, we'll create placeholder functions
const SENDGRID_ENABLED = !!process.env.SENDGRID_API_KEY;
const TWILIO_ENABLED = !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN;

interface SendEmailData {
    memberId: string;
    subject: string;
    content: string;
    sentById: string;
    tenantId: string;
}

interface SendSMSData {
    memberId: string;
    content: string;
    sentById: string;
    tenantId: string;
}

export class CommunicationService {
    /**
     * Send email to a member
     */
    async sendEmail(data: SendEmailData) {
        try {
            // Get member
            const member = await prisma.member.findFirst({
                where: {
                    id: data.memberId,
                    tenantId: data.tenantId,
                },
            });

            if (!member) {
                throw new AppError('Member not found', 404);
            }

            if (!member.email) {
                throw new AppError('Member has no email address', 400);
            }

            // Get sender
            const sender = await prisma.user.findFirst({
                where: { id: data.sentById },
            });

            let status: MessageStatus = 'SENT';
            let errorMessage: string | undefined;

            // Send via SendGrid if enabled
            if (SENDGRID_ENABLED) {
                try {
                    await this.sendViaSendGrid({
                        to: member.email,
                        subject: data.subject,
                        content: data.content,
                        fromName: sender ? `${sender.firstName} ${sender.lastName}` : undefined,
                    });
                    status = 'SENT';
                } catch (error) {
                    logger.error('SendGrid error:', error);
                    status = 'FAILED';
                    errorMessage = error instanceof Error ? error.message : 'Email send failed';
                }
            } else {
                logger.info(
                    `Email simulation: To: ${member.email}, Subject: ${data.subject}`
                );
                // In development/test mode without SendGrid, just log it
                status = 'SENT';
            }

            // Save message to database
            const message = await prisma.message.create({
                data: {
                    tenantId: data.tenantId,
                    memberId: data.memberId,
                    channel: 'EMAIL',
                    direction: 'OUTBOUND',
                    subject: data.subject,
                    content: data.content,
                    sentById: data.sentById,
                    sentByName: sender ? `${sender.firstName} ${sender.lastName}` : undefined,
                    status,
                    errorMessage,
                },
                include: {
                    member: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });

            logger.info(`Email ${status} to ${member.email}`);
            return message;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error sending email:', error);
            throw new AppError('Failed to send email', 500);
        }
    }

    /**
     * Send SMS to a member
     */
    async sendSMS(data: SendSMSData) {
        try {
            // Get member
            const member = await prisma.member.findFirst({
                where: {
                    id: data.memberId,
                    tenantId: data.tenantId,
                },
            });

            if (!member) {
                throw new AppError('Member not found', 404);
            }

            if (!member.phone) {
                throw new AppError('Member has no phone number', 400);
            }

            // Get sender
            const sender = await prisma.user.findFirst({
                where: { id: data.sentById },
            });

            let status: MessageStatus = 'SENT';
            let errorMessage: string | undefined;
            let externalId: string | undefined;

            // Send via Twilio if enabled
            if (TWILIO_ENABLED) {
                try {
                    const twilioResult = await this.sendViaTwilio({
                        to: member.phone,
                        content: data.content,
                    });
                    status = 'SENT';
                    externalId = twilioResult.sid;
                } catch (error) {
                    logger.error('Twilio error:', error);
                    status = 'FAILED';
                    errorMessage = error instanceof Error ? error.message : 'SMS send failed';
                }
            } else {
                logger.info(`SMS simulation: To: ${member.phone}, Content: ${data.content}`);
                // In development/test mode without Twilio, just log it
                status = 'SENT';
            }

            // Save message to database
            const message = await prisma.message.create({
                data: {
                    tenantId: data.tenantId,
                    memberId: data.memberId,
                    channel: 'SMS',
                    direction: 'OUTBOUND',
                    content: data.content,
                    sentById: data.sentById,
                    sentByName: sender ? `${sender.firstName} ${sender.lastName}` : undefined,
                    status,
                    errorMessage,
                    externalId,
                },
                include: {
                    member: {
                        select: {
                            firstName: true,
                            lastName: true,
                            phone: true,
                        },
                    },
                },
            });

            logger.info(`SMS ${status} to ${member.phone}`);
            return message;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error sending SMS:', error);
            throw new AppError('Failed to send SMS', 500);
        }
    }

    /**
     * Get message history for a member
     */
    async getMessageHistory(
        tenantId: string,
        memberId?: string,
        channel?: MessageChannel
    ) {
        try {
            const where: any = { tenantId };
            if (memberId) {
                where.memberId = memberId;
            }
            if (channel) {
                where.channel = channel;
            }

            const messages = await prisma.message.findMany({
                where,
                include: {
                    member: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        },
                    },
                    sentBy: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { sentAt: 'desc' },
                take: 100, // Limit to last 100 messages
            });

            logger.info(`Retrieved ${messages.length} messages`);
            return messages;
        } catch (error) {
            logger.error('Error fetching message history:', error);
            throw new AppError('Failed to fetch message history', 500);
        }
    }

    /**
     * Get communication statistics
     */
    async getCommunicationStats(tenantId: string) {
        try {
            const [totalMessages, emailsSent, smsSent, failedMessages] = await Promise.all([
                prisma.message.count({ where: { tenantId } }),
                prisma.message.count({ where: { tenantId, channel: 'EMAIL' } }),
                prisma.message.count({ where: { tenantId, channel: 'SMS' } }),
                prisma.message.count({ where: { tenantId, status: 'FAILED' } }),
            ]);

            const byChannel = await prisma.message.groupBy({
                by: ['channel', 'status'],
                where: { tenantId },
                _count: { id: true },
            });

            return {
                total: totalMessages,
                emailsSent,
                smsSent,
                failed: failedMessages,
                byChannel,
                servicesEnabled: {
                    sendgrid: SENDGRID_ENABLED,
                    twilio: TWILIO_ENABLED,
                },
            };
        } catch (error) {
            logger.error('Error fetching communication stats:', error);
            throw new AppError('Failed to fetch communication statistics', 500);
        }
    }

    /**
     * Send email via SendGrid
     * @private
     */
    private async sendViaSendGrid(data: {
        to: string;
        subject: string;
        content: string;
        fromName?: string;
    }) {
        if (!SENDGRID_ENABLED) {
            throw new Error('SendGrid not configured');
        }

        try {
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

            const msg = {
                to: data.to,
                from: {
                    email: process.env.SENDGRID_FROM_EMAIL || 'noreply@pathways.app',
                    name: data.fromName || process.env.SENDGRID_FROM_NAME || 'Pathways Tracker',
                },
                subject: data.subject,
                text: data.content,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">${data.subject}</h1>
                        </div>
                        <div style="padding: 30px; background-color: #ffffff;">
                            ${data.content.replace(/\n/g, '<br>')}
                        </div>
                        <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #6B7280;">
                            <p>Sent from Pathways Tracker</p>
                        </div>
                    </div>
                `,
            };

            await sgMail.send(msg);
            logger.info(`SendGrid: Email sent to ${data.to}`);
            return { success: true };
        } catch (error: any) {
            logger.error('SendGrid error:', error);
            throw new Error(`SendGrid failed: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Send SMS via Twilio
     * @private
     */
    private async sendViaTwilio(data: { to: string; content: string }) {
        if (!TWILIO_ENABLED) {
            throw new Error('Twilio not configured');
        }

        try {
            const twilio = require('twilio');
            const client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );

            const message = await client.messages.create({
                body: data.content,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: data.to,
            });

            logger.info(`Twilio: SMS sent to ${data.to}, SID: ${message.sid}`);
            return { sid: message.sid };
        } catch (error: any) {
            logger.error('Twilio error:', error);
            throw new Error(`Twilio failed: ${error.message || 'Unknown error'}`);
        }
    }
}

export default new CommunicationService();
