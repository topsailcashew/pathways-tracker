import React, { useState } from 'react';
import { usePermissions } from '../src/hooks/usePermissions';
import { Permission } from '../src/utils/permissions';
import AcademyStudio from './academy/AcademyStudio';
import AcademyPortal from './academy/AcademyPortal';

type AcademyView = 'STUDIO' | 'PORTAL';

const AcademyPage: React.FC = () => {
    const { can, isAdmin, isSuperAdmin } = usePermissions();
    const isManager = isAdmin() || isSuperAdmin();

    const [view, setView] = useState<AcademyView>(isManager ? 'STUDIO' : 'PORTAL');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* View Toggle for Admins */}
            {isManager && (
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
            )}

            {view === 'STUDIO' && isManager ? (
                <AcademyStudio />
            ) : (
                <AcademyPortal />
            )}
        </div>
    );
};

export default AcademyPage;
