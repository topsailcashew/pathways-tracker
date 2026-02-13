import React, { useState, useEffect } from 'react';
import {
    IoArrowBackOutline,
    IoPeopleOutline,
    IoCheckmarkCircleOutline,
    IoTrophyOutline,
    IoLayersOutline,
} from 'react-icons/io5';
import { getAcademyStats, getAcademyTrackProgress } from '../../src/api/academy';
import type { AcademyPipelineStats } from '../../types';

interface AcademyProgressDashboardProps {
    onBack: () => void;
}

interface TrackModuleProgress {
    moduleId: string;
    moduleTitle: string;
    stuckCount: number;
    completedCount: number;
}

const AcademyProgressDashboard: React.FC<AcademyProgressDashboardProps> = ({ onBack }) => {
    const [stats, setStats] = useState<AcademyPipelineStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
    const [selectedTrackTitle, setSelectedTrackTitle] = useState<string>('');
    const [trackProgress, setTrackProgress] = useState<TrackModuleProgress[]>([]);
    const [trackProgressLoading, setTrackProgressLoading] = useState(false);
    const [trackProgressError, setTrackProgressError] = useState<string | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getAcademyStats();
                setStats(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load academy stats');
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const handleTrackClick = async (trackId: string, trackTitle: string) => {
        try {
            setSelectedTrackId(trackId);
            setSelectedTrackTitle(trackTitle);
            setTrackProgressLoading(true);
            setTrackProgressError(null);
            const data = await getAcademyTrackProgress(trackId);
            setTrackProgress(data);
        } catch (err: any) {
            setTrackProgressError(err.message || 'Failed to load track progress');
        } finally {
            setTrackProgressLoading(false);
        }
    };

    const handleBackToOverview = () => {
        setSelectedTrackId(null);
        setSelectedTrackTitle('');
        setTrackProgress([]);
        setTrackProgressError(null);
    };

    const computeCompletionRate = (enrolled: number, completed: number): number => {
        if (enrolled === 0) return 0;
        return Math.round((completed / enrolled) * 100);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <button
                    onClick={onBack}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                    <IoArrowBackOutline size={16} />
                    Back
                </button>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse"
                        >
                            <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
                            <div className="h-7 bg-gray-200 rounded w-1/3" />
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-4 bg-gray-100 rounded w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <button
                    onClick={onBack}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                    <IoArrowBackOutline size={16} />
                    Back
                </button>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            {/* Back button */}
            <button
                onClick={selectedTrackId ? handleBackToOverview : onBack}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
                <IoArrowBackOutline size={16} />
                {selectedTrackId ? 'Back to Overview' : 'Back'}
            </button>

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800">
                    {selectedTrackId ? selectedTrackTitle : 'Pipeline Health Dashboard'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {selectedTrackId
                        ? 'Per-module progress breakdown'
                        : 'Academy enrollment and completion overview'}
                </p>
            </div>

            {!selectedTrackId && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase">
                                    Total Tracks
                                </span>
                                <IoLayersOutline size={18} className="text-gray-300" />
                            </div>
                            <div className="text-2xl font-bold text-gray-800 mt-1">
                                {stats.totalTracks}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase">
                                    Total Enrolled
                                </span>
                                <IoPeopleOutline size={18} className="text-gray-300" />
                            </div>
                            <div className="text-2xl font-bold text-gray-800 mt-1">
                                {stats.totalEnrolled}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase">
                                    Total Completed
                                </span>
                                <IoCheckmarkCircleOutline size={18} className="text-gray-300" />
                            </div>
                            <div className="text-2xl font-bold text-gray-800 mt-1">
                                {stats.totalCompleted}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase">
                                    Ready for Scheduling
                                </span>
                                <IoTrophyOutline size={18} className="text-gray-300" />
                            </div>
                            <div className="text-2xl font-bold text-gray-800 mt-1">
                                {stats.readyForScheduling}
                            </div>
                        </div>
                    </div>

                    {/* Per-track breakdown table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700">Track Breakdown</h3>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-6 py-3">
                                        Track Title
                                    </th>
                                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-6 py-3">
                                        Enrolled
                                    </th>
                                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-6 py-3">
                                        Completed
                                    </th>
                                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-6 py-3">
                                        Completion Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.trackBreakdown.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-8 text-center text-sm text-gray-400"
                                        >
                                            No tracks available yet.
                                        </td>
                                    </tr>
                                )}
                                {stats.trackBreakdown.map((track) => {
                                    const rate = computeCompletionRate(
                                        track.enrolled,
                                        track.completed
                                    );
                                    return (
                                        <tr
                                            key={track.trackId}
                                            onClick={() =>
                                                handleTrackClick(track.trackId, track.trackTitle)
                                            }
                                            className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-3 text-sm font-medium text-gray-800">
                                                {track.trackTitle}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-600">
                                                {track.enrolled}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-600">
                                                {track.completed}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-primary rounded-full h-2 transition-all"
                                                            style={{ width: `${rate}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-600 w-10 text-right">
                                                        {rate}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Per-track detail view */}
            {selectedTrackId && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700">Module Progress</h3>
                    </div>

                    {trackProgressLoading && (
                        <div className="p-6 animate-pulse space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-4 bg-gray-100 rounded w-full" />
                            ))}
                        </div>
                    )}

                    {trackProgressError && (
                        <div className="p-6">
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {trackProgressError}
                            </div>
                        </div>
                    )}

                    {!trackProgressLoading && !trackProgressError && (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-6 py-3">
                                        Module Title
                                    </th>
                                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-6 py-3">
                                        Stuck Count
                                    </th>
                                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-6 py-3">
                                        Completed Count
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {trackProgress.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-6 py-8 text-center text-sm text-gray-400"
                                        >
                                            No module progress data available.
                                        </td>
                                    </tr>
                                )}
                                {trackProgress.map((mod) => (
                                    <tr
                                        key={mod.moduleId}
                                        className="border-b border-gray-50"
                                    >
                                        <td className="px-6 py-3 text-sm font-medium text-gray-800">
                                            {mod.moduleTitle}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600">
                                            {mod.stuckCount > 0 ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                    {mod.stuckCount}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">0</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600">
                                            {mod.completedCount > 0 ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    {mod.completedCount}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">0</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AcademyProgressDashboard;
