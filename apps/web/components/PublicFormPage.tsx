import React, { useState, useEffect } from 'react';
import { IoCheckmarkCircleOutline } from 'react-icons/io5';
import { Form, FormField } from '../types';
import { getPublicForm, submitPublicForm } from '../src/api/forms';

interface PublicFormPageProps {
  slug: string;
}

const PublicFormPage: React.FC<PublicFormPageProps> = ({ slug }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicForm(slug);
        setForm(data);
        // Initialize form data with empty values
        const initial: Record<string, any> = {};
        ((data.fields as FormField[]) || []).forEach((field) => {
          initial[field.id] = field.type === 'checkbox' ? false : '';
        });
        setFormData(initial);
      } catch (err: any) {
        setError(err.message || 'Form not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const fields = (form?.fields as FormField[]) || [];

    for (const field of fields) {
      const value = formData[field.id];

      if (field.required && (value === undefined || value === null || value === '' || value === false)) {
        errors[field.id] = `${field.label} is required`;
        continue;
      }

      if (value && field.type === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          errors[field.id] = 'Please enter a valid email address';
        }
      }

      if (value && field.type === 'number') {
        if (isNaN(Number(value))) {
          errors[field.id] = 'Please enter a valid number';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setError(null);
      await submitPublicForm(slug, formData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Form Unavailable</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <IoCheckmarkCircleOutline size={56} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-sm text-gray-500">Your response has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  const fields = (form?.fields as FormField[]) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{form?.name}</h1>
            {form?.description && (
              <p className="text-sm text-gray-500 mt-2">{form.description}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.id] || ''}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${
                      validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.id] || ''}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                      validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">{field.placeholder || 'Select...'}</option>
                    {(field.options || []).map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[field.id] || false}
                      onChange={(e) => updateField(field.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      {field.placeholder || field.label}
                    </span>
                  </label>
                ) : (
                  <input
                    type={
                      field.type === 'phone'
                        ? 'tel'
                        : field.type === 'email'
                        ? 'email'
                        : field.type === 'number'
                        ? 'number'
                        : field.type === 'date'
                        ? 'date'
                        : 'text'
                    }
                    value={formData[field.id] || ''}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                      validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                )}

                {validationErrors[field.id] && (
                  <p className="text-xs text-red-500">{validationErrors[field.id]}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by Pathways Tracker
        </p>
      </div>
    </div>
  );
};

export default PublicFormPage;
