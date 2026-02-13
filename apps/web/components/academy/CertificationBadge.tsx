import React from 'react';
import { IoRibbonOutline } from 'react-icons/io5';

interface CertificationBadgeProps {
    trackTitle: string;
    completedAt: string;
}

const CertificationBadge: React.FC<CertificationBadgeProps> = ({ trackTitle, completedAt }) => {
    return (
        <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                <IoRibbonOutline size={20} className="text-yellow-600" />
            </div>
            <div>
                <p className="text-sm font-bold text-gray-800">{trackTitle}</p>
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
                    Ready for Stage &middot; {new Date(completedAt).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
};

export default CertificationBadge;
