import React from 'react';
import { IoPlayOutline, IoVideocamOutline } from 'react-icons/io5';
import type { AcademyModuleProgress } from '../../types';

interface NextStepCardProps {
    progress: AcademyModuleProgress;
    onStartLearning: () => void;
}

const NextStepCard: React.FC<NextStepCardProps> = ({ progress, onStartLearning }) => {
    const module = progress.module;
    if (!module) return null;

    const trackTitle = (module as any).track?.title || 'Training Track';

    return (
        <div className="bg-gradient-to-r from-primary to-ocean rounded-2xl p-6 md:p-8 text-white shadow-lg">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Your Next Step</p>
                    <h2 className="text-xl md:text-2xl font-bold mb-2">{module.title}</h2>
                    <p className="text-sm text-white/80 mb-1">{trackTitle}</p>
                    {module.description && (
                        <p className="text-sm text-white/60 mb-4 line-clamp-2">{module.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-white/60 mb-4">
                        <span className="flex items-center gap-1">
                            <IoVideocamOutline size={14} />
                            {progress.videoWatched ? 'Video watched' : 'Video pending'}
                        </span>
                        {progress.attempts > 0 && (
                            <span>Quiz attempted {progress.attempts} time{progress.attempts > 1 ? 's' : ''}</span>
                        )}
                    </div>
                    <button
                        onClick={onStartLearning}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-colors shadow-md"
                    >
                        <IoPlayOutline size={18} />
                        Continue Learning
                    </button>
                </div>
                <div className="hidden md:block ml-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
                        <IoPlayOutline size={40} className="text-white/60" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NextStepCard;
