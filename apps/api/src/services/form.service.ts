import crypto from 'crypto';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { Pathway } from '@prisma/client';

type MemberMapField =
    | 'firstName' | 'lastName' | 'email' | 'phone'
    | 'dateOfBirth' | 'gender'
    | 'address' | 'city' | 'state' | 'zip' | 'nationality'
    | 'maritalStatus' | 'spouseName' | 'spouseDob' | 'emergencyContact'
    | 'isChurchMember' | 'titheNumber';

interface FormField {
    id: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
    required: boolean;
    placeholder?: string;
    options?: string[];
    mapTo?: MemberMapField;
}

interface CreateFormData {
    name: string;
    description?: string;
    fields: FormField[];
    targetPathway?: 'NEWCOMER' | 'NEW_BELIEVER';
    targetStageId?: string;
}

interface UpdateFormData {
    name?: string;
    description?: string;
    fields?: FormField[];
    isActive?: boolean;
    targetPathway?: 'NEWCOMER' | 'NEW_BELIEVER' | null;
    targetStageId?: string | null;
}

export class FormService {
    async createForm(tenantId: string, createdById: string, data: CreateFormData) {
        try {
            const slug = crypto.randomBytes(9).toString('base64url');

            const form = await prisma.form.create({
                data: {
                    tenantId,
                    createdById,
                    name: data.name,
                    description: data.description || null,
                    fields: data.fields as any,
                    slug,
                    targetPathway: data.targetPathway || null,
                    targetStageId: data.targetStageId || null,
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    _count: {
                        select: { submissions: true },
                    },
                },
            });

            logger.info(`Form created: ${form.id} by user ${createdById}`);
            return form;
        } catch (error) {
            logger.error('Create form error:', error);
            throw error;
        }
    }

    async getForms(tenantId: string) {
        try {
            const forms = await prisma.form.findMany({
                where: { tenantId },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    _count: {
                        select: { submissions: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return forms;
        } catch (error) {
            logger.error('Get forms error:', error);
            throw error;
        }
    }

    async getFormById(id: string, tenantId: string) {
        try {
            const form = await prisma.form.findFirst({
                where: { id, tenantId },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    _count: {
                        select: { submissions: true },
                    },
                },
            });

            if (!form) {
                throw new AppError(404, 'FORM_NOT_FOUND', 'Form not found');
            }

            return form;
        } catch (error) {
            logger.error('Get form error:', error);
            throw error;
        }
    }

    async updateForm(id: string, tenantId: string, data: UpdateFormData) {
        try {
            const existing = await prisma.form.findFirst({
                where: { id, tenantId },
            });

            if (!existing) {
                throw new AppError(404, 'FORM_NOT_FOUND', 'Form not found');
            }

            const updateData: any = {};
            if (data.name !== undefined) updateData.name = data.name;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.fields !== undefined) updateData.fields = data.fields;
            if (data.isActive !== undefined) updateData.isActive = data.isActive;
            if (data.targetPathway !== undefined) updateData.targetPathway = data.targetPathway;
            if (data.targetStageId !== undefined) updateData.targetStageId = data.targetStageId;

            const form = await prisma.form.update({
                where: { id },
                data: updateData,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    _count: {
                        select: { submissions: true },
                    },
                },
            });

            logger.info(`Form updated: ${id}`);
            return form;
        } catch (error) {
            logger.error('Update form error:', error);
            throw error;
        }
    }

    async deleteForm(id: string, tenantId: string) {
        try {
            const existing = await prisma.form.findFirst({
                where: { id, tenantId },
            });

            if (!existing) {
                throw new AppError(404, 'FORM_NOT_FOUND', 'Form not found');
            }

            await prisma.form.delete({
                where: { id },
            });

            logger.info(`Form deleted: ${id}`);
        } catch (error) {
            logger.error('Delete form error:', error);
            throw error;
        }
    }

    async getFormBySlug(slug: string) {
        try {
            const form = await prisma.form.findUnique({
                where: { slug },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    fields: true,
                    slug: true,
                    isActive: true,
                },
            });

            if (!form) {
                throw new AppError(404, 'FORM_NOT_FOUND', 'Form not found');
            }

            if (!form.isActive) {
                throw new AppError(410, 'FORM_INACTIVE', 'This form is no longer accepting submissions');
            }

            return form;
        } catch (error) {
            logger.error('Get form by slug error:', error);
            throw error;
        }
    }

