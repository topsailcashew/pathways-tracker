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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <IoArrowBackOutline size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {form?.name || 'Form'} - Submissions
          </h2>
          <p className="text-sm text-gray-500">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <IoDocumentTextOutline size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No submissions yet</h3>
          <p className="text-sm text-gray-400">
            Share the form link to start collecting responses
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">
                    Submitted
                  </th>
                  {fields.map((field) => (
                    <th
                      key={field.id}
                      className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap"
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
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </td>
                    {fields.map((field) => (
                      <td
                        key={field.id}
                        className="px-4 py-3 text-gray-700 max-w-xs truncate"
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
