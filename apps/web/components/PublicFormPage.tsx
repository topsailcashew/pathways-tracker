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
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D2] p-8 max-w-lg mx-auto w-full text-center">
          <h2 className="text-lg font-semibold text-[#14213D] mb-2">Form Unavailable</h2>
          <p className="text-sm text-[#6B6960]">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D2] p-8 max-w-lg mx-auto w-full text-center">
          <IoCheckmarkCircleOutline size={56} className="mx-auto text-[#4F7E50] mb-4" />
          <h2 className="text-lg font-semibold text-[#14213D] mb-2">Thank You!</h2>
          <p className="text-sm text-[#6B6960]">Your response has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  const fields = (form?.fields as FormField[]) || [];

  const inputBase = 'bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]';
  const inputError = 'border-[#B42626]';

  return (
    <div className="min-h-screen bg-[#FAF8F4] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D2] p-8">
          <div className="mb-6">
            <h1 className="text-[2.125rem] font-bold tracking-tight text-[#14213D] leading-tight">{form?.name}</h1>
            {form?.description && (
              <p className="text-sm text-[#6B6960] mt-1">{form.description}</p>
            )}
          </div>

          {error && (
            <div className="bg-[#FBE5E5] border border-[#B42626]/20 text-[#B42626] rounded-lg px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">
                  {field.label}
                  {field.required && <span className="text-[#B42626] ml-1">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.id] || ''}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`${inputBase} resize-none ${validationErrors[field.id] ? inputError : ''}`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.id] || ''}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    className={`${inputBase} ${validationErrors[field.id] ? inputError : ''}`}
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
                      className="rounded border-[#D8D2C2] text-[#FCA311] focus:ring-[#FCA311]"
                    />
                    <span className="text-sm text-[#1F2D52]">
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
                    className={`${inputBase} ${validationErrors[field.id] ? inputError : ''}`}
                  />
                )}

                {validationErrors[field.id] && (
                  <p className="text-xs text-[#B42626]">{validationErrors[field.id]}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#14213D] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#1F2D52] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#9E9D95] mt-4">
          Powered by Pathways Tracker
        </p>
      </div>
    </div>
  );
};

export default PublicFormPage;
