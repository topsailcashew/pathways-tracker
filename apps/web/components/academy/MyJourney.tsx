import React from 'react';
import { IoCheckmarkCircleOutline, IoPlayCircleOutline, IoLockClosedOutline, IoTrophyOutline } from 'react-icons/io5';
import type { AcademyEnrollment, AcademyModuleProgress } from '../../types';
import CertificationBadge from './CertificationBadge';

interface MyJourneyProps {
    enrollments: AcademyEnrollment[];
    progress: AcademyModuleProgress[];
    onStartLearning: (moduleId: string, trackTitle: string) => void;
}

const MyJourney: React.FC<MyJourneyProps> = ({ enrollments, progress, onStartLearning }) => {
    // Group progress by track
    const getTrackProgress = (trackId: string) => {
        return progress.filter(p => p.module?.trackId === trackId).sort((a, b) => (a.module?.order || 0) - (b.module?.order || 0));
    };

    const getCompletionPercent = (trackId: string) => {
        const modules = getTrackProgress(trackId);
        if (modules.length === 0) return 0;
        const completed = modules.filter(m => m.status === 'COMPLETED').length;
        return Math.round((completed / modules.length) * 100);
    };

    const completedEnrollments = enrollments.filter(e => e.completedAt);
    const activeEnrollments = enrollments.filter(e => !e.completedAt);

    return (
        <div className="space-y-6">
            {/* Completed Track Badges */}
            {completedEnrollments.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <IoTrophyOutline className="text-yellow-500" />
                        Certifications
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {completedEnrollments.map((enrollment) => (
                            <CertificationBadge
                                key={enrollment.id}
                                trackTitle={enrollment.track?.title || 'Training Track'}
                                completedAt={enrollment.completedAt!}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Active Tracks */}
            {activeEnrollments.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">My Journey</h2>
                    <div className="space-y-4">
                        {activeEnrollments.map((enrollment) => {
                            const trackModules = getTrackProgress(enrollment.trackId);
                            const completionPercent = getCompletionPercent(enrollment.trackId);
                            const trackTitle = enrollment.track?.title || 'Training Track';

                            return (
                                <div key={enrollment.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-base font-bold text-gray-800">{trackTitle}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className="text-sm font-bold text-primary">{completionPercent}%</span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="bg-gray-100 rounded-full h-2 mb-4">
                                        <div
                                            className="bg-primary rounded-full h-2 transition-all duration-500"
                                            style={{ width: `${completionPercent}%` }}
                                        />
                                    </div>

                                    {/* Module list */}
                                    <div className="space-y-2">
                                        {trackModules.map((mp) => {
                                            const isClickable = mp.status === 'STARTED';
                                            return (
                                                <button
                                                    key={mp.id}
                                                    onClick={() => isClickable && onStartLearning(mp.moduleId, trackTitle)}
                                                    disabled={!isClickable}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                                        isClickable
                                                            ? 'hover:bg-primary/5 cursor-pointer'
                                                            : mp.status === 'COMPLETED'
                                                            ? 'opacity-80'
                                                            : 'opacity-50 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {mp.status === 'COMPLETED' && (
                                                        <IoCheckmarkCircleOutline size={20} className="text-green-500 shrink-0" />
                                                    )}
                                                    {mp.status === 'STARTED' && (
                                                        <IoPlayCircleOutline size={20} className="text-primary shrink-0" />
                                                    )}
                                                    {mp.status === 'LOCKED' && (
                                                        <IoLockClosedOutline size={20} className="text-gray-300 shrink-0" />
                                                    )}
                                                    <span className={`text-sm ${
                                                        mp.status === 'COMPLETED'
                                                            ? 'text-gray-500 line-through'
                                                            : mp.status === 'STARTED'
                                                            ? 'text-gray-800 font-medium'
                                                            : 'text-gray-400'
                                                    }`}>
                                                        {mp.module?.title || 'Module'}
                                                    </span>
                                                    {mp.quizPassed && (
                                                        <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                            {mp.quizScore}%
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyJourney;
