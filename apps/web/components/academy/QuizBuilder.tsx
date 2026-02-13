import React, { useState, useEffect, useCallback } from 'react';
import { upsertAcademyQuiz } from '../../src/api/academy';
import type { AcademyQuiz, AcademyQuestion } from '../../types';

interface QuizBuilderProps {
    moduleId?: string;
    quiz?: AcademyQuiz | null;
}

interface QuestionDraft {
    id: string;
    questionText: string;
    questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
    options: Array<{ id: string; text: string }>;
    correctOptionId: string;
    order: number;
}

const TRUE_FALSE_OPTIONS: Array<{ id: string; text: string }> = [
    { id: 'opt-true', text: 'True' },
    { id: 'opt-false', text: 'False' },
];

function createEmptyQuestion(order: number): QuestionDraft {
    const optionA = crypto.randomUUID();
    const optionB = crypto.randomUUID();
    return {
        id: crypto.randomUUID(),
        questionText: '',
        questionType: 'MULTIPLE_CHOICE',
        options: [
            { id: optionA, text: '' },
            { id: optionB, text: '' },
        ],
        correctOptionId: '',
        order,
    };
}

function questionsFromQuiz(quiz: AcademyQuiz): QuestionDraft[] {
    return quiz.questions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            options:
                q.questionType === 'TRUE_FALSE'
                    ? [...TRUE_FALSE_OPTIONS]
                    : q.options.map((o) => ({ id: o.id, text: o.text })),
            correctOptionId: q.correctOptionId || '',
            order: q.order,
        }));
}

