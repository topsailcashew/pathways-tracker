import React, { useState } from 'react';
import { usePermissions } from '../src/hooks/usePermissions';
import { Permission } from '../src/utils/permissions';
import AcademyStudio from './academy/AcademyStudio';
import AcademyPortal from './academy/AcademyPortal';
import { IoSchoolOutline } from 'react-icons/io5';

type AcademyView = 'STUDIO' | 'PORTAL';

const AcademyPage: React.FC = () => {
    const { can, isAdmin, isSuperAdmin } = usePermissions();
    const isManager = isAdmin() || isSuperAdmin();

    const [view, setView] = useState<AcademyView>('STUDIO');

    // Non-admin users see a message directing them to their Serve Team
    if (!isManager) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IoSchoolOutline size={32} className="text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">
                        Training Has Moved
                    </h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Your training and learning content is now available in your Serve Team.
                        Navigate to your team and open the <strong>Training</strong> tab to access
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
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setView('STUDIO')}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                            view === 'STUDIO'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Studio
                    </button>
                    <button
                        onClick={() => setView('PORTAL')}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                            view === 'PORTAL'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
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
