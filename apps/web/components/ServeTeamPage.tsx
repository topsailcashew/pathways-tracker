import React from 'react';
import { IoHeartOutline } from 'react-icons/io5';

const ServeTeamPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Serve Team</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <IoHeartOutline size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h2>
          <p className="text-gray-500 max-w-md">
            The Serve Team page is under development. Check back soon for team management features.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServeTeamPage;
