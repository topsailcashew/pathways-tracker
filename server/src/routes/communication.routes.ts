/**
 * Communication Routes
 * Send emails and SMS messages
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import * as emailService from '../services/email.service.js';
import * as smsService from '../services/sms.service.js';
import { prisma } from '../config/database.js';

const router = Router();

// All communication routes require authentication
router.use(authenticate);

// Validation schemas
const sendEmailSchema = z.object({
  memberId: z.string().cuid(),
  subject: z.string(),
  message: z.string(),
});

const sendSMSSchema = z.object({
  memberId: z.string().cuid(),
  message: z.string(),
});

/**
 * POST /api/communication/email
 * Send an email to a member
 */
router.post('/email', validateBody(sendEmailSchema), async (req, res, next) => {
  try {
    const { memberId, subject, message } = req.body;

    // Get member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Send email
    const success = await emailService.sendFollowUpEmail(
      member.email,
      member.firstName,
      message
    );

    if (success) {
      // Log message
      await prisma.message.create({
        data: {
          channel: 'EMAIL',
          direction: 'OUTBOUND',
          content: message,
          sentBy: req.user!.email,
          memberId,
        },
      });
    }

    res.json({ success });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/communication/sms
 * Send an SMS to a member
 */
router.post('/sms', validateBody(sendSMSSchema), async (req, res, next) => {
  try {
    const { memberId, message } = req.body;

    // Get member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Send SMS
    const success = await smsService.sendFollowUpSMS(member.phone, message);

    if (success) {
      // Log message
      await prisma.message.create({
        data: {
          channel: 'SMS',
          direction: 'OUTBOUND',
          content: message,
          sentBy: req.user!.email,
          memberId,
        },
      });
    }

    res.json({ success });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/communication/history/:memberId
 * Get communication history for a member
 */
router.get('/history/:memberId', async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: { memberId: req.params.memberId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

export default router;
