/**
 * Members Routes (Firestore)
 * CRUD operations for members with RBAC
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permissions.middleware.js';
import { Permission } from '../config/permissions.js';
import { getFirestore, Collections } from '../config/firestore.js';
import { Member, PathwayType, MemberStatus } from '../types/models.js';
import * as authService from '../services/auth.service.js';

const router = Router();

// All member routes require authentication
router.use(authenticate);

// Validation schemas
const createMemberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string(),
  pathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']),
  currentStageId: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateMemberSchema = createMemberSchema.partial();

const idParamSchema = z.object({
  id: z.string(),
});

const listMembersQuerySchema = z.object({
  pathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']).optional(),
  status: z.enum(['ACTIVE', 'INTEGRATED', 'INACTIVE']).optional(),
  search: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

/**
 * GET /api/members
 * List members (filtered by assignment for volunteers, all for admins)
 */
router.get('/', requirePermission(Permission.MEMBER_VIEW), validateQuery(listMembersQuerySchema), async (req, res, next) => {
  try {
    const { pathway, status, search, limit = '100', offset = '0' } = req.query as any;
    const db = getFirestore();

    // Check if user can view all members or only assigned ones
    const canViewAll = authService.hasPermission(req.user!.role, Permission.MEMBER_VIEW_ALL);

    // Build query
    let query = db.collection(Collections.MEMBERS);

    // Filter by assignment if user can't view all
    if (!canViewAll) {
      query = query.where('assignedToId', '==', req.user!.userId) as any;
    }

    // Apply filters
    if (pathway) {
      query = query.where('pathway', '==', PathwayType[pathway]) as any;
    }

    if (status) {
      query = query.where('status', '==', MemberStatus[status]) as any;
    }

    // Execute query
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    let members = snapshot.docs.map((doc) => doc.data() as Member);

    // Apply search filter (client-side for now - Firestore doesn't support text search)
    if (search) {
      const searchLower = search.toLowerCase();
      members = members.filter((member) => {
        return (
          member.firstName?.toLowerCase().includes(searchLower) ||
          member.lastName?.toLowerCase().includes(searchLower) ||
          member.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    res.json({ members, total: members.length });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/members/:id
 * Get a single member
 */
router.get('/:id', requirePermission(Permission.MEMBER_VIEW), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const db = getFirestore();
    const memberDoc = await db.collection(Collections.MEMBERS).doc(req.params.id).get();

    if (!memberDoc.exists) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberDoc.data() as Member;

    // Check if user can view this member
    const canViewAll = authService.hasPermission(req.user!.role, Permission.MEMBER_VIEW_ALL);
    if (!canViewAll && member.assignedToId !== req.user!.userId) {
      return res.status(403).json({ error: 'You can only view members assigned to you' });
    }

    res.json(member);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/members
 * Create a new member
 */
router.post('/', requirePermission(Permission.MEMBER_CREATE), validateBody(createMemberSchema), async (req, res, next) => {
  try {
    const db = getFirestore();
    const memberRef = db.collection(Collections.MEMBERS).doc();

    const now = new Date().toISOString();
    const memberData: Member = {
      id: memberRef.id,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      pathway: PathwayType[req.body.pathway],
      currentStageId: req.body.currentStageId,
      status: MemberStatus.ACTIVE,
      assignedToId: req.user!.userId, // Assign to creator by default
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      maritalStatus: req.body.maritalStatus,
      tags: req.body.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    await memberRef.set(memberData);

    res.status(201).json(memberData);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/members/:id
 * Update a member
 */
router.put('/:id', requirePermission(Permission.MEMBER_UPDATE), validateParams(idParamSchema), validateBody(updateMemberSchema), async (req, res, next) => {
  try {
    const db = getFirestore();
    const memberRef = db.collection(Collections.MEMBERS).doc(req.params.id);
    const memberDoc = await memberRef.get();

    if (!memberDoc.exists) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberDoc.data() as Member;

    // Check if user can update this member
    const canViewAll = authService.hasPermission(req.user!.role, Permission.MEMBER_VIEW_ALL);
    if (!canViewAll && member.assignedToId !== req.user!.userId) {
      return res.status(403).json({ error: 'You can only update members assigned to you' });
    }

    // Update member
    const updateData: any = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    // Convert pathway enum if provided
    if (req.body.pathway) {
      updateData.pathway = PathwayType[req.body.pathway];
    }

    // Convert status enum if provided
    if (req.body.status) {
      updateData.status = MemberStatus[req.body.status];
    }

    await memberRef.update(updateData);

    // Get updated member
    const updatedMemberDoc = await memberRef.get();
    const updatedMember = updatedMemberDoc.data() as Member;

    res.json(updatedMember);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/members/:id
 * Delete a member
 */
router.delete('/:id', requirePermission(Permission.MEMBER_DELETE), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const db = getFirestore();
    const memberRef = db.collection(Collections.MEMBERS).doc(req.params.id);
    const memberDoc = await memberRef.get();

    if (!memberDoc.exists) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberDoc.data() as Member;

    // Check if user can delete this member
    const canViewAll = authService.hasPermission(req.user!.role, Permission.MEMBER_VIEW_ALL);
    if (!canViewAll && member.assignedToId !== req.user!.userId) {
      return res.status(403).json({ error: 'You can only delete members assigned to you' });
    }

    await memberRef.delete();

    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/members/:id/notes
 * Add a note to a member
 */
router.post('/:id/notes', requirePermission(Permission.MEMBER_UPDATE), validateParams(idParamSchema), validateBody(z.object({ content: z.string() })), async (req, res, next) => {
  try {
    const db = getFirestore();

    // Verify member exists
    const memberDoc = await db.collection(Collections.MEMBERS).doc(req.params.id).get();
    if (!memberDoc.exists) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberDoc.data() as Member;

    // Check if user can add notes to this member
    const canViewAll = authService.hasPermission(req.user!.role, Permission.MEMBER_VIEW_ALL);
    if (!canViewAll && member.assignedToId !== req.user!.userId) {
      return res.status(403).json({ error: 'You can only add notes to members assigned to you' });
    }

    // Create note
    const noteRef = db.collection(Collections.NOTES).doc();
    const now = new Date().toISOString();
    const noteData = {
      id: noteRef.id,
      content: req.body.content,
      memberId: req.params.id,
      createdById: req.user!.userId,
      createdAt: now,
      updatedAt: now,
    };

    await noteRef.set(noteData);

    res.status(201).json(noteData);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/members/:id/assign
 * Assign member to a user (Team Leaders and Admins only)
 */
router.put(
  '/:id/assign',
  requirePermission(Permission.MEMBER_ASSIGN),
  validateParams(idParamSchema),
  validateBody(z.object({ assignedToId: z.string() })),
  async (req, res, next) => {
    try {
      const db = getFirestore();
      const memberRef = db.collection(Collections.MEMBERS).doc(req.params.id);
      const memberDoc = await memberRef.get();

      if (!memberDoc.exists) {
        return res.status(404).json({ error: 'Member not found' });
      }

      // Verify target user exists
      const targetUser = await authService.getUserById(req.body.assignedToId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }

      // Update assignment
      await memberRef.update({
        assignedToId: req.body.assignedToId,
        updatedAt: new Date().toISOString(),
      });

      // Get updated member
      const updatedMemberDoc = await memberRef.get();
      const updatedMember = updatedMemberDoc.data() as Member;

      res.json(updatedMember);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
