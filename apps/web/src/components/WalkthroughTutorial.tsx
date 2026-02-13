import React, { useState, useEffect } from 'react';
import { IoCloseOutline, IoArrowForward, IoArrowBack, IoCheckmarkCircleOutline } from 'react-icons/io5';

interface TutorialStep {
    target: string; // CSS selector
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    action?: () => void;
}

const tutorialSteps: TutorialStep[] = [
    {
        target: '.dashboard-header',
        title: 'Welcome to Shepherd!',
        description: 'This is your dashboard where you can see an overview of all your members and their journey progress. Let\'s take a quick tour!',
        position: 'bottom',
    },
    {
        target: '.sidebar-members',
        title: 'Members Directory',
        description: 'Click here to view all your church members. You can filter by pathway (Newcomer or New Believer) and track their progress through each stage.',
        position: 'right',
    },
    {
        target: '.sidebar-tasks',
        title: 'Tasks & Follow-ups',
        description: 'Manage your follow-up tasks here. Create tasks, assign them to team members, and track completion to ensure no one falls through the cracks.',
        position: 'right',
    },
    {
        target: '.sidebar-analytics',
        title: 'Analytics & Reports',
        description: 'View detailed analytics about your members, track growth trends, and export data for reports.',
        position: 'right',
    },
    {
        target: '.sidebar-settings',
        title: 'Church Settings',
        description: 'Configure your church information, customize pathways, set up automation rules, and manage integrations here.',
        position: 'right',
    },
    {
        target: '.add-member-button',
        title: 'Add Your First Member',
        description: 'Click here to add a new member. You can enter their information manually or import multiple members via CSV.',
        position: 'bottom',
    },
    {
        target: '.user-profile',
        title: 'Your Profile & Team',
        description: 'Access your profile settings and manage team members here. Assign roles and permissions to control what each team member can do.',
        position: 'bottom',
    },
];

interface WalkthroughTutorialProps {
    onComplete: () => void;
    onSkip: () => void;
}

export const WalkthroughTutorial: React.FC<WalkthroughTutorialProps> = ({ onComplete, onSkip }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    const currentStepData = tutorialSteps[currentStep];
    const isLastStep = currentStep === tutorialSteps.length - 1;

    useEffect(() => {
        updateTargetPosition();
        window.addEventListener('resize', updateTargetPosition);
        return () => window.removeEventListener('resize', updateTargetPosition);
    }, [currentStep]);

    const updateTargetPosition = () => {
        const element = document.querySelector(currentStepData.target);
        if (element) {
            setTargetRect(element.getBoundingClientRect());
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleNext = () => {
        if (isLastStep) {
            handleComplete();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('tutorialCompleted', 'true');
        onComplete();
    };

    const handleSkip = () => {
        setIsVisible(false);
        localStorage.setItem('tutorialCompleted', 'true');
        onSkip();
    };

    if (!isVisible || !targetRect) return null;

    const getTooltipPosition = () => {
        const position = currentStepData.position || 'bottom';
        const tooltipWidth = 350;
        const tooltipHeight = 200;
        const offset = 20;

        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = targetRect.top - tooltipHeight - offset;
                left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
                break;
            case 'bottom':
                top = targetRect.bottom + offset;
                left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
                break;
            case 'left':
                top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
                left = targetRect.left - tooltipWidth - offset;
                break;
            case 'right':
                top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
                left = targetRect.right + offset;
                break;
        }

        // Ensure tooltip stays within viewport
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));

        return { top, left };
    };

    const tooltipPosition = getTooltipPosition();

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-50 pointer-events-none">
                {/* Darkened background */}
                <div className="absolute inset-0 bg-black opacity-50"></div>

                {/* Spotlight on target element */}
                <div
                    className="absolute bg-transparent border-4 border-blue-500 rounded-lg shadow-2xl pointer-events-auto"
                    style={{
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.5)',
                    }}
                ></div>

                {/* Tooltip */}
                <div
                    className="absolute bg-white rounded-lg shadow-2xl p-6 pointer-events-auto animate-fadeIn"
                    style={{
                        top: tooltipPosition.top,
                        left: tooltipPosition.left,
                        width: 350,
                        maxWidth: 'calc(100vw - 20px)',
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                        <IoCloseOutline size={24} />
                    </button>

                    {/* Step indicator */}
                    <div className="text-xs text-gray-500 font-medium mb-3">
                        Step {currentStep + 1} of {tutorialSteps.length}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-800 mb-2 pr-6">
                        {currentStepData.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        {currentStepData.description}
                    </p>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                        ></div>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handleSkip}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Skip Tour
                        </button>

                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={handlePrevious}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <IoArrowBack />
                                    Back
                                </button>
                            )}

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {isLastStep ? (
                                    <>
                                        <IoCheckmarkCircleOutline />
                                        Finish
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <IoArrowForward />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

/**
 * Hook to manage tutorial state
 */
export const useTutorial = () => {
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        const completed = localStorage.getItem('tutorialCompleted');
        if (!completed) {
            // Show tutorial after a short delay on first login
            setTimeout(() => setShowTutorial(true), 1000);
        }
    }, []);

    const startTutorial = () => setShowTutorial(true);
    const endTutorial = () => setShowTutorial(false);
    const resetTutorial = () => {
        localStorage.removeItem('tutorialCompleted');
        setShowTutorial(true);
    };

    return {
        showTutorial,
        startTutorial,
        endTutorial,
        resetTutorial,
    };
};

export default WalkthroughTutorial;
