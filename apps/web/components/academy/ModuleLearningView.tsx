import React, { useState, useEffect } from 'react';
import { IoArrowBackOutline, IoVideocamOutline, IoHelpCircleOutline, IoChatbubblesOutline } from 'react-icons/io5';
import { getAcademyQuiz, markAcademyVideoWatched } from '../../src/api/academy';
import type { AcademyQuiz, QuizSubmissionResult, AcademyModuleProgress } from '../../types';
import VideoPlayer from './VideoPlayer';
import QuizEngine from './QuizEngine';
import HuddleFeed from './HuddleFeed';

interface ModuleLearningViewProps {
    moduleId: string;
    trackTitle: string;
    onBack: () => void;
    progress?: AcademyModuleProgress;
}

const ModuleLearningView: React.FC<ModuleLearningViewProps> = ({ moduleId, trackTitle, onBack, progress: initialProgress }) => {
    const [quiz, setQuiz] = useState<AcademyQuiz | null>(null);
    const [videoWatched, setVideoWatched] = useState(initialProgress?.videoWatched || false);
    const [quizCompleted, setQuizCompleted] = useState(initialProgress?.quizPassed || false);
    const [moduleData, setModuleData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadModule = async () => {
            try {
                setLoading(true);
                // Load the quiz for this module
                try {
                    const quizData = await getAcademyQuiz(moduleId);
                    setQuiz(quizData);
                } catch {
                    // Module may not have a quiz
                    setQuiz(null);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadModule();
    }, [moduleId]);

    // Get module data from the next-step progress that was passed
    const module = initialProgress?.module;
    const videoUrl = module?.videoUrl || '';
    const moduleTitle = module?.title || 'Module';
    const moduleDescription = module?.description || '';

    const handleVideoEnded = async () => {
        try {
            await markAcademyVideoWatched(moduleId);
            setVideoWatched(true);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleQuizComplete = (result: QuizSubmissionResult) => {
        if (result.passed) {
            setQuizCompleted(true);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
                    <IoArrowBackOutline size={16} />
                    Back
                </button>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                    <div className="aspect-video bg-gray-200 rounded-xl mb-4" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-3">
                    <IoArrowBackOutline size={16} />
                    Back to Academy
                </button>
                <p className="text-xs text-primary font-bold uppercase tracking-wider">{trackTitle}</p>
                <h1 className="text-2xl font-bold text-gray-800 mt-1">{moduleTitle}</h1>
                {moduleDescription && (
                    <p className="text-sm text-gray-500 mt-2">{moduleDescription}</p>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Video Section */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <IoVideocamOutline size={18} className="text-primary" />
                    Video Lesson
                </h2>
                {videoUrl ? (
                    <VideoPlayer
                        videoUrl={videoUrl}
                        moduleId={moduleId}
                        videoWatched={videoWatched}
                        onVideoEnded={handleVideoEnded}
                    />
                ) : (
                    <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                        No video available for this module
                    </div>
                )}
            </div>

            {/* Quiz Section */}
            {quiz && !quizCompleted && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <IoHelpCircleOutline size={18} className="text-primary" />
                        Quiz
                    </h2>
                    <QuizEngine
                        quiz={quiz}
                        moduleId={moduleId}
                        videoWatched={videoWatched}
                        onQuizComplete={handleQuizComplete}
                    />
                </div>
            )}

            {quizCompleted && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-sm font-bold text-green-800">Module Complete!</p>
                    <p className="text-xs text-green-600 mt-1">You've passed the quiz and completed this module.</p>
                    <button
                        onClick={onBack}
                        className="mt-4 px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 text-sm"
                    >
                        Continue to Next Module
                    </button>
                </div>
            )}

            {/* Huddle Section */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <IoChatbubblesOutline size={18} className="text-primary" />
                </div>
                <HuddleFeed moduleId={moduleId} />
            </div>
        </div>
    );
};

export default ModuleLearningView;
