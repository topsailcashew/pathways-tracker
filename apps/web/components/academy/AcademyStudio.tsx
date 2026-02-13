import React, { useState, useEffect } from 'react';
import { IoAddOutline, IoCreateOutline, IoTrashOutline, IoEyeOutline, IoEyeOffOutline, IoBarChartOutline } from 'react-icons/io5';
import { usePermissions } from '../../src/hooks/usePermissions';
import { Permission } from '../../src/utils/permissions';
import { getAcademyTracks, createAcademyTrack, updateAcademyTrack, deleteAcademyTrack } from '../../src/api/academy';
import type { AcademyTrack } from '../../types';
import TrackEditor from './TrackEditor';
import AcademyProgressDashboard from './AcademyProgressDashboard';

type StudioView = 'LIST' | 'TRACK_EDITOR' | 'PROGRESS';

const AcademyStudio: React.FC = () => {
    const { can } = usePermissions();
    const [tracks, setTracks] = useState<AcademyTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [studioView, setStudioView] = useState<StudioView>('LIST');
    const [selectedTrack, setSelectedTrack] = useState<AcademyTrack | null>(null);

    // Create form
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [createDesc, setCreateDesc] = useState('');
    const [creating, setCreating] = useState(false);

    const loadTracks = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAcademyTracks();
            setTracks(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load tracks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTracks();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createTitle.trim()) return;
        try {
            setCreating(true);
            await createAcademyTrack({ title: createTitle.trim(), description: createDesc.trim() || undefined });
            setCreateTitle('');
            setCreateDesc('');
            setShowCreateForm(false);
            await loadTracks();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleTogglePublish = async (track: AcademyTrack) => {
        try {
            await updateAcademyTrack(track.id, { isPublished: !track.isPublished });
            await loadTracks();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this track and all its modules? This cannot be undone.')) return;
        try {
            await deleteAcademyTrack(id);
            await loadTracks();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEditTrack = (track: AcademyTrack) => {
        setSelectedTrack(track);
        setStudioView('TRACK_EDITOR');
    };

    if (studioView === 'TRACK_EDITOR' && selectedTrack) {
        return (
            <TrackEditor
                trackId={selectedTrack.id}
                onBack={() => {
                    setStudioView('LIST');
                    setSelectedTrack(null);
                    loadTracks();
                }}
            />
        );
    }

    if (studioView === 'PROGRESS') {
        return (
            <AcademyProgressDashboard
                onBack={() => setStudioView('LIST')}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Training Tracks</h2>
                    <p className="text-sm text-gray-500 mt-1">Create and manage volunteer training content</p>
                </div>
                <div className="flex gap-2">
                    {can(Permission.ACADEMY_VIEW_ALL_PROGRESS) && (
                        <button
                            onClick={() => setStudioView('PROGRESS')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <IoBarChartOutline size={16} />
                            Progress Dashboard
                        </button>
                    )}
                    {can(Permission.ACADEMY_MANAGE_TRACKS) && (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                        >
                            <IoAddOutline size={18} />
                            New Track
                        </button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 font-bold">&times;</button>
                </div>
            )}

            {/* Create Form Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Track</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={createTitle}
                                    onChange={(e) => setCreateTitle(e.target.value)}
                                    placeholder="e.g., Bass Guitar Fundamentals"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                                <textarea
                                    value={createDesc}
                                    onChange={(e) => setCreateDesc(e.target.value)}
                                    placeholder="Brief description of this training track..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
                                    Cancel
                                </button>
                                <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
                                    {creating ? 'Creating...' : 'Create Track'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                            <div className="h-3 bg-gray-100 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            )}

            {/* Track List */}
            {!loading && tracks.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="text-4xl mb-3">📚</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">No Training Tracks Yet</h3>
                    <p className="text-sm text-gray-500">Create your first track to start building training content for your volunteers.</p>
                </div>
            )}

            {!loading && tracks.length > 0 && (
                <div className="grid gap-4">
                    {tracks.map((track) => (
                        <div key={track.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 cursor-pointer" onClick={() => handleEditTrack(track)}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-800">{track.title}</h3>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                                            track.isPublished
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {track.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                    {track.description && (
                                        <p className="text-sm text-gray-500 mb-3">{track.description}</p>
                                    )}
                                    <div className="flex gap-4 text-xs text-gray-400">
                                        <span>{track._count?.modules || 0} modules</span>
                                        <span>{track._count?.enrollments || 0} enrolled</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 ml-4">
                                    <button
                                        onClick={() => handleTogglePublish(track)}
                                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                        title={track.isPublished ? 'Unpublish' : 'Publish'}
                                    >
                                        {track.isPublished ? <IoEyeOutline size={18} /> : <IoEyeOffOutline size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleEditTrack(track)}
                                        className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                                        title="Edit"
                                    >
                                        <IoCreateOutline size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(track.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                                        title="Delete"
                                    >
                                        <IoTrashOutline size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AcademyStudio;
