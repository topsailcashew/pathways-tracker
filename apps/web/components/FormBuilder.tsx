import React, { useState, useMemo, useEffect } from 'react';
import {
  IoArrowBackOutline,
  IoSaveOutline,
  IoLockClosedOutline,
} from 'react-icons/io5';
import { Form, FormField } from '../types';
import { createForm, updateForm } from '../src/api/forms';
import { getStages, Stage as ApiStage } from '../src/api/stages';
import { MEMBER_FIELDS, MEMBER_FIELD_CATEGORIES as CATEGORIES } from '../constants/memberFields';

interface FormBuilderProps {
  form: Form | null;
  onSave: () => void;
  onCancel: () => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ form, onSave, onCancel }) => {
  const [name, setName] = useState(form?.name || '');
  const [description, setDescription] = useState(form?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetPathway, setTargetPathway] = useState<'NEWCOMER' | 'NEW_BELIEVER'>(
    form?.targetPathway || 'NEWCOMER'
  );
  const [targetStageId, setTargetStageId] = useState<string>(form?.targetStageId || '');
  const [availableStages, setAvailableStages] = useState<ApiStage[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);

  // Fetch stages from the API (real database UUIDs)
  useEffect(() => {
    const loadStages = async () => {
      try {
        setLoadingStages(true);
        const stages = await getStages(targetPathway);
        setAvailableStages(stages.sort((a, b) => a.order - b.order));
      } catch {
        setAvailableStages([]);
      } finally {
        setLoadingStages(false);
      }
    };
    loadStages();
  }, [targetPathway]);

  // Derive initial selected/required fields from existing form
  const initialSelected = useMemo(() => {
    const set = new Set<string>();
    // Always include locked fields
    MEMBER_FIELDS.filter(mf => mf.locked).forEach(mf => set.add(mf.key));
    if (form?.fields) {
      for (const field of form.fields) {
        if (field.mapTo) {
          set.add(field.mapTo);
        }
      }
    }
    return set;
  }, [form]);

  const initialRequired = useMemo(() => {
    const set = new Set<string>();
    // Locked fields are always required
    MEMBER_FIELDS.filter(mf => mf.locked).forEach(mf => set.add(mf.key));
    if (form?.fields) {
      for (const field of form.fields) {
        if (field.mapTo && field.required) {
          set.add(field.mapTo);
        }
      }
    }
    return set;
  }, [form]);

  const [selectedFields, setSelectedFields] = useState<Set<string>>(initialSelected);
  const [requiredFields, setRequiredFields] = useState<Set<string>>(initialRequired);

  const handlePathwayChange = (value: string) => {
    setTargetPathway(value as 'NEWCOMER' | 'NEW_BELIEVER');
    setTargetStageId('');
  };

  const toggleField = (key: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Also remove from required
        setRequiredFields(r => {
          const nr = new Set(r);
          nr.delete(key);
          return nr;
        });
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleRequired = (key: string) => {
    setRequiredFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Build FormField[] from selected member fields
  const buildFields = (): FormField[] => {
    return MEMBER_FIELDS
      .filter(mf => selectedFields.has(mf.key))
      .map(mf => ({
        id: mf.key,
        label: mf.label,
        type: mf.type,
        required: mf.locked || requiredFields.has(mf.key),
        placeholder: '',
        options: mf.options,
        mapTo: mf.key,
      }));
  };

  const previewFields = buildFields();

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Form name is required');
      return;
    }

    if (!targetStageId) {
      setError('Please select a starting stage');
      return;
    }

    const fields = buildFields();
    if (fields.length === 0) {
      setError('At least one field must be selected');
      return;
    }

    try {
      setSaving(true);
      if (form) {
        await updateForm(form.id, {
          name,
          description,
          fields,
          targetPathway,
          targetStageId,
        });
      } else {
        await createForm({
          name,
          description,
          fields,
          targetPathway,
          targetStageId,
        });
      }
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <IoArrowBackOutline size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          {form ? 'Edit Form' : 'Create Form'}
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Configuration */}
        <div className="space-y-6">
          {/* Form Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700">Form Details</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Form Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Newcomer Registration"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description shown on the form"
                rows={2}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

          {/* Pathway & Stage */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700">Pathway & Stage</h3>
            <p className="text-xs text-gray-400">
              Every submission creates a member record in the selected pathway and stage.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Pathway
              </label>
              <select
                value={targetPathway}
                onChange={(e) => handlePathwayChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value="NEWCOMER">Newcomer</option>
                <option value="NEW_BELIEVER">New Believer</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Starting Stage
              </label>
              <select
                value={targetStageId}
                onChange={(e) => setTargetStageId(e.target.value)}
                disabled={loadingStages}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="">{loadingStages ? 'Loading stages...' : 'Select a stage...'}</option>
                {availableStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            {targetStageId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  Each submission will create a member in the{' '}
                  <strong>{targetPathway === 'NEWCOMER' ? 'Newcomer' : 'New Believer'}</strong>{' '}
                  pathway at the{' '}
                  <strong>{availableStages.find(s => s.id === targetStageId)?.name}</strong>{' '}
                  stage.
                </p>
              </div>
            )}
          </div>

          {/* Select Fields */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700">Select Fields</h3>
            <p className="text-xs text-gray-400">
              Choose which member fields to include on the form. First Name and Last Name are always included.
            </p>

            {CATEGORIES.map((category) => {
              const categoryFields = MEMBER_FIELDS.filter(mf => mf.category === category);
              return (
                <div key={category} className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {categoryFields.map((mf) => {
                      const isSelected = selectedFields.has(mf.key);
                      const isRequired = mf.locked || requiredFields.has(mf.key);
                      return (
                        <div
                          key={mf.key}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                            isSelected
                              ? 'border-primary/30 bg-primary/5'
                              : 'border-gray-100 bg-gray-50'
                          }`}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                            {mf.locked ? (
                              <IoLockClosedOutline size={14} className="text-gray-400" />
                            ) : (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleField(mf.key)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            )}
                            <span className={`text-sm ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>
                              {mf.label}
                            </span>
                            <span className="text-[10px] text-gray-300 uppercase">
                              {mf.type}
                            </span>
                          </label>
                          {isSelected && !mf.locked && (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isRequired}
                                onChange={() => toggleRequired(mf.key)}
                                className="rounded border-gray-300 text-primary focus:ring-primary h-3 w-3"
                              />
                              <span className="text-[10px] text-gray-400 uppercase">Required</span>
                            </label>
                          )}
                          {mf.locked && (
                            <span className="text-[10px] text-gray-400 uppercase">Always required</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <IoSaveOutline size={16} />
              {saving ? 'Saving...' : form ? 'Update Form' : 'Create Form'}
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">Preview</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            {name ? (
              <h4 className="text-lg font-bold text-gray-800">{name}</h4>
            ) : (
              <h4 className="text-lg font-bold text-gray-300 italic">Form name</h4>
            )}
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}

            {previewFields.length === 0 ? (
              <p className="text-sm text-gray-300 italic py-8 text-center">
                Select fields to see preview
              </p>
            ) : (
              <div className="space-y-4">
                {previewFields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        placeholder={field.placeholder}
                        rows={3}
                        disabled
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        disabled
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="">Select...</option>
                        {(field.options || []).map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2">
                        <input type="checkbox" disabled className="rounded" />
                        <span className="text-sm text-gray-500">
                          {field.label}
                        </span>
                      </label>
                    ) : (
                      <input
                        type={field.type === 'phone' ? 'tel' : field.type}
                        placeholder={field.placeholder}
                        disabled
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    )}
                  </div>
                ))}
                <button
                  disabled
                  className="w-full px-4 py-2.5 bg-primary/50 text-white rounded-lg text-sm font-medium"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