    async submitForm(slug: string, data: Record<string, any>) {
        try {
            const form = await prisma.form.findUnique({
                where: { slug },
            });

            if (!form) {
                throw new AppError(404, 'FORM_NOT_FOUND', 'Form not found');
            }

            if (!form.isActive) {
                throw new AppError(410, 'FORM_INACTIVE', 'This form is no longer accepting submissions');
            }

            // Validate submission data against field definitions
            const fields = form.fields as unknown as FormField[];
            const errors: string[] = [];

            for (const field of fields) {
                const value = data[field.id];

                if (field.required && (value === undefined || value === null || value === '')) {
                    errors.push(`${field.label} is required`);
                    continue;
                }

                if (value !== undefined && value !== null && value !== '') {
                    switch (field.type) {
                        case 'email':
                            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
                                errors.push(`${field.label} must be a valid email`);
                            }
                            break;
                        case 'number':
                            if (isNaN(Number(value))) {
                                errors.push(`${field.label} must be a number`);
                            }
                            break;
                        case 'select':
                            if (field.options && !field.options.includes(String(value))) {
                                errors.push(`${field.label} has an invalid selection`);
                            }
                            break;
                    }
                }
            }

            if (errors.length > 0) {
                throw new AppError(400, 'VALIDATION_ERROR', 'Submission validation failed', errors);
            }

            // Ensure form has pathway/stage targeting configured
            if (!form.targetPathway || !form.targetStageId) {
                throw new AppError(400, 'FORM_MISSING_TARGET', 'This form is not configured with a pathway and stage. Please contact the administrator.');
            }

            // Build member data from mapped fields
            const memberData: Record<string, any> = {
                tenantId: form.tenantId,
                pathway: form.targetPathway as Pathway,
                currentStageId: form.targetStageId,
                createdById: form.createdById,
            };

            for (const field of fields) {
                if (field.mapTo && data[field.id] !== undefined && data[field.id] !== '') {
                    const value = data[field.id];
                    switch (field.mapTo) {
                        case 'email':
                            memberData.email = String(value).toLowerCase();
                            break;
                        case 'dateOfBirth':
                        case 'spouseDob':
                            memberData[field.mapTo] = new Date(value);
                            break;
                        case 'gender':
                            memberData.gender = String(value).toUpperCase();
                            break;
                        case 'maritalStatus':
                            memberData.maritalStatus = String(value).toUpperCase();
                            break;
                        case 'isChurchMember':
                            memberData.isChurchMember = Boolean(value);
                            break;
                        default:
                            memberData[field.mapTo] = String(value);
                    }
                }
            }

            if (!memberData.firstName || !memberData.lastName) {
                // Missing name mapping - still save submission, skip member creation
                logger.warn(`Form ${form.id} missing firstName/lastName in submission. Skipping member creation.`);
                const submission = await prisma.formSubmission.create({
                    data: {
                        formId: form.id,
                        data: data as any,
                    },
                });
                logger.info(`Form submission created: ${submission.id} for form ${form.id} (member creation skipped)`);
                return submission;
            }

            // Auto-generate photo URL
            memberData.photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                memberData.firstName + ' ' + memberData.lastName
            )}&background=random`;

            // Create both submission and member in a transaction
            const result = await prisma.$transaction(async (tx) => {
                const submission = await tx.formSubmission.create({
                    data: {
                        formId: form.id,
                        data: data as any,
                    },
                });

                const member = await tx.member.create({
                    data: memberData as any,
                });

                await tx.note.create({
                    data: {
                        memberId: member.id,
                        content: `[System] Member created via form submission: "${form.name}"`,
                        isSystem: true,
                        createdById: form.createdById,
                    },
                });

                await tx.tenant.update({
                    where: { id: form.tenantId },
                    data: { memberCount: { increment: 1 } },
                });

                logger.info(`Form submission ${submission.id} created member ${member.id} for form ${form.id}`);
                return submission;
            });

            return result;
        } catch (error) {
            logger.error('Submit form error:', error);
            throw error;
        }
    }

    async getSubmissions(formId: string, tenantId: string) {
        try {
            // Verify form belongs to tenant
            const form = await prisma.form.findFirst({
                where: { id: formId, tenantId },
            });

            if (!form) {
                throw new AppError(404, 'FORM_NOT_FOUND', 'Form not found');
            }

            const submissions = await prisma.formSubmission.findMany({
                where: { formId },
                orderBy: { submittedAt: 'desc' },
            });

            return { form, submissions };
        } catch (error) {
            logger.error('Get submissions error:', error);
            throw error;
        }
    }
}

export default new FormService();
