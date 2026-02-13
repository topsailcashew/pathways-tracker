import React, { useState } from 'react';
import { createAcademyModule, updateAcademyModule } from '../../src/api/academy';
import type { AcademyModule } from '../../types';
import QuizBuilder from './QuizBuilder';

interface ModuleEditorProps {
    trackId: string;
    module?: AcademyModule;
    existingModules: AcademyModule[];
    onSave: () => void;
    onCancel: () => void;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({ trackId, module, existingModules, onSave, onCancel }) => {
    const isEdit = !!module;

    const [title, setTitle] = useState(module?.title || '');
    const [description, setDescription] = useState(module?.description || '');
    const [videoUrl, setVideoUrl] = useState(module?.videoUrl || '');
    const [order, setOrder] = useState(module?.order ?? existingModules.length);
    const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>(module?.status || 'DRAFT');
    const [requiredModuleId, setRequiredModuleId] = useState<string>(module?.requiredModuleId || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const prerequisiteOptions = existingModules.filter(m => m.id !== module?.id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !videoUrl.trim()) return;

        try {
            setSaving(true);
            setError(null);

            if (isEdit) {
                await updateAcademyModule(module!.id, {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    videoUrl: videoUrl.trim(),
                    order,
                    status,
                    requiredModuleId: requiredModuleId || null,
                });
            } else {
                await createAcademyModule(trackId, {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    videoUrl: videoUrl.trim(),
                    order,
                    requiredModuleId: requiredModuleId || undefined,
                });
            }

            onSave();
        } catch (err: any) {
            setError(err.message || 'Failed to save module');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">
                {isEdit ? 'Edit Module' : 'Add New Module'}
            </h3>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Intro to Worship Leading"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of this module..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        rows={3}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                    <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                        <input
                            type="number"
                            value={order}
                            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                            min={0}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisite Module</label>
                    <select
                        value={requiredModuleId}
                        onChange={(e) => setRequiredModuleId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="">None</option>
                        {prerequisiteOptions.map(m => (
                            <option key={m.id} value={m.id}>
                                #{m.order} - {m.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Quiz Builder - only shown in edit mode when module ID exists */}
                {isEdit && (
                    <div className="pt-4 border-t border-gray-100">
                        <QuizBuilder moduleId={module?.id} quiz={module?.quiz} />
                    </div>
                )}

                <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Module'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ModuleEditor;
