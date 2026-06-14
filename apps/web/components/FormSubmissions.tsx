import React, { useState, useEffect } from 'react';
import { IoArrowBackOutline, IoDocumentTextOutline } from 'react-icons/io5';
import { Form, FormField, FormSubmission } from '../types';
import { getFormSubmissions } from '../src/api/forms';

interface FormSubmissionsProps {
  formId: string;
  onBack: () => void;
}

const FormSubmissions: React.FC<FormSubmissionsProps> = ({ formId, onBack }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getFormSubmissions(formId);
        setForm(result.form);
        setSubmissions(result.submissions);
      } catch (err: any) {
        setError(err.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [formId]);

  const fields: FormField[] = (form?.fields as FormField[]) || [];

  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined || value === '') return '-';
    if (type === 'checkbox') return value ? 'Yes' : 'No';
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="bg-white border border-[#D8D2C2] text-[#14213D] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#FAF8F4] transition-colors flex items-center gap-2"
        >
          <IoArrowBackOutline size={16} /> Back
        </button>
        <div>
          <h2 className="text-[2.125rem] font-bold tracking-tight text-[#14213D]">
            {form?.name || 'Form'} — Submissions
          </h2>
          <p className="text-sm text-[#6B6960] mt-1">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-[#FBE5E5] border border-[#B42626]/20 text-[#B42626] rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E0D2] shadow-sm">
          <IoDocumentTextOutline size={48} className="mx-auto text-[#9E9D95] mb-4" />
          <h3 className="text-lg font-semibold text-[#1F2D52] mb-2">No submissions yet</h3>
          <p className="text-sm text-[#6B6960]">
            Share the form link to start collecting responses
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] whitespace-nowrap border-b border-[#E5E0D2]">
                    Submitted
                  </th>
                  {fields.map((field) => (
                    <th
                      key={field.id}
                      className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] whitespace-nowrap border-b border-[#E5E0D2]"
                    >
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="border-b border-[#E5E0D2] hover:bg-[#FAF8F4] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#6B6960] whitespace-nowrap">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </td>
                    {fields.map((field) => (
                      <td
                        key={field.id}
                        className="px-4 py-3 text-[#1F2D52] max-w-xs truncate"
                      >
                        {formatValue(submission.data?.[field.id], field.type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormSubmissions;
