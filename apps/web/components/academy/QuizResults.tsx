import React from 'react';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTrophyOutline, IoRefreshOutline } from 'react-icons/io5';
import type { QuizSubmissionResult } from '../../types';

interface QuizResultsProps {
    result: QuizSubmissionResult;
    onRetake?: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ result, onRetake }) => {
    return (
        <div className={`rounded-xl p-6 text-center ${
            result.passed
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
                : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'
        }`}>
            {result.passed ? (
                <>
                    <div className="text-5xl mb-3">
                        {result.trackCompleted ? '🎓' : '🎉'}
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-1">
                        {result.trackCompleted ? 'Track Completed!' : 'Quiz Passed!'}
                    </h3>
                    <p className="text-sm text-green-600 mb-4">
                        You scored {result.correctCount}/{result.totalQuestions} ({result.score}%)
                    </p>
                    {result.trackCompleted && (
                        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
                            <IoTrophyOutline size={18} />
                            Ready for Stage
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="text-5xl mb-3">📝</div>
                    <h3 className="text-xl font-bold text-red-800 mb-1">Not Quite</h3>
                    <p className="text-sm text-red-600 mb-4">
                        You scored {result.correctCount}/{result.totalQuestions} ({result.score}%). Review the material and try again.
                    </p>
                    {onRetake && (
                        <button
                            onClick={onRetake}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            <IoRefreshOutline size={18} />
                            Retake Quiz
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default QuizResults;
