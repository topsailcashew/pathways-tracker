/**
 * Communication Routes (Firestore)
 * Send emails and SMS messages with RBAC
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permissions.middleware.js';
import { Permission } from '../config/permissions.js';
import * as emailService from '../services/email.service.js';
import * as smsService from '../services/sms.service.js';
import { getFirestore, Collections } from '../config/firestore.js';
import { Member, Message, MessageChannel, MessageDirection } from '../types/models.js';
import * as authService from '../services/auth.service.js';

const router = Router();

// All communication routes require authentication
router.use(authenticate);

// Validation schemas
const sendEmailSchema = z.object({
  memberId: z.string(),
  subject: z.string(),
  message: z.string(),
});

const sendSMSSchema = z.object({
  memberId: z.string(),
  message: z.string(),
});

const memberIdParamSchema = z.object({
  memberId: z.string(),
});

/**
 * POST /api/communication/email
 * Send an email to a member
 */
router.post('/email', requirePermission(Permission.COMM_SEND_EMAIL), validateBody(sendEmailSchema), async (req, res, next) => {
  try {
    const { memberId, subject, message } = req.body;
    const db = getFirestore();

    // Get member
    const memberDoc = await db.collection(Collections.MEMBERS).doc(memberId).get();

    if (!memberDoc.exists) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberDoc.data() as Member;

    // Check if user can send email to this member
    const canViewAll = authService.hasPermission(req.user!.role, Permission.MEMBER_VIEW_ALL);
    if (!canViewAll && member.assignedToId !== req.user!.userId) {
      return res.status(403).json({ error: 'You can only send messages to members assigned to you' });
    }

    // Send email
    const success = await emailService.sendFollowUpEmail(
      member.email,
      member.firstName,
      message
    );

    if (success) {
      // Log message
      const messageRef = db.collection(Collections.MESSAGES).doc();
      const now = new Date().toISOString();
      const messageData: Message = {
        id: messageRef.id,
        channel: MessageChannel.EMAIL,
        direction: MessageDirection.OUTBOUND,
        content: message,
        subject,
        sentBy: req.user!.email,
        sentById: req.user!.userId,
        memberId,
        createdAt: now,
        updatedAt: now,
      };

      await messageRef.set(messageData);
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
router.post('/sms', requirePermission(Permission.COMM_SEND_SMS), validateBody(sendSMSSchema), async (req, res, next) => {
  try {
    const { memberId, message } = req.body;
    const db = getFirestore();

    // Get member
    const memberDoc = await db.collection(Collections.MEMBERS).doc(memberId).get();

    if (!memberDoc.exists) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberDoc.data() as Member;

    // Check if user can send SMS to this member
    const canViewAll = authService.hasPermission(req.user!.role, Permission.MEMBER_VIEW_ALL);
    if (!canViewAll && member.assignedToId !== req.user!.userId) {
      return res.status(403).json({ error: 'You can only send messages to members assigned to you' });
    }

    // Send SMS
    const success = await smsService.sendFollowUpSMS(member.phone, message);

    if (success) {
      // Log message
      const messageRef = db.collection(Collections.MESSAGES).doc();
      const now = new Date().toISOString();
      const messageData: Message = {
        id: messageRef.id,
        channel: MessageChannel.SMS,
        direction: MessageDirection.OUTBOUND,
        content: message,
        sentBy: req.user!.email,
        sentById: req.user!.userId,
        memberId,
        createdAt: now,
        updatedAt: now,
      };

      await messageRef.set(messageData);
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
router.get(
  '/history/:memberId',
  requirePermission(Permission.COMM_VIEW_HISTORY),
  validateParams(memberIdParamSchema),
  async (req, res, next) => {
    try {
      const db = getFirestore();

      // Get member to check ownership
      const memberDoc = await db.collection(Collections.MEMBERS).doc(req.params.memberId).get();

      if (!memberDoc.exists) {
        return res.status(404).json({ error: 'Member not found' });
      }

      const member = memberDoc.data() as Member;

      // Check if user can view history for this member
      const canViewAllHistory = authService.hasPermission(req.user!.role, Permission.COMM_VIEW_ALL_HISTORY);
      if (!canViewAllHistory && member.assignedToId !== req.user!.userId) {
        return res.status(403).json({ error: 'You can only view communication history for members assigned to you' });
      }

      // Get messages
      const messagesSnapshot = await db
        .collection(Collections.MESSAGES)
        .where('memberId', '==', req.params.memberId)
        .orderBy('createdAt', 'desc')
        .get();

      const messages = messagesSnapshot.docs.map((doc) => doc.data() as Message);

      res.json(messages);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
