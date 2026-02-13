import React, { useState, useEffect } from 'react';
import { IoPlayOutline, IoSchoolOutline, IoRocketOutline } from 'react-icons/io5';
import { getAcademyTracks, getAcademyMyProgress, getAcademyNextStep, enrollInAcademyTrack } from '../../src/api/academy';
import type { AcademyTrack, AcademyEnrollment, AcademyModuleProgress } from '../../types';
import NextStepCard from './NextStepCard';
import MyJourney from './MyJourney';
import ModuleLearningView from './ModuleLearningView';

const AcademyPortal: React.FC = () => {
    const [nextStep, setNextStep] = useState<AcademyModuleProgress | null>(null);
    const [enrollments, setEnrollments] = useState<AcademyEnrollment[]>([]);
    const [progress, setProgress] = useState<AcademyModuleProgress[]>([]);
    const [availableTracks, setAvailableTracks] = useState<AcademyTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enrolling, setEnrolling] = useState<string | null>(null);

    // Active learning view
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [activeTrackTitle, setActiveTrackTitle] = useState<string>('');

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [nextStepData, progressData, tracksData] = await Promise.all([
                getAcademyNextStep(),
                getAcademyMyProgress(),
                getAcademyTracks({ isPublished: true }),
            ]);

            setNextStep(nextStepData);
            setEnrollments(progressData.enrollments);
            setProgress(progressData.progress);

            // Filter out tracks user is already enrolled in
            const enrolledTrackIds = new Set(progressData.enrollments.map(e => e.trackId));
            setAvailableTracks(tracksData.filter(t => !enrolledTrackIds.has(t.id)));
        } catch (err: any) {
            setError(err.message || 'Failed to load academy data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEnroll = async (trackId: string) => {
        try {
            setEnrolling(trackId);
            await enrollInAcademyTrack(trackId);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setEnrolling(null);
        }
    };

    const handleStartLearning = (moduleId: string, trackTitle: string) => {
        setActiveModuleId(moduleId);
        setActiveTrackTitle(trackTitle);
    };

    const handleLearningComplete = () => {
        setActiveModuleId(null);
        setActiveTrackTitle('');
        loadData();
    };

    // Show module learning view if active
    if (activeModuleId) {
        return (
            <ModuleLearningView
                moduleId={activeModuleId}
                trackTitle={activeTrackTitle}
                onBack={handleLearningComplete}
            />
        );
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                    <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                    <div className="h-10 bg-gray-100 rounded w-40 mt-4" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                            <div className="h-2 bg-gray-100 rounded-full w-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 font-bold">&times;</button>
                </div>
            )}

            {/* Your Next Step */}
            {nextStep && nextStep.module && (
                <NextStepCard
                    progress={nextStep}
                    onStartLearning={() => handleStartLearning(
                        nextStep.moduleId,
                        nextStep.module?.track?.title || ''
                    )}
                />
            )}

            {/* No enrollments message */}
            {enrollments.length === 0 && !nextStep && (
                <div className="bg-gradient-to-br from-primary/5 to-ocean/5 rounded-2xl border border-primary/10 p-8 text-center">
                    <div className="text-5xl mb-4">🎓</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Shepherd Academy</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Start your training journey by enrolling in a track below. Each track will guide you step-by-step with videos and quizzes.
                    </p>
                </div>
            )}

            {/* My Journey */}
            {enrollments.length > 0 && (
                <MyJourney
                    enrollments={enrollments}
                    progress={progress}
                    onStartLearning={handleStartLearning}
                />
            )}

            {/* Browse Available Tracks */}
            {availableTracks.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        <IoSchoolOutline className="inline mr-2 text-primary" />
                        Browse Tracks
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableTracks.map((track) => (
                            <div key={track.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                                <h3 className="text-base font-bold text-gray-800 mb-2">{track.title}</h3>
                                {track.description && (
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{track.description}</p>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">{track._count?.modules || 0} modules</span>
                                    <button
                                        onClick={() => handleEnroll(track.id)}
                                        disabled={enrolling === track.id}
                                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        <IoRocketOutline size={14} />
                                        {enrolling === track.id ? 'Enrolling...' : 'Enroll'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademyPortal;
