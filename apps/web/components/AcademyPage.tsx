import React, { useState } from 'react';
import { usePermissions } from '../src/hooks/usePermissions';
import AcademyStudio from './academy/AcademyStudio';
import AcademyPortal from './academy/AcademyPortal';
import { IoSchoolOutline } from 'react-icons/io5';

type AcademyView = 'STUDIO' | 'PORTAL';

const AcademyPage: React.FC = () => {
    const { isAdmin, isSuperAdmin } = usePermissions();
    const isManager = isAdmin() || isSuperAdmin();

    const [view, setView] = useState<AcademyView>('STUDIO');

    // Non-admin users see a message directing them to their Serve Team
    if (!isManager) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D2] p-12 text-center">
                    <div className="w-16 h-16 bg-[#FAF8F4] rounded-full flex items-center justify-center mx-auto mb-4">
                        <IoSchoolOutline size={32} className="text-[#14213D]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[#14213D] mb-2">
                        Training Has Moved
                    </h2>
                    <p className="text-[#6B6960] max-w-md mx-auto text-sm">
                        Your training and learning content is now available in your Serve Team.
                        Navigate to your team and open the <strong className="text-[#1F2D52]">Training</strong> tab to access
                        your assigned courses and track your progress.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* View Toggle for Admins */}
            <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-[#EFEBE0] p-1 rounded-lg">
                    <button
                        onClick={() => setView('STUDIO')}
                        className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                            view === 'STUDIO'
                                ? 'bg-white text-[#14213D] shadow-sm'
                                : 'text-[#6B6960] hover:text-[#1F2D52]'
                        }`}
                    >
                        Studio
                    </button>
                    <button
                        onClick={() => setView('PORTAL')}
                        className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                            view === 'PORTAL'
                                ? 'bg-white text-[#14213D] shadow-sm'
                                : 'text-[#6B6960] hover:text-[#1F2D52]'
                        }`}
                    >
                        My Learning
                    </button>
                </div>
            </div>

            {view === 'STUDIO' ? (
                <AcademyStudio />
            ) : (
                <AcademyPortal />
            )}
        </div>
    );
};

export default AcademyPage;
