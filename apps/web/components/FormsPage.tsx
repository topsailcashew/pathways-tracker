import React, { useState, useEffect } from 'react';
import {
  IoAddOutline,
  IoTrashOutline,
  IoLinkOutline,
  IoDocumentTextOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoCheckmarkCircleOutline,
  IoCopyOutline,
} from 'react-icons/io5';
import { Form } from '../types';
import { getForms, deleteForm, updateForm } from '../src/api/forms';
import { usePermissions } from '../src/hooks/usePermissions';
import { Permission } from '../src/utils/permissions';
import FormBuilder from './FormBuilder';
import FormSubmissions from './FormSubmissions';

const FormsPage: React.FC = () => {
  const { can } = usePermissions();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'builder' | 'submissions'>('list');
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getForms();
      setForms(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this form? All submissions will be lost.')) return;
    try {
      await deleteForm(id);
      setForms((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete form');
    }
  };

  const handleToggleActive = async (form: Form) => {
    try {
      const updated = await updateForm(form.id, { isActive: !form.isActive });
      setForms((prev) => prev.map((f) => (f.id === form.id ? updated : f)));
    } catch (err: any) {
      setError(err.message || 'Failed to update form');
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/form/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleFormSaved = () => {
    setView('list');
    setEditingForm(null);
    loadForms();
  };

  const handleEditForm = (form: Form) => {
    setEditingForm(form);
    setView('builder');
  };

  const handleViewSubmissions = (formId: string) => {
    setSelectedFormId(formId);
    setView('submissions');
  };

  if (view === 'builder') {
    return (
      <FormBuilder
        form={editingForm}
        onSave={handleFormSaved}
        onCancel={() => {
          setView('list');
          setEditingForm(null);
        }}
      />
    );
  }

  if (view === 'submissions' && selectedFormId) {
    return (
      <FormSubmissions
        formId={selectedFormId}
        onBack={() => {
          setView('list');
          setSelectedFormId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[2.125rem] font-bold tracking-tight text-[#14213D]">Forms</h2>
          <p className="text-sm text-[#6B6960] mt-1">Create forms to collect data from external submissions</p>
        </div>
        {can(Permission.FORM_CREATE) && (
          <button
            onClick={() => {
              setEditingForm(null);
              setView('builder');
            }}
            className="flex items-center gap-2 bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors"
          >
            <IoAddOutline size={18} />
            Create Form
          </button>
        )}
      </div>

      {error && (
        <div className="bg-[#FBE5E5] border border-[#B42626]/20 text-[#B42626] rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#14213D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E0D2] shadow-sm">
          <IoDocumentTextOutline size={48} className="mx-auto text-[#9E9D95] mb-4" />
          <h3 className="text-lg font-semibold text-[#1F2D52] mb-2">No forms yet</h3>
          <p className="text-sm text-[#6B6960] mb-6">Create your first form to start collecting data</p>
          {can(Permission.FORM_CREATE) && (
            <button
              onClick={() => setView('builder')}
              className="bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors"
            >
              Create Form
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-2xl border border-[#E5E0D2] p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#14213D] truncate">{form.name}</h3>
                    <span className="flex items-center gap-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${form.isActive ? 'bg-[#4F7E50]' : 'bg-[#8B8B8B]'}`} />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">
                        {form.isActive ? 'Live' : 'Draft'}
                      </span>
                    </span>
                    {form.targetPathway && (
                      <span className="bg-[#EFEBE0] text-[#6B6960] text-[11px] font-semibold rounded-[4px] px-2 py-0.5">
                        {form.targetPathway === 'NEWCOMER' ? 'Newcomer' : 'New Believer'}
                      </span>
                    )}
                  </div>
                  {form.description && (
                    <p className="text-sm text-[#6B6960] truncate">{form.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#9E9D95]">
                    <span>{form.fields?.length || 0} fields</span>
                    <span>{form._count?.submissions || 0} submissions</span>
                    {form.createdBy && (
                      <span>
                        by {form.createdBy.firstName} {form.createdBy.lastName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyLink(form.slug)}
                    className="flex items-center gap-1.5 bg-white border border-[#D8D2C2] text-[#14213D] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#FAF8F4] transition-colors"
                    title="Copy public link"
                  >
                    {copiedSlug === form.slug ? (
                      <>
                        <IoCheckmarkCircleOutline size={14} />
                        Copied
                      </>
                    ) : (
                      <>
                        <IoCopyOutline size={14} />
                        Share Link
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleViewSubmissions(form.id)}
                    className="flex items-center gap-1.5 bg-white border border-[#D8D2C2] text-[#14213D] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#FAF8F4] transition-colors"
                    title="View submissions"
                  >
                    <IoDocumentTextOutline size={14} />
                    Submissions
                  </button>

                  {can(Permission.FORM_UPDATE) && (
                    <>
                      <button
                        onClick={() => handleToggleActive(form)}
                        className="p-1.5 text-[#9E9D95] hover:text-[#14213D] transition-colors"
                        title={form.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {form.isActive ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                      </button>

                      <button
                        onClick={() => handleEditForm(form)}
                        className="p-1.5 text-[#9E9D95] hover:text-[#14213D] transition-colors"
                        title="Edit form"
                      >
                        <IoLinkOutline size={18} />
                      </button>
                    </>
                  )}

                  {can(Permission.FORM_DELETE) && (
                    <button
                      onClick={() => handleDelete(form.id)}
                      className="p-1.5 text-[#9E9D95] hover:text-[#B42626] transition-colors"
                      title="Delete form"
                    >
                      <IoTrashOutline size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormsPage;
