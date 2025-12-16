/**
 * Members Routes
 * CRUD operations for members
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';

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
  id: z.string().cuid(),
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
 * List all members with filters
 */
router.get('/', validateQuery(listMembersQuerySchema), async (req, res, next) => {
  try {
    const { pathway, status, search, limit, offset } = req.query as any;

    const where: any = {};

    if (pathway) {
      where.pathway = pathway;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const members = await prisma.member.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: true,
        notes: true,
        messages: true,
        tags: true,
      },
      take: limit ? parseInt(limit) : 100,
      skip: offset ? parseInt(offset) : 0,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.member.count({ where });

    res.json({ members, total });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/members/:id
 * Get a single member
 */
router.get('/:id', validateParams(idParamSchema), async (req, res, next) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: true,
        tasks: true,
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
        },
        resources: true,
        tags: true,
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
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
router.post('/', validateBody(createMemberSchema), async (req, res, next) => {
  try {
    const { tags, ...memberData } = req.body;

    const member = await prisma.member.create({
      data: {
        ...memberData,
        assignedToId: req.user!.userId,
        tags: tags
          ? {
              connectOrCreate: tags.map((tag: string) => ({
                where: { name: tag },
                create: { name: tag },
              })),
            }
          : undefined,
      },
      include: {
        assignedTo: true,
        tags: true,
      },
    });

    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/members/:id
 * Update a member
 */
router.put('/:id', validateParams(idParamSchema), validateBody(updateMemberSchema), async (req, res, next) => {
  try {
    const { tags, ...memberData } = req.body;

    const member = await prisma.member.update({
      where: { id: req.params.id },
      data: {
        ...memberData,
        tags: tags
          ? {
              set: [],
              connectOrCreate: tags.map((tag: string) => ({
                where: { name: tag },
                create: { name: tag },
              })),
            }
          : undefined,
      },
      include: {
        assignedTo: true,
        tags: true,
      },
    });

    res.json(member);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/members/:id
 * Delete a member
 */
router.delete('/:id', validateParams(idParamSchema), async (req, res, next) => {
  try {
    await prisma.member.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/members/:id/notes
 * Add a note to a member
 */
router.post('/:id/notes', validateParams(idParamSchema), validateBody(z.object({ content: z.string() })), async (req, res, next) => {
  try {
    const note = await prisma.note.create({
      data: {
        content: req.body.content,
        memberId: req.params.id,
      },
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

export default router;