const QuizBuilder: React.FC<QuizBuilderProps> = ({ moduleId, quiz }) => {
    const [passingScore, setPassingScore] = useState<number>(100);
    const [questions, setQuestions] = useState<QuestionDraft[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (quiz) {
            setPassingScore(quiz.passingScore);
            setQuestions(questionsFromQuiz(quiz));
        }
    }, [quiz]);

    const reorderQuestions = useCallback((list: QuestionDraft[]): QuestionDraft[] => {
        return list.map((q, idx) => ({ ...q, order: idx + 1 }));
    }, []);

    const addQuestion = () => {
        setQuestions((prev) => {
            const next = [...prev, createEmptyQuestion(prev.length + 1)];
            return next;
        });
    };

    const removeQuestion = (questionId: string) => {
        setQuestions((prev) => reorderQuestions(prev.filter((q) => q.id !== questionId)));
    };

    const updateQuestion = (questionId: string, updates: Partial<QuestionDraft>) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
        );
    };

    const toggleQuestionType = (questionId: string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId) return q;
                if (q.questionType === 'MULTIPLE_CHOICE') {
                    return {
                        ...q,
                        questionType: 'TRUE_FALSE',
                        options: [...TRUE_FALSE_OPTIONS],
                        correctOptionId: '',
                    };
                }
                const optA = crypto.randomUUID();
                const optB = crypto.randomUUID();
                return {
                    ...q,
                    questionType: 'MULTIPLE_CHOICE',
                    options: [
                        { id: optA, text: '' },
                        { id: optB, text: '' },
                    ],
                    correctOptionId: '',
                };
            })
        );
    };

    const addOption = (questionId: string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId) return q;
                if (q.questionType !== 'MULTIPLE_CHOICE' || q.options.length >= 6) return q;
                return {
                    ...q,
                    options: [...q.options, { id: crypto.randomUUID(), text: '' }],
                };
            })
        );
    };

    const removeOption = (questionId: string, optionId: string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId) return q;
                if (q.questionType !== 'MULTIPLE_CHOICE' || q.options.length <= 2) return q;
                const filtered = q.options.filter((o) => o.id !== optionId);
                return {
                    ...q,
                    options: filtered,
                    correctOptionId: q.correctOptionId === optionId ? '' : q.correctOptionId,
                };
            })
        );
    };

    const updateOptionText = (questionId: string, optionId: string, text: string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId) return q;
                return {
                    ...q,
                    options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)),
                };
            })
        );
    };

    const setCorrectOption = (questionId: string, optionId: string) => {
        updateQuestion(questionId, { correctOptionId: optionId });
    };

    const handleSave = async () => {
        if (!moduleId) return;

        setError(null);
        setSuccess(null);

        if (questions.length === 0) {
            setError('Add at least one question before saving.');
            return;
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText.trim()) {
                setError(`Question ${q.order} is missing question text.`);
                return;
            }
            if (!q.correctOptionId) {
                setError(`Question ${q.order} needs a correct answer selected.`);
                return;
            }
            if (q.questionType === 'MULTIPLE_CHOICE') {
                const hasEmpty = q.options.some((o) => !o.text.trim());
                if (hasEmpty) {
                    setError(`Question ${q.order} has empty option text.`);
                    return;
                }
            }
        }

        try {
            setSaving(true);
            await upsertAcademyQuiz(moduleId, {
                passingScore,
                questions: questions.map((q) => ({
                    questionText: q.questionText.trim(),
                    questionType: q.questionType,
                    options: q.options.map((o) => ({ id: o.id, text: o.text.trim() })),
                    correctOptionId: q.correctOptionId,
                    order: q.order,
                })),
            });
            setSuccess('Quiz saved successfully.');
        } catch (err: any) {
            setError(err.message || 'Failed to save quiz.');
        } finally {
            setSaving(false);
        }
    };

    if (!moduleId) {
        return (
            <div className="border-t border-gray-200 pt-6 mt-6">
                <p className="text-sm text-gray-500">
                    Save the module first before adding a quiz.
                </p>
            </div>
        );
    }

    return (
        <div className="border-t border-gray-200 pt-6 mt-6">
            <h4 className="text-base font-bold text-gray-800 mb-4">Quiz Builder</h4>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                    {success}
                </div>
            )}

            {/* Passing Score */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passing Score (%)
                </label>
                <input
                    type="number"
                    min={1}
                    max={100}
                    value={passingScore}
                    onChange={(e) => {
                        const val = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                        setPassingScore(val);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-1">
                    Default is 100, which means ~2/3 for 3 questions.
                </p>
            </div>

            {/* Questions */}
            <div className="space-y-4">
                {questions.map((question) => (
                    <div key={question.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {/* Question header */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                                Question {question.order}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeQuestion(question.id)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                                Remove
                            </button>
                        </div>

                        {/* Question text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Question Text
                            </label>
                            <textarea
                                value={question.questionText}
                                onChange={(e) =>
                                    updateQuestion(question.id, { questionText: e.target.value })
                                }
                                placeholder="Enter the question..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Question type toggle */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <button
                                type="button"
                                onClick={() => toggleQuestionType(question.id)}
                                className="text-primary hover:text-primary/80 text-sm font-medium"
                            >
                                {question.questionType === 'MULTIPLE_CHOICE'
                                    ? 'Switch to True/False'
                                    : 'Switch to Multiple Choice'}
                            </button>
                            <span className="ml-2 text-xs text-gray-400">
                                Currently:{' '}
                                {question.questionType === 'MULTIPLE_CHOICE'
                                    ? 'Multiple Choice'
                                    : 'True / False'}
                            </span>
                        </div>

                        {/* Options */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Options
                            </label>
                            <div className="space-y-2">
                                {question.options.map((option) => (
                                    <div key={option.id} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`correct-${question.id}`}
                                            checked={question.correctOptionId === option.id}
                                            onChange={() =>
                                                setCorrectOption(question.id, option.id)
                                            }
                                            className="text-primary focus:ring-primary"
                                        />
                                        {question.questionType === 'TRUE_FALSE' ? (
                                            <span className="text-sm text-gray-700">
                                                {option.text}
                                            </span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={option.text}
                                                onChange={(e) =>
                                                    updateOptionText(
                                                        question.id,
                                                        option.id,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Option ${question.options.indexOf(option) + 1}`}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                                            />
                                        )}
                                        {question.questionType === 'MULTIPLE_CHOICE' &&
                                            question.options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeOption(question.id, option.id)
                                                    }
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    x
                                                </button>
                                            )}
                                    </div>
                                ))}
                            </div>

                            {question.questionType === 'MULTIPLE_CHOICE' &&
                                question.options.length < 6 && (
                                    <button
                                        type="button"
                                        onClick={() => addOption(question.id)}
                                        className="text-primary hover:text-primary/80 text-sm font-medium mt-2"
                                    >
                                        + Add Option
                                    </button>
                                )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add question button */}
            <div className="mt-4">
                <button
                    type="button"
                    onClick={addQuestion}
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                    + Add Question
                </button>
            </div>

            {/* Save */}
            <div className="flex justify-end mt-6">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Quiz'}
                </button>
            </div>
        </div>
    );
};

export default QuizBuilder;
