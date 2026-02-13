import React, { useState, useEffect, useCallback } from 'react';
import {
    IoArrowBackOutline,
    IoAddOutline,
    IoTrashOutline,
    IoVideocamOutline,
    IoHelpCircleOutline,
    IoCreateOutline,
    IoLockClosedOutline,
} from 'react-icons/io5';
import {
    getAcademyTrack,
    updateAcademyTrack,
    deleteAcademyModule,
} from '../../src/api/academy';
import type { AcademyTrack, AcademyModule } from '../../types';
import ModuleEditor from './ModuleEditor';

interface TrackEditorProps {
    trackId: string;
    onBack: () => void;
}

const statusBadgeClasses: Record<AcademyModule['status'], string> = {
    PUBLISHED: 'bg-green-100 text-green-700',
    DRAFT: 'bg-yellow-100 text-yellow-700',
    ARCHIVED: 'bg-gray-100 text-gray-500',
};

const TrackEditor: React.FC<TrackEditorProps> = ({ trackId, onBack }) => {
    const [track, setTrack] = useState<AcademyTrack | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Inline track editing
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [savingTrack, setSavingTrack] = useState(false);

    // Module editor state
    const [showModuleEditor, setShowModuleEditor] = useState(false);
    const [editingModule, setEditingModule] = useState<AcademyModule | undefined>(undefined);

    // Delete state
    const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);

    const loadTrack = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAcademyTrack(trackId);
            setTrack(data);
            setEditTitle(data.title);
            setEditDesc(data.description || '');
        } catch (err: any) {
            setError(err.message || 'Failed to load track');
        } finally {
            setLoading(false);
        }
    }, [trackId]);

    useEffect(() => {
        loadTrack();
    }, [loadTrack]);

    const handleSaveTitle = async () => {
        if (!editTitle.trim() || editTitle.trim() === track?.title) {
            setIsEditingTitle(false);
            setEditTitle(track?.title || '');
            return;
        }
        try {
            setSavingTrack(true);
            await updateAcademyTrack(trackId, { title: editTitle.trim() });
            await loadTrack();
            setIsEditingTitle(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSavingTrack(false);
        }
    };

    const handleSaveDescription = async () => {
        const newDesc = editDesc.trim();
        if (newDesc === (track?.description || '')) {
            setIsEditingDesc(false);
            setEditDesc(track?.description || '');
            return;
        }
        try {
            setSavingTrack(true);
            await updateAcademyTrack(trackId, { description: newDesc || undefined });
            await loadTrack();
            setIsEditingDesc(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSavingTrack(false);
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveTitle();
        } else if (e.key === 'Escape') {
            setIsEditingTitle(false);
            setEditTitle(track?.title || '');
        }
    };

    const handleDescKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsEditingDesc(false);
            setEditDesc(track?.description || '');
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
            return;
        }
        try {
            setDeletingModuleId(moduleId);
            await deleteAcademyModule(moduleId);
            await loadTrack();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeletingModuleId(null);
        }
    };

    const handleOpenAddModule = () => {
        setEditingModule(undefined);
        setShowModuleEditor(true);
    };

    const handleOpenEditModule = (mod: AcademyModule) => {
        setEditingModule(mod);
        setShowModuleEditor(true);
    };

    const handleModuleSaved = () => {
        setShowModuleEditor(false);
        setEditingModule(undefined);
        loadTrack();
    };

    const handleModuleCancel = () => {
        setShowModuleEditor(false);
        setEditingModule(undefined);
    };

    // --- ModuleEditor view ---
    if (showModuleEditor) {
        return (
            <ModuleEditor
                trackId={trackId}
                module={editingModule}
                modules={track?.modules || []}
                onBack={handleModuleCancel}
                onSaved={handleModuleSaved}
            />
        );
    }

    // --- Loading skeleton ---
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                    <div className="h-7 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/4 mb-6" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gray-200 rounded-full" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- Track not found ---
    if (!track) {
        return (
            <div className="space-y-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <IoArrowBackOutline size={16} />
                    Back to Tracks
                </button>
                <div className="text-center py-12 text-gray-500">
                    Track not found.
                </div>
            </div>
        );
    }

    const modules = [...(track.modules || [])].sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                <IoArrowBackOutline size={16} />
                Back to Tracks
            </button>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-3 font-bold text-red-500 hover:text-red-700"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Track Details Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                    Track Details
                </h3>

                {/* Inline Editable Title */}
                <div className="mb-4">
                    {isEditingTitle ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={handleTitleKeyDown}
                                onBlur={handleSaveTitle}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-lg font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                                autoFocus
                                disabled={savingTrack}
                            />
                            {savingTrack && (
                                <span className="text-xs text-gray-400">Saving...</span>
                            )}
                        </div>
                    ) : (
                        <div
                            className="group flex items-center gap-2 cursor-pointer"
                            onClick={() => setIsEditingTitle(true)}
                        >
                            <h2 className="text-2xl font-bold text-gray-800">
                                {track.title}
                            </h2>
                            <IoCreateOutline
                                size={18}
                                className="text-gray-300 group-hover:text-gray-500 transition-colors"
                            />
                        </div>
                    )}
                </div>

                {/* Inline Editable Description */}
                <div>
                    {isEditingDesc ? (
                        <div className="space-y-2">
                            <textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                onKeyDown={handleDescKeyDown}
                                onBlur={handleSaveDescription}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-primary focus:border-primary"
                                rows={3}
                                autoFocus
                                disabled={savingTrack}
                                placeholder="Add a description for this track..."
                            />
                            <div className="flex items-center gap-2 justify-end">
                                {savingTrack && (
                                    <span className="text-xs text-gray-400">Saving...</span>
                                )}
                                <button
                                    onClick={() => {
                                        setIsEditingDesc(false);
                                        setEditDesc(track.description || '');
                                    }}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveDescription}
                                    disabled={savingTrack}
                                    className="text-xs font-medium text-white bg-primary px-3 py-1 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="group flex items-start gap-2 cursor-pointer"
                            onClick={() => setIsEditingDesc(true)}
                        >
                            <p className="text-sm text-gray-500">
                                {track.description || 'No description. Click to add one.'}
                            </p>
                            <IoCreateOutline
                                size={14}
                                className="mt-0.5 flex-shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modules List Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Modules ({modules.length})
                    </h3>
                    <button
                        onClick={handleOpenAddModule}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <IoAddOutline size={14} />
                        Add Module
                    </button>
                </div>

                {modules.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-gray-400 mb-4">
                            No modules yet. Add your first module to start building this track.
                        </p>
                        <button
                            onClick={handleOpenAddModule}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <IoAddOutline size={16} />
                            Create First Module
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {modules.map((mod, idx) => (
                            <div
                                key={mod.id}
                                className="flex items-center gap-3 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                                {/* Order number */}
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                                    {idx + 1}
                                </div>

                                {/* Module info - clickable to edit */}
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => handleOpenEditModule(mod)}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-gray-800 truncate">
                                            {mod.title}
                                        </span>
                                        <span
                                            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded flex-shrink-0 ${
                                                statusBadgeClasses[mod.status]
                                            }`}
                                        >
                                            {mod.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                        {/* Video URL indicator */}
                                        <span className="flex items-center gap-1">
                                            <IoVideocamOutline size={12} />
                                            {mod.videoUrl ? 'Video attached' : 'No video'}
                                        </span>

                                        {/* Quiz question count */}
                                        <span className="flex items-center gap-1">
                                            <IoHelpCircleOutline size={12} />
                                            {mod.quiz
                                                ? `${mod.quiz.questions?.length || 0} question${(mod.quiz.questions?.length || 0) !== 1 ? 's' : ''}`
                                                : 'No quiz'}
                                        </span>

                                        {/* Prerequisite indicator */}
                                        {mod.requiredModule && (
                                            <span className="flex items-center gap-1">
                                                <IoLockClosedOutline size={12} />
                                                Requires: {mod.requiredModule.title}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenEditModule(mod)}
                                        className="p-1.5 text-gray-400 hover:text-primary rounded hover:bg-gray-100 transition-colors"
                                        title="Edit module"
                                    >
                                        <IoCreateOutline size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteModule(mod.id)}
                                        disabled={deletingModuleId === mod.id}
                                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                                        title="Delete module"
                                    >
                                        <IoTrashOutline size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackEditor;
