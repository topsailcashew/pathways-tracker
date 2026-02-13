import React, { useState, useEffect } from 'react';
import { IoSendOutline, IoTrashOutline } from 'react-icons/io5';
import { useAppContext } from '../../context/AppContext';
import { usePermissions } from '../../src/hooks/usePermissions';
import { getAcademyHuddleComments, addAcademyHuddleComment, deleteAcademyHuddleComment } from '../../src/api/academy';
import type { AcademyHuddleComment } from '../../types';

interface HuddleFeedProps {
    moduleId: string;
}

const HuddleFeed: React.FC<HuddleFeedProps> = ({ moduleId }) => {
    const { currentUser } = useAppContext();
    const { isAdmin, isSuperAdmin } = usePermissions();
    const [comments, setComments] = useState<AcademyHuddleComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadComments = async () => {
        try {
            setLoading(true);
            const data = await getAcademyHuddleComments(moduleId);
            setComments(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComments();
    }, [moduleId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            setError(null);
            const comment = await addAcademyHuddleComment(moduleId, newComment.trim());
            setComments(prev => [comment, ...prev]);
            setNewComment('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await deleteAcademyHuddleComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (err: any) {
            setError(err.message);
        }
    };

    const canDelete = (comment: AcademyHuddleComment) => {
        return comment.userId === currentUser?.id || isAdmin() || isSuperAdmin();
    };

    return (
        <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-800">Team Huddle</h3>

            {/* Add Comment */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share feedback or ask a question..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    maxLength={2000}
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 shrink-0"
                >
                    <IoSendOutline size={16} />
                </button>
            </form>

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="animate-pulse flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                            <div className="flex-1">
                                <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
                                <div className="h-3 bg-gray-100 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No comments yet. Start the conversation!</p>
            ) : (
                <div className="space-y-3">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                {comment.user?.firstName?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-800">
                                        {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'User'}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                    {canDelete(comment) && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="ml-auto opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                        >
                                            <IoTrashOutline size={14} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mt-0.5">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HuddleFeed;
