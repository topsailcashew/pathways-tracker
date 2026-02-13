import { apiClient, handleApiError } from './client';
import { Form, FormField, FormSubmission } from '../../types';

export interface CreateFormData {
  name: string;
  description?: string;
  fields: FormField[];
  targetPathway: 'NEWCOMER' | 'NEW_BELIEVER';
  targetStageId: string;
}

export interface UpdateFormData {
  name?: string;
  description?: string;
  fields?: FormField[];
  isActive?: boolean;
  targetPathway?: 'NEWCOMER' | 'NEW_BELIEVER' | null;
  targetStageId?: string | null;
}

// Get all forms for current tenant
export const getForms = async (): Promise<Form[]> => {
  try {
    const response = await apiClient.get<{ data: Form[]; meta: any }>('/api/forms');
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get form by ID
export const getForm = async (id: string): Promise<Form> => {
  try {
    const response = await apiClient.get<{ data: Form; meta: any }>(`/api/forms/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Create a new form
export const createForm = async (data: CreateFormData): Promise<Form> => {
  try {
    const response = await apiClient.post<{ data: Form; meta: any }>('/api/forms', data);
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Update a form
export const updateForm = async (id: string, data: UpdateFormData): Promise<Form> => {
  try {
    const response = await apiClient.patch<{ data: Form; meta: any }>(`/api/forms/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Delete a form
export const deleteForm = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/forms/${id}`);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get submissions for a form
export const getFormSubmissions = async (formId: string): Promise<{ form: Form; submissions: FormSubmission[] }> => {
  try {
    const response = await apiClient.get<{ data: { form: Form; submissions: FormSubmission[] }; meta: any }>(
      `/api/forms/${formId}/submissions`
    );
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get public form by slug (no auth required)
export const getPublicForm = async (slug: string): Promise<Form> => {
  try {
    const response = await apiClient.get<{ data: Form; meta: any }>(`/api/forms/public/${slug}`);
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Submit a public form (no auth required)
export const submitPublicForm = async (slug: string, data: Record<string, any>): Promise<FormSubmission> => {
  try {
    const response = await apiClient.post<{ data: FormSubmission; meta: any }>(
      `/api/forms/public/${slug}/submit`,
      data
    );
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
