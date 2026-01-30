import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import formService from '../services/form.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/permissions.middleware';
import { validateBody } from '../middleware/validation.middleware';

const router = Router();

// Field definition schema for validation
const fieldSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['text', 'email', 'phone', 'number', 'date', 'select', 'textarea', 'checkbox']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
    mapTo: z.enum([
        'firstName', 'lastName', 'email', 'phone',
        'dateOfBirth', 'gender',
        'address', 'city', 'state', 'zip', 'nationality',
        'maritalStatus', 'spouseName', 'spouseDob', 'emergencyContact',
        'isChurchMember', 'titheNumber',
    ]).optional(),
});

const createFormSchema = z.object({
    name: z.string().min(1, 'Form name is required'),
    description: z.string().optional(),
    fields: z.array(fieldSchema).min(1, 'At least one field is required'),
    targetPathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']),
    targetStageId: z.string().min(1, 'Target stage is required'),
});

const updateFormSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    fields: z.array(fieldSchema).min(1).optional(),
    isActive: z.boolean().optional(),
    targetPathway: z.enum(['NEWCOMER', 'NEW_BELIEVER']).nullable().optional(),
    targetStageId: z.string().nullable().optional(),
});

const submitFormSchema = z.object({}).passthrough(); // Allow any key-value pairs

// ========================================
// PUBLIC ROUTES (no auth required)
// ========================================

// GET /api/forms/public/:slug - Get form by slug
router.get(
    '/public/:slug',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const form = await formService.getFormBySlug(req.params.slug);

            res.status(200).json({
                data: form,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/forms/public/:slug/submit - Submit form
router.post(
    '/public/:slug/submit',
    validateBody(submitFormSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const submission = await formService.submitForm(req.params.slug, req.body);

            res.status(201).json({
                data: submission,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// ========================================
// AUTHENTICATED ROUTES
// ========================================

// All routes below require authentication
router.use(authenticate);

// POST /api/forms - Create form
router.post(
    '/',
    requirePermission(Permission.FORM_CREATE),
    validateBody(createFormSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const form = await formService.createForm(
                req.user!.tenantId,
                req.user!.userId,
                req.body
            );

            res.status(201).json({
                data: form,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/forms - List forms
router.get(
    '/',
    requirePermission(Permission.FORM_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const forms = await formService.getForms(req.user!.tenantId);

            res.status(200).json({
                data: forms,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/forms/:id - Get form detail
router.get(
    '/:id',
    requirePermission(Permission.FORM_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const form = await formService.getFormById(req.params.id, req.user!.tenantId);

            res.status(200).json({
                data: form,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/forms/:id - Update form
router.patch(
    '/:id',
    requirePermission(Permission.FORM_UPDATE),
    validateBody(updateFormSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const form = await formService.updateForm(
                req.params.id,
                req.user!.tenantId,
                req.body
            );

            res.status(200).json({
                data: form,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/forms/:id - Delete form
router.delete(
    '/:id',
    requirePermission(Permission.FORM_DELETE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await formService.deleteForm(req.params.id, req.user!.tenantId);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/forms/:id/submissions - Get submissions
router.get(
    '/:id/submissions',
    requirePermission(Permission.FORM_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await formService.getSubmissions(req.params.id, req.user!.tenantId);

            res.status(200).json({
                data: result,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
