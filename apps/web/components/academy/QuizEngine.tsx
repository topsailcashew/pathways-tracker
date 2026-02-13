import React, { useState } from 'react';
import { IoCheckmarkOutline } from 'react-icons/io5';
import { submitAcademyQuiz } from '../../src/api/academy';
import type { AcademyQuiz, QuizSubmissionResult } from '../../types';
import QuizResults from './QuizResults';

interface QuizEngineProps {
    quiz: AcademyQuiz;
    moduleId: string;
    videoWatched: boolean;
    onQuizComplete: (result: QuizSubmissionResult) => void;
}

const QuizEngine: React.FC<QuizEngineProps> = ({ quiz, moduleId, videoWatched, onQuizComplete }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<QuizSubmissionResult | null>(null);

    const handleSelectOption = (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const allAnswered = quiz.questions.every(q => answers[q.id]);

    const handleSubmit = async () => {
        if (!allAnswered) return;

        try {
            setSubmitting(true);
            setError(null);
            const answerArray = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
                questionId,
                selectedOptionId,
            }));
            const res = await submitAcademyQuiz(moduleId, answerArray);
            setResult(res);
            onQuizComplete(res);
        } catch (err: any) {
            setError(err.message || 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetake = () => {
        setResult(null);
        setAnswers({});
        setError(null);
    };

    if (result) {
        return <QuizResults result={result} onRetake={result.passed ? undefined : handleRetake} />;
    }

    if (!videoWatched) {
        return (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">🔒</div>
                <p className="text-sm text-gray-500 font-medium">Complete the video to unlock the quiz</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Knowledge Check</h3>
                <span className="text-xs text-gray-400">Passing score: {quiz.passingScore}%</span>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {quiz.questions.map((question, idx) => (
                <div key={question.id} className="bg-gray-50 rounded-xl p-5">
                    <p className="text-sm font-bold text-gray-700 mb-3">
                        {idx + 1}. {question.questionText}
                    </p>
                    <div className="space-y-2">
                        {question.options.map((option) => {
                            const isSelected = answers[question.id] === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelectOption(question.id, option.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-all ${
                                        isSelected
                                            ? 'bg-primary/10 border-2 border-primary text-primary font-medium'
                                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                        isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                                    }`}>
                                        {isSelected && <IoCheckmarkOutline size={12} className="text-white" />}
                                    </div>
                                    {option.text}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="w-full py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {submitting ? 'Submitting...' : 'Submit Answers'}
            </button>
        </div>
    );
};

export default QuizEngine;
